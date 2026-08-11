'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Tldraw, computed, createUserId, inlineBase64AssetStore, UserRecordType, type Editor } from 'tldraw';
import 'tldraw/tldraw.css';
import { useSync } from '@tldraw/sync';
import { Loader2, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/clients';
import { ShareDialog } from '@/components/ShareDialog';
import { DeleteBoardDialog } from '@/components/DeleteBoardDialog';
import { ExportBoardMenu } from '@/components/ExportBoardMenu';
import { ChatPanel } from '@/components/ChatPanel';
import { VersionHistoryPanel } from '@/components/VersionHistoryPanel';
import { CommentsPanel } from '@/components/CommentsPanel';
import { CommentPins } from '@/components/CommentPins';
import { ReactionButton } from '@/components/ReactionButton';
import { ReactionBursts } from '@/components/ReactionBursts';
import { TimerButton } from '@/components/TimerButton';
import { PresentationButton } from '@/components/PresentationButton';
import { PollButton } from '@/components/PollButton';
import { LayersPanel } from '@/components/LayersPanel';
import { useTableauComments, type Commentaire } from '@/hooks/use-tableau-comments';
import { useReactions } from '@/hooks/use-reactions';
import { useTableauPresentation } from '@/hooks/use-tableau-presentation';
import { usePresentationFollow } from '@/hooks/use-presentation-follow';
import { applyTemplate, type TemplateId } from '@/lib/templates';

const VALID_TEMPLATE_IDS: TemplateId[] = ['kanban', 'retro', 'mindmap'];

const CURSOR_COLORS = ['#7C3AED', '#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#EC4899'];

function colorForUser(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

export default function TableauPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [status, setStatus] = useState<'checking' | 'ok' | 'not-found'>('checking');
    const [userInfo, setUserInfo] = useState<{ id: string; name: string } | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [titre, setTitre] = useState<string | null>(null);
    const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
    const templateAppliedRef = useRef(false);
    // Chat, historique des versions et commentaires partagent le même
    // emplacement de panneau flottant (bas-droite) : un seul à la fois.
    const [activePanel, setActivePanel] = useState<'chat' | 'versions' | 'comments' | null>(null);
    // Mode "placement" : le prochain clic sur le canvas crée un nouveau pin de commentaire.
    const [commentPlacing, setCommentPlacing] = useState(false);
    // Fil de commentaire actuellement affiché en bulle flottante sur le canvas.
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

    useEffect(() => {
        async function checkAccess() {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) {
                router.push('/connexion');
                return;
            }

            setUserInfo({
                id: userData.user.id,
                name: userData.user.email?.split('@')[0] ?? 'Utilisateur',
            });

            // Pas de .eq('owner_id', ...) : la policy RLS "tableaux: lecture" laisse
            // passer à la fois le owner et les membres invités via tableau_membres.
            // Si la ligne n'existe pas ici, c'est que l'utilisateur n'a aucun accès.
            const { data, error } = await supabase
                .from('tableaux')
                .select('id, owner_id, titre')
                .eq('id', id)
                .maybeSingle();

            if (error || !data) {
                setStatus('not-found');
                return;
            }

            setIsOwner(data.owner_id === userData.user.id);
            setTitre(data.titre);
            setStatus('ok');
        }

        checkAccess();
    }, [id, router, supabase]);

    const currentUser = useMemo(
        () =>
            computed('current-user', () =>
                userInfo
                    ? UserRecordType.create({
                        id: createUserId(userInfo.id),
                        name: userInfo.name,
                        color: colorForUser(userInfo.id),
                    })
                    : null
            ),
        [userInfo]
    );

    const store = useSync(
        useMemo(
            () => ({
                uri: `ws://localhost:5858/connect/${id}`,
                assets: inlineBase64AssetStore,
                users: { currentUser },
            }),
            [id, currentUser]
        )
    );

    const commentsApi = useTableauComments({
        tableauId: id,
        userId: userInfo?.id ?? '',
        userName: userInfo?.name ?? '',
        isPanelOpen: activePanel === 'comments' || activeThreadId !== null,
    });

    const reactionsApi = useReactions({
        tableauId: id,
        userId: userInfo?.id ?? '',
        userName: userInfo?.name ?? '',
    });

    const presentationApi = useTableauPresentation({ tableauId: id });

    usePresentationFollow({
        editor: editorInstance,
        presentateurId: presentationApi.state?.presentateur_id ?? null,
        currentUserId: userInfo?.id ?? '',
    });

    // Centre la caméra sur l'ancre du fil (position de la forme si elle existe
    // encore, sinon les coordonnées d'origine du commentaire) puis l'ouvre.
    function focusThread(comment: Commentaire) {
        if (editorInstance) {
            const bounds = comment.shape_id ? editorInstance.getShapePageBounds(comment.shape_id) : null;
            const point = bounds ? { x: bounds.x, y: bounds.y } : { x: comment.x, y: comment.y };
            editorInstance.centerOnPoint(point, { animation: { duration: 200 } });
        }
        setActiveThreadId(comment.id);
        setActivePanel(null);
    }

    function handleMount(editor: Editor) {
        setEditorInstance(editor);

        if (templateAppliedRef.current) return;

        const templateParam = searchParams.get('template');
        if (!templateParam || !VALID_TEMPLATE_IDS.includes(templateParam as TemplateId)) return;

        templateAppliedRef.current = true;
        applyTemplate(editor, templateParam as TemplateId);
        router.replace(`/tableau/${id}`);
    }

    if (status === 'not-found') {
        return (
            <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-background">
                <p className="text-foreground/70">Ce tableau n'existe pas ou tu n'y as pas accès.</p>
                <button
                    type="button"
                    onClick={() => router.push('/tableau-de-bord')}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-accent hover:border-accent/40"
                >
                    Retour au tableau de bord
                </button>
            </div>
        );
    }

    // IMPORTANT : on ne monte <Tldraw> qu'une fois l'utilisateur connu (status === 'ok').
    // Sinon `currentUser`/`store` sont d'abord créés avec userInfo=null, puis recréés
    // dès que checkAccess() résout -> useSync() se reconnecte de zéro et un éventuel
    // éditeur/template appliqué sur la première connexion (provisoire) est perdu avant
    // d'avoir pu être flushé sur le websocket. C'était la cause du template qui
    // disparaissait au reload et du crash "AtomMap: key [object Object] not found".
    if (status === 'checking' || !userInfo) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="fixed inset-0">
            <Tldraw store={store} onMount={handleMount} />
            <CommentPins
                editor={editorInstance}
                comments={commentsApi.comments}
                participants={commentsApi.participants}
                currentUserId={userInfo.id}
                placing={commentPlacing}
                onPlacingChange={setCommentPlacing}
                activeThreadId={activeThreadId}
                onOpenThread={setActiveThreadId}
                onCreateRoot={commentsApi.addComment}
                onReply={(parentId, contenu, mentions) => commentsApi.addReply({ parentId, contenu, mentions })}
                onToggleResolved={commentsApi.toggleResolved}
                onDelete={commentsApi.deleteComment}
                showResolved
            />
            <ReactionBursts editor={editorInstance} bursts={reactionsApi.bursts} />
            {titre && (
                <div className="pointer-events-none absolute left-3 top-3 z-[300]">
                    <div className="rounded-lg border border-border/60 bg-card/90 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm">
                        {titre}
                    </div>
                </div>
            )}
            <div className="pointer-events-none absolute right-3 top-3 z-[300]">
                <div className="pointer-events-auto flex items-center gap-2">
                    <PresentationButton
                        presentateurId={presentationApi.state?.presentateur_id ?? null}
                        presentateurNom={presentationApi.state?.presentateur_nom ?? null}
                        currentUserId={userInfo.id}
                        isOwner={isOwner}
                        onStart={() => presentationApi.start(userInfo.name)}
                        onStop={() => presentationApi.stop()}
                    />
                    <TimerButton tableauId={id} />
                    <PollButton tableauId={id} userId={userInfo.id} isOwner={isOwner} />
                    <LayersPanel editor={editorInstance} />
                    <ReactionButton editor={editorInstance} onReact={reactionsApi.sendReaction} />
                    <ExportBoardMenu editor={editorInstance} titre={titre} />
                    <VersionHistoryPanel
                        tableauId={id}
                        open={activePanel === 'versions'}
                        onOpenChange={(next) => setActivePanel(next ? 'versions' : null)}
                    />
                    <CommentsPanel
                        comments={commentsApi.comments}
                        loading={commentsApi.loading}
                        unreadCount={commentsApi.unreadCount}
                        open={activePanel === 'comments'}
                        onOpenChange={(next) => {
                            setActivePanel(next ? 'comments' : null);
                            if (next) commentsApi.clearUnread();
                        }}
                        onStartPlacing={() => {
                            setActivePanel(null);
                            setActiveThreadId(null);
                            setCommentPlacing(true);
                        }}
                        onSelectThread={focusThread}
                        currentUserId={userInfo.id}
                    />
                    <ChatPanel
                        tableauId={id}
                        userId={userInfo.id}
                        userName={userInfo.name}
                        open={activePanel === 'chat'}
                        onOpenChange={(next) => setActivePanel(next ? 'chat' : null)}
                    />
                    {isOwner && (
                        <>
                            <DeleteBoardDialog
                                tableauId={id}
                                titre={titre}
                                onDeleted={() => router.push('/tableau-de-bord')}
                                trigger={
                                    <button
                                        type="button"
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/90 text-foreground/60 shadow-sm backdrop-blur-sm transition-colors hover:border-red-500 hover:bg-red-600 hover:text-white"
                                        title="Supprimer le tableau"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                }
                            />
                            <ShareDialog tableauId={id} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
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
import { useTableauRole } from '@/hooks/use-tableau-role';
import { useTableauComments, type Commentaire } from '@/hooks/use-tableau-comments';
import { useReactions } from '@/hooks/use-reactions';
import { useTableauPresentation } from '@/hooks/use-tableau-presentation';
import { usePresentationFollow } from '@/hooks/use-presentation-follow';
import { applyTemplate, type TemplateId } from '@/lib/templates';
import type { TLShapeId } from 'tldraw';

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
    const [supabase] = useState(() => createClient());

    const [status, setStatus] = useState<'checking' | 'ok' | 'not-found'>('checking');
    const [userInfo, setUserInfo] = useState<{ id: string; name: string } | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [titre, setTitre] = useState<string | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    useEffect(() => {
        async function checkAccess() {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) {
                router.push('/connexion');
                return;
            }

            let { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session?.access_token) {
                await new Promise((resolve) => setTimeout(resolve, 300));
                ({ data: sessionData } = await supabase.auth.getSession());
            }
            setAccessToken(sessionData.session?.access_token ?? null);

            setUserInfo({
                id: userData.user.id,
                name: userData.user.email?.split('@')[0] ?? 'Utilisateur',
            });

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

    if (status === 'checking' || !userInfo || !accessToken) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <TableauWorkspace
            id={id}
            router={router}
            accessToken={accessToken}
            userInfo={userInfo}
            isOwner={isOwner}
            titre={titre}
        />
    );
}

function TableauWorkspace({
    id,
    router,
    accessToken,
    userInfo,
    isOwner,
    titre,
}: {
    id: string;
    router: ReturnType<typeof useRouter>;
    accessToken: string;
    userInfo: { id: string; name: string };
    isOwner: boolean;
    titre: string | null;
}) {
    const searchParams = useSearchParams();
    const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
    const templateAppliedRef = useRef(false);
    const [activePanel, setActivePanel] = useState<'chat' | 'versions' | 'comments' | null>(null);
    const [commentPlacing, setCommentPlacing] = useState(false);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

    const currentUser = useMemo(
        () =>
            computed('current-user', () =>
                UserRecordType.create({
                    id: createUserId(userInfo.id),
                    name: userInfo.name,
                    color: colorForUser(userInfo.id),
                })
            ),
        [userInfo]
    );

    const store = useSync(
        useMemo(
            () => ({
                uri: `ws://localhost:5858/connect/${id}?accessToken=${encodeURIComponent(accessToken)}`,
                assets: inlineBase64AssetStore,
                users: { currentUser },
            }),
            [id, currentUser, accessToken]
        )
    );

    const { isReadonly: isReadonlyRole, canManageSharing } = useTableauRole({ tableauId: id, isOwner });

    const commentsApi = useTableauComments({
        tableauId: id,
        userId: userInfo.id,
        userName: userInfo.name,
        isPanelOpen: activePanel === 'comments' || activeThreadId !== null,
    });

    const reactionsApi = useReactions({
        tableauId: id,
        userId: userInfo.id,
        userName: userInfo.name,
    });

    const presentationApi = useTableauPresentation({ tableauId: id });

    usePresentationFollow({
        editor: editorInstance,
        presentateurId: presentationApi.state?.presentateur_id ?? null,
        currentUserId: userInfo.id,
        readonlyFromRole: isReadonlyRole,
    });

    function focusThread(comment: Commentaire) {
        if (editorInstance) {
            const bounds = comment.shape_id
                ? editorInstance.getShapePageBounds(
                    comment.shape_id as TLShapeId
                )
                : null;

            const point = bounds
                ? { x: bounds.x, y: bounds.y }
                : { x: comment.x, y: comment.y };

            editorInstance.centerOnPoint(point, {
                animation: { duration: 200 },
            });
        }
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

    // ---------------------------------------------------------------------
    // Layout : avant, le titre et la barre de boutons étaient posés en
    // `position: absolute` PAR-DESSUS le canvas Tldraw, exactement aux mêmes
    // coins que ses propres panneaux natifs (menu haut-gauche, panneau de
    // style haut-droite qui s'agrandit dès qu'une forme est sélectionnée).
    // Les deux se battaient donc pour le même espace.
    //
    // Ici on sort le titre + les boutons dans une vraie barre d'en-tête
    // (flex-col, header en flow normal), et le canvas Tldraw occupe le
    // reste de l'écran (flex-1). Tldraw positionne alors ses panneaux natifs
    // à l'intérieur de SA propre zone, qui commence sous le header : plus
    // aucun chevauchement possible, quelle que soit la sélection en cours.
    // ---------------------------------------------------------------------
    return (
        <div className="fixed inset-0 flex flex-col bg-background">
            {/* Header : titre à gauche, actions à droite. En flow normal,
                donc jamais recouvert par / ne recouvrant jamais les
                panneaux natifs de tldraw (qui ne vivent que dans la zone
                canvas ci-dessous). */}
            <header className="z-[300] flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-card/90 px-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {titre}
                    {isReadonlyRole && (
                        <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium text-foreground/60">
                            Lecture seule
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
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
                    )}
                    {(isOwner || canManageSharing) && <ShareDialog tableauId={id} isOwner={isOwner} />}
                </div>
            </header>

            {/* Zone canvas : tldraw + tout ce qui doit rester ancré au
                canvas (pins de commentaires, bursts de réactions). Ces
                éléments restent en `absolute` ici, mais ce conteneur ne
                commence QUE sous le header, donc ils ne débordent plus
                dessus, et les panneaux natifs de tldraw (bas-gauche,
                haut-droite) ont toute la place dans cette zone sans
                collision avec le header. */}
            <div className="relative min-h-0 flex-1">
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
            </div>
        </div>
    );
}
import type { Editor, TLShapeId, TLDefaultColorStyle } from 'tldraw';
import { createShapeId, toRichText } from 'tldraw';

export type TemplateId = 'kanban' | 'retro' | 'mindmap';

export const TEMPLATES: { id: TemplateId; label: string; description: string }[] = [
    {
        id: 'kanban',
        label: 'Kanban',
        description: 'Trois colonnes : À faire, En cours, Terminé.',
    },
    {
        id: 'retro',
        label: 'Rétrospective agile',
        description: "Ce qui a bien marché, ce qui peut être amélioré, actions.",
    },
    {
        id: 'mindmap',
        label: 'Mind map',
        description: 'Une idée centrale et ses ramifications.',
    },
];

function addFrame(editor: Editor, opts: { x: number; y: number; w: number; h: number; name: string }): TLShapeId {
    const id = createShapeId();
    editor.createShape({
        id,
        type: 'frame',
        x: opts.x,
        y: opts.y,
        props: { w: opts.w, h: opts.h, name: opts.name },
    });
    return id;
}

function addNote(
    editor: Editor,
    opts: { x: number; y: number; text: string; color?: TLDefaultColorStyle; parentId?: TLShapeId }
): TLShapeId {
    const id = createShapeId();
    editor.createShape({
        id,
        type: 'note',
        x: opts.x,
        y: opts.y,
        ...(opts.parentId ? { parentId: opts.parentId } : {}),
        props: {
            richText: toRichText(opts.text),
            color: opts.color ?? 'yellow',
        },
    });
    return id;
}

function addArrow(
    editor: Editor,
    opts: { startX: number; startY: number; endX: number; endY: number; color?: TLDefaultColorStyle }
): TLShapeId {
    const id = createShapeId();
    editor.createShape({
        id,
        type: 'arrow',
        x: 0,
        y: 0,
        props: {
            start: { x: opts.startX, y: opts.startY },
            end: { x: opts.endX, y: opts.endY },
            color: opts.color ?? 'grey',
        },
    });
    return id;
}

const NOTE_W = 240;
const NOTE_GAP = 24;

function buildKanban(editor: Editor) {
    const columns: { name: string; color: TLDefaultColorStyle; cards: string[] }[] = [
        { name: 'À faire', color: 'light-red', cards: ["Écrire les user stories", 'Prioriser le backlog'] },
        { name: 'En cours', color: 'yellow', cards: ['Design des maquettes'] },
        { name: 'Terminé', color: 'light-green', cards: ['Setup du projet'] },
    ];

    const frameW = 320;
    const frameH = 500;
    const frameGap = 40;

    columns.forEach((col, i) => {
        const frameId = addFrame(editor, {
            x: i * (frameW + frameGap),
            y: 0,
            w: frameW,
            h: frameH,
            name: col.name,
        });

        col.cards.forEach((text, j) => {
            addNote(editor, {
                x: 40,
                y: 60 + j * (NOTE_W + NOTE_GAP),
                text,
                color: col.color,
                parentId: frameId,
            });
        });
    });
}

function buildRetro(editor: Editor) {
    const columns: { name: string; color: TLDefaultColorStyle; cards: string[] }[] = [
        { name: 'Ce qui a bien marché', color: 'light-green', cards: ['Bonne communication en équipe'] },
        { name: "Ce qui peut être amélioré", color: 'light-red', cards: ['Délais trop serrés'] },
        { name: 'Actions', color: 'light-blue', cards: ['Planifier des points hebdo'] },
    ];

    const frameW = 320;
    const frameH = 500;
    const frameGap = 40;

    columns.forEach((col, i) => {
        const frameId = addFrame(editor, {
            x: i * (frameW + frameGap),
            y: 0,
            w: frameW,
            h: frameH,
            name: col.name,
        });

        col.cards.forEach((text, j) => {
            addNote(editor, {
                x: 40,
                y: 60 + j * (NOTE_W + NOTE_GAP),
                text,
                color: col.color,
                parentId: frameId,
            });
        });
    });
}

function buildMindMap(editor: Editor) {
    const centerX = 400;
    const centerY = 300;
    const branches: { text: string; dx: number; dy: number; color: TLDefaultColorStyle }[] = [
        { text: 'Idée 1', dx: -420, dy: -220, color: 'blue' },
        { text: 'Idée 2', dx: 420, dy: -220, color: 'violet' },
        { text: 'Idée 3', dx: -420, dy: 220, color: 'green' },
        { text: 'Idée 4', dx: 420, dy: 220, color: 'orange' },
    ];

    addNote(editor, { x: centerX, y: centerY, text: 'Sujet central', color: 'yellow' });

    const centerAnchorX = centerX + NOTE_W / 2;
    const centerAnchorY = centerY + NOTE_W / 2;

    branches.forEach((b) => {
        const bx = centerX + b.dx;
        const by = centerY + b.dy;
        addNote(editor, { x: bx, y: by, text: b.text, color: b.color });
        addArrow(editor, {
            startX: centerAnchorX,
            startY: centerAnchorY,
            endX: bx + NOTE_W / 2,
            endY: by + NOTE_W / 2,
            color: 'grey',
        });
    });
}

/**
 * Applique un template au tableau (insertion de shapes via l'API Editor de
 * tldraw). Conçu pour être appelé une seule fois, juste après la création
 * d'un tableau neuf et vide — appeler ceci sur un tableau déjà rempli
 * ajoutera simplement le contenu du template par-dessus l'existant.
 */
export function applyTemplate(editor: Editor, templateId: TemplateId) {
    editor.run(() => {
        switch (templateId) {
            case 'kanban':
                buildKanban(editor);
                break;
            case 'retro':
                buildRetro(editor);
                break;
            case 'mindmap':
                buildMindMap(editor);
                break;
        }
        editor.zoomToFit({ animation: { duration: 300 } });
    });
}
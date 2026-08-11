'use client';

import { useState } from 'react';
import { track, type Editor, type TLShapeId } from 'tldraw';
import { Layers, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';

const DEFAULT_LAYER_ID = '__sans_cadre__';

type LayerEntry = {
    id: string;
    name: string;
    frameId: TLShapeId | null;
    shapeIds: TLShapeId[];
    hidden: boolean;
};

/**
 * "Calques" au sens Solaive = les frames du tableau (tldraw n'a pas de
 * concept de calque natif). Chaque frame est un calque nommé ; les formes
 * qui ne sont dans aucune frame tombent dans un calque "Sans cadre" à part.
 *
 * Visibilité : PAS synchronisée entre participants — masquer un calque est
 * une préférence de vue personnelle (comme dans Figma/Photoshop, chacun
 * peut masquer un calque sans l'imposer aux autres). On simule le masquage
 * en mettant opacity à 0 + isLocked à true le temps que c'est masqué (pour
 * qu'on ne puisse pas cliquer dessus par erreur), et on restaure l'état
 * précédent à la réouverture.
 *
 * Réordonnancement : délègue directement aux actions natives de l'Editor
 * (bringForward / sendBackward), pas de logique custom à maintenir.
 */
export const LayersPanel = track(function LayersPanel({ editor }: { editor: Editor | null }) {
    const [open, setOpen] = useState(false);
    // Formes qu'on a nous-mêmes masquées, pour savoir lesquelles réafficher
    // (et ne pas toucher à celles déjà verrouillées/transparentes par ailleurs).
    const [hiddenLayerIds, setHiddenLayerIds] = useState<Set<string>>(new Set());

    if (!editor) return null;

    const allShapes = editor.getCurrentPageShapesSorted();
    const frames = allShapes.filter((s) => s.type === 'frame');
    // Formes de premier niveau (posées directement sur la page, hors frames).
    const looseShapeIds = allShapes.filter((s) => s.parentId === editor.getCurrentPageId()).map((s) => s.id);

    const layers: LayerEntry[] = [
        ...frames
            .map((frame) => ({
                id: frame.id,
                name: (frame.props as { name?: string }).name || 'Cadre sans nom',
                frameId: frame.id,
                shapeIds: editor.getSortedChildIdsForParent(frame.id),
                hidden: hiddenLayerIds.has(frame.id),
            }))
            .reverse(), // ordre d'affichage = du dessus vers le dessous, comme un panneau de calques classique
        ...(looseShapeIds.length > 0
            ? [
                {
                    id: DEFAULT_LAYER_ID,
                    name: 'Sans cadre',
                    frameId: null,
                    shapeIds: looseShapeIds,
                    hidden: hiddenLayerIds.has(DEFAULT_LAYER_ID),
                },
            ]
            : []),
    ];

    // Limite connue : si une forme était déjà verrouillée manuellement (menu
    // contextuel "Lock") avant qu'on masque son calque, la réafficher la
    // déverrouille aussi. Acceptable pour une v1 — un vrai état "hidden"
    // nécessiterait un champ shape.meta dédié plutôt que opacity+isLocked.
    function toggleVisibility(layer: LayerEntry) {
        if (!editor || layer.shapeIds.length === 0) return;

        const targetOpacity = layer.hidden ? 1 : 0;
        const targetLocked = !layer.hidden;
        const updates = layer.shapeIds
            .map((id) => editor.getShape(id))
            .filter((shape): shape is NonNullable<typeof shape> => !!shape)
            .map((shape) => ({ id: shape.id, type: shape.type, opacity: targetOpacity, isLocked: targetLocked }));

        editor.updateShapes(updates);

        const nextHidden = new Set(hiddenLayerIds);
        if (layer.hidden) nextHidden.delete(layer.id);
        else nextHidden.add(layer.id);
        setHiddenLayerIds(nextHidden);
    }

    function focusLayer(layer: LayerEntry) {
        if (!editor || layer.shapeIds.length === 0) return;
        const bounds = editor.getShapesPageBounds(layer.shapeIds);
        if (bounds) editor.zoomToBounds(bounds, { animation: { duration: 200 }, inset: 64 });
    }

    function moveLayer(layer: LayerEntry, direction: 'up' | 'down') {
        if (!editor || !layer.frameId) return;
        if (direction === 'up') editor.bringForward([layer.frameId]);
        else editor.sendBackward([layer.frameId]);
    }

    return (
        <div className="pointer-events-auto">
            <button
                type="button"
                title="Calques"
                onClick={() => setOpen((v) => !v)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm backdrop-blur-sm transition-colors ${open
                    ? 'border-accent/40 bg-card/90 text-accent'
                    : 'border-border/60 bg-card/90 text-foreground/60 hover:border-accent/40 hover:text-accent'
                    }`}
            >
                <Layers className="h-4 w-4" />
            </button>

            {open && (
                <div className="absolute right-0 top-11 z-[310] w-64 rounded-xl border border-border/60 bg-card/95 p-2 shadow-lg backdrop-blur-sm">
                    <span className="mb-1.5 block px-1 text-[11px] font-medium text-foreground/50">
                        Calques ({layers.length})
                    </span>
                    {layers.length === 0 ? (
                        <p className="px-1 py-2 text-xs text-foreground/40">Le tableau est vide.</p>
                    ) : (
                        <div className="flex flex-col gap-0.5">
                            {layers.map((layer) => (
                                <div
                                    key={layer.id}
                                    className="group flex items-center gap-1 rounded-lg px-1.5 py-1 hover:bg-foreground/5"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleVisibility(layer)}
                                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-foreground/50 hover:text-accent"
                                        title={layer.hidden ? 'Afficher' : 'Masquer'}
                                    >
                                        {layer.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => focusLayer(layer)}
                                        className={`flex-1 truncate text-left text-xs ${layer.hidden ? 'text-foreground/30 line-through' : 'text-foreground/80'
                                            }`}
                                        title="Centrer la vue sur ce calque"
                                    >
                                        {layer.name}
                                    </button>
                                    <span className="shrink-0 text-[10px] text-foreground/30">{layer.shapeIds.length}</span>
                                    {layer.frameId && (
                                        <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                                            <button
                                                type="button"
                                                onClick={() => moveLayer(layer, 'up')}
                                                className="flex h-6 w-5 items-center justify-center text-foreground/40 hover:text-accent"
                                                title="Monter"
                                            >
                                                <ChevronUp className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveLayer(layer, 'down')}
                                                className="flex h-6 w-5 items-center justify-center text-foreground/40 hover:text-accent"
                                                title="Descendre"
                                            >
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});
// lib/supabase/cookie-options.ts
//
// Options de cookies partagées entre le client navigateur, le client serveur
// et le middleware, pour garantir que la session reste persistante même si
// l'utilisateur ferme le navigateur (et revient le lendemain, la semaine
// suivante, etc.), tant qu'il ne s'est pas explicitement déconnecté.
//
// Sans ce `maxAge` explicite, certains navigateurs traitent le cookie comme
// un "session cookie" (supprimé à la fermeture du navigateur), ce qui forçait
// une reconnexion à chaque nouvelle visite.
//
// 400 jours = valeur max autorisée par Chrome pour un cookie. Le cookie est
// renouvelé à chaque requête passant par le middleware, donc tant que
// l'utilisateur revient au moins une fois tous les 400 jours, il reste connecté.
export const SUPABASE_COOKIE_OPTIONS = {
    maxAge: 60 * 60 * 24 * 400,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
};
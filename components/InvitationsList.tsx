'use client';

import { useEffect, useState } from 'react';
import { Check, X, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/clients';

type Invitation = {
  tableau_id: string;
  invite_par_email: string;
  created_at: string;
};

export function InvitationsList({ onResolved }: { onResolved?: () => void }) {
  const supabase = createClient();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.rpc('lister_invitations_recues');
    if (!error) setInvitations(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function respond(tableauId: string, accepter: boolean) {
    setRespondingId(tableauId);
    const { error } = await supabase.rpc('repondre_invitation', {
      p_tableau_id: tableauId,
      p_accepter: accepter,
    });
    setRespondingId(null);

    if (error) {
      toast.error("Impossible de répondre à l'invitation.");
      return;
    }

    toast.success(accepter ? 'Invitation acceptée.' : 'Invitation refusée.');
    setInvitations((prev) => prev.filter((i) => i.tableau_id !== tableauId));
    onResolved?.();
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-2 py-3 text-sm text-foreground/50">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement…
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <p className="px-2 py-3 text-sm text-foreground/50">
        Aucune invitation en attente.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {invitations.map((inv) => (
        <li
          key={inv.tableau_id}
          className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card p-3 text-sm"
        >
          <div className="flex items-start gap-2">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p className="text-foreground/80">
              <span className="font-medium">{inv.invite_par_email}</span> t&apos;invite à
              collaborer sur un tableau.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => respond(inv.tableau_id, true)}
              disabled={respondingId === inv.tableau_id}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-2 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {respondingId === inv.tableau_id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Accepter
            </button>
            <button
              type="button"
              onClick={() => respond(inv.tableau_id, false)}
              disabled={respondingId === inv.tableau_id}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-red-300 hover:text-red-500 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Refuser
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function useInvitationsCount() {
  const supabase = createClient();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase.rpc('lister_invitations_recues');
      if (!cancelled && !error) setCount((data ?? []).length);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return count;
}

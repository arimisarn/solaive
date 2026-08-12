import { describe, expect, it } from 'vitest';
import { computePercentage, computeTally, findMyVote, type SondageVote } from '../sondage-utils';

const votes: SondageVote[] = [
    { sondage_id: 's1', user_id: 'u1', option_id: 'opt_1' },
    { sondage_id: 's1', user_id: 'u2', option_id: 'opt_1' },
    { sondage_id: 's1', user_id: 'u3', option_id: 'opt_2' },
];

describe('computeTally', () => {
    it('compte les votes par option', () => {
        expect(computeTally(votes)).toEqual({ opt_1: 2, opt_2: 1 });
    });

    it('renvoie un objet vide sans votes', () => {
        expect(computeTally([])).toEqual({});
    });
});

describe('findMyVote', () => {
    it("trouve l'option votée par l'utilisateur donné", () => {
        expect(findMyVote(votes, 'u3')).toBe('opt_2');
    });

    it("renvoie null si l'utilisateur n'a pas voté", () => {
        expect(findMyVote(votes, 'u-inconnu')).toBeNull();
    });
});

describe('computePercentage', () => {
    it('calcule un pourcentage arrondi', () => {
        expect(computePercentage(2, 3)).toBe(67);
    });

    it("renvoie 0 plutôt que NaN quand il n'y a aucun vote", () => {
        expect(computePercentage(0, 0)).toBe(0);
    });

    it('renvoie 100 quand toutes les voix vont à la même option', () => {
        expect(computePercentage(5, 5)).toBe(100);
    });
});
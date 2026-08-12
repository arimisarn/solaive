import { describe, expect, it } from 'vitest';
import { formatActiviteRelative } from '../date-utils';

const NOW = new Date('2026-08-12T12:00:00.000Z');

describe('formatActiviteRelative', () => {
    it('renvoie une chaîne vide si aucune date', () => {
        expect(formatActiviteRelative(null, NOW)).toBe('');
    });

    it("renvoie \"à l'instant\" pour moins d'une minute", () => {
        expect(formatActiviteRelative('2026-08-12T11:59:30.000Z', NOW)).toBe("à l'instant");
    });

    it('renvoie des minutes pour moins d\'une heure', () => {
        expect(formatActiviteRelative('2026-08-12T11:45:00.000Z', NOW)).toBe('il y a 15 min');
    });

    it('renvoie des heures pour moins de 24h', () => {
        expect(formatActiviteRelative('2026-08-12T09:00:00.000Z', NOW)).toBe('il y a 3 h');
    });

    it('renvoie "hier" pour un jour', () => {
        expect(formatActiviteRelative('2026-08-11T12:00:00.000Z', NOW)).toBe('hier');
    });

    it('renvoie des jours pour moins d\'une semaine', () => {
        expect(formatActiviteRelative('2026-08-09T12:00:00.000Z', NOW)).toBe('il y a 3 j');
    });

    it('renvoie des semaines pour moins d\'un mois', () => {
        expect(formatActiviteRelative('2026-07-29T12:00:00.000Z', NOW)).toBe('il y a 2 sem.');
    });

    it('renvoie une date formatée au-delà d\'un mois', () => {
        expect(formatActiviteRelative('2026-01-05T12:00:00.000Z', NOW)).toBe('5 janv. 2026');
    });
});

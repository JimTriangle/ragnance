'use strict';

/**
 * Source unique de vérité pour le calcul des occurrences des transactions récurrentes.
 *
 * Toutes les dates sont manipulées en UTC et ramenées au jour (minuit UTC), afin que
 * les listes, les totaux et les graphiques comptent exactement les mêmes échéances.
 *
 * Règles :
 *  - une occurrence dont le jour déborde du mois (le 31 en février, le 31 en avril…)
 *    est ramenée au dernier jour du mois au lieu d'être ignorée ;
 *  - `startDate` et `endDate` sont respectées au jour près, bornes incluses ;
 *  - une récurrente mensuelle/annuelle sans `dayOfMonth` retombe sur le jour de sa
 *    date de début plutôt que d'être silencieusement exclue.
 */

/** Ramène une valeur (chaîne DATEONLY, Date, timestamp) à minuit UTC. */
const toUtcDay = (value) => {
    if (value === null || value === undefined) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

/**
 * Formate une date en chaîne YYYY-MM-DD UTC, pour comparer avec les colonnes DATEONLY
 * sans dépendre du fuseau horaire du serveur.
 */
const toDateOnlyString = (value) => {
    const day = toUtcDay(value);
    return day ? day.toISOString().split('T')[0] : null;
};

/** Nombre de jours du mois (monthIndex : 0-11). */
const daysInUtcMonth = (year, monthIndex) => new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

/**
 * Date d'échéance dans un mois donné, en bornant le jour au dernier jour du mois.
 * Ex. : le 31 en février 2026 -> 28/02/2026.
 */
const resolveMonthlyOccurrence = (year, monthIndex, dayOfMonth) => {
    const day = Math.min(Math.max(dayOfMonth, 1), daysInUtcMonth(year, monthIndex));
    return new Date(Date.UTC(year, monthIndex, day));
};

/**
 * Liste les dates d'échéance d'une transaction récurrente à l'intérieur d'une période.
 * @returns {Date[]} dates à minuit UTC, triées par ordre croissant.
 */
const getRecurringOccurrenceDates = (tx, periodStart, periodEnd) => {
    if (!tx || !tx.startDate) return [];

    const txStart = toUtcDay(tx.startDate);
    const txEnd = toUtcDay(tx.endDate);
    const rangeStart = toUtcDay(periodStart);
    const rangeEnd = toUtcDay(periodEnd);
    if (!txStart || !rangeStart || !rangeEnd) return [];

    const from = txStart > rangeStart ? txStart : rangeStart;
    const to = txEnd && txEnd < rangeEnd ? txEnd : rangeEnd;
    if (from > to) return [];

    const occurrences = [];

    if (tx.frequency === 'weekly') {
        const targetDay = Number.isInteger(tx.dayOfWeek) ? tx.dayOfWeek : txStart.getUTCDay();
        const cursor = new Date(from);
        cursor.setUTCDate(cursor.getUTCDate() + ((targetDay - cursor.getUTCDay() + 7) % 7));
        while (cursor <= to) {
            occurrences.push(new Date(cursor));
            cursor.setUTCDate(cursor.getUTCDate() + 7);
        }
        return occurrences;
    }

    if (tx.frequency === 'monthly' || tx.frequency === 'yearly') {
        const day = tx.dayOfMonth || txStart.getUTCDate();

        if (tx.frequency === 'yearly') {
            const monthIndex = txStart.getUTCMonth();
            for (let year = from.getUTCFullYear(); year <= to.getUTCFullYear(); year++) {
                const occurrence = resolveMonthlyOccurrence(year, monthIndex, day);
                if (occurrence >= from && occurrence <= to) occurrences.push(occurrence);
            }
            return occurrences;
        }

        let year = from.getUTCFullYear();
        let monthIndex = from.getUTCMonth();
        while (year < to.getUTCFullYear() || (year === to.getUTCFullYear() && monthIndex <= to.getUTCMonth())) {
            const occurrence = resolveMonthlyOccurrence(year, monthIndex, day);
            if (occurrence >= from && occurrence <= to) occurrences.push(occurrence);
            monthIndex += 1;
            if (monthIndex > 11) {
                monthIndex = 0;
                year += 1;
            }
        }
        return occurrences;
    }

    return occurrences;
};

/**
 * Prochaine échéance d'une transaction récurrente à partir d'une date (incluse).
 * @param {object} tx
 * @param {Date|string} from
 * @param {number} [horizonDays] fenêtre de recherche, 400 jours par défaut (couvre l'annuel).
 * @returns {Date|null}
 */
const getNextRecurringOccurrence = (tx, from, horizonDays = 400) => {
    const start = toUtcDay(from);
    if (!start) return null;
    const horizon = new Date(start.getTime() + horizonDays * 24 * 60 * 60 * 1000);
    const [next] = getRecurringOccurrenceDates(tx, start, horizon);
    return next || null;
};

/** Nombre d'occurrences d'une transaction récurrente sur une période. */
const countRecurringOccurrences = (tx, periodStart, periodEnd) =>
    getRecurringOccurrenceDates(tx, periodStart, periodEnd).length;

/** Totaux revenus / dépenses d'un lot de transactions récurrentes sur une période. */
const sumRecurringTotals = (transactions, periodStart, periodEnd) => {
    let income = 0;
    let expense = 0;

    (transactions || []).forEach(tx => {
        const occurrences = countRecurringOccurrences(tx, periodStart, periodEnd);
        if (occurrences === 0) return;
        if (tx.type === 'income') income += occurrences * tx.amount;
        else expense += occurrences * tx.amount;
    });

    return { income, expense };
};

/** Total des dépenses récurrentes d'un lot sur une période. */
const sumRecurringExpenses = (transactions, periodStart, periodEnd) =>
    sumRecurringTotals(transactions, periodStart, periodEnd).expense;

/**
 * Développe un lot de récurrentes en occurrences individuelles, prêtes à être listées.
 * @returns {Array<{ transaction: object, date: Date }>}
 */
const expandRecurringOccurrences = (transactions, periodStart, periodEnd) => {
    const expanded = [];
    (transactions || []).forEach(tx => {
        getRecurringOccurrenceDates(tx, periodStart, periodEnd).forEach(date => {
            expanded.push({ transaction: tx, date });
        });
    });
    return expanded;
};

module.exports = {
    toUtcDay,
    toDateOnlyString,
    daysInUtcMonth,
    resolveMonthlyOccurrence,
    getRecurringOccurrenceDates,
    getNextRecurringOccurrence,
    countRecurringOccurrences,
    sumRecurringTotals,
    sumRecurringExpenses,
    expandRecurringOccurrences
};

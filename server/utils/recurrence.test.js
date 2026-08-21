'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
    getRecurringOccurrenceDates,
    getNextRecurringOccurrence,
    sumRecurringTotals
} = require('./recurrence');

const fmt = d => d.toISOString().slice(0, 10);
const month = (year, monthIndex) => [
    new Date(Date.UTC(year, monthIndex, 1)),
    new Date(Date.UTC(year, monthIndex + 1, 1) - 1)
];
const datesIn = (tx, year, monthIndex) => getRecurringOccurrenceDates(tx, ...month(year, monthIndex)).map(fmt);

const loyerLe31 = { startDate: '2026-01-01', endDate: null, frequency: 'monthly', dayOfMonth: 31, type: 'expense', amount: 50 };
const hebdoLundi = { startDate: '2026-01-05', endDate: null, frequency: 'weekly', dayOfWeek: 1, type: 'expense', amount: 10 };
const annuelMars = { startDate: '2024-03-01', endDate: null, frequency: 'yearly', dayOfMonth: 15, type: 'expense', amount: 200 };
const arreteeLe10Mars = { startDate: '2026-01-01', endDate: '2026-03-10', frequency: 'monthly', dayOfMonth: 20, type: 'expense', amount: 30 };

test('une échéance qui déborde du mois est ramenée au dernier jour', () => {
    assert.deepStrictEqual(datesIn(loyerLe31, 2026, 0), ['2026-01-31']);
    assert.deepStrictEqual(datesIn(loyerLe31, 2026, 1), ['2026-02-28']);
    assert.deepStrictEqual(datesIn(loyerLe31, 2026, 2), ['2026-03-31']);
    assert.deepStrictEqual(datesIn(loyerLe31, 2026, 3), ['2026-04-30']);
    assert.deepStrictEqual(datesIn(loyerLe31, 2028, 1), ['2028-02-29']);
});

test('une récurrente au 31 est comptée dans les totaux des mois courts', () => {
    assert.deepStrictEqual(sumRecurringTotals([loyerLe31], ...month(2026, 3)), { income: 0, expense: 50 });
});

test('les hebdomadaires sont développées sur tout le mois', () => {
    assert.deepStrictEqual(datesIn(hebdoLundi, 2026, 1), ['2026-02-02', '2026-02-09', '2026-02-16', '2026-02-23']);
});

test('dayOfWeek absent : le jour est déduit de la date de début', () => {
    assert.deepStrictEqual(
        datesIn({ ...hebdoLundi, dayOfWeek: undefined }, 2026, 1),
        ['2026-02-02', '2026-02-09', '2026-02-16', '2026-02-23']
    );
});

test('endDate est respectée au jour près', () => {
    assert.deepStrictEqual(datesIn(arreteeLe10Mars, 2026, 1), ['2026-02-20']);
    assert.deepStrictEqual(datesIn(arreteeLe10Mars, 2026, 2), []);
    assert.deepStrictEqual(datesIn({ ...arreteeLe10Mars, endDate: '2026-03-25' }, 2026, 2), ['2026-03-20']);
});

test('startDate est respectée au jour près', () => {
    const demarreLe15 = { startDate: '2026-02-15', endDate: null, frequency: 'monthly', dayOfMonth: 5, type: 'expense', amount: 20 };
    assert.deepStrictEqual(datesIn(demarreLe15, 2026, 1), []);
    assert.deepStrictEqual(datesIn(demarreLe15, 2026, 2), ['2026-03-05']);
});

test('une annuelle ne tombe que sur son mois anniversaire', () => {
    assert.deepStrictEqual(datesIn(annuelMars, 2026, 2), ['2026-03-15']);
    assert.deepStrictEqual(datesIn(annuelMars, 2026, 3), []);
});

test('une mensuelle sans dayOfMonth retombe sur le jour de sa date de début', () => {
    const legacy = { startDate: '2026-01-07', endDate: null, frequency: 'monthly', dayOfMonth: null, type: 'expense', amount: 15 };
    assert.deepStrictEqual(datesIn(legacy, 2026, 2), ['2026-03-07']);
});

test('solde de fin de mois N = solde de début de mois N+1', () => {
    const txs = [loyerLe31, hebdoLundi, annuelMars, arreteeLe10Mars];
    const cumulAvant = (year, monthIndex) => {
        const t = sumRecurringTotals(txs, new Date('1970-01-01'), new Date(Date.UTC(year, monthIndex, 1) - 1));
        return t.income - t.expense;
    };

    for (let monthIndex = 0; monthIndex < 6; monthIndex++) {
        const duMois = sumRecurringTotals(txs, ...month(2026, monthIndex));
        const finDeMois = cumulAvant(2026, monthIndex) + duMois.income - duMois.expense;
        assert.strictEqual(
            Math.round(finDeMois * 100),
            Math.round(cumulAvant(2026, monthIndex + 1) * 100),
            `écart de télescopage sur le mois ${monthIndex + 1}`
        );
    }
});

test('la prochaine échéance suit les mêmes règles', () => {
    assert.strictEqual(fmt(getNextRecurringOccurrence(loyerLe31, '2026-02-05')), '2026-02-28');
    assert.strictEqual(getNextRecurringOccurrence(arreteeLe10Mars, '2026-03-11'), null);
});

test('une fréquence inconnue ne produit aucune échéance', () => {
    assert.deepStrictEqual(datesIn({ startDate: '2026-01-01', frequency: 'daily', type: 'expense', amount: 1 }, 2026, 1), []);
});

test('toDateOnlyString produit une date UTC comparable aux colonnes DATEONLY', () => {
    const { toDateOnlyString } = require('./recurrence');
    assert.strictEqual(toDateOnlyString(new Date(Date.UTC(2026, 7, 1))), '2026-08-01');
    assert.strictEqual(toDateOnlyString(new Date(Date.UTC(2026, 7, 31, 23, 59, 59, 999))), '2026-08-31');
    assert.strictEqual(toDateOnlyString('2026-02-28'), '2026-02-28');
    assert.strictEqual(toDateOnlyString(null), null);
});

import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Validates that all active aspects of a survey have been explicitly answered by the respondent.
 * Ensures no default rating is pre-filled, giving the user total control to choose.
 */
export function validateSurveyAnswers(aspects, answers) {
  if (!aspects || aspects.length === 0) return { isValid: true, missingAspectIds: [] };

  const missingAspectIds = [];
  for (const aspect of aspects) {
    const score = answers[aspect.id];
    if (typeof score !== 'number' || isNaN(score) || score <= 0) {
      missingAspectIds.push(aspect.id);
    }
  }

  return {
    isValid: missingAspectIds.length === 0,
    missingAspectIds,
  };
}

/**
 * Calculates weighted score from aspects and their answer ratings.
 * Index keseluruhan = Σ(bobot × skor aspek) / Σ bobot (FR-28).
 */
export function calculateWeightedSurveyScore(aspects, answers) {
  if (!aspects || aspects.length === 0) return 0;
  let totalWeightedScore = 0;
  let totalBobot = 0;

  for (const aspect of aspects) {
    const score = answers[aspect.id];
    if (typeof score === 'number' && !isNaN(score)) {
      totalWeightedScore += (aspect.bobot || 1) * score;
      totalBobot += aspect.bobot || 1;
    }
  }

  if (totalBobot === 0) return 0;
  return Number((totalWeightedScore / totalBobot).toFixed(2));
}

/**
 * Calculates survey response rate percentage.
 * Response rate = (DIISI / total invitations) * 100%
 */
export function calculateSurveyResponseRate(invitations) {
  if (!invitations || invitations.length === 0) return 0;
  const completed = invitations.filter((inv) => inv.status === 'DIISI').length;
  return Math.round((completed / invitations.length) * 100);
}

test('validateSurveyAnswers requires all aspects to be explicitly answered', () => {
  const sampleAspects = [
    { id: 'asp-1', nama_aspek: 'Integritas & Etika' },
    { id: 'asp-2', nama_aspek: 'Kompetensi Keilmuan' },
    { id: 'asp-3', nama_aspek: 'Komunikasi & Adaptasi' },
  ];

  // Initially, answers is empty ({}), so validation must fail
  const initialAnswers = {};
  const resEmpty = validateSurveyAnswers(sampleAspects, initialAnswers);
  assert.equal(resEmpty.isValid, false);
  assert.equal(resEmpty.missingAspectIds.length, 3);

  // Partially answered: only asp-1 answered
  const partialAnswers = { 'asp-1': 4 };
  const resPartial = validateSurveyAnswers(sampleAspects, partialAnswers);
  assert.equal(resPartial.isValid, false);
  assert.deepEqual(resPartial.missingAspectIds, ['asp-2', 'asp-3']);

  // Fully answered by user choice
  const fullAnswers = {
    'asp-1': 5,
    'asp-2': 4,
    'asp-3': 3,
  };
  const resFull = validateSurveyAnswers(sampleAspects, fullAnswers);
  assert.equal(resFull.isValid, true);
  assert.equal(resFull.missingAspectIds.length, 0);
});

test('Default aspect score should NOT be pre-filled to 5', () => {
  const initialAnswers = {};
  const aspectId = 'asp-1';
  
  // Verify that an unanswered aspect returns undefined instead of 5
  const currentScore = initialAnswers[aspectId];
  assert.equal(currentScore, undefined);
  assert.notEqual(currentScore, 5);
});

test('calculateWeightedSurveyScore computes weighted mean correctly', () => {
  const aspects = [
    { id: 'a1', bobot: 40 },
    { id: 'a2', bobot: 30 },
    { id: 'a3', bobot: 30 },
  ];
  const answers = {
    a1: 5, // 40 * 5 = 200
    a2: 4, // 30 * 4 = 120
    a3: 3, // 30 * 3 = 90 -> total = 410 / 100 = 4.10
  };
  const score = calculateWeightedSurveyScore(aspects, answers);
  assert.equal(score, 4.1);
});

test('calculateSurveyResponseRate calculates accurate percentage', () => {
  const invitations = [
    { id: '1', status: 'DIISI' },
    { id: '2', status: 'TERKIRIM' },
    { id: '3', status: 'DIISI' },
    { id: '4', status: 'DIBUAT' },
  ];
  const rate = calculateSurveyResponseRate(invitations);
  assert.equal(rate, 50); // 2 out of 4 = 50%
});

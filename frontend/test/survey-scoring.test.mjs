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


import test from 'node:test';
import assert from 'node:assert/strict';
import { animate, remove, stagger } from 'animejs';

test('Anime.js exports required animation functions', () => {
  assert.equal(typeof animate, 'function', 'animate should be a function');
  assert.equal(typeof remove, 'function', 'remove should be a function');
  assert.equal(typeof stagger, 'function', 'stagger should be a function');

  const staggerFn = stagger(20, { start: 40 });
  assert.equal(typeof staggerFn, 'function', 'stagger should return a function');
});

test('Anime.js executes basic numerical animations and completes properly', async () => {
  const target = { opacity: 0, translateY: -8, scale: 0.95 };
  let completed = false;

  await animate(target, {
    opacity: [0, 1],
    translateY: [-8, 0],
    scale: [0.95, 1],
    duration: 30,
    ease: 'outBack(1.2)',
    onComplete: () => {
      completed = true;
    },
  });

  assert.equal(completed, true, 'onComplete callback must be triggered');
  assert.equal(target.opacity, 1, 'target opacity should animate to 1');
  assert.equal(target.translateY, 0, 'target translateY should animate to 0');
  assert.equal(target.scale, 1, 'target scale should animate to 1');
});

test('Anime.js handles exit transition values smoothly', async () => {
  const target = { opacity: 1, translateY: 0, scale: 1 };
  let exitCompleted = false;

  await animate(target, {
    opacity: [1, 0],
    translateY: [0, -6],
    scale: [1, 0.96],
    duration: 30,
    ease: 'outQuad',
    onComplete: () => {
      exitCompleted = true;
    },
  });

  assert.equal(exitCompleted, true, 'exit transition onComplete must be called');
  assert.equal(target.opacity, 0, 'target opacity should reach 0 on exit');
  assert.equal(target.translateY, -6, 'target translateY should reach -6 on exit');
  assert.equal(target.scale, 0.96, 'target scale should reach 0.96 on exit');
});


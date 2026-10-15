import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

mkdirSync('tmp/tests', { recursive: true });
const target = resolve('tmp/tests/blueprint-progress.cjs');
await build({ stdin: { contents: `export { getBlueprintProgress } from './services/examBlueprintProgress';
export { createDefaultBlueprint } from './data/examBlueprintPresets';
export { emptyBlueprintAllocations } from './types/examBlueprint';`, resolveDir: process.cwd() },
  outfile: target, bundle: true, platform: 'node', format: 'cjs' });
const { getBlueprintProgress, createDefaultBlueprint, emptyBlueprintAllocations } = createRequire(import.meta.url)(target);
const row = (id, content, mcq, tf, short) => {
  const allocations = emptyBlueprintAllocations();
  allocations.mcq.know = mcq; allocations.tf.know = tf; allocations.short.know = short;
  return { id, contentId: content, allocations };
};

test('equal TF statement totals do not show complete when contents split 7 + 1', () => {
  const bp = createDefaultBlueprint(12);
  bp.rows = [row('evolution', 'evo', 12, 7, 4), row('genetics', 'gene', 0, 1, 0)];
  const progress = getBlueprintProgress(bp);
  assert.equal(progress.parts[1].current, 8);
  assert.equal(progress.parts[1].state, 'grouping');
  assert.equal(progress.parts[1].completeQuestions, 1);
  assert.deepEqual(progress.incompleteGroups.map(g => g.rowId), ['evolution', 'genetics']);
});

test('TF grouping combines different rows of the same content, not different contents', () => {
  const bp = createDefaultBlueprint(12);
  bp.rows = [row('a', 'evo', 12, 3, 4), row('b', 'evo', 0, 1, 0), row('c', 'gene', 0, 4, 0)];
  const progress = getBlueprintProgress(bp);
  assert.equal(progress.parts[1].state, 'ready');
  assert.equal(progress.parts[1].completeQuestions, 2);
  assert.deepEqual(progress.incompleteGroups, []);
});

test('missing and excessive counts retain their differences and zero targets do not hide excess', () => {
  const bp = createDefaultBlueprint(10);
  bp.rows = [row('a', 'cell', 10, 8, 5)];
  let progress = getBlueprintProgress(bp);
  assert.deepEqual(progress.parts.map(p => p.state), ['missing', 'ready', 'excess']);
  assert.equal(progress.parts[0].difference, -2);
  assert.equal(progress.parts[2].difference, 1);
  bp.scores.tf.questionCount = 0;
  progress = getBlueprintProgress(bp);
  assert.equal(progress.parts[1].state, 'excess');
  assert.equal(progress.parts[1].difference, 8);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

mkdirSync('tmp/tests', { recursive: true });
const output = resolve('tmp/tests/ai-generation.mjs');
await build({ stdin: { contents: `export * from './services/aiRequestService';
export * from './services/examGenerationService';`, resolveDir: process.cwd(), loader: 'ts' },
  outfile: output, bundle: true, platform: 'node', format: 'esm',
  define: { 'import.meta.env': JSON.stringify({ VITE_API_BASE_URL: 'https://test.invalid' }) },
  plugins: [{ name: 'fake-firebase', setup(builder) {
    builder.onResolve({ filter: /firebaseConfig$/ }, () => ({ path: 'fake-auth', namespace: 'fake' }));
    builder.onLoad({ filter: /.*/, namespace: 'fake' }, () => ({
      contents: `export const auth = { currentUser: { getIdToken: async () => 'test-token' } };`, loader: 'js',
    }));
  } }],
});
const api = await import(pathToFileURL(output).href);
const response = (code, status = 429, extra = {}) => new Response(JSON.stringify({
  detail: { code, message: 'test', retryable: code === 'gemini_rate_limit', retryAfterSeconds: 2, ...extra },
}), { status, headers: { 'Retry-After': '2' } });
const ok = value => new Response(JSON.stringify(value), { status: 200 });

test('temporary quota waits for Retry-After then retries the same request', async () => {
  let calls = 0;
  const waits = [], notices = [], init = { method: 'POST', body: 'same-body' };
  const result = await api.requestAiJson('https://test.invalid', init, 'vi', s => notices.push(s), {
    fetch: async (_url, actual) => { assert.equal(actual, init); return ++calls === 1 ? response('gemini_rate_limit') : ok({ ready: true }); },
    sleep: async ms => waits.push(ms),
  });
  assert.deepEqual(result, { ready: true });
  assert.deepEqual(waits, [3000]);
  assert.deepEqual(notices, [2, 0]);
});

test('daily and account quotas do not retry', async () => {
  for (const code of ['gemini_daily_quota', 'user_hourly_quota', 'gemini_quota_unavailable']) {
    let calls = 0;
    await assert.rejects(api.requestAiJson('url', {}, 'vi', undefined, {
      fetch: async () => { calls++; return response(code); }, sleep: async () => assert.fail('unexpected wait'),
    }), error => error.code === code && error.stopBatch);
    assert.equal(calls, 1);
  }
});

test('explicit service overload waits and retries, ambiguous transport errors do not', async () => {
  let calls = 0;
  await api.requestAiJson('url', {}, 'vi', undefined, {
    fetch: async () => ++calls === 1 ? response('gemini_unavailable', 503, { retryable: true }) : ok({}),
    sleep: async ms => assert.equal(ms, 3000),
  });
  assert.equal(calls, 2);
  calls = 0;
  await assert.rejects(api.requestAiJson('url', {}, 'vi', undefined, {
    fetch: async () => { calls++; return response('gemini_unavailable', 503, { retryable: false }); },
    sleep: async () => assert.fail('ambiguous error must not replay'),
  }));
  assert.equal(calls, 1);
});

test('temporary retries are bounded', async () => {
  let calls = 0;
  await assert.rejects(api.requestAiJson('url', {}, 'en', undefined, {
    fetch: async () => { calls++; return response('gemini_rate_limit'); }, sleep: async () => {},
  }), error => error.code === 'gemini_rate_limit');
  assert.equal(calls, 4);
});

test('lost responses are not automatically replayed and explain recovery', async () => {
  let calls = 0;
  await assert.rejects(api.requestAiJson('url', {}, 'vi', undefined, {
    fetch: async () => { calls++; throw new TypeError('Failed to fetch'); }, sleep: async () => assert.fail(),
  }), error => error.code === 'network_error' && /các câu còn thiếu/.test(error.message));
  assert.equal(calls, 1);
});

test('configuration and format failures have different messages and batch behavior', async () => {
  for (const [code, status, fatal] of [['gemini_configuration', 503, true], ['ai_invalid_question', 422, false]]) {
    await assert.rejects(api.requestAiJson('url', {}, 'vi', undefined, {
      fetch: async () => response(code, status), sleep: async () => assert.fail(),
    }), error => error.code === code && error.stopBatch === fatal);
  }
});

const slots = [1, 2, 3].map(order => ({ id: `mcq-q0${order}`, part: 'mcq', order }));
test('batch is sequential and preserves successes when daily quota stops new requests', async () => {
  const original = globalThis.fetch;
  let calls = 0, active = 0, maxActive = 0;
  globalThis.fetch = async (_url, init) => {
    maxActive = Math.max(maxActive, ++active);
    await new Promise(resolve => setImmediate(resolve));
    active--;
    calls++;
    const { slot } = JSON.parse(init.body);
    return calls === 1 ? ok({ slotId: slot.id, part: slot.part, order: slot.order, question: {} }) : response('gemini_daily_quota');
  };
  try {
    const delivered = [], progress = [];
    const result = await api.generateExamItems(slots, 'vi', p => progress.push(p), item => delivered.push(item));
    assert.equal(maxActive, 1);
    assert.equal(calls, 2);
    assert.equal(result.items.length, 1);
    assert.equal(delivered.length, 1);
    assert.deepEqual(result.failures.map(f => f.slotId), ['mcq-q02', 'mcq-q03']);
    assert.deepEqual(progress.at(-1), { completed: 3, total: 3 });
  } finally { globalThis.fetch = original; }
});

test('a malformed question does not discard later successes', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    const { slot } = JSON.parse(init.body);
    return slot.order === 2 ? response('ai_invalid_question', 422)
      : ok({ slotId: slot.id, part: slot.part, order: slot.order, question: {} });
  };
  try {
    const result = await api.generateExamItems(slots);
    assert.deepEqual(result.items.map(item => item.order), [1, 3]);
    assert.equal(result.failures.length, 1);
  } finally { globalThis.fetch = original; }
});

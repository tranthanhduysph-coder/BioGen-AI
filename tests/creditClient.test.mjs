import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

mkdirSync('tmp/tests', { recursive: true });
const target = resolve('tmp/tests/credit-client.mjs');
await build({ entryPoints: ['services/creditService.ts'], outfile: target, bundle: true, platform: 'node', format: 'esm',
  define: { 'import.meta.env': JSON.stringify({ VITE_API_BASE_URL: 'https://test.invalid' }) },
  plugins: [{ name: 'fake-auth', setup(b) {
    b.onResolve({ filter: /firebaseConfig$/ }, () => ({ path: 'fake-auth', namespace: 'fake' }));
    b.onLoad({ filter: /.*/, namespace: 'fake' }, () => ({ loader: 'js',
      contents: `export const auth={currentUser:{uid:'teacher',getIdToken:async()=>'fake-token'}};` }));
  } }],
});
const api = await import(pathToFileURL(target).href);
const cache = new Map();
globalThis.localStorage = { getItem: k => cache.get(k) ?? null, setItem: (k, v) => cache.set(k, v), removeItem: k => cache.delete(k) };
const ok = value => new Response(JSON.stringify(value), { status: 200 });
const slots = { mcq: [{ id: 'mcq-q01', part: 'mcq' }], tf: [], short: [] };

test('lost reservation response retains request ID and a deliberate new exam changes it', async () => {
  cache.clear(); const requests = [];
  globalThis.fetch = async (_, init) => { requests.push(JSON.parse(init.body)); throw new Error('lost'); };
  await assert.rejects(api.createCreditExam({ title: 'Đề' }, slots));
  globalThis.fetch = async (_, init) => { requests.push(JSON.parse(init.body)); return ok({ id: requests.at(-1).requestId, status: 'reserved' }); };
  await api.createCreditExam({ title: 'Đề' }, slots);
  assert.equal(requests[0].requestId, requests[1].requestId);
  api.forgetCreditCreation();
  await api.createCreditExam({ title: 'Đề' }, slots);
  assert.notEqual(requests[1].requestId, requests[2].requestId);
});

test('lost replacement response retries the same operation before allowing another replacement', async () => {
  cache.clear(); const requests = [];
  globalThis.fetch = async (_, init) => { requests.push(JSON.parse(init.body)); throw new Error('lost'); };
  await assert.rejects(api.requestCreditItem('exam-00001', 'mcq-q01', 'vi', true));
  globalThis.fetch = async (_, init) => { requests.push(JSON.parse(init.body)); return ok({ slotId: 'mcq-q01', question: {} }); };
  await api.requestCreditItem('exam-00001', 'mcq-q01', 'vi', true);
  assert.equal(requests[0].requestId, requests[1].requestId);
  assert.equal(requests[1].replace, true);
  await api.requestCreditItem('exam-00001', 'mcq-q01', 'vi', true);
  assert.notEqual(requests[1].requestId, requests[2].requestId);
});

test('cancelled creation cannot silently reactivate an old reservation', async () => {
  cache.clear();
  globalThis.fetch = async () => ok({ id: 'old-exam', status: 'cancelled' });
  await assert.rejects(api.createCreditExam({}, slots), /đã được hủy/);
  assert.equal(cache.size, 0);
});

test('a lost whole-exam response reuses its request ID, a missing subset gets a new one', async () => {
  cache.clear(); const requests = [];
  globalThis.fetch = async (url, init) => {
    assert.match(url, /exams\/exam-00001\/generate$/);
    requests.push(JSON.parse(init.body)); throw new Error('lost');
  };
  await assert.rejects(api.requestCreditExamBatch('exam-00001', ['a', 'b'], 'vi'));
  globalThis.fetch = async (_, init) => { requests.push(JSON.parse(init.body)); return ok({ items: [], failures: [] }); };
  await api.requestCreditExamBatch('exam-00001', ['b', 'a'], 'vi');
  assert.equal(requests[0].requestId, requests[1].requestId);
  await api.requestCreditExamBatch('exam-00001', ['b'], 'vi');
  assert.notEqual(requests[1].requestId, requests[2].requestId);
});

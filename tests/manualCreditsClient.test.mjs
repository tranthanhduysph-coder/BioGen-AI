import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

mkdirSync('tmp/tests', { recursive: true });
const target = resolve('tmp/tests/manual-credits-client.mjs');
await build({ entryPoints: ['services/manualGenerationService.ts'], outfile: target,
  bundle: true, platform: 'node', format: 'esm',
  define: { 'import.meta.env': JSON.stringify({ VITE_API_BASE_URL: 'https://test.invalid' }) },
  plugins: [{ name: 'fake-auth', setup(b) {
    b.onResolve({ filter: /firebaseConfig$/ }, () => ({ path: 'auth', namespace: 'fake' }));
    b.onLoad({ filter: /.*/, namespace: 'fake' }, () => ({ loader: 'js',
      contents: `export const auth={currentUser:{uid:'teacher',getIdToken:async()=>'fake-token'}};` }));
  } }],
});
const api = await import(pathToFileURL(target).href);
const cache = new Map();
globalThis.localStorage = { getItem:k=>cache.get(k)??null, setItem:(k,v)=>cache.set(k,v), removeItem:k=>cache.delete(k) };
const ok = value => new Response(JSON.stringify(value), {status:200});
const criteria = {chapter:'ch10_intro',difficulty:'diff_1',competency:'nt1',setting:'theory',questionType:'Multiple choices',questionCount:1,customPrompt:''};

test('one multi-batch action keeps one run ID and resumes saved first batch after a lost response', async () => {
  cache.clear(); const ids=[]; const runs=new Map(); let failSecond=true; let calls=0;
  globalThis.fetch=async(url,init)=>{
    if(url.endsWith('/me')) return ok({enabled:true,manualBalance:3});
    const body=JSON.parse(init.body);
    if(url.endsWith('/manual-runs')) {
      ids.push(body.requestId);
      if(!runs.has(body.requestId)) runs.set(body.requestId,{id:body.requestId,batches:body.batches,results:{},status:'reserved'});
      return ok(runs.get(body.requestId));
    }
    calls++;
    if(body.batchIndex===1 && failSecond) {failSecond=false;throw Error('lost');}
    const results=[{question:`batch ${body.batchIndex}`}];
    const run=runs.get(body.runId);run.results[String(body.batchIndex)]=results;
    if(Object.keys(run.results).length===run.batches.length) run.status='completed';
    return ok(results);
  };
  const request=[criteria,{...criteria,customPrompt:'second'}];
  await assert.rejects(api.generateManualQuestions(request));
  const result=await api.generateManualQuestions(request);
  assert.equal(ids[0],ids[1]); assert.equal(runs.size,1);
  assert.equal(calls,3); assert.equal(result.length,2);
  await api.generateManualQuestions(request);
  assert.notEqual(ids[1],ids[2]);
});

test('server payment denial stops before any provider request and cannot use exam credits', async () => {
  cache.clear();let providerCalls=0;
  globalThis.fetch=async(url)=>{
    if(url.endsWith('/me')) return ok({enabled:true,balance:20,manualBalance:0});
    if(url.endsWith('/manual-runs')) return new Response(JSON.stringify({detail:{code:'manual_credits_required',message:'Mua 3 lượt'}}),{status:402});
    providerCalls++;return ok([]);
  };
  await assert.rejects(api.generateManualQuestions([criteria]),e=>e.code==='manual_credits_required');
  assert.equal(providerCalls,0);
});

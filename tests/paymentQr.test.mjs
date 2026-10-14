import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

mkdirSync('tmp/tests', { recursive: true });
const target = resolve('tmp/tests/payment-qr.mjs');
await build({ entryPoints: ['services/paymentQr.ts'], outfile: target, bundle: true, platform: 'node', format: 'esm' });
const { paymentQrUrl } = await import(pathToFileURL(target).href);
const bank = { id: 'BIDV', name: 'BIDV', accountNumber: '1410373736', accountName: 'TRAN THANH DUY', virtualAccountNumber: '96247BIOGENTEST' };
const config = { automaticPaymentReady: true, bank };
const order = { status: 'pending', bank, paymentCode: 'BGP1234567890ABCDEF1234', expectedAmount: 20000 };

test('BIDV QR routes payment to the verified VA with the exact amount and order memo', () => {
  for (const amount of [20000, 199000, 349000, 479000]) {
    const url = new URL(paymentQrUrl({ ...order, expectedAmount: amount }, config));
    assert.equal(url.pathname, '/image/BIDV-96247BIOGENTEST-compact2.png');
    assert.equal(url.searchParams.get('amount'), String(amount));
    assert.equal(url.searchParams.get('addInfo'), order.paymentCode);
    assert.equal(url.searchParams.get('accountName'), 'TRAN THANH DUY');
  }
});

test('BIDV never falls back to the main account when the VA or payment setup is absent', () => {
  assert.equal(paymentQrUrl(order, { ...config, automaticPaymentReady: false }), null);
  assert.equal(paymentQrUrl(order, null), null);
  for (const virtualAccountNumber of [undefined, '', '1410373736', '96247INVALID!']) {
    const invalid = { ...bank, virtualAccountNumber };
    assert.equal(paymentQrUrl({ ...order, bank: invalid }, { ...config, bank: invalid }), null);
  }
});

test('outdated recipients, unresolved transfers and closed orders cannot display a payable QR', () => {
  for (const change of [
    { bank: { ...bank, id: 'TCB', accountNumber: '84907276901' } },
    { bank: { ...bank, virtualAccountNumber: '96247OTHER' } },
    { paymentIssue: 'amount_mismatch' }, { status: 'fulfilled' }, { status: 'rejected' },
    { paymentCode: undefined }, { expectedAmount: undefined },
  ]) assert.equal(paymentQrUrl({ ...order, ...change }, config), null);
});

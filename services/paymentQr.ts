import type { PaymentConfig, PurchaseRequest } from './creditService';

export function paymentRecipientMatches(order: PurchaseRequest | undefined, config: PaymentConfig | null) {
  return !!order?.bank && !!config && order.bank.id === config.bank.id
    && order.bank.accountNumber === config.bank.accountNumber
    && order.bank.virtualAccountNumber === config.bank.virtualAccountNumber;
}

export function paymentQrUrl(order: PurchaseRequest | undefined, config: PaymentConfig | null): string | null {
  if (!order || order.status !== 'pending' || !config?.automaticPaymentReady || !paymentRecipientMatches(order, config)
    || order.paymentIssue || !order.paymentCode || !order.expectedAmount || !order.bank) return null;
  const account = order.bank.id === 'BIDV' ? order.bank.virtualAccountNumber : order.bank.accountNumber;
  if (!account || order.bank.id === 'BIDV' && !/^96247[A-Z0-9]{1,14}$/.test(account)) return null;
  return `https://img.vietqr.io/image/${order.bank.id}-${account}-compact2.png?amount=${order.expectedAmount}&addInfo=${encodeURIComponent(order.paymentCode)}&accountName=${encodeURIComponent(order.bank.accountName)}`;
}

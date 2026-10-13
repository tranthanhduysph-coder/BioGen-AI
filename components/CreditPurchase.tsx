import React, { useEffect, useRef, useState } from 'react';
import { creditRequest, getCreditAccount, getPaymentConfig, type PaymentConfig, type PurchaseRequest, type CreditAccount } from '../services/creditService';
import { auth } from '../firebaseConfig';
import plans from '../data/paymentPlans.json';
import { PaymentHelp } from './PaymentHelp';

const button = 'rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-40';
export const money = (amount: number) => `${amount.toLocaleString('vi-VN')}đ`;
const productName = (p: PurchaseRequest) => p.product === 'manual' ? `3 lượt câu hỏi lẻ · ${money(p.expectedAmount || plans.manual.priceVnd)}`
  : `${p.package} credit tạo đề · ${money(p.expectedAmount || plans.exam.find(g => g.credits === p.package)!.priceVnd)}`;

export const CreditPurchase: React.FC<{ initialProduct?: 'exam' | 'manual' }> = ({ initialProduct = 'exam' }) => {
  const [product, setProduct] = useState(initialProduct);
  const [pack, setPack] = useState(10);
  const [note, setNote] = useState('');
  const [orders, setOrders] = useState<PurchaseRequest[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [paid, setPaid] = useState<PurchaseRequest | null>(null);
  const known = useRef<Record<string, string>>({});
  const polling = useRef(false);
  const load = async () => {
    if (polling.current) return;
    polling.current = true;
    try {
      const [rows, paymentConfig] = await Promise.all([
        creditRequest<PurchaseRequest[]>('/purchases'), getPaymentConfig(),
      ]);
      for (const order of rows) {
        if (known.current[order.id] === 'pending' && order.status === 'fulfilled') {
          setPaid(order); window.dispatchEvent(new Event('biogen-credit-updated'));
        }
        known.current[order.id] = order.status;
      }
      setOrders(rows); setConfig(paymentConfig); setError('');
    }
    catch (e: any) { setError(e.message); }
    finally { polling.current = false; }
  };
  useEffect(() => { void load(); }, []);
  const pending = orders.find(p => p.status === 'pending');
  useEffect(() => {
    if (!pending || !config?.automaticPaymentReady) return;
    const timer = setInterval(() => { if (!document.hidden) void load(); }, 5000);
    return () => clearInterval(timer);
  }, [pending?.id, config?.automaticPaymentReady]);
  const submit = async () => {
    setBusy(true); setError('');
    const key = `biogen_purchase_pending_${auth?.currentUser?.uid}`;
    const body = { product, package: product === 'manual' ? 3 : pack, note: note.trim() };
    const signature = JSON.stringify(body);
    let cached: any = null;
    try { cached = JSON.parse(localStorage.getItem(key) || 'null'); } catch { /* old cache */ }
    const requestId = cached?.signature === signature ? cached.requestId : crypto.randomUUID();
    localStorage.setItem(key, JSON.stringify({ signature, requestId }));
    try {
      await creditRequest('/purchases', { ...body, requestId });
      localStorage.removeItem(key); await load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };
  return <section aria-label="Mua lượt BioGen AI" className="space-y-3 text-sm">
    <p>Trân trọng cảm ơn thầy/cô đã tin tưởng BioGen AI. Khoản thanh toán của thầy/cô giúp duy trì chi phí AI, máy chủ và tiếp tục hoàn thiện học liệu Sinh học.</p>
    <div className="rounded-lg bg-slate-50 p-3 text-slate-900">
      <b>Gói sử dụng</b>
      {plans.exam.map(p => <p key={p.credits}>{p.credits} credit = {p.credits} đề · {money(p.priceVnd)}</p>)}
      <p>Câu hỏi lẻ: {money(plans.manual.priceVnd)} / {plans.manual.turns} lượt tạo.</p>
      <p className="mt-2 text-xs">1 credit tạo 1 đề tối đa 40 câu/ý (mỗi câu Đúng/Sai tính 4 ý), gồm duyệt, sửa thủ công và xuất Word. Thay câu bằng AI tối đa 20% dung lượng đề.</p>
      <p className="mt-1 text-xs">1 lượt câu hỏi lẻ là 1 lần bấm tạo, tối đa 40 câu, kể cả danh sách nhiều yêu cầu.</p>
      <p className="mt-1 text-xs">Hai loại lượt tính riêng. Dùng thử một lần: 2 đề và 3 lượt câu hỏi lẻ. Credit đề không hết hạn.</p>
    </div>
    {paid && <p role="status" className="rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-800">Đã thanh toán và cộng {paid.package} {paid.product === 'exam' ? 'credit tạo đề' : 'lượt câu hỏi lẻ'} vào tài khoản. Trân trọng cảm ơn thầy/cô; thầy/cô có thể sử dụng ngay.</p>}
    {config && !config.automaticPaymentReady && <p role="status" className="rounded-lg bg-amber-50 p-3 text-amber-900">Thanh toán tự động đang được hoàn tất kết nối. Thầy/cô vẫn có thể dùng các lượt hiện có; vui lòng chưa chuyển khoản cho gói mới.</p>}
    {pending ? <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-slate-900">
      <b>Gói đã chọn: {productName(pending)}</b>
      <p className="mt-1">{config?.automaticPaymentReady ? 'Thầy/cô quét QR, chuyển đúng số tiền và giữ nguyên nội dung. Khi nhận được xác nhận tiền vào, hệ thống tự cộng lượt vào tài khoản đang đăng nhập; không cần chờ duyệt.' : 'Gói đã được lưu. QR sẽ hiển thị khi kết nối thanh toán tự động sẵn sàng.'}</p>
      <p className="mt-1 break-all">Mã yêu cầu: {pending.id}</p>
      {pending.paymentIssue && <p role="alert" className="mt-2 font-semibold text-amber-800">Giao dịch chưa khớp gói đã chọn nên chưa cộng lượt. Thầy/cô vui lòng giữ biên nhận và <a className="underline" href="mailto:ttduy@sgu.edu.vn">liên hệ hỗ trợ</a> để đối soát; không chuyển thêm tiền cho mã này.</p>}
      {config?.automaticPaymentReady && !pending.paymentIssue && pending.paymentCode && pending.bank && <>
        <p className="mt-2 font-semibold">{money(pending.expectedAmount!)} · {pending.bank.name} · {pending.bank.accountNumber} · {pending.bank.accountName}</p>
        <p>Nội dung: <b>{pending.paymentCode}</b></p>
        <img className="mx-auto mt-2 w-56 rounded-lg" alt={`QR thanh toán ${productName(pending)}`}
          src={`https://img.vietqr.io/image/${pending.bank.id}-${pending.bank.accountNumber}-compact2.png?amount=${pending.expectedAmount}&addInfo=${encodeURIComponent(pending.paymentCode)}&accountName=${encodeURIComponent(pending.bank.accountName)}`} />
        <p className="mt-2 text-center">Đang chờ xác nhận tiền vào… Trang tự cập nhật trạng thái.</p>
      </>}
      {config?.automaticPaymentReady && !pending.paymentCode && <button className={button} disabled={busy} onClick={async () => {
        setBusy(true); setError('');
        try { await creditRequest(`/purchases/${pending.id}/prepare-payment`, {}); await load(); }
        catch (e: any) { setError(e.message); } finally { setBusy(false); }
      }}>Tạo QR cho gói đã lưu</button>}
    </div> : <>
      <label className="block">Module cần mua
        <select className="mt-1 w-full rounded-lg border bg-white p-2 text-slate-900" value={product} onChange={e => setProduct(e.target.value as any)}>
          <option value="exam">Tạo đề kiểm tra</option><option value="manual">Tạo câu hỏi lẻ · 20.000đ / 3 lượt</option>
        </select>
      </label>
      {product === 'exam' && <label className="block">Gói credit
        <select className="mt-1 w-full rounded-lg border bg-white p-2 text-slate-900" value={pack} onChange={e => setPack(Number(e.target.value))}>
          {plans.exam.map(p => <option key={p.credits} value={p.credits}>{p.credits} credit = {p.credits} đề · {money(p.priceVnd)}</option>)}
        </select>
      </label>}
      <label className="block">Ghi chú hỗ trợ (không bắt buộc)
        <textarea className="mt-1 w-full rounded-lg border bg-white p-2 text-slate-900" maxLength={500} value={note} onChange={e => setNote(e.target.value)} />
      </label>
      <button className={`${button} bg-sky-600 text-white`} disabled={busy || !config?.automaticPaymentReady} onClick={() => void submit()}>Hiển thị QR thanh toán</button>
    </>}
    <button className={button} disabled={busy} onClick={() => void load()}>Kiểm tra trạng thái mua</button>
    {orders.filter(p => p.status !== 'pending').slice(0, 3).map(p => <div key={p.id} className="rounded-lg border p-3">
      <p>{productName(p)} · {p.status === 'fulfilled' ? 'Đã cộng lượt' : 'Yêu cầu đã đóng'}</p>
      <p className="mt-1 break-all text-xs">Mã yêu cầu: {p.id}</p>
      {p.paymentReference && <p className="break-all text-xs">Mã giao dịch đã đối soát: {p.paymentReference}</p>}
    </div>)}
    <PaymentHelp />
    {error && <p role="alert" className="text-red-600">{error}</p>}
  </section>;
};

export const PurchaseModal: React.FC<{ onClose: () => void; product?: 'exam' | 'manual' }> = ({ onClose, product }) =>
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
    <div role="dialog" aria-label="Mua lượt BioGen AI" aria-modal="true" className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-5 text-slate-800 shadow-xl dark:bg-slate-900 dark:text-white">
      <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold">Mua lượt BioGen AI</h3><button className={button} onClick={onClose}>Đóng</button></div>
      <CreditPurchase initialProduct={product} />
    </div>
  </div>;

export const ManualAccessPanel: React.FC<{ refreshToken: number; onResume: () => void; onBuy: () => void }> = ({ refreshToken, onResume, onBuy }) => {
  const [account, setAccount] = useState<CreditAccount | null>(null);
  const [error, setError] = useState('');
  const refresh = async () => {
    try { setAccount(await getCreditAccount()); setError(''); }
    catch (e: any) { setError(e.message); }
  };
  useEffect(() => { void refresh(); }, [refreshToken]);
  useEffect(() => { const update = () => { void refresh(); }; window.addEventListener('biogen-credit-updated', update);
    return () => window.removeEventListener('biogen-credit-updated', update); }, []);
  if (!account?.enabled) return error ? <p role="status">{error}</p> : null;
  const remaining = account.manualBalance ?? 3;
  return <section aria-label="Lượt tạo câu hỏi lẻ" className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-slate-900">
    <b>Câu hỏi lẻ: {remaining} lượt khả dụng · {account.manualHeld || 0} đang giữ</b>
    <p className="mt-1">3 lượt đầu miễn phí; tiếp theo 20.000đ / 3 lượt. Một lần bấm tạo (kể cả danh sách nhiều yêu cầu) tính 1 lượt, tối đa 40 câu.</p>
    {remaining === 1 && <p role="status" className="mt-2 font-bold text-amber-800">Đây là lượt cuối của anh/chị. Sau lượt này cần mua thêm 3 lượt để tiếp tục tạo câu hỏi lẻ.</p>}
    {remaining === 0 && !account.activeManualRunId && <p className="mt-2 font-bold">Đã hết lượt. Vui lòng mua gói tiếp theo.</p>}
    {account.status === 'blocked' && <p>Tài khoản đã bị quản trị khóa.</p>}
    <div className="mt-2 flex flex-wrap gap-2">
      <button className={button} onClick={onBuy}>Mua 3 lượt · 20.000đ</button>
      <button className={button} onClick={() => void refresh()}>Làm mới lượt</button>
      {account.activeManualRunId && <button className={button} onClick={onResume}>Tiếp tục lượt đang dở</button>}
      {account.activeManualRunId && <button className={button} onClick={async () => {
        try { await creditRequest(`/manual-runs/${account.activeManualRunId}/cancel`, {}); await refresh(); }
        catch (e: any) { setError(e.message); }
      }}>Hủy lượt chưa có câu</button>}
    </div>{error && <p role="alert" className="mt-2 text-red-600">{error}</p>}
  </section>;
};

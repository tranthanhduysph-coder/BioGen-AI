import React, { useEffect, useState } from 'react';
import { creditRequest, getCreditAccount, type PurchaseRequest, type CreditAccount } from '../services/creditService';
import { auth } from '../firebaseConfig';

const button = 'rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-40';
const productName = (p: PurchaseRequest) => p.product === 'manual' ? '3 lượt câu hỏi lẻ · 20.000đ' : `${p.package} credit tạo đề`;

export const CreditPurchase: React.FC<{ initialProduct?: 'exam' | 'manual' }> = ({ initialProduct = 'exam' }) => {
  const [product, setProduct] = useState(initialProduct);
  const [pack, setPack] = useState(10);
  const [note, setNote] = useState('');
  const [orders, setOrders] = useState<PurchaseRequest[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    try { setOrders(await creditRequest<PurchaseRequest[]>('/purchases')); }
    catch (e: any) { setError(e.message); }
  };
  useEffect(() => { void load(); }, []);
  const pending = orders.find(p => p.status === 'pending');
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
    <p>Hai loại lượt được tính riêng: 1 credit = 1 đề. Câu hỏi lẻ có 3 lượt đầu miễn phí, sau đó 20.000đ / 3 lượt tạo.</p>
    {pending ? <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-slate-900">
      <b>Yêu cầu mua: {productName(pending)}</b>
      <p className="mt-1">{pending.reportedPaid ? 'Anh/chị đã báo chuyển khoản. Quản trị đang đối chiếu.' : 'Đã gửi yêu cầu tới quản trị.'} Chỉ cộng lượt sau khi quản trị xác nhận thanh toán.</p>
      <p className="mt-1 break-all">Mã yêu cầu: {pending.id}</p>
      {pending.product === 'manual' && <>
        <p className="mt-2 font-semibold">Chuyển khoản 20.000đ · Techcombank · 84907276901 · TRAN THANH DUY</p>
        <p>Nội dung: BG{pending.id.replace(/-/g, '').slice(0, 12).toUpperCase()}</p>
        <img className="mx-auto mt-2 w-56 rounded-lg" alt="QR thanh toán 3 lượt câu hỏi lẻ"
          src={`https://img.vietqr.io/image/TCB-84907276901-compact2.png?amount=20000&addInfo=BG${pending.id.replace(/-/g, '').slice(0, 12).toUpperCase()}`} />
        {!pending.reportedPaid && <button className={button} disabled={busy} onClick={async () => {
          setBusy(true); setError('');
          try { await creditRequest(`/purchases/${pending.id}/report-payment`, {}); await load(); }
          catch (e: any) { setError(e.message); } finally { setBusy(false); }
        }}>Báo đã chuyển khoản</button>}
      </>}
      {pending.product === 'exam' && <p className="mt-2">Quản trị sẽ xác nhận giá và hướng dẫn thanh toán cho gói đã chọn.</p>}
    </div> : <>
      <label className="block">Module cần mua
        <select className="mt-1 w-full rounded-lg border bg-white p-2 text-slate-900" value={product} onChange={e => setProduct(e.target.value as any)}>
          <option value="exam">Tạo đề kiểm tra</option><option value="manual">Tạo câu hỏi lẻ · 20.000đ / 3 lượt</option>
        </select>
      </label>
      {product === 'exam' && <label className="block">Gói credit
        <select className="mt-1 w-full rounded-lg border bg-white p-2 text-slate-900" value={pack} onChange={e => setPack(Number(e.target.value))}>
          {[10, 20, 30].map(n => <option key={n} value={n}>{n} credit = {n} đề</option>)}
        </select>
      </label>}
      <label className="block">Ghi chú cho quản trị (không bắt buộc)
        <textarea className="mt-1 w-full rounded-lg border bg-white p-2 text-slate-900" maxLength={500} value={note} onChange={e => setNote(e.target.value)} />
      </label>
      <button className={`${button} bg-sky-600 text-white`} disabled={busy} onClick={() => void submit()}>Gửi yêu cầu mua</button>
    </>}
    <button className={button} disabled={busy} onClick={() => void load()}>Kiểm tra trạng thái mua</button>
    {orders.filter(p => p.status !== 'pending').slice(0, 3).map(p => <p key={p.id}>{productName(p)} · {p.status === 'fulfilled' ? 'Đã cộng lượt' : 'Yêu cầu đã đóng'}</p>)}
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

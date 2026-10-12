import React, { useEffect, useState } from 'react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { creditRequest, getCreditAccount, getCloudExam, type CloudExam, type CreditAccount,
  forgetCreditCreation, type CreditEvent, type ExamSummary, type PurchaseRequest } from '../../services/creditService';
import { CreditPurchase } from '../CreditPurchase';

const button = 'rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-600';
const input = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:bg-slate-900 dark:text-white';
const statusText = { pending: 'Chờ duyệt', approved: 'Đã duyệt', blocked: 'Đã khóa' };
const eventText: Record<string, string> = { reserve: 'Giữ credit cho đề', consume: 'Hoàn tất đề',
  refund: 'Hoàn credit', grant: 'Cộng lượt', status: 'Thay đổi quyền sử dụng',
  manual_reserve: 'Giữ lượt câu lẻ', manual_consume: 'Hoàn tất câu lẻ', manual_refund: 'Hoàn lượt câu lẻ' };

export const CreditPanel: React.FC<{ onAccount: (account: CreditAccount | null) => void;
  onRestore: (exam: CloudExam) => void; refreshToken: number; busy: boolean }> =
({ onAccount, onRestore, refreshToken, busy }) => {
  const [account, setAccount] = useState<CreditAccount | null>(null);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [events, setEvents] = useState<CreditEvent[]>([]);
  const [accounts, setAccounts] = useState<CreditAccount[]>([]);
  const [selectedUid, setSelectedUid] = useState('');
  const [note, setNote] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [adminEvents, setAdminEvents] = useState<CreditEvent[]>([]);
  const [adminExams, setAdminExams] = useState<ExamSummary[]>([]);
  const [operation, setOperation] = useState<{ key: string; id: string } | null>(null);
  const [confirmation, setConfirmation] = useState<{ text: string; run: () => void } | null>(null);
  const [purchases, setPurchases] = useState<PurchaseRequest[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRequest | null>(null);
  useEffect(() => { setConfirmation(null); }, [selectedUid, note, paymentReference]);

  const refresh = async () => {
    if (!auth?.currentUser) { setAccount(null); onAccount(null); return; }
    try {
      const current = await getCreditAccount();
      setAccount(current); onAccount(current); setError('');
      if (!current.enabled) return;
      const [saved, history] = await Promise.all([
        creditRequest<ExamSummary[]>('/exams'), creditRequest<CreditEvent[]>('/history'),
      ]);
      setExams(saved); setEvents(history);
      if (current.isAdmin) {
        const [users, orders] = await Promise.all([creditRequest<CreditAccount[]>('/admin/accounts'), creditRequest<PurchaseRequest[]>('/admin/purchases')]);
        setAccounts(users); setPurchases(orders);
      }
    } catch (e: any) { setError(e.message); }
  };
  useEffect(() => { const stop = auth ? onAuthStateChanged(auth, () => { void refresh(); }) : undefined;
    return () => stop?.(); }, []);
  useEffect(() => { void refresh(); }, [refreshToken]);
  useEffect(() => {
    if (!account?.isAdmin) return;
    const timer = setInterval(() => {
      void creditRequest<PurchaseRequest[]>('/admin/purchases').then(setPurchases).catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, [account?.isAdmin]);

  const action = async (work: () => Promise<unknown>) => {
    setWorking(true); setError('');
    try { await work(); await refresh(); }
    catch (e: any) { setError(e.message); }
    finally { setWorking(false); }
  };
  const change = (fields: { status?: string; package?: number; trial?: boolean; manualPackage?: number }) => {
    const body = { uid: selectedUid, note: note.trim(), ...fields,
      ...(fields.package || fields.manualPackage ? { paymentReference: paymentReference.trim(),
        ...(selectedPurchase ? { purchaseId: selectedPurchase.id } : {}) } : {}) };
    const key = JSON.stringify(body);
    const cacheKey = `biogen_credit_admin_pending_${account?.uid}`;
    let pending = operation;
    try { pending = JSON.parse(localStorage.getItem(cacheKey) || 'null') || pending; } catch { /* old cache */ }
    const requestId = pending?.key === key ? pending.id : crypto.randomUUID();
    localStorage.setItem(cacheKey, JSON.stringify({ key, id: requestId }));
    setOperation({ key, id: requestId });
    void action(async () => {
      await creditRequest('/admin/change', { ...body, requestId });
      localStorage.removeItem(cacheKey); setOperation(null); setNote(''); setPaymentReference(''); setSelectedPurchase(null);
    });
  };
  const historyTable = (rows: CreditEvent[]) => <div className="max-h-52 overflow-auto">
    <table className="w-full text-left text-xs"><thead><tr><th>Thời gian</th><th>Giao dịch</th><th>Credit đề</th><th>Đang giữ</th><th>Lượt câu lẻ</th></tr></thead>
      <tbody>{rows.map(e => <tr key={e.id} className="border-t border-slate-200">
        <td className="py-2">{new Date(e.updatedAt * 1000).toLocaleString('vi-VN')}</td>
        <td>{eventText[e.kind] || e.kind}{e.note && <div className="text-slate-500">{e.note}</div>}</td>
        <td>{e.balanceDelta > 0 ? '+' : ''}{e.balanceDelta}</td><td>{e.heldDelta > 0 ? '+' : ''}{e.heldDelta}</td><td>{e.manualDelta || 0}{!!e.manualHeldDelta && ` (giữ ${e.manualHeldDelta > 0 ? '+' : ''}${e.manualHeldDelta})`}</td>
      </tr>)}</tbody></table>{!rows.length && <p className="py-2">Chưa có giao dịch.</p>}
  </div>;

  if (account && !account.enabled) return null;
  if (!account) return error ? <p role="status" className="text-sm text-amber-700">{error}</p> : null;
  const disabled = busy || working;
  const selected = accounts.find(a => a.uid === selectedUid);
  return <section aria-label="Credit tạo đề" className="rounded-xl border border-sky-200 bg-white p-4 text-slate-800 dark:border-sky-800 dark:bg-slate-900 dark:text-slate-100">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="font-bold">Credit tạo đề</h3>
        <p className="mt-1 text-sm"><strong>{account.balance}</strong> credit khả dụng · <strong>{account.held}</strong> đang giữ · {statusText[account.status]}</p>
      </div><button className={button} disabled={disabled} onClick={() => void action(refresh)}>Làm mới credit</button>
    </div>
    <p className="mt-2 text-xs text-slate-500">1 credit = 1 đề, tối đa 40 câu/ý. Câu Đúng/Sai tính 4 ý. Thay tối đa 20% dung lượng; sửa thủ công và xuất Word không trừ thêm. Credit không hết hạn.</p>
    <p className="mt-2 text-sm">Mỗi tài khoản nhận 2 credit tạo đề dùng thử một lần. Câu hỏi lẻ có số lượt riêng.</p>
    <details className="mt-3"><summary className="cursor-pointer font-bold text-sky-700">Mua thêm credit / lượt câu hỏi lẻ</summary><div className="mt-3"><CreditPurchase /></div></details>
    {account.isAdmin && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-2 font-semibold text-amber-900">Yêu cầu mua đang chờ: {purchases.filter(p => p.status === 'pending').length}. Mở quản trị bên dưới để xử lý; tự cập nhật mỗi 30 giây.</p>}
    {account.status !== 'approved' && <p className="mt-2 text-sm text-amber-700">Tài khoản cần được quản trị duyệt để sử dụng AI.</p>}
    {account.balance === 0 && <p className="mt-2 text-sm">Các gói: 10, 20, 30 credit. Liên hệ quản trị để thanh toán và cộng credit.</p>}
    {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    {confirmation && <div role="alert" className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-slate-900">
      <p>{confirmation.text}</p><div className="mt-2 flex gap-2">
        <button className={button} disabled={disabled} onClick={() => { const run = confirmation.run; setConfirmation(null); run(); }}>Xác nhận thao tác</button>
        <button className={button} onClick={() => setConfirmation(null)}>Bỏ qua</button>
      </div></div>}
    <details className="mt-3"><summary className="cursor-pointer font-semibold">Đề đã lưu trên tài khoản ({exams.length})</summary>
      <div className="mt-2 max-h-64 space-y-2 overflow-auto">{exams.map(e => <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
        <div className="text-sm"><b>{e.title}</b> · {e.status === 'completed' ? 'Hoàn tất' : e.status === 'cancelled' ? 'Đã hủy' : 'Đang tạo'}<div className="text-xs text-slate-500">{e.units} câu/ý · {e.completed} câu đã tạo</div></div>
        {e.status !== 'cancelled' && <div className="flex gap-2"><button className={button} disabled={disabled}
          onClick={() => void action(async () => onRestore(await getCloudExam(e.id)))}>Mở đề</button>
          {e.status === 'reserved' && <button className={button} disabled={disabled}
            onClick={() => setConfirmation({ text: 'Hủy đề? Đề chưa có câu AI được hoàn credit; đề đã có câu cần quản trị xét hoàn.',
              run: () => void action(async () => { await creditRequest(`/exams/${e.id}/cancel`, {}); forgetCreditCreation(); }) })}>Hủy đề</button>}</div>}
      </div>)}{!exams.length && <p className="text-sm">Chưa có đề trên tài khoản.</p>}</div>
    </details>
    <details className="mt-3"><summary className="cursor-pointer font-semibold">Lịch sử credit</summary>{historyTable(events)}</details>
    {account.isAdmin && <details className="mt-4 rounded-lg border border-slate-200 p-3">
      <summary className="cursor-pointer font-bold">Quản trị tài khoản và credit</summary>
      <p className="mt-2 text-xs text-slate-500">Chỉ cộng gói sau khi xác nhận thanh toán. Mỗi thao tác có mã giao dịch và lý do.</p>
      <h4 className="mt-3 font-bold">Yêu cầu mua credit và lượt câu hỏi lẻ</h4>
      {purchases.filter(p => p.status === 'pending').map(p => <div key={p.id} className="mt-2 rounded-lg border border-amber-200 p-3 text-sm">
        <b>{p.email || p.uid}</b> · {p.product === 'manual' ? '3 lượt câu hỏi lẻ · 20.000đ' : `${p.package} credit đề`}
        <p>{new Date(p.updatedAt * 1000).toLocaleString('vi-VN')} · {p.reportedPaid ? 'Giáo viên đã báo chuyển khoản; cần đối chiếu ngân hàng' : 'Mới đăng ký mua'}</p>
        {p.note && <p>{p.note}</p>}<p className="break-all text-xs">Mã yêu cầu: {p.id}</p>
        <button className={`${button} mt-2`} disabled={disabled} onClick={() => { setSelectedUid(p.uid); setSelectedPurchase(p); setNote(`Xử lý yêu cầu ${p.id}`); setPaymentReference(''); }}>Chọn xử lý yêu cầu</button>
      </div>)}
      {!purchases.some(p => p.status === 'pending') && <p className="mt-2 text-sm">Chưa có yêu cầu mua đang chờ.</p>}
      {selectedPurchase && <div className="mt-3 rounded-lg bg-sky-50 p-2 text-sm text-slate-900">
        <p>Đang xử lý: {selectedPurchase.email} · {selectedPurchase.product === 'manual' ? '3 lượt câu hỏi lẻ' : `${selectedPurchase.package} credit đề`}</p>
        <button className={button} disabled={disabled || !note.trim()} onClick={() => setConfirmation({ text: 'Đóng yêu cầu mua này mà không cộng lượt?', run: () => void action(async () => {
          await creditRequest(`/admin/accounts/${selectedPurchase.uid}/purchases/${selectedPurchase.id}/reject`, { note }); setSelectedPurchase(null);
        }) })}>Đóng yêu cầu mua</button>
      </div>}
      <select aria-label="Chọn tài khoản quản trị" className={`${input} mt-2 w-full`} value={selectedUid} onChange={e => { setSelectedUid(e.target.value); setAdminEvents([]); setSelectedPurchase(null); }}>
        <option value="">Chọn tài khoản (100 tài khoản hoạt động gần nhất)</option>{accounts.map(a => <option key={a.uid} value={a.uid}>{a.email || a.uid} · {statusText[a.status]} · {a.balance} credit</option>)}
      </select>
      <input aria-label="UID tài khoản" className={`${input} mt-2 w-full`} value={selectedUid} onChange={e => { setSelectedUid(e.target.value); setSelectedPurchase(null); }} placeholder="Hoặc nhập Firebase UID" />
      <input aria-label="Lý do giao dịch credit" className={`${input} mt-2 w-full`} value={note} onChange={e => setNote(e.target.value)} placeholder="Mã thanh toán hoặc lý do thay đổi" />
      <input aria-label="Mã thanh toán credit" className={`${input} mt-2 w-full`} value={paymentReference} onChange={e => setPaymentReference(e.target.value)} placeholder="Mã giao dịch thanh toán duy nhất (bắt buộc khi cộng gói)" />
      <div className="mt-2 flex flex-wrap gap-2">{(['approved', 'blocked'] as const).map(status => <button key={status} className={button} disabled={disabled || !selectedUid || !note.trim()} onClick={() => change({ status })}>{status === 'approved' ? 'Duyệt tài khoản' : 'Khóa tài khoản'}</button>)}
        <button className={button} disabled={disabled || !selectedUid || !note.trim() || !!selected?.trialGranted} onClick={() => change({ trial: true })}>Cấp đủ 2 credit dùng thử</button>
        <button className={button} disabled={disabled || !selectedUid || !note.trim() || paymentReference.trim().length < 3 || !!selectedPurchase && selectedPurchase.product !== 'manual'} onClick={() => setConfirmation({ text: `Cộng 3 lượt câu hỏi lẻ cho ${selected?.email || selectedUid}. Xác nhận đã nhận 20.000đ; mã thanh toán ${paymentReference}.`, run: () => change({ manualPackage: 3 }) })}>Cộng 3 lượt câu lẻ · 20.000đ</button>
        {[10, 20, 30].map(n => <button key={n} className={button} disabled={disabled || !selectedUid || !note.trim() || paymentReference.trim().length < 3 || !!selectedPurchase && (selectedPurchase.product !== 'exam' || selectedPurchase.package !== n)} onClick={() => {
          const targetUid = selectedUid, targetNote = note;
          setConfirmation({ text: `Cộng ${n} credit cho ${selected?.email || selectedUid}. Chỉ xác nhận sau khi nhận thanh toán. Mã: ${paymentReference}. Ghi chú: ${note}`,
            run: () => { if (targetUid !== selectedUid || targetNote !== note) return; change({ package: n }); } });
        }}>Cộng gói {n}</button>)}
        <button className={button} disabled={disabled || !selectedUid} onClick={() => void action(async () => setAdminEvents(await creditRequest(`/admin/accounts/${encodeURIComponent(selectedUid)}/history`)))}>Xem giao dịch tài khoản</button>
        <button className={button} disabled={disabled || !selectedUid} onClick={() => void action(async () => setAdminExams(await creditRequest(`/admin/accounts/${encodeURIComponent(selectedUid)}/exams`)))}>Xem đề và token AI</button>
        {selected?.activeExamId && <button className={button} disabled={disabled || !note.trim()} onClick={() => {
          const path = `/admin/accounts/${encodeURIComponent(selectedUid)}/exams/${selected.activeExamId}/refund`;
          const reason = note;
          setConfirmation({ text: `Hoàn 1 credit và hủy đề đang dở của ${selected.email || selectedUid}? Lý do: ${note}`,
            run: () => void action(() => creditRequest(path, { note: reason })) });
        }}>Xét hoàn đề lỗi</button>}
      </div>{historyTable(adminEvents)}
      {!!adminExams.length && <div className="mt-3 max-h-56 overflow-auto text-xs"><p>Token trả lời và token suy luận được ghi riêng; cần cộng cả hai khi tính phí API.</p>
        {adminExams.map(e => <p className="mt-2 rounded bg-slate-50 p-2 dark:bg-slate-800" key={e.id}>{e.title} · {e.status} · {e.units} câu/ý · {e.usage?.calls || 0} lượt AI · đầu vào {e.usage?.inputTokens || 0} · trả lời {e.usage?.outputTokens || 0} · suy luận {e.usage?.thinkingTokens || 0}</p>)}
      </div>}
    </details>}
  </section>;
};

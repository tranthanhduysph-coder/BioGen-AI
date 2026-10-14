import React, { useState } from 'react';
import { PurchaseModal } from './CreditPurchase';
import plans from '../data/paymentPlans.json';
import { money } from './CreditPurchase';
export const BannerAd: React.FC = () => {
  const [showPurchase, setShowPurchase] = useState(false);
  return <>
    <section aria-label="Gói sử dụng BioGen AI" className="rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 p-5 text-white shadow-md">
      <h3 className="text-lg font-bold">Trân trọng cảm ơn thầy/cô đã đồng hành cùng BioGen AI</h3>
      <p className="mt-2 text-sm leading-relaxed">Sự tin tưởng và khoản thanh toán của thầy/cô giúp duy trì AI, máy chủ và tiếp tục hoàn thiện công cụ soạn câu hỏi, xây dựng đề kiểm tra Sinh học.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">{plans.exam.map(p => <div key={p.credits} className="rounded-lg bg-white/15 p-3"><b>{p.credits} credit · {p.credits} đề</b><p>{money(p.priceVnd)}</p></div>)}</div>
      <p className="mt-3 text-sm font-semibold">Câu hỏi lẻ: 20.000đ / 3 lượt tạo. Hai loại lượt được tính riêng.</p>
      <p className="mt-1 text-sm">Mỗi tài khoản được dùng thử 2 đề và 3 lượt câu hỏi lẻ, một lần duy nhất.</p>
      <button className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-bold text-indigo-700" onClick={() => setShowPurchase(true)}>Xem gói & thanh toán QR</button>
    </section>
    {showPurchase && <PurchaseModal onClose={() => setShowPurchase(false)} />}
  </>;
};

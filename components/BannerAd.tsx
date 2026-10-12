import React, { useState } from 'react';
import { PurchaseModal } from './CreditPurchase';
export const BannerAd: React.FC = () => {
  const [showPurchase, setShowPurchase] = useState(false);
  return <>
    <section aria-label="Gói sử dụng BioGen AI" className="rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 p-5 text-white shadow-md">
      <h3 className="text-lg font-bold">Dùng thử BioGen AI: tạo 2 đề miễn phí</h3>
      <p className="mt-1 text-sm">Đăng nhập để nhận 2 credit tạo đề. Mua thêm gói 10, 20 hoặc 30 credit; 1 credit = 1 đề.</p>
      <p className="mt-1 text-sm">Câu hỏi lẻ: 3 lượt đầu miễn phí, sau đó 20.000đ / 3 lượt tạo.</p>
      <button className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-bold text-indigo-700" onClick={() => setShowPurchase(true)}>Xem gói & đăng ký mua</button>
    </section>
    {showPurchase && <PurchaseModal onClose={() => setShowPurchase(false)} />}
  </>;
};

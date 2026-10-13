import React from 'react';

export const PaymentHelp: React.FC<{ english?: boolean }> = ({ english = false }) => (
  <details className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
    <summary className="cursor-pointer font-semibold">
      {english ? 'Payment, saved credits & support' : 'Thanh toán, lưu lượt và hỗ trợ'}
    </summary>
    <div className="mt-3 space-y-3 leading-relaxed">
      <p>{english
        ? 'Sign in to the account that will receive the allowance, choose a package and display its QR. Transfer exactly the displayed amount and keep the payment memo unchanged. Each order has its own code; use the QR displayed in your account.'
        : 'Đăng nhập tài khoản cần nhận lượt, chọn gói rồi hiển thị QR. Chuyển đúng số tiền và giữ nguyên nội dung thanh toán. Mỗi đơn có mã riêng; hãy dùng QR được hiển thị trong tài khoản của thầy/cô.'}</p>
      <p>{english
        ? 'When the bank confirmation arrives, the selected allowance is added automatically. Exam credits and individual-question actions are separate. Signing out, changing devices or signing back in preserves the balance; free trials are granted once per account.'
        : 'Khi nhận xác nhận tiền vào từ ngân hàng, hệ thống tự cộng đúng gói. Credit tạo đề và lượt câu hỏi lẻ tính riêng. Đăng xuất, đổi máy hoặc đăng nhập lại vẫn giữ số dư; lượt dùng thử chỉ cấp một lần cho mỗi tài khoản.'}</p>
      <p>{english
        ? 'If your bank has debited the payment but the allowance has not appeared, check the purchase status and keep your receipt. Do not pay again while it is being checked. An incorrect amount, changed memo or duplicate transfer needs support reconciliation.'
        : 'Nếu ngân hàng đã trừ tiền mà chưa thấy lượt, hãy kiểm tra trạng thái mua và giữ biên nhận. Không chuyển lại trong lúc chờ kiểm tra. Chuyển sai số tiền, sửa nội dung hoặc chuyển trùng cần được hỗ trợ đối soát.'}</p>
      <p>{english
        ? 'For payment corrections or a refund request, contact support with the order code, transaction time, amount and receipt. Purchase approval, allowance adjustments and bank refunds are separate actions; a message or receipt alone does not automatically add allowance or refund money.'
        : 'Để xử lý thanh toán sai hoặc đề nghị hoàn tiền, thầy/cô liên hệ hỗ trợ kèm mã yêu cầu, thời gian, số tiền và biên nhận. Điều chỉnh lượt và hoàn tiền qua ngân hàng là hai việc riêng; gửi biên nhận không tự động cộng lượt hoặc hoàn tiền.'}</p>
      <p>{english
        ? 'If generation is interrupted, resume the saved exam or question action. When no question has been generated, the app allows cancellation to return the reserved allowance. If some questions already exist, resume the same run; an allowance refund needs support review.'
        : 'Nếu tạo nội dung bị gián đoạn, hãy tiếp tục đề hoặc lượt đang dở đã lưu. Khi chưa tạo được câu nào, có thể hủy để trả lại lượt đang giữ. Nếu đã có một phần câu hỏi, hãy tiếp tục cùng lượt; việc hoàn lượt cần được hỗ trợ xem xét.'}</p>
      <p>{english ? 'Support: ' : 'Hỗ trợ: '}<a className="font-semibold text-sky-600 underline dark:text-sky-400" href="mailto:ttduy@sgu.edu.vn">ttduy@sgu.edu.vn</a></p>
    </div>
  </details>
);

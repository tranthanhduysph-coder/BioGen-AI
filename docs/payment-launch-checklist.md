# Hoàn thiện thanh toán BioGen AI trên preview

## Trạng thái

- Giá gói, người nhận tiền, hai ví riêng, cấp dùng thử một lần: đã có.
- Receiver SePay xác thực và cộng lượt đúng một lần: đã kiểm thử bằng dữ liệu giả;
  giao dịch thật câu hỏi lẻ đã được tự cộng 3 lượt.
- Backend/QR trên preview đã bật sau cấu hình; SePay gửi thử HMAC đạt HTTP 200.
  Giao dịch thật 20.000đ đã fulfilled, số dư câu hỏi lẻ 3 → 6; credit đề giữ ở 2.
  Gói đề 199.000đ cũng đã fulfilled, credit đề 2 → 12. Không cộng thủ công.
- Chủ tài khoản đã đăng ký gói Free và tự liên kết BIDV qua OTP; đã xác minh
  tài khoản 1410373736 và VA 96247BIOGENAI. Chủ tài khoản đã lưu webhook/secret.
- Chủ sản phẩm đã yêu cầu merge và phát hành chính thức ngày 14/10/2026:
  PR #1 đã merge vào main 9fc8d3a, frontend/backend đã live. Giữ nguyên kho
  credit và receiver thanh toán hiện tại; xem production-launch.md.

## Cấu hình cần nhập trong dashboard

### Giá SePay đã đối chiếu

Ngày 13/10/2026, bảng giá công khai và lựa chọn thanh toán tháng hiển thị:

- Free: 0đ/tháng, 50 giao dịch tiền vào/tháng, có webhook/API.
- Startup: 120.000đ/tháng, 180 giao dịch tiền vào/tháng. Chọn thanh toán năm
  hiển thị mức quy đổi 96.000đ/tháng; đây không phải giá trả từng tháng.
- Cho phép vượt số giao dịch và tính phí vượt. Chưa xác nhận đơn giá vượt cho
  tài khoản của chủ sản phẩm; không suy ra từ đơn giá bình quân của gói.
- Trước đó Techcombank không có trong danh sách 12 ngân hàng hỗ trợ. Chủ sản
  phẩm sau đó chọn BIDV và tự đăng ký Free; dashboard đã hiển thị gói Free.
- Một lần mua gói 30 đề bằng một chuyển khoản là một giao dịch tiền vào, không
  phải 30 giao dịch. SePay định nghĩa tổng giao dịch tiền vào trong tháng; chưa
  xác nhận bộ lọc webhook có loại giao dịch không liên quan khỏi hạn mức hay không.

Không đăng ký gói trả phí. Người nhận tiền đã được chủ sản phẩm đổi sang BIDV.

### Webhook preview

| Mục | Giá trị |
| --- | --- |
| Tên webhook | BioGen AI preview — tiền vào |
| Endpoint | https://biogenai-api-preview.onrender.com/api/payments/sepay/webhook |
| Tài khoản chính | BIDV 1410373736 · TRAN THANH DUY |
| VA nhận tiền trên QR | 96247BIOGENAI, chỉ chọn VA này trong bộ lọc SePay |
| Loại giao dịch | Chỉ tiền vào |
| Định dạng | JSON |
| Xác thực | HMAC-SHA256, secret riêng tối thiểu 32 ký tự |
| Lọc mã | BGP + 20 ký tự chữ/số; mã thực tế dùng hex viết hoa |
| Khi lỗi | Bật gửi lại |
| Chế độ | Live; Test mode dùng endpoint, secret và kho dữ liệu riêng |

Render backend cần `SEPAY_WEBHOOK_AUTH=hmac`, `SEPAY_WEBHOOK_SECRET`,
`SEPAY_BIDV_VA=96247BIOGENAI` và
`AUTOMATIC_PAYMENTS_ENABLED=true` khi kết nối đã kiểm chứng. Không nhập secret
vào chat, repo, frontend hoặc ảnh bằng chứng. Không cần SePay API key để nhận webhook.

Chủ tài khoản đã liên kết API BIDV cá nhân; không dùng SMS hoặc đổi số nhận OTP.
Tiền phải chuyển vào VA để SePay gửi thông báo; tiền vào số tài khoản chính
không được đồng bộ theo phương thức này. Cần xác minh giao dịch 20.000đ vào VA
được ghi nhận cùng đủ nội dung thanh toán, đúng số tiền và đúng trường subAccount.
Secret/webhook đã được kiểm chứng bằng nút Gửi thử trên SePay. Mẫu integer ID 0
chỉ nhận ACK sau HMAC, không gọi ledger hoặc cộng lượt. ID giao dịch thật vẫn
phải là số nguyên dương; không dùng Test mode trên kho credit thật.

## Nghiệm thu tiền thật — hai module đã nhận tiền

Đơn `cff10e13-c49e-4188-8ea4-3d724b983cde` đã được SePay nhận 20.000đ,
giao dịch `89710446`, mã ngân hàng `463D419B-4B94-48C4-9476-3F0346C907A4`.
Log webhook `56784973` đạt HTTP 200; app tự chuyển fulfilled và cộng 3 lượt.
Chủ tài khoản tự chuyển tiền; không dùng quản trị để cộng thay thanh toán.

Đơn đề `78d2621c-818c-47cf-b8f2-b659ef7a2948` đã nhận đúng 199.000đ vào VA,
giao dịch `89824997`, mã ngân hàng `E75B2D65-E0AB-4099-8328-9FC8E0B8EF5B`.
Log `56868123` đạt HTTP 200; checkout tự fulfilled, credit đề 2 → 12.
Ledger thể hiện riêng +10 credit đề và +3 lượt câu hỏi lẻ, mỗi khoản một lần.

Đã đăng xuất và đăng nhập lại, giữ đúng số dư 12 lượt đề / 6 lượt câu lẻ.
Thử AI thật đã gặp Gemini 503/504; sau thao tác hủy của chủ tài khoản, đọc
Firestore xác nhận số dư 12/6, không giữ lượt và không còn lượt đang dở.
Lần thử sau đã tạo thành công một MCQ thật (HTTP 200) và xuất DOCX hợp lệ;
số dư máy chủ 12 lượt đề / 5 lượt câu lẻ, không giữ lượt và không còn công việc dở.
Đã kiểm tra chống trùng trực tiếp trên hai biên nhận thật đã lưu: mỗi biên nhận
lặp 8 lần đồng thời với mọi ghi bị cấm; cả tài khoản giữ nguyên. Đã yêu cầu
SePay phát lại nhưng chưa có log lần gửi mới, nên bước phát lại HTTP từ nhà cung
cấp vẫn chưa chốt. Kiểm thử dữ liệu máy chủ không được gọi là lần gửi HTTP mới.

1. Chủ tài khoản mua gói câu hỏi lẻ qua đơn thật 20.000đ / 3 lượt trên preview.
   Ghi lại mã đơn, số dư trước và sau, mã giao dịch; không đưa dữ liệu thẻ/OTP vào log.
2. Xác nhận đúng tài khoản tăng 3 lượt câu hỏi lẻ; credit đề giữ nguyên.
3. Gửi lại cùng thông báo từ lịch sử SePay: số dư không tăng lần hai.
4. Đăng xuất/đăng nhập lại: giữ đúng số dư. Tạo một lượt để kiểm tra trừ đúng 1.
5. Chủ tài khoản thực hiện một đơn gói đề đã chọn theo giá đã chốt; xác nhận
   chỉ credit đề tăng, không tăng lượt câu hỏi lẻ. Không giảm giá hoặc dùng mã
   Test mode để thay thế giao dịch nghiệm thu.
6. Lưu bằng chứng nhận tiền, trạng thái fulfilled và số dư; không coi một biên
   nhận phía người chuyển hoặc thông báo UI đơn lẻ là nghiệm thu đầy đủ.

## Quy trình hỗ trợ đã đưa vào giao diện

- Người mua chuyển đúng số tiền/nội dung, giữ biên nhận, kiểm tra trạng thái mua.
- Chưa cộng lượt thì không chuyển lại; liên hệ ttduy@sgu.edu.vn với mã đơn,
  thời gian, số tiền và biên nhận để đối soát giao dịch ngân hàng thực tế.
- Sai tiền/mã, chuyển trùng, giao dịch đến đơn đã đóng: quản trị đối soát;
  không cho người dùng tự xác nhận để mở lượt.
- Đề/lượt bị gián đoạn: tiếp tục cùng công việc đã lưu; khi chưa có câu và
  không còn yêu cầu đang chạy thì được hủy để trả lượt đang giữ.
- Hoàn lượt trong ứng dụng không tự động chuyển tiền ngân hàng.

## Chính sách hỗ trợ và hoàn tiền — chủ sản phẩm đã duyệt

Đề xuất: đối soát và xử lý tiền chuyển trùng, chuyển sai gói hoặc thanh toán
đã nhận nhưng hệ thống không cung cấp được lượt. Nếu hoàn tiền, cần xác minh
giao dịch gốc và thu hồi phần lượt tương ứng chưa dùng để tránh vừa hoàn tiền
vừa giữ quyền sử dụng. Chuyển tiền hoàn do chủ tài khoản thực hiện trực tiếp.

Ngày 14/10/2026, chủ sản phẩm duyệt phản hồi 2 ngày làm việc, hoàn tiền 7 ngày
làm việc sau khi đồng ý, tiếp nhận đổi ý trong 7 ngày và đối soát phần mua chưa
sử dụng. PaymentHelp chung trong checkout/hướng dẫn đã triển khai lên preview
tại commit 2d16817. Chi tiết ở payment-policy-draft.md; tên file giữ lại để
không làm mất link chủ sản phẩm đã đọc. Hoàn tiền vẫn do chủ sản phẩm thực
hiện qua ngân hàng, không tự động từ số dư trong ứng dụng.

## Nguồn đối chiếu ngày 13/10/2026

- https://sepay.vn/bang-gia.html
- https://docs.sepay.vn/them-tai-khoan-ngan-hang.html
- https://docs.sepay.vn/ket-noi-bidv.html (đối chiếu thêm ngày 14/10/2026)
- https://developer.sepay.vn/vi/sepay-webhooks/tao-webhook
- https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc
- https://developer.sepay.vn/vi/sepay-webhooks/test-mode/so-sanh-voi-live

# BioGen AI — lựa chọn tên miền và chuẩn bị kết nối

Đối chiếu ngày 14/10/2026. Chủ sản phẩm muốn giữ BioGen AI, ngân sách dưới
1.000.000đ/năm. Đã chuẩn bị đơn biogenai.vn một năm, chưa mua tên miền
hoặc thay đổi DNS/Firebase/production.

## Kết quả tra cứu

| Tên miền | Kết quả tại Mắt Bão | Giá hiển thị |
| --- | --- | --- |
| biogenai.com | Không khả dụng | Không phải tên miền đăng ký thông thường đang trống |
| biogenai.vn | Khả dụng | 550.000đ năm đầu trên trang kết quả tìm kiếm |
| biogenai.app | Khả dụng | 509.000đ năm đầu trên trang kết quả tìm kiếm |

Đề xuất **biogenai.vn** cho sản phẩm phục vụ giáo viên Việt Nam. Bảng giá
công khai .vn ghi tổng năm đầu 558.000đ và tổng năm tiếp theo 458.000đ, trong
khi trang tra cứu hiển thị 550.000đ. Cần xác nhận tổng tiền có thuế tại giỏ hàng
trước thanh toán; không coi giá tra cứu là tổng cuối cùng. Đã xác minh giỏ
hàng: một biogenai.vn trong một năm, 550.000đ trước VAT + 8.000đ VAT =
**558.000đ**. Dịch vụ DNSSEC trả phí tự thêm đã được bỏ khỏi đơn; không chọn
combo tên miền hoặc hosting/email mua thêm. Không thay đổi DNSSEC của một
tên miền đang hoạt động: tên miền này chưa được đăng ký bởi chủ sản phẩm.

Đơn đã đến bước đăng nhập/tạo tài khoản và xác minh chủ thể trên Mắt Bão.
Chủ sản phẩm được bàn giao để tự nhập thông tin, đọc/chấp nhận điều khoản
và thanh toán; chưa có xác nhận đã đăng ký tên miền. Không ghi link đơn riêng,
thông tin định danh hoặc thông tin đăng nhập vào repository. Bằng chứng cục bộ:
`tmp/biogenai-vn-cart.png`.

Porkbun niêm yết .com thông thường 11,08 USD cho đăng ký/gia hạn; .app 8,75 USD
năm đầu và 14,93 USD gia hạn. Tra cứu biogenai.com và biogenai.app tại Porkbun
bị timeout, nên không dùng kết quả đó để kết luận khả dụng hoặc báo giá riêng
của hai tên. Chưa xác minh giá gia hạn .app tại Mắt Bão.

Tình trạng khả dụng có thể thay đổi trước khi mua. Việc đăng ký chủ thể, xác
thực danh tính và chấp nhận điều khoản phải do chủ sở hữu hoàn tất trực tiếp.

## Chuẩn bị kết nối sau khi tên miền thuộc chủ sản phẩm

1. Thêm tên miền đã mua vào dịch vụ frontend production trên Render, không
   chuyển DNS sang bản preview đang nghiệm thu.
2. Dùng các bản ghi DNS mà Render cung cấp cho tên miền đó. Với www dùng
   CNAME về biogenai.onrender.com; tên miền gốc dùng A/ALIAS theo hướng dẫn
   DNS của Render và nhà đăng ký, không đoán địa chỉ IP.
3. Render tự cấp và gia hạn HTTPS sau khi xác minh DNS. Kiểm tra tên miền gốc
   và www, chọn một URL chính và kiểm tra chuyển hướng.
4. Thêm tên miền chính/www sử dụng đăng nhập vào Firebase Authorized domains;
   thêm origin HTTPS thực tế vào CORS_ORIGINS của backend đang phục vụ ứng dụng.
   Giữ API key, webhook secret và tài khoản dịch vụ trên backend.
5. Không cần mua một tên miền riêng cho backend: frontend có thể tiếp tục dùng
   URL API Render. Cần chốt backend/số dư production trước triển khai, giữ số
   dư theo Firebase UID và không cấp lại lượt thử khi đổi tên miền.
6. Giữ URL webhook SePay hiện tại nếu backend không thay đổi; nếu đổi backend,
   kiểm chứng receiver và kho credit trước khi đổi URL webhook đang nhận tiền.
7. Kiểm tra đăng nhập Google, số dư, tạo AI, mua gói và DOCX trên tên miền mới.
   Không tắt URL Render cũ trước khi mọi luồng hoạt động và có đường quay lại.

## Nguồn

- Tra cứu Mắt Bão: https://www.matbao.net/ten-mien/ket-qua-kiem-tra-ten-mien?tenmien=biogenai.vn
- Bảng giá: https://www.matbao.net/ten-mien/bang-gia-ten-mien
- Porkbun: https://porkbun.com/products/domains
- Render: https://render.com/docs/custom-domains

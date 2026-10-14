# BioGen AI — lựa chọn tên miền và chuẩn bị kết nối

Đối chiếu ngày 14/10/2026. Chủ sản phẩm muốn giữ BioGen AI, ngân sách dưới
1.000.000đ/năm. Chủ sản phẩm đã xác nhận mua biogenai.vn một năm.
Đã thêm tên miền vào Render frontend chính; DNS/HTTPS chưa hoàn tất.
Chưa merge main, triển khai bản mới lên production hoặc đổi Firebase.

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

Chủ sản phẩm tự nhập thông tin, đọc/chấp nhận điều khoản và thanh toán,
sau đó xác nhận đã mua tên miền. Không ghi link đơn riêng,
thông tin định danh hoặc thông tin đăng nhập vào repository. Bằng chứng cục bộ:
`tmp/biogenai-vn-cart.png`.

Porkbun niêm yết .com thông thường 11,08 USD cho đăng ký/gia hạn; .app 8,75 USD
năm đầu và 14,93 USD gia hạn. Tra cứu biogenai.com và biogenai.app tại Porkbun
bị timeout, nên không dùng kết quả đó để kết luận khả dụng hoặc báo giá riêng
của hai tên. Chưa xác minh giá gia hạn .app tại Mắt Bão.

Việc đăng ký chủ thể, xác thực danh tính và chấp nhận điều khoản do chủ sở
hữu hoàn tất trực tiếp. Chưa đọc được trạng thái kích hoạt trong tài khoản
nhà đăng ký vì trang quản trị yêu cầu đăng nhập riêng.

## Kết nối tên miền ngày 14/10/2026

- Render đã nhận `biogenai.vn` và tự thêm `www.biogenai.vn` chuyển về miền gốc
  trên static site `srv-d4gliuchg0os73fsqjs0` (`biogenai.onrender.com`).
- Cả hai đang **Waiting for DNS / Waiting for Verification**. Chưa có HTTPS
  được xác minh. Bằng chứng cục bộ: `tmp/biogenai-vn-render-dns.png`.
- Bản ghi Render cung cấp: `www` CNAME `biogenai.onrender.com`; miền gốc
  dùng ALIAS/ANAME cùng đích nếu nhà cung cấp hỗ trợ, nếu không dùng `@` A
  **216.24.57.1**. IP được đọc trực tiếp từ hộp hướng dẫn Render.
- DNS công khai đã trả về `ns1.matbao.vn` và `ns2.matbao.vn`; truy vấn A miền
  gốc chưa trả về địa chỉ, `www` chưa tồn tại. Chưa sửa bản ghi tại Mắt Bão.
- Portal quản trị chính thức: `https://id.axys.group` (trước đây id.matbao.net).
  Đang chờ chủ sở hữu đăng nhập để kiểm tra trạng thái tên miền và cấu hình DNS.
- Frontend chính vẫn chạy `main` commit `3977ed8`; bản đã nghiệm thu nằm ở
  branch feature trên preview. Gắn tên miền không tự đưa bản mới lên main.
- Khi triển khai bản mới cần giữ kho `biogen_preview` đã chứa các giao dịch
  thật và số dư, hoặc chuyển dữ liệu có đối soát trước khi đổi namespace.
  Không cấp lại trial vì đổi URL. Giữ receiver SePay hiện tại nếu dùng cùng
  backend; chuẩn bị Firebase Authorized domains và CORS cho miền mới.

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

# Nailly User Manual

Hướng dẫn này dành cho người dùng demo và người vận hành salon trong Nailly.

## 1. Truy Cập Hệ Thống

Local URLs:

- Public site: http://localhost:3000
- Booking: http://localhost:3000/booking
- Admin login: http://localhost:3000/admin/login

Demo admin accounts:

- Owner: `owner@lumanails.example` / `owner-password`
- Manager: `manager@lumanails.example` / `manager-password`
- Staff: `staff@lumanails.example` / `staff-password`

Quyền truy cập:

- Owner có đầy đủ quyền admin.
- Manager có thể xem dashboard, bookings, services, staff, media và settings.
- Staff chỉ quản lý bookings.

## 2. Public Site

Public site là trang giới thiệu salon cho khách hàng.

Khách hàng có thể:

- Xem tên salon, tagline và thông tin liên hệ.
- Xem danh sách dịch vụ với thời lượng và giá.
- Xem gallery ảnh.
- Xem thông tin staff nếu có data.
- Bấm `Book now` để đi đến booking flow.

Nếu services, gallery hoặc staff chưa có dữ liệu, trang sẽ hiển thị các phần có dữ liệu và bỏ qua phần thiếu để tránh trông như template lỗi.

## 3. Đặt Lịch Cho Khách

Vào http://localhost:3000/booking.

Quy trình đặt lịch:

1. Chọn một hoặc nhiều dịch vụ.
2. Chọn ngày hẹn.
3. Chọn staff nếu khách có yêu cầu, hoặc để `Any available`.
4. Chọn time slot còn trống.
5. Nhập tên, số điện thoại, email tùy chọn, party size và note nếu có.
6. Kiểm tra summary bên cạnh form.
7. Bấm submit để gửi booking request.

Lưu ý:

- Booking mới được tạo với trạng thái `Pending confirmation`.
- Hệ thống vẫn kiểm tra slot ở backend khi submit, nên slot có thể bị từ chối nếu vừa có người khác đặt cùng thời gian.
- Nếu không có slot, thử ngày khác, dịch vụ khác, hoặc bỏ lọc staff.
- Email là tùy chọn, nhưng phone là bắt buộc để salon liên hệ xác nhận.

## 4. Đăng Nhập Admin

Vào http://localhost:3000/admin/login.

Nhập email và password demo. Sau khi login thành công, hệ thống điều hướng về admin area.

Nếu login thất bại:

- Kiểm tra đúng email/password.
- Kiểm tra API đang chạy.
- Nếu local database vừa reset, chạy lại seed demo data theo README.

## 5. Admin Overview

Overview hiển thị các chỉ số nhanh:

- Pending bookings
- Confirmed bookings
- Services
- Staff

Trang này dùng để nắm tổng quan trạng thái salon trong demo. Các thống kê hiện tại là basic counts từ API hiện có.

## 6. Quản Lý Bookings

Vào `Admin > Bookings`.

Bạn có thể:

- Xem customer, phone, ngày, giờ và status.
- Lọc booking theo status: all, pending, confirmed, completed, cancelled.
- Đổi status booking:
  - `Confirm` cho request mới.
  - `Complete` khi lịch đã hoàn tất.
  - `Cancel` khi lịch bị hủy.

Gợi ý vận hành:

- Xử lý `Pending` trước vì đây là request cần salon xác nhận.
- Chỉ set `Completed` sau khi khách đã sử dụng dịch vụ.
- Khi cancel, nên liên hệ khách ngoài hệ thống vì MVP chưa có email/SMS notification.

## 7. Quản Lý Services

Vào `Admin > Services`.

Mỗi service gồm:

- Name
- Description
- Category
- Duration
- Price
- Active flag

Thêm service:

1. Bấm `Add service`.
2. Nhập tên, mô tả, category, duration và price.
3. Giữ `Active` nếu muốn hiển thị trên public booking.
4. Bấm `Create`.

Sửa service:

1. Bấm `Edit` trên service row.
2. Cập nhật thông tin.
3. Bấm `Update`.

Lưu ý:

- Duration tính bằng phút.
- Price lưu theo cents. Ví dụ `5200` hiển thị là `$52.00`.
- Service inactive không nên được dùng cho public booking.

## 8. Quản Lý Staff

Vào `Admin > Staff`.

Bạn có thể tạo và sửa thông tin staff:

- Name
- Title
- Bio
- Active flag
- Service assignments khi tạo mới, nếu endpoint đã cung cấp data assignment.

Thêm staff:

1. Bấm `Add staff`.
2. Nhập name, title và bio.
3. Chọn các services phù hợp nếu form hiển thị service picker.
4. Bấm `Create`.

Sửa staff:

1. Bấm `Edit`.
2. Cập nhật thông tin cơ bản.
3. Bấm `Update`.

Lưu ý:

- Staff inactive không nên được public site hoặc booking flow ưu tiên hiển thị.
- MVP hiện tại ưu tiên thông tin staff cơ bản; phần service assignment phụ thuộc data mà API trả về.

## 9. Quản Lý Media

Vào `Admin > Media`.

Bạn có thể upload ảnh cho:

- Gallery
- Service
- Staff

Upload media:

1. Chọn file ảnh.
2. Nhập alt text ngắn gọn, mô tả nội dung ảnh.
3. Chọn usage: `Gallery`, `Service`, hoặc `Staff`.
4. Bấm `Upload`.

Cập nhật alt text:

1. Tìm media card trong grid.
2. Sửa trường alt text.
3. Rời khỏi field để trigger update.

Lưu ý:

- Chỉ hỗ trợ `jpeg`, `png`, `webp`.
- Alt text nên mô tả ảnh để hỗ trợ accessibility và SEO.
- Ảnh gallery usage `gallery` được public site dùng cho gallery.

## 10. Settings Salon

Vào `Admin > Settings`.

Bạn có thể cập nhật:

- Shop name
- Tagline
- Description
- Phone
- Email
- Address
- Map URL
- SEO title
- SEO description

Sau khi save, public site sẽ đọc thông tin mới. Nếu local cache chưa cập nhật ngay, refresh trang hoặc restart Redis khi đang debug.

## 11. Luồng Vận Hành Đề Xuất

Hằng ngày:

1. Vào `Bookings`.
2. Lọc `Pending`.
3. Xác nhận hoặc hủy request.
4. Cuối ngày, cập nhật booking đã làm thành `Completed`.

Khi thay đổi menu dịch vụ:

1. Vào `Services`.
2. Cập nhật price/duration/active.
3. Mở public booking để kiểm tra service và summary hiển thị đúng.

Khi cập nhật thương hiệu:

1. Upload ảnh mới trong `Media`.
2. Cập nhật `Settings`.
3. Kiểm tra public site trên desktop và mobile.

## 12. Giới Hạn MVP

Nailly hiện là MVP, chưa bao gồm:

- Online payment.
- Customer accounts.
- Email/SMS notification.
- Calendar drag-and-drop.
- Multi-location salon.
- Advanced staff scheduling UI.

Những giới hạn này không phải lỗi vận hành; đây là scope chưa được build.

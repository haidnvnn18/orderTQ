BẢN YÊU CẦU NGHIỆP VỤ (PRD) - HỆ THỐNG MINI ERP ORDER
Dự án: Số hóa quy trình Order hàng Trung Quốc (B2B/Wholesale).
Kiến trúc đề xuất: Next.js + Supabase + Shopify Logic.

1. Quản lý Sản phẩm (Product Management)
Áp dụng logic "Product - Variants" của Shopify.
Product & Variants: Một sản phẩm có thể có nhiều thuộc tính (Size, Màu sắc). Thay vì lưu rời rạc, hệ thống sẽ quản lý theo kiểu: 1 Sản phẩm cha -> Nhiều SKU con (Variant).
Media Gallery: Lưu trữ ảnh gốc từ xưởng + ảnh thực tế khi hàng về. (Tự động nén ảnh để tối ưu tốc độ).
Sourcing Data: Lưu link nhà máy (1688, Taobao), giá tệ gốc, giá dịch (tự động tính theo tỷ giá hiện hành).
SKU Logic: Tự động tạo mã SKU thông minh (VD: VAY-01-RED-90) để phục vụ quét mã QR sau này.
2. Quản lý Đơn hàng (Order Management)
Áp dụng logic "Draft Order" & "Timeline" của Shopify.
Order Workflow: Trạng thái đơn hàng phân cấp rõ ràng:
Draft (Khách mới chốt trên Zalo).
Confirmed (Đã nhận cọc).
Purchased (Đã thanh toán cho xưởng Trung Quốc).
Fulfilled (Hàng đã về kho VN và đang giao).
Order Timeline: Ghi lại mọi lịch sử thay đổi của đơn (Ai tạo, ai đổi trạng thái, ai cập nhật tiền...). Đây là tính năng cực hay của Shopify giúp tránh tranh cãi sau này.
Financial Status: Tách biệt trạng thái thanh toán (Pending, Partially Paid, Paid).
3. Quản lý Khách hàng (Customer CRM)
Áp dụng logic "Customer Profile" của Shopify.
360 View: Xem toàn bộ lịch sử mua hàng, tổng số tiền đã chi, và đặc biệt là Công nợ hiện tại của từng hộ kinh doanh.
Customer Tags: Phân loại khách (VIP, Khách mới, Khách hay hủy đơn) để có chính sách cọc khác nhau.
4. Quản lý Nhà máy (Supplier/Factory)
Logic mở rộng (Shopify thường dùng qua App như Stocky).
Supplier Directory: Danh bạ xưởng kèm đánh giá uy tín (dựa trên tốc độ giao hàng và tỷ lệ hàng lỗi trong quá khứ).
Price History: Theo dõi biến động giá của cùng một mẫu mã qua các lần đặt khác nhau.
5. Quản lý Vận chuyển & Logistics (Shipping)
Áp dụng logic "Fulfillment & Tracking" của Shopify.
Tracking ID Tracking: Theo dõi mã vận đơn từ Trung Quốc về kho VN.
Package Consolidation: Gom nhiều mã vận đơn nhỏ thành một kiện hàng lớn gửi về cho khách.
Shipping Fee Engine: Tự động tính phí vận chuyển dựa trên cân nặng hoặc thể tích theo cấu hình có sẵn.
6. Thống kê & Báo cáo (Analytics)
Profit & Loss (P&L): Báo cáo lãi lỗ thực tế sau khi đã trừ phí ship, phí dịch vụ và biến động tỷ giá.
Inventory Forecast: Thống kê các mẫu mã đang "hot" dựa trên số lượng khách sỉ đặt nhiều.
7. Global Search (Search Everything)
Áp dụng logic "Command Palette" của Shopify.
Một thanh tìm kiếm duy nhất ở trên cùng. Gõ mã đơn, số điện thoại khách, mã vận đơn hay tên sản phẩm đều phải ra kết quả ngay lập tức (Real-time search với Supabase).
8. Khả năng kết nối API & Bảo mật
Webhooks: Cho phép nhận dữ liệu từ các bên khác (VD: Khi có biến động số dư ngân hàng, hệ thống tự động cập nhật trạng thái đơn).
Security: Phân quyền người dùng (Role-based Access Control). Bạn của bạn có toàn quyền, nhân viên (nếu có sau này) chỉ thấy phần soạn hàng.
Data Encryption: Đảm bảo link ảnh và thông tin khách hàng không bị lộ ra ngoài.
9. Import/Export Dữ liệu
Bulk Actions: Cho phép Import toàn bộ file Google Sheets hiện tại vào hệ thống để không phải nhập lại từ đầu.
Export: Xuất hóa đơn đẹp (dạng ảnh hoặc PDF) để gửi Zalo cho khách sỉ đối soát.


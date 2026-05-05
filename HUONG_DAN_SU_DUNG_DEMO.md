# Hướng Dẫn Sử Dụng & Trải Nghiệm Hệ Thống OrderTQ (Bản Demo)
Tài liệu này cung cấp hướng dẫn cơ bản cùng các Case Study thực tế để bạn có thể trải nghiệm trọn vẹn các tính năng của hệ thống.

---

## 1. Tổng quan các Phân hệ chính

Hệ thống được thiết kế theo luồng nghiệp vụ thực tế, bao gồm các module:
- **Khách hàng (Customers):** Quản lý thông tin đối tác/khách hàng mua sỉ.
- **Sản phẩm (Products):** Quản lý danh mục hàng hóa (không quản lý tồn kho có sẵn vì hệ thống thiết kế theo mô hình *Made-to-Order* - khách đặt mới bắt đầu đi nhập).
- **Đơn hàng (Orders):** Nơi tạo đơn hàng khi khách yêu cầu, ghi nhận các khoản thanh toán/đặt cọc.
- **Đơn đặt hàng TQ (China POs):** Gom các sản phẩm khách vừa đặt để lên một đơn đặt hàng lớn với nhà cung cấp bên Trung Quốc.
- **Lô hàng vận chuyển (Shipment Batches):** Theo dõi các kiện hàng vận chuyển từ kho Trung Quốc về Việt Nam.
- **Giao hàng (Deliveries):** Xử lý giao hàng từ kho Việt Nam đến tay khách hàng.

---

## 2. Hướng dẫn sử dụng cơ bản (Case Study)

Để hiểu rõ cách hệ thống hoạt động, chúng ta sẽ đi qua 2 Case Study tiêu biểu thường gặp nhất.

### Case Study 1: Luồng đặt hàng và giao hàng cơ bản 

**Ngữ cảnh:** Khách hàng "Nguyễn Văn A" muốn đặt 100 áo thun. Bạn cần lên đơn, thu tiền cọc, đặt hàng bên TQ, theo dõi hàng về và xuất kho giao cho khách.

**Các bước thực hiện:**

1. **Tạo dữ liệu cơ sở (Nếu chưa có):**
   - Vào menu **Khách hàng** -> Bấm **Tạo mới** -> Nhập thông tin "Nguyễn Văn A" -> Lưu lại.
   - Vào menu **Sản phẩm** -> Bấm **Tạo mới** -> Tạo sản phẩm "Áo thun" và thêm các biến thể (Màu sắc, Size, Giá bán) -> Lưu lại.

2. **Tạo Đơn hàng cho khách (Order):**
   - Vào menu **Đơn hàng** -> Bấm **Tạo đơn hàng mới**.
   - Chọn khách hàng "Nguyễn Văn A".
   - Bấm **Thêm sản phẩm**, chọn "Áo thun", điền số lượng 100.
   - Lưu đơn hàng. Lúc này đơn hàng ở trạng thái **DRAFT** (Nháp) hoặc **PENDING** (Chờ xử lý).

3. **Ghi nhận thanh toán / Tiền cọc:**
   - Trong trang chi tiết đơn hàng vừa tạo, tìm tab **Thanh toán**.
   - Thêm giao dịch thanh toán (ví dụ khách cọc 50% tiền hàng).
   - Trạng thái tài chính của đơn sẽ tự động cập nhật thành **PARTIALLY_PAID** (Đã thanh toán một phần).

4. **Lên đơn đặt hàng Trung Quốc (China PO):**
   - Vào menu **China POs** (Đơn đặt hàng TQ).
   - Bạn sẽ thấy 100 áo thun của khách đang ở trạng thái chờ đặt hàng.
   - Chọn các mặt hàng này và bấm **Tạo PO**.
   - Điền thông tin nhà cung cấp và mã đơn vận nội địa TQ (nếu có). Trạng thái sản phẩm trong đơn của khách sẽ tự động chuyển sang đang đặt/sản xuất.

5. **Theo dõi Hàng về Việt Nam (Shipment Batches):**
   - Khi nhà cung cấp TQ giao hàng đến kho TQ và bắt đầu chuyển về VN, bạn vào menu **Shipment Batches**.
   - Bấm **Tạo Lô hàng mới**, điền mã vận đơn kiện hàng (Tracking number).
   - Quét/chọn 100 áo thun đang về vào lô hàng này.
   - Khi hàng cập bến kho VN, cập nhật trạng thái Lô hàng thành **ARRIVED_VN** (Đã đến VN). Trạng thái đơn của "Nguyễn Văn A" sẽ tự động nhận biết là hàng đã về kho.

6. **Giao hàng cho khách (Delivery):**
   - Vào menu **Deliveries** (hoặc thao tác trực tiếp từ màn hình Đơn hàng của khách).
   - Chọn tạo **Phiếu giao hàng**. Chọn 100 áo thun đã về kho và ghi chú mã vận đơn của các bên giao hàng (GHTK, Viettel Post...).
   - Khi khách báo đã nhận được hàng, cập nhật trạng thái phiếu giao. Đơn hàng hoàn tất quy trình!

---

### Case Study 2: Giao hàng nhiều đợt (Hàng về lẻ tẻ)

**Ngữ cảnh:** Khách hàng đặt 200 sản phẩm. Tuy nhiên xưởng TQ gửi làm 2 đợt (đợt 1 gửi 100 cái, tuần sau gửi 100 cái). Bạn cũng giao cho khách VN làm 2 đợt để khách có hàng bán trước.

**Các bước thực hiện:**

1. **Tạo Đơn hàng & Đặt hàng TQ:** Làm tương tự bước 1 -> 4 của Case Study 1 với số lượng 200.
2. **Hàng về đợt 1:**
   - Trong menu **Shipment Batches**, tạo Lô hàng đợt 1.
   - Lúc chọn sản phẩm cho lô, hệ thống cho phép tách số lượng. Bạn chỉ chọn đúng 100/200 sản phẩm cho lô này.
   - Cập nhật Lô đợt 1 về tới VN. Lúc này đơn hàng của khách sẽ ở trạng thái **Giao hàng một phần** (PARTIAL_FULFILLMENT).
3. **Giao đợt 1 cho khách:**
   - Vào **Deliveries**, tạo Phiếu giao hàng. Bạn chỉ có thể xuất kho tối đa 100 sản phẩm (vì mới chỉ có 100 cái về kho VN). Tiến hành giao bình thường.
4. **Hàng về đợt 2 & Giao đợt 2:**
   - Tạo Lô hàng đợt 2 cho 100 sản phẩm còn lại khi xưởng TQ gửi nốt.
   - Khi Lô đợt 2 về VN, tiếp tục tạo Phiếu giao hàng thứ 2 cho khách.
   - Khi tất cả các phiếu giao hàng hoàn tất, hệ thống sẽ tự động cập nhật trạng thái Đơn hàng tổng thành **COMPLETED** (Đã hoàn thành).

---

## 3. Các lưu ý quan trọng khi dùng Demo

- **Không cần đổi trạng thái thủ công:** Hệ thống tự động đồng bộ. Bạn không cần đổi trạng thái đơn hàng bằng tay. Cứ thao tác theo luồng thực tế (ghi nhận tiền, gom hàng lên tàu, giao hàng...), trạng thái tổng sẽ tự động tính toán hợp lý.
- **Theo dõi Timeline:** Mỗi đơn hàng đều có phần "Lịch sử hoạt động" (Timeline) chi tiết. Hãy để ý phần này vì nó lưu vết lại mọi thao tác: Ai làm gì, đổi trạng thái lúc nào, hàng đang nằm ở lô vận chuyển nào.
- **Mô hình Order:** Hệ thống này chuyên cho bán sỉ order. Đừng cố tìm tính năng "Nhập sẵn kho rồi mới bán". Luồng chuẩn ở đây là: **Khách đặt -> Lên đơn tổng -> Đặt hàng TQ -> Hàng về tới đâu giao tới đó**.

---



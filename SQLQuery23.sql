USE WEB_BAN_AO_QUAN;
GO

-- Xóa dữ liệu cũ để tránh lỗi trùng lặp khi chạy lại
DELETE FROM Payments;
DELETE FROM OrderTracking;
DELETE FROM OrderDetails;
DELETE FROM Orders;
DELETE FROM Cart;
DELETE FROM Addresses;
DELETE FROM Customers;
GO

-- 1. Chèn khách hàng (Mã KHXXXX)
INSERT INTO Customers (user_id, full_name, email, phone, password, membership_level, total_points)
VALUES 
('KH0001', N'Nguyễn Văn A', 'vana@gmail.com', '0901234567', 'pass123', N'Bạc', 0),
('KH0002', N'Trần Thị Bích', 'bich.tran@yahoo.com', '0912345678', 'pass456', N'Vàng', 1500),
('KH0003', N'Lê Văn Cường', 'cuong.le@gmail.com', '0988888888', 'pass789', N'Kim cương', 5000);

-- 2. Chèn địa chỉ (Liên kết với KH0001 và KH0002)
INSERT INTO Addresses (user_id, receiver_name, receiver_phone, address_detail, address_type, is_default)
VALUES 
('KH0001', N'Nguyễn Văn A', '0901234567', N'Số 123 Lê Duẩn, Đà Nẵng', N'Nhà riêng', 1),
('KH0002', N'Trần Thị Bích', '0912345678', N'99 Tô Hiến Thành, Hà Nội', N'Cơ quan', 1);

-- 3. Chèn giỏ hàng (Giả sử variant_id 101, 102 đã tồn tại trong bảng sản phẩm)
INSERT INTO Cart (user_id, variant_id, quantity)
VALUES 
('KH0001', 101, 2),
('KH0001', 105, 1);

-- 4. Chèn đơn hàng (Mã DHXXXX)
INSERT INTO Orders (order_id, user_id, total_price, discount_amount, shipping_method, payment_method, status)
VALUES 
('DH0001', 'KH0001', 500000, 0, N'Giao hàng nhanh', N'Thanh toán online', N'Hoàn thành'),
('DH0002', 'KH0002', 2000000, 100000, N'Tiêu chuẩn', N'Thanh toán khi nhận hàng', N'Đang giao');

-- 5. Chèn chi tiết đơn hàng
INSERT INTO OrderDetails (order_id, variant_id, quantity, unit_price)
VALUES 
('DH0001', 101, 2, 250000),
('DH0002', 202, 4, 500000);

-- 6. Chèn theo dõi đơn hàng
INSERT INTO OrderTracking (order_id, status_update, location_lat_long)
VALUES 
('DH0001', N'Đơn hàng đã được giao thành công', '16.0471, 108.2062'),
('DH0002', N'Đang rời kho tổng Hà Nội', '21.0285, 105.8542');

-- 7. Chèn thanh toán (payment_id tự tăng)
INSERT INTO Payments (order_id, payment_method, payment_status, transaction_id, amount_paid)
VALUES 
('DH0001', N'Thanh toán online', N'Đã thanh toán', 'VNP12345678', 500000),
('DH0002', N'Thanh toán khi nhận hàng', N'Chưa thanh toán', NULL, 1900000);
GO

-- Kiểm tra dữ liệu
SELECT * FROM Customers;
SELECT * FROM Orders;
SELECT * FROM Payments;
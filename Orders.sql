CREATE TABLE Orders (
    order_id VARCHAR(20) PRIMARY KEY, -- Ví dụ: DH0001
    user_id VARCHAR(20) NOT NULL, 
    
    order_date DATETIME DEFAULT GETDATE(), -- Ngày đặt hàng
    
    total_price DECIMAL(18, 2) NOT NULL, -- Tổng tiền tạm tính
    discount_amount DECIMAL(18, 2) DEFAULT 0, -- Giảm giá từ hạng Bạc/Vàng/Kim cương
    
    final_price AS (total_price - discount_amount) PERSISTED, 
    
    shipping_method NVARCHAR(100), -- Nhanh hoặc Tiêu chuẩn
    payment_method NVARCHAR(100), -- COD hoặc Online
    
    -- Trạng thái đơn hàng
    status NVARCHAR(50) DEFAULT N'Chờ xác nhận' 
        CHECK (status IN (N'Chờ xác nhận', N'Đang chuẩn bị', N'Đang giao', N'Hoàn thành', N'Hủy')),
    
    -- Khóa ngoại kết nối với bảng Customers
    CONSTRAINT fk_order_customer FOREIGN KEY (user_id) 
        REFERENCES Customers(user_id)
);
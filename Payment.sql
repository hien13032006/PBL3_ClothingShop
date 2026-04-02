CREATE TABLE Payments (
    payment_id INT IDENTITY(1,1) PRIMARY KEY,
   
    order_id VARCHAR(20) NOT NULL, 
    
    -- Phương thức thanh toán 
    payment_method NVARCHAR(100) DEFAULT N'Thanh toán khi nhận hàng'
        CHECK (payment_method IN (N'Thanh toán khi nhận hàng', N'Thanh toán online')),
    
    -- Trạng thái thanh toán
    payment_status NVARCHAR(50) DEFAULT N'Chưa thanh toán'
        CHECK (payment_status IN (N'Chưa thanh toán', N'Đang xử lý', N'Đã thanh toán', N'Thất bại')),
    
    transaction_id NVARCHAR(100) NULL, -- Mã giao dịch từ cổng thanh toán online (nếu có)
    payment_date DATETIME DEFAULT GETDATE(), -- Ngày thực hiện thanh toán
    amount_paid DECIMAL(18, 2) NOT NULL, -- Số tiền thực tế đã thanh toán

    -- Khai báo khóa ngoại đồng bộ với bảng Orders
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) 
        REFERENCES Orders(order_id) ON DELETE CASCADE
);
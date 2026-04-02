CREATE TABLE OrderDetails (
    order_detail_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id VARCHAR(20) NOT NULL, 
    
    variant_id INT NOT NULL, -- Liên kết tới biến thể sản phẩm (Màu/Size)
    quantity INT NOT NULL CHECK (quantity > 0), -- Đảm bảo số lượng luôn lớn hơn 0
    
    -- Giá tại thời điểm mua để bảo toàn dữ liệu lịch sử
    unit_price DECIMAL(18, 2) NOT NULL, 
    
    -- Cột thành tiền tự động (tùy chọn thêm để dễ truy vấn)
    line_total AS (quantity * unit_price),
    
    -- Khai báo khóa ngoại
    CONSTRAINT fk_detail_order FOREIGN KEY (order_id) 
        REFERENCES Orders(order_id) ON DELETE CASCADE
    
    -- Sau này khi bạn tạo bảng ProductVariants, hãy mở comment dòng dưới:
    -- CONSTRAINT fk_detail_variant FOREIGN KEY (variant_id) REFERENCES ProductVariants(variant_id)
);
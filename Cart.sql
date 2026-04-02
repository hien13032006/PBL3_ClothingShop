CREATE TABLE Cart (
    cart_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL, 
    
    variant_id INT NOT NULL, -- Liên kết với biến thể (Màu/Size) cụ thể 
    quantity INT NOT NULL CHECK (quantity > 0), -- Số lượng thêm vào giỏ 
    added_at DATETIME DEFAULT GETDATE(), -- Thời điểm thêm vào giỏ
    
    -- Khai báo khóa ngoại
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) 
        REFERENCES Customers(user_id) ON DELETE CASCADE
    
    -- Khi bạn tạo bảng ProductVariants, hãy mở comment dòng dưới:
    -- CONSTRAINT fk_cart_variant FOREIGN KEY (variant_id) 
    --     REFERENCES ProductVariants(variant_id) ON DELETE CASCADE
);
CREATE TABLE OrderTracking (
    tracking_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id VARCHAR(20) NOT NULL, 
    
    status_update NVARCHAR(100), -- Ví dụ: N'Đã xuất kho', N'Đang đến kho Đà Nẵng'
    updated_at DATETIME DEFAULT GETDATE(),
    
    -- Dùng để mô phỏng tọa độ trên Map nếu cần
    location_lat_long NVARCHAR(100), 
    
    -- Thêm ON DELETE CASCADE để khi xóa đơn hàng thì lịch sử hành trình cũng mất theo
    CONSTRAINT fk_tracking_order FOREIGN KEY (order_id) 
        REFERENCES Orders(order_id) ON DELETE CASCADE
);
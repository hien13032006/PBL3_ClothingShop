CREATE TABLE Addresses (
    address_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL, 
    
    receiver_name NVARCHAR(255) NOT NULL,
    receiver_phone VARCHAR(15) NOT NULL,
    address_detail NVARCHAR(MAX) NOT NULL,
    address_type NVARCHAR(50) DEFAULT N'Nhà riêng', -- Nhà riêng / Cơ quan 
    is_default BIT DEFAULT 0, -- 1 là mặc định, 0 là không

    -- Khai báo khóa ngoại trỏ tới bảng Customers
    CONSTRAINT fk_customer_address FOREIGN KEY (user_id) 
        REFERENCES Customers(user_id) ON DELETE CASCADE
);
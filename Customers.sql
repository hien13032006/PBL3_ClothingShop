CREATE TABLE Customers (
    user_id VARCHAR(20) PRIMARY KEY, -- Định dạng KH0001
    full_name NVARCHAR(255) DEFAULT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE DEFAULT NULL,
    password VARCHAR(255) NOT NULL,
    provider NVARCHAR(50) DEFAULT N'Local',
    membership_level NVARCHAR(50) DEFAULT N'Bạc' 
        CHECK (membership_level IN (N'Bạc', N'Vàng', N'Kim cương')),
    total_points INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);
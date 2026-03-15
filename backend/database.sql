CREATE DATABASE IF NOT EXISTS football_pitch_db;
USE football_pitch_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pitches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    address VARCHAR(255) DEFAULT '',
    pitch_type ENUM('5', '7', '11') DEFAULT '5',
    price_per_hour DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pitch_id INT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pitch_id) REFERENCES pitches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    method VARCHAR(50) DEFAULT 'momo',
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Dữ liệu mẫu (Seed data)
INSERT INTO pitches (name, description, pitch_type, price_per_hour, image_url) VALUES 
('Sân cỏ nhân tạo 1', 'Sân chất lượng cao, có đèn sương mù', '5', 200000.00, 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55'),
('Sân cỏ nhân tạo 2', 'Sân mới thay thảm', '5', 250000.00, 'https://images.unsplash.com/photo-1518605368461-1ee18cd30f60'),
('Sân tiêu chuẩn', 'Dành cho đội 7 người', '7', 400000.00, 'https://images.unsplash.com/photo-1459865264687-595d652de67e');

const mysql = require('mysql2/promise');
require('dotenv').config();

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  console.log('Ket noi MySQL thanh cong!');

  await connection.query('CREATE DATABASE IF NOT EXISTS football_pitch_db');
  await connection.query('USE football_pitch_db');
  console.log('Database football_pitch_db da san sang');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100),
      phone VARCHAR(20),
      role ENUM('customer', 'admin') DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Bang users da tao');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS pitches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      pitch_type ENUM('5', '7', '11') DEFAULT '5',
      price_per_hour DECIMAL(10, 2) NOT NULL,
      image_url VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Bang pitches da tao');

  await connection.query(`
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
    )
  `);
  console.log('Bang bookings da tao');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
      method VARCHAR(50) DEFAULT 'momo',
      transaction_id VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);
  console.log('Bang payments da tao');

  const [rows] = await connection.query('SELECT COUNT(*) as count FROM pitches');
  if (rows[0].count === 0) {
    await connection.query(`
      INSERT INTO pitches (name, description, pitch_type, price_per_hour, image_url) VALUES 
      ('San co nhan tao 1', 'San chat luong cao, co den suong mu', '5', 200000.00, 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55'),
      ('San co nhan tao 2', 'San moi thay tham', '5', 250000.00, 'https://images.unsplash.com/photo-1518605368461-1ee18cd30f60'),
      ('San tieu chuan', 'Danh cho doi 7 nguoi', '7', 400000.00, 'https://images.unsplash.com/photo-1459865264687-595d652de67e')
    `);
    console.log('Da them 3 san bong mau');
  } else {
    console.log('Da co du lieu san bong, bo qua seed');
  }

  await connection.end();
  console.log('Hoan tat! Database da san sang.');
}

seed().catch(err => {
  console.error('Loi:', err.message);
  if (err.message.includes('Access denied')) {
    console.error('Hay kiem tra mat khau MySQL trong file .env (DB_PASSWORD)');
  }
  process.exit(1);
});

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const crypto = require('crypto');

// Hàm băm mật khẩu đơn giản bằng SHA256
const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

// Đăng ký (Register)
router.post('/register', async (req, res) => {
    try {
        const { username, password, full_name, phone } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Thiếu username hoặc password!' });
        }

        const hashedPassword = hashPassword(password);

        // Kiểm tra xem user tồn tại chưa
        const [existing] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Tài khoản đã tồn tại!' });
        }

        const [result] = await db.query(
            'INSERT INTO users (username, password_hash, full_name, phone) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, full_name, phone]
        );

        res.status(201).json({ success: true, message: 'Đăng ký thành công!', userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Đăng nhập (Login)
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = hashPassword(password);

        const [users] = await db.query(
            'SELECT id, username, full_name, phone, role FROM users WHERE username = ? AND password_hash = ?',
            [username, hashedPassword]
        );

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không đúng!' });
        }

        res.json({ success: true, message: 'Đăng nhập thành công', user: users[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Cập nhật thông tin cá nhân
router.put('/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, full_name, phone, current_password, new_password } = req.body;

        if (!current_password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu hiện tại để xác nhận!' });
        }

        // Lấy user hiện tại
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }

        const user = users[0];

        // Kiểm tra mật khẩu hiện tại
        const hashedCurrent = hashPassword(current_password);
        if (hashedCurrent !== user.password_hash) {
            return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng!' });
        }

        // Nếu có truyền mật khẩu mới thì băm nó
        let finalPasswordHash = user.password_hash;
        if (new_password && new_password.trim() !== '') {
            finalPasswordHash = hashPassword(new_password);
        }

        // Nếu người dùng đổi username, kiểm tra xem đã tồn tại chưa
        let finalUsername = user.username;
        if (username && username.trim() !== '' && username !== user.username) {
            const [exist] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
            if (exist.length > 0) {
                return res.status(400).json({ success: false, message: 'Tên đăng nhập này đã được sử dụng!' });
            }
            finalUsername = username.trim();
        }

        // Cập nhật Database
        await db.query(
            'UPDATE users SET username = ?, full_name = ?, phone = ?, password_hash = ? WHERE id = ?',
            [finalUsername, full_name, phone, finalPasswordHash, id]
        );

        // Trả về dữ liệu mới để cập nhật Frontend Context
        const [updatedUsers] = await db.query(
            'SELECT id, username, full_name, phone, role FROM users WHERE id = ?',
            [id]
        );

        res.json({ success: true, message: 'Cập nhật thông tin thành công!', user: updatedUsers[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;

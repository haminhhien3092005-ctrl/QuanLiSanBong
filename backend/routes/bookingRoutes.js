const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Kiểm tra giờ trống của sân trong 1 ngày
router.get('/availability', async (req, res) => {
    try {
        const { pitch_id, date } = req.query; // date: YYYY-MM-DD
        if (!pitch_id || !date) {
            return res.status(400).json({ success: false, message: 'Thiếu pitch_id hoặc date' });
        }

        const [bookings] = await db.query(
            'SELECT start_time, end_time FROM bookings WHERE pitch_id = ? AND booking_date = ? AND status != "cancelled"',
            [pitch_id, date]
        );

        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Tạo một booking mới
router.post('/', async (req, res) => {
    try {
        const { user_id, pitch_id, booking_date, start_time, end_time, total_amount } = req.body;

        if (!user_id || !pitch_id || !booking_date || !start_time || !end_time || !total_amount) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin đặt sân' });
        }

        // Kiểm tra xem giờ này đã có ai đặt chưa
        const [existing] = await db.query(
            'SELECT * FROM bookings WHERE pitch_id = ? AND booking_date = ? AND status != "cancelled" AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?))',
            [pitch_id, booking_date, end_time, start_time, start_time, end_time]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Giờ này đã có người đặt, vui lòng chọn giờ khác' });
        }

        const [result] = await db.query(
            'INSERT INTO bookings (user_id, pitch_id, booking_date, start_time, end_time, total_amount) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, pitch_id, booking_date, start_time, end_time, total_amount]
        );

        res.status(201).json({ success: true, message: 'Đặt sân thành công!', bookingId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Lấy lịch sử đặt sân của user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [bookings] = await db.query(
            `SELECT b.*, p.name as pitch_name, p.image_url 
             FROM bookings b JOIN pitches p ON b.pitch_id = p.id 
             WHERE b.user_id = ? ORDER BY b.created_at DESC`,
            [userId]
        );

        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// --- ADMIN ENDPOINTS ---

// Lấy tất cả danh sách đặt sân (Dành cho Admin)
router.get('/admin/all', async (req, res) => {
    try {
        const [bookings] = await db.query(
            `SELECT b.*, p.name as pitch_name, u.full_name as user_name, u.phone
             FROM bookings b 
             JOIN pitches p ON b.pitch_id = p.id 
             JOIN users u ON b.user_id = u.id
             ORDER BY b.created_at DESC`
        );
        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Thống kê doanh thu (Dành cho Admin)
router.get('/admin/revenue', async (req, res) => {
    try {
        // Tổng doanh thu (chỉ tính những đơn 'confirmed')
        const [[{ total_revenue }]] = await db.query(
            'SELECT SUM(total_amount) as total_revenue FROM bookings WHERE status = "confirmed"'
        );

        // Số lượng đơn mỗi trạng thái
        const [statusCounts] = await db.query(
            'SELECT status, COUNT(*) as count FROM bookings GROUP BY status'
        );

        res.json({ 
            success: true, 
            data: {
                total_revenue: total_revenue || 0,
                status_counts: statusCounts
            } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Cập nhật trạng thái đơn (Dành cho Admin)
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        await db.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// [ADMIN] Xoá đơn đặt sân
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Xoá payment liên quan trước (nếu có)
        await db.query('DELETE FROM payments WHERE booking_id = ?', [id]);

        const [result] = await db.query('DELETE FROM bookings WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt sân' });
        }
        res.json({ success: true, message: 'Xoá đơn đặt sân thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;

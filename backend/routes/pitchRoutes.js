const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Lấy danh sách toàn bộ sân bóng
router.get('/', async (req, res) => {
    try {
        const [pitches] = await db.query('SELECT * FROM pitches');
        res.json({ success: true, data: pitches });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Lấy chi tiết một sân bóng
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [pitches] = await db.query('SELECT * FROM pitches WHERE id = ?', [id]);
        
        if (pitches.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sân bóng' });
        }
        res.json({ success: true, data: pitches[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// [ADMIN] Cập nhật sân
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, address, pitch_type, price_per_hour, image_url } = req.body;
        
        await db.query(
            'UPDATE pitches SET name=?, description=?, address=?, pitch_type=?, price_per_hour=?, image_url=? WHERE id=?',
            [name, description, address || '', pitch_type, price_per_hour, image_url, id]
        );
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// [ADMIN] Thêm sân mới
router.post('/', async (req, res) => {
    try {
        const { name, description, address, pitch_type, price_per_hour, image_url } = req.body;

        if (!name || !price_per_hour) {
            return res.status(400).json({ success: false, message: 'Tên sân và giá là bắt buộc!' });
        }

        const [result] = await db.query(
            'INSERT INTO pitches (name, description, address, pitch_type, price_per_hour, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description || '', address || '', pitch_type || '5', price_per_hour, image_url || '']
        );
        res.status(201).json({ success: true, message: 'Thêm sân thành công!', pitchId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// [ADMIN] Xoá sân
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM pitches WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sân để xoá' });
        }
        res.json({ success: true, message: 'Xoá sân thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;

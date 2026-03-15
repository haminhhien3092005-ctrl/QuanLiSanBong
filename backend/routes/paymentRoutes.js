const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const db = require('../config/db');

// Thông tin cấu hình từ biến môi trường
const partnerCode = process.env.MOMO_PARTNER_CODE;
const accessKey = process.env.MOMO_ACCESS_KEY;
const secretKey = process.env.MOMO_SECRET_KEY;
const endpoint = process.env.MOMO_API_ENDPOINT;

router.post('/create_payment', async (req, res) => {
    try {
        const { bookingId, amount } = req.body;

        if (!bookingId || !amount) {
            return res.status(400).json({ success: false, message: 'Thiếu bookingId hoặc amount' });
        }

        const orderInfo = `Thanh toán đặt sân mã ${bookingId}`;
        const redirectUrl = "http://localhost:5000/api/payments/momo_return"; // Dùng để chuyển hướng web, app thì dùng app scheme
        const ipnUrl = "http://localhost:5000/api/payments/momo_ipn";
        const requestType = "captureWallet";
        const extraData = "";
        const orderGroupId = "";
        const autoCapture = true;
        const lang = "vi";

        const orderId = partnerCode + new Date().getTime();
        const requestId = orderId;

        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        const signature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = {
            partnerCode,
            partnerName: "Test",
            storeId: "MomoTestStore",
            requestId,
            amount: amount,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: redirectUrl,
            ipnUrl: ipnUrl,
            lang: lang,
            requestType: requestType,
            autoCapture: autoCapture,
            extraData: extraData,
            orderGroupId: orderGroupId,
            signature: signature
        };

        const response = await axios.post(endpoint, requestBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // insert vào mảng payments
        await db.query(
            'INSERT INTO payments (booking_id, amount, status, method, transaction_id) VALUES (?, ?, ?, ?, ?)',
            [bookingId, amount, 'pending', 'momo', orderId]
        );

        res.json({ success: true, payUrl: response.data.payUrl });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Lỗi tạo thanh toán MoMo' });
    }
});

// URL nhận IPN từ MoMo để cập nhật trạng thái thanh toán
router.post('/momo_ipn', async (req, res) => {
    console.log("MoMo IPN:", req.body);
    try {
        const { orderId, resultCode, message } = req.body;
        // Bỏ qua bước kiểm tra signature trong demo cho ngắn gọn
        
        const status = resultCode === 0 ? 'success' : 'failed';
        await db.query('UPDATE payments SET status = ? WHERE transaction_id = ?', [status, orderId]);
        
        if (status === 'success') {
             // Lấy booking_id
             const [payment] = await db.query('SELECT booking_id FROM payments WHERE transaction_id = ?', [orderId]);
             if (payment.length > 0) {
                 await db.query('UPDATE bookings SET status = "confirmed" WHERE id = ?', [payment[0].booking_id]);
             }
        }

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

// URL nhận Redirect từ MoMo sau khi thanh toán xong trên web
router.get('/momo_return', async (req, res) => {
    try {
        const { orderId, resultCode } = req.query;
        
        // Vì localhost không nhận được IPN (Webhook), chúng ta sẽ lợi dụng Return URL để cập nhật DB cho môi trường Test
        if (resultCode && resultCode === '0') {
             await db.query('UPDATE payments SET status = "success" WHERE transaction_id = ?', [orderId]);
             
             const [payment] = await db.query('SELECT booking_id FROM payments WHERE transaction_id = ?', [orderId]);
             if (payment.length > 0) {
                 await db.query('UPDATE bookings SET status = "confirmed" WHERE id = ?', [payment[0].booking_id]);
             }

             res.send(`
                <html>
                    <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            body { font-family: Arial; text-align: center; padding: 50px; background: #fdf2f8;}
                            .box { background: white; padding: 30px; border-radius: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                            h2 { color: #d82d8b; }
                            p { color: #4b5563; font-size: 16px; }
                        </style>
                    </head>
                    <body>
                        <div class="box">
                            <h2>✅ Thanh toán thành công!</h2>
                            <p>Đơn đặt sân của bạn đã được xác nhận tiền.</p>
                            <p>Bạn có thể tắt trình duyệt và quay lại ứng dụng <b>Quản Lý Sân Bóng</b> để kiểm tra Lịch Sử ngay bây giờ.</p>
                        </div>
                    </body>
                </html>
             `);
        } else {
             res.send('<h2>Thanh toán thất bại hoặc đã bị huỷ</h2><p>Vui lòng thử lại trong ứng dụng.</p>');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi máy chủ');
    }
});

// --- Fake Payment (Không dùng MoMo) ---
router.post('/dummy_pay', async (req, res) => {
    try {
        const { bookingId, amount } = req.body;
        // Ghi lại giao dịch giả lập là Thành Công luôn
        await db.query(
            'INSERT INTO payments (booking_id, amount, status, method, transaction_id) VALUES (?, ?, ?, ?, ?)',
            [bookingId, amount, 'success', 'cash_dummy', 'DUMMY_' + new Date().getTime()]
        );
        
        // Cập nhật bookings thành confirmed để đổ vào doanh thu
        await db.query('UPDATE bookings SET status = "confirmed" WHERE id = ?', [bookingId]);

        res.json({ success: true, message: 'Thanh toán thành công' });
    } catch (error) {
        console.error('Lỗi Dummy Pay:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
});

module.exports = router;

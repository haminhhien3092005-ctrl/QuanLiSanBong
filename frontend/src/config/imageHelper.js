// Helper xử lý URL ảnh cho mobile
// - Thêm params cho Unsplash URLs
// - Trả về ảnh mặc định nếu URL null/rỗng

const DEFAULT_PITCH_IMAGE = 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600&q=80';

/**
 * Xử lý image_url để hiển thị đúng trên mobile
 * @param {string|null} url - URL ảnh từ database
 * @returns {{ uri: string }} - Object dùng cho Image source
 */
export const getPitchImageSource = (url) => {
    if (!url || url.trim() === '' || url === 'NULL') {
        return { uri: DEFAULT_PITCH_IMAGE };
    }

    let processedUrl = url.trim();

    // Nếu là URL Unsplash mà chưa có params, thêm params kích thước
    if (processedUrl.includes('images.unsplash.com') && !processedUrl.includes('?')) {
        processedUrl += '?w=600&q=80';
    }

    return { uri: processedUrl };
};

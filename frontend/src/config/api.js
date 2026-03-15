import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Tự động lấy IP của máy dev khi chạy qua Expo Go (quét QR)
// Nếu chạy trên emulator Android thì dùng 10.0.2.2, iOS simulator dùng localhost
const getBaseUrl = () => {
    // Khi chạy trong Expo Go trên thiết bị thật, lấy IP từ Expo manifest
    const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || Constants.manifest2?.extra?.expoGo?.debuggerHost;
    
    if (debuggerHost) {
        // debuggerHost có dạng "192.168.x.x:8081", ta chỉ lấy phần IP
        const ip = debuggerHost.split(':')[0];
        return `http://${ip}:5000/api`;
    }

    // Fallback cho emulator
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:5000/api';
    }
    return 'http://127.0.0.1:5000/api';
};

export const API_URL = getBaseUrl();

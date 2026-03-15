import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config/api';
import { AuthContext } from '../context/AuthContext';
import { PopupAlert } from '../components/PopupModal';

export default function LoginScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);

    const [popup, setPopup] = useState({ visible: false, title: '', message: '', icon: 'information-circle' });
    const showPopup = (title, message, icon = 'information-circle') => setPopup({ visible: true, title, message, icon });

    const handleLogin = async () => {
        if (!username || !password) {
            showPopup('Lỗi', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.', 'alert-circle');
            return;
        }

        try {
            const res = await axios.post(`${API_URL}/auth/login`, { username, password });
            if (res.data.success) {
                await login(res.data.user);
                showPopup('Thành công', 'Đăng nhập thành công!', 'checkmark-circle');
            }
        } catch (error) {
            showPopup('Lỗi', error.response?.data?.message || 'Không thể kết nối đến server', 'alert-circle');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Welcome Back!</Text>
                <Text style={styles.subtitle}>Đăng nhập để đặt sân bóng</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Tên đăng nhập"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Mật khẩu"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Đăng Nhập</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.linkText}>Chưa có tài khoản? Đăng ký</Text>
                </TouchableOpacity>
            </View>

            <PopupAlert
                visible={popup.visible}
                title={popup.title}
                message={popup.message}
                icon={popup.icon}
                onClose={() => setPopup({ ...popup, visible: false })}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' },
    card: {
        backgroundColor: '#ffffff', padding: 30, borderRadius: 15,
        borderWidth: 1, borderColor: '#000000', width: '90%'
    },
    title: { fontSize: 28, fontWeight: 'bold', color: '#000000', textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#000000', textAlign: 'center', marginBottom: 30 },
    input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#000000', borderRadius: 10, padding: 15, marginBottom: 15, fontSize: 16, color: '#000000' },
    button: { backgroundColor: '#2E7D32', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
    linkButton: { marginTop: 20, alignItems: 'center' },
    linkText: { color: '#2E7D32', fontSize: 15, fontWeight: '600', textDecorationLine: 'underline' }
});

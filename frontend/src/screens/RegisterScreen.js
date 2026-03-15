import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config/api';
import { PopupAlert } from '../components/PopupModal';

export default function RegisterScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');

    const [popup, setPopup] = useState({ visible: false, title: '', message: '', icon: 'information-circle' });
    const [registerSuccess, setRegisterSuccess] = useState(false);

    const showPopup = (title, message, icon = 'information-circle') => setPopup({ visible: true, title, message, icon });

    const handleRegister = async () => {
        if (!username || !password || !fullName) {
            showPopup('Lỗi', 'Vui lòng điền đủ tên đăng nhập, mật khẩu và họ tên!', 'alert-circle');
            return;
        }

        try {
            const res = await axios.post(`${API_URL}/auth/register`, {
                username,
                password,
                full_name: fullName,
                phone
            });

            if (res.data.success) {
                setRegisterSuccess(true);
                showPopup('Thành công', 'Tạo tài khoản thành công! Vui lòng đăng nhập.', 'checkmark-circle');
            }
        } catch (error) {
            showPopup('Lỗi', error.response?.data?.message || 'Không thể kết nối đến server', 'alert-circle');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    <Text style={styles.title}>Tạo Tài Khoản</Text>
                    <Text style={styles.subtitle}>Đăng ký để dễ dàng quản lý lịch đặt sân</Text>

                    <Text style={styles.label}>Họ và tên</Text>
                    <TextInput style={styles.input} placeholder="Nguyễn Văn A" value={fullName} onChangeText={setFullName} />

                    <Text style={styles.label}>Số điện thoại</Text>
                    <TextInput style={styles.input} placeholder="0987654321" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

                    <Text style={styles.label}>Tên đăng nhập</Text>
                    <TextInput style={styles.input} placeholder="nguyenvana123" value={username} onChangeText={setUsername} autoCapitalize="none" />

                    <Text style={styles.label}>Mật khẩu</Text>
                    <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />

                    <TouchableOpacity style={styles.button} onPress={handleRegister}>
                        <Text style={styles.buttonText}>Đăng Ký</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.linkText}>Đã có tài khoản? Đăng nhập ngay</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <PopupAlert
                visible={popup.visible}
                title={popup.title}
                message={popup.message}
                icon={popup.icon}
                onClose={() => {
                    setPopup({ ...popup, visible: false });
                    if (registerSuccess) navigation.replace('Login');
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 30 },
    card: { backgroundColor: '#ffffff', padding: 30, borderRadius: 15, borderWidth: 1, borderColor: '#000000', width: '90%' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#000000', textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#000000', textAlign: 'center', marginBottom: 30 },
    label: { fontSize: 14, fontWeight: '600', color: '#000000', marginBottom: 8 },
    input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#000000', borderRadius: 10, padding: 15, marginBottom: 20, fontSize: 16, color: '#000000' },
    button: { backgroundColor: '#2E7D32', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
    linkButton: { marginTop: 20, alignItems: 'center' },
    linkText: { color: '#2E7D32', fontSize: 15, fontWeight: '600', textDecorationLine: 'underline' }
});

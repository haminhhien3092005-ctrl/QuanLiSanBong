import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '../config/api';

export default function ProfileScreen() {
    const { user, login, logout } = useContext(AuthContext);
    const navigation = useNavigation();

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editUsername, setEditUsername] = useState('');
    const [editFullName, setEditFullName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Popup state
    const [popupVisible, setPopupVisible] = useState(false);
    const [popupTitle, setPopupTitle] = useState('');
    const [popupMessage, setPopupMessage] = useState('');
    const [popupIcon, setPopupIcon] = useState('information-circle');
    const [popupColor, setPopupColor] = useState('#2E7D32');

    const showPopup = (title, message, icon = 'information-circle', color = '#2E7D32') => {
        setPopupTitle(title);
        setPopupMessage(message);
        setPopupIcon(icon);
        setPopupColor(color);
        setPopupVisible(true);
    };

    // Sử dụng API_URL từ config/api.js (đã tự detect IP)

    const handleLogout = async () => {
        await logout();
    };

    const openEditModal = () => {
        setEditUsername(user.username || '');
        setEditFullName(user.full_name || '');
        setEditPhone(user.phone || '');
        setCurrentPassword('');
        setNewPassword('');
        setEditModalVisible(true);
    };

    const handleSaveProfile = async () => {
        if (!currentPassword) {
            showPopup('Lỗi', 'Vui lòng nhập mật khẩu hiện tại để xác nhận thay đổi.', 'alert-circle', '#2E7D32');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/profile/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: editUsername,
                    full_name: editFullName,
                    phone: editPhone,
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            const data = await response.json();
            if (data.success) {
                // Đóng modal edit trước để tránh 2 modal chồng nhau gây lag
                setEditModalVisible(false);
                await login(data.user);
                // Delay nhỏ để modal edit đóng hoàn toàn rồi mới hiện popup
                setTimeout(() => {
                    showPopup('Thành công', 'Thông tin cá nhân đã được cập nhật.', 'checkmark-circle', '#2E7D32');
                }, 300);
            } else {
                showPopup('Lỗi', data.message || 'Có lỗi xảy ra.', 'alert-circle', '#2E7D32');
            }
        } catch (error) {
            console.error(error);
            showPopup('Lỗi', 'Không thể kết nối đến server.', 'cloud-offline', '#2E7D32');
        }
    };

    if (!user || (!user.id && user.id !== 0)) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerBox}>
                    <Ionicons name="person-circle-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>Vui lòng đăng nhập để xem hồ sơ.</Text>
                    <TouchableOpacity style={styles.loginButton} onPress={handleLogout}>
                        <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Menu item component
    const MenuItem = ({ icon, label, onPress, color = '#333' }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
            <View style={styles.menuLeft}>
                <Ionicons name={icon} size={22} color={color} />
                <Text style={styles.menuLabel}>{label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>
    );

    // Quick action button component
    const QuickAction = ({ icon, label, color, onPress }) => (
        <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.quickIconBox, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={styles.quickLabel}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Green Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerContent} onPress={openEditModal} activeOpacity={0.8}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{user.full_name?.charAt(0).toUpperCase() || 'U'}</Text>
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.headerName}>{user.full_name}</Text>
                            <Text style={styles.headerUsername}>{user.username}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                </View>

                {/* Member Badge */}
                <View style={styles.memberBadge}>
                    <Ionicons name="shield-checkmark" size={20} color="#2E7D32" />
                    <Text style={styles.memberText}>{user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#2E7D32" />
                </View>

                {/* Quick Actions */}
                <View style={styles.quickRow}>
                    <QuickAction icon="time-outline" label="Lịch đặt" color="#2E7D32" onPress={() => {
                        try { navigation.navigate('HistoryTab'); } catch (e) { }
                    }} />
                    <QuickAction icon="create-outline" label="Sửa hồ sơ" color="#2E7D32" onPress={openEditModal} />
                    <QuickAction icon="call-outline" label="Liên hệ" color="#2E7D32" onPress={() => showPopup('Liên hệ', 'Hotline: 0123 456 789\nEmail: support@sanbong.vn', 'call', '#2E7D32')} />
                    <QuickAction icon="gift-outline" label="Ưu đãi" color="#2E7D32" onPress={() => showPopup('Ưu đãi', 'Chưa có ưu đãi nào. Hãy quay lại sau!', 'gift', '#2E7D32')} />
                </View>

                {/* Tài khoản Section */}
                <Text style={styles.sectionTitle}>Tài khoản</Text>
                <View style={styles.menuSection}>
                    <MenuItem icon="person-outline" label="Chỉnh sửa thông tin" onPress={openEditModal} />
                    <MenuItem icon="lock-closed-outline" label="Đổi mật khẩu" onPress={openEditModal} />
                    <MenuItem icon="call-outline" label={`SĐT: ${user.phone || 'Chưa cập nhật'}`} onPress={openEditModal} />
                </View>

                {/* Hệ thống Section */}
                <Text style={styles.sectionTitle}>Hệ thống</Text>
                <View style={styles.menuSection}>
                    <MenuItem icon="settings-outline" label="Cài đặt" onPress={() => showPopup('Cài đặt', 'Tính năng đang phát triển. Vui lòng quay lại sau.', 'settings', '#2E7D32')} />
                    <MenuItem icon="information-circle-outline" label="Thông tin phiên bản" onPress={() => showPopup('Phiên bản', 'Quản lý Sân Bóng\nPhiên bản: 1.0.0\nNgày phát hành: 12/04/2026', 'information-circle', '#2E7D32')} />
                    <MenuItem icon="document-text-outline" label="Điều khoản và chính sách" onPress={() => showPopup('Điều khoản', 'Nội dung điều khoản và chính sách đang được cập nhật.', 'document-text', '#2E7D32')} />
                    <MenuItem icon="sparkles-outline" label="Ứng dụng có gì mới" onPress={() => showPopup('Có gì mới?', '✅ Quản lý đặt sân trực tuyến\n✅ Theo dõi lịch sử đặt sân\n✅ Thanh toán nhanh chóng\n✅ Quản lý thông tin cá nhân', 'sparkles', '#2E7D32')} />
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#cc0000" />
                    <Text style={styles.logoutButtonText}>Đăng xuất</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Thông tin phiên bản: 1.0.0</Text>

            </ScrollView>

            {/* Popup Thông báo */}
            <Modal visible={popupVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.popupView}>
                        <View style={[styles.popupIconBox, { backgroundColor: popupColor + '15' }]}>
                            <Ionicons name={popupIcon} size={40} color={popupColor} />
                        </View>
                        <Text style={styles.popupTitle}>{popupTitle}</Text>
                        <Text style={styles.popupMessage}>{popupMessage}</Text>
                        <TouchableOpacity style={[styles.popupBtn, { backgroundColor: popupColor }]} onPress={() => setPopupVisible(false)}>
                            <Text style={styles.popupBtnText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal Sửa Thông Tin */}
            <Modal visible={editModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Sửa Thông Tin</Text>

                        <Text style={styles.inputLabel}>Tên đăng nhập</Text>
                        <TextInput style={styles.input} value={editUsername} onChangeText={setEditUsername} autoCapitalize="none" />

                        <Text style={styles.inputLabel}>Họ và Tên</Text>
                        <TextInput style={styles.input} value={editFullName} onChangeText={setEditFullName} />

                        <Text style={styles.inputLabel}>Số điện thoại</Text>
                        <TextInput style={styles.input} value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" />

                        <Text style={styles.inputLabel}>Mật khẩu mới (Tuỳ chọn)</Text>
                        <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry />

                        <Text style={styles.inputLabelRequired}>Mật khẩu hiện tại (*) để xác nhận</Text>
                        <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setEditModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Huỷ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSaveProfile}>
                                <Text style={styles.btnText}>Lưu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, color: '#999', marginTop: 15, marginBottom: 20 },
    loginButton: { backgroundColor: '#2E7D32', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
    loginButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },

    // Green Header
    header: {
        backgroundColor: '#2E7D32',
        paddingTop: 20,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25
    },
    headerContent: { flexDirection: 'row', alignItems: 'center' },
    avatarPlaceholder: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center', alignItems: 'center'
    },
    avatarText: { fontSize: 26, color: '#ffffff', fontWeight: 'bold' },
    headerInfo: { flex: 1, marginLeft: 15 },
    headerName: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
    headerUsername: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 3 },

    // Member Badge
    memberBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#E8F5E9', marginHorizontal: 20, marginTop: -15,
        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
    },
    memberText: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '600', color: '#2E7D32' },

    // Quick Actions
    quickRow: {
        flexDirection: 'row', justifyContent: 'space-around',
        marginHorizontal: 20, marginTop: 20, marginBottom: 10
    },
    quickAction: { alignItems: 'center', width: 70 },
    quickIconBox: {
        width: 50, height: 50, borderRadius: 15,
        justifyContent: 'center', alignItems: 'center', marginBottom: 8
    },
    quickLabel: { fontSize: 12, color: '#333', fontWeight: '500', textAlign: 'center' },

    // Section
    sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#888', marginLeft: 20, marginTop: 20, marginBottom: 10 },

    // Menu
    menuSection: {
        backgroundColor: '#ffffff', marginHorizontal: 15, borderRadius: 15,
        overflow: 'hidden'
    },
    menuItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
    },
    menuLeft: { flexDirection: 'row', alignItems: 'center' },
    menuLabel: { fontSize: 15, color: '#333', marginLeft: 14 },

    // Logout
    logoutButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        marginHorizontal: 15, marginTop: 25,
        backgroundColor: '#ffffff', borderRadius: 15, paddingVertical: 16
    },
    logoutButtonText: { color: '#cc0000', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },

    // Version
    versionText: { textAlign: 'center', color: '#bbb', fontSize: 13, marginTop: 15, marginBottom: 30 },

    // Modal Styling
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalView: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#000000' },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#000000', marginBottom: 5 },
    inputLabelRequired: { fontSize: 14, fontWeight: 'bold', color: '#ff0000', marginBottom: 5, marginTop: 10 },
    input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 16, color: '#000000' },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    cancelBtn: { backgroundColor: '#f5f5f5', marginRight: 10 },
    saveBtn: { backgroundColor: '#2E7D32', marginLeft: 10 },
    btnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
    cancelBtnText: { color: '#333', fontWeight: 'bold', fontSize: 16 },

    // Popup
    popupView: { width: '80%', backgroundColor: '#ffffff', borderRadius: 20, padding: 25, alignItems: 'center' },
    popupIconBox: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    popupTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 10 },
    popupMessage: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    popupBtn: { paddingHorizontal: 40, paddingVertical: 12, borderRadius: 25 },
    popupBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});

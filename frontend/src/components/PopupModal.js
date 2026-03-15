import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Popup thông báo đơn giản (1 nút Đóng)
export function PopupAlert({ visible, title, message, onClose, icon = 'information-circle', color = '#2E7D32' }) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.popup}>
                    <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                        <Ionicons name={icon} size={40} color={color} />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <TouchableOpacity style={[styles.btn, { backgroundColor: color }]} onPress={onClose}>
                        <Text style={styles.btnText}>Đóng</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// Popup xác nhận (2 nút: Huỷ / Đồng ý)
export function PopupConfirm({ visible, title, message, onCancel, onConfirm, icon = 'help-circle', color = '#2E7D32' }) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.popup}>
                    <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                        <Ionicons name={icon} size={40} color={color} />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <View style={styles.row}>
                        <TouchableOpacity style={[styles.btnHalf, styles.btnCancel]} onPress={onCancel}>
                            <Text style={styles.btnCancelText}>Huỷ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btnHalf, { backgroundColor: color }]} onPress={onConfirm}>
                            <Text style={styles.btnText}>Đồng ý</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    popup: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 25, alignItems: 'center' },
    iconBox: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 10 },
    message: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 25 },
    btn: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    row: { flexDirection: 'row', gap: 12, width: '100%' },
    btnHalf: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    btnCancel: { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
    btnCancelText: { color: '#4b5563', fontWeight: 'bold', fontSize: 16 }
});

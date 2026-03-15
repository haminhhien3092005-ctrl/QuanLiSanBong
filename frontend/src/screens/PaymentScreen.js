import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking, SafeAreaView } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config/api';

export default function PaymentScreen({ route, navigation }) {
    const { bookingId, amount, pitchName } = route.params;
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleDummyPayment = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/payments/dummy_pay`, { bookingId, amount });
            if (res.data.success) {
                // Thay vì dùng Alert (dễ bị lỗi trên nền web), chuyển thẳng sang màn hình Success
                setIsSuccess(true);
            }
        } catch (error) {
            alert('Không thể hoàn tất thanh toán giả lập');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: '#ffffff' }]}>
                <View style={styles.successCard}>
                    <Text style={{ fontSize: 60, marginBottom: 20 }}>✅</Text>
                    <Text style={styles.successTitle}>Thanh toán thành công!</Text>
                    <Text style={styles.successSubtitle}>Tiền sân đã được thanh toán đầy đủ.</Text>
                    <TouchableOpacity
                        style={styles.doneButton}
                        onPress={() => navigation.navigate('MainTabs', { screen: 'HistoryTab' })}
                    >
                        <Text style={styles.doneButtonText}>Xem Lịch Sử Đặt Sân</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.card}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>💰</Text>
                </View>
                <Text style={styles.title}>Thanh toán Đặt sân</Text>
                <Text style={styles.subtitle}>Sân: {pitchName}</Text>

                <View style={styles.amountContainer}>
                    <Text style={styles.amountLabel}>Tổng cộng</Text>
                    <Text style={styles.amountValue}>{amount.toLocaleString()} VND</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#000000" style={{ marginVertical: 20 }} />
                ) : (
                    <TouchableOpacity style={styles.momoButton} onPress={handleDummyPayment}>
                        <Text style={styles.momoButtonText}>Xác nhận Thanh toán</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.popToTop()}
                >
                    <Text style={styles.cancelButtonText}>Thanh toán sau tại sân</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    card: {
        backgroundColor: '#ffffff',
        width: '100%',
        borderRadius: 15,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#000000'
    },
    iconContainer: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 50,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#000000'
    },
    icon: {
        fontSize: 40
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 5
    },
    subtitle: {
        fontSize: 16,
        color: '#000000',
        marginBottom: 30
    },
    amountContainer: {
        width: '100%',
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#000000',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30
    },
    amountLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000'
    },
    amountValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2E7D32'
    },
    momoButton: {
        backgroundColor: '#2E7D32',
        width: '100%',
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginBottom: 15
    },
    momoButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold'
    },
    cancelButton: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#000000',
        backgroundColor: '#ffffff'
    },
    cancelButtonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: 'bold'
    },
    successCard: {
        backgroundColor: '#ffffff',
        padding: 40,
        borderRadius: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#000000',
        width: '90%'
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 10
    },
    successSubtitle: {
        fontSize: 16,
        color: '#000000',
        textAlign: 'center',
        marginBottom: 30
    },
    doneButton: {
        backgroundColor: '#2E7D32',
        width: '100%',
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center'
    },
    doneButtonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: 'bold'
    }
});

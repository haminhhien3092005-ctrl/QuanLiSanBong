import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../config/api';

export default function AdminHomeScreen() {
    const [revenueData, setRevenueData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchRevenue = async () => {
        try {
            const res = await axios.get(`${API_URL}/bookings/admin/revenue`);
            if (res.data.success) {
                setRevenueData(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching revenue:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRevenue();
    }, []);

    const onRefresh = useCallback(() => {
        setLoading(true);
        fetchRevenue();
    }, []);

    if (loading) return <ActivityIndicator size="large" color="#4f46e5" style={{ flex: 1 }} />;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Trung Tâm Admin</Text>
                <Text style={styles.subtitle}>Báo cáo Doanh thu & Tổng quan</Text>
            </View>

            <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}>
                <View style={styles.content}>
                    <View style={styles.revenueCard}>
                        <Text style={styles.revenueTitle}>DOANH THU ĐÃ THU</Text>
                        <Text style={styles.revenueAmount}>
                            {revenueData?.total_revenue ? parseInt(revenueData.total_revenue).toLocaleString() : '0'} đ
                        </Text>
                        <Text style={styles.revenueNote}>* Chỉ tính các đơn đã xác nhận/thanh toán</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Thống kê luồng đặt sân</Text>

                    <View style={styles.statsGrid}>
                        {revenueData?.status_counts?.map((item, index) => {
                            let label = item.status;
                            let color = '#6b7280';
                            if (label === 'pending') { label = 'Chờ xử lý'; color = '#d97706'; }
                            if (label === 'confirmed') { label = 'Đã xác nhận'; color = '#059669'; }
                            if (label === 'cancelled') { label = 'Đã huỷ'; color = '#dc2626'; }

                            return (
                                <View key={index} style={[styles.statBox, { borderTopColor: color }]}>
                                    <Text style={styles.statCount}>{item.count}</Text>
                                    <Text style={[styles.statLabel, { color }]}>{label}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    header: { padding: 20, backgroundColor: '#2E7D32' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
    subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
    content: { padding: 20 },
    revenueCard: {
        backgroundColor: '#E8F5E9',
        padding: 30,
        borderRadius: 15,
        alignItems: 'center',
        marginBottom: 30
    },
    revenueTitle: { color: '#2E7D32', fontSize: 14, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10 },
    revenueAmount: { color: '#2E7D32', fontSize: 40, fontWeight: 'bold' },
    revenueNote: { color: '#000000', fontSize: 12, marginTop: 10 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000000', marginBottom: 15 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    statBox: {
        width: '48%', backgroundColor: '#ffffff', padding: 20, borderRadius: 15, marginBottom: 15,
        alignItems: 'center', borderWidth: 1, borderColor: '#000000'
    },
    statCount: { fontSize: 28, fontWeight: 'bold', color: '#000000' },
    statLabel: { fontSize: 14, fontWeight: '600', marginTop: 5, color: '#000000' }
});

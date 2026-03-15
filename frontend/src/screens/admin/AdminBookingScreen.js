import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { PopupAlert, PopupConfirm } from '../../components/PopupModal';
import Pagination from '../../components/Pagination';

const ITEMS_PER_PAGE = 10;

export default function AdminBookingScreen() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchBookings = async () => {
        try {
            const res = await axios.get(`${API_URL}/bookings/admin/all`);
            if (res.data.success) {
                setBookings(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching admin bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBookings(); }, []);

    const onRefresh = useCallback(() => {
        setLoading(true);
        fetchBookings();
    }, []);

    // Popup states
    const [popup, setPopup] = useState({ visible: false, title: '', message: '', icon: 'information-circle' });
    const [confirmPopup, setConfirmPopup] = useState({ visible: false, title: '', message: '', onConfirmAction: null });
    const showPopup = (title, message, icon = 'information-circle') => setPopup({ visible: true, title, message, icon });

    const updateStatus = async (id, status) => {
        try {
            const res = await axios.put(`${API_URL}/bookings/${id}/status`, { status });
            if (res.data.success) {
                showPopup('Thành công', 'Cập nhật trạng thái thành công', 'checkmark-circle');
                fetchBookings();
            }
        } catch (error) {
            showPopup('Lỗi', 'Không thể cập nhật trạng thái', 'alert-circle');
        }
    };

    const confirmAction = (id, action, status) => {
        setConfirmPopup({
            visible: true,
            title: `Xác nhận ${action}`,
            message: `Chuyển đơn sang "${action}"?`,
            onConfirmAction: () => updateStatus(id, status)
        });
    };

    const deleteBooking = (booking) => {
        setConfirmPopup({
            visible: true,
            title: 'Xác nhận xoá',
            message: `Xoá đơn #${booking.id}? Không thể hoàn tác.`,
            onConfirmAction: async () => {
                try {
                    const res = await axios.delete(`${API_URL}/bookings/${booking.id}`);
                    if (res.data.success) {
                        showPopup('Thành công', 'Đã xoá đơn đặt sân!', 'checkmark-circle');
                        fetchBookings();
                    }
                } catch (error) {
                    showPopup('Lỗi', 'Không thể xoá đơn đặt sân.', 'alert-circle');
                }
            }
        });
    };

    // Filter + Search
    const filteredBookings = bookings.filter(b => {
        const matchSearch =
            (b.user_name && b.user_name.toLowerCase().includes(searchText.toLowerCase())) ||
            (b.pitch_name && b.pitch_name.toLowerCase().includes(searchText.toLowerCase())) ||
            (b.phone && b.phone.includes(searchText)) ||
            `#${b.id}`.includes(searchText);
        const matchStatus = filterStatus === 'all' || b.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
    const paginatedBookings = filteredBookings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const statusLabel = (s) => {
        if (s === 'pending') return 'Chờ duyệt';
        if (s === 'confirmed') return 'Đã duyệt';
        if (s === 'cancelled') return 'Đã huỷ';
        return s;
    };

    const statusBadgeStyle = (s) => {
        if (s === 'confirmed') return styles.badgeConfirmed;
        if (s === 'cancelled') return styles.badgeCancelled;
        return styles.badgePending;
    };

    const statusBadgeTextStyle = (s) => {
        if (s === 'confirmed') return styles.badgeTextConfirmed;
        if (s === 'cancelled') return styles.badgeTextCancelled;
        return styles.badgeTextPending;
    };

    const countByStatus = (s) => bookings.filter(b => s === 'all' ? true : b.status === s).length;

    const renderCard = ({ item }) => (
        <View style={styles.card}>
            {/* Header: User + Status */}
            <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardUser}>{item.user_name}</Text>
                    <Text style={styles.cardPhone}>{item.phone || 'Chưa có SĐT'}</Text>
                </View>
                <View style={[styles.badge, statusBadgeStyle(item.status)]}>
                    <Text style={[styles.badgeText, statusBadgeTextStyle(item.status)]}>{statusLabel(item.status)}</Text>
                </View>
            </View>

            {/* Info */}
            <View style={styles.cardInfo}>
                <Text style={styles.cardPitch}><Ionicons name="football-outline" size={14} color="#2E7D32" /> {item.pitch_name}</Text>
                <Text style={styles.cardDate}><Ionicons name="calendar-outline" size={13} color="#888" /> {new Date(item.booking_date).toLocaleDateString('vi-VN')}  •  <Ionicons name="time-outline" size={13} color="#888" /> {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}</Text>
            </View>

            {/* Footer: Price + Actions */}
            <View style={styles.cardFooter}>
                <Text style={styles.cardPrice}>{parseInt(item.total_amount).toLocaleString()} đ</Text>
                <View style={styles.cardActions}>
                    {item.status === 'pending' && (
                        <TouchableOpacity style={styles.btnApprove} onPress={() => confirmAction(item.id, 'Phê duyệt', 'confirmed')}>
                            <Text style={styles.btnApproveText}>Duyệt</Text>
                        </TouchableOpacity>
                    )}
                    {item.status !== 'cancelled' && (
                        <TouchableOpacity style={styles.btnCancel} onPress={() => confirmAction(item.id, 'Huỷ', 'cancelled')}>
                            <Text style={styles.btnCancelText}>Huỷ</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.btnDelete} onPress={() => deleteBooking(item)}>
                        <Text style={styles.btnDeleteText}>Xoá</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Quản lý Lịch Đặt</Text>
                <Text style={styles.headerSub}>Tổng: {bookings.length} đơn</Text>
            </View>

            {/* Search */}
            <View style={styles.toolbar}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm theo tên, SĐT, sân..."
                    placeholderTextColor="#999"
                    value={searchText}
                    onChangeText={(text) => { setSearchText(text); setCurrentPage(1); }}
                />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterRow}>
                {[
                    { key: 'all', label: 'Tất cả' },
                    { key: 'pending', label: 'Chờ duyệt' },
                    { key: 'confirmed', label: 'Đã duyệt' },
                    { key: 'cancelled', label: 'Đã huỷ' }
                ].map(f => (
                    <TouchableOpacity
                        key={f.key}
                        style={[styles.filterBtn, filterStatus === f.key && styles.filterBtnActive]}
                        onPress={() => { setFilterStatus(f.key); setCurrentPage(1); }}
                    >
                        <Text style={[styles.filterBtnText, filterStatus === f.key && styles.filterBtnTextActive]}>
                            {f.label} ({countByStatus(f.key)})
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            <FlatList
                data={paginatedBookings}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderCard}
                contentContainerStyle={{ padding: 15 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>
                            {searchText || filterStatus !== 'all' ? 'Không tìm thấy đơn phù hợp.' : 'Chưa có đơn đặt sân nào.'}
                        </Text>
                    </View>
                }
                ListFooterComponent={
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                }
            />

            <PopupAlert
                visible={popup.visible}
                title={popup.title}
                message={popup.message}
                icon={popup.icon}
                onClose={() => setPopup({ ...popup, visible: false })}
            />

            <PopupConfirm
                visible={confirmPopup.visible}
                title={confirmPopup.title}
                message={confirmPopup.message}
                icon="help-circle"
                onCancel={() => setConfirmPopup({ ...confirmPopup, visible: false })}
                onConfirm={() => {
                    setConfirmPopup({ ...confirmPopup, visible: false });
                    if (confirmPopup.onConfirmAction) confirmPopup.onConfirmAction();
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },

    // Header
    header: { padding: 20, paddingBottom: 12, backgroundColor: '#2E7D32' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
    headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

    // Search
    toolbar: { paddingHorizontal: 15, paddingTop: 15 },
    searchInput: {
        backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#000000',
        borderRadius: 12, paddingHorizontal: 15, paddingVertical: 10, fontSize: 15, color: '#000000'
    },

    // Filter
    filterRow: { flexDirection: 'row', paddingHorizontal: 15, paddingTop: 12, paddingBottom: 5, gap: 8, flexWrap: 'wrap' },
    filterBtn: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, borderColor: '#000000', backgroundColor: '#ffffff'
    },
    filterBtnActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
    filterBtnText: { fontSize: 13, fontWeight: '600', color: '#000000' },
    filterBtnTextActive: { color: '#ffffff' },

    // Card
    card: {
        backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#000000',
        borderRadius: 15, padding: 16, marginBottom: 12
    },

    // Card Top
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    cardUser: { fontSize: 16, fontWeight: 'bold', color: '#000000' },
    cardPhone: { fontSize: 13, color: '#888', marginTop: 2 },

    // Badge
    badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    badgePending: { backgroundColor: '#FFF3E0' },
    badgeTextPending: { color: '#E65100' },
    badgeConfirmed: { backgroundColor: '#E8F5E9' },
    badgeTextConfirmed: { color: '#2E7D32' },
    badgeCancelled: { backgroundColor: '#f5f5f5' },
    badgeTextCancelled: { color: '#999' },

    // Card Info
    cardInfo: {
        backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, marginBottom: 12
    },
    cardPitch: { fontSize: 15, fontWeight: '600', color: '#000000', marginBottom: 4 },
    cardDate: { fontSize: 13, color: '#555' },

    // Card Footer
    cardFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12
    },
    cardPrice: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32' },
    cardActions: { flexDirection: 'row', gap: 8 },

    // Action Buttons
    btnApprove: { backgroundColor: '#2E7D32', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
    btnApproveText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
    btnCancel: {
        backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#000000',
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8
    },
    btnCancelText: { color: '#000000', fontWeight: 'bold', fontSize: 13 },
    btnDelete: {
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#cc0000',
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8
    },
    btnDeleteText: { color: '#cc0000', fontWeight: 'bold', fontSize: 13 },

    // Empty
    emptyBox: { padding: 40, alignItems: 'center' },
    emptyText: { fontSize: 15, color: '#999' }
});

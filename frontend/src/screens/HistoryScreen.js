import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, SafeAreaView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { API_URL } from '../config/api';
import { getPitchImageSource } from '../config/imageHelper';
import { AuthContext } from '../context/AuthContext';
import { PopupAlert, PopupConfirm } from '../components/PopupModal';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 10;

export default function HistoryScreen() {
    const { user } = useContext(AuthContext);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [changedIds, setChangedIds] = useState([]); // IDs of bookings that changed status
    const prevHistoryRef = useRef([]); // Store previous history for comparison
    const [currentPage, setCurrentPage] = useState(1);

    // Auto refresh when tab is focused
    useFocusEffect(
        useCallback(() => {
            if (user && user.id) {
                fetchHistory();
            }
        }, [user])
    );

    useEffect(() => {
        if (user && user.id) {
            fetchHistory();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API_URL}/bookings/user/${user.id}`);
            if (res.data.success) {
                const newData = res.data.data;
                
                // Compare with previous data to detect status changes
                if (prevHistoryRef.current.length > 0) {
                    const changed = [];
                    newData.forEach(newItem => {
                        const oldItem = prevHistoryRef.current.find(o => o.id === newItem.id);
                        if (oldItem && oldItem.status !== newItem.status) {
                            changed.push(newItem.id);
                        }
                    });
                    
                    if (changed.length > 0) {
                        setChangedIds(changed);
                        // Find the changed bookings to show notification
                        const changedBookings = newData.filter(b => changed.includes(b.id));
                        changedBookings.forEach(b => {
                            const statusText = getStatusStyle(b.status).text;
                            showPopup(
                                'Cập nhật đơn đặt sân',
                                `Đơn "${b.pitch_name}" đã chuyển sang trạng thái: ${statusText}`,
                                b.status === 'cancelled' ? 'close-circle' : 
                                b.status === 'confirmed' ? 'checkmark-circle' : 'information-circle'
                            );
                        });

                        // Clear highlight after 5 seconds
                        setTimeout(() => setChangedIds([]), 5000);
                    }
                }

                prevHistoryRef.current = newData;
                setHistory(newData);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    // Popup states
    const [popup, setPopup] = useState({ visible: false, title: '', message: '', icon: 'information-circle' });
    const [confirmPopup, setConfirmPopup] = useState({ visible: false, bookingId: null });

    const showPopup = (title, message, icon = 'information-circle') => setPopup({ visible: true, title, message, icon });

    const executeCancel = async (bookingId) => {
        try {
            const res = await axios.put(`${API_URL}/bookings/${bookingId}/status`, { status: 'cancelled' });
            if (res.data.success) {
                // Update prevHistoryRef so it doesn't trigger notification for self-cancel
                prevHistoryRef.current = prevHistoryRef.current.map(b => 
                    b.id === bookingId ? { ...b, status: 'cancelled' } : b
                );
                fetchHistory();
            }
        } catch (error) {
            showPopup('Lỗi', 'Không thể huỷ sân lúc này.', 'alert-circle');
        }
    };

    const handleCancelBooking = (bookingId) => {
        setConfirmPopup({ visible: true, bookingId });
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'confirmed': return { color: '#059669', bg: '#ECFDF5', borderColor: '#A7F3D0', text: 'Đã xác nhận', icon: 'checkmark-circle' };
            case 'pending': return { color: '#D97706', bg: '#FFFBEB', borderColor: '#FDE68A', text: 'Chờ thanh toán', icon: 'time' };
            case 'cancelled': return { color: '#DC2626', bg: '#FEF2F2', borderColor: '#FECACA', text: 'Đã huỷ', icon: 'close-circle' };
            default: return { color: '#6b7280', bg: '#F3F4F6', borderColor: '#D1D5DB', text: status, icon: 'help-circle' };
        }
    };

    const HistoryCard = ({ item }) => {
        const badge = getStatusStyle(item.status);
        const isChanged = changedIds.includes(item.id);
        const flashAnim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            if (isChanged) {
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(flashAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
                        Animated.timing(flashAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
                    ]),
                    { iterations: 5 }
                ).start();
            }
        }, [isChanged]);

        const animatedBg = isChanged
            ? flashAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['#ffffff', badge.bg]
            })
            : '#ffffff';

        return (
            <Animated.View style={[styles.card, { backgroundColor: animatedBg }]}>
                {/* Notification banner for changed status */}
                {isChanged && (
                    <View style={[styles.notificationBanner, { backgroundColor: badge.bg }]}> 
                        <Ionicons name="notifications" size={14} color={badge.color} />
                        <Text style={[styles.notificationText, { color: badge.color }]}>
                            Trạng thái đã thay đổi!
                        </Text>
                    </View>
                )}
                <View style={styles.cardContent}>
                    <Image source={getPitchImageSource(item.image_url)} style={styles.image} />
                    <View style={styles.cardBody}>
                        <View style={styles.headerRow}>
                            <Text style={styles.pitchName}>{item.pitch_name}</Text>
                            <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.borderColor }]}>
                                <Ionicons name={badge.icon} size={12} color={badge.color} style={{ marginRight: 4 }} />
                                <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
                            </View>
                        </View>

                        <Text style={styles.detailText}><Ionicons name="calendar-outline" size={14} color="#2E7D32" /> Ngày đặt: {new Date(item.booking_date).toLocaleDateString('vi-VN')}</Text>
                        <Text style={styles.detailText}><Ionicons name="time-outline" size={14} color="#2E7D32" /> Khung giờ: {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}</Text>
                        <Text style={styles.priceText}><Ionicons name="cash-outline" size={14} color="#2E7D32" /> Tổng tiền: {parseInt(item.total_amount).toLocaleString()} VND</Text>

                        {/* Nút Huỷ sân nếu chưa bị huỷ */}
                        {(item.status === 'pending' || item.status === 'confirmed') && (
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelBooking(item.id)}>
                                <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                                <Text style={styles.cancelBtnText}>Huỷ đặt sân</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Animated.View>
        );
    };

    if (loading) return <ActivityIndicator size="large" color="#2E7D32" style={{ flex: 1 }} />;

    if (!user || !user.id) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerBox}>
                    <Text style={styles.emptyText}>Vui lòng đăng nhập để xem lịch sử đặt sân.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Lịch sử của tôi</Text>
            </View>

            {history.length === 0 ? (
                <View style={styles.centerBox}>
                    <Ionicons name="receipt-outline" size={60} color="#d1d5db" />
                    <Text style={styles.emptyText}>Bạn chưa có lượt đặt sân nào.</Text>
                </View>
            ) : (
                <FlatList
                    data={history.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => <HistoryCard item={item} />}
                    contentContainerStyle={{ padding: 15 }}
                    ListFooterComponent={
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(history.length / ITEMS_PER_PAGE)}
                            onPageChange={setCurrentPage}
                        />
                    }
                />
            )}

            <PopupAlert
                visible={popup.visible}
                title={popup.title}
                message={popup.message}
                icon={popup.icon}
                onClose={() => setPopup({ ...popup, visible: false })}
            />

            <PopupConfirm
                visible={confirmPopup.visible}
                title="Xác nhận huỷ"
                message="Bạn có chắc chắn muốn huỷ sân này không? Lịch của bạn sẽ bị xoá khỏi hệ thống."
                icon="alert-circle"
                onCancel={() => setConfirmPopup({ visible: false, bookingId: null })}
                onConfirm={() => {
                    setConfirmPopup({ visible: false, bookingId: null });
                    executeCancel(confirmPopup.bookingId);
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5'
    },
    header: {
        padding: 20,
        backgroundColor: '#2E7D32',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff'
    },
    centerBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
        marginTop: 12
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        marginBottom: 15,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    notificationBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12
    },
    notificationText: {
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 6
    },
    cardContent: {
        flexDirection: 'row'
    },
    image: {
        width: 100,
        height: '100%'
    },
    cardBody: {
        flex: 1,
        padding: 15
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8
    },
    pitchName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
        flex: 1
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        marginLeft: 10,
        borderWidth: 1
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600'
    },
    detailText: {
        fontSize: 13,
        color: '#4b5563',
        marginBottom: 4
    },
    priceText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginTop: 5
    },
    cancelBtn: {
        marginTop: 12,
        paddingVertical: 8,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6
    },
    cancelBtnText: {
        color: '#DC2626',
        fontWeight: 'bold',
        fontSize: 13
    }
});

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config/api';
import { PopupAlert } from '../components/PopupModal';

const toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

const minutesToString = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h < 10 ? '0' + h : h}:${m === 0 ? '00' : '30'}`;
};

const generateNext7Days = () => {
    const days = [];
    const today = new Date();
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        days.push({
            dateString: d.toISOString().split('T')[0],
            dayName: i === 0 ? 'Hôm nay' : dayNames[d.getDay()],
            dayNumber: d.getDate().toString()
        });
    }
    return days;
};

const generateTimeBlocks = () => {
    let blocks = [];
    for (let h = 5; h <= 22; h++) {
        const hourStr = h < 10 ? `0${h}` : `${h}`;
        blocks.push(`${hourStr}:00`);
    }
    return blocks;
};

const DURATIONS = [1, 2, 3, 4, 5];

export default function BookingScreen({ route, navigation }) {
    const { pitch } = route.params;
    const days = useMemo(() => generateNext7Days(), []);
    const timeBlocks = useMemo(() => generateTimeBlocks(), []);

    const [selectedDate, setSelectedDate] = useState(days[0].dateString);
    const [selectedTime, setSelectedTime] = useState(null);
    const [selectedEndMin, setSelectedEndMin] = useState(null);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(true);

    // Lấy context user ra dùng
    const { user } = require('../context/AuthContext').AuthContext ? React.useContext(require('../context/AuthContext').AuthContext) : route.params;

    useEffect(() => {
        const fetchAvailability = async () => {
            setLoadingSlots(true);
            try {
                const res = await axios.get(`${API_URL}/bookings/availability?pitch_id=${pitch.id}&date=${selectedDate}`);
                if (res.data.success) {
                    setBookedSlots(res.data.data);
                }
            } catch (error) {
                console.error('Lỗi lấy giờ trống:', error);
            } finally {
                setLoadingSlots(false);
            }
        };
        fetchAvailability();
        // Reset selections when date changes
        setSelectedTime(null);
        setSelectedEndMin(null);
    }, [pitch.id, selectedDate]);

    // Check if a starting time block is completely occupied
    const isBlockBooked = (timeStr) => {
        const tMin = toMinutes(timeStr);
        for (let b of bookedSlots) {
            const bStart = toMinutes(b.start_time);
            const bEnd = toMinutes(b.end_time);
            if (tMin >= bStart && tMin < bEnd) {
                return true;
            }
        }
        return false;
    };

    // Check if a duration from a start time is conceptually valid
    const isDurationValid = (startMin, durHours) => {
        const endMin = startMin + durHours * 60;
        if (endMin > 23 * 60) return false; // Không được quá 23:00

        // Chống lấn vào một khung giờ người khác đã đặt
        for (let b of bookedSlots) {
            const bStart = toMinutes(b.start_time);
            const bEnd = toMinutes(b.end_time);
            if (startMin < bEnd && endMin > bStart) {
                return false;
            }
        }
        return true;
    };

    const availableEndMins = useMemo(() => {
        if (!selectedTime) return [];
        const startMin = toMinutes(selectedTime);
        return DURATIONS.filter(dur => isDurationValid(startMin, dur)).map(dur => startMin + dur * 60);
    }, [selectedTime, bookedSlots]);

    // Auto-select duration if start time changes
    useEffect(() => {
        if (selectedTime) {
            if (availableEndMins.length === 0) {
                setSelectedEndMin(null);
            } else if (!selectedEndMin || !availableEndMins.includes(selectedEndMin)) {
                // Auto-pick the minimum available duration (1 hour)
                setSelectedEndMin(availableEndMins[0]);
            }
        }
    }, [selectedTime, availableEndMins]);

    const [popup, setPopup] = useState({ visible: false, title: '', message: '', icon: 'information-circle' });
    const showPopup = (title, message, icon = 'information-circle') => setPopup({ visible: true, title, message, icon });

    const handleBooking = async () => {
        if (!selectedTime || !selectedEndMin) {
            showPopup('Thiếu thông tin', 'Vui lòng chọn Giờ bắt đầu và Giờ kết thúc!', 'alert-circle');
            return;
        }

        const startMin = toMinutes(selectedTime);
        const durationHours = (selectedEndMin - startMin) / 60;
        const totalAmount = durationHours * pitch.price_per_hour;

        const startTimeStr = minutesToString(startMin) + ":00";
        const endTimeStr = minutesToString(selectedEndMin) + ":00";

        try {
            const payload = {
                user_id: user.id,
                pitch_id: pitch.id,
                booking_date: selectedDate,
                start_time: startTimeStr,
                end_time: endTimeStr,
                total_amount: totalAmount
            };

            const res = await axios.post(`${API_URL}/bookings`, payload);
            if (res.data.success) {
                navigation.navigate('Payment', {
                    bookingId: res.data.bookingId,
                    amount: totalAmount,
                    pitchName: pitch.name
                });
            }
        } catch (error) {
            showPopup('Lỗi', error.response?.data?.message || 'Giờ này có thể đã có người đặt, vui lòng thử lại', 'alert-circle');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>

                {/* Header Info */}
                <View style={styles.infoCard}>
                    <Text style={styles.pitchName}>{pitch.name}</Text>
                    <Text style={styles.price}>{parseInt(pitch.price_per_hour).toLocaleString()} VND / Giờ</Text>
                </View>

                {/* Calendar Selection */}
                <Text style={styles.sectionTitle}>1. Chọn Ngày</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                    {days.map((day, idx) => {
                        const isSelected = day.dateString === selectedDate;
                        return (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.dateBox, isSelected && styles.dateBoxActive]}
                                onPress={() => setSelectedDate(day.dateString)}
                            >
                                <Text style={[styles.dayName, isSelected && styles.textActive]}>{day.dayName}</Text>
                                <Text style={[styles.dayNumber, isSelected && styles.textActive]}>{day.dayNumber}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Start Time Selection */}
                <Text style={styles.sectionTitle}>2. Chọn Giờ Bắt Đầu</Text>
                {loadingSlots ? (
                    <ActivityIndicator size="small" color="#000000" style={{ marginVertical: 30 }} />
                ) : (
                    <View style={styles.slotsGrid}>
                        {timeBlocks.map((time) => {
                            // Check if the time slot has already passed today
                            const isToday = selectedDate === new Date().toISOString().split('T')[0];
                            const currentMins = new Date().getHours() * 60 + new Date().getMinutes();
                            const isPast = isToday && toMinutes(time) <= currentMins;

                            if (isPast) return null;

                            const isSelected = selectedTime === time;
                            const booked = isBlockBooked(time);
                            return (
                                <TouchableOpacity
                                    key={time}
                                    style={[
                                        styles.slotBox,
                                        isSelected && styles.slotBoxActive,
                                        booked && styles.slotBoxBooked
                                    ]}
                                    onPress={() => !booked && setSelectedTime(time)}
                                    disabled={booked}
                                >
                                    <Text style={[
                                        styles.slotText,
                                        isSelected && styles.textActive,
                                        booked && styles.slotTextBooked
                                    ]}>
                                        {time}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Custom Slider for End Time */}
                {selectedTime && (
                    <View style={styles.durationSection}>
                        <Text style={styles.sectionTitle}>3. Kéo Chọn Giờ Kết Thúc</Text>

                        {availableEndMins.length === 0 ? (
                            <Text style={styles.warningText}>Trùng lịch ngay sau đó. Không đủ 1 tiếng để đá!</Text>
                        ) : (
                            <View style={styles.sliderWrapper}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sliderScroll}>
                                    <View style={styles.sliderContainer}>
                                        {availableEndMins.map((endMin, index) => {
                                            const isActive = Number(endMin) <= Number(selectedEndMin);
                                            return (
                                                <View key={endMin} style={styles.sliderNodeWrapper}>
                                                    {index > 0 && (
                                                        <View style={[styles.sliderLine, isActive && styles.sliderLineActive]} />
                                                    )}
                                                    <TouchableOpacity
                                                        activeOpacity={0.8}
                                                        onPress={() => setSelectedEndMin(endMin)}
                                                        style={styles.sliderHitbox}
                                                    >
                                                        <View style={[styles.sliderDot, isActive && styles.sliderDotActive]}>
                                                            {endMin === selectedEndMin && <View style={styles.sliderDotInner} />}
                                                        </View>
                                                        <Text style={[styles.sliderLabel, isActive && styles.sliderLabelActive]}>
                                                            {minutesToString(endMin)}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </ScrollView>
                            </View>
                        )}
                    </View>
                )}

                {/* Summary View */}
                {selectedTime && selectedEndMin && (
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryTitle}>Biên lai (Tạm tính)</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Lịch sân:</Text>
                            <Text style={styles.summaryValue}>{selectedTime} - {minutesToString(selectedEndMin)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Thời lượng:</Text>
                            <Text style={styles.summaryValue}>{(selectedEndMin - toMinutes(selectedTime)) / 60} tiếng</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Thành tiền:</Text>
                            <Text style={styles.summaryTotal}>{((selectedEndMin - toMinutes(selectedTime)) / 60 * pitch.price_per_hour).toLocaleString()} VND</Text>
                        </View>
                    </View>
                )}

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, (!selectedTime || !selectedEndMin) && { opacity: 0.5 }]}
                    disabled={!selectedTime || !selectedEndMin}
                    onPress={handleBooking}
                >
                    <Text style={styles.buttonText}>Tiếp tục & Thanh toán</Text>
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
    container: { flex: 1, backgroundColor: '#ffffff' },
    content: { padding: 20, paddingBottom: 40 },
    infoCard: {
        backgroundColor: '#2E7D32', padding: 20, borderRadius: 15, marginBottom: 25,
        alignItems: 'center'
    },
    pitchName: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 5 },
    price: { fontSize: 18, fontWeight: 'bold', color: 'rgba(255,255,255,0.85)' },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000000', marginBottom: 15 },
    dateScroll: { flexDirection: 'row', marginBottom: 25 },
    dateBox: {
        backgroundColor: '#ffffff', paddingVertical: 15, paddingHorizontal: 20,
        borderRadius: 15, alignItems: 'center', marginRight: 10,
        borderWidth: 1, borderColor: '#000000'
    },
    dateBoxActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
    dayName: { fontSize: 14, color: '#000000', marginBottom: 5 },
    dayNumber: { fontSize: 20, fontWeight: 'bold', color: '#000000' },
    textActive: { color: '#ffffff' },
    slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, gap: 10 },
    slotBox: {
        width: '22%', backgroundColor: '#ffffff', paddingVertical: 12,
        borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#000000'
    },
    slotBoxActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
    slotBoxBooked: { backgroundColor: '#ffffff', borderColor: '#000000', opacity: 0.3 },
    slotText: { fontSize: 14, fontWeight: '600', color: '#000000' },
    slotTextBooked: { color: '#000000', textDecorationLine: 'line-through' },

    // Slider Styling
    durationSection: { marginBottom: 30, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#000000' },
    warningText: { color: '#000000', fontStyle: 'italic', paddingVertical: 10 },
    sliderWrapper: { backgroundColor: '#ffffff', borderRadius: 15, paddingVertical: 20, borderWidth: 1, borderColor: '#000000' },
    sliderScroll: { paddingHorizontal: 25, paddingBottom: 25 },
    sliderContainer: { flexDirection: 'row', alignItems: 'center' },
    sliderNodeWrapper: { flexDirection: 'row', alignItems: 'center' },
    sliderLine: { width: 50, height: 4, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#000000' },
    sliderLineActive: { backgroundColor: '#2E7D32' },
    sliderHitbox: { width: 40, alignItems: 'center' },
    sliderDot: {
        width: 24, height: 24, borderRadius: 12, backgroundColor: '#ffffff',
        borderWidth: 2, borderColor: '#000000', justifyContent: 'center', alignItems: 'center'
    },
    sliderDotActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
    sliderDotInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffffff' },
    sliderLabel: { position: 'absolute', top: 32, fontSize: 13, fontWeight: '500', color: '#000000', width: 60, textAlign: 'center' },
    sliderLabelActive: { fontWeight: 'bold', color: '#000000' },

    summaryBox: {
        backgroundColor: '#ffffff', padding: 20, borderRadius: 15,
        borderWidth: 1, borderColor: '#000000', marginBottom: 20
    },
    summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#000000', marginBottom: 15 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { fontSize: 15, color: '#000000' },
    summaryValue: { fontSize: 15, fontWeight: '600', color: '#000000' },
    summaryTotal: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32' },
    footer: { padding: 20, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#000000' },
    button: { backgroundColor: '#2E7D32', paddingVertical: 18, borderRadius: 15, alignItems: 'center' },
    buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' }
});

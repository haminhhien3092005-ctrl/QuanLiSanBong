import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, TextInput, Modal, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { PopupAlert, PopupConfirm } from '../../components/PopupModal';
import Pagination from '../../components/Pagination';

const ITEMS_PER_PAGE = 10;

export default function AdminPitchScreen() {
    const [pitches, setPitches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTarget, setEditTarget] = useState(null);

    // Form fields
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formAddress, setFormAddress] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formType, setFormType] = useState('5');

    // Popup states
    const [popup, setPopup] = useState({ visible: false, title: '', message: '', icon: 'information-circle' });
    const [confirmPopup, setConfirmPopup] = useState({ visible: false, pitch: null });
    const showPopup = (title, message, icon = 'information-circle') => setPopup({ visible: true, title, message, icon });

    const fetchPitches = async () => {
        try {
            const res = await axios.get(`${API_URL}/pitches`);
            if (res.data.success) {
                setPitches(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching pitches:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPitches();
    }, []);

    const onRefresh = useCallback(() => {
        setLoading(true);
        fetchPitches();
    }, []);

    const filteredPitches = pitches.filter(p =>
        p.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchText.toLowerCase())) ||
        `sân ${p.pitch_type}`.includes(searchText.toLowerCase())
    );

    const totalPages = Math.ceil(filteredPitches.length / ITEMS_PER_PAGE);
    const paginatedPitches = filteredPitches.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const openAddModal = () => {
        setIsEditing(false);
        setEditTarget(null);
        setFormName('');
        setFormDescription('');
        setFormAddress('');
        setFormPrice('');
        setFormType('5');
        setModalVisible(true);
    };

    const openEditModal = (pitch) => {
        setIsEditing(true);
        setEditTarget(pitch);
        setFormName(pitch.name);
        setFormDescription(pitch.description || '');
        setFormAddress(pitch.address || '');
        setFormPrice(parseInt(pitch.price_per_hour).toString());
        setFormType(pitch.pitch_type);
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            showPopup('Lỗi', 'Tên sân không được để trống!', 'alert-circle');
            return;
        }
        if (!formPrice.trim() || isNaN(parseFloat(formPrice))) {
            showPopup('Lỗi', 'Giá phải là một số hợp lệ!', 'alert-circle');
            return;
        }

        try {
            if (isEditing && editTarget) {
                const payload = {
                    name: formName,
                    description: formDescription,
                    address: formAddress,
                    pitch_type: formType,
                    price_per_hour: parseFloat(formPrice),
                    image_url: editTarget.image_url || ''
                };
                const res = await axios.put(`${API_URL}/pitches/${editTarget.id}`, payload);
                if (res.data.success) {
                    showPopup('Thành công', 'Cập nhật sân thành công!', 'checkmark-circle');
                }
            } else {
                const payload = {
                    name: formName,
                    description: formDescription,
                    address: formAddress,
                    pitch_type: formType,
                    price_per_hour: parseFloat(formPrice)
                };
                const res = await axios.post(`${API_URL}/pitches`, payload);
                if (res.data.success) {
                    showPopup('Thành công', 'Thêm sân mới thành công!', 'checkmark-circle');
                }
            }
            setModalVisible(false);
            fetchPitches();
        } catch (error) {
            showPopup('Lỗi', 'Không thể lưu sân. Vui lòng thử lại.', 'alert-circle');
            console.error(error);
        }
    };

    const handleDelete = (pitch) => {
        setConfirmPopup({ visible: true, pitch });
    };

    const executeDelete = async () => {
        const pitch = confirmPopup.pitch;
        setConfirmPopup({ visible: false, pitch: null });
        try {
            const res = await axios.delete(`${API_URL}/pitches/${pitch.id}`);
            if (res.data.success) {
                showPopup('Thành công', 'Đã xoá sân thành công!', 'checkmark-circle');
                fetchPitches();
            }
        } catch (error) {
            showPopup('Lỗi', 'Không thể xoá sân. Có thể sân đang có đơn đặt.', 'alert-circle');
            console.error(error);
        }
    };

    const typeLabel = (t) => {
        if (t === '5') return 'Sân 5';
        if (t === '7') return 'Sân 7';
        if (t === '11') return 'Sân 11';
        return t;
    };

    const renderCard = ({ item, index }) => (
        <View style={styles.card}>
            {/* Row 1: Name + Type badge */}
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    {item.address ? <Text style={styles.cardAddress} numberOfLines={1}><Ionicons name="location-outline" size={13} color="#2E7D32" /> {item.address}</Text> : null}
                    {item.description ? <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text> : null}
                </View>
                <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{typeLabel(item.pitch_type)}</Text>
                </View>
            </View>

            {/* Row 2: Price + Actions */}
            <View style={styles.cardFooter}>
                <Text style={styles.cardPrice}>{parseInt(item.price_per_hour).toLocaleString()} đ/giờ</Text>
                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                        <Text style={styles.editBtnText}>Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                        <Text style={styles.deleteBtnText}>Xoá</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Quản lý Sân Bóng</Text>
                <Text style={styles.headerSub}>Tổng: {pitches.length} sân</Text>
            </View>

            {/* Toolbar */}
            <View style={styles.toolbar}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm sân..."
                    placeholderTextColor="#999"
                    value={searchText}
                    onChangeText={(text) => { setSearchText(text); setCurrentPage(1); }}
                />
                <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
                    <Text style={styles.addBtnText}>+ Thêm sân</Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
                data={paginatedPitches}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderCard}
                contentContainerStyle={{ padding: 15 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>
                            {searchText ? 'Không tìm thấy sân phù hợp.' : 'Chưa có sân bóng nào.'}
                        </Text>
                    </View>
                }
                ListFooterComponent={
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                }
            />

            {/* Modal Thêm/Sửa */}
            <Modal animationType="fade" transparent={true} visible={modalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>{isEditing ? 'Sửa Thông Tin Sân' : 'Thêm Sân Mới'}</Text>

                        <Text style={styles.label}>Tên Sân *</Text>
                        <TextInput style={styles.input} value={formName} onChangeText={setFormName} />

                        <Text style={styles.label}>Mô tả</Text>
                        <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={formDescription} onChangeText={setFormDescription} multiline />

                        <Text style={styles.label}>Địa chỉ</Text>
                        <TextInput style={styles.input} value={formAddress} onChangeText={setFormAddress} />

                        <Text style={styles.label}>Loại sân</Text>
                        <View style={styles.typeRow}>
                            {['5', '7', '11'].map(t => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.typeSelectBtn, formType === t && styles.typeSelectBtnActive]}
                                    onPress={() => setFormType(t)}
                                >
                                    <Text style={[styles.typeSelectText, formType === t && styles.typeSelectTextActive]}>Sân {t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Giá mỗi giờ (VND) *</Text>
                        <TextInput style={styles.input} value={formPrice} onChangeText={setFormPrice} keyboardType="numeric" />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Huỷ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave}>
                                <Text style={styles.saveBtnText}>{isEditing ? 'Lưu thay đổi' : 'Thêm sân'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <PopupAlert
                visible={popup.visible}
                title={popup.title}
                message={popup.message}
                icon={popup.icon}
                onClose={() => setPopup({ ...popup, visible: false })}
            />

            <PopupConfirm
                visible={confirmPopup.visible}
                title="Xác nhận xoá"
                message={confirmPopup.pitch ? `Bạn có chắc muốn xoá sân "${confirmPopup.pitch.name}"?\nHành động này không thể hoàn tác.` : ''}
                icon="alert-circle"
                onCancel={() => setConfirmPopup({ visible: false, pitch: null })}
                onConfirm={executeDelete}
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

    // Toolbar
    toolbar: { flexDirection: 'row', padding: 15, gap: 10, alignItems: 'center' },
    searchInput: {
        flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#000000',
        borderRadius: 12, paddingHorizontal: 15, paddingVertical: 10, fontSize: 15, color: '#000000'
    },
    addBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
    addBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },

    // Card
    card: {
        backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#000000',
        borderRadius: 15, padding: 16, marginBottom: 12
    },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12
    },
    cardName: { fontSize: 17, fontWeight: 'bold', color: '#000000' },
    cardAddress: { fontSize: 13, color: '#2E7D32', marginTop: 3 },
    cardDesc: { fontSize: 13, color: '#777', marginTop: 3 },
    typeBadge: {
        backgroundColor: '#2E7D32', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginLeft: 10
    },
    typeBadgeText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
    cardFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12
    },
    cardPrice: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32' },
    cardActions: { flexDirection: 'row', gap: 8 },
    editBtn: {
        backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#000000',
        borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8
    },
    editBtnText: { fontSize: 13, fontWeight: 'bold', color: '#000000' },
    deleteBtn: {
        backgroundColor: '#000000', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8
    },
    deleteBtnText: { fontSize: 13, fontWeight: 'bold', color: '#ffffff' },

    // Empty
    emptyBox: { padding: 40, alignItems: 'center' },
    emptyText: { fontSize: 15, color: '#999' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalView: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#000000' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#000000' },
    label: { fontSize: 14, fontWeight: '600', color: '#000000', marginBottom: 5, marginTop: 5 },
    input: {
        backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#000000',
        borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 16, color: '#000000'
    },

    // Type selector
    typeRow: { flexDirection: 'row', marginBottom: 10, gap: 10 },
    typeSelectBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
        borderWidth: 1, borderColor: '#000000', backgroundColor: '#ffffff'
    },
    typeSelectBtnActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
    typeSelectText: { fontWeight: 'bold', color: '#000000', fontSize: 14 },
    typeSelectTextActive: { color: '#ffffff' },

    // Modal actions
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
    btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#000000' },
    cancelBtn: { backgroundColor: '#ffffff', marginRight: 10 },
    saveBtn: { backgroundColor: '#2E7D32', marginLeft: 10, borderColor: '#2E7D32' },
    saveBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
    cancelBtnText: { color: '#000000', fontWeight: 'bold', fontSize: 16 }
});

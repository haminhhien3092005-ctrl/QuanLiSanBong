import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config/api';
import { getPitchImageSource } from '../config/imageHelper';
import { AuthContext } from '../context/AuthContext';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 10;

export default function HomeScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [pitches, setPitches] = useState([]);
    const [filteredPitches, setFilteredPitches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All'); // 'All', '5', '7', '11'
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchPitches();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchQuery, activeFilter, pitches]);

    const fetchPitches = async () => {
        try {
            const res = await axios.get(`${API_URL}/pitches`);
            if (res.data.success) {
                setPitches(res.data.data);
                setFilteredPitches(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching pitches:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = pitches;
        if (activeFilter !== 'All') {
            filtered = filtered.filter(p => p.pitch_type === activeFilter);
        }
        if (searchQuery.trim() !== '') {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        setFilteredPitches(filtered);
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(filteredPitches.length / ITEMS_PER_PAGE);
    const paginatedData = filteredPitches.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const renderFilterBtn = (title, value) => (
        <TouchableOpacity
            style={[styles.filterBtn, activeFilter === value && styles.filterBtnActive]}
            onPress={() => setActiveFilter(value)}
        >
            <Text style={[styles.filterText, activeFilter === value && styles.filterTextActive]}>{title}</Text>
        </TouchableOpacity>
    );

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('PitchDetail', { pitch: item, user })}
        >
            <Image source={getPitchImageSource(item.image_url)} style={styles.image} />
            <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                    <Text style={styles.pitchName}>{item.name}</Text>
                    <View style={styles.ratingBox}>
                        <Ionicons name="star" color="#fbbf24" size={14} />
                        <Text style={styles.ratingText}>4.8</Text>
                    </View>
                </View>
                <View style={styles.locationBox}>
                    <Ionicons name="location-outline" color="#2E7D32" size={14} />
                    <Text style={styles.pitchType}>{item.address || `Sân ${item.pitch_type} người`}</Text>
                </View>
                <Text style={styles.price}>{parseInt(item.price_per_hour).toLocaleString()} VND / Giờ</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) return <ActivityIndicator size="large" color="#10b981" style={{ flex: 1 }} />;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Xin chào, {user?.full_name || 'Khách'}</Text>
                <Text style={styles.subtitle}>Sân bóng trống đang chờ bạn!</Text>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#9ca3af" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm sân bóng..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <View style={styles.filterContainer}>
                    {renderFilterBtn('Tất cả', 'All')}
                    {renderFilterBtn('Sân 5', '5')}
                    {renderFilterBtn('Sân 7', '7')}
                    {renderFilterBtn('Sân 11', '11')}
                </View>
            </View>

            <FlatList
                data={paginatedData}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 15 }}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: 'gray' }}>Không tìm thấy sân phù hợp</Text>}
                ListFooterComponent={
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 18,
        backgroundColor: '#2E7D32'
    },
    greeting: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
    subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginTop: 18,
        height: 44
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#ffffff' },
    filterContainer: {
        flexDirection: 'row',
        marginTop: 14,
        gap: 8
    },
    filterBtn: {
        paddingVertical: 7,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)'
    },
    filterBtnActive: { backgroundColor: '#ffffff' },
    filterText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    filterTextActive: { color: '#2E7D32' },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    image: { width: '100%', height: 180 },
    cardBody: { padding: 14 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pitchName: { fontSize: 17, fontWeight: 'bold', color: '#1a1a1a' },
    ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    ratingText: { marginLeft: 4, fontWeight: 'bold', color: '#F59E0B', fontSize: 12 },
    locationBox: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    pitchType: { fontSize: 13, color: '#6b7280', marginLeft: 5 },
    price: { fontSize: 16, fontWeight: '700', color: '#2E7D32', marginTop: 12 }
});

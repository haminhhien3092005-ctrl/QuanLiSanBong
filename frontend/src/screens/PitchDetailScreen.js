import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPitchImageSource } from '../config/imageHelper';

export default function PitchDetailScreen({ route, navigation }) {
    const { pitch, user } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <Image source={getPitchImageSource(pitch.image_url)} style={styles.image} />
                <View style={styles.content}>
                    <Text style={styles.title}>{pitch.name}</Text>
                    <View style={styles.badgeContainer}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Sân {pitch.pitch_type}</Text>
                        </View>
                    </View>
                    {pitch.address ? (
                        <View style={styles.addressRow}>
                            <Ionicons name="location-outline" size={16} color="#2E7D32" />
                            <Text style={styles.addressText}>{pitch.address}</Text>
                        </View>
                    ) : null}
                    <Text style={styles.price}>{parseInt(pitch.price_per_hour).toLocaleString()} VND / Giờ</Text>

                    <Text style={styles.sectionTitle}>Mô tả chi tiết</Text>
                    <Text style={styles.description}>{pitch.description}</Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => navigation.navigate('Booking', { pitch, user })}
                >
                    <Text style={styles.bookButtonText}>Đặt Sân Ngay</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    image: {
        width: '100%',
        height: 250,
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20
    },
    content: {
        padding: 20
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 10
    },
    badgeContainer: {
        flexDirection: 'row',
        marginBottom: 15
    },
    badge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 15
    },
    badgeText: {
        color: '#2E7D32',
        fontWeight: '600'
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15
    },
    addressText: {
        fontSize: 15,
        color: '#555',
        marginLeft: 6
    },
    price: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginBottom: 20
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 10,
        marginTop: 10
    },
    description: {
        fontSize: 15,
        color: '#000000',
        lineHeight: 24
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#000000',
        backgroundColor: '#ffffff'
    },
    bookButton: {
        backgroundColor: '#2E7D32',
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center'
    },
    bookButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold'
    }
});

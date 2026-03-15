import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);

            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <View style={styles.container}>
            {/* Previous button */}
            <TouchableOpacity
                style={[styles.navBtn, currentPage === 1 && styles.navBtnDisabled]}
                onPress={() => currentPage > 1 && onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                <Ionicons name="chevron-back" size={18} color={currentPage === 1 ? '#d1d5db' : '#2E7D32'} />
            </TouchableOpacity>

            {/* Page numbers */}
            {getPageNumbers().map((page, index) => (
                page === '...' ? (
                    <Text key={`dot-${index}`} style={styles.dots}>...</Text>
                ) : (
                    <TouchableOpacity
                        key={page}
                        style={[styles.pageBtn, currentPage === page && styles.pageBtnActive]}
                        onPress={() => onPageChange(page)}
                    >
                        <Text style={[styles.pageText, currentPage === page && styles.pageTextActive]}>
                            {page}
                        </Text>
                    </TouchableOpacity>
                )
            ))}

            {/* Next button */}
            <TouchableOpacity
                style={[styles.navBtn, currentPage === totalPages && styles.navBtnDisabled]}
                onPress={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                <Ionicons name="chevron-forward" size={18} color={currentPage === totalPages ? '#d1d5db' : '#2E7D32'} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        gap: 4
    },
    navBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    navBtnDisabled: {
        backgroundColor: '#f9fafb',
        borderColor: '#f3f4f6'
    },
    pageBtn: {
        minWidth: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 4
    },
    pageBtnActive: {
        backgroundColor: '#2E7D32',
        borderColor: '#2E7D32'
    },
    pageText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151'
    },
    pageTextActive: {
        color: '#ffffff'
    },
    dots: {
        fontSize: 14,
        color: '#9ca3af',
        paddingHorizontal: 4
    }
});

import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PitchDetailScreen from './src/screens/PitchDetailScreen';
import BookingScreen from './src/screens/BookingScreen';
import PaymentScreen from './src/screens/PaymentScreen';

import AdminHomeScreen from './src/screens/admin/AdminHomeScreen';
import AdminBookingScreen from './src/screens/admin/AdminBookingScreen';
import AdminPitchScreen from './src/screens/admin/AdminPitchScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AdminTabs() {
    return (
        <Tab.Navigator
            initialRouteName="AdminPitches"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'AdminHome') iconName = focused ? 'pie-chart' : 'pie-chart-outline';
                    else if (route.name === 'AdminBookings') iconName = focused ? 'list' : 'list-outline';
                    else if (route.name === 'AdminPitches') iconName = focused ? 'football' : 'football-outline';
                    else if (route.name === 'ProfileTab') iconName = focused ? 'person' : 'person-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#2E7D32',
                tabBarInactiveTintColor: '#999999',
                tabBarStyle: { paddingBottom: 5, height: 60, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#000000' },
                tabBarLabelStyle: { fontSize: 12, fontWeight: '600' }
            })}
        >
            <Tab.Screen name="AdminPitches" component={AdminPitchScreen} options={{ title: 'Sân bóng' }} />
            <Tab.Screen name="AdminBookings" component={AdminBookingScreen} options={{ title: 'Lịch đặt' }} />
            <Tab.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: 'Doanh thu' }} />
            <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Cá nhân' }} />
        </Tab.Navigator>
    );
}

function MainTabs() {
    return (
        <Tab.Navigator
            initialRouteName="HomeTab  "
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'HomeTab') iconName = focused ? 'search' : 'search-outline';
                    else if (route.name === 'HistoryTab') iconName = focused ? 'time' : 'time-outline';
                    else if (route.name === 'ProfileTab') iconName = focused ? 'person' : 'person-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#2E7D32',
                tabBarInactiveTintColor: '#999999',
                tabBarStyle: { paddingBottom: 5, height: 60, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#000000' },
                tabBarLabelStyle: { fontSize: 12, fontWeight: '600' }
            })}
        >
            <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Đặt sân' }} />
            <Tab.Screen name="HistoryTab" component={HistoryScreen} options={{ title: 'Lịch sử' }} />
            <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Cá nhân' }} />
        </Tab.Navigator>
    );
}

function RootNavigator() {
    const { user, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
                <ActivityIndicator size="large" color="#000000" />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: '#ffffff' },
            headerTintColor: '#000000',
            headerShadowVisible: false,
            headerTitleStyle: { color: '#000000' }
        }}>
            {user ? (
                user.role === 'admin' ? (
                    // ADMIN FLOW
                    <Stack.Screen name="AdminTabs" component={AdminTabs} />
                ) : (
                    // CUSTOMER FLOW
                    <>
                        <Stack.Screen name="MainTabs" component={MainTabs} />
                        <Stack.Screen name="PitchDetail" component={PitchDetailScreen} options={{ title: 'Chi tiết sân', headerShown: true, headerBackTitleVisible: false }} />
                        <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Đặt sân', headerShown: true, headerBackTitleVisible: false }} />
                        <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Thanh toán', headerShown: true, headerBackTitleVisible: false }} />
                    </>
                )
            ) : (
                // Nếu chưa đăng nhập, bắt buộc nằm trong luồng xác thực (Auth Flow)
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Đăng ký', headerShown: true, headerBackTitleVisible: false }} />
                </>
            )}
        </Stack.Navigator>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <SafeAreaProvider>
                <NavigationContainer>
                    <RootNavigator />
                </NavigationContainer>
            </SafeAreaProvider>
        </AuthProvider>
    );
}

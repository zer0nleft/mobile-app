import React, { useContext } from 'react';
import { View, Image, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { styles } from './src/constants'; 

// Pantallas
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LogsScreen from './src/screens/LogsScreen';
import UsersScreen from './src/screens/UsersScreen';
import StatsScreen from './src/screens/StatsScreen'; 
import LoginScreen from './src/screens/LoginScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator(); 
const logo = require('./assets/logo-provisional.png');

function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="OpcionesMain" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Análisis de Datos' }} />
    </Stack.Navigator>
  );
}

const MainNavigator = () => {
  const { currentUser } = useContext(AuthContext);

  if (!currentUser) return <LoginScreen />;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Control') iconName = focused ? 'lock' : 'lock-outline';
          else if (route.name === 'Logs') iconName = focused ? 'clipboard-text' : 'clipboard-text-outline';
          else if (route.name === 'Usuarios') iconName = focused ? 'account' : 'account-outline';
          else if (route.name === 'Ajustes') iconName = focused ? 'cog' : 'cog-outline';
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        headerShown: false,
        tabBarStyle: { height: 60, paddingBottom: 10 }
      })}
    >
      <Tab.Screen name="Control" component={HomeScreen} />
      <Tab.Screen name="Logs" component={LogsScreen} />
      <Tab.Screen name="Usuarios" component={UsersScreen} />
      <Tab.Screen name="Ajustes" component={SettingsStack} />
    </Tab.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <View style={styles.headerSectionLeft}><Image source={logo} style={styles.logo} /></View>
          <View style={styles.headerSectionCenter}><Text style={styles.title}>Master Tronics</Text></View>
          <View style={styles.headerSectionRight} />
        </View>
        <NavigationContainer><MainNavigator /></NavigationContainer>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
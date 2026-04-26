import {React, useEffect} from 'react';
import { StatusBar, Platform, View, StyleSheet, Image, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './src/constants'; 


//Esto de aqui son mis pantallas.
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LogsScreen from './src/screens/LogsScreen';
import UsersScreen from './src/screens/UsersScreen';

const Tab = createBottomTabNavigator();
const logo = require('./assets/logo-provisional.png');

export default function App() {
  useEffect(() => {
    //initDB(); // Se ejecuta una sola vez al arrancar
  }, []);
  return (
    <SafeAreaProvider style={styles.safeArea}>
      {/*Esto aqui es el Header*/}
      <View style={styles.headerContainer}>
        {/* 1. Sección Izquierda */}
        <View style={styles.headerSectionLeft}>
            <Image source={logo} style={styles.logo} />
        </View>

        {/* 2. Sección Central */}
        <View style={styles.headerSectionCenter}>
            <Text style={styles.title}>Master Tronics</Text>
        </View>

        {/* 3. Sección Derecha (Vacía para balancear) */}
        <View style={styles.headerSectionRight} />
      </View>
     <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          animation: 'fade',
          // Lógica para los iconos
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Control') {
              iconName = focused ? 'lock' : 'lock-outline';
            } else if (route.name === 'Logs') {
              iconName = focused ? 'clipboard-text' : 'clipboard-text-outline';
            } else if (route.name === 'Usuarios') {
              iconName = focused ? 'account' : 'account-outline';
            } else if (route.name === 'Ajustes') {
              iconName = focused ? 'cog' : 'cog-outline';
            } 

            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          },
          // Estilos visuales
          tabBarActiveTintColor: '#2196F3', // Azul cuando está seleccionado
          tabBarInactiveTintColor: 'gray',   // Gris cuando no
          headerShown: false,                // Ocultamos el título de arriba por defecto
          tabBarStyle: { height: 60, paddingBottom: 10 }
        })}
      >
        <Tab.Screen name="Control" component={HomeScreen} />
        <Tab.Screen name="Logs" component={LogsScreen} />
        <Tab.Screen name="Usuarios" component={UsersScreen} />
        <Tab.Screen name="Ajustes" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  ); 
    
}


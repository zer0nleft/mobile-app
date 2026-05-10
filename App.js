import { React, useEffect } from 'react';
import { StatusBar, Platform, View, StyleSheet, Image, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// 1. IMPORTAMOS EL STACK NAVIGATOR
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './src/constants'; 

// Tus pantallas
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LogsScreen from './src/screens/LogsScreen';
import UsersScreen from './src/screens/UsersScreen';
import StatsScreen from './src/screens/StatsScreen'; 

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator(); // 2. INICIALIZAMOS EL STACK
const logo = require('./assets/logo-provisional.png');

// 3. CREAMOS UNA "SUCURSAL" DE NAVEGACIÓN PARA LOS AJUSTES
function SettingsStack() {
  return (
    <Stack.Navigator>
      {/* Esta es la pantalla principal del menú de opciones */}
      <Stack.Screen 
        name="OpcionesMain" 
        component={SettingsScreen} 
        options={{ headerShown: false }} // Ocultamos el título nativo aquí
      />
      {/* Esta es la pantalla de estadísticas que se abrirá POR ENCIMA */}
      <Stack.Screen 
        name="Stats" 
        component={StatsScreen} 
        options={{ 
          title: 'Análisis de Datos',
          headerBackTitle: 'Atrás' // Texto de la flecha de retroceso (iOS)
        }} 
      />
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    //initDB(); 
  }, []);

  return (
    <SafeAreaProvider style={styles.safeArea}>
      {/* Esto aqui es el Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerSectionLeft}>
            <Image source={logo} style={styles.logo} />
        </View>
        <View style={styles.headerSectionCenter}>
            <Text style={styles.title}>Master Tronics</Text>
        </View>
        <View style={styles.headerSectionRight} />
      </View>

      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            animation: 'fade',
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
            tabBarActiveTintColor: '#2196F3', 
            tabBarInactiveTintColor: 'gray',  
            headerShown: false,               
            tabBarStyle: { height: 60, paddingBottom: 10 }
          })}
        >
          <Tab.Screen name="Control" component={HomeScreen} />
          <Tab.Screen name="Logs" component={LogsScreen} />
          <Tab.Screen name="Usuarios" component={UsersScreen} />
          
          {/* 4. CONECTAMOS LA PESTAÑA A LA PILA (STACK) EN LUGAR DE A UNA SOLA PANTALLA */}
          <Tab.Screen name="Ajustes" component={SettingsStack} />
          
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  ); 
}
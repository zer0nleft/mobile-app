import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, Animated, TouchableOpacity } from 'react-native'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react'; // Si no lo tenías importado
import { insertLog, getLogsPaginated } from '../api'; 
import { LockButton, ActivityItem } from '../components';
import { styles } from '../constants'; 

export default function HomeScreen() {
  const { currentUser } = useContext(AuthContext);
  const [isLocked, setIsLocked] = useState(true); 
  const [recentLogs, setRecentLogs] = useState([]);
  
  // Nuevos estados para la seguridad
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Referencia para la animación de vibración del candado
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const isFocused = useIsFocused();

  // 1. EVALUAR EL HARDWARE AL CARGAR LA PANTALLA
  useEffect(() => {
    const verificarHardware = async () => {
      // ¿El teléfono tiene hardware biométrico?
      const compatible = await LocalAuthentication.hasHardwareAsync();
      // ¿El usuario tiene alguna huella registrada?
      const records = await LocalAuthentication.isEnrolledAsync();
      
      setHasBiometrics(compatible && records);
    };
    
    verificarHardware();
  }, []);

const cargarDatos = async () => {
    try {
      // Extraemos la fecha local exacta del teléfono (YYYY-MM-DD)
      const tzDate = new Date();
      const year = tzDate.getFullYear();
      const month = String(tzDate.getMonth() + 1).padStart(2, '0');
      const day = String(tzDate.getDate()).padStart(2, '0');
      const hoy = `${year}-${month}-${day}`;
      
      const respuesta = await getLogsPaginated(hoy, 1, 4);
      if (respuesta && respuesta.data) {
        setRecentLogs(respuesta.data);
      }
    } catch (error) {
      console.error("Error al cargar actividad reciente:", error);
    }
  };
  useEffect(() => {
    if (isFocused) cargarDatos();
  }, [isFocused]);

  // 2. FUNCIÓN DE ANIMACIÓN (VIBRACIÓN)
  const hacerVibrarCandado = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 15, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -15, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 15, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true })
    ]).start();
  };

  // 3. NÚCLEO DE AUTENTICACIÓN (Unificado y Flexible)
  const manejarAutenticacion = async () => {
    const proximoEstado = !isLocked;
    
    try {
      // Opciones flexibles: Pide huella si hay, pero siempre permite usar el PIN
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: hasBiometrics ? 'Verifica tu identidad' : 'Ingresa tu PIN o Patrón',
        fallbackLabel: 'Usar Patrón/PIN', 
        disableDeviceFallback: false, // Esto es lo que lo hace flexible
      });

      if (result.success) {
        setIsLocked(proximoEstado);      
        
        // 1. Atrapamos el ID por sus posibles nombres y lo imprimimos en la consola
        const idUsuario = currentUser.id || currentUser.worker_id;
        console.log("Intentando guardar log con ID de Usuario:", idUsuario);

        if (!idUsuario) {
          throw new Error("El usuario actual no tiene un ID válido");
        }

        // 2. Enviamos el ID asegurado a la base de datos
        await insertLog(1, idUsuario, !proximoEstado); 
        await cargarDatos(); 
      } else {
        throw new Error("Autenticación fallida o cancelada");
      }
    } catch (error) {
      hacerVibrarCandado();
      setErrorMessage("La verificación de seguridad ha sido incorrecta");
      
      setTimeout(() => {
        setErrorMessage(null);
      }, 6000);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Contenedor del Candado con Animación */}
        <Animated.View style={[styles.lockContainer, { transform: [{ translateX: shakeAnimation }] }]}>
            <MaterialCommunityIcons 
              name={isLocked ? "lock-outline" : "lock-open-outline"} 
              size={180} 
              color={isLocked ? "#F44336" : "#4CAF50"} 
            />
            
            {/* Contenedor Horizontal para los botones */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 }}>
              
              <LockButton
                isLocked={isLocked}
                onPress={manejarAutenticacion} // Llamada simple
              />

            </View>

            {/* Mensaje de error condicional */}
            {errorMessage && (
              <Text style={{ color: '#F44336', marginTop: 15, fontWeight: 'bold', textAlign: 'center' }}>
                {errorMessage}
              </Text>
            )}

        </Animated.View>

        <View style={styles.verticalSeparator}>
            <Text style={styles.titlesToLeft}>Actividad Reciente:</Text>
        </View>

        {/* Renderizado de tarjetas */}
        {recentLogs.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>Cargando actividad...</Text>
        ) : (
          recentLogs.map((log) => {
            const iniciales = `${log.first_name?.charAt(0) || ''}${log.last_name?.charAt(0) || ''}`.toUpperCase();
            const nombreCompleto = `${log.first_name || 'Usuario'} ${log.last_name || 'Eliminado'}`;
            
            // ¡AQUÍ FALTABA EL RETURN!
            return (
              <ActivityItem 
                key={log.id}
                initials={iniciales || '??'} 
                name={`Candado #${log.lock_id} - ${nombreCompleto}`} 
                timeAction={new Date(log.created_at).toLocaleTimeString()} 
                isUnlocked={log.is_unlocked} 
              />
            );
          })
        )}
    </ScrollView>
  );
}
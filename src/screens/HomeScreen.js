import React, { useState, useEffect, useRef, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, Animated, TouchableOpacity } from 'react-native'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';

// Contexto y API (Imports agrupados y limpios)
import { AuthContext } from '../context/AuthContext';
import { insertLog, getLogsPaginated, getLockStatus } from '../api'; 

// Componentes y estilos
import { LockButton, ActivityItem } from '../components';
import { styles } from '../constants'; 

export default function HomeScreen() {
  const { currentUser } = useContext(AuthContext);
  
  // Estado principal del candado (true = cerrado, false = abierto)
  const [isLocked, setIsLocked] = useState(true);
  const [recentLogs, setRecentLogs] = useState([]);
  
  // Nuevos estados para la seguridad
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Referencia para la animación de vibración del candado
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const isFocused = useIsFocused();

  // ==========================================
  // 1. POLLING: Sincronización con la nube
  // ==========================================
  useEffect(() => {
    const fetchCurrentStatus = async () => {
      try {
        const status = await getLockStatus();
        // Si el servidor dice que está desbloqueado (true), 
        // entonces isLocked debe ser false.
        setIsLocked(!status.unlocked); 
      } catch (error) {
        console.error("Error consultando estado en segundo plano:", error);
      }
    };

    // Consultar inmediatamente al abrir la pantalla
    fetchCurrentStatus();

    // Consultar automáticamente cada 3 segundos
    const intervalId = setInterval(() => {
      fetchCurrentStatus();
    }, 3000);

    // Limpiar el intervalo al salir de la pantalla para no saturar la memoria
    return () => clearInterval(intervalId);
  }, []);

  // ==========================================
  // 2. VERIFICACIÓN DE HARDWARE BIOMÉTRICO
  // ==========================================
  useEffect(() => {
    const verificarHardware = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const records = await LocalAuthentication.isEnrolledAsync();
      setHasBiometrics(compatible && records);
    };
    
    verificarHardware();
  }, []);

  // ==========================================
  // 3. CARGAR EL HISTORIAL (LOGS)
  // ==========================================
  const cargarDatos = async () => {
    try {
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

  // ==========================================
  // 4. ANIMACIÓN DE ERROR (VIBRACIÓN)
  // ==========================================
  const hacerVibrarCandado = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 15, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -15, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 15, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true })
    ]).start();
  };

  // ==========================================
  // 5. MANEJO DE APERTURA/CIERRE
  // ==========================================
  const manejarAutenticacion = async () => {
    const proximoEstado = !isLocked; // Si estaba bloqueado(true), ahora será false
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: hasBiometrics ? 'Verifica tu identidad' : 'Ingresa tu PIN o Patrón',
        fallbackLabel: 'Usar Patrón/PIN', 
        disableDeviceFallback: false, 
      });

      if (result.success) {
        // Actualizamos visualmente de inmediato para que la app se sienta rápida
        setIsLocked(proximoEstado);      
        
        const idUsuario = currentUser.id || currentUser.worker_id;
        
        if (!idUsuario) {
          throw new Error("El usuario actual no tiene un ID válido");
        }

        // Enviamos el registro a PostgreSQL (Nota: isUnlocked es lo inverso a isLocked)
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

  // ==========================================
  // RENDERIZADO VISUAL
  // ==========================================
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
                onPress={manejarAutenticacion} 
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

        {/* Renderizado de tarjetas del historial */}
        {recentLogs.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>No hay actividad reciente registrada hoy...</Text>
        ) : (
          recentLogs.map((log) => {
            const iniciales = `${log.first_name?.charAt(0) || ''}${log.last_name?.charAt(0) || ''}`.toUpperCase();
            const nombreCompleto = `${log.first_name || 'Usuario'} ${log.last_name || 'Eliminado'}`;
            
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
import React, { useState, useEffect, useRef, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, Animated } from 'react-native'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';

// Contexto y API
import { AuthContext } from '../context/AuthContext';
import { insertLog, getLogsPaginated } from '../api'; // Eliminamos getLockStatus

// Componentes y estilos
import { LockButton, ActivityItem } from '../components';
import { styles } from '../constants'; 

export default function HomeScreen() {
  const { currentUser } = useContext(AuthContext);
  
  // Estados de la interfaz del candado
  const [isLocked, setIsLocked] = useState(true); // Siempre cerrado por defecto
  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // Controla el cooldown visual
  
  const [recentLogs, setRecentLogs] = useState([]);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // Usado para errores o info ("Ya está abierto")
  const [isErrorMsg, setIsErrorMsg] = useState(true); // Para pintar el texto rojo o verde/gris
  
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();

  // ==========================================
  // 1. POLLING: Sincronización del Historial
  // ==========================================
  const cargarDatos = async () => {
    try {
      const tzDate = new Date();
      const hoy = `${tzDate.getFullYear()}-${String(tzDate.getMonth() + 1).padStart(2, '0')}-${String(tzDate.getDate()).padStart(2, '0')}`;
      
      const respuesta = await getLogsPaginated(hoy, 1, 4);
      if (respuesta && respuesta.data) {
        setRecentLogs(respuesta.data);
      }
    } catch (error) {
      console.log("Cargando actividad reciente silenciosamente...");
    }
  };

  useEffect(() => {
    if (isFocused) {
      cargarDatos(); // Carga inicial al entrar a la pantalla
      
      // Consultar nuevos logs cada 3 segundos
      const intervalId = setInterval(() => {
        cargarDatos();
      }, 3000);

      return () => clearInterval(intervalId);
    }
  }, [isFocused]);

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
  // 3. ANIMACIÓN DE ERROR (VIBRACIÓN)
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
  // 4. SECUENCIA VISUAL DE APERTURA (3 SEGUNDOS)
  // ==========================================
  const ejecutarSecuenciaApertura = (mensajePersonalizado = null) => {
    setIsLocked(false); // Candado visualmente abierto
    setIsButtonDisabled(true); // Bloquear el botón
    
    if (mensajePersonalizado) {
      setIsErrorMsg(false); // Mensaje en gris/neutral, no error
      setStatusMessage(mensajePersonalizado);
    }

    // A los 3 segundos, todo vuelve a la normalidad
    setTimeout(() => {
      setIsLocked(true);
      setIsButtonDisabled(false);
      setStatusMessage(null);
    }, 5000);
  };

  // ==========================================
  // 5. MANEJO DE APERTURA (PULSO ÚNICO)
  // ==========================================
  const manejarAutenticacion = async () => {
    // Evitar que el usuario presione si ya está en la secuencia de 3 segundos
    if (isButtonDisabled) return; 
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: hasBiometrics ? 'Verifica tu identidad para abrir' : 'Ingresa tu PIN o Patrón',
        fallbackLabel: 'Usar Patrón/PIN', 
        disableDeviceFallback: false, 
      });

      if (result.success) {
        const idUsuario = currentUser.id || currentUser.worker_id;
        if (!idUsuario) throw new Error("ID de usuario inválido");

        try {
          // Intentamos enviar la orden de abrir (true)
          await insertLog(1, idUsuario, true);
          
          // Si la API responde 201 (Éxito), ejecutamos la animación limpia
          ejecutarSecuenciaApertura();
          cargarDatos(); // Forzamos actualización de logs instantánea
          
        } catch (apiError) {
          // Asumimos que si la API rechaza (ej. por axios arrojando error 429), entra aquí
          // Verifica cómo lanza los errores tu archivo api.js. Si incluye la palabra "cooldown" o similar:
          const errorMessage = apiError.response?.data?.message || apiError.message;
          
          if (errorMessage.includes("abierto") || apiError.response?.status === 429) {
            // El API avisó que otro usuario ya lo abrió o está en cooldown
            ejecutarSecuenciaApertura("El candado ya está abierto");
          } else {
             throw new Error("Error de conexión con el servidor");
          }
        }
      } else {
        throw new Error("Autenticación fallida o cancelada");
      }
    } catch (error) {
      // Manejo de errores reales (Biometría cancelada, fallo de red, etc)
      hacerVibrarCandado();
      setIsErrorMsg(true);
      setStatusMessage("La verificación de seguridad ha sido incorrecta");
      setTimeout(() => setStatusMessage(null), 4000);
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
              color={isLocked ? "#59e717" : (isButtonDisabled ? "#9E9E9E" : "#4CAF50")} 
              // Se pone gris (#9E9E9E) si está abierto en cooldown, si no, verde al abrir.
            />
            
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 }}>
              <LockButton
                isLocked={isLocked}
                onPress={manejarAutenticacion} 
                disabled={isButtonDisabled} // Nueva prop sugerida para tu componente LockButton
              />
            </View>

            {/* Mensajes dinámicos (Errores en rojo, Cooldown en gris oscuro) */}
            {statusMessage && (
              <Text style={{ 
                color: isErrorMsg ? '#59e717' : '#555', 
                marginTop: 15, 
                fontWeight: 'bold', 
                textAlign: 'center' 
              }}>
                {statusMessage}
              </Text>
            )}
        </Animated.View>

        <View style={styles.verticalSeparator}>
            <Text style={styles.titlesToLeft}>Actividad Reciente:</Text>
        </View>

        {recentLogs.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>No hay actividad reciente registrada hoy...</Text>
        ) : (
          recentLogs.map((log) => {
            const iniciales = `${log.first_name?.charAt(0) || ''}${log.last_name?.charAt(0) || ''}`.toUpperCase();
            const nombreCompleto = `${log.first_name || 'Usuario'} ${log.last_name || ''}`;
            
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
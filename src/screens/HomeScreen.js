import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, Pressable, ScrollView } from 'react-native'; 
import { useState, useEffect } from 'react'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from '../constants'; 
import { Omega } from 'lucide-react-native';

//Aqui importo mi nueva api para hacer las consultas a postgre
import { insertLog, getLogsPaginated } from '../api';
import { useIsFocused } from '@react-navigation/native';



//Empiezo a imnportar mis propios componentes:
import { LockButton, ActivityItem } from '../components';




export default function HomeScreen() {
  const [isLocked, setIsLocked] = useState(true); 
  const [recentLogs, setRecentLogs] = useState([]);
  const isFocused = useIsFocused(); // Para recargar al entrar a la pestaña

  // Nueva función asíncrona para cargar datos de PostgreSQL
  const cargarDatos = async () => {
    try {
      // 2. CAMBIO: Llamar a la nueva función
      // Enviamos la fecha de hoy, página 1, y límite de 4 para "Actividad Reciente"
      const hoy = new Date().toISOString().split('T')[0];
      const respuesta = await getLogsPaginated(hoy, 1, 4);
      
      if (respuesta && respuesta.data) {
        setRecentLogs(respuesta.data);
      }
    } catch (error) {
      console.error("Error al cargar actividad reciente:", error);
    }
  };

  // Cargar datos cada vez que la pantalla se muestra
  useEffect(() => {
    if (isFocused) {
      cargarDatos();
    }
  }, [isFocused]);

  // Nueva función asíncrona para registrar el acceso
  const registrarAcceso = async (nuevoEstado) => {
    try {
      const isUnlocked = !nuevoEstado;
      
      // Simulamos: Candado ID 1, Tarjeta ID 1 (Master Tronic)
      await insertLog(1, 1, isUnlocked); 
      
      console.log("¡Log enviado a la API!");
      await cargarDatos(); // Actualiza la lista en pantalla
      
    } catch (error) {
      console.error("Fallo al registrar acceso:", error);
    }
  };

  return (
    <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
    >
 

    
    {/* Esto es el candado con su boton y su logo */}
    <View style={styles.lockContainer}>
        <MaterialCommunityIcons 
          // Cambiamos el icono según isUnlocked
          name={isLocked ?  "lock-outline":"lock-open-outline"} 
          size={200} 
          // Cambiamos el color según isUnlocked (verde para abierto, rojo para cerrado)
          color={isLocked ?  "#F44336":"#4CAF50"} 
        />
        
    <LockButton
      isLocked={isLocked}
      onPress={() => {
        const proximoEstado = !isLocked; 
        setIsLocked(proximoEstado);      
        registrarAcceso(proximoEstado);  // Guardamos en la base de datos
      }}
    />

    </View>

    <View style={styles.verticalSeparator}>
        <Text style={styles.titlesToLeft}>Actividad Reciente:</Text>

    </View>

        <View>
            {/* Renderizado de tarjetas desde la API */}
        {recentLogs.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>No hay Actividad reciente</Text>
        ) : (
          recentLogs.map((log) => (
            <ActivityItem 
              key={log.id}
              initials="MT" 
              // 1. Aquí mapeamos la nueva estructura de PostgreSQL
              name={`Candado #${log.lock_id} - Tarjeta #${log.nfc_card_id}`} 
              // 2. Aquí convertimos ese texto feo de fecha en una hora legible (Ej: "8:12:46 PM")
              timeAction={new Date(log.created_at).toLocaleTimeString()} 
              // 3. PostgreSQL ya nos da true/false directamente
              isUnlocked={log.is_unlocked} 
            />
          ))
        )}
        {/* ... Sección inferior (Navegación)... */}
        </View>
    </ScrollView>
  );
}
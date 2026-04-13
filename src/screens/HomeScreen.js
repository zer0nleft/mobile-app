import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, Pressable, ScrollView } from 'react-native'; 
import { useState, useEffect } from 'react'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from '../constants'; 
import { Omega } from 'lucide-react-native';

//base de datoos
//import { database } from '../database';


//Empiezo a imnportar mis propios componentes:
import { LockButton, ActivityItem } from '../components';
import { insertLog, getAllLogs } from '../database'; 
import { useIsFocused } from '@react-navigation/native';



export default function HomeScreen() {
  const [isLocked, setIsLocked] = useState(true); 

  const [recentLogs, setRecentLogs] = useState([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      const data = getAllLogs();
      setRecentLogs(data.slice(0, 6)); // Tomamos solo los 4 más recientes
    }
  }, [isFocused]);

  const registrarAcceso = (nuevoEstado) => {
    try {
      // El jefe siempre es Master Tronic
      const nombre = "Master Tronic";
      const accion = nuevoEstado ? "Locked" : "Unlocked";
      const unlockedBit = !nuevoEstado; // Si Locked es false, está Unlocked

      insertLog(nombre, accion, unlockedBit);
      console.log("¡Log guardado en SQLite!");
    } catch (error) {
      console.error("Error en SQLite:", error);
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
            {/* Renderizado de las tarjetas reutilizables */}
        
  {recentLogs.map((log) => (
    <ActivityItem 
      key={log.id}
      initials="MT"
      name={log.employee_name}
      timeAction={log.created_at}
      isUnlocked={log.is_unlocked === 1}
    />
  ))}

        {/* ... Sección inferior (Navegación)... */}
        </View>
    </ScrollView>
  );
}
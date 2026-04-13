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
import { insertLog } from '../database'; 




export default function HomeScreen() {
  const [isLocked, setIsLocked] = useState(true); 

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
          name={isLocked ? "lock-open-outline" : "lock-outline"} 
          size={200} 
          // Cambiamos el color según isUnlocked (verde para abierto, rojo para cerrado)
          color={isLocked ? "#4CAF50" : "#F44336"} 
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
        
        {/* Tarjeta 1 */}
        <ActivityItem 
            initials="JD"
            name="John Doe"
            timeAction="08:31 AM - Unlocked"
            isUnlocked={true} // Mostrará candado abierto/verde
        />

        {/* Tarjeta 2 */}
        <ActivityItem 
            initials="JD"
            name="Access Card #14 (Sarah L.)"
            timeAction="08:15 AM - Unlocked"
            isUnlocked={true} // Mostrará candado abierto/verde
        />

        {/* Tarjeta 3 */}
        <ActivityItem 
            initials="JD"
            name="John Doe"
            timeAction="07:55 AM - Locked"
            isUnlocked={false} // Mostrará candado cerrado/rojo
        />
        <ActivityItem 
            initials="JD"
            name="John Doe"
            timeAction="07:55 AM - Locked"
            isUnlocked={false} // Mostrará candado cerrado/rojo
        />
        <ActivityItem 
            initials="JD"
            name="John Doe"
            timeAction="07:55 AM - Locked"
            isUnlocked={false} // Mostrará candado cerrado/rojo
        />
        <ActivityItem 
            initials="JD"
            name="John Doe"
            timeAction="07:55 AM - Locked"
            isUnlocked={false} // Mostrará candado cerrado/rojo
        />

        {/* ... Sección inferior (Navegación)... */}
        </View>
    </ScrollView>
  );
}
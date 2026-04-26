import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { COLORS } from './constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';

//Aqui van los componentes reutilizables de la app, como botones, tarjetas, etc.

//1. Boton de abrir y cerrar el cerrojo:


export const LockButton = ({ isLocked, onPress }) => { // 1. Recibimos onPress como prop

  const manejarPresion = () => {

    if (isLocked) {
      console.log("Desbloqueando...");
    } else {
      console.log("Bloqueando...");
    }
    onPress(); 
  };

  return (
    <Pressable onPress={manejarPresion} style={styles.lockButton}>
      <Text style={styles.textButton}>
        {isLocked ? 'Desbloquear' : 'Bloquear'}
      </Text>
    </Pressable>
  );
};


export const ActivityItem = ({ initials, name, timeAction, isUnlocked }) => {
  return (
    <View style={styles.containerCards}>
      {/* 1. SECCIÓN IZQUIERDA: Avatar */}
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      {/* 2. SECCIÓN CENTRAL: Detalles */}
      <View style={styles.detailsContainer}>
        <Text style={styles.nameText}>{name}</Text>
        <Text style={styles.timeActionText}>{timeAction}</Text>
      </View>

      {/* 3. SECCIÓN DERECHA: Icono de Estado */}
      <View style={styles.statusContainer}>
        <MaterialCommunityIcons 
          // Cambiamos el icono según isUnlocked
          name={isUnlocked ? "lock-open-outline" : "lock-outline"} 
          size={24} 
          // Cambiamos el color según isUnlocked (verde para abierto, rojo para cerrado)
          color={isUnlocked ? "#4CAF50" : "#F44336"} 
        />
      </View>
    </View>
  );
};

export const LogItem = ({ id, initials, name, timeAction, isUnlocked, onDelete }) => {
  return (
    <View style={styles.containerCards}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.nameText}>{name}</Text>
        <Text style={styles.timeActionText}>{timeAction}</Text>
      </View>

      {/* Sección de Iconos: Candado y el nuevo botón de Borrar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
        <MaterialCommunityIcons 
          name={isUnlocked ? "lock-open-outline" : "lock-outline"} 
          size={22} 
          color={isUnlocked ? "#4CAF50" : "#F44336"} 
        />
        
        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  lockButton: {
    backgroundColor:COLORS.primary,
    color: '#fff',
    paddingVertical: 25,
    paddingHorizontal: 100,
    borderRadius: 5,
    fontSize: 16,
    fontWeight: 'bold',
    display: 'flex',
    justifyContent: 'center', // Centra el texto verticalmente
    alignItems: 'center',     // Centra el texto horizontalmente
  },
  textButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    position: 'absolute',
  },
  containerCards:{
    flexDirection: 'row', // Alineación horizontal
    alignItems: 'center', // Centrado vertical de los elementos
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12, // Bordes redondeados
    marginBottom: 10, // Espacio entre tarjetas
    // Sombra para iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Elevación para Android
    elevation: 2,
  },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5, // Círculo perfecto
    backgroundColor: '#E0E0E0', // Gris claro
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15, // Espacio con los detalles
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#757575', // Gris oscuro para el texto
  },
  detailsContainer: {
    flex: 1, // Ocupa el espacio restante en el centro
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600', // Semibold
    color: '#212121', // Negro casi puro
    marginBottom: 2,
  },
  timeActionText: {
    fontSize: 14,
    color: '#757575', // Gris para la info secundaria
  },
  statusContainer: {
    marginLeft: 15, // Espacio con los detalles
    justifyContent: 'center',
    alignItems: 'center',
  },
});
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { getAllLogs, deleteLog } from '../database';
import { LogItem } from '../components';
import { styles } from '../constants';

export default function LogsScreen() {
  const [logs, setLogs] = useState([]);
  const isFocused = useIsFocused(); // Detecta cuando entramos a la pestaña

  // Función para cargar los datos
  const cargarLogs = () => {
    const data = getAllLogs();
    setLogs(data);
  };

  useEffect(() => {
    if (isFocused) {
      cargarLogs(); // Recarga la lista cada vez que la pantalla se ve
    }
  }, [isFocused]);

  const manejarBorrado = (id) => {
    Alert.alert("Eliminar", "¿Estás seguro de borrar este registro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar", style: "destructive", onPress: () => {
          deleteLog(id);
          cargarLogs(); // Refrescar la lista tras borrar
      }}
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.titlesToLeft}>Historial de Accesos</Text>
      
      {logs.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>No hay registros aún</Text>
      ) : (
        logs.map((log) => (
          <LogItem 
            key={log.id}
            id={log.id}
            initials="MT"
            name={log.employee_name}
            timeAction={log.created_at}
            isUnlocked={log.is_unlocked === 1}
            onDelete={manejarBorrado}
          />
        ))
      )}
    </ScrollView>
  );
}
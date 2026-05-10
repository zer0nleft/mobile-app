import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

// 1. IMPORTAMOS TU NUEVA API
import { getLogsPaginated } from '../api'; 
import { LogItem } from '../components';
import { styles } from '../constants';

export default function LogsScreen() {
  // Estados para la paginación y datos
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para la Fecha
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isFocused = useIsFocused();

  // Función principal de carga
const cargarLogs = async (fecha, pagina) => {
    setIsLoading(true);
    
    // Extraemos la fecha local exacta del calendario
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`; 
    
    const respuesta = await getLogsPaginated(dateStr, pagina, 10);
    
    if (respuesta && respuesta.data) {
      setLogs(respuesta.data);
      setCurrentPage(respuesta.currentPage);
      setTotalPages(respuesta.totalPages);
    }
    setIsLoading(false);
  };

  // Se ejecuta al entrar a la pantalla o al cambiar la fecha/página
  useEffect(() => {
    if (isFocused) {
      cargarLogs(selectedDate, currentPage); 
    }
  }, [isFocused, selectedDate, currentPage]);

  // Manejador del calendario
  const onChangeDate = (event, newDate) => {
    setShowDatePicker(false); // Ocultar modal
    if (newDate) {
      setSelectedDate(newDate);
      setCurrentPage(1); // Si cambia de fecha, lo devolvemos a la página 1
    }
  };

  // Funciones de navegación de páginas
  const irPaginaAnterior = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const irPaginaSiguiente = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Formateador de texto amigable: "Lunes, 26/04/2026"
  const fechaAmigable = selectedDate.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <Text style={styles.titlesToLeft}>Historial de Accesos</Text>
        
        {/* BOTÓN SELECTOR DE FECHA */}
        <TouchableOpacity 
          onPress={() => setShowDatePicker(true)}
          style={{ marginBottom: 15, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' }}
        >
          <Text style={{ fontSize: 16, color: '#2196F3', fontWeight: 'bold', textTransform: 'capitalize' }}>
            Mostrando: {fechaAmigable}
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL DEL CALENDARIO (Nativo de Android/iOS) */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onChangeDate}
          maximumDate={new Date()} // No dejar elegir fechas del futuro
        />
      )}

      {/* RENDERIZADO DE LA LISTA */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 50 }} />
      ) : logs.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>No hay registros para este día</Text>
      ) : (
        <FlatList
        data={logs}
        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <LogItem 
              id={item.id}
              initials="MT"
              // Reemplazamos aquí también
              name={`Candado #${item.lock_id} - Master Tronics`}
              timeAction={new Date(item.created_at).toLocaleTimeString()} 
              isUnlocked={item.is_unlocked} 
            />
          )}
        />
      )}

      {/* CONTROLES DE PAGINACIÓN */}
      {logs.length > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#f9f9f9', borderTopWidth: 1, borderColor: '#eee' }}>
          
          <TouchableOpacity 
            onPress={irPaginaAnterior} 
            disabled={currentPage === 1}
            style={{ padding: 10, opacity: currentPage === 1 ? 0.3 : 1 }}
          >
            <Text style={{ color: '#2196F3', fontWeight: 'bold' }}>{"< Anterior"}</Text>
          </TouchableOpacity>

          <Text style={{ color: '#666' }}>
            Página {currentPage} de {totalPages}
          </Text>

          <TouchableOpacity 
            onPress={irPaginaSiguiente} 
            disabled={currentPage === totalPages}
            style={{ padding: 10, opacity: currentPage === totalPages ? 0.3 : 1 }}
          >
            <Text style={{ color: '#2196F3', fontWeight: 'bold' }}>{"Siguiente >"}</Text>
          </TouchableOpacity>

        </View>
      )}
    </View>
  );
}
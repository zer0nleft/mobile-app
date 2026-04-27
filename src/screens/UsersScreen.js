import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TextInput, TouchableOpacity, FlatList, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

import DateTimePicker from '@react-native-community/datetimepicker';
import { getWorkers, createWorker, updateWorker, deleteWorker, getLogsByUserPaginated } from '../api';
import { LogItem } from '../components'; // Asegúrate de tener esto
// Importamos styles pero NO lo usaremos en el contenedor principal para evitar el colapso
import { styles } from '../constants'; 

export default function UsersScreen() {
  // Estados para el Modal de Historial Paginado
  const [userLogs, setUserLogs] = useState([]);
  const [isLogModalVisible, setLogModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // Guardamos el objeto entero
  
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const [logDate, setLogDate] = useState(new Date());
  const [showLogDatePicker, setShowLogDatePicker] = useState(false);


  const [users, setUsers] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const isFocused = useIsFocused();
  
  const [editingId, setEditingId] = useState(null); 
  const [form, setForm] = useState({ first_name: '', last_name: '', worker_code: '', access_level: 0 });





  const verHistorialUsuario = (user) => {
      setSelectedUser(user);
      setLogDate(new Date()); // Reiniciar a la fecha de hoy
      setLogPage(1); // Reiniciar a la página 1
      cargarLogsUsuario(user.id, new Date(), 1);
      setLogModalVisible(true);
  
    };
    const onChangeLogDate = (event, newDate) => {
    setShowLogDatePicker(false);
    if (newDate) {
      setLogDate(newDate);
      setLogPage(1);
      cargarLogsUsuario(selectedUser.id, newDate, 1);
    }
  };
  const irPaginaAnteriorLog = () => {
    if (logPage > 1) {
      const nuevaPag = logPage - 1;
      setLogPage(nuevaPag);
      cargarLogsUsuario(selectedUser.id, logDate, nuevaPag);
    }
  };
  const irPaginaSiguienteLog = () => {
    if (logPage < logTotalPages) {
      const nuevaPag = logPage + 1;
      setLogPage(nuevaPag);
      cargarLogsUsuario(selectedUser.id, logDate, nuevaPag);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const data = await getWorkers();
      console.log("Datos que llegaron a la pantalla:", data); // Revisa tu consola
      setUsers(Array.isArray(data) ? data : []); 
    } catch (error) {
      console.error("Error al cargar:", error);
      setUsers([]);
    }
  };

  useEffect(() => {
    if (isFocused) cargarUsuarios();
  }, [isFocused]);

  const abrirParaCrear = () => {
    setEditingId(null);
    setForm({ first_name: '', last_name: '', worker_code: '', access_level: 0 });
    setModalVisible(true);
  };

  const abrirParaEditar = (user) => {
    setEditingId(user.id);
    setForm({ 
      first_name: user.first_name, 
      last_name: user.last_name, 
      worker_code: user.worker_code, 
      access_level: user.access_level 
    });
    setModalVisible(true);
  };

  const guardarUsuario = async () => {
    if (!form.first_name || !form.last_name || !form.worker_code) {
      Alert.alert("Error", "Todos los campos de texto son obligatorios");
      return;
    }

    if (editingId) {
      await updateWorker(editingId, form);
    } else {
      await createWorker(form);
    }
    
    setModalVisible(false);
    cargarUsuarios();
  };
  const cargarLogsUsuario = async (userId, fecha, pagina) => {
    try {
      const dateStr = fecha.toISOString().split('T')[0];
      const respuesta = await getLogsByUserPaginated(userId, dateStr, pagina, 10);
      
      if (respuesta && respuesta.data) {
        setUserLogs(respuesta.data);
        setLogPage(respuesta.currentPage);
        setLogTotalPages(respuesta.totalPages);
      }
    } catch (error) {
      console.error("Error al pedir los logs del usuario:", error);
    }
  };


  const confirmarEliminacion = (id) => {
    Alert.alert(
      "Eliminar Usuario",
      "¿Estás seguro de que quieres eliminar a este usuario?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: async () => {
            await deleteWorker(id);
            cargarUsuarios();
          } 
        }
      ]
    );
  };

  return (
    // LA SOLUCIÓN: Quitamos styles.container y forzamos ancho y alto al 100%
    <View style={{ flex: 1, backgroundColor: '#f5f5f5', padding: 20, width: '100%', height: '100%' }}>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333' }}>Gestión de Usuarios</Text>
        <TouchableOpacity onPress={abrirParaCrear} style={{ backgroundColor: '#4CAF50', padding: 10, borderRadius: 8 }}>
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* LISTA DE USUARIOS CON CONTENEDOR EXPANDIDO */}
      <FlatList
        data={users}
        style={{ flex: 1, width: '100%' }} // Forzamos a la lista a expandirse
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }} // Aseguramos espacio interior
        keyExtractor={(item, index) => item.worker_id ? item.worker_id.toString() : index.toString()}
        
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 }}>
            <MaterialCommunityIcons name="account-search" size={50} color="#ccc" />
            <Text style={{ textAlign: 'center', marginTop: 10, color: '#999', fontSize: 16 }}>
              {users.length === 0 ? "Buscando o no hay usuarios registrados" : "Cargando..."}
            </Text>
          </View>
        }

        renderItem={({ item }) => (
          <View style={{ backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.first_name} {item.last_name}</Text>
              <Text style={{ color: '#666' }}>Código: {item.worker_code}</Text>
              <Text style={{ color: item.access_level === 1 ? '#D32F2F' : '#2196F3', fontWeight: 'bold', marginTop: 5 }}>
                {item.access_level === 1 ? '👑 Jefe' : '👤 Empleado'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              {/* Botón de ver historial */}
              <TouchableOpacity onPress={() => verHistorialUsuario(item)} style={{ marginRight: 15 }}>
                <MaterialCommunityIcons name="clipboard-text-clock" size={24} color="#2196F3" />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => abrirParaEditar(item)} style={{ marginRight: 15 }}>
                <MaterialCommunityIcons name="pencil" size={24} color="#FFA000" />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => confirmarEliminacion(item.id)}>
                <MaterialCommunityIcons name="trash-can" size={24} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* TU MODAL NATIVO ORIGINAL QUE FUNCIONA */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 15 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>
                {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
              </Text>

              <TextInput 
                placeholder="Nombre" 
                value={form.first_name} 
                onChangeText={(text) => setForm({...form, first_name: text})} 
                style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 8 }} 
              />
              <TextInput 
                placeholder="Apellido" 
                value={form.last_name} 
                onChangeText={(text) => setForm({...form, last_name: text})} 
                style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 8 }} 
              />
              <TextInput 
                placeholder="Código (Ej: USR-002)" 
                value={form.worker_code} 
                onChangeText={(text) => setForm({...form, worker_code: text})} 
                style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 8 }} 
              />

              <Text style={{ marginBottom: 5, fontWeight: 'bold', color: '#555' }}>Nivel de Acceso:</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <TouchableOpacity 
                  onPress={() => setForm({...form, access_level: 0})}
                  style={{ flex: 1, padding: 10, backgroundColor: form.access_level === 0 ? '#2196F3' : '#eee', marginRight: 5, borderRadius: 8, alignItems: 'center' }}>
                  <Text style={{ color: form.access_level === 0 ? 'white' : 'black', fontWeight: 'bold' }}>Empleado</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => setForm({...form, access_level: 1})}
                  style={{ flex: 1, padding: 10, backgroundColor: form.access_level === 1 ? '#D32F2F' : '#eee', marginLeft: 5, borderRadius: 8, alignItems: 'center' }}>
                  <Text style={{ color: form.access_level === 1 ? 'white' : 'black', fontWeight: 'bold' }}>Jefe</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 10, marginRight: 15 }}>
                  <Text style={{ color: '#666', fontWeight: 'bold' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={guardarUsuario} style={{ backgroundColor: '#4CAF50', padding: 10, borderRadius: 8 }}>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>


{/* FALSO MODAL PARA EL HISTORIAL DEL USUARIO */}
      {/* FALSO MODAL PARA EL HISTORIAL DEL USUARIO (CON PAGINACIÓN Y FECHA) */}
      {isLogModalVisible && selectedUser && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 15, elevation: 10, flex: 1, maxHeight: '85%' }}>
            
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
              Accesos de: {selectedUser.first_name} {selectedUser.last_name}
            </Text>

            {/* BOTÓN SELECTOR DE FECHA */}
            <TouchableOpacity 
              onPress={() => setShowLogDatePicker(true)}
              style={{ marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#eee' }}
            >
              <Text style={{ fontSize: 16, color: '#2196F3', fontWeight: 'bold', textTransform: 'capitalize' }}>
                Mostrando: {logDate.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </Text>
            </TouchableOpacity>

            {/* MODAL DEL CALENDARIO NATIVO */}
            {showLogDatePicker && (
              <DateTimePicker
                value={logDate}
                mode="date"
                display="default"
                onChange={onChangeLogDate}
                maximumDate={new Date()} 
              />
            )}

            {/* LISTA DE ACCESOS */}
            <FlatList
              data={userLogs}
              keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
              ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>No hay accesos en esta fecha.</Text>}
              renderItem={({ item }) => (
                <LogItem 
                  id={item.id}
                  initials="MT" // Simulación temporal de sesión
                  name={`Candado #${item.lock_id} - Master Tronics`} // Simulación temporal
                  timeAction={new Date(item.created_at).toLocaleTimeString()}
                  isUnlocked={item.is_unlocked} 
                />
              )}
            />

            {/* CONTROLES DE PAGINACIÓN */}
            {userLogs.length > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, borderColor: '#eee' }}>
                <TouchableOpacity onPress={irPaginaAnteriorLog} disabled={logPage === 1} style={{ padding: 5, opacity: logPage === 1 ? 0.3 : 1 }}>
                  <Text style={{ color: '#2196F3', fontWeight: 'bold' }}>{"< Ant"}</Text>
                </TouchableOpacity>
                <Text style={{ color: '#666' }}>Pág {logPage} de {logTotalPages}</Text>
                <TouchableOpacity onPress={irPaginaSiguienteLog} disabled={logPage === logTotalPages} style={{ padding: 5, opacity: logPage === logTotalPages ? 0.3 : 1 }}>
                  <Text style={{ color: '#2196F3', fontWeight: 'bold' }}>{"Sig >"}</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity onPress={() => setLogModalVisible(false)} style={{ backgroundColor: '#F44336', padding: 12, borderRadius: 8, marginTop: 5, alignItems: 'center' }}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
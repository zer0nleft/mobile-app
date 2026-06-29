import React, { useState, useEffect, useContext } from 'react'; 
import { View, ScrollView, Text, TextInput, TouchableOpacity, FlatList, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

// AÑADIDO: Importamos getLastFingerprint
import { getWorkers, createWorker, updateWorker, deleteWorker, getLogsByUserPaginated, getLastNfcCard, getLastFingerprint } from '../api';
import { LogItem } from '../components'; 
import { styles } from '../constants'; 
import { AuthContext } from '../context/AuthContext';

export default function UsersScreen() {
  const { currentUser } = useContext(AuthContext); 

  const [userLogs, setUserLogs] = useState([]);
  const [isLogModalVisible, setLogModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); 
  
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const [logDate, setLogDate] = useState(new Date());
  const [showLogDatePicker, setShowLogDatePicker] = useState(false);

  const [users, setUsers] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const isFocused = useIsFocused();
  
  const [editingId, setEditingId] = useState(null); 
  // AÑADIDO: 'fingerprint_id' en el estado del formulario
  const [form, setForm] = useState({ first_name: '', last_name: '', username: '', worker_code: '', fingerprint_id: '', access_level: 0, password: '' });

  const verHistorialUsuario = (user) => {
      setSelectedUser(user);
      setLogDate(new Date()); 
      setLogPage(1); 
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

  const irPaginaAnteriorLog = () => { if (logPage > 1) { setLogPage(logPage - 1); cargarLogsUsuario(selectedUser.id, logDate, logPage - 1); } };
  const irPaginaSiguienteLog = () => { if (logPage < logTotalPages) { setLogPage(logPage + 1); cargarLogsUsuario(selectedUser.id, logDate, logPage + 1); } };

  const cargarUsuarios = async () => {
    try {
      const data = await getWorkers();
      setUsers(Array.isArray(data) ? data : []); 
    } catch (error) { setUsers([]); }
  };

  useEffect(() => { if (isFocused) cargarUsuarios(); }, [isFocused]);

  const abrirParaCrear = () => {
    setEditingId(null);
    setForm({ first_name: '', last_name: '', username: '', worker_code: '', fingerprint_id: '', access_level: 0, password: '' }); 
    setModalVisible(true);
  };

  const abrirParaEditar = (user) => {
    setEditingId(user.id);
    setForm({ 
      first_name: user.first_name, 
      last_name: user.last_name, 
      username: user.username || '', 
      worker_code: user.worker_code,
      fingerprint_id: user.fingerprint_id ? user.fingerprint_id.toString() : '', // Convertimos a string para el TextInput
      access_level: user.access_level,
      password: '' 
    });
    setModalVisible(true);
  };

  const escanearTarjetaFisica = async () => {
    const respuesta = await getLastNfcCard();
    if (respuesta && respuesta.rfid_code && respuesta.rfid_code.trim() !== '') {
      setForm({ ...form, worker_code: respuesta.rfid_code });
      Alert.alert("¡Tarjeta Detectada!", `UID copiado exitosamente: ${respuesta.rfid_code}`);
    } else {
      Alert.alert("Buzón Vacío", "No se detectó ninguna tarjeta rechazada recientemente.");
    }
  };

  // NUEVA FUNCIÓN: Obtener la huella dactilar del servidor
  const escanearHuellaFisica = async () => {
    const respuesta = await getLastFingerprint();
    if (respuesta && respuesta.finger_id !== null) {
      setForm({ ...form, fingerprint_id: respuesta.finger_id.toString() });
      Alert.alert("¡Huella Detectada!", `ID de huella copiado: ${respuesta.finger_id}`);
    } else {
      Alert.alert("Buzón Vacío", "No se detectó ninguna huella rechazada recientemente. Pon el dedo en el sensor e intenta de nuevo.");
    }
  };

const guardarUsuario = async () => {
    // 1. Validar campos que SIEMPRE son obligatorios (NFC y Huella ya no están aquí)
    if (!form.first_name || !form.last_name || !form.username) {
      Alert.alert("Error", "Nombre, Apellido y Nombre de Usuario son obligatorios.");
      return;
    }

    // 2. Validar contraseña SOLO si es un usuario nuevo (!editingId)
    if (!editingId && (!form.password || form.password.trim() === '')) {
      Alert.alert("Error", "La contraseña inicial es obligatoria al crear un nuevo usuario.");
      return;
    }

    // Si pasamos las validaciones, guardamos en la base de datos
    if (editingId) {
      await updateWorker(editingId, form);
    } else {
      await createWorker(form);
    }
    
    setModalVisible(false);
    cargarUsuarios();
  };

  const cargarLogsUsuario = async (userId, fecha, pagina) => {
      const dateStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`; 
      const respuesta = await getLogsByUserPaginated(userId, dateStr, pagina, 10);
      if (respuesta && respuesta.data) {
        setUserLogs(respuesta.data);
        setLogPage(respuesta.currentPage);
        setLogTotalPages(respuesta.totalPages);
      }
  };

  const confirmarEliminacion = (id) => {
    Alert.alert("Eliminar Usuario", "¿Estás seguro de que quieres eliminar a este usuario?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => { await deleteWorker(id); cargarUsuarios(); } }
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5', padding: 20, width: '100%', height: '100%' }}>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333' }}>Gestión de Usuarios</Text>
        {currentUser?.access_level === 1 && (
          <TouchableOpacity onPress={abrirParaCrear} style={{ backgroundColor: '#4CAF50', padding: 10, borderRadius: 8 }}>
            <MaterialCommunityIcons name="plus" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={users}
        style={{ flex: 1, width: '100%' }} 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }} 
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
              <Text style={{ color: '#888', fontStyle: 'italic', fontSize: 13 }}>@{item.username}</Text>
              <Text style={{ color: '#666', marginTop: 2, fontSize: 12 }}>NFC UID: {item.worker_code}</Text>
              {/* Mostramos el ID de huella en la tarjeta de usuario si la tiene */}
              {item.fingerprint_id ? (
                 <Text style={{ color: '#666', fontSize: 12 }}>ID Huella: {item.fingerprint_id}</Text>
              ) : null}
              <Text style={{ color: item.access_level === 1 ? '#D32F2F' : '#2196F3', fontWeight: 'bold', marginTop: 5 }}>
                {item.access_level === 1 ? '👑 Jefe' : '👤 Empleado'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={() => verHistorialUsuario(item)} style={{ marginRight: 15 }}>
                <MaterialCommunityIcons name="clipboard-text-clock" size={24} color="#2196F3" />
              </TouchableOpacity>
              {currentUser?.access_level === 1 && (
                  <>
                    <TouchableOpacity onPress={() => abrirParaEditar(item)} style={{ marginRight: 15 }}>
                      <MaterialCommunityIcons name="pencil" size={24} color="#FFA000" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmarEliminacion(item.id)}>
                      <MaterialCommunityIcons name="trash-can" size={24} color="#F44336" />
                    </TouchableOpacity>
                  </>
                )}
            </View>
          </View>
        )}
      />

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 15 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>{editingId ? 'Editar Usuario' : 'Nuevo Usuario'}</Text>

              <TextInput placeholder="Nombre" value={form.first_name} onChangeText={(text) => setForm({...form, first_name: text})} style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 8 }} />
              <TextInput placeholder="Apellido" value={form.last_name} onChangeText={(text) => setForm({...form, last_name: text})} style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 8 }} />
              <TextInput placeholder="Nombre de Usuario (Login)" value={form.username} autoCapitalize="none" onChangeText={(text) => setForm({...form, username: text})} style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 8 }} />

              <Text style={{ marginBottom: 5, fontSize: 12, color: '#666' }}>Código Físico de la Tarjeta: (Opcional)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <TextInput placeholder="UID (Ej: A1B2C3D4)" value={form.worker_code} onChangeText={(text) => setForm({...form, worker_code: text})} style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginRight: 10 }} />
                <TouchableOpacity onPress={escanearTarjetaFisica} style={{ backgroundColor: '#2196F3', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="nfc-tap" size={24} color="white" />
                </TouchableOpacity>
              </View>

              {/* AÑADIDO: Fila de la Huella Dactilar con Botón Naranja */}
              <Text style={{ marginBottom: 5, fontSize: 12, color: '#666' }}>ID de Huella Dactilar (Opcional):</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <TextInput 
                  placeholder="ID (Ej: 5)" 
                  value={form.fingerprint_id} 
                  keyboardType="numeric"
                  onChangeText={(text) => setForm({...form, fingerprint_id: text})} 
                  style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginRight: 10 }} 
                />
                <TouchableOpacity onPress={escanearHuellaFisica} style={{ backgroundColor: '#FF9800', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="fingerprint" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <TextInput placeholder={editingId ? "Cambiar contraseña (Opcional)" : "Contraseña inicial"} value={form.password} onChangeText={(text) => setForm({...form, password: text})} style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 8 }} secureTextEntry={false} />

              <Text style={{ marginBottom: 5, fontWeight: 'bold', color: '#555' }}>Nivel de Acceso:</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <TouchableOpacity onPress={() => setForm({...form, access_level: 0})} style={{ flex: 1, padding: 10, backgroundColor: form.access_level === 0 ? '#2196F3' : '#eee', marginRight: 5, borderRadius: 8, alignItems: 'center' }}>
                  <Text style={{ color: form.access_level === 0 ? 'white' : 'black', fontWeight: 'bold' }}>Empleado</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setForm({...form, access_level: 1})} style={{ flex: 1, padding: 10, backgroundColor: form.access_level === 1 ? '#D32F2F' : '#eee', marginLeft: 5, borderRadius: 8, alignItems: 'center' }}>
                  <Text style={{ color: form.access_level === 1 ? 'white' : 'black', fontWeight: 'bold' }}>Jefe</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 10, marginRight: 15 }}><Text style={{ color: '#666', fontWeight: 'bold' }}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity onPress={guardarUsuario} style={{ backgroundColor: '#4CAF50', padding: 10, borderRadius: 8 }}><Text style={{ color: 'white', fontWeight: 'bold' }}>Guardar</Text></TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL DE HISTORIAL */}
      {isLogModalVisible && selectedUser && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 15, elevation: 10, flex: 1, maxHeight: '85%' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Accesos de: {selectedUser.first_name} {selectedUser.last_name}</Text>
            <TouchableOpacity onPress={() => setShowLogDatePicker(true)} style={{ marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontSize: 16, color: '#2196F3', fontWeight: 'bold', textTransform: 'capitalize' }}>Mostrando: {logDate.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
            </TouchableOpacity>

            {showLogDatePicker && <DateTimePicker value={logDate} mode="date" display="default" onChange={onChangeLogDate} maximumDate={new Date()} />}

            <FlatList
              data={userLogs}
              keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
              ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>No hay accesos en esta fecha.</Text>}
              renderItem={({ item }) => (
                <LogItem id={item.id} initials="MT" name={`Candado #${item.lock_id} - Master Tronics`} timeAction={new Date(item.created_at).toLocaleTimeString()} isUnlocked={item.is_unlocked} />
              )}
            />

            {userLogs.length > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, borderColor: '#eee' }}>
                <TouchableOpacity onPress={irPaginaAnteriorLog} disabled={logPage === 1} style={{ padding: 5, opacity: logPage === 1 ? 0.3 : 1 }}><Text style={{ color: '#2196F3', fontWeight: 'bold' }}>{"< Ant"}</Text></TouchableOpacity>
                <Text style={{ color: '#666' }}>Pág {logPage} de {logTotalPages}</Text>
                <TouchableOpacity onPress={irPaginaSiguienteLog} disabled={logPage === logTotalPages} style={{ padding: 5, opacity: logPage === logTotalPages ? 0.3 : 1 }}><Text style={{ color: '#2196F3', fontWeight: 'bold' }}>{"Sig >"}</Text></TouchableOpacity>
              </View>
            )}

            <TouchableOpacity onPress={() => setLogModalVisible(false)} style={{ backgroundColor: '#F44336', padding: 12, borderRadius: 8, marginTop: 5, alignItems: 'center' }}><Text style={{ color: 'white', fontWeight: 'bold' }}>Cerrar</Text></TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
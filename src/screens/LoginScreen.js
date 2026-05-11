import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { loginWorker } from '../api';

export default function LoginScreen() {
  const [workerCode, setWorkerCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Traemos la función login de nuestro estado global
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!workerCode || !password) {
      Alert.alert("Error", "Por favor ingresa tu código y contraseña.");
      return;
    }

    setIsLoading(true);
    const response = await loginWorker(workerCode, password);
    setIsLoading(false);

    if (response.success) {
      // ¡Éxito! Guardamos el usuario en el estado global.
      // Esto automáticamente cambiará la pantalla en App.js
      login(response.user); 
    } else {
      Alert.alert("Acceso Denegado", response.error || "Credenciales incorrectas.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <MaterialCommunityIcons name="shield-lock" size={80} color="#2196F3" />
      </View>
      
      <Text style={styles.title}>Master Tronics</Text>
      <Text style={styles.subtitle}>Sistema de Gestión Interna</Text>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="account-outline" size={24} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Código (Ej: ADMIN-001)"
          value={workerCode}
          onChangeText={setWorkerCode}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="lock-outline" size={24} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 20 },
  logoContainer: { backgroundColor: '#e3f2fd', padding: 20, borderRadius: 50, marginBottom: 15 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 35 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', width: '100%', borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, elevation: 2 },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 16 },
  button: { backgroundColor: '#2196F3', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10, elevation: 3 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
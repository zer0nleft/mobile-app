import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  // 1. Al abrir la app, revisamos automáticamente si ya hay una sesión guardada
  useEffect(() => {
    const cargarSesion = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userString = await AsyncStorage.getItem('userData');
        if (token && userString) {
          setCurrentUser(JSON.parse(userString));
        }
      } catch (e) {
        console.log("No hay sesión previa guardada.");
      }
    };
    cargarSesion();
  }, []);

  const login = async (user, token) => {
    // 2. LA SOLUCIÓN: Primero cambiamos el estado para que la pantalla pase de inmediato
    setCurrentUser(user); 

    // 3. Luego intentamos guardar en la memoria física del celular de forma segura
    try {
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
    } catch (error) {
      console.log("Error de almacenamiento local:", error);
      // Si la memoria falla por falta del APK, el bloque catch absorbe el golpe 
      // y la aplicación sigue funcionando normalmente en esta sesión.
    }
  };

  const logout = async () => {
    setCurrentUser(null); // Cerramos la pantalla al instante
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.log("Error borrando datos:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
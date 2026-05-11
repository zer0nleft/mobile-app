import React, { useContext } from 'react'; // 1. IMPORTAR useContext
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext'; // 2. IMPORTAR EL CONTEXTO

export default function SettingsScreen({ navigation }) {
  
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Salir del sistema?", [
      { text: "No" },
      { text: "Sí, Salir", onPress: () => logout() } // <--- Aquí es donde ocurre la magia
    ]);
  };

  const OptionButton = ({ title, icon, color, onPress, isDestructive = false }) => (
    <TouchableOpacity 
      onPress={onPress}
      style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'white', 
        padding: 18, 
        borderRadius: 12, 
        marginBottom: 12,
        elevation: 2 
      }}
    >
      <MaterialCommunityIcons name={icon} size={26} color={isDestructive ? '#F44336' : color} />
      <Text style={{ flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '500', color: isDestructive ? '#F44336' : '#333' }}>
        {title}
      </Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 25 }}>Opciones</Text>

      <OptionButton 
        title="Análisis de Datos" 
        icon="chart-bar" 
        color="#2196F3" 
        onPress={() => navigation.navigate('Stats')} 
      />

      <OptionButton 
        title="Configuración de Perfil" 
        icon="account-cog" 
        color="#666" 
        onPress={() => {}} 
      />

      <View style={{ marginTop: 20 }}>
        <OptionButton 
          title="Cerrar Sesión" 
          icon="logout" 
          color="#F44336" 
          isDestructive={true}
          onPress={handleLogout} 
        />
      </View>
      
      <Text style={{ textAlign: 'center', color: '#AAA', marginTop: 40 }}>Versión 1.0.4 - Master Tronics</Text>
    </View>
    
  );
}
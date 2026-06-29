import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://backend-mastertronics.onrender.com'; 

// Función auxiliar para crear los headers dinámicamente
const getHeaders = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const insertLog = async (lockId, nfcCardId, isUnlocked) => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/logs`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        lock_id: lockId,
        nfc_card_id: nfcCardId,
        action_type: isUnlocked ? 'Unlocked' : 'Locked',
        is_unlocked: isUnlocked
      }),
    });
    
    if (!response.ok) throw new Error("Error al guardar en el servidor");
    return await response.json();
    
  } catch (error) {
    console.error("Error conectando con la API:", error);
  }
};

export const getLogsPaginated = async (dateStr, page = 1, limit = 10) => {
  try {
    const url = `${API_URL}/logs?date=${dateStr}&page=${page}&limit=${limit}`;
    const headers = await getHeaders();
    const response = await fetch(url, { headers });
    
    if (!response.ok) throw new Error("Error al consultar el servidor");
    
    return await response.json(); 
  } catch (error) {
    console.error("Error obteniendo logs paginados:", error);
    return { data: [], currentPage: 1, totalPages: 1 }; 
  }
};

//===========================================
//CRUD DE USUARIOS:
//===========================================
export const getWorkers = async () => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/workers`, { headers });
    
    if (!response.ok) {
      console.log(`Error del Servidor: ${response.status}`);
      return [];
    }

    return await response.json();
  } catch (error) { 
    alert(`Error de Conexión. Revisa la red o el servidor.`);
    console.error(error); 
    return []; 
  }
};

export const getLogsByUserPaginated = async (userId, dateStr, page = 1, limit = 10) => {
  try {
    const url = `${API_URL}/logs/user/${userId}?date=${dateStr}&page=${page}&limit=${limit}`;
    const headers = await getHeaders();
    const response = await fetch(url, { headers });
    
    if (!response.ok) throw new Error("Error del servidor");
    
    return await response.json(); 
  } catch (error) { 
    console.error("Error obteniendo logs del usuario:", error); 
    return { data: [], currentPage: 1, totalPages: 1 }; 
  }
};

export const createWorker = async (workerData) => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/workers`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(workerData),
    });
    if (!response.ok) {
      const err = await response.json();
      alert(`Error del Servidor: ${err.error || 'No se pudo crear el usuario. Revisa si el código o usuario ya existen.'}`);
    }
  } catch (error) { 
    alert("Error de red al crear usuario");
    console.error(error); 
  }
};

export const updateWorker = async (id, workerData) => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/workers/${id}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(workerData),
    });
    if (!response.ok) {
      const err = await response.json();
      alert(`Error del Servidor: ${err.error || 'No se pudo actualizar el usuario.'}`);
    }
  } catch (error) { 
    alert("Error de red al actualizar usuario");
    console.error(error); 
  }
};

export const deleteWorker = async (id) => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/workers/${id}`, { 
      method: 'DELETE', 
      headers: headers 
    });
    if (!response.ok) {
      alert("Error del Servidor: No se pudo eliminar el usuario.");
    }
  } catch (error) { 
    alert("Error de red al eliminar usuario");
    console.error(error); 
  }
};

// --- Asegúrate de pegar esto en alguna parte de tu api.js (¡Lo habíamos borrado!) ---
export const getLastNfcCard = async () => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/hardware/last-nfc`, { headers });
    
    if (!response.ok) {
      throw new Error("Error consultando la tarjeta NFC");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error obteniendo NFC:", error);
    return null;
  }
};

//===========================================
// OBTENER ESTADISTICAS
//===========================================

export const getStatsSummary = async () => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/stats/summary`, { headers });
    return await response.json();
  } catch (error) { console.error(error); return null; }
};

export const getTopUsers = async () => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/stats/top-users`, { headers });
    return await response.json();
  } catch (error) { console.error(error); return []; }
};

export const getLogsForReport = async (startDate, endDate) => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/logs/report?startDate=${startDate}&endDate=${endDate}`, { headers });
    if (!response.ok) throw new Error("Error del servidor");
    return await response.json();
  } catch (error) {
    console.error("Error obteniendo datos para el reporte:", error);
    return [];
  }
};

//===========================================
// RUTAS DE HARDWARE Y LOGIN
//===========================================

export const getLockStatus = async () => {
  try {
    const response = await fetch(`${API_URL}/hardware/lock-status`);
    if (!response.ok) throw new Error("Error al consultar el estado del hardware");
    return await response.json(); 
  } catch (error) {
    console.error("Error obteniendo estado del candado:", error);
    return { unlocked: false }; 
  }
};

export const loginWorker = async (username, password) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Credenciales incorrectas"
      };
    }

    return data;
  } catch (error) {
    console.error("Error en loginWorker:", error);
    return {
      success: false,
      error: "Error de conexión con el servidor"
    };
  }
};

export const getLastFingerprint = async () => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/hardware/last-fingerprint`, { headers });
    
    if (!response.ok) {
      throw new Error("Error consultando la huella");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error obteniendo huella:", error);
    return null;
  }
};
// src/api.js

// IMPORTANTE: Cambia "192.168.X.X" por la dirección IP IPv4 de tu computadora.
// Si estás en Windows, abre la consola (cmd), escribe "ipconfig" y busca "Dirección IPv4".
const API_URL = 'http://192.168.0.100:3000'; 

export const insertLog = async (lockId, nfcCardId, isUnlocked) => {
  try {
    const response = await fetch(`${API_URL}/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    // Armamos la URL con los parámetros: ej. /logs?date=2026-04-26&page=1&limit=10
    const url = `${API_URL}/logs?date=${dateStr}&page=${page}&limit=${limit}`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error("Error al consultar el servidor");
    
    return await response.json(); // Esto ahora devuelve { data, currentPage, totalPages }
  } catch (error) {
    console.error("Error obteniendo logs paginados:", error);
    // Devolvemos una estructura vacía segura para no romper la app si no hay internet
    return { data: [], currentPage: 1, totalPages: 1 }; 
  }
};



//===========================================
//CRUD DE USUARIOS:
//===========================================

// ---- CRUD USUARIOS ----

export const getWorkers = async () => {
  try {
    const response = await fetch(`${API_URL}/workers`);
    
    // Si el servidor no responde con un OK (ej. 404 o 500)
    if (!response.ok) {
      alert(`Error del Servidor: ${response.status}`);
      return [];
    }

    return await response.json();
  } catch (error) { 
    // Si el celular ni siquiera logra encontrar a la computadora (Error de red/IP)
    alert(`Error de Conexión: No puedo llegar a ${API_URL}. Revisa la IP o el Wi-Fi.`);
    console.error(error); 
    return []; 
  }
};

export const createWorker = async (workerData) => {
  try {
    await fetch(`${API_URL}/workers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workerData),
    });
  } catch (error) { console.error(error); }
};

export const updateWorker = async (id, workerData) => {
  try {
    await fetch(`${API_URL}/workers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workerData),
    });
  } catch (error) { console.error(error); }
};

export const deleteWorker = async (id) => {
  try {
    await fetch(`${API_URL}/workers/${id}`, { method: 'DELETE' });
  } catch (error) { console.error(error); }
};

// Le cambiamos el nombre para que sea claro que es paginada
export const getLogsByUserPaginated = async (userId, dateStr, page = 1, limit = 10) => {
  try {
    const url = `${API_URL}/logs/user/${userId}?date=${dateStr}&page=${page}&limit=${limit}`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error("Error del servidor");
    
    return await response.json(); // Ahora devuelve { data, currentPage, totalPages }
  } catch (error) { 
    console.error("Error obteniendo logs del usuario:", error); 
    return { data: [], currentPage: 1, totalPages: 1 }; 
  }
};


//OBTENER ESTADISTICAS
export const getStatsSummary = async () => {
  try {
    const response = await fetch(`${API_URL}/stats/summary`);
    return await response.json();
  } catch (error) { console.error(error); return null; }
};

export const getTopUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/stats/top-users`);
    return await response.json();
  } catch (error) { console.error(error); return []; }
};

export const getLogsForReport = async (startDate, endDate) => {
  try {
    const response = await fetch(`${API_URL}/logs/report?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) throw new Error("Error del servidor");
    return await response.json();
  } catch (error) {
    console.error("Error obteniendo datos para el reporte:", error);
    return [];
  }
};

export const loginWorker = async (worker_code, password) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ worker_code, password }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error en login:", error);
    return { success: false, error: 'Error de conexión' };
  }
};
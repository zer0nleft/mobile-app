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
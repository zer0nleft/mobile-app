import * as SQLite from 'expo-sqlite';

// Abrimos la base de datos (se crea si no existe)
const db = SQLite.openDatabaseSync('mastertronics.db');

export const initDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_name TEXT,
      action_type TEXT,
      is_unlocked INTEGER,
      created_at TEXT
    );
  `);
  console.log("Base de datos SQLite inicializada");
};

export const insertLog = (name, action, isUnlocked) => {
  const now = new Date().toLocaleString();
  db.runSync(
    'INSERT INTO logs (employee_name, action_type, is_unlocked, created_at) VALUES (?, ?, ?, ?)',
    [name, action, isUnlocked ? 1 : 0, now]
  );
};

export const getAllLogs = () => {
  return db.getAllSync('SELECT * FROM logs ORDER BY id DESC');
};

export const deleteLog = (id) => {
  db.runSync('DELETE FROM logs WHERE id = ?', [id]);
  console.log(`Log con ID ${id} eliminado`);
};
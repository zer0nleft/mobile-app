const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;
const contraseña = '123456'
// Configuración de middlewares
app.use(cors());
app.use(express.json()); // Para poder leer los datos que manda la app

// Configuración de la conexión a PostgreSQL
// Asegúrate de cambiar la contraseña y el usuario si son diferentes
const pool = new Pool({
  user: 'postgres',
  host: '127.0.0.1', // <--- EL CAMBIO MÁGICO ESTÁ AQUÍ
  database: 'mastertronics_db',
  password: '123456', 
  port: 5432,
});

// Ruta 1: Obtener logs con Paginación y Filtro por Fecha (GET /logs)
app.get('/logs', async (req, res) => {
  try {
    // 1. Recibir parámetros o usar valores por defecto
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit; // Cálculo matemático para saber dónde empezar
    const date = req.query.date; // Formato esperado: YYYY-MM-DD

    let queryStr = 'SELECT * FROM access_logs';
    let countQueryStr = 'SELECT COUNT(*) FROM access_logs';
    let queryParams = [];
    
    // 2. Si el celular envió una fecha, filtramos
    if (date) {
      // Usamos ::date para extraer solo el día del TIMESTAMP
      queryStr += ' WHERE created_at::date = $1';
      countQueryStr += ' WHERE created_at::date = $1';
      queryParams.push(date);
    }

    // 3. Ordenar y agregar Paginación
    // Los índices de los parámetros dinámicos ($1, $2, $3) dependen de si hay fecha o no
    const limitParamIndex = queryParams.length + 1;
    const offsetParamIndex = queryParams.length + 2;
    
    queryStr += ` ORDER BY created_at DESC LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`;
    
    // Ejecutamos ambas consultas en paralelo para ser más rápidos
    const [result, countResult] = await Promise.all([
      pool.query(queryStr, [...queryParams, limit, offset]),
      pool.query(countQueryStr, queryParams)
    ]);

    // 4. Calcular el total de páginas
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // 5. Responder al celular con el paquete completo
    res.json({
      data: result.rows,
      currentPage: page,
      totalPages: totalPages === 0 ? 1 : totalPages, // Para evitar que diga página 1 de 0
      totalItems: totalItems
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta 2: Guardar un nuevo acceso (POST /logs)
app.post('/logs', async (req, res) => {
  const { lock_id, nfc_card_id, action_type, is_unlocked } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO access_logs (lock_id, nfc_card_id, action_type, is_unlocked) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [lock_id, nfc_card_id, action_type, is_unlocked]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al insertar en PostgreSQL' });
  }
});

// Encender el servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor backend corriendo en el puerto ${port}`);
});
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












// ==========================================
// RUTAS CRUD PARA USUARIOS (WORKERS)
// ==========================================





// GET: Leer todos los usuarios
// GET: Leer todos los usuarios
app.get('/workers', async (req, res) => {
  try {
    // CAMBIO: ORDER BY id ASC
    const result = await pool.query('SELECT * FROM workers ORDER BY id ASC'); 
    res.json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});

// POST: Crear un nuevo usuario
app.post('/workers', async (req, res) => {
  const { first_name, last_name, worker_code, access_level } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO workers (first_name, last_name, worker_code, access_level) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [first_name, last_name, worker_code, access_level || 0]
    );
    
    // Devolvemos el usuario recién creado con un código 201 (Creado)
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear usuario en BD:", error.message);
    res.status(500).json({ error: 'Error creando usuario' });
  }
});

// PUT: Actualizar un usuario existente
app.put('/workers/:id', async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, worker_code, access_level } = req.body;
  try {
    const result = await pool.query(
      `UPDATE workers 
       SET first_name = $1, last_name = $2, worker_code = $3, access_level = $4 
       WHERE id = $5 RETURNING *`, // CAMBIO: WHERE id = $5
      [first_name, last_name, worker_code, access_level, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando usuario' });
  }
});

// DELETE: Eliminar un usuario
app.delete('/workers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // CAMBIO: WHERE id = $1
    await pool.query('DELETE FROM workers WHERE id = $1', [id]); 
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'No se puede eliminar.' });
  }
});


// GET: Obtener los logs de un usuario con Paginación y Filtro de Fecha
app.get('/logs/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Recibir parámetros (igual que en tu otra ruta)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const date = req.query.date; // Espera YYYY-MM-DD

    // 2. Construcción dinámica de la consulta
    // Siempre filtramos por el usuario primero ($1)
    let queryStr = 'SELECT * FROM access_logs WHERE nfc_card_id = $1';
    let countQueryStr = 'SELECT COUNT(*) FROM access_logs WHERE nfc_card_id = $1';
    let queryParams = [id];

    // 3. Si hay fecha, agregamos la condición AND ($2)
    if (date) {
      queryStr += ' AND created_at::date = $2';
      countQueryStr += ' AND created_at::date = $2';
      queryParams.push(date);
    }

    // 4. Agregar orden y límites
    const limitIndex = queryParams.length + 1;
    const offsetIndex = queryParams.length + 2;
    
    queryStr += ` ORDER BY created_at DESC LIMIT $${limitIndex} OFFSET $${offsetIndex}`;

    // 5. Ejecutar ambas consultas en paralelo
    const [result, countResult] = await Promise.all([
      pool.query(queryStr, [...queryParams, limit, offset]),
      pool.query(countQueryStr, queryParams)
    ]);

    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // 6. Devolver el paquete completo
    res.json({
      data: result.rows,
      currentPage: page,
      totalPages: totalPages === 0 ? 1 : totalPages,
      totalItems: totalItems
    });

  } catch (error) {
    console.error("Error filtrando logs paginados de usuario:", error.message);
    res.status(500).json({ error: 'Error obteniendo historial del usuario' });
  }
});
const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
app.use(express.json());

// Leer certificados desde carpeta cert
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem'))
};

// Ruta al archivo JSON de reservas
const reservaFilePath = path.join(__dirname, 'reserva.json');

// Leer reservas desde archivo
const readReservas = () => {
  try {
    if (fs.existsSync(reservaFilePath)) {
      const data = fs.readFileSync(reservaFilePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error leyendo reserva.json:', error);
    return [];
  }
};

// Escribir reservas al archivo
const writeReservas = (reservas) => {
  try {
    fs.writeFileSync(reservaFilePath, JSON.stringify(reservas, null, 2), 'utf8');
  } catch (error) {
    console.error('Error escribiendo en reserva.json:', error);
  }
};

// Inicializar reservas
let reservas = readReservas();

// RUTA RAÍZ
app.get('/', (req, res) => {
  res.json({
    mensaje: '✅ Servidor Express con HTTPS funcionando correctamente',
    rutas: {
      user: '/user',
      reservas: {
        obtener: 'GET /reservas',
        crear: 'POST /reservas'
      }
    }
  });
});

// RUTA /user
app.get('/user', (req, res) => {
  res.json({
    id: "0001",
    nombre: "Raydmon Alcedo",
    correo: "raydmon@example.com",
    telefono: "912345678"
  });
});

// RUTA GET /reservas
app.get('/reservas', (req, res) => {
  const reservasActualizadas = readReservas();
  res.json(reservasActualizadas);
});

// RUTA POST /reservas
app.post('/reservas', (req, res) => {
  const { fecha, hora, nombre, correo, telefono, motivo } = req.body;

  if (!fecha || !hora || !nombre || !correo || !telefono || !motivo) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
  }

  // Evitar duplicados en fecha/hora
  const yaExiste = reservas.some(r => r.fecha === fecha && r.hora === hora);
  if (yaExiste) {
    return res.status(409).json({ mensaje: 'Ya existe una reserva para esa fecha y hora' });
  }

  const nuevaReserva = {
    id: reservas.length + 1,
    fecha,
    hora,
    nombre,
    correo,
    telefono,
    motivo
  };

  reservas.push(nuevaReserva);
  writeReservas(reservas);

  res.status(201).json({ mensaje: "Reserva creada con éxito", reserva: nuevaReserva });
});

// INICIAR SERVIDOR HTTPS
https.createServer(sslOptions, app).listen(3000, () => {
  console.log('✅ Servidor HTTPS funcionando en https://localhost:3000');
});

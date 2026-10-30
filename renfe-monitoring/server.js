const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Proxy para evitar problemas de CORS
app.get('/api/trains', async (req, res) => {
  try {
    const response = await fetch('https://gtfsrt.renfe.com/vehicle_positions_LD.json', {
      headers: { 'User-Agent': 'Renfe-Monitor/1.0' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudieron obtener los datos de Renfe' });
  }
});

app.listen(PORT, () => {
  console.log(`Renfe Monitor corriendo en http://localhost:${PORT}`);
});
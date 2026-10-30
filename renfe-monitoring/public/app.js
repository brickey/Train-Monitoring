const map = L.map('map', {
  center: [40.4, -3.7],
  zoom: 6,
  zoomControl: true
});

// Tema oscuro (CartoDB Dark)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap © CartoDB · Datos: Renfe Open Data',
  maxZoom: 18
}).addTo(map);

let markers = {};
let trainsData = [];

function statusColor(status) {
  if (status === 'STOPPED_AT') return '#22c55e';   // verde
  if (status === 'IN_TRANSIT_TO') return '#f59e0b'; // naranja
  return '#38bdf8';                                 // azul
}

function createPopup(vehicle) {
  const v = vehicle.vehicle;
  const pos = v.position || {};
  return `
    <div class="popup-title">Tren ${v.vehicle?.label || v.vehicle?.id || '—'}</div>
    <div class="popup-row"><strong>Trip ID:</strong> ${v.trip?.tripId || '—'}</div>
    <div class="popup-row"><strong>Estado:</strong> ${v.currentStatus || '—'}</div>
    <div class="popup-row"><strong>Parada actual:</strong> ${v.stopId || '—'}</div>
    <div class="popup-row"><strong>Lat / Lon:</strong> ${pos.latitude?.toFixed(5)} / ${pos.longitude?.toFixed(5)}</div>
    <div class="popup-row"><strong>ID vehículo:</strong> ${v.vehicle?.id || '—'}</div>
  `;
}

async function loadTrains() {
  try {
    const res = await fetch('/api/trains');
    const data = await res.json();
    if (!data.entity) throw new Error('Formato incorrecto');

    trainsData = data.entity;
    document.getElementById('total').textContent = trainsData.length;
    document.getElementById('updated').textContent = new Date().toLocaleTimeString('es-ES');

    // Limpiar marcadores antiguos
    Object.values(markers).forEach(m => map.removeLayer(m));
    markers = {};

    const list = document.getElementById('train-list');
    list.innerHTML = '';

    trainsData.forEach(entity => {
      const v = entity.vehicle;
      if (!v?.position?.latitude || !v?.position?.longitude) return;

      const id = entity.id || v.vehicle?.id || Math.random().toString();
      const lat = v.position.latitude;
      const lon = v.position.longitude;
      const color = statusColor(v.currentStatus);

      const marker = L.circleMarker([lat, lon], {
        radius: 7,
        fillColor: color,
        color: '#0f172a',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(map);

      marker.bindPopup(createPopup(entity));
      markers[id] = marker;

      // Lista lateral
      const item = document.createElement('div');
      item.className = 'train-item';
      item.innerHTML = `
        <div class="train-id">${v.vehicle?.label || v.vehicle?.id || id}</div>
        <div class="train-meta">${v.currentStatus || '—'} · ${v.trip?.tripId || ''}</div>
      `;
      item.onclick = () => {
        map.setView([lat, lon], 10);
        marker.openPopup();
      };
      list.appendChild(item);
    });
  } catch (err) {
    console.error(err);
    document.getElementById('updated').textContent = 'Error al cargar';
  }
}

// Carga inicial + cada 18 segundos
loadTrains();
setInterval(loadTrains, 18000);
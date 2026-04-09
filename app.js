// ─── Skies Weather App ───────────────────────────────────────────────────────
// Opción 1: Caché con localStorage (1 hora)
// Opción 3: Comparación de múltiples ciudades

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora en milisegundos

const WMO = {
  0:{l:'Despejado',i:'☀️'}, 1:{l:'Mayormente despejado',i:'🌤️'}, 2:{l:'Parcialmente nublado',i:'⛅'},
  3:{l:'Nublado',i:'☁️'}, 45:{l:'Neblina',i:'🌫️'}, 48:{l:'Neblina con escarcha',i:'🌫️'},
  51:{l:'Llovizna ligera',i:'🌦️'}, 53:{l:'Llovizna moderada',i:'🌦️'}, 55:{l:'Llovizna intensa',i:'🌧️'},
  61:{l:'Lluvia ligera',i:'🌧️'}, 63:{l:'Lluvia moderada',i:'🌧️'}, 65:{l:'Lluvia intensa',i:'🌧️'},
  71:{l:'Nevada ligera',i:'🌨️'}, 73:{l:'Nevada moderada',i:'❄️'}, 75:{l:'Nevada intensa',i:'❄️'},
  80:{l:'Chubascos ligeros',i:'🌦️'}, 81:{l:'Chubascos moderados',i:'🌧️'}, 82:{l:'Chubascos intensos',i:'⛈️'},
  95:{l:'Tormenta eléctrica',i:'⛈️'}, 96:{l:'Tormenta con granizo',i:'⛈️'}, 99:{l:'Tormenta con granizo',i:'⛈️'}
};

const wi      = code => WMO[code] || { l: 'Desconocido', i: '🌡️' };
const dirs    = ['N','NE','E','SE','S','SO','O','NO'];
const windDir = deg => dirs[Math.round(deg / 45) % 8];
const uvLabel = v => v <= 2 ? 'Bajo' : v <= 5 ? 'Moderado' : v <= 7 ? 'Alto' : v <= 10 ? 'Muy alto' : 'Extremo';
const fmtDay  = s => new Date(s + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short' });

// ─── Referencias al DOM ──────────────────────────────────────────────────────
const elErr      = document.getElementById('err');
const elLoad     = document.getElementById('load');
const elWx       = document.getElementById('wx');
const elInp      = document.getElementById('inp');
const elCompare  = document.getElementById('compare-section');
const elCmpInp   = document.getElementById('cmp-inp');
const elCmpList  = document.getElementById('cmp-list');
const elCmpCards = document.getElementById('cmp-cards');

// ─── OPCIÓN 1: Caché con localStorage ────────────────────────────────────────

/**
 * Guarda datos del clima en localStorage con timestamp.
 * Clave: "weather_cache_<ciudad_normalizada>"
 */
function saveToCache(cacheKey, locationData, weatherData) {
  const entry = {
    timestamp: Date.now(),
    location: locationData,
    weather: weatherData,
  };
  try {
    localStorage.setItem('weather_cache_' + cacheKey, JSON.stringify(entry));
  } catch (e) {
    // localStorage puede estar lleno o bloqueado — ignorar silenciosamente
    console.warn('No se pudo guardar en caché:', e.message);
  }
}

/**
 * Recupera datos del caché si existen y no han expirado (< 1 hora).
 * Devuelve { location, weather } o null si no hay caché válido.
 */
function loadFromCache(cacheKey) {
  try {
    const raw = localStorage.getItem('weather_cache_' + cacheKey);
    if (!raw) return null;

    const entry = JSON.parse(raw);
    const age   = Date.now() - entry.timestamp;

    if (age < CACHE_TTL_MS) {
      return { location: entry.location, weather: entry.weather };
    } else {
      // Caché expirado — limpiar
      localStorage.removeItem('weather_cache_' + cacheKey);
      return null;
    }
  } catch (e) {
    return null;
  }
}

/** Normaliza el nombre de ciudad para usarlo como clave de caché */
function normalizeKey(city) {
  return city.trim().toLowerCase().replace(/\s+/g, '_');
}

// ─── Helpers de UI ───────────────────────────────────────────────────────────
function showError(msg) {
  elErr.textContent = msg;
  elErr.style.display = 'block';
  elLoad.style.display = 'none';
  elWx.style.display = 'none';
}

function showLoading() {
  elLoad.style.display = 'flex';
  elErr.style.display = 'none';
  elWx.style.display = 'none';
}

function hideLoading() {
  elLoad.style.display = 'none';
}

// ─── Llamadas a la API ────────────────────────────────────────────────────────
async function geocodeCity(city) {
  const res  = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es&format=json`
  );
  const data = await res.json();
  if (!data.results?.length) throw new Error(`No se encontró "${city}"`);
  return data.results[0];
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat, longitude: lon,
    current:  'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,uv_index,visibility,pressure_msl',
    daily:    'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: 5,
  });
  const res = await fetch('https://api.open-meteo.com/v1/forecast?' + params);
  return res.json();
}

/**
 * Obtiene datos del clima para una ciudad, usando caché si está disponible.
 * Si el caché es válido, no hace ninguna llamada a la API.
 */
async function getWeatherWithCache(cityName) {
  const key    = normalizeKey(cityName);
  const cached = loadFromCache(key);

  if (cached) {
    console.log(`[Caché] Usando datos guardados para "${cityName}"`);
    return cached;
  }

  console.log(`[API] Solicitando datos frescos para "${cityName}"`);
  const location = await geocodeCity(cityName);
  const weather  = await fetchWeather(location.latitude, location.longitude);
  saveToCache(key, location, weather);
  return { location, weather };
}

// ─── Renderizado — vista principal ───────────────────────────────────────────
function renderWeather(location, data) {
  const c    = data.current;
  const d    = data.daily;
  const info = wi(c.weather_code);

  const forecastCards = d.time.slice(0, 5).map((day, i) => {
    const fi = wi(d.weather_code[i]);
    return `
      <div class="forecast-card">
        <span class="fc-day">${i === 0 ? 'Hoy' : fmtDay(day)}</span>
        <span class="fc-icon">${fi.i}</span>
        <span class="fc-max">${Math.round(d.temperature_2m_max[i])}°</span>
        <span class="fc-min">${Math.round(d.temperature_2m_min[i])}°</span>
      </div>`;
  }).join('');

  const vis   = c.visibility != null ? (c.visibility / 1000).toFixed(1) + ' km' : '—';
  const uvVal = c.uv_index   != null ? `${Math.round(c.uv_index)} — ${uvLabel(c.uv_index)}` : '—';

  elWx.innerHTML = `
    <div class="main-card">
      <div>
        <div class="city">${location.name}</div>
        <div class="country">${location.admin1 ? location.admin1 + ' · ' : ''}${location.country || ''}</div>
        <div class="desc">${info.l}</div>
      </div>
      <div>
        <span class="weather-icon-main">${info.i}</span>
        <div class="temp-big">${Math.round(c.temperature_2m)}°C</div>
        <div class="feels">Sensación ${Math.round(c.apparent_temperature)}°C</div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-label">Humedad</span>
        <span class="stat-value">${c.relative_humidity_2m}<span class="stat-unit"> %</span></span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Viento</span>
        <span class="stat-value">${Math.round(c.wind_speed_10m)}<span class="stat-unit"> km/h ${windDir(c.wind_direction_10m)}</span></span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Presión</span>
        <span class="stat-value">${Math.round(c.pressure_msl)}<span class="stat-unit"> hPa</span></span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Visibilidad</span>
        <span class="stat-value" style="font-size:1rem;margin-top:4px;">${vis}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Índice UV</span>
        <span class="stat-value" style="font-size:0.9rem;margin-top:4px;">${uvVal}</span>
      </div>
    </div>

    <p class="forecast-title">Próximos 5 días</p>
    <div class="forecast-row">${forecastCards}</div>`;

  elWx.style.display = 'flex';
}

// ─── OPCIÓN 3: Comparación de ciudades ───────────────────────────────────────

// Array que almacena las ciudades en la lista de comparación
let compareCities = [];

/** Agrega una ciudad al array de comparación (sin duplicados) */
function addCityToCompare(cityName) {
  const normalized = cityName.trim();
  if (!normalized) return;

  const alreadyAdded = compareCities.some(
    c => c.toLowerCase() === normalized.toLowerCase()
  );
  if (alreadyAdded) {
    alert(`"${normalized}" ya está en la lista.`);
    return;
  }

  compareCities.push(normalized);
  renderCityTags();
}

/** Elimina una ciudad del array de comparación por índice */
function removeCityFromCompare(index) {
  compareCities.splice(index, 1);
  renderCityTags();
}

/** Renderiza las etiquetas de ciudades seleccionadas */
function renderCityTags() {
  elCmpList.innerHTML = compareCities.map((city, i) => `
    <span class="city-tag">
      ${city}
      <button class="tag-remove" data-index="${i}" title="Eliminar">×</button>
    </span>
  `).join('');

  // Event listeners para botones de eliminar
  elCmpList.querySelectorAll('.tag-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      removeCityFromCompare(parseInt(btn.dataset.index));
    });
  });
}

/**
 * Obtiene el clima de todas las ciudades en compareCities en paralelo
 * usando Promise.all — aprovecha el caché para las que ya se consultaron.
 */
async function runComparison() {
  if (compareCities.length < 2) {
    alert('Agrega al menos 2 ciudades para comparar.');
    return;
  }

  elCmpCards.innerHTML = '<p class="cmp-loading">Obteniendo datos…</p>';

  // Obtener todas en paralelo
  const results = await Promise.allSettled(
    compareCities.map(city => getWeatherWithCache(city))
  );

  // Construir tarjetas de comparación
  const cardsHTML = results.map((result, i) => {
    if (result.status === 'rejected') {
      return `
        <div class="cmp-card cmp-error">
          <div class="cmp-city">${compareCities[i]}</div>
          <div class="cmp-err-msg">No se pudo obtener el clima</div>
        </div>`;
    }

    const { location, weather } = result.value;
    const c    = weather.current;
    const d    = weather.daily;
    const info = wi(c.weather_code);

    const fcHTML = d.time.slice(0, 5).map((day, j) => {
      const fi = wi(d.weather_code[j]);
      return `
        <div class="cmp-fc-item">
          <span class="cmp-fc-day">${j === 0 ? 'Hoy' : fmtDay(day)}</span>
          <span class="cmp-fc-icon">${fi.i}</span>
          <span class="cmp-fc-temps">${Math.round(d.temperature_2m_max[j])}° / ${Math.round(d.temperature_2m_min[j])}°</span>
        </div>`;
    }).join('');

    return `
      <div class="cmp-card">
        <div class="cmp-header">
          <span class="cmp-icon">${info.i}</span>
          <div>
            <div class="cmp-city">${location.name}</div>
            <div class="cmp-country">${location.country || ''}</div>
          </div>
        </div>
        <div class="cmp-temp">${Math.round(c.temperature_2m)}°C</div>
        <div class="cmp-desc">${info.l}</div>
        <div class="cmp-stats">
          <div class="cmp-stat"><span>💧</span> ${c.relative_humidity_2m}%</div>
          <div class="cmp-stat"><span>💨</span> ${Math.round(c.wind_speed_10m)} km/h</div>
          <div class="cmp-stat"><span>🌡️</span> Sens. ${Math.round(c.apparent_temperature)}°C</div>
        </div>
        <div class="cmp-forecast">${fcHTML}</div>
      </div>`;
  }).join('');

  elCmpCards.innerHTML = cardsHTML;
}

// ─── Búsqueda principal ───────────────────────────────────────────────────────
async function searchCity() {
  const city = elInp.value.trim();
  if (!city) { showError('Escribe el nombre de una ciudad.'); return; }
  showLoading();
  try {
    const { location, weather } = await getWeatherWithCache(city);
    hideLoading();
    renderWeather(location, weather);
  } catch (e) {
    showError(e.message || 'Error inesperado.');
  }
}

function getLocation() {
  if (!navigator.geolocation) { showError('Tu navegador no soporta geolocalización.'); return; }
  showLoading();
  navigator.geolocation.getCurrentPosition(
    async pos => {
      try {
        const { latitude: lat, longitude: lon } = pos.coords;
        const weather = await fetchWeather(lat, lon);
        hideLoading();
        renderWeather({ name: 'Mi ubicación', country: '', admin1: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°` }, weather);
      } catch (e) { showError(e.message); }
    },
    () => showError('Permiso denegado. Busca tu ciudad manualmente.')
  );
}

// ─── Event listeners ─────────────────────────────────────────────────────────
document.getElementById('btn-search').addEventListener('click', searchCity);
document.getElementById('btn-geo').addEventListener('click', getLocation);
elInp.addEventListener('keydown', e => { if (e.key === 'Enter') searchCity(); });

document.getElementById('btn-add-city').addEventListener('click', () => {
  addCityToCompare(elCmpInp.value);
  elCmpInp.value = '';
});
elCmpInp.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    addCityToCompare(elCmpInp.value);
    elCmpInp.value = '';
  }
});
document.getElementById('btn-compare').addEventListener('click', runComparison);

// ─── Inicio: cargar Santiago (con caché) ─────────────────────────────────────
(async function init() {
  elInp.value = 'Santiago';
  showLoading();
  try {
    const { location, weather } = await getWeatherWithCache('Santiago');
    hideLoading();
    renderWeather(location, weather);
  } catch (e) {
    hideLoading();
  }
})();

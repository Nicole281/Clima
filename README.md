# 🌤️ Skies — Aplicación del Clima en Tiempo Real

Una aplicación web del clima construida con HTML, CSS y JavaScript puro. Muestra temperatura actual, pronóstico de 5 días, humedad, viento, presión, visibilidad e índice UV para cualquier ciudad del mundo, **sin necesidad de API key**.

---

## ¿De qué trata este proyecto?

**Skies** es una aplicación del clima desarrollada como proyecto final del curso AI-SWE-07. Permite al usuario:

- 🔍 **Buscar cualquier ciudad** del mundo por nombre
- 📍 **Usar su ubicación actual** mediante geolocalización del navegador
- 🌡️ Ver **temperatura actual** y sensación térmica
- 📅 Consultar el **pronóstico de los próximos 5 días**
- 💧 Ver estadísticas detalladas: humedad, viento, presión, visibilidad e índice UV
- 📱 Diseño **responsivo** que funciona en móvil y escritorio

Utiliza la API gratuita de **Open-Meteo** (sin API key) y la API de geocodificación de Open-Meteo para convertir nombres de ciudades en coordenadas.

---

## Estructura del proyecto

```
weather-app/
├── index.html    # Estructura HTML y estilos CSS (todo en un archivo)
├── app.js        # Lógica de la aplicación: llamadas a API, renderizado
└── README.md     # Este archivo
```

---

## Cómo ejecutar el proyecto

### Opción 1 — Abrirlo directamente (más simple)

1. Descarga o clona el repositorio:
   ```bash
   git clone https://github.com/TU-USUARIO/weather-app.git
   ```
2. Abre el archivo `index.html` en tu navegador.

> ✅ No requiere servidor, npm, ni instalación alguna.

### Opción 2 — Con un servidor local (recomendado para geolocalización)

Si quieres que el botón "Usar mi ubicación" funcione correctamente (algunos navegadores lo bloquean en archivos locales), usa un servidor local:

```bash
# Con Python
python -m http.server 8080
# Luego visita: http://localhost:8080
```

```bash
# Con Node.js (npx)
npx serve .
```

---

## APIs utilizadas

| API | Propósito | Requiere key |
|-----|-----------|--------------|
| [Open-Meteo](https://open-meteo.com/) | Datos del clima | ❌ No |
| [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | Convertir nombre de ciudad a coordenadas | ❌ No |

---

## Funcionalidades implementadas

- [x] Búsqueda de ciudad por nombre
- [x] Geolocalización del dispositivo
- [x] Temperatura actual y sensación térmica
- [x] Condición del clima con ícono emoji
- [x] Pronóstico de 5 días (máxima / mínima)
- [x] Humedad relativa, viento (velocidad y dirección), presión atmosférica
- [x] Visibilidad e índice UV con descripción
- [x] Manejo de errores
- [x] Ciudad por defecto (Santiago) al cargar
- [x] Diseño responsivo (móvil y escritorio)

---

## Reflexión del proyecto

Este proyecto me permitió practicar el consumo de APIs REST con `fetch`, el manejo asíncrono con `async/await`, y la manipulación dinámica del DOM. Aprendí que es posible construir aplicaciones funcionales y bien diseñadas sin frameworks, y que elegir APIs gratuitas sin autenticación simplifica enormemente el despliegue.

---

## Autor

Proyecto desarrollado como entrega final del curso **AI-SWE-07**.

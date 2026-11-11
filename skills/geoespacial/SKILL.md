---
name: geoespacial
description: Elegir y consumir APIs públicas de datos geoespaciales y espaciales (incendios, clima, sismos, clima espacial, imágenes satelitales, ISS) para un proyecto de hackathon, con límites, keys y atribuciones. Usar al buscar el dato real de una idea.
---

# Datos geoespaciales

Regla de oro: **llamá a la API de verdad, guardá la respuesta en `sample-data/` y pegásela al LLM**. Nunca construyas sobre un endpoint que no probaste.

## Catálogo

| API | Qué da | Acceso | Notas |
|---|---|---|---|
| NASA FIRMS | Focos de calor (incendios) | MAP_KEY gratis por email | Devuelve **CSV** |
| NASA EONET | Eventos naturales (incendios, tormentas, volcanes) | Sin key | JSON, simple |
| USGS Earthquakes | Sismos | Sin key | GeoJSON, filtrable por radio y magnitud |
| NOAA SWPC | Clima espacial (Kp, viento solar) | Sin key | JSON |
| NASA DONKI | Tormentas solares, CME | Key NASA | |
| Open-Meteo | Clima, pronóstico, histórico | Sin key | Uso no comercial |
| NASA POWER | Clima y radiación histórica por punto | Sin key | Ideal para sequía y seguros paramétricos |
| wheretheiss.at | Posición de la ISS | Sin key | ~1 req/s |
| CelesTrak | TLE de satélites | Sin key | Con `satellite.js` calculás órbitas |
| N2YO | Pasadas de satélites | Key gratis | |
| NASA EPIC | Imágenes de la Tierra entera | Key NASA | |
| NASA GIBS | Capas de imagen satelital (WMTS) | Sin key | Mapas en Leaflet / MapLibre |
| JPL SSD / CNEOS | Asteroides, cometas | Sin key | |
| NASA Open APIs | APOD, imágenes, etc. | `DEMO_KEY` ~30 req/h por IP | La WiFi del evento comparte IP: **sacá tu key** en api.nasa.gov |
| Exoplanet Archive | Exoplanetas | Sin key | |
| OpenAQ v3 | Calidad del aire | Key gratis | |
| Launch Library 2 | Lanzamientos | Sin key, con límite | |
| Copernicus Data Space | Sentinel-1/2 (imágenes, NDVI) | Cuenta + OAuth2 | El client secret se muestra **una sola vez**: guardalo |
| Earth Search (STAC) | Sentinel-2 en AWS | Sin key | Búsqueda por STAC |
| Planetary Computer | Catálogo STAC de Microsoft | Token SAS ~1 h | Renová el token |
| SMN Argentina | Datos meteorológicos | Abierto | CC BY 2.5 AR |
| CONAE / SAOCOM | Radar argentino | Según el dato | |
| IGN Argentina | Cartografía | Abierto | |

SpaceX API: solo mantenimiento, no la uses.

Los endpoints cambian: antes de depender de uno, abrí la documentación oficial y probalo.

## Receta de prueba

```ts
// lib/dato.ts (servidor)
export async function ultimoKp() {
  const r = await fetch("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json", {
    next: { revalidate: 300 },
  });
  if (!r.ok) throw new Error(`SWPC ${r.status}`);
  return r.json();
}
```

```bash
# Guardar una respuesta real para la demo
curl -s "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json" -o sample-data/kp.json
```

Revisá el formato real del JSON (qué campos y qué orden tiene) antes de escribir el parser.

## Del dato al contrato

1. Elegí **un campo** y **un umbral** (`Kp >= 5`, focos dentro de 5 km, lluvia < X mm en N días).
2. Un script (relayer) en el servidor lee la API y calcula la condición.
3. Publica en el contrato el **valor** y el **hash del dato crudo** (`keccak256` del JSON). Así cualquiera puede auditar contra la fuente.
4. El contrato emite el evento cuando se cumple la condición.

Qué pasa si el dato miente es la pregunta 3 del test de blockchain: cubrila con varios relayers, commit del hash, o cruzando dos fuentes independientes (por ejemplo FIRMS y EONET).

## Lugares y coordenadas del NOA (referencia)

Usá bounding boxes en vez de puntos cuando la API lo permita. Ejemplo orientativo para Salta capital: lat −24.78, lon −65.41. Verificá siempre las coordenadas de tu zona.

## Mapas

- 2D: Leaflet o MapLibre con capas GIBS.
- 3D: globe.gl o CesiumJS.
- Órbitas: `satellite.js` con TLE de CelesTrak.
- Gráficos: Chart.js.
- Visores para explorar: NASA Worldview, Copernicus Browser.

## Atribuciones obligatorias

- GIBS / NASA: "Imagery courtesy of NASA GIBS / Worldview".
- Copernicus: "Contains modified Copernicus Sentinel data [año]".
- SMN: CC BY 2.5 AR, citando al Servicio Meteorológico Nacional.
- Una línea en el pie del sitio con todas las fuentes usadas.

## Límites y buenas costumbres

- Cacheá en el servidor. No llames a la API en cada render.
- Respetá los límites (la ISS: ~1 req/s).
- Keys en variables de entorno del servidor, nunca en el cliente.
- Si la API cae durante la demo, usá `sample-data/` y avisalo en pantalla.
- No subas imágenes o datasets pesados al repo.

---
name: research-con-contexto
description: Investigar y elegir un problema real del NOA (Salta, Jujuy, Tucumán, Catamarca) para el track Blockchain Avalanche de Argentina Space, cruzado con un dato público medible. Usar al empezar, antes de validar la idea.
---

# Research con contexto

Objetivo: salir con **3 problemas candidatos**, cada uno atado a un **dato público real** y a una **persona concreta**. Nada de ideas genéricas.

## Contexto del track (dalo por sabido)

- Evento: hackathon Argentina Space, Salta, 11 al 13 de noviembre de 2026. Entrega límite el 13/11 por la mañana (confirmar hora con organizadores).
- Categorías (un equipo elige una): **Geoespacial**, **RWA** (activos del mundo real), **Agentes**, **Libre**.
- Entregables: contrato en Avalanche Fuji (o L1 propia) con link al explorer, video demo de 1 a 3 min con una acción on-chain, pitch de 5 a 7 slides con una slide "por qué blockchain", y repo o link del proyecto.
- Premios: USD 400 / 200 / 100 en AVAX, más 500 créditos de Oracle cada uno.
- Criterios del jurado: **Impacto, Creatividad, Validez, Justificación de blockchain, Presentación**.
- Se construye en 2 días. Un MVP que corre le gana a uno ambicioso que no.

## Proceso

1. **Lluvia de problemas.** Pedí 10 problemas reales del NOA: incendios, heladas, sequía, lluvias intensas, agua, litio, vid, caña, minería, clima espacial. Para cada uno: quién lo sufre, qué le cuesta, qué dato lo mediría.
2. **Existe y cuesta.** Buscá en la web si alguien ya lo resuelve y cuánto pierde el afectado. Citá fuentes con link. Si no hay fuente, marcalo como supuesto.
3. **Cruzar con un dato.** Para cada problema elegí una API pública del catálogo de la skill `geoespacial` (FIRMS, Open-Meteo, NASA POWER, USGS, NOAA SWPC, Sentinel, etc.). Hacé una llamada real y guardá la respuesta en `sample-data/`.
4. **Elegir 3.** Quedate con los más medibles: dato gratis, se actualiza, y la condición se puede escribir como `si [dato] [umbral]`.
5. **Frase.** Escribí cada uno como: "Cuando [dato], el contrato [acción] para [persona]".

## Formato de salida

Tabla con 3 filas y estas columnas: problema, quién lo sufre, costo (con fuente), dato y API, campo exacto, frecuencia de actualización, frase "cuando X, el contrato Y".

Cerrá con una recomendación de 2 líneas: cuál seguir y por qué, y qué riesgo tiene.

## Ejemplos del tipo de idea que funciona

- Incendios: FIRMS detecta foco dentro de la zona registrada con confianza alta, el contrato libera una recompensa a quien reportó.
- Clima espacial: NOAA SWPC Kp llega a 5 o más, se publica la alerta y se pausan operaciones de riesgo.
- Cosecha: NDVI de Sentinel-2 supera el hito, se libera el siguiente tramo del préstamo.
- Seguro paramétrico: lluvia acumulada bajo X mm en N días (NASA POWER, Open-Meteo), helada bajo 0 °C, sismo mayor a X en un radio (USGS).

## Reglas

- Citá fuentes con link. Separá hechos de supuestos.
- No inventes datos, cifras ni endpoints. Si no estás seguro de que una API existe, decilo.
- No propongas nada que necesite entrenar modelos, hardware propio o más de 2 días.
- Menos texto, más tabla. Respondé en español rioplatense, directo.

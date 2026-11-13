---
titulo: Pendientes para el pitch — aclarar el rendimiento del escrow y de dónde salen los montos de la garantía
autor: mauricio
fecha: 2026-11-13 00:36
tema: orbitclear
tags: [pitch, demo, rendimiento, escrow, montos, garantia, pendiente]
tipo: pregunta
fuentes:
  - conversación de Mauricio con su agente mientras armaba el video de la demo
  - docs/planning.md (sección de estudios), docs/defensa.md
  - https://doi.org/10.1038/s41467-026-77660-4 (no se pudo leer, pide login)
relacionadas: [2026-11-12-1656-mauricio-modelo-negocio-porcentaje-rendimiento-escrow, 2026-11-11-1504-mauricio-marco-legal-bono-escrow, 2026-11-11-1300-franco-bono-deorbitado-quien-multa]
---

## Qué es
Dos cosas que Mauricio pidió anotar para aclarar en el pitch y en la defensa: que la plata del escrow sigue rindiendo mientras está bloqueada, y de dónde salen los montos de la garantía.

## Lo importante
- **Rendimiento (pedido de Mauricio):** aclarar que la plata depositada va a seguir rindiendo mientras está en el escrow.
  - **Cuidado al decirlo:** el contrato desplegado guarda USDC sin rendimiento. `docs/defensa.md` pide no decir "el escrow genera rendimiento" porque es roadmap. La frase que no se cae es: "la propuesta es que el depósito rinda y el rendimiento sea del operador; en el prototipo todavía no está construido".
  - Tener un USDC no rinde solo: habría que colocarlo en otro instrumento (ver la nota de marco legal, punto 4).
- **Montos de la demo (USD 100.000, 300.000 y 800.000 según la altura):** están dentro del rango que modela el estudio de UCL, Universidad de Colorado, Aerospace Corporation y la ESA (2025), que va de USD 100.000 a 800.000 por satélite y sostiene que el precio debería variar según la órbita (`docs/planning.md`).
  - **Interpretación:** la asignación de cada monto a cada banda de altura es nuestra, no del estudio. En la defensa, los montos los fija el regulador y los de la demo son ilustrativos.
- **USD 200.000 de Nature Communications 2026:** en nuestras notas figura como el monto propuesto y sus efectos (más de un tercio menos de masa abandonada por año, bienestar hasta 27% mayor, alcanza con 20% de adopción). Ninguna nota dice en qué se basó esa cifra.

## Preguntas abiertas
- ¿En qué se basó el paper de Nature para los USD 200.000: es el óptimo de su modelo, un escenario de ejemplo o un valor dentro de un rango? No lo sabemos. El 13/11 se intentó abrir el artículo y pide login; Space.com solo devolvió el titular. Hay que abrirlo en un navegador.
- ¿Con qué criterio justificamos 100.000 / 300.000 / 800.000 por banda si un jurado pregunta por la cuenta?

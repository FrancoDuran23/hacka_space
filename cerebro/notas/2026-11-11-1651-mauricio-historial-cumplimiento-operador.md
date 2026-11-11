---
titulo: Propuesta — historial público de cumplimiento por operador ("puntaje de órbita limpia")
autor: mauricio
fecha: 2026-11-11 16:51
tema: orbitclear
tags: [propuesta, reputacion, web, pitch, cumplimiento]
tipo: idea
fuentes:
  - idea de Mauricio, conversación del 2026-11-11
  - contratos/contracts/OrbitClearEscrow.sol (eventos Registered, Refunded, Forfeited)
relacionadas: [docs/planning.md, 2026-11-11-1546-mayko-unificacion-escrow.md, 2026-11-11-1628-mauricio-guion-pitch-y-defensas.md]
---

## Qué es

Idea para sumar al producto y al pitch: mostrar en la web, para todo público, el historial de cada operador (satélites con garantía, retirados a tiempo, garantías perdidas y porcentaje de cumplimiento). Quedó escrita en `docs/planning.md` §5 y como opcional en §11. **Está sin construir y sin decidir por el equipo.**

## Lo importante

- **No hay que tocar el contrato.** Los eventos `Registered`, `Refunded` y `Forfeited` ya incluyen al operador; el historial se calcula en la web.
- **Para el pitch:** responde a "¿por qué lo usarían antes de que sea obligatorio?" con reputación verificable, que además pueden mirar aseguradoras y clientes. Es una hipótesis sin validar.
- **Nombre:** "historial de cumplimiento" o "puntaje de órbita limpia". No "espacio aéreo".
- **No decir que mide impacto ambiental:** solo mide si el operador cumplió su plazo.
- **Límites:** con pocos satélites el porcentaje engaña (mostrar la cantidad al lado). En Fuji hoy solo hay decomisos (Envisat y 4133), así que para ver un historial bueno hay que registrar un caso que cumplió o usar datos de demo.
- **Técnico:** el RPC público de Fuji corta los scans de eventos en paralelo; leer de a tramos, como ya hace la web.

## Preguntas abiertas

- ¿Entra a la demo como panel en la web, o solo se menciona en el pitch?
- ¿Quién lo toma? Nadie lo tiene asignado.

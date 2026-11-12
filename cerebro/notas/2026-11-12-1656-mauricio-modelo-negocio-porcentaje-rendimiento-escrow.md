---
titulo: Modelo de negocio — cobrar un porcentaje de lo que genere el escrow
autor: mauricio
fecha: 2026-11-12 16:56
tema: orbitclear
tags: [modelo-de-negocio, pitch, rendimiento, escrow, comision]
tipo: idea
fuentes:
  - conversación de Mauricio con su agente, 12-nov-2026
relacionadas: [2026-11-11-1607-mauricio-numeros-economia-pitch, 2026-11-11-1504-mauricio-marco-legal-bono-escrow, 2026-11-12-0137-mauricio-debate-jurado-defensa]
---

## Qué es
Mauricio propone sumar al modelo de negocio un segundo ingreso: OrbitClear cobra un porcentaje de lo que genere la plata depositada en el escrow. Ya quedó escrito en `docs/pitch/guion.md` (sección 9) y en `docs/defensa.md` (secciones 4 y 6).

## Lo importante
- **Dos ingresos:** la comisión de 0,5% por depósito que ya estaba, más un porcentaje del rendimiento del escrow.
- **El rendimiento es del operador** y nosotros cobramos una parte. Coincide con la propuesta de Nature Communications 2026, que devuelve el depósito con interés.
- **Ejemplo del guion (supuesto nuestro):** USD 180 millones por año en garantías, rendimiento de 4% anual, nos quedamos con el 10% de lo generado: unos USD 720.000 por año. Crece porque los depósitos se acumulan.
- **Hoy no está construido.** `OrbitClearEscrow` guarda USDC sin rendimiento. En el pitch va como paso siguiente; `docs/defensa.md` sigue pidiendo no decir "el escrow genera rendimiento".
- **Interpretación:** ayuda con la objeción del capital inmovilizado (2 de 5 en el debate de práctica), porque el operador deja de tener plata muerta.

## Preguntas abiertas
- Qué porcentajes usar: el 4% y el 10% son de ejemplo, nadie los decidió.
- En qué activo se pondría la garantía y con qué límites regulatorios (ver la nota de marco legal).
- En la misma conversación se evaluó pasar a un seguro de caución paramétrico: el operador paga una cuota y un pool pone el capital. Queda sin decidir; la sugerencia fue mantener el titular de garantía de desorbitado y usar el seguro como respuesta a "quién pone la plata".

---
titulo: Idea para la demo — línea de tiempo "con OrbitClear vs. sin OrbitClear" a X años
autor: franco
fecha: 2026-11-11 14:55
tema: orbitclear
tags: [demo, frontend, idea, linea-de-tiempo]
tipo: idea
fuentes:
  - conversación con Franco mientras se armaba el frontend (web/)
relacionadas: [2026-11-11-1300-franco-bono-deorbitado-quien-multa.md]
---

## Qué es
Idea para más adelante (no está construida): mostrar en la demo una línea de tiempo que compare cómo se vería la órbita de acá a X años con OrbitClear funcionando y cómo se vería sin nosotros.

## Lo importante
- Lo que pidió Franco: "cómo sería con nosotros funcionando de acá a X años y cómo sería sin nosotros", en formato de línea de tiempo.
- **Interpretación:** encaja con lo que ya existe en el frontend. El botón WARP TIME ya adelanta el reloj de simulación; la línea de tiempo sería un control de años con dos escenarios (objetos que se van retirando y pagos liberados, contra objetos que se acumulan y escrows que vencen).

## Preguntas abiertas
- Cuántos años (X) y con qué modelo se proyecta cada escenario (¿crecimiento de basura, colisiones en cadena?). Hace falta un dato real que lo respalde.
- Si va como pantalla aparte, como slider sobre el globo o como slide del pitch.

## Aporte de franco (2026-11-11 19:26)
Se probó una primera versión en el frontend (sin subir a main) y a Franco no le convenció. Lo que pidió para cuando se retome:

- **El punto de partida es que hoy nadie tiene garantía.** La basura que ya está en órbita queda sin depósito; lo que cambia es el futuro: cada satélite nuevo sale con el escrow de OrbitClear.
- **El salto tiene que ser directo a ~5 años**, no un avance gradual con WARP TIME. Hoy WARP TIME corre 3 horas simuladas por segundo, y hubo que "comprimir" 5 años en 72 horas simuladas; eso confunde (el reloj dice 2026 y el panel 2031).
- **Gráficamente se tiene que ver cómo salvaríamos la órbita.** La versión probada (puntos verdes que aparecen, algunos pasan a rojo y desaparecen) no lo transmite.
- **Alternativa que tiró Franco:** ocultar la capa real de CelesTrak y simular todo lo demás.
- Dato a chequear antes de usarlo: "va a haber más de 300.000 satélites". En la prueba se usó como total de la proyección **sin verificar**.

**Interpretación (Claude):** lo que falta es el contraste. Una comparación lado a lado o un interruptor "sin OrbitClear / con OrbitClear" en el mismo año futuro mostraría la diferencia de un vistazo: en un caso los satélites muertos se acumulan, en el otro se retiran con su depósito.

Qué quedó hecho en el frontend y sirve de base: órbitas reales de CelesTrak para los objetos con depósito, capa de ~2.700 restos reales (grupos Fengyun 1C, Cosmos 2251 e Iridium 33) y una capa de lanzamientos simulados con contadores.

---
titulo: Debate de práctica jurado contra defensa — qué defensas no aguantaron
autor: mauricio
fecha: 2026-11-12 01:37
tema: orbitclear
tags: [pitch, defensa, jurado, contrato, debate]
tipo: conclusion
fuentes:
  - debate entre dos modelos (jurado Gemini 4 Argon vía agy, defensa Claude), sobre docs/defensa.md, docs/planning.md y OrbitClearEscrow.sol
relacionadas: [2026-11-12-0104-mauricio-antecedentes-dano-real-y-cifras-revisadas.md, 2026-11-11-1628-mauricio-guion-pitch-y-defensas.md]
---

## Qué es

Pusimos a un modelo a hacer de jurado exigente y a otro de defensa, con dos rondas de preguntas y un veredicto. Sirve para saber qué respuestas del pitch se caen antes de grabar. El debate completo está en [el adjunto](../adjuntos/2026-11-12-0137-mauricio-debate-jurado-defensa.md). Es la opinión de un modelo, no de un jurado real.

## Lo importante

Puntaje general del jurado: 6,5 sobre 10.

**Defensas que no aguantaron**

- **Capital inmovilizado (2 de 5).** "Lo pone una aseguradora" no alcanza: `register` cobra el 100% en USDC y lo deja sin rendimiento hasta 25 años, así que la aseguradora tiene el mismo costo que el operador. El 0,5% de comisión tampoco está en el código.
- **Por qué blockchain y marco legal (2 de 5).** "Todos pueden usar el mismo contrato" es falso con el contrato actual: tiene un solo relayer, un solo fondo y una sola tabla de montos. Para un regulador que solo regula a los suyos, un fideicomiso bancario alcanza. El caso que queda es el transfronterizo, y es hipótesis.
- **Depósito "al lanzar" (3 de 5).** `register` pide el número NORAD, que existe recién con el satélite en órbita. El operador puede revocar el permiso de USDC después de lanzar y no queda garantía.

**Problemas del contrato que encontró el jurado (verificados contra el código)**

- `closeExpired` no tiene período de gracia: si un satélite reingresa a tiempo pero la acreditación llega después del vencimiento, cualquiera cierra el caso y el operador pierde.
- `attestReentry` solo rechaza `decayDate == 0`: acepta fechas anteriores al lanzamiento o futuras.
- El plazo se cuenta desde el lanzamiento, no desde el fin de misión como la regla de la FCC.
- `relayer` y `fund` son inmutables y en Fuji son la misma dirección. No se puede rotar la clave.
- El operador queda fijo: no hay forma de cambiar el beneficiario si el satélite se vende.
- En Fuji no hay ningún caso real de devolución.

**Preguntas que el documento no tiene preparadas**

- Qué pasa si Circle congela los USDC del contrato o del fondo.
- Por qué se premia igual un reingreso descontrolado que uno controlado.
- Adónde vuelve la plata si el operador se vendió o quebró.
- Cómo se rota la clave del relayer en 25 años.

**Lo que el jurado dice que más sube el puntaje**

1. Cargar en Fuji un caso real de devolución (un satélite que reingresó dentro de su plazo). No toca el contrato.
2. Período de gracia en `closeExpired` y validar `decayDate`. **Interpretación nuestra:** el cambio es chico, pero el contrato ya está desplegado, así que implica redesplegar y volver a cargar los casos.
3. Depósito previo al lanzamiento, separado de la vinculación con el número NORAD.

## Preguntas abiertas

- Si se redespliega el contrato antes de grabar o se dicen las limitaciones en el pitch.
- Qué frases de docs/defensa.md se corrigen: "deposita al lanzar", "todos pueden usar el mismo contrato", "el operador o su aseguradora usan la app", "sin crear un fondo estatal".

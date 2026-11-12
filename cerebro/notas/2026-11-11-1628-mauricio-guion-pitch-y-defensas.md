---
titulo: Guion del pitch en lenguaje natural y respuestas a las preguntas difíciles del jurado
autor: mauricio
fecha: 2026-11-11 16:28
tema: orbitclear
tags: [pitch, guion, jurado, defensa, modelo-de-negocio]
tipo: resumen
fuentes:
  - docs/planning.md
  - contratos/README.md (bandas y montos del contrato desplegado)
  - cerebro/notas/2026-11-11-1245-samuel-verificaciones-orbitclear.md
  - cerebro/notas/2026-11-11-1504-mauricio-marco-legal-bono-escrow.md
  - cerebro/notas/2026-11-11-1607-mauricio-numeros-economia-pitch.md
  - conversación de Mauricio con un jurado (preguntó sobre todo por lo que ya existe hoy)
relacionadas: [2026-11-11-1300-franco-bono-deorbitado-quien-multa.md, 2026-11-11-1350-samuel-decisiones-orbitclear.md, 2026-11-11-1546-mayko-unificacion-escrow.md]
---

## Qué es

Guion hablado de unos dos minutos y medio, siguiendo `skills/idea/modelo-de-negocio`, más las respuestas cortas a las preguntas que más cuestan. Sale de una charla con un jurado que insistió en "qué existe hoy". Criterio central: **la obligación de desorbitar ya existe; lo que proyectamos es el mecanismo para hacerla cumplir.** No decir "el regulador lo exige": hoy ningún regulador exige la garantía.

## Guion

**Problema.** El año pasado se lanzaron más de 4.500 satélites, récord histórico. Cuando se les acaba la vida útil, la mayoría debería bajarse de la órbita. Pero en las órbitas donde no caen solos, solo el 40% lo hace. El resto queda arriba como basura, y cada choque genera más.

**Por qué pasa.** Porque dejar la basura sale gratis. En toda la historia hubo una sola multa documentada: la FCC de Estados Unidos multó a DISH en 2023 con 150.000 dólares. Remover un solo objeto le costó a la ESA 86 millones de euros. Hoy es más barato abandonar que retirar, y la multa llega cuando el satélite ya está muerto.

**La idea.** Cobrar antes en vez de multar después. El operador deposita una garantía al lanzar: si baja el satélite a tiempo, la recupera; si no, la pierde y va a un fondo de remoción. No es idea nuestra: la FCC la consultó en 2020 y un paper de Nature de este año la propone. Lo que nadie hizo es construirla.

**Qué construimos.** OrbitClear es un contrato en Avalanche que custodia esa garantía. El monto depende de la altura: de 100.000 a 800.000 dólares, el rango que modelan los estudios. Un relayer lee el catálogo público de CelesTrak. Si el catálogo dice que el satélite reingresó dentro del plazo, el contrato devuelve la plata. Si el plazo vence, cualquiera puede cerrar el caso y la garantía pasa al fondo.

**Demo.** Esto es Envisat, un satélite de la ESA muerto a unos 760 km. Está registrado en nuestro contrato en Fuji con datos reales, y acá está la transacción donde su garantía pasa al fondo por plazo vencido.

**Por qué blockchain.** El operador puede ser de un país, el lanzamiento de otro y el daño de todos, y no hay una autoridad común. Con el contrato, ningún gobierno tiene la plata, las reglas quedan fijas al depositar y cualquiera puede verificar el dato y el pago. Con una base de datos común, alguien tendría que administrarla, y ese alguien es justo en quien los demás no confían.

**Modelo.** El usuario es el operador o su aseguradora; quien lo adopta es el regulador que da la licencia. Si el 20% de los lanzamientos depositara, serían unos 180 millones de dólares por año en garantías. Con una comisión de 0,5% por depósito, son unos 900.000 dólares por año. (Supuesto nuestro.)

**Cierre.** Hoy ningún país exige esta garantía, y no sabemos cuándo va a pasar. Pero lo que la empuja ya está: más satélites, bajo cumplimiento y reguladores endureciendo las reglas. Europa vota su ley espacial la semana que viene. Cuando un país decida exigirla, va a necesitar dónde custodiarla. Eso ya está hecho.

## Respuestas a las preguntas difíciles

- **¿Hoy alguien está obligado a depositar?** No. Hoy se exige desorbitar (la FCC pide 5 años), pero no una garantía. Proyectamos el mecanismo, no la obligación.
- **¿Y por qué alguien lo usaría antes de que sea obligatorio?** Hipótesis sin validar: para respaldar con plata un compromiso público (hay más de 200 firmantes del Zero Debris Charter) o para negociar una prima de seguro más baja.
- **¿Bajo qué regulación se castigó a alguien?** DISH, 2023, FCC, por incumplir el plan de retiro de su licencia. Fue la primera multa por basura espacial. Fue en órbita geoestacionaria; nuestro MVP cubre órbita baja.
- **¿Quién fija los montos?** El regulador. En la demo son ilustrativos y están dentro del rango de los estudios. Quedan fijos al desplegar el contrato y nadie los cambia.
- **¿Los operadores chicos pueden pagarlo?** El bono lo puede poner una aseguradora a cambio de una prima, y en órbita baja el monto es el mínimo. El paper de Nature muestra que con el bono se lanzan más satélites, no menos.
- **¿Y si el satélite se rompe sin culpa del operador?** Pierde la garantía igual. Es el incentivo: los que mueren sin poder maniobrar son los que dejan basura. Para eso está el seguro.
- **¿200.000 dólares pagan una remoción?** No. El bono es un incentivo para que el operador desorbite, no un seguro del costo total. El fondo junta lo decomisado.
- **¿Quién controla el relayer?** En la demo, nosotros, y publica el hash del dato para que cualquiera lo recalcule. Cerrar un caso vencido no depende del relayer. En el roadmap, firma de 2 de 3.
- **¿Qué pasa si el dato miente?** El reingreso es poco ambiguo: el objeto deja de estar en el catálogo. Límite real: todo el seguimiento público viene de una sola red, la de Estados Unidos.
- **¿El rendimiento del escrow?** Roadmap. Tiene límites regulatorios y una garantía no puede perder capital.

## Preguntas abiertas
- El guion dice "pagar su remoción", pero el contrato desplegado solo decomisa al fondo; no paga a un removedor (decisión de Mayko, 15:46, que revierte el punto 1 de las decisiones de Samuel de 13:50). No prometer el pago de remoción en la demo.
- Verificar antes de grabar: 4.517 satélites en 2025, 40% de Nature, fecha del voto del EU Space Act y qué transacción de Envisat se muestra.
- Definir el modelo de ingresos: la comisión de 0,5% es un supuesto.

## Aporte de mayko (2026-11-11 16:40)
- Sobre "más de 4.500 satélites el año pasado": el catálogo SATCAT de CelesTrak (descargado el 11-nov-2026, incluye los que ya reingresaron) registra **4.483** cargas útiles con fecha de lanzamiento en 2025. Con esa fuente, la frase segura es "casi 4.500". El 4.517 puede salir de otro conteo; si se usa, citar de dónde viene. Detalle en `2026-11-11-1626-mayko-avance-basura-espacial-y-proyecciones.md`.

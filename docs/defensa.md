# OrbitClear: lo más fuerte, cómo defenderlo y por qué es un buen planteo a futuro

Documento de apoyo para el pitch y las preguntas del jurado. Resume lo investigado en `docs/planning.md` y en `cerebro/notas/`.
Última actualización: 11 de noviembre de 2026.

## 1. La idea en dos frases

Hoy abandonar un satélite sale gratis, porque la sanción llega tarde o no llega. OrbitClear custodia una garantía que el operador deposita al lanzar y que solo recupera si retira el satélite a tiempo, verificado con datos públicos.

**La frase que ordena todo:** la obligación de desorbitar ya existe; lo que proyectamos es el mecanismo para hacerla cumplir.

## 2. Lo más fuerte que tenemos

| # | Dato | Por qué pega |
|---|---|---|
| 1 | En 2025 se lanzaron 4.517 satélites, 58% más que en 2024. Se esperan más de 43.000 entre 2025 y 2034. | El problema crece rápido y no depende de nosotros. |
| 2 | Solo el 40% de los satélites en órbitas donde no caen solos se desorbitó entre 2010 y 2024. | Es un dato de Nature Communications (2026), revisado por pares. |
| 3 | Hubo una sola multa documentada: USD 150.000 a DISH (FCC, 2023). Remover un objeto le costó a la ESA EUR 86 millones, unas 700 veces más. | Abandonar es más barato que retirar. Es el contraste central del pitch. |
| 4 | La garantía ya fue consultada por la FCC (2020) y propuesta en Nature (2026): USD 200.000 por satélite. | No es idea nuestra. Nosotros la construimos. |
| 5 | Según el paper, un país puede aplicarla solo, y con cubrir el 20% de los lanzamientos los abandonados bajan cerca de 18%. | No hace falta un tratado internacional. |
| 6 | El mismo modelo muestra que con el bono se lanzan más satélites, no menos. | Responde a "esto frena a la industria". |
| 7 | El EU Space Act se vota en comisión el 19 de noviembre de 2026. El Reino Unido ata la responsabilidad a la sostenibilidad desde el 1 de diciembre. | La regulación se está moviendo este mes. |
| 8 | El 9 de noviembre se anunció que la NYSE liquidará su plataforma de valores tokenizados sobre una red propia de Avalanche. | Una institución regulada eligiendo la misma tecnología, esta semana. |
| 9 | El contrato está desplegado en Fuji y tiene registrado a Envisat, un satélite real de la ESA muerto a unos 760 km. | No es una maqueta: es verificable en el explorer. |

Contrato en Fuji: `0xA5aeCF58Fac272e9E4CC5D473A2767C56019CbB2`.

## 3. Por qué es un buen planteo a futuro

1. **El problema empeora solo.** La ESA proyecta que la basura crece aunque no se lance nada más, y los lanzamientos baten récords. La presión para regular solo puede subir.
2. **La regla ya está; falta cómo cobrarla.** La FCC exige retiro en 5 años, pero solo puede multar después, cuando el satélite ya está muerto o la empresa quebró. No inventamos una regulación: proponemos cómo se hace cumplir una que existe.
3. **Sacamos del medio el obstáculo práctico.** A un regulador le cuesta exigir la garantía por dos motivos: la decisión política y tener que montar un fondo. No resolvemos el primero, pero eliminamos el segundo.
4. **Sirve especialmente a países sin estructura.** Argentina no tiene ley espacial integral y hay un proyecto en Diputados. Un país así puede exigir la garantía sin crear un fondo estatal.
5. **Regulación nacional, infraestructura compartida.** Cada país pone su regla; todos pueden usar el mismo contrato, con las mismas garantías de custodia y un registro que cualquiera audita.
6. **Hay un uso posible antes de la obligación.** El historial público de cumplimiento le permite a un operador demostrar que cumple, ante clientes y aseguradoras. Es una hipótesis sin validar.

## 4. Cómo defenderlo

| Si preguntan | Respuesta |
|---|---|
| ¿Hoy alguien está obligado a depositar? | No. Hoy se exige desorbitar, no una garantía. Proyectamos el mecanismo, no la obligación. |
| ¿Cómo saben que se va a exigir? | No lo sabemos. Lo que la empuja ya está pasando: más satélites, bajo cumplimiento y reguladores endureciendo reglas. |
| ¿Por qué lo usarían antes? | Para respaldar con plata un compromiso público (hay más de 200 firmantes del Zero Debris Charter) o negociar una prima de seguro más baja. Hipótesis sin validar. |
| ¿Quién es el usuario? | El operador o su aseguradora usan la app. El regulador la adopta y fija las reglas. |
| ¿Quién fija los montos? | El regulador. Los de la demo (USD 100.000, 300.000 y 800.000 según la altura) están dentro del rango de los estudios y quedan fijos al desplegar. |
| ¿Los operadores chicos pueden pagarlo? | El bono lo puede poner una aseguradora a cambio de una prima, y en órbita baja el monto es el mínimo. |
| ¿Y si el satélite falla sin culpa del operador? | Pierde la garantía igual. Los que mueren sin poder maniobrar son los que dejan basura. Para eso está el seguro. |
| ¿USD 200.000 pagan una remoción? | No. El bono es un incentivo para desorbitar, no un seguro del costo total. |
| ¿Por qué blockchain y no una base de datos? | Alguien tendría que administrarla, y ese alguien es justo en quien los demás no confían. Operador, lanzamiento y daño pueden ser de países distintos. |
| ¿Quién controla el relayer? | En la demo, nosotros, y publica el hash del dato para que cualquiera lo recalcule. Cerrar un caso vencido no depende del relayer. En el roadmap, firma de 2 de 3. |
| ¿Y si el dato miente? | El reingreso es poco ambiguo: el objeto deja de estar en el catálogo. El límite real es que todo el seguimiento público viene de la red de Estados Unidos. |
| ¿Es legal remover un satélite ajeno? | El control lo conserva el Estado de registro. Por eso el consentimiento tiene que estar en la licencia, no solo en el contrato. |

## 5. Lo que no hay que decir

- **"El regulador lo exige."** Hoy ningún regulador exige la garantía.
- **"La única multa."** Decir "la primera": no verificamos si hubo otra después de 2023.
- **"La ESA lo propone."** El estudio de 2025 tiene autores de la ESA, pero no es posición oficial.
- **"Mide el impacto ambiental."** El historial mide si el operador cumplió su plazo, nada más.
- **"La NYSE eligió exclusivamente Avalanche."** Lo anunció Ava Labs, la plataforma maneja varias redes y falta la aprobación regulatoria.
- **"El fondo paga la remoción."** El contrato desplegado decomisa al fondo; no le paga a un removedor.
- **"El escrow genera rendimiento."** Es roadmap y tiene límites regulatorios.

## 6. Los puntos débiles, dichos por nosotros

Conviene nombrarlos antes de que los nombre el jurado.

1. **Depende de una decisión política.** La FCC consultó el bono en 2020 y no lo adoptó.
2. **No validamos con nadie.** Ningún regulador, operador ni aseguradora nos confirmó interés.
3. **El volumen está concentrado.** Starlink fue el 73% de lo lanzado en 2025 y ya desorbita; el impacto está en el resto.
4. **El modelo de ingresos es un supuesto.** La comisión de 0,5% por depósito no está decidida.
5. **Solo cubre órbita baja.** En la geoestacionaria los satélites no reingresan, y el caso DISH fue ahí.

## 7. Pendientes antes de grabar

- Confirmar en la fuente original: 4.517 satélites, 40% de cumplimiento, EUR 86 millones y la fecha del voto del EU Space Act.
- Elegir qué transacción de Envisat se muestra en el video.
- Decidir si el historial de cumplimiento entra a la demo o solo al pitch.

## Fuentes

- [Nature Communications 2026, bonos de desorbitado](https://doi.org/10.1038/s41467-026-77660-4)
- [FCC 20-54, consulta sobre la garantía](https://www.govinfo.gov/content/pkg/FR-2020-08-25/html/2020-13185.htm)
- [Multa de la FCC a DISH](https://www.space.com/space-debris-fcc-first-fine-dish-deorbit-satellite)
- [Contrato ESA y ClearSpace, EUR 86 millones](https://spacenews.com/clearspace-contract-signed/)
- [Novaspace, 43.000 satélites a 2034](https://payloadspace.com/novaspace-predicts-43000-new-sats-to-launch-by-2034/)
- [Récord de lanzamientos en 2025](https://e360.yale.edu/digest/2025-satellite-launches)
- [EU Space Act, Comisión Europea](https://defence-industry-space.ec.europa.eu/eu-space-act_en)
- [Reino Unido, paquete de herramientas financieras](https://www.gov.uk/government/consultations/consultation-on-orbital-liabilities-insurance-charging-and-space-sustainability/outcome/space-regulatory-financial-tools-package-including-government-response-to-the-liability-insurance-charging-and-space-sustainability-consultation)
- [NYSE y Avalanche, CoinDesk](https://www.coindesk.com/business/2026/11/09/nyse-picks-avalanche-to-settle-tokenized-stocks-amid-wall-street-s-blockchain-race)
- Notas del equipo en `cerebro/notas/`, en especial las de verificaciones, marco legal, números de economía y guion del pitch.

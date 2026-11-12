# OrbitClear: lo más fuerte, cómo defenderlo y por qué es un buen planteo a futuro

Documento de apoyo para el pitch y las preguntas del jurado. Resume lo investigado en `docs/planning.md` y en `cerebro/notas/`.
Última actualización: 12 de noviembre de 2026.

## 1. La idea en dos frases

Hoy abandonar un satélite sale gratis, porque la sanción llega tarde o no llega. OrbitClear custodia una garantía que el operador deposita al lanzar y que solo recupera si retira el satélite a tiempo, verificado con datos públicos.

**La frase que ordena todo:** la obligación de desorbitar ya existe; lo que proyectamos es el mecanismo para hacerla cumplir.

## 2. Lo más fuerte que tenemos

| # | Dato | Por qué pega |
|---|---|---|
| 1 | En 2025 se lanzaron más de 4.500 satélites, 58% más que en 2024 (4.517 según Jonathan McDowell; otros conteos dan entre 4.323 y 4.510). Se esperan más de 43.000 entre 2025 y 2034. | El problema crece rápido y no depende de nosotros. |
| 2 | Solo el 40% de los satélites en órbitas donde no caen solos se desorbitó entre 2010 y 2024. | Es un dato de Nature Communications (2026), revisado por pares. |
| 3 | En junio de 2024 el Resurs-P1, un satélite ruso dado de baja y dejado en órbita, se partió en más de 100 fragmentos. La tripulación de la estación espacial se refugió cerca de una hora en sus naves. | Es nuestro caso exacto: un satélite muerto que nadie bajó y que años después generó basura. |
| 4 | En noviembre de 2025 un resto de menos de un milímetro fisuró una ventana de la nave Shenzhou-20. Los tres astronautas chinos volvieron nueve días tarde y en otra nave. | El daño ya llega a misiones tripuladas, y es reciente. |
| 5 | La primera multa documentada fue de USD 150.000 a DISH (FCC, 2023). El contrato de la ESA para remover un solo objeto fue de EUR 86 millones, unas 700 veces más. | Abandonar es más barato que retirar. Es el contraste central del pitch. |
| 6 | La garantía ya fue consultada por la FCC (2020) y propuesta en Nature (2026): USD 200.000 por satélite. | No es idea nuestra. Nosotros la construimos. |
| 7 | Según el paper, un país puede aplicarla solo, y con cubrir el 20% de los lanzamientos los abandonados bajan cerca de 18%. | No hace falta un tratado internacional. |
| 8 | El mismo modelo muestra que con el bono se lanzan más satélites, no menos. | Responde a "esto frena a la industria". |
| 9 | El EU Space Act está en trámite en el Parlamento Europeo, con voto en comisión previsto para este mes. El Reino Unido ata la responsabilidad a la sostenibilidad desde el 1 de diciembre. | La regulación se está moviendo este mes. |
| 10 | El 9 de noviembre se anunció que la NYSE liquidará su plataforma de valores tokenizados sobre una red propia de Avalanche. | Una institución regulada eligiendo la misma tecnología, esta semana. |
| 11 | El contrato está desplegado en Fuji y tiene registrado a Envisat, un satélite real de la ESA muerto a unos 760 km. | No es una maqueta: es verificable en el explorer. |

Contrato en Fuji: `0xA5aeCF58Fac272e9E4CC5D473A2767C56019CbB2`.

**De reserva, si piden un choque real entre satélites:** el 10 de febrero de 2009 el Cosmos 2251, un satélite ruso muerto, chocó con el Iridium 33, que estaba activo. Fue el primer choque entre dos satélites y dejó cerca de 2.200 fragmentos catalogados.

**Sobre los EUR 86 millones:** es el monto del contrato de 2020 entre la ESA y ClearSpace. No encontramos que la misión haya volado: en 2023 otro resto golpeó al objeto que iban a retirar, y en 2024 la ESA cambió el objetivo y puso a OHB al frente. Si preguntan, decir "el contrato fue de" y no "costó".

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
| Si remover cuesta mucho más que la garantía, ¿por qué cumpliría el operador? | Son dos costos distintos. Los EUR 86 millones son lo que cuesta que un tercero vaya a buscar un satélite muerto. Al operador, bajarlo él mismo mientras funciona le cuesta reservar combustible y terminar la misión a tiempo. La garantía tiene que superar ese costo, no el de la remoción. No tenemos una cifra verificada de cuánto cuesta desorbitar. |
| ¿Y si le rinde más seguir operando que recuperar la garantía? | Puede pasar con satélites que facturan mucho. Por eso el monto lo fija el regulador según la misión y sube con la altura. Con un satélite que ya murió o no tiene propulsión, ninguna garantía lo baja: el incentivo actúa antes, al diseñarlo y al decidir cuándo terminar la misión. |
| ¿Por qué blockchain y no una base de datos? | Alguien tendría que administrarla, y ese alguien es justo en quien los demás no confían. Operador, lanzamiento y daño pueden ser de países distintos. |
| ¿Quién controla el relayer? | En la demo, nosotros, y publica el hash del dato para que cualquiera lo recalcule. Cerrar un caso vencido no depende del relayer. En el roadmap, firma de 2 de 3. |
| ¿Y si el dato miente? | El reingreso es poco ambiguo: el objeto deja de estar en el catálogo. El límite real es que todo el seguimiento público viene de la red de Estados Unidos. |
| ¿Es legal remover un satélite ajeno? | El control lo conserva el Estado de registro. Por eso el consentimiento tiene que estar en la licencia, no solo en el contrato. |
| ¿Quién haría la remoción? ¿Tienen socios? | No tenemos socios. Hoy trabajan en remoción ClearSpace, Astroscale y Starfish Space, y serían posibles destinatarios del fondo en el roadmap. |
| ¿Esto ya causó algún daño real? | Sí: Resurs-P1 en 2024, Shenzhou-20 en 2025 y el choque Cosmos-Iridium en 2009. |

## 5. Lo que no hay que decir

- **"El regulador lo exige."** Hoy ningún regulador exige la garantía.
- **"La única multa."** Decir "la primera": no verificamos si hubo otra después de 2023.
- **"La ESA lo propone."** El estudio de 2025 tiene autores de la ESA, pero no es posición oficial.
- **"Mide el impacto ambiental."** El historial mide si el operador cumplió su plazo, nada más.
- **"La NYSE eligió exclusivamente Avalanche."** Lo anunció Ava Labs, la plataforma maneja varias redes y falta la aprobación regulatoria.
- **"El fondo paga la remoción."** El contrato desplegado decomisa al fondo; no le paga a un removedor.
- **"El escrow genera rendimiento."** Es roadmap y tiene límites regulatorios.
- **"La estación espacial se refugió por un choque de satélites."** El Resurs-P1 se partió solo y la causa no se confirmó. Tampoco hay datos de pérdidas de plata.
- **"En 2030 habrá 300.000 satélites."** Esa cifra sale de una solicitud en papel de Ruanda para una constelación, no de una proyección. Usar la de Novaspace.
- **"Nos asociamos con RemoveDEBRIS."** Fue una misión de prueba de la Universidad de Surrey (2018 y 2019) que ya terminó. No es una empresa.
- **"El EU Space Act se aprobó."** Todavía no es ley, y no dar fecha de voto: las fuentes dicen 10 o 19 de noviembre.

## 6. Los puntos débiles, dichos por nosotros

Conviene nombrarlos antes de que los nombre el jurado.

1. **Depende de una decisión política.** La FCC consultó el bono en 2020 y no lo adoptó.
2. **No validamos con nadie.** Ningún regulador, operador ni aseguradora nos confirmó interés.
3. **El volumen está concentrado.** Starlink fue cerca de tres cuartos de lo lanzado en 2025 (73% según KeepTrack: 3.171 de 4.323) y ya desorbita; el impacto está en el resto.
4. **El modelo de ingresos es un supuesto.** La comisión de 0,5% por depósito no está decidida.
5. **Solo cubre órbita baja.** En la geoestacionaria los satélites no reingresan, y el caso DISH fue ahí.

## 7. Pendientes antes de grabar

- Confirmar en la agenda del Parlamento Europeo la fecha y el resultado del voto en comisión del EU Space Act. El resto de las cifras ya se revisó el 12 de noviembre (ver nota de verificación en `cerebro/notas/`).
- Agregar un período de gracia al cierre de vencidos (`closeExpired`). Hoy cualquiera puede cerrar un caso apenas pasa el plazo, y CelesTrak publica el reingreso con horas o días de demora: un operador que cumplió puede perder la garantía. La corrección es que el cierre solo se pueda llamar unos días después del vencimiento; la fecha que decide si cumplió no cambia. Implica redesplegar el contrato. Si no se llega, decirlo en el pitch como limitación conocida.
- Elegir qué transacción de Envisat se muestra en el video.
- Decidir si el historial de cumplimiento entra a la demo o solo al pitch.

## Fuentes

- [Nature Communications 2026, bonos de desorbitado](https://doi.org/10.1038/s41467-026-77660-4)
- [FCC 20-54, consulta sobre la garantía](https://www.govinfo.gov/content/pkg/FR-2020-08-25/html/2020-13185.htm)
- [Multa de la FCC a DISH](https://www.space.com/space-debris-fcc-first-fine-dish-deorbit-satellite)
- [Contrato ESA y ClearSpace, EUR 86 millones](https://spacenews.com/clearspace-contract-signed/)
- [Cambio de objetivo de ClearSpace-1 en 2024](https://www.satellitetoday.com/sustainability/2024/04/24/clearspace-1-mission-changes-objective-in-response-to-space-debris-collision)
- [Resurs-P1, Al Jazeera](https://www.aljazeera.com/news/2024/6/28/iss-astronauts-take-cover-as-defunct-russian-satellite-shatters)
- [Shenzhou-20, PBS](https://www.pbs.org/newshour/science/chinese-astronauts-return-from-space-station-after-delay-blamed-on-space-debris-damage)
- [Choque Cosmos 2251 e Iridium 33, análisis de la NASA](https://ntrs.nasa.gov/api/citations/20150003820/downloads/20150003820.pdf)
- [KeepTrack, satélites lanzados por año](https://keeptrack.space/live-count/how-many-satellites-are-launched-per-year)
- [Novaspace, 43.000 satélites a 2034](https://payloadspace.com/novaspace-predicts-43000-new-sats-to-launch-by-2034/)
- [Récord de lanzamientos en 2025](https://e360.yale.edu/digest/2025-satellite-launches)
- [EU Space Act, Comisión Europea](https://defence-industry-space.ec.europa.eu/eu-space-act_en)
- [Reino Unido, paquete de herramientas financieras](https://www.gov.uk/government/consultations/consultation-on-orbital-liabilities-insurance-charging-and-space-sustainability/outcome/space-regulatory-financial-tools-package-including-government-response-to-the-liability-insurance-charging-and-space-sustainability-consultation)
- [NYSE y Avalanche, CoinDesk](https://www.coindesk.com/business/2026/11/09/nyse-picks-avalanche-to-settle-tokenized-stocks-amid-wall-street-s-blockchain-race)
- Notas del equipo en `cerebro/notas/`, en especial las de verificaciones, marco legal, números de economía y guion del pitch.

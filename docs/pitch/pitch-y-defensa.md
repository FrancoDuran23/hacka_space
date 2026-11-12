# OrbitClear: pitch y defensa

Versión del 12 de noviembre de 2026. Enfoque: la regla de retirar los satélites ya existe, el castigo elegido es la multa y la multa no funciona. OrbitClear cambia el momento del cobro.

Este documento junta el guion para decir en voz alta y las respuestas para el jurado. `docs/pitch/guion.md` (por slides) y `docs/defensa.md` son versiones anteriores, con el enfoque de "nos adelantamos a la regulación". Donde se contradigan, vale este.

## 1. El pitch en una frase

No pedimos una regla nueva: hacemos que la que ya existe se cumpla, cobrando antes en vez de multar después.

## 2. Guion

Unas 400 palabras, cerca de dos minutos y medio. Los títulos en negrita son para acordarse del orden, no se dicen.

**El golpe.** La regla ya existe. Lo que no funciona es el castigo.

**La regla.** Hoy, para lanzar un satélite, el operador le promete al regulador que lo va a retirar. En Estados Unidos tiene cinco años desde que termina la misión. ¿Y si no cumple? Multa.

**La multa falla tres veces.**

Llega tarde. Se cobra cuando el satélite ya está muerto y sin combustible. Ya no hay nada que corregir.

Es chica. La primera multa por esto fue de 150.000 dólares. Remover un solo objeto se contrató en 86 millones de euros. Hacé la cuenta: conviene pagar la multa.

Y hay que ir a cobrarla. Años después del lanzamiento, a una empresa que quizá quebró, cambió de dueño o está en otro país.

**Mientras tanto.** La basura ya frena misiones: astronautas que tuvieron que refugiarse en sus naves, y 43.000 satélites más en camino.

**Qué hacemos.** Nosotros cambiamos el momento del cobro. Con OrbitClear, la plata se pone el día de la licencia, no años después. El operador deposita una garantía en un contrato sobre Avalanche. ¿Bajó su satélite a tiempo? La recupera. ¿No lo bajó? Ya está cobrada, y va a la billetera del regulador. Sin juicios, sin perseguir a nadie. Y si cumplió o no lo dicen los datos públicos de seguimiento, no una opinión.

**Qué es y qué no.** Esto no es un fondo para limpiar el espacio: con 200.000 dólares no se paga una limpieza de 86 millones. Es un incentivo para que nadie mande algo que después no puede bajar.

**El cliente.** Nuestro cliente es el regulador que hoy multa y cobra tarde. No le cuesta un peso: él pone la regla y el operador deposita. Pasa a usar algo más útil que las multas: las garantías.

**Por qué blockchain.** Por tres cosas. Una: la plata queda asegurada en el contrato. Solo puede ir de vuelta al operador o al regulador, y no existe forma de que nosotros ni nadie más la toque. Dos: los datos son públicos y no se pueden modificar. Cada depósito, cada dato usado y cada pago quedan a la vista, y las reglas no se tocan. Tres: mientras está guardada, esa plata puede seguir generando rendimiento.

**Cómo cobramos.** La plata depositada se pone en un activo de bajo riesgo que rinde. El rendimiento es del operador, y nosotros nos quedamos con una comisión sobre lo que genera. No le facturamos a nadie.

**Lo que falta, dicho por nosotros.** El rendimiento es el paso siguiente: el contrato de hoy todavía no lo genera. Y el dato lo firma una sola clave nuestra; lo que sigue es que lo firmen varios.

**El cierre.** No pedimos una regla nueva. Hacemos que la que ya existe se cumpla. Eso es OrbitClear. El contrato ya está desplegado en Avalanche, con un satélite real registrado, y lo pueden ver ustedes mismos.

**El orden en una línea:** golpe → la regla → la multa falla tres veces → mientras tanto → qué hacemos → qué no es → cliente → blockchain → cómo cobramos → lo que falta → cierre.

## 3. Defensa

### Cliente, plata y modelo de negocio

| Si preguntan | Respuesta |
|---|---|
| ¿Quién es el cliente? | El regulador que da la licencia. Es quien decide usar OrbitClear y lo pone como condición. El usuario es el operador, que deposita. |
| ¿Quién paga? ¿El gobierno? | No. El gobierno no pone plata, solo pone la regla. Paga el operador: deposita la garantía y la recupera si cumple. Solo la pierde el que no cumple. |
| ¿Por qué lo adoptaría un regulador? | Porque hoy solo puede multar después, cuando el satélite ya está muerto o la empresa quebró. Con la garantía la plata ya está puesta antes de lanzar. No le cuesta nada, y lo que pierden los que no cumplen va a su billetera. |
| ¿Cómo cobran ustedes? | Con una comisión sobre el rendimiento que genere la plata depositada. El rendimiento es del operador y nosotros nos quedamos con una parte. No le facturamos ni al regulador ni al operador. |
| ¿Cuánto es eso? | Supuesto nuestro, no un modelo cerrado: si el 20% de los lanzamientos depositara USD 200.000 por satélite serían unos USD 180 millones por año en garantías. Con un rendimiento de 4% anual y una comisión del 10% sobre lo generado, unos USD 720.000 por año. Crece porque los depósitos se acumulan. |
| ¿El contrato ya genera rendimiento? | No. Hoy guarda USDC sin rendimiento. Es el paso siguiente, iría solo a activos de bajo riesgo y tiene límites regulatorios que no terminamos de investigar. |
| ¿Y si el rendimiento es bajo o negativo? | Por eso solo activos de bajo riesgo, con el capital intacto. Si no rinde, nosotros no cobramos: la garantía del operador no se toca. No está construido. |
| ¿Qué hace el regulador con la plata de los que no cumplen? | Lo decide el regulador. El contrato la envía a su billetera y no controla en qué se gasta. |
| ¿USD 200.000 pagan una limpieza? | No, y no es la idea. La garantía es un incentivo para que el operador baje su satélite. Reemplaza a la multa, no al costo de remover. |
| Si remover cuesta mucho más que la garantía, ¿por qué cumpliría el operador? | Son dos costos distintos. Los EUR 86 millones son lo que cuesta que un tercero vaya a buscar un satélite muerto. Al operador, bajarlo él mismo mientras funciona le cuesta reservar combustible y terminar la misión a tiempo. La garantía tiene que superar ese costo. No tenemos una cifra verificada de cuánto cuesta desorbitar. |
| ¿Los operadores chicos pueden pagarlo? | El monto lo fija el regulador y en órbita baja es el mínimo. Además el depósito rinde mientras está guardado, así que no es plata muerta. La garantía también la podría poner una aseguradora a cambio de una cuota; lo evaluamos y no está construido. |

### "La regla ya existe"

| Si preguntan | Respuesta |
|---|---|
| ¿Hoy algún regulador exige esta garantía? | No. Hoy se exige retirar el satélite, y el castigo es la multa. Lo que proponemos es cambiar el castigo, no la obligación. |
| Entonces sí piden una regla nueva. | La obligación es la misma: retirar el satélite. Lo que cambia es cómo se hace cumplir. El regulador tiene que decidir pasar de multa a garantía, y esa decisión no la resolvemos nosotros. |
| ¿Alguien más lo propone? | La FCC lo consultó en 2020 y no lo adoptó. Un estudio en Nature Communications (2026) propone USD 200.000 por satélite. No es idea nuestra: nosotros la construimos. |
| ¿Cinco años desde cuándo? | La regla de la FCC cuenta cinco años desde que termina la misión. Nuestro contrato hoy cuenta el plazo desde el lanzamiento, según la altura de la órbita. Es una diferencia a corregir si un regulador lo adopta con esa regla. |
| ¿Y si el satélite falla sin culpa del operador? | Pierde la garantía igual. Los satélites que mueren sin poder maniobrar son justamente los que quedan como basura. |
| ¿Y si le rinde más seguir operando que recuperar la garantía? | Puede pasar con satélites que facturan mucho. Por eso el monto lo fija el regulador y sube con la altura. |

### Blockchain y confianza

| Si preguntan | Respuesta |
|---|---|
| ¿Por qué confiar en ustedes con la plata? | No hace falta, se comprueba en el contrato. La plata solo puede ir al operador o a la billetera del regulador: no hay función para que nosotros la retiremos. No hay administrador: montos, plazos y billetera de destino quedaron fijos al desplegar. Cerrar un caso vencido lo puede hacer cualquiera. Todo depósito, dato y pago es público. |
| ¿Por qué no un banco o una base de datos? | Dentro de un solo país, un banco alcanza. El contrato aporta cuando el regulador es de un país y los operadores de otros: ninguna parte tiene la plata, nadie tiene que cobrarle a una empresa extranjera en otro tribunal, y cualquiera audita sin pedirle acceso a nadie. |
| ¿Quién carga el dato de reingreso? | Hoy, una sola clave nuestra, y publica la huella del dato para que cualquiera lo recalcule. Si esa clave fallara o mintiera, la plata iría al operador o al regulador cuando no correspondía, nunca a nosotros. El paso siguiente es una firma de dos de tres. |
| ¿Y si el dato miente? | El reingreso es poco ambiguo: el objeto deja de estar en el catálogo. El límite real es que todo el seguimiento público viene de la red de Estados Unidos. |
| ¿La blockchain permite regular a empresas de otro país? | No. Eso lo da la licencia: un Estado ya puede ponerle condiciones a quien quiere operar en su mercado. El contrato aporta la ejecución: la garantía ya está depositada. |
| ¿Qué pasa si congelan los USDC? | Es un riesgo del emisor que hoy no cubrimos. El regulador elige el activo al desplegar. |
| ¿Todos los países usan el mismo contrato? | No. Cada regulador despliega el suyo, con sus montos y su billetera. Lo compartido es la red y el código. |

### Qué está construido

| Si preguntan | Respuesta |
|---|---|
| ¿Qué funciona hoy? | El contrato `OrbitClearEscrow` desplegado en Fuji, la red de pruebas de Avalanche (`0xA5aeCF58Fac272e9E4CC5D473A2767C56019CbB2`), con Envisat registrado, y la consola web que lo lee. |
| ¿Qué no está construido? | El rendimiento, la comisión, la firma de varios para el dato y el período de gracia al cerrar casos vencidos. |
| ¿Esto ya causó algún daño real? | Sí: Resurs-P1 en 2024, Shenzhou-20 en 2025 y el choque Cosmos-Iridium en 2009. |

## 4. Lo que no hay que decir

- **"La garantía paga la limpieza" o "va a un fondo de remoción".** Va a la billetera del regulador y es un incentivo.
- **"El gobierno paga" o "el regulador nos paga".** No pone plata.
- **"El escrow genera rendimiento."** Todavía no. Decir "puede generar" o "es el paso siguiente".
- **"El regulador exige la garantía."** Hoy se exige retirar el satélite, no la garantía.
- **"La única multa."** Decir "la primera": no verificamos si hubo otra después de 2023.
- **"La limpieza costó 86 millones."** Decir "se contrató en": la misión no voló.
- **"Los astronautas se refugiaron por un choque de satélites."** El Resurs-P1 se partió solo y la causa no se confirmó.
- **"Caminatas espaciales postergadas."** No tenemos la fuente.
- **"Diez años después."** Decir "años después": el diez no sale de ninguna fuente nuestra.
- **"El Estado se ahorra los 86 millones."** Ningún Estado está obligado a limpiar.

## 5. Puntos débiles, dichos por nosotros

1. **El regulador tiene que decidir cambiar la multa por la garantía.** La FCC lo consultó en 2020 y no lo adoptó.
2. **No validamos con nadie.** Ningún regulador ni operador nos confirmó interés.
3. **Nuestro ingreso depende de algo que no está construido.** El rendimiento es roadmap y los porcentajes son un supuesto.
4. **El dato lo firma una sola clave nuestra** y viene de una sola fuente.
5. **Solo cubre órbita baja.** En la geoestacionaria los satélites no reingresan.
6. **El volumen está concentrado.** Starlink fue cerca de tres cuartos de lo lanzado en 2025 y ya desorbita; el impacto está en el resto.

## 6. Datos del guion y sus fuentes

| Dato | Fuente |
|---|---|
| Retiro en cinco años desde el fin de la misión (FCC) | [Access Partnership](https://accesspartnership.com/access-alert-us-fcc-to-set-five-year-deadline-for-deorbiting-leo-satellites) |
| Primera multa: USD 150.000 a DISH (FCC, 2023) | [Space.com](https://www.space.com/space-debris-fcc-first-fine-dish-deorbit-satellite) |
| Contrato de EUR 86 millones entre la ESA y ClearSpace | [SpaceNews](https://spacenews.com/clearspace-contract-signed/) |
| Astronautas refugiados (Resurs-P1, junio de 2024) | [Al Jazeera](https://www.aljazeera.com/news/2024/6/28/iss-astronauts-take-cover-as-defunct-russian-satellite-shatters) |
| 43.000 satélites entre 2025 y 2034 | [Novaspace](https://payloadspace.com/novaspace-predicts-43000-new-sats-to-launch-by-2034/) |
| USD 200.000 por satélite | [Nature Communications 2026](https://doi.org/10.1038/s41467-026-77660-4) |
| Consulta de la FCC sobre la garantía | [FCC 20-54](https://www.govinfo.gov/content/pkg/FR-2020-08-25/html/2020-13185.htm) |
| Contrato en Fuji | [Explorer](https://explorer-test.avax.network/c-chain/address/0xA5aeCF58Fac272e9E4CC5D473A2767C56019CbB2) |

Los USD 180 millones, el 4% de rendimiento y el 10% de comisión son cálculo y supuesto nuestro.

# OrbitClear: guion del pitch

Texto para decir en voz alta, slide por slide. Las slides están en el deck: https://claude.ai/artifact/EqTUVaim62rmyF22Zsav5i (privado hasta que se comparta desde el menú Share).
Las respuestas largas a las preguntas del jurado están en `docs/defensa.md`.

## Supuestos: lo que el pitch da por terminado y hoy no está en el contrato desplegado

El guion se escribió suponiendo el MVP terminado. Si alguno de estos puntos no llega, hay que cambiar la slide indicada.

- **Caso real de devolución en Fuji** (slide 7). Hoy solo hay dos decomisos cargados.
- **Ventana de gracia en el cierre por vencimiento** (slides 6 y 12). Hoy `closeExpired` se puede llamar apenas pasa el plazo.
- **Depósito antes de lanzar** (slides 1 y 5). Hoy `register` necesita el número NORAD, o sea, el satélite ya en órbita.

## 1. Portada

Hoy, dejar un satélite muerto en órbita no le cuesta nada a quien lo puso ahí. Nosotros construimos OrbitClear: una garantía que el operador deposita antes de lanzar y que solo recupera si retira el satélite a tiempo. En tres minutos les mostramos el problema, lo que construimos y lo que todavía no resuelve.

## 2. El caso: Resurs-P1

Junio de 2024. El Resurs-P1, un satélite ruso de observación, llevaba años muerto en órbita. Lo habían dado de baja y lo dejaron ahí. Un día se partió en más de cien fragmentos, y la tripulación de la estación espacial tuvo que refugiarse cerca de una hora en sus naves. La causa nunca se confirmó. Lo que sí sabemos es que nadie lo bajó cuando todavía se podía. Y no es el único: en noviembre de 2025 un resto de menos de un milímetro fisuró una ventana de la nave china Shenzhou-20 y los astronautas volvieron nueve días tarde, en otra nave.

Ojo: no decir que fue un choque entre satélites ni que hubo pérdidas de plata.

Fuentes:
- Resurs-P1: <https://www.aljazeera.com/news/2024/6/28/iss-astronauts-take-cover-as-defunct-russian-satellite-shatters>
- Shenzhou-20: <https://www.pbs.org/newshour/science/chinese-astronauts-return-from-space-station-after-delay-blamed-on-space-debris-damage>

## 3. El problema en números

El año pasado se lanzaron más de 4.500 satélites, récord histórico. Cuando se les termina la vida útil deberían bajar de la órbita. Pero en las órbitas donde no caen solos, solo el 40% lo hizo entre 2010 y 2024. El resto queda arriba. Y se esperan 43.000 satélites nuevos de acá a 2034.

Si preguntan por Starlink: fue cerca de tres cuartos de lo lanzado en 2025 y ya desorbita. El problema está en el resto.

Fuentes:
- Lanzamientos de 2025 (conteo de J. McDowell): <https://e360.yale.edu/digest/2025-satellite-launches>
- 40% de cumplimiento: Nature Communications 2026, <https://doi.org/10.1038/s41467-026-77660-4>
- 43.000 a 2034 (Novaspace): <https://payloadspace.com/novaspace-predicts-43000-new-sats-to-launch-by-2034/>
- Starlink, 73% (KeepTrack): <https://keeptrack.space/live-count/how-many-satellites-are-launched-per-year>

## 4. Por qué pasa

¿Por qué pasa? Porque dejar la basura sale gratis. La primera multa por basura espacial fue en 2023: la FCC de Estados Unidos multó a DISH con 150.000 dólares. Del otro lado, el contrato de la ESA para remover un solo objeto fue de 86 millones de euros. Unas 700 veces más. Y la multa llega tarde: cuando el satélite ya está muerto o la empresa ya no existe.

Ojo: decir "la primera multa", no "la única". Decir "el contrato fue de", no "costó": la ESA cambió después el objetivo de esa misión. DISH fue en órbita geoestacionaria; lo usamos para mostrar cuánto vale hoy la sanción, no como caso que cubrimos.

Si preguntan por qué cumpliría alguien si remover cuesta mucho más que la garantía: son dos costos distintos. Los 86 millones son lo que cuesta que un tercero vaya a buscar un satélite muerto. Al operador, bajarlo él mismo mientras funciona le cuesta reservar combustible y terminar la misión a tiempo. La garantía tiene que ser mayor que ese costo, no que el de la remoción. No dar una cifra propia de cuánto cuesta desorbitar: no la tenemos verificada.

Fuentes:
- Multa de la FCC a DISH: <https://www.space.com/space-debris-fcc-first-fine-dish-deorbit-satellite>
- Contrato ESA y ClearSpace: <https://spacenews.com/clearspace-contract-signed/>
- Cambio de objetivo de la misión en 2024: <https://www.satellitetoday.com/sustainability/2024/04/24/clearspace-1-mission-changes-objective-in-response-to-space-debris-collision>

## 5. La idea

La idea es simple: cobrar antes en vez de multar después. El operador deposita una garantía antes de lanzar, como condición de su licencia. Si baja el satélite a tiempo, la recupera. Si no, la pierde y va a un fondo de remoción. No es idea nuestra: la FCC la consultó en 2020 y un paper de Nature Communications la propone este año, con unos 200.000 dólares por satélite. Según ese mismo paper, un país puede aplicarla solo, y con el bono se lanzan más satélites, no menos. Lo que nadie había hecho es construirla.

Ojo: no decir "el regulador lo exige". Hoy se exige desorbitar, no la garantía. La frase es: la obligación ya existe, nosotros construimos el mecanismo para hacerla cumplir. Y el fondo recibe lo decomisado; el contrato no le paga a un removedor.

Fuentes:
- Consulta de la FCC sobre la garantía (FCC 20-54): <https://www.govinfo.gov/content/pkg/FR-2020-08-25/html/2020-13185.htm>
- Bonos de desorbitado, Nature Communications 2026: <https://doi.org/10.1038/s41467-026-77660-4>

## 6. Qué construimos

OrbitClear es un contrato en Avalanche que custodia esa garantía en USDC. El monto depende de la altura: de 100.000 a 800.000 dólares, el rango que modelan los estudios, y cuanto más alta la órbita, más plazo. Un relayer lee el catálogo público de CelesTrak y, en cada decisión, deja el hash del registro para que cualquiera lo recalcule. Las reglas quedan fijas al desplegar: no hay un dueño que pueda cambiar montos, plazos ni adónde va la plata. Y si el plazo vence, cualquiera puede cerrar el caso, después de una ventana de gracia que le da tiempo al dato a llegar.

Si preguntan quién fija los montos: el regulador. Los de la demo son ilustrativos.

## 7. Demo

Esto no es una maqueta. El contrato está desplegado en Fuji, la red de pruebas de Avalanche, y la consola lee de ahí. Les mostramos los tres caminos con objetos reales del catálogo. Uno que reingresó dentro de su plazo: el operador recupera la garantía. Envisat, un satélite de la ESA muerto a unos 760 kilómetros: plazo vencido, la garantía pasa al fondo. Y un objeto que cayó después del plazo: también pasa al fondo. Cada uno es una transacción que cualquiera puede abrir en el explorer.

[Mostrar en vivo: la consola, y la transacción de Envisat en el explorer.]

Aclarar si preguntan: son objetos reales cargados para mostrar los tres caminos; ningún operador depositó de verdad. Los montos están en USDC de prueba.

Fuentes:
- Contrato en Fuji: <https://explorer-test.avax.network/c-chain/address/0xeE7C5D5C0D7103C220d640EEb7B2788ab27CEf59>
- Datos de los satélites: catálogo SATCAT de CelesTrak, <https://celestrak.org/satcat/>

## 8. Por qué blockchain

¿Por qué blockchain? Porque acá no hay una autoridad común. El operador puede ser de un país, la licencia de otro, y el daño es de todos. Cada Estado ya puede exigirle condiciones a quien licencia, lance donde lance: eso sale de la licencia, no de la tecnología. Lo que no tiene es cómo cobrarle a una empresa extranjera. Con la garantía depositada en el contrato, no hace falta cobrar: ya está. Con el contrato, la garantía no la tiene ninguna de las partes, las reglas quedan fijas al depositar, y cualquiera puede verificar el dato y el pago sin pedirle acceso a un banco extranjero. Y lo decimos nosotros: si todo pasa dentro de un solo país, un fideicomiso en un banco alcanza. Donde esto aporta es cuando las partes son de jurisdicciones distintas y ninguna quiere litigar en la del otro.

Si preguntan si todos los países usan el mismo contrato: no. Cada regulador despliega el suyo, con sus montos y su fondo. Lo compartido es la red y el código.

Fuentes:
- La regla de 5 años de la FCC alcanza a satélites con licencia de otro país: <https://accesspartnership.com/access-alert-us-fcc-to-set-five-year-deadline-for-deorbiting-leo-satellites>
Responsabilidad del Estado por sus privados: Tratado del Espacio de 1967, artículo VI.

## 9. Para quién

¿Para quién es? Quien lo adopta es el regulador que da la licencia: fija la regla, los montos y el fondo, y se ahorra montar la custodia. Quien deposita es el operador o su aseguradora. Sirve sobre todo a países sin estructura propia: Argentina no tiene una ley espacial integral y hay un proyecto en Diputados. En números: si el 20% de los lanzamientos depositara 200.000 dólares por satélite, serían unos 180 millones de dólares por año en garantías. Con una comisión de 0,5%, unos 900.000 por año. Eso es un supuesto nuestro, no un modelo cerrado.

Si preguntan quién pierde plata hoy: no hay una sola víctima con una factura grande, y por eso nadie lo arregla solo. El costo está repartido en tres lugares. Los operadores que sí cumplen: la OCDE estima que protegerse de la basura cuesta entre 5 y 10% de una misión geoestacionaria, y más en órbita baja; Starlink informó a la FCC unas 300.000 maniobras para esquivar objetos en 2025. Las aseguradoras: varias dejaron de cubrir órbita baja o excluyen el choque con basura. Y el contribuyente, cuando un gobierno decide limpiar: la ESA con 86 millones de euros, el Reino Unido con 75,6 millones de libras para retirar dos satélites.

Ojo: no decir "el Estado se ahorra 86 millones". Ningún Estado está obligado a limpiar; cuando lo hace es por decisión propia.

Si preguntan si un operador lo usaría antes de que sea obligatorio: no lo afirmamos. Depende de que un regulador lo exija. El uso voluntario es una hipótesis sin validar.

Fuentes:
- Costo de protegerse de la basura (OCDE, citado por la ESA): <https://www.esa.int/Space_Safety/Space_Debris/The_cost_of_space_debris>
- Maniobras de Starlink en 2025: <https://www.newscientist.com/article/2512470-spacexs-starlink-dodged-300000-satellite-collisions-in-2025>
- Aseguradoras que se retiran de órbita baja: <https://www.insurancejournal.com/news/national/2021/09/01/629684.htm>
- Misión de remoción del Reino Unido: <https://www.gov.uk/government/news/uk-builds-leadership-in-space-debris-removal-and-in-orbit-manufacturing-with-national-mission-and-funding-boost>
- Contrato ESA y ClearSpace: <https://spacenews.com/clearspace-contract-signed/>
- USD 200.000 por satélite: Nature Communications 2026, <https://doi.org/10.1038/s41467-026-77660-4>
Los USD 180 millones y la comisión son cálculo nuestro.

## 10. Los límites, dichos por nosotros

Preferimos decirles nosotros lo que esto todavía no resuelve. Uno: depende de una decisión política. Hoy ningún regulador exige la garantía; la FCC la consultó en 2020 y no la adoptó. Dos: no lo validamos con el mercado. Ningún regulador, operador ni aseguradora nos confirmó interés. Tres: la garantía es efectivo inmovilizado sin rendimiento; para plazos de hasta 25 años tiene que estar en un activo que rinda, y eso es el paso siguiente. Cuatro: el dato lo firma hoy una sola clave nuestra y viene de una sola fuente, la red de seguimiento de Estados Unidos; el paso siguiente es una firma de dos de tres entre el regulador, un proveedor independiente de datos y un auditor. Y cubrimos órbita baja, que es donde los satélites reingresan.

No resolvemos la decisión política. Lo que sacamos del medio es el obstáculo práctico: tener que montar la custodia.

Fuentes:
- Consulta de la FCC sobre la garantía (FCC 20-54): <https://www.govinfo.gov/content/pkg/FR-2020-08-25/html/2020-13185.htm>
El resto son límites del propio proyecto: ver docs/defensa.md, sección 6.

## 11. Cierre

Hoy ningún país exige esta garantía, y no sabemos cuándo va a pasar. Pero lo que la empuja ya está: más satélites, bajo cumplimiento y reguladores endureciendo las reglas. Europa tiene su ley espacial en trámite en el Parlamento, y el Reino Unido ata la responsabilidad a la sostenibilidad desde el 1 de diciembre. Cuando un país decida exigir la garantía, va a necesitar dónde custodiarla. Eso ya está construido. Gracias.

Ojo: no decir que el EU Space Act se aprobó ni dar fecha de voto.

Fuentes:
- EU Space Act: <https://defence-industry-space.ec.europa.eu/eu-space-act_en>
- Reino Unido, paquete de herramientas financieras: <https://www.gov.uk/government/consultations/consultation-on-orbital-liabilities-insurance-charging-and-space-sustainability/outcome/space-regulatory-financial-tools-package-including-government-response-to-the-liability-insurance-charging-and-space-sustainability-consultation>

## 12. Respaldo: las preguntas difíciles

Slide de respaldo: no se presenta, se muestra si el jurado pregunta. Otras respuestas cortas:

¿Y si al operador le rinde más seguir operando que recuperar la garantía? Puede pasar con satélites que facturan mucho. Por eso el monto lo fija el regulador según la misión y sube con la altura.
¿Y un satélite que ya murió o no tiene propulsión? Ninguna garantía lo baja. El incentivo actúa antes: al diseñarlo y al decidir cuándo terminar la misión.
¿Tienen socios? No. ClearSpace, Astroscale y Starfish Space trabajan en remoción y serían posibles destinatarios del fondo.
¿Es legal remover un satélite ajeno? El control lo conserva el Estado de registro; por eso el consentimiento tiene que estar en la licencia.
¿Por qué no un banco? Dentro de un solo país alcanza. El contrato aporta cuando las partes son de jurisdicciones distintas.
¿Todos los países usan el mismo contrato? No. Cada regulador despliega el suyo, con sus montos y su fondo.
¿Qué pasa si congelan los USDC? Es un riesgo del emisor que hoy no cubrimos; el regulador elige el activo al desplegar.
¿Y si el operador vende el satélite o quiebra? Hoy la devolución va a la dirección que depositó. Cambiar el beneficiario no está construido.
¿Se premia igual un reingreso descontrolado? Sí: el catálogo dice que cayó, no cómo. Es un límite del dato público.
¿El 40% o el 65%? El 40% es de Nature Communications 2026, de 2010 a 2024. El 65% es de un estudio de 2025 con otra población.

Fuentes:
- 40%: Nature Communications 2026, <https://doi.org/10.1038/s41467-026-77660-4>
- 65%: estudio ESA y UCL 2025, <https://conference.sdo.esoc.esa.int/proceedings/sdc9/paper/237/SDC9-paper237.pdf>
Fallas del contrato y preguntas sin preparar: debate de práctica, cerebro/notas/2026-11-12-0137-mauricio-debate-jurado-defensa.md
Respuestas largas con sus fuentes: docs/defensa.md

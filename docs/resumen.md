# OrbitClear en una página

Resumen para explicar y defender el proyecto en voz alta. Las cifras y sus fuentes están en `docs/defensa.md` y en las notas de `cerebro/`.

## Qué es

OrbitClear es una garantía de desorbitado. El operador de un satélite deposita plata en un contrato en Avalanche y solo la recupera si retira el satélite a tiempo, verificado con datos públicos. Si no cumple, la garantía pasa al fondo que designó el regulador que le dio la licencia.

## El daño que ya causa la basura

No es un riesgo teórico:

- **2009:** el Cosmos 2251, un satélite ruso muerto, chocó con el Iridium 33, que estaba activo. Dejó cerca de 2.200 fragmentos catalogados.
- **2021 y 2022:** la NASA postergó dos caminatas espaciales por restos que se acercaban a la estación. En 2022 la estación tuvo que encender motores para esquivar uno.
- **2024:** el Resurs-P1, un satélite ruso dado de baja y dejado en órbita, se partió en más de 100 fragmentos. La tripulación de la estación se refugió cerca de una hora en sus naves.
- **2025:** un resto de menos de un milímetro fisuró una ventana de la nave china Shenzhou-20. Los astronautas volvieron nueve días tarde y en otra nave.

Además hay un costo diario que nadie ve. Starlink informó unas 300.000 maniobras de esquive en 2025. La OCDE estima que protegerse de la basura cuesta entre 5 y 10% de una misión geoestacionaria. Varias aseguradoras dejaron de cubrir la órbita baja.

## Por qué va a empeorar

En 2025 se lanzaron más de 4.500 satélites, récord histórico, y se esperan 43.000 más hasta 2034. La ESA proyecta que la basura sigue creciendo aunque no se lance nada más, porque los objetos que ya están chocan entre sí.

## Por qué hace falta regular

Porque solo no se arregla:

- **El costo está repartido.** Lo pagan los operadores que sí cumplen, las aseguradoras y los contribuyentes. No hay una sola víctima con una factura grande, así que nadie lo resuelve por su cuenta.
- **Lo voluntario no alcanza.** Solo el 40% de los satélites se retiró entre 2010 y 2024 en las órbitas donde no caen solos.
- **La sanción llega tarde.** La primera multa por basura fue de USD 150.000, en 2023. El contrato de la ESA para remover un solo objeto fue de EUR 86 millones. Y la multa llega cuando el satélite ya está muerto o la empresa ya no existe.

## La idea

Cobrar antes en vez de multar después. No es nuestra: la FCC la consultó en 2020 y un paper de Nature Communications la propone en 2026. Nadie la había construido.

## Cómo funciona

El monto lo fija el regulador y sube con la altura de la órbita, porque más arriba el satélite tarda más en caer solo. Un relayer lee el catálogo público de CelesTrak. Si el satélite reingresó dentro del plazo, el contrato devuelve la garantía. Si el plazo vence, pasa al fondo.

## Por qué blockchain

El espacio no tiene una autoridad común y los satélites cruzan países: el operador es de uno, la licencia de otro y el daño es de todos. Cada país ya puede exigir condiciones a quien licencia. Lo que no tiene es dónde guardar la garantía de modo que el operador extranjero confíe, ni cómo cobrarle afuera. Con el contrato, la garantía no la tiene ninguna de las partes, las reglas no cambian después de depositar y cualquiera puede verificar el dato y el pago.

## Lo que no resolvemos

- Hoy ningún país exige esta garantía. Depende de una decisión política.
- No lo validamos con reguladores ni operadores.
- Dentro de un solo país, un fideicomiso bancario alcanza. El contrato aporta cuando hay jurisdicciones distintas.

## El cierre

La obligación de desorbitar ya existe. Lo que falta es cómo hacerla cumplir. Cuando un país decida exigir la garantía, va a necesitar dónde custodiarla, y eso ya está construido.

## Cuidados al decirlo

- **Los casos de daño muestran que el problema es real, no que OrbitClear los habría evitado.** El Resurs-P1 se partió solo y la causa no se confirmó. El resto de la Shenzhou-20 no se puede atribuir a un satélite abandonado. El que mejor encaja es Cosmos 2251: un satélite muerto que nadie bajó.
- **"La garantía pasa al fondo", no "paga la remoción".** El contrato no controla en qué se gasta.
- **"La primera multa", no "la única".**
- **"El contrato fue de EUR 86 millones", no "costó".** La ESA cambió después el objetivo de esa misión.
- **"Postergó una caminata", no "canceló una misión".**
- **"Lo proyectamos", no "el regulador lo exige".**

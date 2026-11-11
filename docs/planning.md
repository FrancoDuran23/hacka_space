# OrbitClear: garantía de desorbitado verificada con datos públicos

Documento de investigación del equipo. Hackathon Argentina Space 2026, track Blockchain (Avalanche).
Última actualización: 11 de noviembre de 2026.

## 1. Resumen

OrbitClear es un sistema de garantías para que los satélites no queden como basura en órbita.

1. Al lanzar un satélite, el operador deposita una garantía en un contrato sobre Avalanche y declara en qué plazo lo va a retirar.
2. El monto depende de la altura de la órbita: más arriba, el satélite tarda más en caer solo y la zona suele estar más cargada.
3. Un relayer sigue al satélite con datos orbitales públicos.
4. Si el satélite reingresa a la atmósfera dentro del plazo, el contrato devuelve la garantía.
5. Si el plazo vence y sigue en órbita, la garantía pasa a un fondo para pagar su remoción.

La garantía de desorbitado ya fue propuesta por reguladores e investigadores, pero no encontramos ningún sistema que la implemente. Nuestro aporte es un prototipo que la hace funcionar con reglas públicas y datos reales.

**Planteo:** nos adelantamos a una regulación que todavía no rige, pero que varias fuentes independientes ya piden (sección 4).

## 2. El problema

- **La basura crece aunque no se lance nada más.** El informe ambiental 2026 de la ESA proyecta que los choques entre objetos que ya están en órbita siguen sumando fragmentos. [Nota sobre el informe](https://environmentenergyleader.com/stories/space-debris-would-keep-growing-without-new-launches,140046)
- **Cantidad de objetos.** Hay más de 40.000 objetos catalogados, y la ESA estima más de 57.000 fragmentos mayores a 10 cm. La primera cifra es lo que se sigue de forma individual; la segunda es una estimación. [FOD News](https://fodnews.com/esa-space-environment-report-2026-leo-debris-collision-risk/), [Space.com](https://space.com/space-exploration/satellites/could-satellite-deorbit-deposits-prevent-a-space-debris-disaster)
- **Muchos satélites no se retiran.** Cerca del 60% queda donde está cuando se le acaba el combustible, porque no hay consecuencia por no desorbitar (misma nota de Space.com).
- **Cumplimiento desigual.** En órbitas donde el satélite no cae solo, el cumplimiento ronda el 65%. [Paper ESA/UCL 2025](https://conference.sdo.esoc.esa.int/proceedings/sdc9/paper/237/SDC9-paper237.pdf). Entre satélites de más de una tonelada, el informe ESA 2025 da 52%. [Resumen de Amplyfi](https://amplyfi.com/blog/esas-2025-report-and-what-it-means-for-your-business/)
- **Con 90% no alcanza.** Según la ESA, el retiro exitoso tiene que acercarse al 100% para estabilizar el entorno (nota sobre el informe 2026).

## 3. Qué existe hoy y qué falta

| Mecanismo | Estado | Límite |
|---|---|---|
| Regla de retiro en 5 años (FCC, EE. UU.) | Vigente | Solo alcanza a operadores con licencia de EE. UU. |
| Multas | Una sola hasta 2023: USD 150.000 a DISH | Llega cuando la basura ya está en órbita, y el monto es bajo |
| Informes de cumplimiento (ESA) | Anuales | Cifras agregadas, sin seguimiento público por satélite |
| Compromisos voluntarios (Zero Debris Charter) | Más de 200 firmantes de 33 países | No es vinculante y no tiene consecuencia económica |
| Remoción activa contratada por gobiernos | Reino Unido: contrato de unos £61 millones, operación prevista en 2029 | Caso por caso y con fondos públicos |
| **Garantía depositada al lanzar** | **Propuesta, no adoptada** | **No existe ningún sistema funcionando** |

Fuentes: [regla FCC](https://spacenexus.us/blog/fcc-5-year-deorbit-rule-satellite-operators), [multa a DISH](https://www.space.com/space-debris-fcc-first-fine-dish-deorbit-satellite), [Zero Debris Charter](https://blogs.esa.int/spacesafety-community/files/2025/12/Zero_Debris_Welcome_Slides-1.pdf), [contrato del Reino Unido](https://satnews.com/2026/10/15/clearspace-wins-61-million-prime-contract-for-uk-dual-satellite-debris-removal-mission/).

## 4. Quiénes piden la garantía

- **FCC (2020).** Abrió una consulta sobre garantías atadas al retiro exitoso del satélite. No la adoptó; sigue en estudio. [Federal Register, FCC 20-54](https://www.govinfo.gov/content/pkg/FR-2020-08-25/html/2020-13185.htm)
- **Estudio con autores de UCL, Universidad de Colorado, Aerospace Corporation y la ESA (2025).** Modela garantías de USD 100.000 a 800.000 por satélite. Con USD 100.000 los satélites abandonados bajan al menos 10,7%, y con más de USD 300.000 hasta 18,6%. Concluye que la garantía funciona mejor que una tasa por uso de órbita, porque la tasa no crea incentivo para retirar. También sostiene que el precio debería variar según la órbita. [Paper 237, 9ª Conferencia Europea de Basura Espacial](https://conference.sdo.esoc.esa.int/proceedings/sdc9/paper/237/SDC9-paper237.pdf)
- **Nature Communications (septiembre de 2026).** Los mismos investigadores proponen USD 200.000 por satélite, depositados antes del lanzamiento y devueltos con interés. Lo que se pierde va a un fondo común de remoción. Señalan que un país puede aplicarlo solo, sin acuerdo internacional, y que cubrir el 20% de los lanzamientos reduciría los abandonados cerca de 18%. [Space.com](https://space.com/space-exploration/satellites/could-satellite-deorbit-deposits-prevent-a-space-debris-disaster)
- **Z/Yen, Londres.** Propone bonos de seguro para remoción, inspirados en el cierre de minas y plataformas petroleras. [Space Protection Initiative](https://www.zyen.com/research/research/risk-mitigation/space-protection-initiative/)
- **Otros marcos.** Modelo de depósito y reembolso para tasas orbitales ([The Space Review](https://thespacereview.com/article/4902/1)) y análisis de medidas fiscales de la OCDE ([capítulo 7](https://www.oecd.org/en/publications/the-economics-of-space-sustainability_b2257346-en/full-report/component-11.html)).

**Aclaración:** el estudio de 2025 tiene autores de la ESA, pero no es una posición oficial de la agencia.

**Oposición:** en la consulta de la FCC, investigadores de satélites chicos se opusieron por el costo. [Comentarios ante la FCC](https://tlpc.colorado.edu/wp-content/uploads/2020/11/2020.11.09-Academic-SmallSat-Researchers-Reply-Comments-final.pdf)

## 5. Nuestra propuesta

### Flujo

1. **Depósito.** El operador registra el satélite (número de catálogo NORAD), el plazo de retiro y deposita la garantía.
2. **Seguimiento.** El relayer consulta los datos públicos y publica en el contrato el estado del satélite, con el hash del dato usado.
3. **Devolución.** Si el satélite reingresó antes del plazo, el operador retira su garantía.
4. **Pérdida.** Si el plazo venció y sigue en órbita, la garantía pasa al fondo de remoción.

### Monto según la órbita

A 400 km un satélite típico cae solo en 1 a 5 años; a 550 km tarda de 5 a 10 ([SpaceNexus](https://spacenexus.us/blog/fcc-5-year-deorbit-rule-satellite-operators)). La garantía sube con la altura y con la cantidad de objetos en esa franja, que se calcula del mismo catálogo. La fórmula del prototipo es ilustrativa.

### Diferencia con las propuestas académicas

En los estudios, la garantía la guarda el Estado de lanzamiento. En OrbitClear la guarda un contrato con reglas públicas. El regulador define la regla, pero no administra la plata.

## 6. Por qué blockchain

Las cuatro preguntas del track:

1. **¿Quién desconfía de quién?** Los operadores no quieren que un gobierno retenga su garantía sin reglas claras. Los demás operadores y países no confían en que cada Estado controle a sus propias empresas.
2. **¿Qué evento dispara algo on-chain?** El reingreso confirmado libera la garantía. El vencimiento del plazo la transfiere al fondo.
3. **¿Qué pasa si el dato miente?** El reingreso es un dato poco ambiguo: el objeto deja de estar en el catálogo. El contrato guarda el hash del dato usado para que cualquiera lo recalcule. La versión completa usaría varias fuentes con quórum.
4. **¿Quién paga o cobra, y cuánto?** Paga el operador al lanzar. Referencia de los estudios: USD 100.000 a 800.000 por satélite. Cobra el operador que cumple, o el fondo de remoción si no cumple.

Qué aporta la blockchain en concreto:

- Ningún gobierno ni empresa tiene la plata en su poder.
- Las reglas quedan fijadas al depositar.
- El satélite, el lanzamiento y el daño pueden ser de países distintos, y no hay una autoridad común.
- El depósito, el dato y el pago son públicos.

## 7. Datos y verificación

- **Fuente:** CelesTrak, incluida en el catálogo de APIs del track. Elementos orbitales sin clave, por grupo o por número NORAD. [Dashboard del track](https://avalanche-track.vercel.app/dashboard)
- **Reingreso:** el catálogo de satélites indica si un objeto decayó y en qué fecha. *A confirmar el nombre exacto del campo al implementar.*
- **Visualización:** CelesTrak, satellite.js y Cesium para el globo 3D. [Herramientas del track](https://avalanche-track.vercel.app/geoespacial)
- **Historial:** Space-Track, con cuenta gratuita.

Límites de los datos:

- Solo se siguen objetos de unos 10 cm o más.
- La posición tiene error de kilómetros. No afecta la verificación de reingreso.
- Todo el seguimiento público viene de una sola red, la de Estados Unidos.
- CelesTrak bloquea a quien consulta muy seguido. Guardar copias en `sample-data/`.

## 8. Antecedentes

| Proyecto | Qué hace | Diferencia con OrbitClear |
|---|---|---|
| [Moneda digital para remoción (2017)](https://arxiv.org/pdf/1710.05141v1.pdf) | Propone financiar la limpieza con una moneda propia | Es una moneda, no una garantía por satélite |
| [BESTA, de MITRE](https://www.mitre.org/sites/default/files/2021-11/prs-20-2645-blockchain-enabled-space-traffic-awareness-BESTA-discovery-of-anomalous-behavior-supporting-automated-space-traffic-management.pdf) | Blockchain privada que compara observaciones con acuerdos | Registra evidencia, no custodia fondos |
| [SkyTrace](https://631acb25.skytrace.pages.dev/) y [STCM de la ESA](https://conference.sdo.esoc.esa.int/proceedings/sdc9/paper/211/SDC9-paper211.pdf) | Registran la negociación entre operadores en un cruce | Tratan maniobras, no retiro |
| [SkyMapper, en Avalanche](https://www.kucoin.com/news/flash/skymapper-and-avalanche-launch-blockchain-network-to-secure-telescope-data) | Registra observaciones de telescopios | Podría ser una segunda fuente de datos a futuro |

No encontramos una garantía de desorbitado construida sobre una red pública. La búsqueda fue acotada.

## 9. A quién le sirve

- **Reguladores**, que podrían exigir la garantía sin montar una estructura para administrarla.
- **Operadores que cumplen**, que recuperan su depósito sin trámites y lo pueden mostrar.
- **Empresas de remoción**, que tendrían un fondo previsible.

Hipótesis sin validar: ningún regulador ni operador nos confirmó interés.

## 10. Riesgos y límites

1. **Depende de una regla que no existe.** Ningún operador deposita por voluntad propia.
2. **Hay oposición del sector**, sobre todo de operadores chicos.
3. **El obstáculo es político.** El prototipo muestra que administrarla es simple; no resuelve la decisión de exigirla.
4. **Un Estado tendría que aceptar que la plata la custodie un contrato.**
5. **Fallas involuntarias.** Un satélite que se rompe también pierde la garantía. Es parte del incentivo, pero se va a discutir.
6. **El uso del fondo no está definido.** El propio estudio de 2025 no analiza cómo gastar lo recaudado.
7. **Marco legal.** No lo investigamos.

## 11. Alcance del MVP

Entra:

- Contrato en Fuji: depositar, reportar estado, retirar, fondo.
- Relayer que lee CelesTrak y publica el estado con su hash.
- Dos casos reales: un satélite que ya reingresó y uno inactivo que sigue en órbita. *Candidato para el segundo: Envisat, a confirmar datos.*
- Globo 3D con los objetos y el link a cada transacción.

Solo si sobra tiempo: gráfico de objetos por franja de altura y garantía variable.

Queda afuera: recomendaciones de trayectoria, pagos entre operadores por maniobras, recompensas a removedores, varias fuentes de datos.

Entregables del track (viernes 13/11, 09:00 — tercera jornada): contrato desplegado en Fuji **o en una L1 del equipo**, con link al explorer; video de 1 a 3 minutos con una acción on-chain; deck de 5 a 7 slides con una de "por qué blockchain"; y repo o link del proyecto. Las dos redes son válidas. El track lo dice explícito: *"Un MVP que funciona le gana a algo ambicioso que no corre."* [Sitio del track](https://avalanche-track.vercel.app/), verificado el 11/11/2026.

Estado del MVP al 11/11/2026: el escrow está implementado y desplegado en Fuji, en [`0xA5aeCF58Fac272e9E4CC5D473A2767C56019CbB2`](https://explorer-test.avax.network/c-chain/address/0xA5aeCF58Fac272e9E4CC5D473A2767C56019CbB2). Ver `contratos/README.md`.

## 12. Ideas que descartamos

- **Pagos entre operadores por maniobras de evasión.** Hoy nadie paga ni lo pide, y las maniobras chicas no se verifican bien con datos públicos.
- **Registro de declaraciones en cada cruce.** SkyTrace y el STCM de la ESA ya trabajan esa idea.
- **Recomendaciones de trayectoria.** Lo hacen los servicios de vigilancia con mejores datos.

## 13. Pendientes de verificación

- Cifras de los informes de la ESA tomadas de notas de prensa: confirmar en el informe original antes de ponerlas en una slide.

Resueltos el 11/11/2026:

- **Bases del hackathon.** Verificadas en el sitio del track. El contrato puede desplegarse en Fuji o en una L1 propia. Cuatro entregables: contrato con link al explorer, video de 1 a 3 minutos con una acción on-chain, deck de 5 a 7 slides con una de "por qué blockchain", y repo.
- **Catálogo de CelesTrak y datos de Envisat.** El reingreso se lee en `satcat/records.php`: `DECAY_DATE` con fecha y `OPS_STATUS_CODE` en `D`. El objeto además desaparece de `gp.php` con HTTP 404, que significa "posible reingreso" y nunca debe tratarse como error reintentable. Envisat es NORAD 27386, lanzado 2002-03-01, apogeo 762 km, sin `DECAY_DATE`.

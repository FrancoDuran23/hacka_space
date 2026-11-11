---
titulo: Bono de deorbitado en escrow — quién multa hoy, cómo funcionaría el flujo y qué le va a preguntar el jurado
autor: franco
fecha: 2026-11-11 13:00
tema: orbitclear
tags: [bono-deorbitado, regulacion, escrow, oraculo, demo, jurado, argentina]
tipo: resumen
fuentes:
  - Chat de investigación con un asistente de IA, pegado por Franco. Las citas venían con nombre de medio pero sin link.
  - Federal Register, consulta FCC 20-54 (2020) — https://www.govinfo.gov/content/pkg/FR-2020-08-25/html/2020-13185.htm
  - Multa de la FCC a DISH — https://www.space.com/space-debris-fcc-first-fine-dish-deorbit-satellite
  - ESA SDC9, paper 237 sobre bonos PMD — https://conference.sdo.esoc.esa.int/proceedings/sdc9/paper/237/SDC9-paper237.pdf
  - Nature Communications 2026, bonos PMD (vía nota de Space.com) — https://space.com/space-exploration/satellites/could-satellite-deorbit-deposits-prevent-a-space-debris-disaster
  - Sin link (citadas por nombre en el chat): Brussels Times (primera multa), Broadband Breakfast (DISH), Regulus Charter (análisis de la multa), Courthouse News (EU Space Act), E+H (compromiso del Consejo sobre el EU Space Act)
relacionadas: [docs/planning.md, 2026-11-11-1142-samuel-satelites-sin-maniobra]
---

## Qué es

Investigación sobre **quién sanciona hoy la basura espacial** y una propuesta de cómo funcionaría el **bono de deorbitado en escrow** como función central de OrbitClear. Recomendación del chat: el bono va primero y el mercado de maniobras queda para la fase 2.

`docs/planning.md` ya cubre la mayor parte de la base: el giro al bono, la regla de 5 años de la FCC, la multa a DISH, los papers de ESA/UCL y Nature y las 4 preguntas de blockchain. Esta nota agrega **lo que ese documento no tiene**: el marco legal, un flujo más detallado, las funciones del contrato, las respuestas para el jurado y una demo con tres casos. Al final están las diferencias entre los dos que hay que decidir.

## 1. ¿Quién pone las multas hoy?

**No hay árbitro internacional.**
- Ningún tratado obliga a los países a retirar satélites muertos ni basura.
- El IADC (comité de agencias espaciales) solo emite recomendaciones, sin poder de sanción.

**Cada país controla a quien licencia.**
- El Tratado del Espacio de 1967 hace responsable al Estado por sus objetos. Por eso la sanción llega por la licencia nacional.
- Primer caso: en 2023 la FCC multó a DISH Network con USD 150.000 y la obligó a seguir un plan de cumplimiento, por no deorbitar bien el EchoStar-7. La multa fue chica porque DISH llegó a mover el satélite más o menos la mitad de la distancia exigida.

**Europa se suma.**
- El **EU Space Act** todavía se negocia. Busca volver obligatorio lo que hoy son guías no vinculantes de la ONU y del IADC.
- Incluye un **régimen de prioridad para decidir quién maniobra**, que es relevante para la fase 2 de OrbitClear.

**Si hay choque, se arreglan los Estados entre sí.**
- Lo regula el Convenio de Responsabilidad de 1972.
- Se usó en serio una sola vez: Canadá contra la URSS por el Cosmos 954, en 1978.

**El problema de fondo.** La multa llega tarde, cuando la basura ya está arriba, y es muy baja al lado de lo que cuesta retirar un objeto: **USD 60 a 100 millones**. *Cifra sin fuente identificada: verificar.*

## 2. La alternativa: cobrar antes en vez de multar después

- **Mecánica:** el operador deposita un bono fijo por satélite. Si deorbita a tiempo, lo recupera con intereses. Si no, lo pierde y la plata va a remoción o servicios en órbita.
- **FCC:** abrió una consulta en 2020 sobre bonos atados al retiro exitoso. No hay registro de que la haya convertido en regla.
- **Nature Communications 2026:**
  - Un bono de **USD 200.000 por satélite** reduce **en más de un tercio la masa** de satélites abandonados por año y aumenta el bienestar **hasta un 27%**.
  - Con solo el **20% del mercado** adoptándolo, la sostenibilidad ya mejora.
- **ESA SDC9:** en órbitas donde el satélite no cae solo, el cumplimiento actual ronda el 65%, y hasta bonos chicos lo mejoran bastante.

## 3. Por qué este giro le sirve a OrbitClear

- **No hay problema legal:** el dueño deposita sobre su propio satélite, así que no se toca basura ajena.
- **Verificar es fácil:** no hace falta probar una maniobra con TLEs imprecisos, alcanza con saber si el objeto reentró. SATCAT de CelesTrak publica la fecha de reentrada.
- **El escrow on-chain tiene sentido:** hay plata bloqueada durante años entre partes que no confían entre sí, y nadie, ni el regulador, debe poder desviarla.
- **Vuelve el "bounty de basura", pero legal:** si el operador no cumple, la plata va a un fondo que paga a empresas de remoción como Astroscale o ClearSpace.
- **Ángulo argentino:** Argentina no tiene una ley espacial integral. OrbitClear se puede presentar como infraestructura lista para que la CONAE o un futuro regulador exijan el bono sin armar un fondo estatal.

## 4. El flujo, paso a paso

1. **Registro, antes del lanzamiento.** El operador (por ejemplo, una startup argentina con un cubesat) carga:
   - el número NORAD,
   - la fecha estimada de fin de misión,
   - el plazo para deorbitar (por ejemplo, 5 años después del fin de misión, como pide la FCC).
2. **Depósito.** Bloquea USDC en el contrato, por ejemplo USD 200.000.
   - Puede pagarlo él o **una aseguradora que emite el bono a cambio de una prima**, como un seguro de caución.
   - Mientras está bloqueada, **la plata puede generar rendimiento**, para que el operador no pierda el costo de oportunidad.
3. **Monitoreo diario.** El oráculo en Oracle Cloud consulta CelesTrak y Space-Track. Guarda la evidencia (altitud, último TLE y estado del objeto) en una **Blockchain Table de Oracle**.
4. **Resultado:**
   - **Cumplió.** CelesTrak marca la fecha de reentrada (*decay date*) y el oráculo firma "NORAD X reentró el día Y". El contrato devuelve el depósito más los intereses.
   - **No cumplió.** Vence el plazo con el satélite todavía en órbita. El oráculo firma "plazo vencido" y el depósito pasa al fondo de remoción.
5. **Remoción.** El fondo paga a una empresa para que baje **ese mismo satélite**. Es legal porque el operador aceptó esa condición al firmar el contrato: da el consentimiento por adelantado, que es lo que exige el Tratado del Espacio.

## 5. El contrato, en simple

```
registrarSatelite(noradId, plazo, monto)   → el operador deposita USDC
reportarReentrada(noradId, fecha, firma)   → oráculo; devuelve los fondos al operador
declararIncumplimiento(noradId, firma)     → oráculo, solo si pasó el plazo; fondos al pool
pagarRemocion(noradId, empresa, firma)     → oráculo confirma la remoción; paga a la empresa
```

## 6. Lo que va a preguntar el jurado

| Pregunta | Respuesta |
|---|---|
| ¿Y si el satélite muere antes de tiempo? | El plazo corre igual. Para eso existe el bono: los que mueren sin poder maniobrar son los que dejan basura. |
| ¿Y si reentra sin control y cae algo a tierra? | Queda fuera del MVP. Se puede sumar un tramo del bono para reentrada controlada. |
| ¿Quién controla el oráculo? | En la demo, nosotros. En el roadmap, firma de 2 de 3: proveedor de datos, regulador y auditor. |
| ¿Por qué alguien depositaría si nadie lo obliga? | (1) Consigue una prima de seguro más barata. (2) Gana un sello de "operador responsable" ante clientes como la ESA o gobiernos. (3) Un regulador puede exigirlo, como proponen los papers y podría pedir el EU Space Act. |

## 7. Demo propuesta (3 minutos)

- Tres satélites reales de CelesTrak: **uno que ya reentró, uno activo y uno muerto en órbita**.
- Los tres casos se simulan en Avalanche Fuji **con el tiempo acelerado**.
- El dashboard muestra la órbita de cada uno, el estado del bono y la transacción en Snowtrace.
- Recorre la secuencia completa: depósito, monitoreo y devolución o remoción.

## Diferencias con docs/planning.md (a decidir en equipo)

- **Remoción en el MVP.** `planning.md` deja afuera las "recompensas a removedores". Esta propuesta incluye `pagarRemocion`.
- **Casos de la demo.** `planning.md` usa dos (reingresado e inactivo en órbita, con Envisat como candidato). Esta propuesta usa tres y suma uno activo.
- **Monto.** `planning.md` propone una garantía que varía según la altura de la órbita. Acá es un monto fijo de USD 200.000.
- **Cifras de Nature.** `planning.md` dice "cubrir el 20% reduce los abandonados cerca de 18%". Acá dice "200k baja más de 1/3 la masa abandonada y el bienestar sube hasta 27%". Pueden ser métricas distintas del mismo estudio (cantidad o masa): verificar en el paper antes de ponerlo en una slide.
- **Ideas nuevas** que no están en `planning.md`: aseguradora como emisora del bono, rendimiento del escrow, Blockchain Table de Oracle, oráculo 2 de 3 y la respuesta legal sobre el consentimiento por adelantado.

## Preguntas abiertas

- Fuente del costo de remoción de USD 60 a 100 millones por objeto.
- Links de Brussels Times, Broadband Breakfast, Regulus Charter, Courthouse News y E+H.
- Estado real del EU Space Act y de su régimen de prioridad de maniobra.
- Afirmación de que "Argentina no tiene una ley espacial integral": confirmar el marco vigente y el rol de la CONAE.
- El rendimiento del escrow en USDC dentro de Fuji: ¿se muestra en la demo o queda como roadmap?

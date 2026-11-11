# OrbitClear

Protocolo de garantías de desorbitado sobre Avalanche. Un operador deposita USDC por satélite; recupera el depósito si el satélite reingresa antes del plazo, y lo pierde a favor del fondo de remoción si no.

## Lenguaje

**Depósito de desorbitado**:
El monto en USDC que un operador bloquea por un satélite. Se devuelve al acreditarse el reingreso y se decomisa si el plazo vence con el objeto todavía en órbita.
_Avoid_: garantía, seguro, prima, fianza

**Escrow de satélite**:
El depósito individual de un satélite, aislado dentro del contrato por su número NORAD. Cada satélite tiene el suyo y ningún otro operador puede tocarlo.
_Avoid_: pool, pozo, bóveda, cuenta

**Operador**:
La empresa u organismo responsable del satélite y dueño de su depósito.
_Avoid_: cliente, usuario, dueño

**Plazo de retiro**:
La fecha límite para que el satélite reingrese, calculada como fecha de lanzamiento más los años de su banda orbital. No la elige el operador.
_Avoid_: vencimiento, deadline, fecha de retiro

**Banda orbital**:
Franja de altitud que fija el plazo de retiro y el monto del depósito. Más arriba, el satélite tarda más en caer solo y la zona está más cargada, así que el depósito sube.
_Avoid_: tramo, categoría, tier

**Reingreso verificado**:
El hecho, registrado en SATCAT de CelesTrak, de que un objeto decayó: `DECAY_DATE` con fecha y `OPS_STATUS_CODE` en `D`. Es el único evento que devuelve o decomisa un depósito.
_Avoid_: caída, decaimiento, desorbitado

**Desorbitado**:
La acción deliberada de un operador de sacar su satélite de órbita. Es una intención, no un evento verificable.
_Avoid_: usarlo como sinónimo de reingreso

**Relayer**:
La única dirección autorizada a registrar satélites y a acreditar reingresos, adjuntando el hash del registro crudo de CelesTrak.
_Avoid_: oráculo, publicador, reporter

**Hash del dato crudo**:
El `keccak256` del registro de CelesTrak usado en una acreditación. Permite que cualquiera recalcule el dato y audite al relayer después.
_Avoid_: prueba, evidencia, digest

**Fondo de remoción**:
La dirección que recibe los depósitos decomisados.
_Avoid_: tesoro, treasury, fondo común

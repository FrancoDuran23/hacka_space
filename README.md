# OrbitClear (o SlotX)

**Track:** Blockchain (Avalanche Team1 + Oracle) · Argentina Space 2026

Mercado descentralizado de tráfico orbital y limpieza de basura espacial (Space Traffic Management).

## 1. El problema

- La órbita baja terrestre (LEO) está cada vez más congestionada por miles de satélites (como Starlink o Satellogic) y chatarra espacial viajando a 27.000 km/h.
- Hoy existen radares digitales que avisan si dos satélites van a chocar, pero no hay una capa económica ni un árbitro neutral entre empresas competidoras o países. Si dos satélites se cruzan, sus ingenieros negocian caso por caso quién gasta combustible (acortando la vida útil del satélite) sin recibir compensación.
- Nadie limpia la basura espacial porque no hay incentivos financieros automáticos para hacerlo.

## 2. Nuestra solución

Un protocolo de coordinación y pagos automáticos en el espacio con dos funciones:

### Mercado de "slots" y derechos de paso (peaje espacial)
- Cuando los radares detectan riesgo de colisión entre satélites de distintas empresas, se abre una negociación rápida.
- El operador que quiere mantener su ruta ofrece una recompensa en USDC al otro satélite para que haga la maniobra evasiva.
- Apenas los radares confirman que el satélite se movió y el peligro pasó, el pago se libera automáticamente.

### Bounties de basura espacial (grúa espacial)
- Agencias espaciales, aseguradoras o empresas bloquean USDC en un escrow asignado a un objeto de basura peligroso (ej. un cohete viejo).
- Cualquier empresa de limpieza orbital que capture ese objeto y lo empuje a la atmósfera para desintegrarlo cobra la recompensa al instante, sin licitaciones ni burocracia.

## 3. Tecnología de los sponsors

### Oracle: los ojos y la memoria del sistema
Los datos orbitales y de radar pesan gigabytes y requieren cálculos físicos que no entran en una blockchain. Usamos Oracle Cloud / Database para guardar trayectorias (TLE reales de satélites y basura), simular el radar y verificar matemáticamente si un satélite cambió de órbita. Actúa como el oráculo que audita la evidencia física y le avisa a la blockchain que el trabajo se cumplió.

### Avalanche: la caja fuerte y el motor financiero
Smart contracts en Avalanche Fuji (testnet) con USDC como moneda de pago. Cuando dos satélites se acercan a 27.000 km/h las decisiones se toman en minutos u horas: la finalidad menor a 1 segundo y las comisiones mínimas de Avalanche permiten cerrar acuerdos y liquidar pagos en tiempo real entre competidores que no confían entre sí.

## Skills del equipo

En [`skills/`](skills/INDEX.md) están las skills portables para LLMs del track (idea, Avalanche, Hardhat, ethers, wallet/ABI, geoespacial, frontend), copiadas de [blastonyz/skills-track](https://github.com/blastonyz/skills-track) (commit 6c14b4c).

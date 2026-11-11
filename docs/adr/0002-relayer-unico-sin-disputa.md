# Relayer único, sin ventana de disputa

Alguien tiene que decirle al contrato que un satélite reingresó, y ese alguien es un punto de confianza. Decidimos que una sola dirección pueda acreditar reingresos, y que el pago se libere en la misma transacción, sin período de challenge. La defensa no es un multisig sino la auditoría: cada acreditación guarda el `keccak256` del registro crudo de CelesTrak, así que cualquiera puede recalcularlo.

## Considered Options

- **Dos o tres reporters con quórum**: serían tres wallets del mismo equipo firmando lo mismo. Descentralización decorativa.
- **Reporte abierto con bond y slashing**: el diseño correcto a largo plazo, imposible de construir y de defender en el plazo del hackathon.
- **Ventana de 24–48 h**: mata el argumento de liquidación instantánea, que es la razón declarada para usar Avalanche.

## Consequences

Si el relayer miente, el error queda registrado y auditable, pero es irreversible. Aceptado para el prototipo. La versión de producción necesita quórum entre fuentes de datos independientes, no entre direcciones del mismo equipo.

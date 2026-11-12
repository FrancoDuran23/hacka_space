---
status: accepted (reemplaza a ADR-0001)
---

# El plazo de retiro corre desde el fin de misión declarado por el operador

Con el plazo anclado al lanzamiento (ADR-0001), casi cualquier satélite real nacía vencido al registrarse: uno de órbita baja que opera más de 5 años ya perdía el depósito el día del alta, y la regla contradecía la que citamos en el pitch (la FCC cuenta 5 años desde el fin de la misión). Decidimos que `register` reciba el fin de misión declarado por el operador y que el plazo sea ese fin de misión más los años de la banda. El catálogo público no publica la vida útil de un satélite, así que es una declaración del operador, como en una licencia; lo que se sigue verificando con datos públicos es el reingreso.

## Considered Options

- **Seguir anclado al lanzamiento**: verificable sin declaraciones, pero castiga a todo satélite que opera más que su banda.
- **Vida útil desde una base externa** (UCS "Expected Lifetime"): congelada en mayo de 2023, incompleta y sin fuente auditable.
- **Pasar "lanzamiento + vida útil" como fecha de lanzamiento**: no cambia el contrato, pero deja on-chain una fecha de lanzamiento falsa.

## Consequences

El contrato cambió de firma y se redesplegó en Fuji; el deploy anterior queda como histórico. El operador podría declarar un fin de misión lejano para estirar el plazo: es el mismo riesgo que una declaración ante un regulador, y el fin de misión queda on-chain junto al hash del registro de CelesTrak para auditarlo.

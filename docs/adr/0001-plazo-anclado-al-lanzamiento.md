---
status: superseded by ADR-0004
---

# El plazo de retiro se ancla a la fecha de lanzamiento, no al registro

Los operadores podrían registrarse tarde y pedir un plazo nuevo, y el prototipo necesita mostrar un decomiso con datos reales antes de la entrega. Decidimos que el plazo de retiro es `LAUNCH_DATE` de SATCAT más los años de la banda orbital: el operador no elige la fecha, ni tampoco el momento desde el que se cuenta.

## Considered Options

- **Contarlo desde el registro**: da plazos futuros realistas, pero ningún caso real se puede decomisar el día de la demo sin falsear el dato.
- **Configurable por escrow**: le devuelve al operador la posibilidad de elegir un plazo cómodo, que es justo lo que el depósito tiene que impedir.

## Consequences

Registrar un satélite viejo que ya debía haber reingresado decomisa el depósito de inmediato. Envisat (NORAD 27386, lanzado 2002-03-01, 762 km, sin `DECAY_DATE`) entra en esa categoría y es uno de los dos casos de la demo. La regla es igual de correcta en producción: la garantía se debía depositar al lanzar.

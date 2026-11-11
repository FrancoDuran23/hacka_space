# Cumplir es reingresar, no estar operativo

Un satélite puede romperse y quedar muerto en órbita sin caer, y es tentador devolverle el depósito al operador porque "no fue su culpa". Decidimos que el único evento que devuelve el depósito es el reingreso verificado: un satélite roto que igual cae cobra, uno roto que queda en órbita pierde.

## Considered Options

- **Devolver también cuando SATCAT marca `OPS_STATUS_CODE` no operativo**: le devuelve la plata a un objeto muerto que sigue siendo basura, que es exactamente el problema que el protocolo existe para evitar.
- **Aceptar cualquier descenso de apogeo medido entre TLEs**: la atribución es frágil y hay que explicar la física en una slide.

## Consequences

El riesgo de falla involuntaria queda del lado del operador. Es el incentivo funcionando, pero es la objeción más razonable que va a aparecer en la ronda de preguntas y conviene tenerla contestada.

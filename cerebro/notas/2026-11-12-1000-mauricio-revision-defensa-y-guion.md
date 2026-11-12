---
titulo: Revisión de docs/defensa.md y docs/pitch/guion.md contra el contrato — huecos que quedan antes de la entrega
autor: mauricio
fecha: 2026-11-12 10:00
tema: orbitclear
tags: [pitch, defensa, guion, contrato, demo, revision]
tipo: conclusion
fuentes:
  - docs/defensa.md, docs/pitch/guion.md, docs/adr/0001 a 0003
  - contratos/contracts/OrbitClearEscrow.sol y contratos/deployments/fuji.json
  - sample-data/satcat-*.json
relacionadas: [2026-11-12-0137-mauricio-debate-jurado-defensa.md, 2026-11-12-0104-mauricio-antecedentes-dano-real-y-cifras-revisadas.md, 2026-11-11-1350-samuel-decisiones-orbitclear.md]
---

## Qué es

Lectura cruzada de la defensa y el guion nuevos contra el contrato desplegado, para encontrar lo que todavía se puede caer delante del jurado. Entrega: viernes 13/11 a las 09:00.

## Lo importante

**Verificado contra archivos del repo**

- **El guion no entra en el formato.** Tiene 11 slides habladas y unas 1.000 palabras (cerca de 6,7 minutos a ritmo normal). El track pide deck de 5 a 7 slides y video de 1 a 3 minutos (`docs/planning.md` §11).
- **Tiangong-1 no sirve como caso de devolución.** Se lanzó el 2011-09-29 y reingresó el 2018-04-02: 6,5 años. Con el plazo de la banda baja (5 años desde el lanzamiento) el contrato lo decomisa por reingreso tardío. La nota de decisiones de Samuel lo daba como "cumplió". Hace falta un objeto de menos de 600 km que haya reingresado antes de los 5 años de lanzado.
- **`sample-data/satcat-starlink-deorbit.json` está mal nombrado:** contiene el módulo Tianhe de la estación china (NORAD 48274), sin fecha de reingreso.
- **Los tres supuestos del guion siguen sin cumplirse.** El contrato no cambió desde el deploy del 11/11: no hay ventana de gracia, no hay caso de devolución en Fuji y `register` sigue pidiendo NORAD.
- **En Fuji el activo es MockUSDC**, y relayer y fondo son la misma dirección. La slide 6 dice "USDC".
- **`docs/defensa.md` quedó atrás del guion** en tres frases: "todos pueden usar el mismo contrato" (§3.5; el guion dice que cada regulador despliega el suyo), "el operador o su aseguradora usan la app" (§4; `register` solo lo llama el relayer) y la respuesta sobre operadores chicos (§4; el guion ya admite el capital inmovilizado).
- **Reino Unido con dos cifras:** `docs/planning.md` dice unos GBP 61 millones y la defensa GBP 75,6 millones para la misma misión.

**Interpretación (sin fuente nueva)**

- **El plazo anclado al lanzamiento choca con la frase central del pitch.** Decimos que la obligación ya existe (FCC: 5 años desde el fin de la misión), pero el contrato da 5 años desde el lanzamiento, misión incluida. Con esa regla pierde cualquier satélite de órbita baja que opere más de 5 años; la ISS quedaría decomisada al registrarla. El guion no tiene respuesta preparada. Respuesta sugerida: el plazo es un parámetro del regulador; en la demo se ancla al lanzamiento para poder mostrar un decomiso con datos reales (ADR 0001); en producción sería fin de misión declarado más el plazo.
- **Resurs-P1 puede no ser "nuestro caso exacto".** De memoria, sin verificar: fue dado de baja a fines de 2021 y se partió en junio de 2024 a unos 355 km. Con una regla de 5 años desde el fin de misión todavía estaba en plazo, así que la garantía no lo habría bajado antes. Verificar esas fechas; si se confirman, usarlo como "satélite muerto que causó daño" y no como caso que OrbitClear habría evitado. Cosmos 2251 (muerto años antes de chocar en 2009, en una órbita donde no cae solo) encaja mejor.
- **Shenzhou-20:** un resto de menos de un milímetro no se puede atribuir a un satélite abandonado. Sirve para mostrar que el daño es real, no que el bono lo habría evitado.
- **ADR 0002 rechaza una ventana de 24 a 48 horas porque "mata la liquidación instantánea, razón declarada para usar Avalanche".** El guion ahora promete una ventana de gracia y no usa la liquidación instantánea como argumento. Si alguien del jurado lee los ADR, hay tensión; actualizar el ADR si se agrega la gracia.

## Preguntas abiertas

- ¿El pitch en vivo tiene el mismo límite que el video? Si no, hacen falta dos versiones del guion.
- Qué satélite real se usa para la devolución.
- Fechas de Resurs-P1 (baja y altura al partirse).

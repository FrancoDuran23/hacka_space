---
titulo: Números de economía para el pitch — volumen de bonos, mercado de seguros, costo de una L1 en Avalanche y a quién contactar
autor: mauricio
fecha: 2026-11-11 16:07
tema: orbitclear
tags: [pitch, economia, mercado, modelo-de-negocio, avalanche-l1, seguros, contactos]
tipo: resumen
fuentes:
  - https://payloadspace.com/novaspace-predicts-43000-new-sats-to-launch-by-2034/ (Novaspace, 43.000 satélites 2025-2034)
  - https://e360.yale.edu/digest/2025-satellite-launches (récord de objetos lanzados en 2025)
  - https://keeptrack.space/live-count/how-many-satellites-are-launched-per-year
  - https://www.spglobal.com/market-intelligence/en/news-insights/research/2026/09/state-of-leo-the-crescendo-of-opposition-to-satellite-proliferation
  - https://www.advanced-television.com/2025/10/29/report-satellite-insurance-sector-suffering (primas de seguros espaciales)
  - https://newspaceeconomy.ca/2026/03/29/the-orbital-insurance-market-how-underwriters-are-pricing-constellation-scale-risk/
  - https://docs.avax.network/blog/l1-validator-fee (costo por validador de una L1)
  - https://build.avax.network/blog/l1-economics
  - https://build.avax.network/academy/avalanche-l1/customizing-evm/05-genesis-configuration/05-gas-fee-configuration
relacionadas: [docs/planning.md, 2026-11-11-1245-samuel-verificaciones-orbitclear.md, 2026-11-11-1504-mauricio-marco-legal-bono-escrow.md]
---

## Qué es

Cifras de mercado para la slide de economía del pitch, más dos temas que surgieron: si conviene una L1 propia en Avalanche para cobrar comisiones, y a quién contactar primero. Los datos de mercado tienen fuente; las cuentas de volumen e ingresos son nuestras y están marcadas.

## Lo importante

### Datos de mercado (con fuente)
- **Satélites lanzados en 2025:** 4.517 según Payload Space / Jonathan McDowell (+58% contra 2024); 4.434 según la Satellite Industry Association. Récord histórico. Starlink fue el 73% (KeepTrack).
- **Satélites activos en 2026:** entre 14.500 y 18.000 según la fuente y la fecha (SIA, CelesTrak, S&P Global).
- **Proyección:** más de 43.000 satélites a lanzar entre 2025 y 2034, unos 12 por día; USD 665.000 millones entre fabricación y lanzamiento. Cinco megaconstelaciones son el 66% de los satélites (Novaspace, oct-2025).
- **Mercado de seguros espaciales:** unos USD 500 a 600 millones de primas por año (Marsh, Gallagher Re). Hay reportes pagos que dan USD 4.000 millones con otra definición: no usar.
- **Costo de remover:** EUR 86 millones por un objeto (nota de Samuel).

### Cuentas nuestras (**Interpretación**, con bono de USD 200.000)
- 100% de los lanzamientos de 2025: ~4.500 x 200.000 = **~USD 900 millones por año** en garantías.
- 20% de cobertura (el escenario de Nature): ~900 satélites = **~USD 180 millones por año**.
- Década 2025-2034 al 100%: 43.000 x 200.000 = **~USD 8.600 millones**; al 20%, ~USD 1.700 millones.
- El volumen anual de bonos al 100% sería mayor que todas las primas del seguro espacial. Sirve para mostrar tamaño, pero también indica que las aseguradoras solas no tendrían capacidad para emitir todos los bonos.
- **Ingreso de OrbitClear (supuesto, no decidido):** una comisión de 0,5% sobre el depósito son USD 1.000 por satélite: ~USD 0,9 millones por año al 20% de cobertura, ~USD 4,5 millones al 100%.
- **Punto débil a tener preparado:** un bono de USD 200.000 no paga una remoción de EUR 86 millones; harían falta más de 400 bonos confiscados. Respuesta: el bono es un incentivo para que el operador desorbite, no un seguro del costo total; el fondo junta lo confiscado y complementa fondos públicos.
- La mayoría del volumen son megaconstelaciones (Starlink) que vuelan bajo y ya desorbitan: depositarían y recuperarían. El impacto real está en el resto.

### L1 propia en Avalanche para cobrar comisiones
- Una L1 de Avalanche puede usar su propio token para el gas y decidir si las comisiones se queman o van a una dirección (documentación de Avalanche). GUNZ, por ejemplo, cobra el gas en su token GUN.
- Costo: ~1,33 AVAX por validador por mes mientras haya menos de 10.000 validadores de L1 en la red.
- No encontré cifras de cuánto recauda cada L1; un dato agregado habla de ~USD 25.000 por día entre todas, sin desglose ni fecha clara.
- **Interpretación:** para la hackathon no hace falta. La comisión se puede cobrar dentro del propio contrato en la C-Chain (Fuji). La L1 propia queda como roadmap: una red donde los validadores sean reguladores y auditores.

### A quién contactar primero (**Interpretación**)
1. Los autores del paper de Nature (Brownhall et al., UCL y Colorado): validan la idea y dan credibilidad.
2. Aseguradoras y brokers espaciales (Gallagher, Marsh, sindicatos de Lloyd's) y Z/Yen, que propone bonos de seguro para remoción.
3. Empresas de remoción (Astroscale, ClearSpace): son las que cobrarían del fondo.
4. Reguladores: CONAE y los autores del proyecto de Ley Espacial Argentina; UK Space Agency; expediente abierto de la FCC.
5. Operadores firmantes del Zero Debris Charter.

## Preguntas abiertas
- Definir el modelo de ingresos: comisión sobre el depósito, parte del rendimiento, o cobro al regulador.
- Cuánto recauda cada L1 de Avalanche (mirar exploradores por L1 si se quiere el dato).
- Quiénes firman el proyecto de Ley Espacial Argentina.

## Aporte de mauricio (2026-11-11 16:19)

Segunda búsqueda sobre quién cobra las comisiones en una L1 de Avalanche.

- **El mecanismo está confirmado en la documentación oficial.** El precompile *Reward Manager* de una L1 tiene tres modos excluyentes: quemar las comisiones, mandarlas a una dirección fija (por ejemplo una tesorería, `rewardAddress`) o dejar que cada validador cobre las de sus bloques (`allowFeeRecipients`). Fuente: https://build.avax.network/docs/virtual-machines/default-precompiles/rewardmanager
- **Redes que usan token propio para el gas:** Beam (BEAM), DeFi Kingdoms (JEWEL), GUNZ (GUN), Henesys de MapleStory (NXPC). Fuentes: https://eco.com/support/en/articles/12168599-what-is-avalanche-avax-l1s-and-subnets-in-2026 y exploradores de subnets.avax.network
- **Actividad a 30 días (transacciones, no ingresos):** GUNZ 11,0 M; Dexalot 9,8 M; C-Chain 8,4 M; Henesys 3,8 M; Beam 0,2 M (misma fuente de eco.com, sin fecha exacta).
- **No encontré** ninguna fuente que diga cuánto recaudó un proyecto concreto por comisiones de su L1, ni cuál de los tres modos usa cada uno. No afirmar en el pitch que "X ganó tanto".
- Referencia de escala: toda la C-Chain cobró unos USD 17.000 de comisiones de red en 24 h (DefiLlama, 10-nov-2026) y USD 680.700 en el primer trimestre de 2026 (Token Terminal). **Interpretación:** las comisiones de gas son un ingreso chico; para OrbitClear rinde más una comisión sobre el depósito que cobrar gas en una red propia.

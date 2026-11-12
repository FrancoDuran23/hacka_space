---
titulo: Empresas que construyeron o migraron a Avalanche, cuáles usan L1 propia, y qué es Blerify
autor: mayko
fecha: 2026-11-11 16:40
tema: blockchain
tags: [avalanche, l1, subnet, precedentes, blerify, identidad, tokenizacion, pitch]
tipo: resumen
fuentes:
  - https://www.avalanche.com/about/blog/blerify-case-study-building-trust-beyond-borders
  - https://blerify.com/research-agesic.html
  - https://www.avalanche.com/about/blog/intain-launches-avalanche-subnet-to-usher-in-new-era-for-multi-trillion-dollar-securitized-finance-market/
  - https://www.reuters.com/technology/california-dmv-puts-42-million-car-titles-blockchain-fight-fraud-2024-07-30/
  - https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/fifa-collect-migrates-to-new-fifa-blockchain
  - https://www.theblock.co/news/web3/2022-08-23-defi-kingdoms-to-leave-harmony-for-metaverse-focused-blockchain-164497
  - https://www.citigroup.com/global/news/press-release/2024/citi-collaborates-with-wellington-management-and-wisdomtree-to-explore-tokenization-of-private-markets
  - https://media.kkr.com/news-details?news_id=5aa593b4-0063-4e7b-a0cc-b9d2d1668d21
  - https://www.lemonade.com/blog/crypto-climate-coalition/
  - https://docs.avax.network/docs/acps/77-reinventing-subnets
relacionadas: [2026-11-11-1150-samuel-avalanche-datos-satelitales.md, 2026-11-11-1607-mauricio-numeros-economia-pitch.md]
---

## Qué es
Precedentes reales de empresas y gobiernos en Avalanche, para responder "¿quién más usa esto?" en el pitch. Indica quiénes **migraron** de otra cadena, quiénes usan **L1 propia** y quiénes la **C-Chain**, y qué es Blerify. Fuentes primarias salvo donde se indica.

## Lo importante

### Migraron de otra cadena
| Quién | Desde | A qué | Fuente |
|---|---|---|---|
| FIFA (FIFA Collect) | Algorand y Polygon | L1 propia "FIFA Blockchain" (2025) | fifa.com, blog Avalanche |
| DeFi Kingdoms | Harmony (la dejó tras el hack del bridge Horizon, 2022) | L1 "DFK Chain", gas JEWEL | The Block, docs DFK |
| Merit Circle → Beam | token MC en Ethereum | L1 "Beam", gas BEAM; L1 soberana desde dic-2024 | blog Avalanche |
| California DMV (Oxhead Alpha) | prueba de concepto en Tezos | cadena permisionada del DMV, 42 M de títulos de auto (2024) | Reuters, blog Avalanche |

### Cambiaron su modelo de negocio sin migrar (producto nuevo)
- **Con L1 propia:** Intain (mercado de ABS tokenizados; validadores conocidos y alojados en EE.UU. por requisito regulatorio), Citi Spruce y la L1 Evergreen (PoC de fondos privados y FX con Project Guardian del MAS), JPMorgan Onyx + Apollo + WisdomTree (PoC Project Guardian), SK Planet "UPTN" (lealtad OK Cashbag, ~21 M de miembros, sin gas para el usuario), Nexon "Henesys" (MapleStory), Gunzilla "GUNZ" (Off The Grid), Balcony (370.000 escrituras del condado de Bergen, NJ), Alipay+ (PoC de vouchers), Toyota MON (white paper multi-L1 que incluye reguladores y aseguradoras).
- **En la C-Chain:** KKR/Securitize (fondo tokenizado, 2022), Franklin Templeton (BENJI; se sumó como una cadena más), Lemonade Crypto Climate Coalition (seguro paramétrico en Kenya con oráculo Chainlink), Wyoming FRNT (stablecoin estatal, 2025; una de 7 cadenas).

### Blerify
- Infraestructura de identidad digital y credenciales verificables (W3C, ISO 18013-5). Fundada en 2022, se presenta como spin-off del BID: su CEO, Marcos Allende López, cofundó LACChain. Tiene equipo en Argentina, Perú y otros países de la región.
- En Avalanche: **sí, verificado** en el blog oficial. Hizo un piloto con **AGESIC (gobierno digital de Uruguay)**: un registro de confianza descentralizado para identidad transfronteriza. On-chain solo van emisores, claves y estado de revocación, sin datos personales, y cada país corre su nodo. Ganó CDPI Global en el Global DPI Summit 2025.
- ¿L1 o C-Chain? **No verificado**: el caso de estudio menciona "Avalanche y LNET" sin decir si usa una L1 dedicada.
- Con Argentina: tiene equipo acá, pero no hay despliegue con el gobierno argentino.

### L1 vs C-Chain (docs oficiales)
- C-Chain: la cadena EVM pública de la red primaria.
- L1 (antes "Subnet"): una blockchain propia con su set de validadores, su token de gas y sus reglas de permisos. Puede ser pública o permisionada.
- Desde **Avalanche9000 / ACP-77 (16-dic-2024)** ya no hace falta poner 2.000 AVAX por validador. Cada validador paga ~1,33 AVAX por mes, y el set se gestiona con un contrato en la propia L1 (PoA o PoS).

**Interpretación (para OrbitClear):** los precedentes más cercanos son Intain (reguladores y auditores como validadores), el DMV de California (un gobierno operando su cadena con contratos "tipo escrow") y Lemonade (depósito más oráculo más aseguradora). Para la hackathon alcanza con la C-Chain; la L1 permisionada solo se justifica si el regulador exige operar o autorizar los validadores, que es el argumento que usó Intain.

## No usar / no verificado
- Bitso, Lemon, Mercado Libre, Balanz y Num Finance **no** aparecen en Avalanche (Lemon usa Aave; Mercado Libre usa Ripio).
- "Visa en Avalanche": es la tarjeta de **Rain** sobre la red Visa.
- Valour es un ETP sobre el precio de AVAX, no un caso de adopción.
- No encontré "Republic of Korea / Intain" ni "Grove/Wyoming"; lo verificado es FRNT.
- Dexalot, Lamina1 y Kite AI: existen como L1, pero no se verificaron sus fuentes.
- Cifras como "100 M de usuarios de Alipay+" o "USD 240.000 M de Balcony" son de comunicados de los propios interesados: citarlas como dichas por ellos.

## Preguntas abiertas
- ¿Blerify usa una L1 dedicada o la C-Chain? Se podría preguntar directo: tienen equipo en Argentina y es un contacto posible para el pitch.

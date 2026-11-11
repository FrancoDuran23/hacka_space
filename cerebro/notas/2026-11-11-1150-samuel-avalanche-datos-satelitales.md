---
titulo: Avalanche + datos geosatelitales — patrones, precedentes y pitfalls
autor: samuel
fecha: 2026-11-11 11:50
tema: blockchain
tags: [avalanche, oraculos, seguro-parametrico, datos-satelitales, economia-espacial]
tipo: resumen
fuentes:
  - https://www.avalanche.com/about/blog/builder-spotlight-the-lemonade-foundation-and-insuring-smallholder-farmers-with-avalanche/
  - https://www.lemonade.com/blog/crypto-climate-coalition/
  - https://www.spacefoundation.org/2025/07/22/the-space-report-2025-q2/
  - https://blog.etherisc.com/etherisc-protects-another-7-000-kenyan-farmers-as-part-of-the-lemonade-crypto-climate-coalition-e169eca3d6bc
relacionadas: [2026-11-11-1142-samuel-satelites-sin-maniobra.md]
---

## Qué es

Investigación sobre cómo combinar Avalanche con datos geosatelitales para un proyecto de "economía espacial". Conclusión: el patrón probado es **hecho satelital → oráculo → consecuencia económica on-chain** (seguros, créditos, liquidaciones), no almacenar imágenes en la cadena.

## Lo importante

- **Precedente real en Avalanche**: Lemonade Crypto Climate Coalition — seguro paramétrico de cultivos en Kenya sobre Avalanche, ~7.000 agricultores, primas de ~$0,83, pagos automáticos. Stack: Avalanche + Chainlink (oráculo de datos clima/satelitales) + Etherisc (contratos de seguro) + Pula (modelo agrícola) + Hannover Re (reseguro). Usa "area yield index".
- **Patrón técnico recomendado**: procesamiento satelital off-chain (NDVI, índices, umbrales) → on-chain solo hash + índice + trigger → contrato liquida pago en stablecoin. Oráculo: Chainlink Functions (soporta Avalanche) o backend que firma el dato y el contrato verifica firma. Cadena: C-Chain, testnet Fuji.
- **Datos satelitales gratis**: Copernicus Data Space / Sentinel Hub (Sentinel-1 SAR, Sentinel-2), NASA FIRMS (incendios diario), MODIS/VIIRS, Google Earth Engine. Argentino: **CONAE SAOCOM** (SAR banda L — humedad de suelo, inundaciones, ve a través de nubes).
- **Economía espacial**: $613B en 2024 (Space Foundation, The Space Report 2025 Q2), 78% comercial, proyección $1T hacia 2032.
- **Modelos evaluados**: seguro paramétrico agro (el más probado; ángulo AR: sequía/inundación en la Pampa); dMRV/créditos de carbono (Gran Chaco); marketplace de datos EO (débil — los datos crudos ya son gratis, el valor está en el procesamiento); seguro de colisiones on-chain (diferenciador, ver nota relacionada: ~13% de satélites activos no puede maniobrar).
- **Pitfalls**: (1) el dato satelital no es trustless — hay que declarar el trust model (oráculo firmado / multi-oráculo / hash-commit); (2) Sentinel-2 revisita cada ~5 días y las nubes lo bloquean — para triggers en tiempo real usar FIRMS/MODIS o SAR; (3) nunca subir rasters a la cadena.

## Preguntas abiertas

- ¿El eje del proyecto del equipo es Tierra (agro/clima) u órbita (tráfico espacial)? El modelo recomendado cambia según eso.
- ¿Chainlink Functions alcanza en Fuji testnet para el flujo completo, o conviene oráculo propio con firma por simplicidad?

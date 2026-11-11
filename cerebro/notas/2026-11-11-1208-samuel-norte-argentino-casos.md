---
titulo: Proyectos Avalanche + datos satelitales aplicables al norte argentino (NOA/NEA)
autor: samuel
fecha: 2026-11-11 12:08
tema: casos-de-uso
tags: [norte-argentino, eudr, deforestacion, chaco, litio, inundaciones, seguro-parametrico, saocom]
tipo: idea
fuentes:
  - https://environment.ec.europa.eu/topics/forests/deforestation/eu-deforestation-regulation-eudr_en
  - https://www.magyp.gob.ar/mercadosagropecuarios/estandares.php
  - https://www.greenpeace.org/argentina/story/problemas/bosques/la-deforestacion-no-se-detiene-mas-de-73-000-hectareas-arrasadas-en-el-norte/
  - https://publications.iadb.org/publications/spanish/document/La-deforestacion-en-el-Gran-Chaco-argentino-avances-y-desafios.pdf
  - https://green-forum.ec.europa.eu/deforestation-regulation-implementation/traceability-and-geolocation-commodities-subject-eudr_en
relacionadas: [2026-11-11-1150-samuel-avalanche-datos-satelitales.md]
---

## Qué es

Mapeo de problemas del norte argentino (NOA: Salta, Jujuy, Tucumán, Catamarca, La Rioja, Stgo. del Estero; NEA: Chaco, Formosa, Corrientes, Misiones) que admiten el patrón "hecho satelital → oráculo → consecuencia económica on-chain" de la nota de Avalanche.

## Lo importante

**Insight central para el pitch**: el norte argentino ya está monitoreado por satélite (UMSEF/SNMF usa imágenes para bosques nativos; SNIF para incendios; CONAE opera SAOCOM). Lo que falta es convertir el hecho observado en consecuencia económica automática (certificado exportable, pago de seguro, crédito, multa). Ahí entra blockchain.

### Caso 1 (recomendado): EUDR + deforestación Gran Chaco → trazabilidad on-chain

- **Deadline real**: EUDR aplica 30-dic-2026 (grandes/medianos operadores), 30-jun-2027 (PyMEs). Exige geolocalización del lote + declaración de "libre de deforestación post 31-dic-2020" para soja, carne bovina y madera — las 3 cadenas argentinas afectadas según MAGyP. Argentina: país de riesgo "estándar".
- **El problema norte**: Chaco, Formosa, Salta y Stgo. del Estero = 85% de los bosques del Gran Chaco y ~75% de la deforestación nacional. Pérdida 2025: 210.702 ha (+40% vs 2024, Greenpeace). Ene-sep 2026: 73.224 ha. Desde la Ley de Bosques (2007) a jun-2024: ~2,7M ha en las 4 provincias. >50% de los desmontes donde no está permitido.
- **Producto**: certificado on-chain por lote (geohash + firma del oráculo que verifica "sin deforestación post-2020" con Sentinel-2/CONAE) anclado al certificado de tránsito/declaración EUDR. Comprador: exportadores.
- Datos: Sentinel-2 (10m, 5 días), Sentinel-1 SAR, catálogo CONAE, capas UMSEF (ya existen, públicas).

### Caso 2: Inundaciones Pilcomayo/Bermejo (Formosa/Chaco) → seguro paramétrico o ayuda automática

- SAR mapea extensión de agua a través de nubes (Sentinel-1, SAOCOM) → trigger → desembolso en stablecoin a hogares afectados. Ángulo inclusión financiera (NEA = alta desbancarización). Precedente: Lemonade/Avalanche (nota relacionada) y Deloitte "Close As You Go" para ayuda en desastres sobre Avalanche.
- SAOCOM banda L es ideal: diseñado por CONAE justamente para humedad de suelo e inundaciones en la región.

### Caso 3: Litio Puna (Salta/Jujuy/Catamarca) → ESG hídrico verificable on-chain

- Triángulo del litio: salares Cauchari, Olaroz, Hombre Muerto. Conflicto real: uso de agua en salares + relación con comunidades (Kolla/Atacama, Susques).
- Satélite: índices de agua Sentinel-2, subsidencia InSAR → reporte ESG inmutable para regulación europea de baterías y auditorías de compradores. Diferenciador: "verify, don't trust" — la comunidad puede co-firmar el oráculo.
- Menos maduro que los casos 1-2 (faltan umbrales públicos consensuados) pero muy diferenciador en pitch.

### Caso 4: Incendios Iberá/Corrientes y Chaco → alerta + fondo paramétrico

- Incendios Iberá 2022 quemaron ~800 mil ha. FIRMS/MODIS (detección casi real-time) + Sentinel-1/2 (cicatriz) → liberación automática de fondos de respuesta. Los incendios explicaron 35% de la pérdida de bosques nativos nacionales en 2022.

### Caso 5: Sequía agro (Stgo. del Estero/Chaco) → seguro paramétrico de sequía

- Humedad de suelo SAOCOM o NDVI → trigger de sequía → pago. Variante del modelo Lemonade, directamente replicable.

## Cómo abordarlo (método)

1. Elegir par **problema × dato**: víctima/pagador concreto + umbral medible desde satélite.
2. Verificar el dato: existe gratis, resolución/revisit alcanzan, ¿nubes? (→ SAR).
3. Definir el contrato: qué hecho gatilla qué plata (pago, certificado, crédito).
4. Trust model: quién atestigua el hecho. Pitch-fuerte en Argentina: oráculo que referencia datos CONAE/UMSEF.
5. MVP: un lote/una cuenca de ejemplo, una API, un contrato en Fuji.

## Preguntas abiertas

- EUDR: ¿el alcance es exportador (B2B) o productor? El eslabón que compra la certificación define el modelo de negocio.
- ¿Hay umbral público consensuado de extracción hídrica en salares para el caso litio?
- Conectividad en comunidades del Chaco/Formosa para recibir pagos en stablecoin — verificar cómo Lemonade resolvió cobro en Kenya (mobile money).

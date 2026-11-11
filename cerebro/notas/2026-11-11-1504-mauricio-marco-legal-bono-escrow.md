---
titulo: Marco legal del bono de desorbitado — tratados, reguladores, y la parte financiera del escrow (aseguradora + rendimiento)
autor: mauricio
fecha: 2026-11-11 15:04
tema: orbitclear
tags: [marco-legal, tratado-del-espacio, fcc, uk, eu-space-act, argentina, aseguradora, rendimiento, escrow, pitch]
tipo: resumen
fuentes:
  - https://www.govinfo.gov/content/pkg/FR-2020-08-25/pdf/2020-13184.pdf (FCC 20-54, consulta sobre bonos)
  - https://www.wiley.law/alert-FCCs-Space-Bureau-Seeks-to-Refresh-the-Record-on-Orbital-Debris-Mitigation-and-Space-Sustainability
  - https://www.hlc.com/en/publications/orbital-debris-mitigation-standards-evolve-with-new-fcc-rules-and-further-proposed-rulemaking
  - https://www.gtlaw.com/es/insights/2026/8/fcc-space-modernization-series-part-1-the-new-bond-and-milestone-framework
  - https://www.gov.uk/government/consultations/consultation-on-orbital-liabilities-insurance-charging-and-space-sustainability/outcome/space-regulatory-financial-tools-package-including-government-response-to-the-liability-insurance-charging-and-space-sustainability-consultation
  - https://hlc.com/en/publications/space-insurance-developments-in-the-uk-and-europe-2026
  - https://elevenjournals.com/tijdschrift/iisl/2013/4%20Legal%20Aspects%20of%20Space%20Debris%20Remediation/IISL_2013_056_004_007.pdf (Art. VIII y remoción)
  - https://rest.hcdn.gob.ar/web/proyectos/289993/adjuntos/104566 (proyecto "Ley Espacial Argentina", Diputados)
  - https://blogs.law.ox.ac.uk/oblb/blog-post/2026/03/stablecoin-interest-crossroads-micas-prohibition-and-us-regulatory-maze
  - https://www.everycrsreport.com/files/2026-03-06_IF13174_b3e7cc94263580c216dade10b9fb003bc3724de6.html
  - https://www.seradata.com/are-spabribs-the-solution-to-space-debris-insurers-think-so
relacionadas: [docs/planning.md, 2026-11-11-1300-franco-bono-deorbitado-quien-multa.md, 2026-11-11-1245-samuel-verificaciones-orbitclear.md, 2026-11-11-1350-samuel-decisiones-orbitclear.md]
---

## Qué es

Cubre el riesgo 7 de `docs/planning.md` ("Marco legal. No lo investigamos"). Las notas de Franco y Samuel ya tienen quién multa hoy, Argentina y el EU Space Act; acá va lo que faltaba: la base legal para exigir el bono, el consentimiento para remover, y los problemas legales de la parte financiera (aseguradora y rendimiento). Casi todas las fuentes son secundarias (estudios de abogados): sirve para el pitch, no es asesoramiento legal.

## Lo importante

### 1. Base legal para que un Estado exija el bono
- **Tratado del Espacio 1967, art. VI:** cada Estado es responsable de las actividades espaciales de sus privados y debe autorizarlas y supervisarlas. De ahí salen las licencias nacionales, y un bono puede ser una condición de licencia. (Conocimiento general del tratado; citar el texto original si va a una slide.)
- **No hay obligación internacional de desorbitar:** solo guías no vinculantes (ya en la nota de Franco).
- **Ya hay requisitos financieros en licencias espaciales**, o sea que el bono no sería un invento raro:
  - Reino Unido y Francia exigen seguro de responsabilidad civil a terceros, usualmente de EUR 60 millones (Hogan Lovells).
  - La FCC usa hace años *surety bonds* que el operador pierde si no cumple hitos de despliegue. Es un bono de licencia, no de desorbitado, pero es el mismo mecanismo. En 2026 la FCC lo está recortando (GT Law): verificar el alcance.
- **Bono de desorbitado en la FCC:** consultado en 2020 (FCC 20-54), con montos sugeridos de USD 5 millones mínimo (GEO) hasta USD 100 millones (constelaciones NGSO) según Hogan Lovells. El Space Bureau reabrió el expediente con un Public Notice (2 de mayo, año sin confirmar, probablemente 2024). **No encontré que se haya adoptado.**
- **Reino Unido:** desde el 1-dic-2026, las licencias orbitales nuevas tienen **límite de responsabilidad variable**, y entre los criterios iniciales está el compromiso con la sostenibilidad espacial (gov.uk, paquete del 8-sep-2026). El mismo paquete lista "abolir fondos de desmantelamiento para grandes constelaciones" y "un space bond respaldado por el gobierno para inversión pública": **no leí el detalle; el space bond parece ser un instrumento de inversión, no un bono de desorbitado. Verificar antes de citarlo.**
- **EU Space Act:** exigiría seguro o garantía financiera a los operadores y alcanza a operadores de terceros países que presten servicios en la UE. No encontré el número de artículo.
- **Argentina:** hay un proyecto en Diputados, "Ley Espacial Argentina — Régimen Nacional de Actividades Espaciales", que pone a CONAE como autoridad de aplicación, crea licencias y un régimen de responsabilidad y cobertura financiera. **Estado parlamentario sin confirmar.**

### 2. Consentimiento para remover (corrige un punto de nuestras notas)
- **Art. VIII del Tratado del Espacio:** el Estado de registro conserva jurisdicción y control sobre el objeto, aunque esté muerto. La doctrina mayoritaria dice que no se puede tocar un objeto ajeno sin consentimiento.
- **Interpretación:** nuestras notas dicen que el operador "da el consentimiento por adelantado, que es lo que exige el Tratado". Es incompleto: el consentimiento que cuenta a nivel internacional es el del **Estado de registro**, no solo el del operador. La cláusula en el contrato es necesaria pero no alcanza; el Estado tiene que avalarla, por ejemplo incluyéndola en la licencia. Para el jurado: "el operador consiente al depositar y el Estado que exige el bono lo incorpora a la licencia".

### 3. Aseguradora que pone el bono
- Existe una propuesta parecida desde el mundo asegurador: los SPADRIBs (bonos de seguro para remoción, Z/Yen). Lo que más les preocupa a las aseguradoras es que el operador quiebre, no el costo de remover.
- **Interpretación:** es un seguro de caución. La aseguradora es una entidad regulada (en Argentina, por la SSN) y tendría que poder tener esa garantía en un contrato on-chain. No lo verifiqué.

### 4. Rendimiento del escrow
- Los emisores de stablecoins no pueden pagar interés: en EE. UU. por la GENIUS Act (terceros sí pueden, con discusión abierta) y en la UE por MiCA, que es más estricta.
- **Interpretación:** el rendimiento no sale de tener USDC; hay que mandar la plata a otro producto (préstamos DeFi, letras del Tesoro tokenizadas). Eso trae dos preguntas que el jurado puede hacer: (a) quién cubre la pérdida si ese producto falla, porque una garantía no puede perder capital; (b) si pagar rendimiento convierte al escrow en un producto de inversión regulado.
- **Recomendación:** en el pitch, dejar el rendimiento como roadmap y decir que iría solo a instrumentos de bajo riesgo, con el capital garantizado por la aseguradora.

## Preguntas abiertas
- Estado parlamentario del proyecto de Ley Espacial Argentina y qué dice exactamente su régimen de cobertura financiera.
- Si la FCC resolvió algo sobre el bono de desorbitado después de reabrir el expediente.
- Detalle del paquete británico (fondos de desmantelamiento y space bond).
- Régimen argentino para custodiar garantías en cripto (CNV, registro de PSAV; SSN para la aseguradora): no lo busqué.
- Texto de los artículos del EU Space Act sobre seguro o garantía financiera.

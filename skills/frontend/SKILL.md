---
name: frontend
description: Construir un frontend rápido, limpio y liviano para una demo de hackathon (Next.js App Router, React, TypeScript, o generado con v0 / Lovable / Stitch). Usar al armar la UI de la demo y el sitio del proyecto.
---

# Frontend de demo

Objetivo: **una pantalla que muestre un dato real y una transacción**. Lo demás es ruido.

## Stack recomendado

- Next.js 16 (App Router) + React 19 + TypeScript 5.9. Fijá versiones exactas (`--save-exact`) y dejá `npm audit` en 0.
- CSS propio o Tailwind. Evitá librerías de UI pesadas.
- Fuentes locales con `@fontsource-variable/*` (sin pedir a Google Fonts en runtime).
- Sin base de datos propia, sin login propio, salvo que el proyecto lo requiera.
- Si no programás: v0, Lovable o Stitch generan la UI. Pegale **una respuesta real de la API**, no solo el nombre, y después conectá la wallet con la skill `wallet-abi`.

## Estructura mínima

```
app/
  layout.tsx
  page.tsx            # dato real + botón de acción on-chain
components/
  ConnectWallet.tsx   # "use client"
  Dato.tsx            # muestra el dato (server component si puede)
lib/
  abi.ts
  chain.ts            # FUJI, dirección del contrato
sample-data/          # una respuesta real de cada API (plan B)
```

## Reglas de Next.js

- Componentes de servidor por defecto. `"use client"` solo donde hay wallet, estado o eventos.
- `window.ethereum` solo en cliente, dentro de handlers o `useEffect`.
- Llamadas a APIs con key (NASA, FIRMS, Copernicus) **desde el servidor** (route handler o server component). La key nunca va al navegador.
- Variables: solo datos públicos con `NEXT_PUBLIC_` (dirección del contrato, chainId). Secretos sin prefijo.
- En Next 16 los `params` y `searchParams` son promesas: `const { id } = await params`.
- Cacheá respuestas de APIs con límite (`fetch(url, { next: { revalidate: 300 } })`). Una IP compartida en el evento agota `DEMO_KEY` de NASA enseguida.
- Si la API cae, mostrá el JSON de `sample-data/` con un cartel "datos guardados".

## Diseño que el jurado entiende en 5 segundos

1. **Título + una frase**: qué hace y para quién.
2. **El dato real** con unidad, fecha y fuente.
3. **La condición**: "umbral 5, valor actual 7".
4. **El botón**: "Publicar en Avalanche".
5. **El resultado**: hash de la transacción con link al explorer.

Menos texto. Cada párrafo que sobre le resta puntos en Presentación.

## Estilo

- Una paleta de 2 colores más neutros. Si el proyecto es de Avalanche, rojo `#E84142` como acento puntual, no de fondo.
- Contraste alto, texto mínimo de 16 px, botones grandes.
- Estados siempre visibles: cargando, error, vacío, éxito.
- Responsive: probalo en 390 px de ancho. El jurado puede ver el celular.
- Accesibilidad básica: `alt`, labels, foco visible, `prefers-reduced-motion` para animaciones.
- Mapas y globos: Leaflet o MapLibre (2D), globe.gl o CesiumJS (3D). Atribuí la fuente de las capas.

## Antes de entregar

- [ ] `npm run build` pasa sin errores ni warnings de tipos.
- [ ] `npm audit` en 0.
- [ ] Sin claves en el repo ni en el bundle (`grep -r "sk-\|PRIVATE" .next` no encuentra nada).
- [ ] Probado en móvil.
- [ ] Una transacción real hecha y el link guardado.
- [ ] Atribución de fuentes de datos en el pie.
- [ ] Desplegado (Vercel) y abierto en una ventana de incógnito.

## Pedirle a un LLM que genere UI

Prompt base:

> Hacé una pantalla en Next.js (App Router, TypeScript) que muestre este JSON real: [pegar]. Mostrá el valor, la unidad, la fecha y la fuente. Agregá un botón "Publicar en Avalanche" que llame a `publicar()` de `lib/chain.ts`. Sin librerías de UI, CSS simple, mobile first, poco texto.

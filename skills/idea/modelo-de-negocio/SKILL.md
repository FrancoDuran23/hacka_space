---
name: modelo-de-negocio
description: Armar el modelo de negocio y la justificación de blockchain de una idea de hackathon: quién paga, quién cobra, cuánto, y el guion del pitch de 5 a 7 slides. Usar con una idea ya validada.
---

# Modelo de negocio y pitch

Entrada: idea validada (frase, dato, contrato, persona). Salida: modelo en una página y estructura del pitch.

## 1. Canvas mínimo

Completá solo esto, una línea por campo:

```
Categoría:
Problema local (quién sufre qué):
Dato real que usamos (API + campo):
Evento on-chain (cuando X, el contrato hace Y):
Quién paga / quién cobra:
Qué pasa si el dato miente:
Contrato mínimo (1 función clave):
Fuera de alcance (3 cosas):
```

## 2. Dinero

- **Quién paga**: una persona o rol concreto, no "la sociedad".
- **Por qué paga**: cuánto pierde hoy sin la solución (con fuente).
- **Cuánto**: un número y cómo lo calculaste. Ejemplo: prima de seguro paramétrico como porcentaje de la suma asegurada, comisión por pago liberado, suscripción por lote.
- **Quién cobra y cuándo**: el contrato libera el pago cuando se cumple la condición.
- **Costo de operar**: gas en Avalanche, relayer, datos (casi todos gratis).
- **Escala**: cuántos usuarios del NOA, y qué cambia si se repite en otra región.

Si no podés poner un número, escribí "supuesto" y por qué.

## 3. Por qué blockchain (la slide obligatoria)

Respondé las 4 preguntas en una sola pantalla:

1. Quién desconfía de quién.
2. Qué evento dispara la acción on-chain.
3. Qué pasa si el dato miente y cómo se resuelve.
4. Quién paga y quién cobra.

Agregá una línea de comparación: "con una base de datos común, [esto falla porque ...]".

Si usan L1 propia, justificala: validadores propios, reglas propias, gas propio. En este track las L1 dedicadas están bien vistas y se despliegan fácil desde la consola de Avalanche.

## 4. Pitch de 5 a 7 slides

1. Problema: una frase y una imagen real.
2. Persona y costo.
3. Solución: "cuando X, el contrato Y".
4. Demo: dato real, transacción, explorer.
5. Por qué blockchain (las 4 respuestas).
6. Modelo: quién paga, quién cobra, cuánto.
7. Próximos pasos y equipo.

## 5. Guion del video (1 a 3 min)

- 0:00 a 0:20 Problema: una frase y una imagen real.
- 0:20 a 1:10 Dato y contrato: dato real, transacción visible en el explorer.
- 1:10 a 1:40 Por qué blockchain: las 4 respuestas en una pantalla.

Tené una transacción confirmada de respaldo y grabá una prueba antes.

## Reglas

- Todo número con fuente o marcado como supuesto.
- Atribuí los datos usados (NASA, Copernicus, SMN, etc.) en una línea.
- Español directo, frases cortas. Nada de jerga vacía ("revolucionario", "disruptivo").

---
name: segundo-cerebro
description: Guarda en el segundo cerebro compartido del equipo (carpeta cerebro/ del repo, sincronizada por git) todo lo que alguien aporte durante la investigación previa de la hackatón — un link, un paper, un PDF, una imagen, un dato, una idea, una conclusión, un resumen de algo que leyó. Usar SIEMPRE que alguien comparta o encuentre algo de la investigación, aunque no pida guardarlo, y ANTES de empezar a investigar un tema, para ver si otro ya lo cubrió o lo está cubriendo. También cuando pregunten "qué sabemos de X", "quién está viendo Y" o pidan el estado de la investigación.
---

# Segundo cerebro del equipo

El cerebro vive en `cerebro/` dentro de este repo y se comparte por git (`origin/main`). Cada persona del equipo trabaja con su propio agente; lo que uno sube, el resto lo ve con un `git pull`. El objetivo es doble: **que nada de lo investigado se pierda** y **que no investiguemos dos veces lo mismo ni nos pisemos los archivos**.

```
cerebro/
  INDEX.md          una línea por nota (merge=union: nunca da conflicto)
  notas/            una nota por aporte, un archivo por nota
  adjuntos/         PDFs, imágenes, CSVs, lo que no es texto
  en-curso/         un archivo por tema que alguien está investigando ahora
```

La regla que evita pisarse: **cada aporte es un archivo nuevo con nombre único** (`fecha-hora-autor-slug`). Nadie reescribe la nota de otro; si hay que sumarle algo, se agrega una sección al final.

## 1. Sincronizar primero, siempre

```bash
git pull --rebase --autostash
```

Si falla por falta de red, seguí igual y avisá que el cerebro puede estar desactualizado.

## 2. Antes de investigar algo: ¿ya está?

Buscá el tema en lo que ya hay:

```bash
grep -ril "<palabra clave>" cerebro/INDEX.md cerebro/notas cerebro/en-curso
```

- **Ya hay una nota** → leela y decíselo a la persona ("esto ya lo subió Ana el martes, dice X"). Si lo nuevo agrega algo, se suma como sección a esa nota (ver paso 4b), no se crea un duplicado.
- **Alguien lo tiene en curso** (`cerebro/en-curso/`) → avisá quién y desde cuándo. Que la persona decida si se coordina con esa otra persona o toma otro ángulo. No lo tomes en silencio.
- **Nadie lo tiene** y la persona va a investigarlo un rato → reclamalo: creá `cerebro/en-curso/<autor>-<slug>.md` con una línea (`Franco investiga <tema> desde <fecha hora>. Ángulo: <qué busca>`) y subilo (paso 5). Se borra cuando la nota final está subida.

## 3. Quién es el autor

```bash
git config user.name
```

Para nombres de archivo usá el primer nombre en minúsculas y sin acentos (`franco`). Si no hay `user.name`, preguntalo una vez.

## 4a. Nota nueva

Archivo: `cerebro/notas/AAAA-MM-DD-HHMM-<autor>-<slug>.md` (slug corto, kebab-case, sin acentos). Usá la hora real (`date +%Y-%m-%d-%H%M`).

```markdown
---
titulo: <título claro, que se entienda sin abrir la nota>
autor: <nombre>
fecha: <AAAA-MM-DD HH:MM>
tema: <tema grande: p.ej. satelites, datos-abiertos, competencia, reglas-hackaton>
tags: [<tag>, <tag>]
tipo: link | paper | dato | idea | conclusion | resumen | pregunta | contacto
fuentes:
  - <URL o referencia exacta; "conversación con X" si no hay URL>
relacionadas: [<nombre-de-archivo-de-otra-nota>]
---

## Qué es
Dos o tres líneas: qué se encontró y por qué importa para la hackatón.

## Lo importante
- Los datos, cifras y hallazgos concretos, cada uno con su fuente.
- Distinguí lo que dice la fuente de lo que interpretamos nosotros ("**Interpretación:** ...").

## Preguntas abiertas
- Lo que queda por averiguar, si hay algo.
```

Reglas de contenido:
- Guardá **lo que la persona aportó**, ordenado y limpio, sin inventar ni completar con lo que "seguramente" dice la fuente. Si querés agregar contexto propio, marcalo como tal.
- Si la persona pegó un link y nada más, abrilo (si podés) y resumilo; si no podés abrirlo, guardá el link con lo que dijo la persona y marcá `## Preguntas abiertas: falta leerlo`.
- Una nota = un aporte o un tema chico. Si alguien vuelca cinco cosas distintas, son cinco notas.
- Nada de credenciales, tokens ni datos personales de terceros.

**Archivos** (PDF, imagen, planilla): copialos a `cerebro/adjuntos/` con el mismo prefijo que la nota (`2026-11-11-1530-franco-paper-sar.pdf`) y linkealos desde la nota con ruta relativa (`../adjuntos/...`). Si pesan más de ~20 MB, no los subas a git: guardá el link de donde está y avisá.

Después agregá **una línea al final** de `cerebro/INDEX.md` (solo agregar, nunca reordenar ni editar líneas de otros):

```
- AAAA-MM-DD · [Título](notas/<archivo>.md) · <autor> · <tema> — <resumen de una línea>
```

## 4b. Sumar a una nota existente

No reescribas el cuerpo de la nota de otra persona. Agregá al final:

```markdown
## Aporte de <autor> (<AAAA-MM-DD HH:MM>)
- ...
```

Y si corresponde, agregá el tag o la fuente nueva al frontmatter. No hace falta tocar `INDEX.md`.

## 5. Subir

Usá el script de esta skill; sube **solo** los archivos que le pasás (no se lleva otros cambios que la persona tenga sin commitear), hace `pull --rebase` y reintenta el push si otro subió algo en el medio:

```bash
skills/segundo-cerebro/subir.sh "cerebro: <título corto> (<autor>)" cerebro/notas/<archivo>.md cerebro/INDEX.md [cerebro/adjuntos/<archivo>] [cerebro/en-curso/<archivo>]
```

Para borrar un reclamo de `en-curso/` al terminar: `git rm` del archivo y pasalo igual en la lista de rutas.

Si el script termina con **conflicto**:
- `INDEX.md` no debería dar conflicto (está con `merge=union`). Si da, quedate con las líneas de ambos lados.
- En una nota: conservá el contenido de los dos lados, nunca descartes lo del otro. Después `git add <archivo> && git rebase --continue` y volvé a correr el script.
- Si no está claro cómo resolverlo, pará y mostrale el conflicto a la persona.

## 6. Contarle a la persona

Una o dos líneas: qué quedó guardado, dónde (`cerebro/notas/...`), y si encontraste algo relacionado o alguien trabajando en lo mismo. No repitas la nota entera.

## Consultas al cerebro

Para "qué sabemos de X" o "en qué está cada uno": `git pull`, leé `INDEX.md`, las notas que matcheen y `en-curso/`, y respondé citando qué nota dice qué y quién la subió. Si dos notas se contradicen, decilo.

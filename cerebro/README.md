# Segundo cerebro

Todo lo que el equipo encuentra en la investigación previa de la hackatón, en un solo lugar y sincronizado por git.

- `INDEX.md`: el índice, una línea por nota. Empezá por acá.
- `notas/`: una nota por aporte (`fecha-hora-autor-tema.md`).
- `adjuntos/`: PDFs, imágenes y archivos que acompañan a las notas.
- `en-curso/`: quién está investigando qué ahora mismo, para no hacer dos veces lo mismo.

La skill `skills/segundo-cerebro/SKILL.md` hace que el agente de cada uno (Claude, Codex, Cursor) haga todo esto solo: cuando compartís algo de la investigación lo guarda, lo indexa y lo sube. A mano: creá la nota, agregá su línea al final de `INDEX.md` y corré

```bash
skills/segundo-cerebro/subir.sh "cerebro: <título> (<tu nombre>)" cerebro/notas/<nota>.md cerebro/INDEX.md
```

Regla de oro: nunca reescribas la nota de otro; sumá una sección `## Aporte de <nombre>` al final.

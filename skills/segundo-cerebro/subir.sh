#!/usr/bin/env bash
# Sube al segundo cerebro solo las rutas indicadas, sin arrastrar otros cambios.
# Uso: subir.sh "mensaje de commit" ruta [ruta...]
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

msg="${1:?Uso: subir.sh \"mensaje\" ruta [ruta...]}"
shift
[ "$#" -gt 0 ] || { echo "Falta al menos una ruta para subir." >&2; exit 1; }

rama="$(git rev-parse --abbrev-ref HEAD)"
destino="${CEREBRO_RAMA:-main}"
if [ "$rama" != "$destino" ]; then
  echo "Estás en '$rama'. El cerebro se comparte en '$destino'." >&2
  echo "Cambiate a '$destino' (o exportá CEREBRO_RAMA=$rama si es a propósito)." >&2
  exit 1
fi

# Agrega altas/cambios/bajas de esas rutas y commitea solo esas rutas.
git add -A -- "$@"
if git diff --cached --quiet -- "$@"; then
  echo "Nada nuevo para subir."
else
  git commit -m "$msg" --only -- "$@"
fi

en_rebase() {
  [ -d "$(git rev-parse --git-path rebase-merge)" ] || [ -d "$(git rev-parse --git-path rebase-apply)" ]
}

for intento in 1 2 3 4 5; do
  if git pull --rebase --autostash origin "$destino"; then
    if git push origin "$destino"; then
      echo "Subido al cerebro ($destino)."
      exit 0
    fi
  elif en_rebase; then
    echo "CONFLICTO al rebasar. Archivos en conflicto:" >&2
    git diff --name-only --diff-filter=U >&2
    echo "Resolvé conservando lo de ambos lados, 'git add' y 'git rebase --continue', y volvé a correr este script." >&2
    exit 2
  fi
  echo "Reintentando ($intento/5)..." >&2
  sleep $((intento * 2))
done

echo "No se pudo subir después de 5 intentos (¿sin red o sin permisos de push?). El commit quedó local." >&2
exit 3

#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://localhost:8080"
BATCH_SIZE=10

# Choose opener
if command -v xdg-open >/dev/null 2>&1; then
  OPEN_CMD="xdg-open"
elif command -v open >/dev/null 2>&1; then
  OPEN_CMD="open"
else
  echo "No suitable opener found (need 'xdg-open' or 'open')." >&2
  exit 1
fi

# Collect immediate subfolders (sorted), robustly
mapfile -t FOLDERS < <(find . -mindepth 1 -maxdepth 1 -type d -printf "%f\n" 2>/dev/null | sort)

total=${#FOLDERS[@]}
if (( total == 0 )); then
  echo "No subfolders found."
  exit 0
fi

i=0
while (( i < total )); do
  end=$(( i + BATCH_SIZE ))
  (( end > total )) && end=$total

  echo
  echo "Opening folders $((i+1))-$end of $total"

  for (( j=i; j<end; j++ )); do
    folder="${FOLDERS[j]}"

    # URL encode folder name (python3), fallback to basic encoding if missing
    if command -v python3 >/dev/null 2>&1; then
      encoded="$(python3 - <<PY
import urllib.parse
print(urllib.parse.quote("$folder"))
PY
)"
    else
      encoded="${folder// /%20}"
    fi

    url="${BASE_URL}/${encoded}"
    echo "  $url"
    "$OPEN_CMD" "$url" >/dev/null 2>&1 || true
  done

  i=$end
  if (( i < total )); then
    printf "Press Enter to open next %d (or type q then Enter to quit): " "$BATCH_SIZE" > /dev/tty
    IFS= read -r ans < /dev/tty
    ans="${ans,,}"  # lowercase
    [[ "$ans" == "q" ]] && echo "Stopped." && break
  fi
done

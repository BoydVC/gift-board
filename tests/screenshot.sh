#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${GIFT_BOARD_PORT:-4324}"
CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser)"
mkdir -p screenshots dist
if [[ ! -f dist/gift-board.html ]]; then python3 build.py; fi
if ! ss -ltn | grep -q "127.0.0.1:$PORT "; then
  nohup python3 server.py > /tmp/gift-board-$PORT.log 2>&1 &
  sleep 1
fi
shot() {
  local url="$1" out="$2" size="$3"; shift 3 || true
  local prof; prof="$(mktemp -d /tmp/gbshot.XXXX)"
  "$CHROME" --headless=new --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --run-all-compositor-stages-before-draw --virtual-time-budget=28000 \
    --window-size="$size" --user-data-dir="$prof" --screenshot="$out" "$@" "$url" >/dev/null 2>&1
  rm -rf "$prof"; echo "  $out ($(wc -c < "$out") bytes)"
}
U="http://127.0.0.1:$PORT"
shot "file://$PWD/dist/gift-board.html#people" screenshots/00-best-home.png 1440,1100
shot "$U/#people" screenshots/00-desktop-people.png 1440,1000
shot "$U/#ideas" screenshots/01-ideas.png 1440,1000
shot "$U/#budget" screenshots/02-budget.png 1440,1000
shot "$U/#bought" screenshots/03-bought.png 1440,1000
shot "$U/#about" screenshots/04-about.png 1440,1000
shot "$U/#people" screenshots/05-phone.png 390,844 --user-agent="Mozilla/5.0 (iPhone)"
echo "screenshots done"

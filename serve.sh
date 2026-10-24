#!/bin/sh
# Serve Pixaquest on your Wi-Fi so another laptop can open it: http://<this-laptop-ip>:5177
cd "$(dirname "$0")" || exit 1
IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | cut -d' ' -f1)
echo "Open on this laptop:      http://localhost:5177"
echo "Open on the other laptop: http://${IP:-<your-ip>}:5177"
exec python3 -m http.server 5177 --bind 0.0.0.0

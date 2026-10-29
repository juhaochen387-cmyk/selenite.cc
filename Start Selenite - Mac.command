#!/bin/sh
cd -- "$(dirname -- "$0")"
if [ "$(uname -m)" = "arm64" ]; then
  exec "./Start Selenite - Mac Apple Silicon"
else
  exec "./Start Selenite - Mac Intel"
fi

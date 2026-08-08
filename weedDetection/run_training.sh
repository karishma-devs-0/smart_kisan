#!/usr/bin/env bash
# Runs a training task to completion, restarting after the out-of-memory kills
# that this machine produces when other applications are holding most of the
# 15 GB. train_weed_model.py checkpoints after every epoch and resumes from the
# saved cursor, so each restart continues rather than starting over.
#
# Usage: ./run_training.sh gog [max_attempts]
set -u

TASK="${1:-gog}"
MAX="${2:-12}"
PY="$(dirname "$0")/.venv/Scripts/python.exe"
SCRIPT="$(dirname "$0")/train_weed_model.py"

for attempt in $(seq 1 "$MAX"); do
  echo "=== [$TASK] attempt $attempt/$MAX ==="
  "$PY" "$SCRIPT" --task "$TASK" 2>&1 \
    | grep -vE "oneDNN|TF-TRT|cuda|WARNING:tensorflow|warnings.warn|WARNING:absl|tensorflow/c|Non-Converted|arith\.|\(f32|\(uq_8|Accepted dialects|Summary on"
  status=${PIPESTATUS[0]}

  if [ "$status" -eq 0 ]; then
    echo "=== [$TASK] completed on attempt $attempt ==="
    exit 0
  fi

  echo "--- [$TASK] exited $status; resuming from last checkpoint ---"
  sleep 5
done

echo "=== [$TASK] gave up after $MAX attempts ==="
exit 1

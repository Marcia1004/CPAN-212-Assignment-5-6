#!/bin/sh
set -e

OLLAMA_MODEL="${OLLAMA_MODEL:-mistral}"

echo "Starting Ollama server..."
ollama serve &
OLLAMA_PID=$!

echo "Waiting for Ollama API..."
until ollama list >/dev/null 2>&1; do
  sleep 2
done

echo "Ensuring model is available: ${OLLAMA_MODEL}"
ollama pull "${OLLAMA_MODEL}" || true

echo "Ollama is ready with model: ${OLLAMA_MODEL}"
wait "${OLLAMA_PID}"
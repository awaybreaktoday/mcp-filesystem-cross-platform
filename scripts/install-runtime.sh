#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE
Usage: ${0##*/} [--prefix <directory>] [--name <server-name>]

Installs the MCP server into /opt/mcp-servers/<name> by default.
  --prefix  Installation parent directory (default: /opt/mcp-servers)
  --name    Folder name for the installation (default: repository directory name)
USAGE
}

PREFIX="/opt/mcp-servers"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEFAULT_NAME="$(basename "$PROJECT_ROOT")"
SERVER_NAME="$DEFAULT_NAME"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prefix)
      [[ $# -lt 2 ]] && { echo "Missing value for --prefix" >&2; usage; exit 1; }
      PREFIX="$2"
      shift 2
      ;;
    --name)
      [[ $# -lt 2 ]] && { echo "Missing value for --name" >&2; usage; exit 1; }
      SERVER_NAME="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

TARGET_DIR="${PREFIX%/}/$SERVER_NAME"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required to install the server." >&2
  exit 1
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "Error: rsync is required to install the server." >&2
  exit 1
fi

printf 'Building project in %s\n' "$PROJECT_ROOT"
(
  cd "$PROJECT_ROOT"
  npm install
  npm run build
)

echo "Installing to $TARGET_DIR"
mkdir -p "$TARGET_DIR"

rsync -a --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.env' \
  "$PROJECT_ROOT"/ "$TARGET_DIR"/

npm ci --omit=dev --prefix "$TARGET_DIR"

echo "Installation complete. Runtime files are located in $TARGET_DIR"
echo "Add to your MCP configuration with:"
echo "  \"args\": [\"node\", \"$TARGET_DIR/dist/index.js\"]"

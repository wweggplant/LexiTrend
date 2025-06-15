#!/bin/bash

# 同步脚本：将WSL的dist目录同步到Windows
# 使用方法: ./scripts/sync-to-windows.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$SCRIPT_DIR/../dist"
WINDOWS_TARGET="/mnt/c/temp/lexitrend"

echo "🔄 Syncing LexiTrend extension to Windows..."

# 创建目标目录
mkdir -p "$WINDOWS_TARGET"

# 同步文件（删除目标中不存在于源的文件）
rsync -av --delete "$DIST_DIR/" "$WINDOWS_TARGET/"

echo "✅ Sync completed!"
echo "📁 Windows path: C:\\temp\\lexitrend"
echo "🚀 Load this directory in Chrome Extensions (Developer mode)" 
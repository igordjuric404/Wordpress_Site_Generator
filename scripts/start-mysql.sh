#!/bin/bash

# Helper script to start XAMPP MySQL
# This can be run manually if MySQL isn't starting automatically

MYSQL_SOCKET="/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock"
MYSQL_START="/Applications/XAMPP/xamppfiles/bin/mysql.server"

echo "Starting XAMPP MySQL..."

if [ -S "$MYSQL_SOCKET" ]; then
  echo "✓ MySQL is already running"
  exit 0
fi

if [ ! -f "$MYSQL_START" ]; then
  echo "✗ MySQL start script not found at $MYSQL_START"
  echo "  Please check your XAMPP installation"
  exit 1
fi

# Try without sudo first
if "$MYSQL_START" start 2>/dev/null; then
  sleep 2
  if [ -S "$MYSQL_SOCKET" ]; then
    echo "✓ MySQL started successfully"
    exit 0
  fi
fi

# If that didn't work, try with sudo
echo "Attempting to start MySQL (may require your password)..."
sudo "$MYSQL_START" start

sleep 2

if [ -S "$MYSQL_SOCKET" ]; then
  echo "✓ MySQL started successfully"
  exit 0
else
  echo "✗ Failed to start MySQL"
  echo ""
  echo "Alternative options:"
  echo "  1. Use XAMPP Control Panel:"
  echo "     - Search Spotlight for 'XAMPP'"
  echo "     - Click 'Start' next to MySQL"
  echo ""
  echo "  2. Check MySQL logs:"
  echo "     tail -f /Applications/XAMPP/xamppfiles/var/mysql/*.err"
  exit 1
fi

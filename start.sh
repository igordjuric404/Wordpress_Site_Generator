#!/bin/bash

# WordPress Site Generator - Single Command Startup Script
# This script starts XAMPP MySQL (if needed) and the development servers

# Don't exit on error - continue even if MySQL can't start
set +e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     WordPress Site Generator - Starting...           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if MySQL socket exists (MySQL is running)
MYSQL_SOCKET="/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock"

if [ -S "$MYSQL_SOCKET" ]; then
  echo -e "${GREEN}✓${NC} MySQL is already running"
else
  echo -e "${YELLOW}⚠${NC} MySQL is not running"
  
  # Try to start MySQL without sudo first
  if [ -f "/Applications/XAMPP/xamppfiles/bin/mysql.server" ]; then
    # Try without sudo (may work if permissions allow)
    if /Applications/XAMPP/xamppfiles/bin/mysql.server start 2>/dev/null; then
      sleep 2
      if [ -S "$MYSQL_SOCKET" ]; then
        echo -e "${GREEN}✓${NC} MySQL started successfully"
      fi
    else
      echo -e "${YELLOW}⚠${NC} Could not start MySQL automatically (requires sudo)"
      echo "   Please start MySQL manually:"
      echo "   Option 1: sudo /Applications/XAMPP/xamppfiles/bin/mysql.server start"
      echo "   Option 2: Use XAMPP Control Panel (search Spotlight for 'XAMPP')"
      echo ""
      echo -e "${YELLOW}⚠${NC} Continuing anyway - the app will work but site generation requires MySQL"
    fi
  else
    echo -e "${YELLOW}⚠${NC} XAMPP MySQL server script not found"
    echo "   Please start MySQL manually using XAMPP Control Panel"
  fi
fi

# Check if WP-CLI is installed
if command -v wp &> /dev/null; then
  echo -e "${GREEN}✓${NC} WP-CLI is installed"
else
  echo -e "${YELLOW}⚠${NC} WP-CLI not found. Install with: brew install wp-cli"
fi

echo ""
echo -e "${GREEN}Starting development servers...${NC}"
echo ""

# Start the dev servers (this will run concurrently)
npm start

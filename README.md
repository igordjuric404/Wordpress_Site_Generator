# WordPress Site Generator

A local web application for automated WordPress site generation with AI-powered content.

## 🚀 Quick Start - One Command

```bash
npm run start:all
```

That's it! This single command will:
1. ✅ Kill any processes on ports 3000 and 5173 (clean start)
2. ✅ Automatically start MySQL and Apache (via XAMPP)
3. ✅ Verify WP-CLI is installed
4. ✅ Start both Express backend and React frontend servers

The app will be available at:
- **Frontend**: http://localhost:5173 (or 5174 if 5173 is busy)
- **Backend API**: http://localhost:3000 (or next available port)

## Prerequisites

- **Node.js** 22.x LTS or higher
- **XAMPP** (or MAMP) installed
- **WP-CLI**: `brew install wp-cli`
- **Anthropic API Key** (optional, for AI content generation - add to `.env`)

## Configuration

The `.env` file is pre-configured for XAMPP. If using MAMP, update:
- `MYSQL_PORT=8889`
- `MYSQL_SOCKET=/Applications/MAMP/tmp/mysql/mysql.sock`
- `WEB_ROOT=/Applications/MAMP/htdocs`

## Other Commands

```bash
# Start MySQL only
npm run start:mysql

# Kill processes on ports 3000 and 5173
npm run kill-ports

# Start dev servers only (assumes MySQL is running)
npm start

# Type checking
npm run typecheck

# Build for production
npm run build
```

## How It Works

The `start:all` script uses multiple methods to start MySQL automatically:

1. **First**: Tries to start MySQL without sudo (sometimes works)
2. **Second**: Uses AppleScript to automate XAMPP Control Panel (no password!)
3. **Third**: Falls back to manual instructions if automation fails

If MySQL can't start automatically, the app will still launch - you'll just need to start MySQL manually before generating sites.

## Troubleshooting

### PHP Memory Exhausted Error
If you see `PHP Fatal error: Allowed memory size exhausted`:

**Solution**: Already fixed! The app automatically sets `PHP_MEMORY_LIMIT=512M` for WP-CLI operations.

If you still encounter issues, permanently increase PHP memory:
```bash
sudo nano /Applications/XAMPP/xamppfiles/etc/php.ini
# Change: memory_limit = 128M → memory_limit = 512M
# Then: sudo /Applications/XAMPP/xamppfiles/bin/apachectl restart
```

### MySQL Connection Issues
**MySQL won't start automatically?**
- The script will show instructions
- Or manually: Open XAMPP Control Panel → Click "Start" next to MySQL
- Or run: `npm run start:xampp`

**MySQL socket not found?**
- MySQL must be running for the socket to exist
- Start MySQL first, then the socket will appear

### Apache Not Running
- Check XAMPP Control Panel: Apache should show "Running"
- Test: Open http://localhost (should show XAMPP page)
- Try: `npm run start:xampp`

### Port Issues
**Ports already in use?**
- The app automatically finds alternative ports
- Or kill existing processes: `npm run kill-ports`

## Project Structure

```
wordpress-site-generator/
├── client/          # React frontend (Vite)
├── server/          # Express backend
├── shared/          # Shared TypeScript types
├── scripts/         # Utility scripts
└── data/           # SQLite database (auto-created)
```

## Features

- ✅ Automated WordPress installation via WP-CLI
- ✅ Real-time progress tracking with Server-Sent Events
- ✅ 10 industry-specific niche templates
- ✅ SQLite job persistence (survives restarts)
- ✅ Dry-run mode for testing
- ✅ Site cleanup/deletion
- ✅ **Fully automated MySQL startup**
- ✅ **Automatic port conflict handling**
- 🔜 AI content generation (Phase 2)
- 🔜 WooCommerce support (Phase 3)

## License

MIT

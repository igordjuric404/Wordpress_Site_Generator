# WordPress Site Generator - Quick Start

## 🚀 One Command Setup

```bash
npm run start:all
```

This automatically:
- ✓ Clears ports 3000 and 5173 (kills any running processes)
- ✓ Starts MySQL database server (Homebrew services, fallback to XAMPP/MAMP)
- ✓ Starts Apache web server (Homebrew services, fallback to XAMPP/MAMP)
- ✓ Starts Backend API (port 3000)
- ✓ Starts Frontend UI (port 5173)

## If Services Don't Start Automatically:

**Manual Start (Homebrew):**
```bash
brew services start mysql
brew services start httpd
```

**Manual Start (XAMPP):**
1. Press ⌘+Space (Spotlight)
2. Type "XAMPP"
3. Open XAMPP Control Panel
4. Click **Start** next to MySQL
5. Click **Start** next to Apache
6. Refresh your browser

## Verify Services

Check that both are running:
- MySQL socket: `ls /tmp/mysql.sock` (or your configured `MYSQL_SOCKET`)
- Apache test: Open `BASE_URL` (Homebrew default: http://localhost:8080)

## Full Command Reference

```bash
# Start everything (recommended)
npm run start:all

# Start XAMPP services only
npm run start:xampp

# Kill stuck processes on ports 3000/5173
npm run kill-ports

# Type checking
npm run typecheck
```

## After Starting

Open http://localhost:5174 (or the port shown in terminal) to use the app.

The System Status panel will show if MySQL and Apache are running correctly.

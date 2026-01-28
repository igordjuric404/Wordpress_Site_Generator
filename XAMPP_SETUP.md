# XAMPP Setup Guide

## Found Your XAMPP Installation

✅ **XAMPP Location**: `/Applications/XAMPP`
✅ **PHP**: `/Applications/XAMPP/xamppfiles/bin/php` (PHP 8.1.6)
✅ **MySQL Socket**: `/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock`
✅ **Web Root**: `/Applications/XAMPP/xamppfiles/htdocs`
✅ **MySQL Port**: `3306` (default)

## Starting XAMPP MySQL

### Option 1: Using XAMPP Control Panel
1. Open **XAMPP Control Panel** (search Spotlight for "XAMPP")
2. Click **Start** next to MySQL
3. Wait for the status to turn green

### Option 2: Using Command Line
```bash
sudo /Applications/XAMPP/xamppfiles/bin/mysql.server start
```

### Option 3: Start All Services
```bash
sudo /Applications/XAMPP/xamppfiles/xampp start
```

## Verify MySQL is Running

After starting MySQL, verify it's working:

```bash
# Check if MySQL socket exists
ls -la /Applications/XAMPP/xamppfiles/var/mysql/mysql.sock

# Test MySQL connection
/Applications/XAMPP/xamppfiles/bin/mysql -u root -e "SELECT 1;"
```

## Your .env File Configuration

Your `.env` file has been updated with XAMPP paths:
- ✅ MySQL Port: 3306
- ✅ MySQL Socket: `/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock`
- ✅ Web Root: `/Applications/XAMPP/xamppfiles/htdocs`
- ✅ PHP Path: `/Applications/XAMPP/xamppfiles/bin/php`

**Note**: XAMPP MySQL default password is empty (blank), not "root"

## Next Steps

1. **Start XAMPP MySQL** (see options above)
2. **Start the WordPress Site Generator**:
   ```bash
   npm start
   ```
3. **Open** http://localhost:5173 in your browser
4. Check the **System Status** panel - all checks should pass once MySQL is running

## Troubleshooting

**MySQL won't start?**
- Check if port 3306 is already in use: `lsof -i :3306`
- Check XAMPP error logs: `/Applications/XAMPP/xamppfiles/var/mysql/*.err`

**Socket file not found?**
- MySQL must be running for the socket file to exist
- Start MySQL first, then the socket will appear

**Permission errors?**
- You may need to run XAMPP commands with `sudo`
- Or fix permissions: `sudo chown -R _mysql:_mysql /Applications/XAMPP/xamppfiles/var/mysql`

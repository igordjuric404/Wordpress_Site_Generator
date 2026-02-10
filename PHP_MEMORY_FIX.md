# PHP Memory Limit Fix

## Problem
WordPress site generation failed with:
```
PHP Fatal error: Allowed memory size of 134217728 bytes exhausted
```

This happened during `wp core download` because:
- Default PHP memory limit: **128MB**
- WordPress download + extraction needs more memory
- WP-CLI exhausted memory during extraction

## Solution
Updated `server/services/wordpress.service.ts` to use `WP_CLI_PHP_ARGS` environment variable:

```typescript
// Increase PHP memory limit for WP-CLI operations
// WP-CLI uses PHP's -d flag to set ini directives
env.WP_CLI_PHP_ARGS = '-d memory_limit=1024M';
```

This tells WP-CLI to pass `-d memory_limit=1024M` to PHP, which overrides the php.ini setting for that specific command.

## How It Works
WP-CLI respects the `WP_CLI_PHP_ARGS` environment variable and passes its value directly to the PHP binary:
```bash
# Equivalent to running:
php -d memory_limit=1024M /path/to/wp-cli.phar core download
```

This ensures WP-CLI has enough memory for:
- Downloading WordPress (~20MB)
- Extracting the archive (~50MB uncompressed)
- Installing plugins and themes

## Test
After restarting the server with `npm run start:all`, creating a new site should work without memory errors.

## Alternative: Permanent Fix
Edit XAMPP's PHP config (requires sudo):

```bash
sudo nano /Applications/XAMPP/xamppfiles/etc/php.ini
```

Find and change:
```ini
memory_limit = 128M
```

To:
```ini
memory_limit = 1024M
```

Then restart Apache:
```bash
sudo /Applications/XAMPP/xamppfiles/bin/apachectl restart
```

**Note**: The `WP_CLI_PHP_ARGS` approach (already implemented) is preferred as it doesn't require editing system files or restarting Apache.

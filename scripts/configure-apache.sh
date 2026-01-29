#!/bin/bash

# Script to configure Apache for WordPress pretty permalinks
# This enables .htaccess support and mod_rewrite module

APACHE_CONFIG="/opt/homebrew/etc/httpd/httpd.conf"
BACKUP_CONFIG="/opt/homebrew/etc/httpd/httpd.conf.backup-$(date +%Y%m%d-%H%M%S)"

echo "🔧 Configuring Apache for WordPress permalinks..."

# Check if Apache config exists
if [ ! -f "$APACHE_CONFIG" ]; then
    echo "❌ Apache config not found at $APACHE_CONFIG"
    exit 1
fi

# Create backup
echo "📦 Creating backup at $BACKUP_CONFIG"
cp "$APACHE_CONFIG" "$BACKUP_CONFIG"

# Enable mod_rewrite if it's commented out
echo "✏️  Enabling mod_rewrite..."
sed -i '' 's/#LoadModule rewrite_module/LoadModule rewrite_module/' "$APACHE_CONFIG"

# Update AllowOverride None to AllowOverride All in the www directory section
echo "✏️  Updating AllowOverride setting..."
sed -i '' '/<Directory "\/opt\/homebrew\/var\/www">/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' "$APACHE_CONFIG"

# Verify the changes
REWRITE_ENABLED=$(grep "^LoadModule rewrite_module" "$APACHE_CONFIG")
OVERRIDE_ENABLED=$(grep -A 20 '<Directory "/opt/homebrew/var/www">' "$APACHE_CONFIG" | grep "AllowOverride All")

if [ -n "$REWRITE_ENABLED" ] && [ -n "$OVERRIDE_ENABLED" ]; then
    echo "✅ Apache configuration updated successfully"
    echo "   • mod_rewrite enabled"
    echo "   • AllowOverride enabled for /opt/homebrew/var/www"
    echo ""
    echo "🔄 Restarting Apache..."
    brew services restart httpd
    
    if [ $? -eq 0 ]; then
        echo "✅ Apache restarted successfully"
        echo ""
        echo "🎉 Clean permalinks are now enabled!"
        echo ""
        echo "To restore the backup if needed:"
        echo "  cp $BACKUP_CONFIG $APACHE_CONFIG"
        echo "  brew services restart httpd"
    else
        echo "❌ Failed to restart Apache"
        echo "Restoring backup..."
        cp "$BACKUP_CONFIG" "$APACHE_CONFIG"
        exit 1
    fi
else
    echo "❌ Failed to update configuration"
    echo "Restoring backup..."
    cp "$BACKUP_CONFIG" "$APACHE_CONFIG"
    exit 1
fi

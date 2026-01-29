# Active Context

Current focus:
- Phase 3 WooCommerce support is complete. Ready for testing.

Recent changes:
- Implemented WooCommerce e-commerce site generation:
  - WooCommerce plugin installation with required verification.
  - Automatic page creation (Shop, Cart, Checkout, My Account).
  - Onboarding wizard disabled for clean admin experience.
  - Placeholder product seeding by niche (categories + products via WC-CLI or WP-CLI fallback).
- Added theme selection UI with 5 themes and `/api/sites/themes` endpoint.
- Updated plugin configuration: WooCommerce-only for e-commerce (removed Stripe/PDF plugins).

Next steps:
- Test e-commerce site generation end-to-end.
- Validate WooCommerce setup creates all expected pages.
- Verify sample products appear on the Shop page.
- Verify standard (non-ecommerce) sites still generate correctly.


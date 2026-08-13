# Google Tag Manager (GTM) Setup

This document explains how Google Tag Manager is configured in the Bestiee application.

## Overview

Google Tag Manager is integrated at the root level (`src/app/layout.tsx`) and will load automatically on all pages of your application. The GTM ID is configurable via environment variables.

## Configuration

### 1. Environment Variables

The GTM ID is configured via the `NEXT_PUBLIC_GTM_ID` environment variable:

```env
NEXT_PUBLIC_GTM_ID=GTM-T2VLPQGS
```

- The variable is prefixed with `NEXT_PUBLIC_` so it's available in the browser
- Copy `.env.example` to `.env.local` (or `.env`) and update the GTM ID
- Update `.env.example` to document what variables are needed

### 2. Implementation Details

**GTM Script** (`src/app/layout.tsx`):
- Uses Next.js `Script` component with `afterInteractive` strategy
- Loads the GTM script asynchronously after the page becomes interactive
- Only loads if `NEXT_PUBLIC_GTM_ID` is defined

**GTM Fallback** (noscript):
- Provides fallback tracking for users with JavaScript disabled
- Automatically uses the GTM ID from environment variables

## Usage

### Tracking Events

Use the utility functions in `src/utils/gtm.ts` to track events:

#### 1. Track Page Views
```tsx
import { trackPageView } from '@/utils/gtm';

useEffect(() => {
  trackPageView('/products', 'Products Page');
}, []);
```

#### 2. Track Custom Events
```tsx
import { trackCustomEvent } from '@/utils/gtm';

const handleProductClick = (productId: string) => {
  trackCustomEvent('engagement', 'product_click', productId);
};
```

#### 3. Track Conversions/Purchases
```tsx
import { trackPurchase } from '@/utils/gtm';

const handleCheckout = async (items, total) => {
  trackPurchase('ORDER-12345', total, items);
};
```

#### 4. Track User Signups
```tsx
import { trackSignup } from '@/utils/gtm';

const handleSignup = async (user) => {
  trackSignup(user.id, user.email);
};
```

#### 5. Track Logins
```tsx
import { trackLogin } from '@/utils/gtm';

const handleLogin = async (user) => {
  trackLogin(user.id);
};
```

### Custom Events via dataLayer

For more advanced tracking, you can push directly to the GTM dataLayer:

```tsx
import { trackEvent } from '@/utils/gtm';

trackEvent({
  event: 'customEvent',
  eventCategory: 'ecommerce',
  eventAction: 'add_to_cart',
  eventLabel: 'Premium Pack',
  value: 99.99,
});
```

## Configuring GTM in Google Analytics/GTM Console

1. Go to [Google Tag Manager](https://tagmanager.google.com/)
2. Open your GTM account (GTM-T2VLPQGS)
3. Set up tags and triggers for the events you're tracking
4. Common configurations:
   - Page view tracking (automatic)
   - Event tracking for button clicks
   - E-commerce tracking for purchases
   - User signup/login tracking

## Testing

### 1. GTM Preview Mode
- In your GTM console, click "Preview" to enable preview mode
- Visit your site and you'll see the GTM preview panel
- Verify events are firing correctly

### 2. Browser DevTools
- Open your browser's Network tab and search for `gtm.js`
- Check that the GTM script loads from `www.googletagmanager.com`
- Look for `dataLayer` in your browser console:
  ```javascript
  console.log(window.dataLayer);
  ```

### 3. Google Analytics Real-time
- If you've linked Google Analytics to GTM, check the Real-time view
- Verify that page views and events are appearing

## Best Practices

1. **Only Collect Necessary Data**: Only track events that provide business value
2. **User Privacy**: Be transparent about what data you're collecting
3. **Use Environment Variables**: Never hardcode GTM IDs in your code
4. **Consistent Naming**: Use consistent event names and categories across your app
5. **Test Before Deploying**: Always test GTM in preview mode before going live
6. **Document Custom Events**: Keep track of all custom events you implement

## Troubleshooting

### GTM not loading
- Check that `NEXT_PUBLIC_GTM_ID` is set in your environment
- Verify the GTM ID format (should be `GTM-XXXXXXXXX`)
- Check browser console for errors

### Events not appearing in GTM
- Make sure you're calling the tracking functions correctly
- Verify the event names match your GTM configuration
- Check GTM preview mode to see if data is arriving at the container
- Check that JavaScript is enabled in your browser

### Performance concerns
- GTM is loaded asynchronously with `afterInteractive` strategy
- It should not significantly impact page load performance
- Monitor with Lighthouse or Google PageSpeed Insights

## Resources

- [Google Tag Manager Documentation](https://support.google.com/tagmanager)
- [GTM Web Implementation Guide](https://developers.google.com/tag-platform/tag-manager/web)
- [Next.js Script Component](https://nextjs.org/docs/app/api-reference/components/script)

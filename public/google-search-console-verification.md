# Google Search Console Verification Instructions

## When Google Search Console asks for verification:

### Option 1: HTML File Upload (Recommended)

1. Google will provide you with an HTML file (e.g., `google1234567890abcdef.html`)
2. Download this file
3. Place it in your `/public` folder alongside robots.txt
4. Deploy your changes
5. Click "Verify" in Google Search Console

### Option 2: HTML Tag Method (Alternative)

1. Google will provide you with a meta tag like:
   `<meta name="google-site-verification" content="abc123..." />`
2. Add this to the <head> section of your main layout
3. Deploy your changes
4. Click "Verify" in Google Search Console

### Option 3: DNS Verification (If you have DNS access)

1. Add the TXT record Google provides to your DNS settings
2. Wait for DNS propagation (can take up to 24 hours)
3. Click "Verify" in Google Search Console

## After Verification:

- Come back here and let me know verification is complete
- We'll then submit your sitemap to Google

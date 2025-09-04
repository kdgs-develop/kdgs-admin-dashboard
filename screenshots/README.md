# Screenshots Documentation

This folder contains screenshots for the KDGS Genealogy Platform documentation.

## 📁 Folder Structure

```
screenshots/
├── admin-dashboard/     # Screenshots for the admin dashboard (11 files)
├── public-search/       # Screenshots for the public search page (11 files)
├── create-placeholders.sh # Script to regenerate placeholders
└── README.md           # This documentation file
```

## 📸 Screenshot Guidelines

### File Naming Convention

All screenshots should be saved as PNG files with descriptive, lowercase names using hyphens:

```
Format: feature-description.png
Examples:
- admin-login-page.png
- dashboard-main-interface.png
- obituaries-table-view.png
- search-homepage.png
- shopping-cart-interface.png
```

### Image Specifications

- **Format**: PNG (preferred) or JPG
- **Resolution**: 1920x1080 or higher (full HD minimum)
- **Quality**: High quality, clear text and UI elements
- **Browser**: Latest Chrome/Firefox with developer tools closed

### Best Practices

- Capture the entire viewport when possible
- Ensure all text is readable
- Remove any sensitive data from screenshots
- Use consistent browser window size
- Include relevant UI states (hover effects, form validations, etc.)

## 📋 Required Screenshots

### Admin Dashboard (`admin-dashboard/`)

#### Authentication

- `admin-login-page.png` - Modern two-column login page with branding and features

#### Dashboard Overview

- `dashboard-main-interface.png` - Main dashboard with navigation and statistics

#### Obituary Management

- `obituaries-table-view.png` - Obituaries management table with search/filtering
- `add-obituary-form.png` - New obituary creation form
- `edit-obituary-details.png` - Detailed obituary editing interface

#### Image Management System

- `images-management-table.png` - Image files table with management options
- `bulk-image-upload.png` - Bulk upload dialog with drag-and-drop
- `image-rotation-editing.png` - Image editing tools (rotation, rename)

#### User Management

- `user-roles-management.png` - User roles and permissions interface
- `add-new-user-form.png` - New user creation form with role selection

#### Reports and Analytics

- `pdf-report-generation.png` - PDF generation interface with preview

### Public Search Page (`public-search/`)

#### Search Interface

- `search-homepage.png` - Homepage with search tips and collection info
- `advanced-search-form.png` - Complete search form with all filter options
- `alphabetical-browse.png` - Alphabetical surname browsing interface

#### Search Results

- `search-results-page.png` - Search results with pagination
- `detailed-result-view.png` - Individual obituary detail view

#### E-Commerce Features

- `shopping-cart-interface.png` - Shopping cart with selected items
- `stripe-payment-form.png` - Stripe payment processing interface

#### Purchase Success

- `payment-success-page.png` - Payment confirmation page
- `download-interface.png` - File download interface for purchased content

#### Contact Forms

- `feedback-form.png` - User feedback and support form
- `new-obituary-request-form.png` - Request form for missing obituaries
- `volunteer-interest-form.png` - Volunteer interest submission form

## 🛠️ Taking Screenshots

### Browser Setup

1. Open browser in full screen mode
2. Set zoom level to 100%
3. Disable browser extensions that might interfere
4. Ensure consistent window size across screenshots

### Capture Process

1. Navigate to the specific page/feature
2. Wait for all content to load completely
3. Use browser's built-in screenshot tools or extensions like:
   - Chrome DevTools (F12 → Device Toolbar → Capture screenshot)
   - Firefox Developer Tools
   - Browser extensions (Lightshot, Nimbus, etc.)

### Post-Processing

1. Crop if necessary to focus on relevant content
2. Ensure text is sharp and readable
3. Save in PNG format with the exact filename from this guide
4. Place in the appropriate subfolder

## 📝 Notes

- Screenshots should represent the current state of the application
- Update screenshots when significant UI changes occur
- Maintain consistent styling and branding across all screenshots
- Include both desktop and mobile views where relevant (future enhancement)

## 🔄 Update Process

When updating screenshots:

1. Check this README for the current required screenshots
2. Take new screenshots following the naming convention
3. Replace old files with new ones
4. Update this README if new screenshots are needed

---

**Last Updated**: December 2024
**Platform**: KDGS Genealogy Platform
**Contact**: For questions about screenshots, contact the development team.

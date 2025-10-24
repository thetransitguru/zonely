# API Serverless Functions

This directory contains serverless functions for the Zonely application.

## Functions

### `generate-pdf.js`

Generates a comprehensive PDF report for NYC properties using Puppeteer.

**Endpoint:** `POST /api/generate-pdf`

**Request Body:**
```json
{
  "propertyData": {
    "address": "350 5TH AVENUE",
    "borough": "Manhattan",
    "block": "843",
    "lot": "1",
    "bbl": "1008430001",
    "zoning": { ... },
    "building": { ... },
    "lot": { ... },
    "development": { ... }
  },
  "buildableInfo": {
    "maxBuildable": 175000,
    "remaining": 0,
    "utilized": 100,
    "currentBuiltFAR": 21.86,
    "maxAllowedFAR": 15.0
  }
}
```

**Response:**
- **Content-Type:** `application/pdf`
- **Content-Disposition:** `attachment; filename="NYC-Property-Report-{BBL}.pdf"`
- Returns a binary PDF file

**Error Responses:**
- `405`: Method not allowed (use POST)
- `400`: Missing property data
- `500`: PDF generation failed

## Local Development

To test the PDF generation locally, you'll need Chrome/Chromium installed on your system.

```bash
# Ensure Chrome is installed (for Puppeteer)
# On Ubuntu/Debian:
sudo apt-get install chromium-browser

# On macOS:
brew install chromium
```

## Deployment

### Vercel

This function is configured for Vercel deployment with the following settings:

- **Memory:** 1024 MB
- **Max Duration:** 30 seconds
- **Runtime:** Node.js (automatic detection from package.json)

**Deploy to Vercel:**
```bash
npm install -g vercel
vercel --prod
```

### Environment Variables

No environment variables are required for the PDF generation function. All data is passed in the request body.

## Puppeteer Configuration

For serverless deployments, Puppeteer is configured with:
- Headless mode enabled
- No sandbox (required for serverless environments)
- Reduced GPU usage
- Minimal memory footprint

## PDF Output

The generated PDF includes:
1. **Cover Page** - Property summary and key details
2. **Property Information** - Location, BBL, land use
3. **Zoning Analysis** - Zoning districts, FAR, overlays
4. **Building Details** - Building and lot characteristics
5. **Development Potential** - Buildable area analysis
6. **Transit Access** - Transportation options (placeholder)
7. **Resources** - NYC agency links and next steps

**Format:** Letter size (8.5" x 11")
**Margins:** 20mm top/bottom, 15mm left/right
**Pages:** Typically 6-7 pages depending on property data

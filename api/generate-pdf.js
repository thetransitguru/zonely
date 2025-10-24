/**
 * Serverless Function: Generate PDF Opportunity Snapshot
 *
 * Generates a one-page "Opportunity Snapshot" PDF report for NYC properties.
 * This is the NEW production template based on the product strategy blueprint.
 *
 * Environment Setup for Deployment:
 * - Vercel: Use @vercel/build-utils or puppeteer-core with chrome-aws-lambda
 * - For local dev: Ensure Chrome/Chromium is installed
 *
 * Request Body:
 * {
 *   enrichedData: { ...complete enriched property data from enrichmentService... }
 * }
 */

import puppeteer from 'puppeteer'

/**
 * Main handler function for the serverless endpoint
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  try {
    const { enrichedData } = req.body

    if (!enrichedData || !enrichedData.success) {
      return res.status(400).json({ error: 'Valid enriched property data is required' })
    }

    // Generate HTML for the PDF
    const htmlContent = generateOpportunitySnapshotHTML(enrichedData)

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    })

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    // Generate PDF with options (Letter size, one page)
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '12mm',
        right: '12mm',
        bottom: '12mm',
        left: '12mm',
      },
    })

    await browser.close()

    // Set headers and return PDF
    const filename = `Zonely-OpportunitySnapshot-${enrichedData.bbl || enrichedData.report_id}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', pdfBuffer.length)

    return res.status(200).send(pdfBuffer)
  } catch (error) {
    console.error('PDF Generation Error:', error)
    return res.status(500).json({
      error: 'Failed to generate PDF report',
      message: error.message,
    })
  }
}

/**
 * Generate complete HTML for the one-page Opportunity Snapshot PDF
 */
function generateOpportunitySnapshotHTML(data) {
  const reportDate = new Date(data.generated_at || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NYC Opportunity Snapshot - ${data.address}</title>
  <style>
    ${getSnapshotStyles()}
  </style>
</head>
<body>
  <div class="page">
    ${generateHeader(data, reportDate)}
    ${generateMainContent(data)}
    ${generateFooter(data)}
  </div>
</body>
</html>
  `
}

/**
 * CSS Styles for the one-page Opportunity Snapshot
 * Optimized for dense, scannable layout
 */
function getSnapshotStyles() {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      color: #1f2937;
      font-size: 9pt;
      line-height: 1.3;
    }

    .page {
      width: 100%;
      padding: 0;
    }

    /* Header */
    .header {
      border-bottom: 3px solid #0284c7;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 6px;
    }

    .logo {
      font-size: 18pt;
      font-weight: bold;
      color: #0284c7;
      letter-spacing: -0.5px;
    }

    .report-id {
      font-size: 7pt;
      color: #6b7280;
      text-align: right;
    }

    .title {
      font-size: 16pt;
      font-weight: bold;
      color: #111827;
      margin-bottom: 4px;
    }

    .address-line {
      font-size: 11pt;
      color: #374151;
      margin-bottom: 4px;
    }

    .meta-row {
      display: flex;
      gap: 20px;
      font-size: 7pt;
      color: #6b7280;
    }

    /* Main Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }

    .section {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 8px;
    }

    .section-title {
      font-size: 8pt;
      font-weight: bold;
      color: #0369a1;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 6px;
      padding-bottom: 3px;
      border-bottom: 1px solid #cbd5e1;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-size: 7pt;
      color: #6b7280;
      font-weight: 500;
    }

    .info-value {
      font-size: 8pt;
      color: #111827;
      font-weight: 600;
      text-align: right;
    }

    .info-value-large {
      font-size: 14pt;
      color: #0284c7;
      font-weight: bold;
    }

    /* Formula Box */
    .formula-box {
      background: #eff6ff;
      border: 1px dashed #0284c7;
      border-radius: 3px;
      padding: 6px;
      margin: 6px 0;
      font-size: 7pt;
      font-family: 'Courier New', monospace;
    }

    /* Assumptions Box */
    .assumptions-box {
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
      padding: 5px 6px;
      margin: 6px 0;
      font-size: 6.5pt;
      color: #92400e;
    }

    /* Badge */
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 6.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .badge-green {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #10b981;
    }

    .badge-yellow {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #f59e0b;
    }

    .badge-red {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #ef4444;
    }

    .badge-gray {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #9ca3af;
    }

    /* Full-width sections */
    .section-full {
      grid-column: 1 / -1;
    }

    .section-two-thirds {
      grid-column: span 2;
    }

    /* Flags list */
    .flags-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .flags-list li {
      padding: 3px 0 3px 12px;
      position: relative;
      font-size: 7pt;
      line-height: 1.4;
      color: #374151;
    }

    .flags-list li:before {
      content: '▸';
      position: absolute;
      left: 0;
      color: #0284c7;
      font-weight: bold;
    }

    /* Transit summary */
    .transit-summary {
      display: flex;
      gap: 8px;
      margin: 6px 0;
    }

    .transit-score {
      flex: 0 0 auto;
      text-align: center;
      padding: 6px;
      background: #eff6ff;
      border-radius: 4px;
    }

    .transit-score-value {
      font-size: 16pt;
      font-weight: bold;
      color: #0284c7;
      line-height: 1;
    }

    .transit-score-label {
      font-size: 6pt;
      color: #6b7280;
      text-transform: uppercase;
    }

    .transit-details {
      flex: 1;
      font-size: 7pt;
    }

    /* Lines pills */
    .lines-container {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
      margin: 4px 0;
    }

    .line-pill {
      display: inline-block;
      padding: 2px 5px;
      background: #111827;
      color: white;
      border-radius: 2px;
      font-size: 6.5pt;
      font-weight: bold;
      font-family: 'Arial Narrow', sans-serif;
    }

    /* Footer */
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 6px;
      margin-top: 10px;
      font-size: 6pt;
      color: #9ca3af;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .disclaimer {
      flex: 1;
      font-size: 5.5pt;
      line-height: 1.4;
    }

    .sources {
      text-align: right;
      font-size: 6pt;
    }

    /* Utility */
    .text-center {
      text-align: center;
    }

    .mb-4 {
      margin-bottom: 4px;
    }

    .mb-6 {
      margin-bottom: 6px;
    }

    .bold {
      font-weight: bold;
    }

    .text-sm {
      font-size: 7pt;
    }
  `
}

/**
 * Generate header section
 */
function generateHeader(data, reportDate) {
  return `
    <div class="header">
      <div class="header-top">
        <div class="logo">ZONELY</div>
        <div class="report-id">
          Report ID: ${data.report_id}<br/>
          Generated: ${reportDate}
        </div>
      </div>
      <h1 class="title">NYC Zoning & Development Opportunity Snapshot</h1>
      <div class="address-line">${data.address}</div>
      <div class="meta-row">
        <span><strong>BBL:</strong> ${data.bbl}</span>
        <span><strong>Block:</strong> ${data.block} <strong>Lot:</strong> ${data.lot}</span>
        <span><strong>Borough:</strong> ${data.borough}</span>
        <span><strong>PLUTO:</strong> ${data.datasets.pluto_version || 'N/A'}</span>
        <span><strong>MTA GTFS:</strong> ${data.datasets.mta_gtfs_date || 'N/A'}</span>
        <span><strong>FEMA FIRM:</strong> ${data.datasets.fema_firm_effective || 'N/A'}</span>
      </div>
    </div>
  `
}

/**
 * Generate main content sections
 */
function generateMainContent(data) {
  return `
    <div class="content-grid">
      ${generatePropertyBasics(data)}
      ${generateZoningAndCapacity(data)}
      ${generateConstraintsAndFlags(data)}
      ${generateTransitAccess(data)}
      ${generateEnvironmental(data)}
      ${generateRedFlagsAndToDo(data)}
    </div>
  `
}

/**
 * Section A: Property Basics
 */
function generatePropertyBasics(data) {
  const lotInfo = data.lot_info || {}
  const building = data.building || {}

  return `
    <div class="section">
      <h2 class="section-title">A. Property Basics</h2>
      <div class="info-row">
        <span class="info-label">Lot Area</span>
        <span class="info-value">${(lotInfo.area_sqft || 0).toLocaleString()} sq ft</span>
      </div>
      <div class="info-row">
        <span class="info-label">Dimensions</span>
        <span class="info-value">${lotInfo.dimensions || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Corner Lot</span>
        <span class="info-value">${lotInfo.corner_lot ? 'Yes ✓' : 'No'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Irregular Shape</span>
        <span class="info-value">${lotInfo.irregular ? 'Yes' : 'No'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Building Class</span>
        <span class="info-value">${building.class || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Year Built</span>
        <span class="info-value">${building.year_built || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Stories</span>
        <span class="info-value">${building.stories || 'N/A'}</span>
      </div>
    </div>
  `
}

/**
 * Section B: Zoning & Capacity (spans 2 columns)
 */
function generateZoningAndCapacity(data) {
  const zoning = data.zoning || {}
  const capacity = data.capacity || {}
  const lotArea = data.lot_info?.area_sqft || 0

  // Format overlays
  const overlaysText = zoning.overlays && zoning.overlays.length > 0
    ? zoning.overlays.join(', ')
    : 'None'

  // Format special districts
  const specialDistrictsText = zoning.special_districts && zoning.special_districts.length > 0
    ? zoning.special_districts.join(', ')
    : 'None'

  // Confidence badge
  let confidenceBadge = 'badge-gray'
  if (capacity.confidence === 'high') confidenceBadge = 'badge-green'
  else if (capacity.confidence === 'medium') confidenceBadge = 'badge-yellow'
  else if (capacity.confidence === 'low') confidenceBadge = 'badge-red'

  // Calculate percentages
  const utilizationPct = capacity.utilization_pct || 0
  const unusedPct = Math.max(0, 100 - utilizationPct)

  return `
    <div class="section section-two-thirds">
      <h2 class="section-title">B. Zoning & Development Capacity</h2>

      <div class="info-row">
        <span class="info-label">Zoning District</span>
        <span class="info-value bold">${zoning.district || 'Not Zoned'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Overlays</span>
        <span class="info-value">${overlaysText}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Special Districts</span>
        <span class="info-value text-sm">${specialDistrictsText}</span>
      </div>

      <div class="formula-box">
        <strong>By-Right Potential Formula:</strong> Lot Area × Base FAR<br/>
        ${lotArea.toLocaleString()} sq ft × ${(capacity.base_far || 0).toFixed(2)} = ${(capacity.max_gfa_sqft || 0).toLocaleString()} sq ft max
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin: 6px 0;">
        <div style="text-align: center;">
          <div class="info-value-large">${(capacity.max_gfa_sqft || 0).toLocaleString()}</div>
          <div class="info-label">Max GFA</div>
        </div>
        <div style="text-align: center;">
          <div class="info-value-large">${(capacity.existing_gfa_sqft || 0).toLocaleString()}</div>
          <div class="info-label">Existing</div>
        </div>
        <div style="text-align: center;">
          <div class="info-value-large" style="color: ${capacity.unused_dev_rights_sqft > 0 ? '#059669' : '#dc2626'};">
            ${(capacity.unused_dev_rights_sqft || 0).toLocaleString()}
          </div>
          <div class="info-label">Unused Rights</div>
        </div>
      </div>

      <div class="assumptions-box">
        <strong>Assumptions:</strong> Based on base FAR. Does not account for: height/setback bonuses, MIH/IH requirements, lot coverage limits, or bulk regulations. Professional architect review required.
      </div>

      <div style="text-align: right; margin-top: 4px;">
        <span class="badge ${confidenceBadge}">Confidence: ${capacity.confidence || 'N/A'}</span>
      </div>
    </div>
  `
}

/**
 * Section C: Constraints & Flags
 */
function generateConstraintsAndFlags(data) {
  const special = data.special_designations || {}
  const env = data.environmental || {}

  return `
    <div class="section">
      <h2 class="section-title">C. Constraints</h2>

      <div class="info-row">
        <span class="info-label">MIH/IH Required</span>
        <span class="info-value">${special.mih_required ? 'Yes' : 'Check zoning'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">E-Designations</span>
        <span class="info-value">${env.e_designations && env.e_designations.length > 0 ? env.e_designations.join(', ') : 'None'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Landmark</span>
        <span class="info-value text-sm">${special.landmark || 'No'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Historic District</span>
        <span class="info-value text-sm">${special.historic_district || 'No'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Special Districts</span>
        <span class="info-value text-sm">${special.special_districts && special.special_districts.length > 0 ? special.special_districts.length : 'None'}</span>
      </div>
    </div>
  `
}

/**
 * Section D: Transit Access
 */
function generateTransitAccess(data) {
  const transit = data.transit || {}
  const lines = transit.lines || []

  // Generate line pills
  const linePills = lines.slice(0, 8).map(line => `<span class="line-pill">${line}</span>`).join('')
  const moreLines = lines.length > 8 ? ` +${lines.length - 8} more` : ''

  return `
    <div class="section section-two-thirds">
      <h2 class="section-title">D. Transit Access</h2>

      <div class="transit-summary">
        <div class="transit-score">
          <div class="transit-score-value">${transit.score || 0}</div>
          <div class="transit-score-label">Transit<br/>Score</div>
        </div>
        <div class="transit-details">
          <div class="info-row">
            <span class="info-label">Rating</span>
            <span class="info-value">${transit.score_rating || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Stations within 10 min walk</span>
            <span class="info-value">${transit.stations_within_10min || 0}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total stops in radius</span>
            <span class="info-value">${transit.total_stops_in_radius || 0}</span>
          </div>
        </div>
      </div>

      ${lines.length > 0 ? `
      <div>
        <div class="info-label mb-4">Accessible Lines:</div>
        <div class="lines-container">
          ${linePills}${moreLines}
        </div>
      </div>
      ` : ''}

      <div style="margin-top: 6px; font-size: 7pt; color: #6b7280;">
        ${transit.summary || 'No nearby transit data available'}
      </div>
    </div>
  `
}

/**
 * Section E: Environmental & Risk
 */
function generateEnvironmental(data) {
  const env = data.environmental || {}

  let floodBadge = 'badge-gray'
  if (env.risk_level === 'High' || env.in_sfha) floodBadge = 'badge-red'
  else if (env.risk_level === 'Moderate') floodBadge = 'badge-yellow'
  else if (env.risk_level === 'Low' || env.flood_zone === 'X') floodBadge = 'badge-green'

  return `
    <div class="section">
      <h2 class="section-title">E. Environmental & Risk</h2>

      <div class="info-row">
        <span class="info-label">Flood Zone</span>
        <span class="info-value bold">${env.flood_zone || 'Unknown'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Risk Level</span>
        <span class="info-value">
          <span class="badge ${floodBadge}">${env.risk_level || 'Unknown'}</span>
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">In SFHA</span>
        <span class="info-value">${env.in_sfha ? 'Yes' : 'No'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">FIRM Panel</span>
        <span class="info-value text-sm">${env.firm_panel || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Flood Insurance</span>
        <span class="info-value">${env.flood_insurance_required ? 'Required' : 'Optional'}</span>
      </div>
    </div>
  `
}

/**
 * Section F: Red Flags & To-Do (full width)
 */
function generateRedFlagsAndToDo(data) {
  const flags = data.flags || []
  const flagsHTML = flags.map(flag => `<li>${flag}</li>`).join('')

  return `
    <div class="section section-full">
      <h2 class="section-title">F. Red Flags & Due Diligence To-Do</h2>
      <ul class="flags-list">
        ${flagsHTML || '<li>No flags generated</li>'}
      </ul>
    </div>
  `
}

/**
 * Generate footer section
 */
function generateFooter(data) {
  return `
    <div class="footer">
      <div class="footer-content">
        <div class="disclaimer">
          <strong>DISCLAIMER:</strong> This report is for informational purposes only and does not constitute legal, financial, or professional advice.
          Data sourced from NYC PLUTO (${data.datasets.pluto_version}), MTA GTFS (${data.datasets.mta_gtfs_date}), and FEMA NFHL.
          Always verify critical information with official agencies and consult licensed professionals before making property decisions.
        </div>
        <div class="sources">
          <strong>ZONELY</strong><br/>
          zonely.app<br/>
          Report ID: ${data.report_id}
        </div>
      </div>
    </div>
  `
}

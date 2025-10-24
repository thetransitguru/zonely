/**
 * Serverless Function: Generate PDF Report
 *
 * This function generates a comprehensive PDF report for NYC properties
 * using property data from PLUTO and other sources.
 *
 * Environment Setup for Deployment:
 * - Vercel: Use @vercel/build-utils or puppeteer-core with chrome-aws-lambda
 * - For local dev: Ensure Chrome/Chromium is installed
 *
 * Request Body:
 * {
 *   propertyData: { ...PLUTO data object... },
 *   buildableInfo: { ...buildable area calculations... }
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
    const { propertyData, buildableInfo } = req.body

    if (!propertyData) {
      return res.status(400).json({ error: 'Property data is required' })
    }

    // Generate HTML for the PDF
    const htmlContent = generateReportHTML(propertyData, buildableInfo)

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

    // Generate PDF with options
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    })

    await browser.close()

    // Set headers and return PDF
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="NYC-Property-Report-${propertyData.bbl || 'Report'}.pdf"`
    )
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
 * Generate complete HTML for the PDF report
 */
function generateReportHTML(propertyData, buildableInfo) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NYC Zoning & Transit Report - ${propertyData.address}</title>
  <style>
    ${getReportStyles()}
  </style>
</head>
<body>
  ${generateCoverPage(propertyData, currentDate)}
  ${generatePropertyInfoPage(propertyData)}
  ${generateZoningAnalysisPage(propertyData, buildableInfo)}
  ${generateBuildingDetailsPage(propertyData)}
  ${generateDevelopmentPotentialPage(propertyData, buildableInfo)}
  ${generateTransitAccessPage(propertyData)}
  ${generateResourcesPage(propertyData)}
</body>
</html>
  `
}

/**
 * CSS Styles for the PDF Report
 */
function getReportStyles() {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #1f2937;
      line-height: 1.6;
      font-size: 11pt;
    }

    .page {
      page-break-after: always;
      padding: 20px 0;
    }

    .page:last-child {
      page-break-after: auto;
    }

    /* Cover Page */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 900px;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: white;
      text-align: center;
      padding: 60px 40px;
    }

    .cover-title {
      font-size: 36pt;
      font-weight: bold;
      margin-bottom: 20px;
      line-height: 1.2;
    }

    .cover-address {
      font-size: 24pt;
      margin-bottom: 40px;
      opacity: 0.95;
    }

    .cover-details {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 30px;
      border-radius: 8px;
      margin: 40px 0;
      max-width: 600px;
    }

    .cover-detail-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 13pt;
    }

    .cover-detail-item:last-child {
      border-bottom: none;
    }

    .cover-footer {
      margin-top: 60px;
      font-size: 10pt;
      opacity: 0.8;
    }

    /* Page Header */
    .page-header {
      border-bottom: 3px solid #0284c7;
      padding-bottom: 15px;
      margin-bottom: 30px;
    }

    .page-header h1 {
      font-size: 24pt;
      color: #0284c7;
      margin-bottom: 5px;
    }

    .page-header .subtitle {
      font-size: 11pt;
      color: #6b7280;
    }

    /* Content Sections */
    .section {
      margin-bottom: 30px;
    }

    .section-title {
      font-size: 16pt;
      font-weight: bold;
      color: #0369a1;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .info-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 15px;
    }

    .info-box-highlight {
      background: #eff6ff;
      border: 2px solid #0284c7;
    }

    .info-label {
      font-size: 9pt;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
      font-weight: 600;
    }

    .info-value {
      font-size: 14pt;
      font-weight: bold;
      color: #1f2937;
    }

    .info-value-large {
      font-size: 20pt;
      color: #0284c7;
    }

    .info-subtext {
      font-size: 9pt;
      color: #6b7280;
      margin-top: 4px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 10pt;
      color: #374151;
      border-bottom: 2px solid #d1d5db;
    }

    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 10pt;
    }

    tr:last-child td {
      border-bottom: none;
    }

    /* Alert Boxes */
    .alert {
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 10pt;
    }

    .alert-info {
      background: #eff6ff;
      border-left: 4px solid #0284c7;
      color: #1e40af;
    }

    .alert-success {
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      color: #065f46;
    }

    .alert-warning {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      color: #92400e;
    }

    /* Lists */
    ul {
      list-style-position: inside;
      margin-bottom: 15px;
    }

    li {
      padding: 5px 0;
      font-size: 10pt;
    }

    /* Footer */
    .page-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 8pt;
      color: #9ca3af;
      text-align: center;
    }

    /* Utility Classes */
    .text-center {
      text-align: center;
    }

    .text-muted {
      color: #6b7280;
    }

    .mb-10 {
      margin-bottom: 10px;
    }

    .mb-20 {
      margin-bottom: 20px;
    }

    .mt-20 {
      margin-top: 20px;
    }

    .bold {
      font-weight: bold;
    }

    .uppercase {
      text-transform: uppercase;
    }
  `
}

/**
 * Generate Cover Page
 */
function generateCoverPage(propertyData, currentDate) {
  return `
    <div class="page cover-page">
      <h1 class="cover-title">NYC Zoning & Transit<br/>Opportunity Report</h1>
      <p class="cover-address">${propertyData.address}</p>
      <p style="font-size: 14pt; opacity: 0.9;">${propertyData.borough}, New York</p>

      <div class="cover-details">
        <div class="cover-detail-item">
          <span>Zoning District:</span>
          <strong>${propertyData.zoning?.district || 'N/A'}</strong>
        </div>
        <div class="cover-detail-item">
          <span>Block & Lot:</span>
          <strong>Block ${propertyData.block}, Lot ${propertyData.lot}</strong>
        </div>
        <div class="cover-detail-item">
          <span>BBL:</span>
          <strong>${propertyData.bbl}</strong>
        </div>
        <div class="cover-detail-item">
          <span>Building Class:</span>
          <strong>${propertyData.building?.class || 'N/A'}</strong>
        </div>
      </div>

      <div class="cover-footer">
        <p>Report Generated: ${currentDate}</p>
        <p style="margin-top: 10px;">Data sourced from NYC Open Data (PLUTO), MTA GTFS, and FEMA Flood Maps</p>
      </div>
    </div>
  `
}

/**
 * Generate Property Information Page
 */
function generatePropertyInfoPage(propertyData) {
  return `
    <div class="page">
      <div class="page-header">
        <h1>Property Information</h1>
        <p class="subtitle">Basic property details and identification</p>
      </div>

      <div class="section">
        <h2 class="section-title">Location Details</h2>
        <div class="info-grid">
          <div class="info-box">
            <div class="info-label">Address</div>
            <div class="info-value">${propertyData.address}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Borough</div>
            <div class="info-value">${propertyData.borough}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Block</div>
            <div class="info-value">${propertyData.block}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Lot</div>
            <div class="info-value">${propertyData.lot}</div>
          </div>
          <div class="info-box info-box-highlight">
            <div class="info-label">BBL (Borough-Block-Lot)</div>
            <div class="info-value-large">${propertyData.bbl}</div>
            <div class="info-subtext">Unique property identifier</div>
          </div>
          <div class="info-box">
            <div class="info-label">Coordinates</div>
            <div class="info-value" style="font-size: 11pt;">
              ${propertyData.coordinates?.latitude?.toFixed(6) || 'N/A'},<br/>
              ${propertyData.coordinates?.longitude?.toFixed(6) || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Land Use</h2>
        <div class="info-box">
          <div class="info-label">Land Use Category</div>
          <div class="info-value">${propertyData.landUse?.description || 'N/A'}</div>
          <div class="info-subtext">Code: ${propertyData.landUse?.category || 'N/A'}</div>
        </div>
      </div>

      ${propertyData.special?.landmark || propertyData.special?.historicDistrict ? `
      <div class="section">
        <h2 class="section-title">Special Designations</h2>
        ${propertyData.special?.landmark ? `
          <div class="alert alert-info">
            <strong>Landmark:</strong> ${propertyData.special.landmark}
          </div>
        ` : ''}
        ${propertyData.special?.historicDistrict ? `
          <div class="alert alert-info">
            <strong>Historic District:</strong> ${propertyData.special.historicDistrict}
          </div>
        ` : ''}
      </div>
      ` : ''}
    </div>
  `
}

/**
 * Generate Zoning Analysis Page
 */
function generateZoningAnalysisPage(propertyData, buildableInfo) {
  const zoning = propertyData.zoning || {}
  const dev = propertyData.development || {}

  return `
    <div class="page">
      <div class="page-header">
        <h1>Zoning Analysis</h1>
        <p class="subtitle">Comprehensive zoning district information and regulations</p>
      </div>

      <div class="section">
        <h2 class="section-title">Zoning Districts</h2>
        <div class="info-grid">
          <div class="info-box info-box-highlight">
            <div class="info-label">Primary Zoning District</div>
            <div class="info-value-large">${zoning.district || 'Not Zoned'}</div>
          </div>
          ${zoning.overlay1 ? `
          <div class="info-box">
            <div class="info-label">Overlay District 1</div>
            <div class="info-value">${zoning.overlay1}</div>
          </div>
          ` : ''}
          ${zoning.overlay2 ? `
          <div class="info-box">
            <div class="info-label">Overlay District 2</div>
            <div class="info-value">${zoning.overlay2}</div>
          </div>
          ` : ''}
          ${zoning.commercialOverlay ? `
          <div class="info-box">
            <div class="info-label">Commercial Overlay</div>
            <div class="info-value">${zoning.commercialOverlay}</div>
          </div>
          ` : ''}
        </div>

        ${zoning.splitZone ? `
          <div class="alert alert-warning">
            <strong>Split Zone Property:</strong> This property is located in a split zoning district,
            meaning different regulations may apply to different portions of the lot.
          </div>
        ` : ''}
      </div>

      <div class="section">
        <h2 class="section-title">Floor Area Ratio (FAR)</h2>
        <div class="info-grid">
          <div class="info-box">
            <div class="info-label">Current Built FAR</div>
            <div class="info-value">${dev.far?.toFixed(2) || 'N/A'}</div>
          </div>
          <div class="info-box info-box-highlight">
            <div class="info-label">Maximum Allowed FAR</div>
            <div class="info-value-large">${dev.maxAllowedFAR?.toFixed(2) || 'N/A'}</div>
          </div>
          ${dev.residentialFAR ? `
          <div class="info-box">
            <div class="info-label">Residential FAR</div>
            <div class="info-value">${dev.residentialFAR.toFixed(2)}</div>
          </div>
          ` : ''}
          ${dev.commercialFAR ? `
          <div class="info-box">
            <div class="info-label">Commercial FAR</div>
            <div class="info-value">${dev.commercialFAR.toFixed(2)}</div>
          </div>
          ` : ''}
        </div>

        <div class="alert alert-info">
          <strong>What is FAR?</strong> Floor Area Ratio (FAR) is the ratio of a building's total floor area
          to the size of the land upon which it is built. A higher FAR indicates the potential for a denser
          or taller building.
        </div>
      </div>

      ${propertyData.special?.specialDistrict1 || propertyData.special?.specialDistrict2 ? `
      <div class="section">
        <h2 class="section-title">Special Zoning Districts</h2>
        <ul>
          ${propertyData.special.specialDistrict1 ? `<li><strong>${propertyData.special.specialDistrict1}</strong></li>` : ''}
          ${propertyData.special.specialDistrict2 ? `<li><strong>${propertyData.special.specialDistrict2}</strong></li>` : ''}
          ${propertyData.special.specialDistrict3 ? `<li><strong>${propertyData.special.specialDistrict3}</strong></li>` : ''}
        </ul>
        <div class="alert alert-info">
          Special zoning districts have unique regulations that may differ from standard zoning.
          Consult NYC Department of City Planning for specific requirements.
        </div>
      </div>
      ` : ''}
    </div>
  `
}

/**
 * Generate Building Details Page
 */
function generateBuildingDetailsPage(propertyData) {
  const building = propertyData.building || {}
  const lot = propertyData.lot || {}

  return `
    <div class="page">
      <div class="page-header">
        <h1>Building & Lot Details</h1>
        <p class="subtitle">Physical characteristics and dimensions</p>
      </div>

      <div class="section">
        <h2 class="section-title">Building Information</h2>
        <div class="info-grid">
          <div class="info-box">
            <div class="info-label">Building Class</div>
            <div class="info-value">${building.class || 'N/A'}</div>
          </div>
          ${building.area ? `
          <div class="info-box info-box-highlight">
            <div class="info-label">Total Building Area</div>
            <div class="info-value-large">${building.area.toLocaleString()} sq ft</div>
          </div>
          ` : ''}
          ${building.stories ? `
          <div class="info-box">
            <div class="info-label">Number of Stories</div>
            <div class="info-value">${building.stories}</div>
          </div>
          ` : ''}
          ${building.yearBuilt ? `
          <div class="info-box">
            <div class="info-label">Year Built</div>
            <div class="info-value">${building.yearBuilt}</div>
            ${building.yearAltered1 ? `<div class="info-subtext">Altered: ${building.yearAltered1}</div>` : ''}
          </div>
          ` : ''}
          ${building.frontage ? `
          <div class="info-box">
            <div class="info-label">Building Frontage</div>
            <div class="info-value">${building.frontage.toFixed(1)} ft</div>
          </div>
          ` : ''}
          ${building.depth ? `
          <div class="info-box">
            <div class="info-label">Building Depth</div>
            <div class="info-value">${building.depth.toFixed(1)} ft</div>
          </div>
          ` : ''}
        </div>

        ${building.units?.total > 0 ? `
        <div class="info-grid">
          <div class="info-box">
            <div class="info-label">Total Units</div>
            <div class="info-value">${building.units.total}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Residential Units</div>
            <div class="info-value">${building.units.residential}</div>
          </div>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <h2 class="section-title">Lot Information</h2>
        <div class="info-grid">
          ${lot.area ? `
          <div class="info-box info-box-highlight">
            <div class="info-label">Lot Area</div>
            <div class="info-value-large">${lot.area.toLocaleString()} sq ft</div>
          </div>
          ` : ''}
          ${lot.frontage ? `
          <div class="info-box">
            <div class="info-label">Lot Frontage</div>
            <div class="info-value">${lot.frontage.toFixed(1)} ft</div>
          </div>
          ` : ''}
          ${lot.depth ? `
          <div class="info-box">
            <div class="info-label">Lot Depth</div>
            <div class="info-value">${lot.depth.toFixed(1)} ft</div>
          </div>
          ` : ''}
          ${lot.corner !== undefined ? `
          <div class="info-box">
            <div class="info-label">Corner Lot</div>
            <div class="info-value">${lot.corner ? 'Yes' : 'No'}</div>
            ${lot.corner ? '<div class="info-subtext">Corner lots may have zoning advantages</div>' : ''}
          </div>
          ` : ''}
        </div>

        ${lot.irregular ? `
        <div class="alert alert-warning">
          <strong>Irregular Lot:</strong> This property has an irregular shape, which may affect development options.
        </div>
        ` : ''}
      </div>

      ${propertyData.development?.assessedValue?.total ? `
      <div class="section">
        <h2 class="section-title">Assessment Values</h2>
        <div class="info-grid">
          <div class="info-box">
            <div class="info-label">Land Assessed Value</div>
            <div class="info-value">$${propertyData.development.assessedValue.land.toLocaleString()}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Total Assessed Value</div>
            <div class="info-value">$${propertyData.development.assessedValue.total.toLocaleString()}</div>
          </div>
        </div>
        <p class="text-muted" style="font-size: 9pt; margin-top: 10px;">
          Note: Assessed values are used for tax purposes and may not reflect market value.
        </p>
      </div>
      ` : ''}
    </div>
  `
}

/**
 * Generate Development Potential Page
 */
function generateDevelopmentPotentialPage(propertyData, buildableInfo) {
  const hasBuil dableInfo = buildableInfo && buildableInfo.maxBuildable

  return `
    <div class="page">
      <div class="page-header">
        <h1>Development Potential</h1>
        <p class="subtitle">Analysis of buildable area and development opportunities</p>
      </div>

      ${hasBuildableInfo ? `
      <div class="section">
        <h2 class="section-title">Buildable Area Analysis</h2>

        <div class="info-grid">
          <div class="info-box info-box-highlight">
            <div class="info-label">Maximum Buildable Area</div>
            <div class="info-value-large">${buildableInfo.maxBuildable.toLocaleString()} sq ft</div>
            <div class="info-subtext">Based on maximum allowed FAR</div>
          </div>
          <div class="info-box ${buildableInfo.remaining > 0 ? 'info-box-highlight' : ''}">
            <div class="info-label">Remaining Buildable Area</div>
            <div class="info-value-large">${buildableInfo.remaining.toLocaleString()} sq ft</div>
            <div class="info-subtext">Potential for additional development</div>
          </div>
          <div class="info-box">
            <div class="info-label">Current FAR Utilized</div>
            <div class="info-value">${buildableInfo.utilized}%</div>
          </div>
          <div class="info-box">
            <div class="info-label">FAR: Current / Maximum</div>
            <div class="info-value">${buildableInfo.currentBuiltFAR?.toFixed(2) || 'N/A'} / ${buildableInfo.maxAllowedFAR?.toFixed(2) || 'N/A'}</div>
          </div>
        </div>

        ${buildableInfo.remaining > 0 ? `
        <div class="alert alert-success">
          <strong>Development Opportunity:</strong> This property has ${buildableInfo.remaining.toLocaleString()}
          square feet of unused development rights. This represents ${(100 - buildableInfo.utilized).toFixed(1)}%
          of the maximum allowable building area.
        </div>
        ` : buildableInfo.remaining === 0 ? `
        <div class="alert alert-info">
          <strong>Fully Developed:</strong> This property is utilizing the maximum allowed Floor Area Ratio (FAR).
          No additional development rights are available under current zoning.
        </div>
        ` : `
        <div class="alert alert-warning">
          <strong>Over-Built:</strong> The current building area exceeds the maximum FAR allowed under current zoning.
          This may be due to grandfathered rights or previous zoning regulations.
        </div>
        `}

        <div class="mt-20">
          <h3 class="section-title">Development Considerations</h3>
          <ul>
            <li><strong>Zoning Compliance:</strong> All development must comply with current zoning regulations including setbacks, height limits, and yard requirements.</li>
            <li><strong>Building Code:</strong> Construction must meet NYC Building Code requirements.</li>
            <li><strong>Special Permits:</strong> Some developments may require special permits or variances from the Board of Standards and Appeals.</li>
            <li><strong>Environmental Review:</strong> Larger projects may require environmental impact assessments.</li>
            <li><strong>Community Board:</strong> Certain projects require community board review and approval.</li>
          </ul>
        </div>
      </div>
      ` : `
      <div class="alert alert-warning">
        <strong>Limited Data:</strong> Buildable area calculations require complete FAR and lot area information.
        Some data may not be available for this property.
      </div>
      `}

      <div class="section">
        <h2 class="section-title">Zoning Resources</h2>
        <table>
          <thead>
            <tr>
              <th>Resource</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>NYC Zoning Resolution</strong></td>
              <td>Complete zoning regulations for all districts</td>
            </tr>
            <tr>
              <td><strong>Zoning Handbook</strong></td>
              <td>Citizen's guide to understanding NYC zoning</td>
            </tr>
            <tr>
              <td><strong>ZoLa (Zoning & Land Use Map)</strong></td>
              <td>Interactive zoning and land use application</td>
            </tr>
            <tr>
              <td><strong>Department of Buildings</strong></td>
              <td>Building permits, violations, and records</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
}

/**
 * Generate Transit Access Page
 */
function generateTransitAccessPage(propertyData) {
  return `
    <div class="page">
      <div class="page-header">
        <h1>Transit Access & Connectivity</h1>
        <p class="subtitle">Public transportation options and accessibility</p>
      </div>

      <div class="alert alert-info">
        <strong>Transit Analysis:</strong> Detailed transit access scores and nearby subway/bus lines will be
        integrated in a future update using MTA GTFS data. This section will include:
        <ul style="margin-top: 10px;">
          <li>Nearby subway stations with walking distances</li>
          <li>Bus routes within 0.25 miles</li>
          <li>Transit score calculation</li>
          <li>Peak and off-peak service frequencies</li>
          <li>Accessibility information</li>
        </ul>
      </div>

      <div class="section">
        <h2 class="section-title">Location & Accessibility</h2>
        <div class="info-grid">
          <div class="info-box">
            <div class="info-label">Borough</div>
            <div class="info-value">${propertyData.borough}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Coordinates</div>
            <div class="info-value" style="font-size: 11pt;">
              ${propertyData.coordinates?.latitude?.toFixed(6) || 'N/A'},<br/>
              ${propertyData.coordinates?.longitude?.toFixed(6) || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Transportation Planning Resources</h2>
        <table>
          <thead>
            <tr>
              <th>Resource</th>
              <th>Website</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>MTA Subway Map</strong></td>
              <td>new.mta.info</td>
            </tr>
            <tr>
              <td><strong>NYC Bus Map</strong></td>
              <td>new.mta.info/maps</td>
            </tr>
            <tr>
              <td><strong>Citibike Station Finder</strong></td>
              <td>citibikenyc.com/map</td>
            </tr>
            <tr>
              <td><strong>NYC DOT Street Conditions</strong></td>
              <td>nyc.gov/dot</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
}

/**
 * Generate Resources Page
 */
function generateResourcesPage(propertyData) {
  return `
    <div class="page">
      <div class="page-header">
        <h1>Resources & Next Steps</h1>
        <p class="subtitle">Helpful links and contact information</p>
      </div>

      <div class="section">
        <h2 class="section-title">NYC Government Resources</h2>
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th>Website</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Department of City Planning (DCP)</strong></td>
              <td>nyc.gov/planning</td>
              <td>Zoning information, land use applications</td>
            </tr>
            <tr>
              <td><strong>Department of Buildings (DOB)</strong></td>
              <td>nyc.gov/buildings</td>
              <td>Building permits, violations, inspections</td>
            </tr>
            <tr>
              <td><strong>Board of Standards and Appeals</strong></td>
              <td>nyc.gov/bsa</td>
              <td>Variances and special permits</td>
            </tr>
            <tr>
              <td><strong>Landmarks Preservation Commission</strong></td>
              <td>nyc.gov/landmarks</td>
              <td>Historic districts and landmarks</td>
            </tr>
            <tr>
              <td><strong>NYC Open Data Portal</strong></td>
              <td>opendata.cityofnewyork.us</td>
              <td>Public datasets and information</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2 class="section-title">Planning & Zoning Tools</h2>
        <table>
          <thead>
            <tr>
              <th>Tool</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>ZoLa (Zoning & Land Use Application)</strong></td>
              <td>Interactive map showing zoning districts, land use, and property information</td>
            </tr>
            <tr>
              <td><strong>NYC GeoClient API</strong></td>
              <td>Programmatic access to NYC address and property data</td>
            </tr>
            <tr>
              <td><strong>PLUTO Database</strong></td>
              <td>Comprehensive property-level database with zoning and building data</td>
            </tr>
            <tr>
              <td><strong>Digital Tax Map</strong></td>
              <td>Official NYC tax lot boundaries and BBL identifiers</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2 class="section-title">Important Notes & Disclaimers</h2>
        <div class="alert alert-warning">
          <p><strong>Data Accuracy:</strong> This report is based on publicly available data from NYC Open Data and other sources.
          While we strive for accuracy, property information can change over time. Always verify critical information with
          official NYC agencies before making decisions.</p>

          <p style="margin-top: 10px;"><strong>Not Legal or Professional Advice:</strong> This report is for informational purposes only and does not
          constitute legal, financial, or professional advice. Consult with qualified professionals (attorneys, architects,
          engineers, financial advisors) before making property development or investment decisions.</p>

          <p style="margin-top: 10px;"><strong>Zoning Changes:</strong> Zoning regulations can be modified through rezoning actions. Check with the
          Department of City Planning for any pending or recent zoning changes that may affect this property.</p>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Report Information</h2>
        <div class="info-grid">
          <div class="info-box">
            <div class="info-label">Property BBL</div>
            <div class="info-value">${propertyData.bbl}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Data Version</div>
            <div class="info-value">${propertyData.version || 'Latest'}</div>
          </div>
        </div>
      </div>

      <div class="page-footer">
        <p><strong>NYC Zoning & Transit Opportunity Report</strong></p>
        <p>Generated by Zonely | Data sourced from NYC Open Data (PLUTO), MTA GTFS, and FEMA Flood Maps</p>
        <p style="margin-top: 10px;">For questions or support, visit zonely.app</p>
      </div>
    </div>
  `
}

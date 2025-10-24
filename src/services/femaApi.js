/**
 * FEMA Flood Zone API Service
 *
 * Integrates with FEMA's National Flood Hazard Layer (NFHL) to determine
 * flood risk for NYC properties.
 *
 * API Documentation: https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer
 */

// FEMA NFHL Map Server endpoint
const FEMA_API_URL = 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query'

// NYC bounding box for validation
const NYC_BOUNDS = {
  minLat: 40.477399,
  maxLat: 40.917577,
  minLon: -74.259090,
  maxLon: -73.700272,
}

/**
 * Get flood zone information for a property
 * @param {number} latitude - Property latitude
 * @param {number} longitude - Property longitude
 * @returns {Promise<Object>} Flood zone data
 */
export async function getFloodZone(latitude, longitude) {
  try {
    // Validate coordinates are within NYC
    if (
      latitude < NYC_BOUNDS.minLat ||
      latitude > NYC_BOUNDS.maxLat ||
      longitude < NYC_BOUNDS.minLon ||
      longitude > NYC_BOUNDS.maxLon
    ) {
      return {
        success: false,
        error: 'Coordinates are outside NYC bounds',
      }
    }

    // Build query parameters for FEMA API
    // Layer 28 contains flood zones (FLD_ZONE field)
    const params = new URLSearchParams({
      geometry: `${longitude},${latitude}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326', // WGS84 coordinate system
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE,V_DATUM,DEPTH,LEN_UNIT,VELOCITY,VEL_UNIT,AR_REVERT,BFE_REVERT,DEP_REVERT',
      returnGeometry: 'false',
      f: 'json',
    })

    const response = await fetch(`${FEMA_API_URL}?${params}`)

    if (!response.ok) {
      throw new Error(`FEMA API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message || 'FEMA API returned an error')
    }

    // Parse flood zone data
    if (!data.features || data.features.length === 0) {
      // No flood zone data found - property is likely in Zone X (minimal flood risk)
      return {
        success: true,
        inFloodZone: false,
        zone: 'X',
        zoneDescription: 'Area of minimal flood hazard',
        sfha: false,
        riskLevel: 'minimal',
        details: {
          fullDescription:
            'This area has been determined to be outside the 0.2% annual chance floodplain.',
        },
      }
    }

    // Get the first matching flood zone
    const feature = data.features[0]
    const attrs = feature.attributes

    const zone = attrs.FLD_ZONE || 'X'
    const sfha = attrs.SFHA_TF === 'T' // Special Flood Hazard Area
    const subtype = attrs.ZONE_SUBTY

    return {
      success: true,
      inFloodZone: sfha,
      zone,
      zoneSubtype: subtype,
      zoneDescription: getFloodZoneDescription(zone, subtype),
      sfha,
      riskLevel: getFloodRiskLevel(zone, sfha),
      details: {
        baseFloodElevation: attrs.STATIC_BFE,
        verticalDatum: attrs.V_DATUM,
        depth: attrs.DEPTH,
        depthUnit: attrs.LEN_UNIT,
        velocity: attrs.VELOCITY,
        velocityUnit: attrs.VEL_UNIT,
        fullDescription: getDetailedFloodDescription(zone, sfha, subtype),
      },
    }
  } catch (error) {
    console.error('FEMA API error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch flood zone data',
    }
  }
}

/**
 * Get human-readable description of flood zone
 * @param {string} zone - FEMA flood zone code
 * @param {string} subtype - Zone subtype
 * @returns {string} Description
 */
function getFloodZoneDescription(zone, subtype) {
  const descriptions = {
    A: 'Special Flood Hazard Area (1% annual chance flood)',
    AE: 'Special Flood Hazard Area with Base Flood Elevation determined',
    AH: 'Special Flood Hazard Area with ponding (1-3 feet deep)',
    AO: 'Special Flood Hazard Area with sheet flow (1-3 feet deep)',
    AR: 'Special Flood Hazard Area resulting from decertified flood control system',
    'A99': 'Special Flood Hazard Area to be protected from 1% annual chance flood',
    V: 'Coastal high hazard area with velocity hazard (wave action)',
    VE: 'Coastal high hazard area with Base Flood Elevation and velocity hazard',
    X: 'Area of minimal flood hazard (outside 0.2% annual chance floodplain)',
    '0.2 PCT ANNUAL CHANCE FLOOD HAZARD': 'Moderate flood hazard area (0.2% annual chance)',
    AREA_NOT_INCLUDED: 'Area not included in flood hazard determination',
    D: 'Area of undetermined flood hazard',
    OPEN_WATER: 'Open water area',
  }

  return descriptions[zone] || `Zone ${zone}${subtype ? ` (${subtype})` : ''}`
}

/**
 * Determine flood risk level
 * @param {string} zone - FEMA flood zone code
 * @param {boolean} sfha - Is in Special Flood Hazard Area
 * @returns {string} Risk level: critical, high, moderate, minimal
 */
function getFloodRiskLevel(zone, sfha) {
  // Coastal high hazard zones (V zones)
  if (zone && zone.startsWith('V')) {
    return 'critical'
  }

  // Special Flood Hazard Areas (A zones)
  if (sfha || (zone && zone.startsWith('A'))) {
    return 'high'
  }

  // 0.2% annual chance flood hazard
  if (zone === '0.2 PCT ANNUAL CHANCE FLOOD HAZARD' || zone === 'B' || zone === 'C') {
    return 'moderate'
  }

  // Zone X (minimal risk) or outside flood zones
  return 'minimal'
}

/**
 * Get detailed flood zone description
 * @param {string} zone - FEMA flood zone code
 * @param {boolean} sfha - Is in Special Flood Hazard Area
 * @param {string} subtype - Zone subtype
 * @returns {string} Detailed description
 */
function getDetailedFloodDescription(zone, sfha, subtype) {
  if (zone && zone.startsWith('V')) {
    return `This property is in a Coastal High Hazard Area (V Zone). These areas are subject to high velocity wave action and have a 1% annual chance of flooding. Federal flood insurance is required for mortgaged properties. Special building requirements apply, including elevated structures on pilings or columns.`
  }

  if (sfha || (zone && zone.startsWith('A'))) {
    return `This property is in a Special Flood Hazard Area (SFHA) with a 1% annual chance of flooding (also known as the 100-year floodplain). Federal flood insurance is required for mortgaged properties. Structures must be built in compliance with local floodplain management regulations.`
  }

  if (zone === '0.2 PCT ANNUAL CHANCE FLOOD HAZARD' || zone === 'B' || zone === 'C') {
    return `This property is in a moderate flood hazard area with a 0.2% annual chance of flooding (also known as the 500-year floodplain). While flood insurance is not federally required, it is recommended for added protection.`
  }

  if (zone === 'X' || !zone) {
    return `This property is in an area of minimal flood hazard, outside the 0.2% annual chance floodplain. While flooding is possible, the risk is significantly lower than in Special Flood Hazard Areas. Flood insurance may still be available and advisable.`
  }

  return `Flood zone classification: ${zone}${subtype ? ` (${subtype})` : ''}. Consult FEMA flood maps and local authorities for detailed information and building requirements.`
}

/**
 * Get flood insurance recommendations
 * @param {Object} floodData - Flood zone data from getFloodZone()
 * @returns {Object} Insurance recommendations
 */
export function getFloodInsuranceRecommendation(floodData) {
  if (!floodData.success) {
    return {
      required: false,
      recommended: true,
      reason: 'Unable to determine flood zone',
    }
  }

  const { zone, sfha, riskLevel } = floodData

  if (riskLevel === 'critical' || riskLevel === 'high') {
    return {
      required: true,
      recommended: true,
      reason: 'Federal flood insurance is required for mortgaged properties in Special Flood Hazard Areas.',
      estimatedAnnualCost: '$700 - $2,000+',
      program: 'National Flood Insurance Program (NFIP)',
    }
  }

  if (riskLevel === 'moderate') {
    return {
      required: false,
      recommended: true,
      reason:
        'While not required, flood insurance is highly recommended. Over 25% of flood claims come from moderate-risk areas.',
      estimatedAnnualCost: '$450 - $700',
      program: 'National Flood Insurance Program (NFIP)',
    }
  }

  return {
    required: false,
    recommended: true,
    reason:
      'Flood insurance is available and advisable. No property is completely risk-free from flooding.',
    estimatedAnnualCost: '$400 - $600',
    program: 'National Flood Insurance Program (NFIP) or private insurers',
  }
}

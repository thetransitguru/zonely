/**
 * NYC PLUTO API Service
 * Fetches property data from NYC's Primary Land Use Tax Lot Output (PLUTO) dataset
 * API: NYC Open Data - Socrata Open Data API (SODA)
 */

// PLUTO dataset endpoint (MapPLUTO - most recent version)
const PLUTO_API_URL = 'https://data.cityofnewyork.us/resource/64uk-42ks.json'

/**
 * Fetch PLUTO property data by coordinates
 * Finds the property closest to the given coordinates
 * @param {number} latitude - Property latitude
 * @param {number} longitude - Property longitude
 * @returns {Promise<Object>} - Property data from PLUTO
 */
export async function getPropertyByCoordinates(latitude, longitude) {
  try {
    // ROOT CAUSE FIX: The within_circle function may not work with all Socrata datasets
    // or may have restrictions. Using a more robust bounding box approach instead.
    //
    // Create a small bounding box around the point (approximately 50 meters in each direction)
    // At NYC's latitude (~40.7°), 1 degree latitude ≈ 111km, 1 degree longitude ≈ 85km
    // So 50 meters ≈ 0.00045 degrees lat, 0.00059 degrees lon

    const latDelta = 0.0005  // ~55 meters
    const lonDelta = 0.0006  // ~50 meters

    const minLat = latitude - latDelta
    const maxLat = latitude + latDelta
    const minLon = longitude - lonDelta
    const maxLon = longitude + lonDelta

    // Build a bounding box query that's more reliable
    const whereClause = `latitude >= ${minLat} AND latitude <= ${maxLat} AND longitude >= ${minLon} AND longitude <= ${maxLon}`

    const params = new URLSearchParams({
      $where: whereClause,
      $limit: '10', // Get multiple properties to find the closest
      $order: 'bbl', // Order by BBL for consistency
    })

    const url = `${PLUTO_API_URL}?${params.toString()}`
    console.log('PLUTO API Request URL:', url) // Debug logging

    const response = await fetch(url)

    // Enhanced error handling with detailed diagnostics
    if (!response.ok) {
      const errorText = await response.text()
      console.error('PLUTO API HTTP Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: url,
      })

      // Try to parse Socrata error message
      let detailedError = response.statusText
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.message) {
          detailedError = errorJson.message
        } else if (errorJson.error) {
          detailedError = errorJson.error
        }
      } catch (e) {
        detailedError = errorText || response.statusText
      }

      throw new Error(`PLUTO API error (${response.status}): ${detailedError}`)
    }

    const data = await response.json()
    console.log('PLUTO API Response:', data.length, 'properties found') // Debug logging

    if (!data || data.length === 0) {
      throw new Error('No property data found for this location. The address may not be in the PLUTO database, or the coordinates are outside NYC boundaries.')
    }

    // Find the closest property by calculating distances
    const propertiesWithDistance = data.map(prop => {
      const propLat = parseFloat(prop.latitude)
      const propLon = parseFloat(prop.longitude)
      const distance = calculateDistanceMeters(latitude, longitude, propLat, propLon)
      return { ...prop, distance }
    })

    // Sort by distance and take the closest
    propertiesWithDistance.sort((a, b) => a.distance - b.distance)
    const property = propertiesWithDistance[0]

    console.log('Selected property BBL:', property.bbl, 'at distance:', property.distance.toFixed(1), 'meters') // Debug logging

    return {
      success: true,
      data: parsePropertyData(property),
      raw: property, // Keep raw data for debugging
    }
  } catch (error) {
    console.error('PLUTO API error details:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch property data.',
      details: {
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      }
    }
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lon1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lon2 - Second point longitude
 * @returns {number} - Distance in meters
 */
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Fetch PLUTO property data by BBL (Borough-Block-Lot)
 * @param {string} bbl - 10-digit BBL identifier
 * @returns {Promise<Object>} - Property data from PLUTO
 */
export async function getPropertyByBBL(bbl) {
  try {
    const params = new URLSearchParams({
      bbl: bbl,
      $limit: '1',
    })

    const response = await fetch(`${PLUTO_API_URL}?${params}`)

    if (!response.ok) {
      throw new Error(`PLUTO API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      throw new Error('Property not found with the given BBL.')
    }

    const property = data[0]
    return {
      success: true,
      data: parsePropertyData(property),
      raw: property,
    }
  } catch (error) {
    console.error('PLUTO API error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch property data.',
    }
  }
}

/**
 * Parse raw PLUTO data into a clean, structured format
 * @param {Object} raw - Raw PLUTO API response
 * @returns {Object} - Parsed property data
 */
function parsePropertyData(raw) {
  return {
    // Basic Property Information
    address: raw.address || 'Address not available',
    borough: getBoroughName(raw.borough),
    block: raw.block || 'N/A',
    lot: raw.lot || 'N/A',
    bbl: raw.bbl || 'N/A',

    // Zoning Information
    zoning: {
      district: raw.zonedist1 || 'Not zoned',
      overlay1: raw.overlay1 || null,
      overlay2: raw.overlay2 || null,
      splitZone: raw.splitzone === 'Y',
      commercialOverlay: raw.comarea || null,
    },

    // Building Information
    building: {
      class: raw.bldgclass || 'N/A',
      area: raw.bldgarea ? parseInt(raw.bldgarea) : null,
      frontage: raw.bldgfront ? parseFloat(raw.bldgfront) : null,
      depth: raw.bldgdepth ? parseFloat(raw.bldgdepth) : null,
      stories: raw.numfloors ? parseInt(raw.numfloors) : null,
      units: {
        residential: raw.unitsres ? parseInt(raw.unitsres) : 0,
        total: raw.unitstotal ? parseInt(raw.unitstotal) : 0,
      },
      yearBuilt: raw.yearbuilt ? parseInt(raw.yearbuilt) : null,
      yearAltered1: raw.yearalter1 ? parseInt(raw.yearalter1) : null,
    },

    // Lot Information
    lot: {
      area: raw.lotarea ? parseInt(raw.lotarea) : null,
      frontage: raw.lotfront ? parseFloat(raw.lotfront) : null,
      depth: raw.lotdepth ? parseFloat(raw.lotdepth) : null,
      irregular: raw.irregular === 'Y',
      corner: raw.corner === 'Y',
    },

    // Development Rights & FAR
    development: {
      far: raw.builtfar ? parseFloat(raw.builtfar) : null,
      residentialFAR: raw.residfar ? parseFloat(raw.residfar) : null,
      commercialFAR: raw.commfar ? parseFloat(raw.commfar) : null,
      facilityFAR: raw.facilfar ? parseFloat(raw.facilfar) : null,
      maxAllowedFAR: calculateMaxFAR(raw),
      assessedValue: {
        land: raw.assessland ? parseInt(raw.assessland) : null,
        total: raw.assesstot ? parseInt(raw.assesstot) : null,
      },
    },

    // Land Use
    landUse: {
      category: raw.landuse || 'N/A',
      description: getLandUseDescription(raw.landuse),
      ownerType: raw.ownertype || 'N/A',
    },

    // Special Districts & Overlays
    special: {
      historicDistrict: raw.histdist || null,
      landmark: raw.landmark || null,
      specialDistrict1: raw.spdist1 || null,
      specialDistrict2: raw.spdist2 || null,
      specialDistrict3: raw.spdist3 || null,
      limitedHeight: raw.ltdheight || null,
    },

    // Environmental
    environmental: {
      proximityCode: raw.proxcode || null,
      easements: raw.easements ? parseInt(raw.easements) : 0,
    },

    // Tax Information
    tax: {
      lot: raw.taxmap || null,
      exemptLand: raw.exemptland ? parseInt(raw.exemptland) : null,
      exemptTotal: raw.exempttot ? parseInt(raw.exempttot) : null,
    },

    // Geographic
    coordinates: {
      latitude: raw.latitude ? parseFloat(raw.latitude) : null,
      longitude: raw.longitude ? parseFloat(raw.longitude) : null,
    },

    // Metadata
    version: raw.version || null,
    mapPLUTO_version: raw.mappluto_f || null,
  }
}

/**
 * Get full borough name from borough code
 * @param {string} code - Borough code (1-5 or MN, BX, BK, QN, SI)
 * @returns {string} - Full borough name
 */
function getBoroughName(code) {
  const boroughMap = {
    '1': 'Manhattan',
    '2': 'Bronx',
    '3': 'Brooklyn',
    '4': 'Queens',
    '5': 'Staten Island',
    'MN': 'Manhattan',
    'BX': 'Bronx',
    'BK': 'Brooklyn',
    'QN': 'Queens',
    'SI': 'Staten Island',
  }
  return boroughMap[code] || code || 'Unknown'
}

/**
 * Get human-readable land use description
 * @param {string} code - Land use code (01-11)
 * @returns {string} - Land use description
 */
function getLandUseDescription(code) {
  const landUseMap = {
    '01': 'One & Two Family Buildings',
    '02': 'Multi-Family Walk-Up Buildings',
    '03': 'Multi-Family Elevator Buildings',
    '04': 'Mixed Residential & Commercial Buildings',
    '05': 'Commercial & Office Buildings',
    '06': 'Industrial & Manufacturing',
    '07': 'Transportation & Utility',
    '08': 'Public Facilities & Institutions',
    '09': 'Open Space & Outdoor Recreation',
    '10': 'Parking Facilities',
    '11': 'Vacant Land',
  }
  return landUseMap[code] || 'Other/Unknown'
}

/**
 * Calculate maximum allowed FAR based on zoning and other factors
 * This is a simplified calculation - actual FAR can be complex
 * @param {Object} raw - Raw PLUTO data
 * @returns {number|null} - Maximum allowed FAR
 */
function calculateMaxFAR(raw) {
  // If we have specific FAR values, use the highest
  const farValues = [
    raw.residfar ? parseFloat(raw.residfar) : 0,
    raw.commfar ? parseFloat(raw.commfar) : 0,
    raw.facilfar ? parseFloat(raw.facilfar) : 0,
  ].filter(v => v > 0)

  if (farValues.length > 0) {
    return Math.max(...farValues)
  }

  return null
}

/**
 * Calculate potential buildable square footage
 * @param {Object} propertyData - Parsed property data
 * @returns {Object} - Buildable area calculations
 */
export function calculateBuildableArea(propertyData) {
  const lotArea = propertyData.lot.area
  const currentBuiltFAR = propertyData.development.far
  const maxFAR = propertyData.development.maxAllowedFAR
  const currentBuildingArea = propertyData.building.area

  if (!lotArea || !maxFAR) {
    return {
      maxBuildable: null,
      remaining: null,
      utilized: null,
    }
  }

  const maxBuildableArea = lotArea * maxFAR
  const remainingBuildable = maxBuildableArea - (currentBuildingArea || 0)
  const utilizedPercentage = currentBuildingArea
    ? ((currentBuildingArea / maxBuildableArea) * 100).toFixed(1)
    : 0

  return {
    maxBuildable: Math.round(maxBuildableArea),
    remaining: Math.round(Math.max(0, remainingBuildable)),
    utilized: parseFloat(utilizedPercentage),
    currentBuiltFAR: currentBuiltFAR,
    maxAllowedFAR: maxFAR,
  }
}

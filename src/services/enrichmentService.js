/**
 * Property Data Enrichment Service
 *
 * Orchestrates all data sources to create a comprehensive, enriched property report.
 * This is the core value-add service that combines:
 * - PLUTO zoning data
 * - Transit access analysis
 * - FEMA flood zone information
 * - Development potential calculations
 *
 * This enriched data is what justifies the $29.99 report price.
 */

import { geocodeAddress } from './geocoding.js'
import { getPropertyByCoordinates } from './plutoApi.js'
import { getTransitDetails } from './transitApi.js'
import { getFloodZone, getFloodInsuranceRecommendation } from './femaApi.js'
import { calculateDevelopmentPotential, estimateAirRightsValue } from './developmentAnalysis.js'

/**
 * Enrich property data with all available information
 * This is the main function that creates the complete property report
 *
 * @param {string} address - Property address
 * @param {number} latitude - Property latitude (optional, will geocode if not provided)
 * @param {number} longitude - Property longitude (optional, will geocode if not provided)
 * @returns {Promise<Object>} Complete enriched property data
 */
export async function enrichPropertyData(address, latitude = null, longitude = null) {
  const startTime = Date.now()
  const enrichmentSteps = []

  try {
    // Step 1: Geocode address if coordinates not provided
    let coords = { latitude, longitude }
    if (!latitude || !longitude) {
      enrichmentSteps.push({ step: 'geocoding', status: 'started' })
      const geocodeResult = await geocodeAddress(address)

      if (!geocodeResult.success) {
        return {
          success: false,
          error: 'Failed to geocode address',
          details: geocodeResult.error,
        }
      }

      coords = {
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
      }
      enrichmentSteps.push({ step: 'geocoding', status: 'completed', duration: Date.now() - startTime })
    }

    // Step 2: Fetch PLUTO property data
    enrichmentSteps.push({ step: 'pluto', status: 'started' })
    const plutoStart = Date.now()
    const plutoResult = await getPropertyByCoordinates(coords.latitude, coords.longitude)

    if (!plutoResult.success) {
      return {
        success: false,
        error: 'Failed to fetch property data',
        details: plutoResult.error,
      }
    }

    const propertyData = plutoResult.data
    enrichmentSteps.push({ step: 'pluto', status: 'completed', duration: Date.now() - plutoStart })

    // Step 3: Fetch transit access data (parallel with flood zone)
    enrichmentSteps.push({ step: 'transit', status: 'started' })
    const transitStart = Date.now()

    // Step 4: Fetch flood zone data (parallel with transit)
    enrichmentSteps.push({ step: 'flood_zone', status: 'started' })
    const floodStart = Date.now()

    // Run transit and flood zone queries in parallel
    const [transitResult, floodResult] = await Promise.all([
      getTransitDetails(coords.latitude, coords.longitude),
      getFloodZone(coords.latitude, coords.longitude),
    ])

    enrichmentSteps.push({ step: 'transit', status: 'completed', duration: Date.now() - transitStart })
    enrichmentSteps.push({ step: 'flood_zone', status: 'completed', duration: Date.now() - floodStart })

    // Step 5: Calculate development potential
    enrichmentSteps.push({ step: 'development_analysis', status: 'started' })
    const devStart = Date.now()
    const developmentAnalysis = calculateDevelopmentPotential(propertyData)
    enrichmentSteps.push({ step: 'development_analysis', status: 'completed', duration: Date.now() - devStart })

    // Step 6: Estimate air rights value
    const airRightsValue = estimateAirRightsValue(developmentAnalysis, propertyData.borough)

    // Step 7: Get flood insurance recommendations
    const floodInsurance = floodResult.success
      ? getFloodInsuranceRecommendation(floodResult)
      : null

    // Generate unique report ID
    const now = new Date()
    const reportId = `ZNY-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`

    // Calculate lot dimensions (approximate from frontage/depth or estimate from area)
    let lotDimensions = 'N/A'
    if (propertyData.lot.frontage && propertyData.lot.depth) {
      lotDimensions = `${Math.round(propertyData.lot.frontage)} x ${Math.round(propertyData.lot.depth)}`
    } else if (propertyData.lot.area) {
      // Approximate square lot
      const sideLength = Math.sqrt(propertyData.lot.area)
      lotDimensions = `~${Math.round(sideLength)} x ${Math.round(sideLength)} (approx)`
    }

    // Collect all zoning overlays
    const zoningOverlays = [
      propertyData.zoning.overlay1,
      propertyData.zoning.overlay2,
      propertyData.zoning.commercialOverlay,
    ].filter(Boolean)

    // Collect all special districts
    const specialDistricts = [
      propertyData.special.specialDistrict1,
      propertyData.special.specialDistrict2,
      propertyData.special.specialDistrict3,
    ].filter(Boolean)

    // Get E-designations (environmental designations)
    const eDesignations = [] // TODO: Add E-designation detection from PLUTO data if available

    // Collect unique transit lines from nearby stops
    const transitLines = transitResult.success && transitResult.uniqueRoutes
      ? transitResult.uniqueRoutes
      : []

    // Count transit stations within 10-minute walk (800m)
    const stationsWithin10Min = transitResult.success && transitResult.nearbyStops
      ? transitResult.nearbyStops.filter(stop => stop.walkingMinutes <= 10).length
      : 0

    // Get FEMA FIRM panel number from flood result details
    const firmPanel = floodResult.success && floodResult.details?.firmPanel
      ? floodResult.details.firmPanel
      : 'N/A'

    // Calculate confidence level for capacity data
    const capacityConfidence = assessCapacityConfidence(propertyData, developmentAnalysis)

    // Generate flags array (important notices and considerations)
    const flags = generatePropertyFlags(propertyData, transitResult, floodResult, developmentAnalysis)

    // Compile complete enriched data object (NEW BLUEPRINT FORMAT)
    const enrichedData = {
      success: true,

      // Report metadata
      report_id: reportId,
      generated_at: now.toISOString(),
      processing_time_ms: Date.now() - startTime,

      // Basic property information
      address: propertyData.address,
      borough: propertyData.borough,
      block: propertyData.block,
      lot: propertyData.lot,
      bbl: propertyData.bbl,
      coordinates: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },

      // Dataset versions
      datasets: {
        pluto_version: propertyData.version || '24v1',
        mta_gtfs_date: '2025-01-15', // From our transit data generation
        fema_firm_effective: floodResult.success && floodResult.details?.effectiveDate
          ? floodResult.details.effectiveDate
          : '2015-09-05',
      },

      // Lot information
      lot_info: {
        area_sqft: propertyData.lot.area || 0,
        dimensions: lotDimensions,
        corner_lot: propertyData.lot.corner || false,
        irregular: propertyData.lot.irregular || false,
        frontage_ft: propertyData.lot.frontage,
        depth_ft: propertyData.lot.depth,
      },

      // Zoning snapshot (FREE PREVIEW)
      zoning: {
        district: propertyData.zoning.district || 'Not Zoned',
        overlays: zoningOverlays,
        special_districts: specialDistricts,
        split_zone: propertyData.zoning.splitZone || false,
      },

      // Development capacity (PREMIUM)
      capacity: {
        base_far: propertyData.development.maxAllowedFAR || 0,
        residential_far: propertyData.development.residentialFAR,
        commercial_far: propertyData.development.commercialFAR,
        existing_gfa_sqft: propertyData.building.area || 0,
        max_gfa_sqft: developmentAnalysis.success ? developmentAnalysis.maxBuildable : 0,
        unused_dev_rights_sqft: developmentAnalysis.success ? developmentAnalysis.remaining : 0,
        utilization_pct: developmentAnalysis.success ? developmentAnalysis.utilized : 0,
        confidence: capacityConfidence,
      },

      // Building information
      building: {
        class: propertyData.building.class,
        stories: propertyData.building.stories,
        year_built: propertyData.building.yearBuilt,
        year_altered: propertyData.building.yearAltered1,
        units_total: propertyData.building.units?.total || 0,
        units_residential: propertyData.building.units?.residential || 0,
      },

      // Transit access (PREMIUM)
      transit: {
        score: transitResult.success ? transitResult.score : 0,
        score_rating: transitResult.success ? transitResult.scoreRating : 'No Transit',
        stations_within_10min: stationsWithin10Min,
        total_stops_in_radius: transitResult.success ? transitResult.totalStopsInRadius : 0,
        lines: transitLines,
        summary: transitResult.success ? transitResult.summary : 'No nearby transit found',
        nearest_stops: transitResult.success ? transitResult.nearbyStops.slice(0, 5) : [],
      },

      // Environmental & risk (PREMIUM)
      environmental: {
        flood_zone: floodResult.success ? floodResult.zone : 'Unknown',
        flood_zone_description: floodResult.success ? floodResult.zoneDescription : 'Data unavailable',
        in_sfha: floodResult.success ? floodResult.sfha : false,
        risk_level: floodResult.success ? floodResult.riskLevel : 'Unknown',
        firm_panel: firmPanel,
        e_designations: eDesignations,
        flood_insurance_required: floodInsurance?.required || false,
        flood_insurance_note: floodInsurance?.recommendation || 'Contact insurance provider',
      },

      // Development opportunity analysis (PREMIUM)
      opportunity: {
        score: developmentAnalysis.success ? developmentAnalysis.opportunityScore : 0,
        rating: developmentAnalysis.success
          ? getOpportunityRating(developmentAnalysis.opportunityScore)
          : 'N/A',
        is_underdeveloped: developmentAnalysis.success ? developmentAnalysis.isUnderdeveloped : false,
        estimated_construction_cost: developmentAnalysis.success
          ? developmentAnalysis.estimatedConstructionCost
          : 0,
        construction_cost_per_sqft: developmentAnalysis.success
          ? developmentAnalysis.constructionCostPerSqFt
          : 0,
        air_rights_value: airRightsValue.success ? airRightsValue.estimatedTotalValue : 0,
        air_rights_per_sqft: airRightsValue.success ? airRightsValue.valuePerSqFt : 0,
        recommendations: developmentAnalysis.success ? developmentAnalysis.recommendations : [],
      },

      // Land use
      land_use: {
        category: propertyData.landUse.category,
        description: propertyData.landUse.description,
        owner_type: propertyData.landUse.ownerType,
      },

      // Special designations
      special_designations: {
        historic_district: propertyData.special.historicDistrict,
        landmark: propertyData.special.landmark,
        special_districts: specialDistricts,
      },

      // Tax assessment
      assessment: {
        land_value: propertyData.development.assessedValue?.land || 0,
        total_value: propertyData.development.assessedValue?.total || 0,
        year: propertyData.development.assessedValue?.year || new Date().getFullYear(),
      },

      // Flags (important notices and red flags)
      flags,

      // Legacy format compatibility (for existing frontend code)
      // Keep the old structure so App.jsx doesn't break
      property: {
        address: propertyData.address,
        borough: propertyData.borough,
        block: propertyData.block,
        lot: propertyData.lot,
        bbl: propertyData.bbl,
        coordinates: { latitude: coords.latitude, longitude: coords.longitude },
      },
      lot: {
        area: propertyData.lot.area,
        frontage: propertyData.lot.frontage,
        depth: propertyData.lot.depth,
        corner: propertyData.lot.corner,
        irregular: propertyData.lot.irregular,
      },
      development: {
        far: {
          current: propertyData.development.far,
          maxAllowed: propertyData.development.maxAllowedFAR,
          remaining: developmentAnalysis.remainingFAR,
          residential: propertyData.development.residentialFAR,
          commercial: propertyData.development.commercialFAR,
        },
        buildable: developmentAnalysis.success
          ? {
              maxBuildable: developmentAnalysis.maxBuildable,
              remaining: developmentAnalysis.remaining,
              utilized: developmentAnalysis.utilized,
              potentialAdditionalFloors: developmentAnalysis.potentialAdditionalFloors,
              developmentStatus: developmentAnalysis.developmentStatus,
              isUnderdeveloped: developmentAnalysis.isUnderdeveloped,
              estimatedConstructionCost: developmentAnalysis.estimatedConstructionCost,
              constructionCostPerSqFt: developmentAnalysis.constructionCostPerSqFt,
            }
          : { available: false, reason: developmentAnalysis.reason },
        opportunity: developmentAnalysis.success
          ? {
              score: developmentAnalysis.opportunityScore,
              rating: getOpportunityRating(developmentAnalysis.opportunityScore),
              recommendations: developmentAnalysis.recommendations,
            }
          : null,
        airRights: airRightsValue.success
          ? {
              remainingRights: airRightsValue.remainingRights,
              valuePerSqFt: airRightsValue.valuePerSqFt,
              estimatedValue: airRightsValue.estimatedTotalValue,
              note: airRightsValue.note,
            }
          : null,
      },

      // Metadata
      _metadata: {
        enrichmentSteps,
        dataQuality: assessDataQuality(propertyData, transitResult, floodResult, developmentAnalysis),
        premiumFeaturesIncluded: [
          'transitAccess',
          'floodZoneAnalysis',
          'developmentPotential',
          'airRightsValuation',
        ],
      },
    }

    return enrichedData
  } catch (error) {
    console.error('Property enrichment error:', error)
    return {
      success: false,
      error: 'Failed to enrich property data',
      details: error.message,
      enrichmentSteps,
    }
  }
}

/**
 * Assess confidence level for capacity calculations
 * @param {Object} propertyData - PLUTO property data
 * @param {Object} developmentAnalysis - Development analysis result
 * @returns {string} Confidence level: 'high', 'medium', 'low'
 */
function assessCapacityConfidence(propertyData, developmentAnalysis) {
  if (!developmentAnalysis.success) return 'low'

  const checks = {
    hasFAR: !!propertyData.development?.maxAllowedFAR,
    hasLotArea: !!propertyData.lot?.area,
    hasBuildingArea: !!propertyData.building?.area,
    hasZoning: !!propertyData.zoning?.district,
    noSplitZone: !propertyData.zoning?.splitZone,
  }

  const passedChecks = Object.values(checks).filter(Boolean).length

  if (passedChecks >= 4) return 'high'
  if (passedChecks >= 3) return 'medium'
  return 'low'
}

/**
 * Generate property flags (important notices and red flags)
 * @param {Object} propertyData - PLUTO property data
 * @param {Object} transitResult - Transit analysis result
 * @param {Object} floodResult - Flood zone result
 * @param {Object} developmentAnalysis - Development analysis result
 * @returns {Array<string>} Array of flag messages
 */
function generatePropertyFlags(propertyData, transitResult, floodResult, developmentAnalysis) {
  const flags = []

  // Zoning flags
  if (propertyData.zoning?.commercialOverlay || propertyData.zoning?.overlay1 || propertyData.zoning?.overlay2) {
    flags.push('Commercial overlay present — mixed-use development may be permitted')
  }

  if (propertyData.zoning?.splitZone) {
    flags.push('Split zoning — different regulations apply to different portions of the lot')
  }

  // Lot flags
  if (propertyData.lot?.irregular) {
    flags.push('Irregular lot shape — survey recommended before development planning')
  }

  if (propertyData.lot?.corner) {
    flags.push('Corner lot — may have zoning advantages (e.g., reduced setbacks)')
  }

  // Special designation flags
  if (propertyData.special?.landmark) {
    flags.push(`Landmark designation: ${propertyData.special.landmark} — strict alteration restrictions`)
  }

  if (propertyData.special?.historicDistrict) {
    flags.push(`Historic district: ${propertyData.special.historicDistrict} — LPC approval required for changes`)
  }

  const specialDistricts = [
    propertyData.special?.specialDistrict1,
    propertyData.special?.specialDistrict2,
    propertyData.special?.specialDistrict3,
  ].filter(Boolean)

  if (specialDistricts.length > 0) {
    flags.push(`Special zoning district: ${specialDistricts.join(', ')} — additional regulations apply`)
  }

  // Flood zone flags
  if (floodResult.success && floodResult.inFloodZone) {
    flags.push(`Flood Zone ${floodResult.zone} — flood insurance required, construction restrictions apply`)
  }

  if (floodResult.success && floodResult.sfha) {
    flags.push('Located in Special Flood Hazard Area (SFHA) — high flood risk')
  }

  // Development potential flags
  if (developmentAnalysis.success) {
    if (developmentAnalysis.isUnderdeveloped && developmentAnalysis.remaining > 1000) {
      flags.push(`${developmentAnalysis.remaining.toLocaleString()} sq ft unused development rights — significant expansion potential`)
    }

    if (developmentAnalysis.utilized > 100) {
      flags.push('Over-built property — exceeds current FAR limits (likely grandfathered)')
    }

    if (developmentAnalysis.utilized > 95 && developmentAnalysis.utilized <= 100) {
      flags.push('Nearly fully developed — minimal additional buildable area')
    }
  }

  // Transit flags
  if (transitResult.success) {
    if (transitResult.score >= 80) {
      flags.push(`Excellent transit access (${transitResult.score}/100) — ${transitResult.totalStopsInRadius} stops nearby`)
    } else if (transitResult.score < 30) {
      flags.push(`Limited transit access (${transitResult.score}/100) — transportation challenges`)
    }
  }

  // Building age flags
  if (propertyData.building?.yearBuilt && propertyData.building.yearBuilt < 1950) {
    flags.push(`Pre-1950 construction (${propertyData.building.yearBuilt}) — may contain lead paint or asbestos`)
  }

  // Data quality flags
  if (!propertyData.development?.maxAllowedFAR) {
    flags.push('FAR data unavailable — development calculations may be incomplete')
  }

  if (!propertyData.lot?.area) {
    flags.push('Lot area data missing — cannot calculate buildable area')
  }

  // Default flag if no issues found
  if (flags.length === 0) {
    flags.push('No major red flags identified — standard due diligence recommended')
  }

  return flags
}

/**
 * Get opportunity rating from score
 * @param {number} score - Opportunity score (0-100)
 * @returns {string} Rating description
 */
function getOpportunityRating(score) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Very Good'
  if (score >= 40) return 'Good'
  if (score >= 20) return 'Fair'
  return 'Limited'
}

/**
 * Assess overall data quality
 * @param {Object} propertyData - PLUTO property data
 * @param {Object} transitResult - Transit analysis result
 * @param {Object} floodResult - Flood zone result
 * @param {Object} developmentAnalysis - Development analysis result
 * @returns {Object} Data quality assessment
 */
function assessDataQuality(propertyData, transitResult, floodResult, developmentAnalysis) {
  const checks = {
    hasZoningData: !!propertyData.zoning?.district,
    hasLotArea: !!propertyData.lot?.area,
    hasBuildingData: !!propertyData.building?.area,
    hasFARData: !!propertyData.development?.maxAllowedFAR,
    hasTransitData: transitResult.success && transitResult.nearbyStops?.length > 0,
    hasFloodData: floodResult.success,
    hasDevelopmentAnalysis: developmentAnalysis.success,
  }

  const passedChecks = Object.values(checks).filter(Boolean).length
  const totalChecks = Object.keys(checks).length
  const qualityScore = (passedChecks / totalChecks) * 100

  return {
    score: Math.round(qualityScore),
    rating: qualityScore >= 90 ? 'Excellent' : qualityScore >= 70 ? 'Good' : qualityScore >= 50 ? 'Fair' : 'Limited',
    checks,
    completeness: `${passedChecks}/${totalChecks} data sources available`,
  }
}

/**
 * Get a simplified summary for quick display
 * @param {Object} enrichedData - Full enriched property data
 * @returns {Object} Simplified summary
 */
export function getPropertySummary(enrichedData) {
  if (!enrichedData.success) {
    return {
      success: false,
      error: enrichedData.error,
    }
  }

  return {
    success: true,
    address: enrichedData.property.address,
    borough: enrichedData.property.borough,
    zoning: enrichedData.zoning.district,
    transitScore: enrichedData.transit.score || 0,
    transitRating: enrichedData.transit.scoreRating || 'N/A',
    floodZone: enrichedData.environmental.floodZone.zone || 'Unknown',
    floodRisk: enrichedData.environmental.floodZone.riskLevel || 'Unknown',
    opportunityScore: enrichedData.development.opportunity?.score || 0,
    opportunityRating: enrichedData.development.opportunity?.rating || 'N/A',
    remainingDevelopmentRights: enrichedData.development.buildable?.remaining || 0,
    dataQuality: enrichedData._metadata.dataQuality.rating,
  }
}

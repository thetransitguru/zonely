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

    // Compile complete enriched data object
    const enrichedData = {
      success: true,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,

      // Basic property information
      property: {
        address: propertyData.address,
        borough: propertyData.borough,
        block: propertyData.block,
        lot: propertyData.lot,
        bbl: propertyData.bbl,
        coordinates: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      },

      // Zoning information (free preview data)
      zoning: {
        district: propertyData.zoning.district,
        overlay1: propertyData.zoning.overlay1,
        overlay2: propertyData.zoning.overlay2,
        splitZone: propertyData.zoning.splitZone,
        commercialOverlay: propertyData.zoning.commercialOverlay,
      },

      // Building & lot details
      building: {
        class: propertyData.building.class,
        area: propertyData.building.area,
        stories: propertyData.building.stories,
        yearBuilt: propertyData.building.yearBuilt,
        units: propertyData.building.units,
      },

      lot: {
        area: propertyData.lot.area,
        frontage: propertyData.lot.frontage,
        depth: propertyData.lot.depth,
        corner: propertyData.lot.corner,
        irregular: propertyData.lot.irregular,
      },

      // PREMIUM DATA: Transit access analysis
      transit: transitResult.success
        ? {
            score: transitResult.score,
            scoreRating: transitResult.scoreRating,
            summary: transitResult.summary,
            nearbyStops: transitResult.nearbyStops,
            totalStopsInRadius: transitResult.totalStopsInRadius,
            breakdown: transitResult.breakdown,
            uniqueRoutes: transitResult.uniqueRoutes,
            uniqueRouteCount: transitResult.uniqueRouteCount,
          }
        : {
            error: transitResult.error,
            available: false,
          },

      // PREMIUM DATA: Flood zone & environmental
      environmental: {
        floodZone: floodResult.success
          ? {
              zone: floodResult.zone,
              zoneDescription: floodResult.zoneDescription,
              inFloodZone: floodResult.inFloodZone,
              sfha: floodResult.sfha,
              riskLevel: floodResult.riskLevel,
              details: floodResult.details,
            }
          : {
              error: floodResult.error,
              available: false,
            },
        floodInsurance: floodInsurance,
      },

      // PREMIUM DATA: Development potential analysis
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
          : {
              available: false,
              reason: developmentAnalysis.reason,
            },
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

      // Land use and special designations
      landUse: {
        category: propertyData.landUse.category,
        description: propertyData.landUse.description,
        ownerType: propertyData.landUse.ownerType,
      },

      special: {
        historicDistrict: propertyData.special.historicDistrict,
        landmark: propertyData.special.landmark,
        specialDistricts: [
          propertyData.special.specialDistrict1,
          propertyData.special.specialDistrict2,
          propertyData.special.specialDistrict3,
        ].filter(Boolean),
      },

      // Tax assessment data
      assessment: {
        landValue: propertyData.development.assessedValue?.land,
        totalValue: propertyData.development.assessedValue?.total,
      },

      // Metadata about this enrichment
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

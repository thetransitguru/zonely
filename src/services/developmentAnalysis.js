/**
 * Development Analysis Service
 *
 * Provides comprehensive development potential calculations and financial analysis
 * for NYC properties based on zoning, lot characteristics, and market conditions.
 */

/**
 * Calculate comprehensive buildable area and development potential
 * @param {Object} propertyData - Parsed PLUTO property data
 * @returns {Object} Detailed development analysis
 */
export function calculateDevelopmentPotential(propertyData) {
  const lotArea = propertyData.lot?.area
  const currentBuiltFAR = propertyData.development?.far
  const maxFAR = propertyData.development?.maxAllowedFAR
  const currentBuildingArea = propertyData.building?.area || 0
  const zoning = propertyData.zoning?.district

  // Basic validation
  if (!lotArea || !maxFAR) {
    return {
      success: false,
      reason: 'Insufficient data for development analysis',
      lotArea,
      maxFAR,
    }
  }

  // Calculate maximum buildable floor area
  const maxBuildableArea = lotArea * maxFAR
  const remainingBuildable = Math.max(0, maxBuildableArea - currentBuildingArea)
  const utilizedPercentage = currentBuildingArea > 0
    ? (currentBuildingArea / maxBuildableArea) * 100
    : 0

  // Determine development status
  const developmentStatus = getDevelopmentStatus(utilizedPercentage, remainingBuildable)

  // Calculate potential additional floors (assuming 10ft floor height)
  const averageFloorHeight = 10 // feet
  const potentialAdditionalFloors = Math.floor(remainingBuildable / lotArea / averageFloorHeight)

  // Estimate development costs (rough NYC construction costs)
  const constructionCostPerSqFt = getConstructionCostEstimate(zoning, propertyData.building?.class)
  const estimatedConstructionCost = remainingBuildable * constructionCostPerSqFt

  // Calculate development metrics
  const metrics = {
    // Basic buildable area
    maxBuildable: Math.round(maxBuildableArea),
    remaining: Math.round(remainingBuildable),
    utilized: parseFloat(utilizedPercentage.toFixed(1)),

    // FAR information
    currentBuiltFAR: currentBuiltFAR || 0,
    maxAllowedFAR: maxFAR,
    remainingFAR: Math.max(0, maxFAR - (currentBuiltFAR || 0)),

    // Development potential
    potentialAdditionalFloors,
    developmentStatus,
    isUnderdeveloped: developmentStatus === 'significantly_underdeveloped' || developmentStatus === 'underdeveloped',
    isFullyDeveloped: developmentStatus === 'fully_developed',
    isOverBuilt: developmentStatus === 'over_built',

    // Financial estimates
    estimatedConstructionCost: Math.round(estimatedConstructionCost),
    constructionCostPerSqFt,
  }

  // Add opportunity score (0-100)
  metrics.opportunityScore = calculateOpportunityScore(metrics, propertyData)

  // Add recommendations
  metrics.recommendations = generateDevelopmentRecommendations(metrics, propertyData)

  return {
    success: true,
    ...metrics,
  }
}

/**
 * Determine development status based on FAR utilization
 * @param {number} utilizedPercent - Percentage of FAR utilized
 * @param {number} remaining - Remaining buildable square footage
 * @returns {string} Development status
 */
function getDevelopmentStatus(utilizedPercent, remaining) {
  if (utilizedPercent >= 100) {
    return 'fully_developed'
  } else if (utilizedPercent > 100) {
    return 'over_built' // Grandfathered or zoning changed
  } else if (utilizedPercent >= 80) {
    return 'highly_developed'
  } else if (utilizedPercent >= 50) {
    return 'moderately_developed'
  } else if (utilizedPercent >= 25) {
    return 'underdeveloped'
  } else if (remaining > 0) {
    return 'significantly_underdeveloped'
  }
  return 'vacant'
}

/**
 * Get construction cost estimate per square foot
 * Varies by building type and zoning
 * @param {string} zoning - Zoning district
 * @param {string} buildingClass - Building class code
 * @returns {number} Cost per square foot
 */
function getConstructionCostEstimate(zoning, buildingClass) {
  // NYC construction costs (2025 estimates)
  // These are rough averages - actual costs vary significantly

  // Luxury residential (Manhattan)
  if (zoning && zoning.includes('R') && buildingClass && buildingClass.startsWith('R')) {
    return 450 // $450/sqft for luxury residential
  }

  // Commercial/Office
  if (zoning && (zoning.includes('C') || zoning.includes('M'))) {
    return 380 // $380/sqft for commercial
  }

  // Mixed-use
  if (zoning && zoning.includes('M')) {
    return 350 // $350/sqft for mixed-use
  }

  // Standard residential
  if (zoning && zoning.startsWith('R')) {
    return 300 // $300/sqft for standard residential
  }

  // Default
  return 350
}

/**
 * Calculate development opportunity score (0-100)
 * Higher score = better development opportunity
 * @param {Object} metrics - Development metrics
 * @param {Object} propertyData - Property data
 * @returns {number} Opportunity score
 */
function calculateOpportunityScore(metrics, propertyData) {
  let score = 0

  // Factor 1: Remaining buildable area (0-40 points)
  // More remaining = higher score
  if (metrics.remaining > 0) {
    const utilizationFactor = 100 - metrics.utilized
    score += Math.min(40, (utilizationFactor / 100) * 40)
  }

  // Factor 2: Lot size (0-20 points)
  // Larger lots generally better for development
  const lotArea = propertyData.lot?.area || 0
  if (lotArea >= 10000) score += 20
  else if (lotArea >= 5000) score += 15
  else if (lotArea >= 2500) score += 10
  else if (lotArea > 0) score += 5

  // Factor 3: Zoning favorability (0-20 points)
  const zoning = propertyData.zoning?.district || ''
  if (zoning.includes('C') || zoning.includes('M')) {
    score += 20 // Commercial/mixed-use zoning
  } else if (zoning.startsWith('R')) {
    const densityMatch = zoning.match(/R(\d+)/)
    if (densityMatch) {
      const density = parseInt(densityMatch[1])
      score += Math.min(15, density * 2) // Higher density = higher score
    }
  }

  // Factor 4: Corner lot bonus (0-10 points)
  if (propertyData.lot?.corner) {
    score += 10
  }

  // Factor 5: FAR efficiency (0-10 points)
  // Properties with significant unused FAR score higher
  if (metrics.remainingFAR > 2) score += 10
  else if (metrics.remainingFAR > 1) score += 7
  else if (metrics.remainingFAR > 0.5) score += 4

  return Math.round(Math.min(100, score))
}

/**
 * Generate development recommendations
 * @param {Object} metrics - Development metrics
 * @param {Object} propertyData - Property data
 * @returns {Array} Array of recommendation strings
 */
function generateDevelopmentRecommendations(metrics, propertyData) {
  const recommendations = []

  // Underdeveloped property
  if (metrics.isUnderdeveloped) {
    recommendations.push(
      `This property has ${metrics.remaining.toLocaleString()} sq ft of unused development rights, representing a significant opportunity for expansion or redevelopment.`
    )

    if (metrics.potentialAdditionalFloors > 0) {
      recommendations.push(
        `Approximately ${metrics.potentialAdditionalFloors} additional floor${metrics.potentialAdditionalFloors > 1 ? 's' : ''} could be added within current zoning limits.`
      )
    }
  }

  // Fully developed
  if (metrics.isFullyDeveloped) {
    recommendations.push(
      'This property is utilizing the maximum allowed Floor Area Ratio (FAR). Any additional development would require variances or zoning changes.'
    )
  }

  // Over-built
  if (metrics.isOverBuilt) {
    recommendations.push(
      'This property exceeds current FAR limits, likely due to grandfathered rights or previous zoning regulations. This status is protected but cannot be expanded.'
    )
  }

  // Corner lot advantage
  if (propertyData.lot?.corner) {
    recommendations.push(
      'Corner lot status may provide additional zoning benefits such as reduced setback requirements or height bonuses.'
    )
  }

  // Large lot
  if (propertyData.lot?.area >= 10000) {
    recommendations.push(
      `The large lot size (${propertyData.lot.area.toLocaleString()} sq ft) provides flexibility for multiple development scenarios including tower placement and open space requirements.`
    )
  }

  // Special districts
  if (propertyData.special?.specialDistrict1) {
    recommendations.push(
      `Property is in a special zoning district (${propertyData.special.specialDistrict1}). Review special district regulations for potential bonuses or restrictions.`
    )
  }

  // Historic district warning
  if (propertyData.special?.historicDistrict || propertyData.special?.landmark) {
    recommendations.push(
      'Property is in a historic district or is a landmark. All exterior alterations require Landmarks Preservation Commission approval.'
    )
  }

  // General development advice
  if (metrics.opportunityScore >= 70) {
    recommendations.push(
      'Strong development opportunity. Consult with architects and zoning attorneys to explore options for maximizing the site potential.'
    )
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Property is moderately developed. Review zoning regulations and market conditions to determine if additional development is economically viable.'
    )
  }

  return recommendations
}

/**
 * Calculate estimated market value of unused development rights
 * @param {Object} metrics - Development metrics
 * @param {string} borough - Property borough
 * @returns {Object} Value estimates
 */
export function estimateAirRightsValue(metrics, borough) {
  if (!metrics.success || metrics.remaining <= 0) {
    return {
      success: false,
      reason: 'No unused development rights',
    }
  }

  // Approximate air rights values per borough (2025 estimates, very rough)
  const airRightsValuePerSqFt = {
    Manhattan: 250,
    Brooklyn: 150,
    Queens: 100,
    Bronx: 75,
    'Staten Island': 60,
  }

  const valuePerSqFt = airRightsValuePerSqFt[borough] || 100
  const estimatedValue = metrics.remaining * valuePerSqFt

  return {
    success: true,
    remainingRights: metrics.remaining,
    valuePerSqFt,
    estimatedTotalValue: Math.round(estimatedValue),
    borough,
    note: 'This is a rough estimate. Actual air rights values vary significantly based on location, zoning, and market conditions. Consult with a real estate appraiser for accurate valuation.',
  }
}

/**
 * Transit API Service
 * Finds nearby subway and bus stops using the preprocessed GTFS data
 */

// Load the transit stops database
// In production, this would be lazy-loaded or cached
let transitData = null

/**
 * Initialize transit data
 * @returns {Promise<Object>} Transit data
 */
async function loadTransitData() {
  if (transitData) {
    return transitData
  }

  try {
    const response = await fetch('/data/transit-stops.json')
    if (!response.ok) {
      throw new Error('Failed to load transit data')
    }
    transitData = await response.json()
    return transitData
  } catch (error) {
    console.error('Error loading transit data:', error)
    throw error
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Convert meters to walking time estimate
 * Assumes average walking speed of 1.4 m/s (about 3.1 mph)
 * @param {number} distanceMeters - Distance in meters
 * @returns {number} Walking time in minutes
 */
function metersToWalkingMinutes(distanceMeters) {
  const walkingSpeedMetersPerSecond = 1.4
  const seconds = distanceMeters / walkingSpeedMetersPerSecond
  return Math.round(seconds / 60)
}

/**
 * Find nearby transit stops within a specified radius
 * @param {number} latitude - Property latitude
 * @param {number} longitude - Property longitude
 * @param {number} radiusMeters - Search radius in meters (default: 800m ≈ 10 min walk)
 * @returns {Promise<Object>} Nearby transit stops and access score
 */
export async function getNearbyTransit(latitude, longitude, radiusMeters = 800) {
  try {
    const data = await loadTransitData()
    const nearbyStops = []

    // Find all stops within the radius
    for (const stop of data.stops) {
      const distance = calculateDistance(latitude, longitude, stop.lat, stop.lon)

      if (distance <= radiusMeters) {
        nearbyStops.push({
          ...stop,
          distance: Math.round(distance),
          walkingMinutes: metersToWalkingMinutes(distance),
        })
      }
    }

    // Sort by distance (closest first)
    nearbyStops.sort((a, b) => a.distance - b.distance)

    // Calculate transit access score (0-100)
    const score = calculateTransitScore(nearbyStops, radiusMeters)

    return {
      success: true,
      score,
      scoreRating: getScoreRating(score),
      nearbyStops: nearbyStops.slice(0, 10), // Return up to 10 closest stops
      totalStopsInRadius: nearbyStops.length,
      searchRadius: radiusMeters,
      summary: generateTransitSummary(nearbyStops),
    }
  } catch (error) {
    console.error('Transit API error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch transit data',
    }
  }
}

/**
 * Calculate transit access score based on nearby stops
 * Score factors:
 * - Number of stops within walking distance
 * - Variety of routes available
 * - Proximity of closest station
 * - Distribution of stops
 *
 * @param {Array} nearbyStops - Array of nearby transit stops
 * @param {number} radiusMeters - Search radius
 * @returns {number} Score from 0-100
 */
function calculateTransitScore(nearbyStops, radiusMeters) {
  if (nearbyStops.length === 0) return 0

  let score = 0

  // Factor 1: Proximity to closest station (0-40 points)
  // Closer is better, max points at 0m, 0 points at radiusMeters
  const closestDistance = nearbyStops[0].distance
  const proximityScore = Math.max(0, 40 * (1 - closestDistance / radiusMeters))
  score += proximityScore

  // Factor 2: Number of nearby stops (0-30 points)
  // More options is better, max points at 5+ stops
  const stopCountScore = Math.min(30, nearbyStops.length * 6)
  score += stopCountScore

  // Factor 3: Route diversity (0-30 points)
  // Count unique routes across all nearby stops
  const uniqueRoutes = new Set()
  nearbyStops.forEach((stop) => {
    stop.routes.forEach((route) => uniqueRoutes.add(route))
  })
  const routeDiversityScore = Math.min(30, uniqueRoutes.size * 2)
  score += routeDiversityScore

  return Math.round(score)
}

/**
 * Get rating description for a transit score
 * @param {number} score - Transit score (0-100)
 * @returns {string} Rating description
 */
function getScoreRating(score) {
  if (score >= 90) return 'Excellent'
  if (score >= 70) return 'Very Good'
  if (score >= 50) return 'Good'
  if (score >= 30) return 'Fair'
  if (score > 0) return 'Limited'
  return 'No Transit'
}

/**
 * Generate a human-readable summary of transit access
 * @param {Array} nearbyStops - Array of nearby transit stops
 * @returns {string} Transit summary text
 */
function generateTransitSummary(nearbyStops) {
  if (nearbyStops.length === 0) {
    return 'No subway stations within 10-minute walk. Consider bus or car transportation.'
  }

  const closest = nearbyStops[0]
  const routesText = closest.routes.slice(0, 5).join(', ')
  const moreRoutes = closest.routes.length > 5 ? ` +${closest.routes.length - 5} more` : ''

  if (nearbyStops.length === 1) {
    return `${closest.name} (${routesText}${moreRoutes}) is ${closest.walkingMinutes} min walk (${closest.distance}m).`
  }

  return `${nearbyStops.length} stations within walking distance. Closest: ${closest.name} (${routesText}${moreRoutes}) - ${closest.walkingMinutes} min walk.`
}

/**
 * Get detailed transit information for display
 * @param {number} latitude - Property latitude
 * @param {number} longitude - Property longitude
 * @returns {Promise<Object>} Detailed transit information
 */
export async function getTransitDetails(latitude, longitude) {
  const result = await getNearbyTransit(latitude, longitude)

  if (!result.success) {
    return result
  }

  // Group stops by type
  const subwayStops = result.nearbyStops.filter((stop) => stop.type === 'subway')
  const busStops = result.nearbyStops.filter((stop) => stop.type === 'bus')

  // Get unique routes
  const allRoutes = new Set()
  result.nearbyStops.forEach((stop) => {
    stop.routes.forEach((route) => allRoutes.add(route))
  })

  return {
    ...result,
    breakdown: {
      subway: {
        count: subwayStops.length,
        stops: subwayStops,
      },
      bus: {
        count: busStops.length,
        stops: busStops,
      },
    },
    uniqueRoutes: Array.from(allRoutes).sort(),
    uniqueRouteCount: allRoutes.size,
  }
}

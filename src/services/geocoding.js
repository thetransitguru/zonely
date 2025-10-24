/**
 * Geocoding Service
 * Converts NYC addresses to geographic coordinates using Nominatim API
 */

const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search'

// NYC bounding box to improve geocoding accuracy
const NYC_BOUNDS = {
  minLat: 40.477399,
  maxLat: 40.917577,
  minLon: -74.259090,
  maxLon: -73.700272,
}

/**
 * Geocode an NYC address to coordinates
 * @param {string} address - The NYC address to geocode
 * @returns {Promise<Object>} - Geocoding result with coordinates and formatted address
 */
export async function geocodeAddress(address) {
  try {
    // Ensure "New York" is in the address for better accuracy
    const enhancedAddress = address.includes('New York') || address.includes('NY')
      ? address
      : `${address}, New York, NY`

    // Build query parameters
    const params = new URLSearchParams({
      q: enhancedAddress,
      format: 'json',
      limit: '1',
      addressdetails: '1',
      bounded: '1',
      viewbox: `${NYC_BOUNDS.minLon},${NYC_BOUNDS.maxLat},${NYC_BOUNDS.maxLon},${NYC_BOUNDS.minLat}`,
    })

    const response = await fetch(`${NOMINATIM_API_URL}?${params}`, {
      headers: {
        'User-Agent': 'NYC-Zoning-App/1.0', // Nominatim requires a User-Agent
      },
    })

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      throw new Error('Address not found. Please check the address and try again.')
    }

    const result = data[0]

    // Verify result is within NYC bounds
    const lat = parseFloat(result.lat)
    const lon = parseFloat(result.lon)

    if (
      lat < NYC_BOUNDS.minLat ||
      lat > NYC_BOUNDS.maxLat ||
      lon < NYC_BOUNDS.minLon ||
      lon > NYC_BOUNDS.maxLon
    ) {
      throw new Error('Address appears to be outside of New York City. Please enter a valid NYC address.')
    }

    return {
      success: true,
      latitude: lat,
      longitude: lon,
      formattedAddress: result.display_name,
      address: {
        houseNumber: result.address.house_number || '',
        street: result.address.road || '',
        borough: result.address.suburb || result.address.city || '',
        city: result.address.city || 'New York',
        state: result.address.state || 'New York',
        zipCode: result.address.postcode || '',
      },
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return {
      success: false,
      error: error.message || 'Failed to geocode address. Please try again.',
    }
  }
}

/**
 * Validate if an address string looks like a valid NYC address
 * @param {string} address - The address to validate
 * @returns {boolean} - True if address looks valid
 */
export function isValidAddress(address) {
  if (!address || typeof address !== 'string') {
    return false
  }

  const trimmedAddress = address.trim()

  // Must have at least a street number and name
  const hasStreetNumber = /^\d+/.test(trimmedAddress)
  const hasMinimumLength = trimmedAddress.length >= 5

  return hasStreetNumber && hasMinimumLength
}

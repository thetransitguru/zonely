/**
 * PRODUCTION MTA GTFS Data Parser
 *
 * Downloads and parses the complete MTA GTFS (General Transit Feed Specification) data
 * to create a comprehensive, queryable database of ALL NYC subway and bus stops.
 *
 * GTFS Data Sources:
 * - Subway: http://web.mta.info/developers/data/nyct/subway/google_transit.zip
 * - Bus (Manhattan): http://web.mta.info/developers/data/nyct/bus/google_transit_manhattan.zip
 * - Bus (Bronx): http://web.mta.info/developers/data/nyct/bus/google_transit_bronx.zip
 * - Bus (Brooklyn): http://web.mta.info/developers/data/nyct/bus/google_transit_brooklyn.zip
 * - Bus (Queens): http://web.mta.info/developers/data/nyct/bus/google_transit_queens.zip
 * - Bus (Staten Island): http://web.mta.info/developers/data/nyct/bus/google_transit_staten_island.zip
 *
 * Output: Complete JSON file with 400+ subway stations and thousands of bus stops
 *
 * Usage: node scripts/parse-gtfs.js
 */

import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import AdmZip from 'adm-zip'
import { parse } from 'csv-parse/sync'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const GTFS_SOURCES = [
  {
    name: 'Subway',
    url: 'http://web.mta.info/developers/data/nyct/subway/google_transit.zip',
    type: 'subway',
  },
  {
    name: 'Bus - Manhattan',
    url: 'http://web.mta.info/developers/data/nyct/bus/google_transit_manhattan.zip',
    type: 'bus',
    borough: 'Manhattan',
  },
  {
    name: 'Bus - Bronx',
    url: 'http://web.mta.info/developers/data/nyct/bus/google_transit_bronx.zip',
    type: 'bus',
    borough: 'Bronx',
  },
  {
    name: 'Bus - Brooklyn',
    url: 'http://web.mta.info/developers/data/nyct/bus/google_transit_brooklyn.zip',
    type: 'bus',
    borough: 'Brooklyn',
  },
  {
    name: 'Bus - Queens',
    url: 'http://web.mta.info/developers/data/nyct/bus/google_transit_queens.zip',
    type: 'bus',
    borough: 'Queens',
  },
  {
    name: 'Bus - Staten Island',
    url: 'http://web.mta.info/developers/data/nyct/bus/google_transit_staten_island.zip',
    type: 'bus',
    borough: 'Staten Island',
  },
]

const tempDir = path.join(__dirname, '../temp')
const outputDir = path.join(__dirname, '../public/data')

// Ensure directories exist
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

/**
 * Download a file from a URL
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(destPath)

    console.log(`  Downloading: ${url}`)

    client
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Handle redirect
          file.close()
          fs.unlinkSync(destPath)
          return downloadFile(response.headers.location, destPath).then(resolve).catch(reject)
        }

        if (response.statusCode !== 200) {
          file.close()
          fs.unlinkSync(destPath)
          return reject(new Error(`Failed to download: ${response.statusCode}`))
        }

        response.pipe(file)

        file.on('finish', () => {
          file.close()
          resolve(destPath)
        })
      })
      .on('error', (err) => {
        file.close()
        fs.unlinkSync(destPath)
        reject(err)
      })
  })
}

/**
 * Extract GTFS data from ZIP file
 */
function extractGTFS(zipPath, extractPath) {
  console.log(`  Extracting: ${zipPath}`)
  const zip = new AdmZip(zipPath)
  zip.extractAllTo(extractPath, true)
  return extractPath
}

/**
 * Parse GTFS stops.txt file
 */
function parseStops(stopsFilePath) {
  if (!fs.existsSync(stopsFilePath)) {
    console.warn(`  Warning: stops.txt not found at ${stopsFilePath}`)
    return []
  }

  const content = fs.readFileSync(stopsFilePath, 'utf-8')
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  return records
}

/**
 * Parse GTFS routes.txt file
 */
function parseRoutes(routesFilePath) {
  if (!fs.existsSync(routesFilePath)) {
    console.warn(`  Warning: routes.txt not found at ${routesFilePath}`)
    return []
  }

  const content = fs.readFileSync(routesFilePath, 'utf-8')
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  return records
}

/**
 * Parse GTFS stop_times.txt to map routes to stops
 */
function parseStopTimes(stopTimesFilePath) {
  if (!fs.existsSync(stopTimesFilePath)) {
    console.warn(`  Warning: stop_times.txt not found at ${stopTimesFilePath}`)
    return []
  }

  const content = fs.readFileSync(stopTimesFilePath, 'utf-8')
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  return records
}

/**
 * Parse GTFS trips.txt to connect routes and stops
 */
function parseTrips(tripsFilePath) {
  if (!fs.existsSync(tripsFilePath)) {
    console.warn(`  Warning: trips.txt not found at ${tripsFilePath}`)
    return []
  }

  const content = fs.readFileSync(tripsFilePath, 'utf-8')
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  return records
}

/**
 * Process GTFS data source
 */
async function processGTFSSource(source) {
  console.log(`\n📦 Processing: ${source.name}`)

  const zipPath = path.join(tempDir, `${source.type}_${source.borough || 'all'}.zip`)
  const extractPath = path.join(tempDir, source.type + '_' + (source.borough || 'all'))

  try {
    // Download GTFS ZIP
    await downloadFile(source.url, zipPath)

    // Extract ZIP
    extractGTFS(zipPath, extractPath)

    // Parse GTFS files
    const stops = parseStops(path.join(extractPath, 'stops.txt'))
    const routes = parseRoutes(path.join(extractPath, 'routes.txt'))
    const trips = parseTrips(path.join(extractPath, 'trips.txt'))
    const stopTimes = parseStopTimes(path.join(extractPath, 'stop_times.txt'))

    console.log(`  ✓ Stops: ${stops.length}`)
    console.log(`  ✓ Routes: ${routes.length}`)

    // Build route-to-trip mapping
    const routeToTrips = {}
    trips.forEach((trip) => {
      if (!routeToTrips[trip.route_id]) {
        routeToTrips[trip.route_id] = new Set()
      }
      routeToTrips[trip.route_id].add(trip.trip_id)
    })

    // Build stop-to-routes mapping
    const stopToRoutes = {}
    stopTimes.forEach((stopTime) => {
      const stopId = stopTime.stop_id
      const tripId = stopTime.trip_id

      // Find which route this trip belongs to
      for (const [routeId, tripIds] of Object.entries(routeToTrips)) {
        if (tripIds.has(tripId)) {
          if (!stopToRoutes[stopId]) {
            stopToRoutes[stopId] = new Set()
          }
          stopToRoutes[stopId].add(routeId)
          break
        }
      }
    })

    // Create route lookup
    const routeLookup = {}
    routes.forEach((route) => {
      routeLookup[route.route_id] = {
        shortName: route.route_short_name || route.route_id,
        longName: route.route_long_name,
        type: route.route_type,
      }
    })

    // Build final stop data
    const processedStops = stops
      .filter((stop) => {
        // Filter out parent stations for subway (we want actual platforms)
        // location_type: 0 = stop/platform, 1 = station (parent)
        if (source.type === 'subway') {
          return !stop.location_type || stop.location_type === '0'
        }
        return true
      })
      .map((stop) => {
        const stopRoutes = stopToRoutes[stop.stop_id]
        const routeNames = stopRoutes
          ? Array.from(stopRoutes)
              .map((routeId) => routeLookup[routeId]?.shortName || routeId)
              .filter(Boolean)
              .sort()
          : []

        return {
          id: stop.stop_id,
          name: stop.stop_name,
          lat: parseFloat(stop.stop_lat),
          lon: parseFloat(stop.stop_lon),
          type: source.type,
          routes: routeNames,
          borough: source.borough || determineBoroughFromCoords(
            parseFloat(stop.stop_lat),
            parseFloat(stop.stop_lon)
          ),
        }
      })
      .filter((stop) => {
        // Filter out invalid coordinates
        return (
          !isNaN(stop.lat) &&
          !isNaN(stop.lon) &&
          stop.lat >= 40.4 &&
          stop.lat <= 41.0 &&
          stop.lon >= -74.3 &&
          stop.lon <= -73.7
        )
      })

    // Clean up
    fs.unlinkSync(zipPath)

    return processedStops
  } catch (error) {
    console.error(`  ✗ Error processing ${source.name}:`, error.message)
    return []
  }
}

/**
 * Determine borough from coordinates (approximate)
 */
function determineBoroughFromCoords(lat, lon) {
  // Simple bounding box approximation
  if (lat >= 40.917 || lat <= 40.477) return 'Bronx'
  if (lon <= -74.05) return 'Staten Island'
  if (lat <= 40.6 && lon >= -73.96) return 'Brooklyn'
  if (lon >= -73.91) return 'Queens'
  return 'Manhattan'
}

/**
 * Main execution
 */
async function main() {
  console.log('🚇 NYC GTFS Data Parser (Production)')
  console.log('=====================================\n')
  console.log('Downloading and processing complete MTA GTFS data...')
  console.log('This may take several minutes.\n')

  const allStops = []

  // Process all GTFS sources
  for (const source of GTFS_SOURCES) {
    const stops = await processGTFSSource(source)
    allStops.push(...stops)
  }

  // Remove duplicates (same stop ID)
  const uniqueStops = Array.from(
    new Map(allStops.map((stop) => [stop.id, stop])).values()
  )

  // Create final transit data object
  const transitData = {
    metadata: {
      lastUpdated: new Date().toISOString(),
      source: 'MTA GTFS Data (Complete)',
      coverage: 'All NYC subway stations and bus stops',
      totalStops: uniqueStops.length,
      breakdown: {
        subway: uniqueStops.filter((s) => s.type === 'subway').length,
        bus: uniqueStops.filter((s) => s.type === 'bus').length,
      },
    },
    stops: uniqueStops,
  }

  // Write to output file
  const outputPath = path.join(outputDir, 'transit-stops.json')
  fs.writeFileSync(outputPath, JSON.stringify(transitData, null, 2))

  console.log('\n✅ Transit data generated successfully!')
  console.log(`\n📊 Statistics:`)
  console.log(`   Total stops: ${transitData.metadata.totalStops.toLocaleString()}`)
  console.log(`   Subway stations: ${transitData.metadata.breakdown.subway.toLocaleString()}`)
  console.log(`   Bus stops: ${transitData.metadata.breakdown.bus.toLocaleString()}`)
  console.log(`\n📁 Output: ${outputPath}`)
  console.log(`   File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`)

  // Clean up temp directory
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }

  console.log('\n✓ Complete! Transit data is production-ready.')
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})

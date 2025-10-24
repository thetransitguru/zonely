import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

// Fix for default marker icon issue with Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

/**
 * Map Component - Renders an interactive Leaflet map with property location
 * @param {Object} props
 * @param {Array} props.center - [latitude, longitude] coordinates
 * @param {string} props.address - Property address for marker popup
 * @param {number} props.zoom - Map zoom level (default: 17)
 */
function Map({ center, address, zoom = 17 }) {
  // Default to NYC center if no coordinates provided
  const mapCenter = center || [40.7128, -74.006]
  const hasValidCenter = center && center[0] && center[1]

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      scrollWheelZoom={true}
      className="map-container"
      key={`${mapCenter[0]}-${mapCenter[1]}`} // Force re-render on center change
    >
      {/* OpenStreetMap Tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Property Marker */}
      {hasValidCenter && (
        <Marker position={mapCenter}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-gray-900 mb-1">Property Location</p>
              <p className="text-gray-700">{address || 'NYC Property'}</p>
              <p className="text-xs text-gray-500 mt-2">
                Coordinates: {mapCenter[0].toFixed(6)}, {mapCenter[1].toFixed(6)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  )
}

export default Map

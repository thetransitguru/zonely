import React, { useState } from 'react'

function App() {
  // State management
  const [address, setAddress] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [propertyData, setPropertyData] = useState(null)

  // Handle search submission
  const handleSearch = async (e) => {
    e.preventDefault()

    if (!address.trim()) {
      alert('Please enter a valid NYC address')
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    // Simulate API call - will be implemented in Step 3
    setTimeout(() => {
      setIsSearching(false)
      setPropertyData({
        address: address,
        placeholder: true
      })
    }, 1500)
  }

  // Clear search and reset
  const handleClear = () => {
    setAddress('')
    setHasSearched(false)
    setPropertyData(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                NYC Zoning & Transit Report
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Instant property analysis and development potential reports
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-primary-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <section className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Search Property Information
            </h2>
            <p className="text-sm text-gray-600">
              Enter any New York City address to get started. We'll provide basic zoning information for free.
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label htmlFor="address" className="sr-only">
                  NYC Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g., 350 Fifth Avenue, New York, NY"
                    className="input-field pl-10"
                    disabled={isSearching}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSearching || !address.trim()}
                  className="btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <div className="spinner-small"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search
                    </>
                  )}
                </button>

                {hasSearched && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="btn-secondary"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Helper text */}
          <div className="mt-4 flex items-start gap-2 text-sm text-gray-600">
            <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>
              Enter a complete NYC address including street number, street name, and borough/zip code for best results.
            </p>
          </div>
        </section>

        {/* Results Section */}
        {hasSearched && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Map Section */}
            <section className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Property Location
              </h3>

              {/* Map Placeholder */}
              <div className="map-container bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                {isSearching ? (
                  <div className="text-center">
                    <div className="spinner mx-auto mb-3"></div>
                    <p className="text-gray-600">Loading map...</p>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="text-gray-600 font-medium">Interactive Map</p>
                    <p className="text-sm text-gray-500 mt-1">Map will be integrated in Step 3</p>
                  </div>
                )}
              </div>
            </section>

            {/* Property Information Section */}
            <section className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Property Information
              </h3>

              {isSearching ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ) : propertyData ? (
                <div className="space-y-4">
                  {/* Address Display */}
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Address</p>
                    <p className="text-lg font-medium text-gray-900">{propertyData.address}</p>
                  </div>

                  {/* Basic Info Placeholder */}
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Zoning District</p>
                      <p className="text-gray-600 italic">Data will be fetched in Step 3</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Block & Lot</p>
                      <p className="text-gray-600 italic">Data will be fetched in Step 3</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Building Class</p>
                      <p className="text-gray-600 italic">Data will be fetched in Step 3</p>
                    </div>
                  </div>

                  {/* CTA for Full Report */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-5 border border-primary-200">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Want the Full Report?
                      </h4>
                      <p className="text-sm text-gray-700 mb-4">
                        Get a comprehensive PDF report with zoning analysis, transit scores, development potential, and more.
                      </p>
                      <button
                        disabled
                        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Generate Full Report - $29.99
                      </button>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Payment integration coming in Step 6
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        )}

        {/* Empty State */}
        {!hasSearched && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to analyze NYC properties
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Enter a New York City address above to view zoning information, transit access, and development potential.
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Zoning Analysis</h4>
                <p className="text-sm text-gray-600">
                  Detailed zoning districts, FAR, and buildable square footage
                </p>
              </div>

              <div className="text-center">
                <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Transit Access</h4>
                <p className="text-sm text-gray-600">
                  Nearby subway and bus lines with walk time calculations
                </p>
              </div>

              <div className="text-center">
                <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Development Potential</h4>
                <p className="text-sm text-gray-600">
                  Environmental factors and comprehensive market analysis
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            Data sourced from NYC Open Data (PLUTO), MTA GTFS, and FEMA Flood Maps
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App

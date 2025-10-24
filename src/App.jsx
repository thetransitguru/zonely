import React, { useState } from 'react'
import Map from './components/Map'
import { enrichPropertyData } from './services/enrichmentService'

function App() {
  // State management
  const [address, setAddress] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [enrichedData, setEnrichedData] = useState(null)
  const [selectedTier, setSelectedTier] = useState('basic') // basic, pro, pack5, pack20
  const [error, setError] = useState(null)

  // Handle search submission
  const handleSearch = async (e) => {
    e.preventDefault()

    if (!address.trim()) {
      alert('Please enter a valid NYC address')
      return
    }

    setIsSearching(true)
    setError(null)
    setEnrichedData(null)

    try {
      // Use enrichment service to get complete data
      const result = await enrichPropertyData(address)

      if (!result.success) {
        throw new Error(result.error || 'Failed to analyze property')
      }

      setEnrichedData(result)
      setShowPreview(true)
    } catch (err) {
      console.error('Search error:', err)
      setError(err.message || 'An error occurred while analyzing the property')
    } finally {
      setIsSearching(false)
    }
  }

  // Handle new search
  const handleNewSearch = () => {
    setAddress('')
    setShowPreview(false)
    setEnrichedData(null)
    setError(null)
  }

  // Format numbers with commas
  const formatNumber = (num) => {
    if (!num && num !== 0) return 'N/A'
    return num.toLocaleString()
  }

  // Pricing tiers
  const pricingTiers = [
    { id: 'basic', name: 'Basic Opportunity Report', price: 39, description: 'One-page snapshot PDF' },
    { id: 'pro', name: 'Pro Report', price: 79, description: 'Full analysis + recommendations' },
    { id: 'pack5', name: '5-Pack', price: 149, description: '$29.80 per report', perReport: 29.80 },
    { id: 'pack20', name: '20-Pack', price: 499, description: '$24.95 per report', perReport: 24.95 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-primary-600">Zonely</div>
              {showPreview && (
                <button
                  onClick={handleNewSearch}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  New Search
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Built on DCP, MTA, FEMA
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showPreview ? (
          /* ===== LANDING / SEARCH (Public) ===== */
          <div className="max-w-3xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Type an NYC address.<br />We'll do the rest.
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Instant zoning analysis, transit scores, and development potential for any NYC property.
              </p>
            </div>

            {/* Search Form */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Property Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g., 220 E 42nd St, Manhattan"
                    className="input-field text-lg"
                    disabled={isSearching}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSearching || !address.trim()}
                  className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="spinner-small"></div>
                      Analyzing property...
                    </span>
                  ) : (
                    'Analyze Property'
                  )}
                </button>
              </form>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="mt-6 text-center">
                <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                  See sample report →
                </a>
              </div>
            </div>

            {/* Footer Note */}
            <p className="text-center text-xs text-gray-500">
              Not a legal determination. For informational purposes only.
            </p>
          </div>
        ) : (
          /* ===== INSTANT PREVIEW (Locked Teaser) ===== */
          enrichedData && (
            <div>
              {/* Property Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {enrichedData.property.address}
                </h2>
                <p className="text-sm text-gray-600">
                  {enrichedData.property.borough} • BBL: {enrichedData.property.bbl}
                </p>
              </div>

              {/* Two-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN - Unlocked */}
                <div className="lg:col-span-2 space-y-6">
                  {/* ===== Zoning Snapshot (UNLOCKED) ===== */}
                  <div className="bg-white rounded-lg shadow-md p-6 border-2 border-green-500">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Zoning Snapshot</h3>
                        <p className="text-xs text-green-600 font-medium">UNLOCKED</p>
                      </div>
                      <div className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                        FREE PREVIEW
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Zoning District */}
                      <div className="bg-primary-50 rounded-lg p-4">
                        <p className="text-xs text-gray-600 mb-1">Zoning District</p>
                        <p className="text-2xl font-bold text-primary-900">
                          {enrichedData.zoning.district}
                        </p>
                      </div>

                      {/* Overlays */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-600 mb-1">Overlays</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {enrichedData.zoning.overlay1 || 'None detected'}
                        </p>
                      </div>

                      {/* Lot Area */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-600 mb-1">Lot Area (PLUTO)</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatNumber(enrichedData.lot.area)} sf
                        </p>
                      </div>

                      {/* Base FAR */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-600 mb-1">Base FAR (district)</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {enrichedData.development.far.maxAllowed?.toFixed(1) || 'N/A'}
                        </p>
                      </div>

                      {/* By-Right Potential */}
                      <div className="col-span-2 bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-xs text-gray-600 mb-1">By-right potential (conservative)</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {formatNumber(enrichedData.development.buildable?.maxBuildable)} sf
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          Excludes special permits/bonuses & zoning-lot mergers
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ===== Unused Development Rights (LOCKED) ===== */}
                  <div className="relative bg-white rounded-lg shadow-md p-6 border border-gray-300 overflow-hidden">
                    {/* Blur Overlay */}
                    <div className="absolute inset-0 backdrop-blur-md bg-white/40 z-10 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Unlock Full Analysis</h4>
                        <button
                          onClick={() => document.getElementById('pricing-card').scrollIntoView({ behavior: 'smooth' })}
                          className="btn-primary"
                        >
                          View Pricing
                        </button>
                      </div>
                    </div>

                    {/* Content (blurred) */}
                    <div className="opacity-60">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Unused Development Rights</h3>
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                        <p className="text-3xl font-bold text-green-900 mb-2">
                          {formatNumber(enrichedData.development.buildable?.remaining || 0)} sf
                        </p>
                        <p className="text-sm text-gray-700">
                          of unused development rights available under current zoning
                        </p>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Potential Additional Floors:</span>
                          <span className="text-sm font-semibold">{enrichedData.development.buildable?.potentialAdditionalFloors || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Est. Construction Cost:</span>
                          <span className="text-sm font-semibold">${formatNumber(enrichedData.development.buildable?.estimatedConstructionCost || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ===== Transit & Flood (LOCKED) ===== */}
                  <div className="relative bg-white rounded-lg shadow-md p-6 border border-gray-300 overflow-hidden">
                    {/* Blur Overlay */}
                    <div className="absolute inset-0 backdrop-blur-md bg-white/40 z-10 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Unlock Full Analysis</h4>
                        <button
                          onClick={() => document.getElementById('pricing-card').scrollIntoView({ behavior: 'smooth' })}
                          className="btn-primary"
                        >
                          View Pricing
                        </button>
                      </div>
                    </div>

                    {/* Content (blurred) */}
                    <div className="opacity-60">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Transit & Environmental</h3>

                      {/* Transit */}
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Transit Access</h4>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-bold text-blue-900">{enrichedData.transit.score}/100</span>
                            <span className="bg-blue-200 text-blue-900 text-xs font-semibold px-3 py-1 rounded-full">
                              {enrichedData.transit.scoreRating}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {enrichedData.transit.uniqueRouteCount} subway lines within 10-minute walk
                          </p>
                        </div>
                      </div>

                      {/* Flood */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Flood Risk</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-lg font-semibold text-gray-900">
                                Zone {enrichedData.environmental.floodZone.zone}
                              </p>
                              <p className="text-sm text-gray-600">
                                {enrichedData.environmental.floodZone.riskLevel} risk
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN - Pricing */}
                <div className="lg:col-span-1">
                  {/* ===== Report Options (Sticky) ===== */}
                  <div id="pricing-card" className="bg-white rounded-lg shadow-lg p-6 border-2 border-primary-500 sticky top-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Report Options</h3>

                    {/* Pricing Tiers */}
                    <div className="space-y-3 mb-6">
                      {pricingTiers.map((tier) => (
                        <button
                          key={tier.id}
                          onClick={() => setSelectedTier(tier.id)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            selectedTier === tier.id
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <p className="font-semibold text-gray-900">{tier.name}</p>
                              <p className="text-xs text-gray-600">{tier.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-gray-900">${tier.price}</p>
                              {tier.perReport && (
                                <p className="text-xs text-green-600">${tier.perReport} ea.</p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* CTAs */}
                    <div className="space-y-3">
                      <button className="btn-primary w-full text-lg py-3">
                        Generate Report
                      </button>
                      <button className="btn-secondary w-full">
                        Preview 1 page for free
                      </button>
                    </div>

                    {/* What's Included */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Includes:</p>
                      <ul className="space-y-1 text-xs text-gray-600">
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Complete zoning & FAR analysis</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Transit access score (10-min walkshed)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>FEMA flood zone determination</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Development opportunity scoring</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Professional PDF export</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  )
}

export default App

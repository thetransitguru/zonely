import React, { useState } from 'react'
import Map from './components/Map'
import { enrichPropertyData } from './services/enrichmentService'

function App() {
  // State management
  const [address, setAddress] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [enrichedData, setEnrichedData] = useState(null)
  const [selectedTier, setSelectedTier] = useState('pro') // basic, pro, pack5, pack20
  const [error, setError] = useState(null)

  // Handle search submission
  const handleSearch = async (e) => {
    e.preventDefault()

    if (!address.trim()) {
      setError('Please enter a valid NYC address')
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
    { id: 'basic', name: 'Basic Snapshot', price: 39, description: 'One-page PDF report', popular: false },
    { id: 'pro', name: 'Pro Report', price: 79, description: 'Full analysis + insights', popular: true },
    { id: 'pack5', name: '5-Report Pack', price: 149, description: '$29.80 per report', perReport: 29.80, popular: false },
    { id: 'pack20', name: '20-Report Pack', price: 499, description: '$24.95 per report', perReport: 24.95, popular: false },
  ]

  return (
    <div className="min-h-screen bg-dark-bg">
      {!showPreview ? (
        /* ===== FULL-SCREEN LANDING PAGE ===== */
        <div className="min-h-screen flex items-center justify-center px-4 animate-fade-in">
          <div className="w-full max-w-2xl">
            {/* Logo */}
            <div className="text-center mb-12">
              <h1 className="text-6xl font-bold mb-2 tracking-tight">
                <span className="text-dark-text">ZONE</span>
                <span className="text-accent-500 glow-text">LY</span>
              </h1>
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-accent-500 to-transparent mx-auto"></div>
            </div>

            {/* Hero Text */}
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-bold text-dark-text mb-4 leading-tight">
                The Decision-Ready Report<br />
                <span className="text-dark-muted font-normal text-3xl">for any NYC Property</span>
              </h2>
              <p className="text-lg text-dark-muted max-w-xl mx-auto">
                Instant analysis of zoning, transit, and development potential.<br />
                Get your Opportunity Snapshot in seconds.
              </p>
            </div>

            {/* Premium Search Box */}
            <form onSubmit={handleSearch} className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter NYC address (e.g., 350 Fifth Avenue, Manhattan)"
                  className="input-field text-center focus:animate-glow-pulse"
                  disabled={isSearching}
                  autoFocus
                />

                {/* Search Button integrated into input */}
                <button
                  type="submit"
                  disabled={isSearching || !address.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <span className="flex items-center gap-2">
                      <div className="spinner-small"></div>
                      Analyzing...
                    </span>
                  ) : (
                    'Analyze'
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-4 bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </form>

            {/* Trust Indicators */}
            <div className="text-center">
              <p className="text-xs text-dark-muted mb-3">Powered by official NYC datasets</p>
              <div className="flex items-center justify-center gap-6 text-xs text-dark-muted font-mono">
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-blueprint-line rounded-full"></div>
                  NYC DCP PLUTO
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-blueprint-line rounded-full"></div>
                  MTA GTFS
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-blueprint-line rounded-full"></div>
                  FEMA NFHL
                </span>
              </div>
            </div>

            {/* Footer Note */}
            <p className="text-center text-xs text-dark-muted mt-12 opacity-60">
              Not a legal determination. For informational purposes only.
            </p>
          </div>
        </div>
      ) : (
        /* ===== INSTANT PREVIEW PAGE (Dark Theme) ===== */
        enrichedData && (
          <div className="animate-fade-in">
            {/* Header */}
            <header className="bg-dark-card border-b border-dark-border sticky top-0 z-50 backdrop-blur-sm bg-dark-card/80">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">
                      <span className="text-dark-text">ZONE</span>
                      <span className="text-accent-500">LY</span>
                    </h1>
                    <div className="h-6 w-px bg-dark-border"></div>
                    <button
                      onClick={handleNewSearch}
                      className="btn-ghost flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      New Search
                    </button>
                  </div>
                  <div className="text-xs text-dark-muted font-mono">
                    Report ID: {enrichedData.report_id || 'ZNY-###'}
                  </div>
                </div>
              </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Property Header */}
              <div className="card mb-8 border-l-4 border-accent-500">
                <h2 className="text-3xl font-bold text-dark-text mb-2">
                  {enrichedData.property.address}
                </h2>
                <div className="flex items-center gap-4 text-sm text-dark-muted font-mono">
                  <span>{enrichedData.property.borough}</span>
                  <span className="text-dark-border">•</span>
                  <span>BBL: {enrichedData.property.bbl}</span>
                  <span className="text-dark-border">•</span>
                  <span>Block {enrichedData.property.block}, Lot {enrichedData.property.lot}</span>
                </div>
              </div>

              {/* Two-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN - Preview Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* ===== Zoning Snapshot (UNLOCKED) ===== */}
                  <div className="card border-2 border-accent-500 relative overflow-hidden">
                    {/* Accent glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl"></div>

                    <div className="flex items-start justify-between mb-6 relative">
                      <div>
                        <h3 className="text-xl font-bold text-dark-text">Zoning Snapshot</h3>
                        <p className="text-xs text-accent-500 font-semibold mt-1">UNLOCKED • FREE PREVIEW</p>
                      </div>
                      <div className="bg-accent-500 text-dark-bg text-xs font-bold px-3 py-1.5 rounded-md shadow-glow-green">
                        FREE
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Zoning District */}
                      <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                        <p className="text-xs text-dark-muted mb-1 font-mono">Zoning District</p>
                        <p className="text-3xl font-bold text-accent-500">
                          {enrichedData.zoning?.district || 'N/A'}
                        </p>
                      </div>

                      {/* Overlays */}
                      <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                        <p className="text-xs text-dark-muted mb-1 font-mono">Overlays</p>
                        <p className="text-lg font-semibold text-dark-text">
                          {enrichedData.zoning?.overlays?.length > 0
                            ? enrichedData.zoning.overlays.join(', ')
                            : 'None'}
                        </p>
                      </div>

                      {/* Lot Area */}
                      <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                        <p className="text-xs text-dark-muted mb-1 font-mono">Lot Area (PLUTO)</p>
                        <p className="text-lg font-semibold text-dark-text">
                          {formatNumber(enrichedData.lot?.area)} <span className="text-sm text-dark-muted">sf</span>
                        </p>
                      </div>

                      {/* Base FAR */}
                      <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                        <p className="text-xs text-dark-muted mb-1 font-mono">Base FAR</p>
                        <p className="text-lg font-semibold text-dark-text">
                          {enrichedData.capacity?.base_far?.toFixed(2) || 'N/A'}
                        </p>
                      </div>

                      {/* By-Right Potential */}
                      <div className="col-span-2 bg-gradient-to-br from-blueprint-faint to-dark-bg rounded-lg p-4 border border-blueprint-line">
                        <p className="text-xs text-dark-muted mb-1 font-mono">By-right potential (conservative)</p>
                        <p className="text-3xl font-bold text-blueprint-line">
                          {formatNumber(enrichedData.capacity?.max_gfa_sqft)} <span className="text-lg text-dark-muted">sf</span>
                        </p>
                        <p className="text-xs text-dark-muted mt-2">
                          Excludes bonuses, special permits & zoning-lot mergers
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ===== Unused Development Rights (LOCKED - GLASS MORPHISM) ===== */}
                  <div className="relative card overflow-hidden min-h-[300px]">
                    {/* Skeleton Loaders (visible behind blur) */}
                    <div className="opacity-30">
                      <h3 className="text-xl font-bold text-dark-text mb-6">Unused Development Rights</h3>
                      <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg p-6 border border-green-500/20 mb-4">
                        <div className="skeleton-number mb-3"></div>
                        <div className="skeleton-text w-3/4"></div>
                      </div>
                      <div className="space-y-3">
                        <div className="skeleton-text"></div>
                        <div className="skeleton-text"></div>
                        <div className="skeleton-text w-5/6"></div>
                      </div>
                    </div>

                    {/* Glass Morphism Lock Overlay */}
                    <div className="absolute inset-0 glass-lock-overlay flex items-center justify-center">
                      <div className="text-center px-6">
                        {/* Lock Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dark-card border-2 border-accent-500 mb-4 shadow-glow-green">
                          <svg className="w-10 h-10 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <h4 className="text-2xl font-bold text-dark-text mb-2">Unlock Full Analysis</h4>
                        <p className="text-sm text-dark-muted mb-4">See development rights, air rights valuation & opportunity scoring</p>
                        <button
                          onClick={() => document.getElementById('pricing-card').scrollIntoView({ behavior: 'smooth' })}
                          className="btn-primary"
                        >
                          View Pricing
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ===== Transit & Environmental (LOCKED - GLASS MORPHISM) ===== */}
                  <div className="relative card overflow-hidden min-h-[300px]">
                    {/* Skeleton Loaders */}
                    <div className="opacity-30">
                      <h3 className="text-xl font-bold text-dark-text mb-6">Transit & Environmental Risk</h3>

                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-dark-muted mb-3 font-mono">TRANSIT ACCESS</h4>
                        <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/20">
                          <div className="flex items-center gap-4">
                            <div className="skeleton-number"></div>
                            <div className="flex-1">
                              <div className="skeleton-text w-2/3"></div>
                              <div className="skeleton-text w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-dark-muted mb-3 font-mono">FLOOD RISK</h4>
                        <div className="skeleton-text"></div>
                        <div className="skeleton-text w-3/4"></div>
                      </div>
                    </div>

                    {/* Glass Morphism Lock Overlay */}
                    <div className="absolute inset-0 glass-lock-overlay flex items-center justify-center">
                      <div className="text-center px-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dark-card border-2 border-accent-500 mb-4 shadow-glow-green">
                          <svg className="w-10 h-10 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <h4 className="text-2xl font-bold text-dark-text mb-2">Unlock Full Analysis</h4>
                        <p className="text-sm text-dark-muted mb-4">See transit scores, flood zones & environmental risk factors</p>
                        <button
                          onClick={() => document.getElementById('pricing-card').scrollIntoView({ behavior: 'smooth' })}
                          className="btn-primary"
                        >
                          View Pricing
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN - Pricing (Sticky) */}
                <div className="lg:col-span-1">
                  <div id="pricing-card" className="card border-2 border-accent-500 sticky top-24 shadow-glow-green">
                    {/* Header */}
                    <div className="text-center mb-6 pb-6 border-b border-dark-border">
                      <h3 className="text-2xl font-bold text-dark-text mb-2">Get Your Report</h3>
                      <p className="text-sm text-dark-muted">Professional-grade analysis in seconds</p>
                    </div>

                    {/* Pricing Tiers */}
                    <div className="space-y-3 mb-6">
                      {pricingTiers.map((tier) => (
                        <button
                          key={tier.id}
                          onClick={() => setSelectedTier(tier.id)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all relative ${
                            selectedTier === tier.id
                              ? 'border-accent-500 bg-accent-500/10 shadow-glow-green'
                              : 'border-dark-border hover:border-accent-500/50 bg-dark-bg'
                          }`}
                        >
                          {tier.popular && (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                              <span className="bg-gold-500 text-dark-bg text-xs font-bold px-3 py-0.5 rounded-full">
                                POPULAR
                              </span>
                            </div>
                          )}

                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <p className="font-bold text-dark-text">{tier.name}</p>
                              <p className="text-xs text-dark-muted">{tier.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-accent-500">${tier.price}</p>
                              {tier.perReport && (
                                <p className="text-xs text-dark-muted">${tier.perReport} ea.</p>
                              )}
                            </div>
                          </div>

                          {selectedTier === tier.id && (
                            <div className="mt-2 pt-2 border-t border-accent-500/30">
                              <p className="text-xs text-accent-500 font-semibold">✓ Selected</p>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* CTAs */}
                    <div className="space-y-3 mb-6">
                      <button className="btn-primary w-full text-lg py-4">
                        Generate Report
                      </button>
                      <p className="text-xs text-center text-dark-muted">
                        Instant download • Secure payment via Stripe
                      </p>
                    </div>

                    {/* What's Included */}
                    <div className="pt-6 border-t border-dark-border">
                      <p className="text-xs font-bold text-dark-text mb-3 font-mono">INCLUDES:</p>
                      <ul className="space-y-2 text-xs text-dark-muted">
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Complete zoning & FAR analysis</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Transit access scoring (10-min walkshed)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>FEMA flood zone determination</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Development opportunity scoring</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Professional PDF export (Letter size)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        )
      )}
    </div>
  )
}

export default App

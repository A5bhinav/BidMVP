// components/CampusSelector.js
// Campus selection component with auto-detection display and manual search
// Props:
//   - detectedCampus: Object with {id, name, domain, abbreviation} or null
//   - onSelect: Function(schoolId) called when user confirms manual selection
//   - onConfirm: Function() called when user confirms auto-detected campus
//   - loading: Boolean for loading state
//   - error: Error message string or null
//   - onSearch: Function(query) called to search schools (returns Promise)

'use client'

import { useState, useEffect, useRef } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function CampusSelector({ 
  detectedCampus, 
  onSelect, 
  onConfirm,
  onNotCorrect,
  showSearch: externalShowSearch,
  loading = false, 
  error = null,
  onSearch 
}) {
  // Use external showSearch prop if provided, otherwise default to !detectedCampus
  const [internalShowSearch, setInternalShowSearch] = useState(!detectedCampus)
  const showSearch = externalShowSearch !== undefined ? externalShowSearch : internalShowSearch
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [searchError, setSearchError] = useState(null)
  const searchInputRef = useRef(null)
  const debounceTimerRef = useRef(null)

  // Auto-focus search input when search UI is shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!showSearch || !searchQuery.trim() || !onSearch) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    setSearchError(null)

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await onSearch(searchQuery.trim(), 15)
        if (result.error) {
          setSearchError(result.error.message || 'Failed to search schools')
          setSearchResults([])
        } else {
          setSearchResults(result.data || [])
        }
      } catch (err) {
        setSearchError(err.message || 'Failed to search schools')
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, showSearch, onSearch])

  const handleConfirmDetected = () => {
    if (onConfirm && !loading) {
      onConfirm()
    }
  }

  const handleNotCorrect = () => {
    if (externalShowSearch === undefined) {
      // Only update internal state if not controlled externally
      setInternalShowSearch(true)
    }
    setSelectedSchool(null)
    // Notify parent component that user is in manual search mode
    if (onNotCorrect) {
      onNotCorrect()
    }
  }

  const handleSchoolClick = (school) => {
    setSelectedSchool(school)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleConfirmSelection = () => {
    if (selectedSchool && onSelect && !loading) {
      onSelect(selectedSchool.id)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setSelectedSchool(null)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Show detected campus UI
  if (detectedCampus && !showSearch) {
    return (
      <div className="space-y-6">
        {/* Detected Campus Display */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary-ui/10 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-primary-ui"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-heading2 text-neutral-black mb-1">
              {detectedCampus.name || detectedCampus.domain}
            </h2>
            <p className="text-bodySmall text-gray-medium">
              {detectedCampus.domain}
            </p>
            {detectedCampus.abbreviation && (
              <p className="text-bodySmall text-gray-dark mt-1">
                {detectedCampus.abbreviation}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleConfirmDetected}
            disabled={loading}
            variant="primary"
            size="large"
            className="w-full"
          >
            {loading ? 'Confirming...' : 'This looks correct'}
          </Button>
          <Button
            onClick={handleNotCorrect}
            disabled={loading}
            variant="text"
            size="medium"
            className="w-full"
          >
            Not correct?
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border-2 border-error text-error rounded-md text-sm">
            {error}
          </div>
        )}
      </div>
    )
  }

  // Show manual search UI
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-heading2 text-neutral-black mb-2">
          Select Your Campus
        </h2>
        <p className="text-bodySmall text-gray-medium mb-4">
          Search for your school by name or domain
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <svg
            className="w-5 h-5 text-gray-medium"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <Input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for your school..."
          className="pl-12 pr-10"
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-medium hover:text-gray-dark"
            aria-label="Clear search"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Selected School Display */}
      {selectedSchool && (
        <Card variant="flat" className="border-2 border-primary-ui">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-neutral-black">
              {selectedSchool.name}
            </h3>
            <p className="text-sm text-gray-medium">{selectedSchool.domain}</p>
            {selectedSchool.abbreviation && (
              <p className="text-sm text-gray-dark">
                {selectedSchool.abbreviation}
              </p>
            )}
          </div>
          <Button
            onClick={handleConfirmSelection}
            disabled={loading}
            variant="primary"
            size="large"
            className="w-full mt-4"
          >
            {loading ? 'Confirming...' : 'Confirm Selection'}
          </Button>
        </Card>
      )}

      {/* Search Results */}
      {!selectedSchool && searchQuery.trim() && (
        <div className="relative">
          {searchLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-ui border-t-transparent"></div>
            </div>
          )}

          {!searchLoading && searchResults.length > 0 && (
            <div className="max-h-64 overflow-y-auto border border-gray-border rounded-md bg-white">
              {searchResults.map((school) => (
                <button
                  key={school.id}
                  onClick={() => handleSchoolClick(school)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-light transition-colors border-b border-gray-border last:border-b-0"
                >
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-neutral-black">
                      {school.name}
                    </p>
                    <p className="text-sm text-gray-medium">{school.domain}</p>
                    {school.abbreviation && (
                      <p className="text-sm text-gray-dark">
                        {school.abbreviation}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!searchLoading && searchQuery.trim() && searchResults.length === 0 && !searchError && (
            <div className="text-center py-8 text-gray-medium">
              <p>No schools found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          )}

          {searchError && (
            <div className="p-4 bg-red-50 border-2 border-error text-error rounded-md text-sm">
              {searchError}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-2 border-error text-error rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  )
}


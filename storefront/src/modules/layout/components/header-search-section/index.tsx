"use client"
import React, { useState, useEffect, useCallback } from 'react';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  handle: string;
  variant_sku?: string;
  [key: string]: any;
}

const HeaderSearchSection = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('https://meilisearch-production-4381.up.railway.app/indexes/products/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 1736a63c82c45518d38d9a8e8bd378885b15c79e85e03fbb4d65bba5e4f452e1'
        },
        body: JSON.stringify({ 
          q: searchQuery,
          limit: 6
        })
      });

      const data = await response.json();
      setResults(data.hits || []);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      window.location.href = `/store?q=${encodeURIComponent(query)}`;
    }
  };

  const handleSearchClick = () => {
    if (query.trim()) {
      window.location.href = `/store?q=${encodeURIComponent(query)}`;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    window.location.href = `/products/${result.handle}`;
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
   <section className="fixed top-20 lg:top-24 left-0 right-0 z-40 bg-blue-50 border-b border-blue-200 py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative max-w-2xl mx-auto">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Search by product name or SKU..."
              className="w-full px-4 py-3 pr-20 text-base border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
            />
            
            {/* Right side icons */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {query && (
                <button
                  onClick={clearSearch}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  aria-label="Clear search"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              <button
                onClick={handleSearchClick}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Search"
              >
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search Results Dropdown */}
          {showResults && query && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg z-50 max-h-96 overflow-hidden">
              {isLoading && (
                <div className="p-4 text-center text-gray-500">
                  Searching...
                </div>
              )}
              
              {!isLoading && results.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No results found for "{query}"
                </div>
              )}
              
              {!isLoading && results.length > 0 && (
                <div className="divide-y divide-gray-100">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded mr-3 flex-shrink-0 flex items-center justify-center">
                        {result.thumbnail ? (
                          <img
                            src={result.thumbnail}
                            alt={result.title}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <div className="text-gray-400 text-xs">IMG</div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {result.title}
                        </div>
                        {result.variant_sku && (
                          <div className="text-sm text-blue-600 font-medium">
                            SKU: {result.variant_sku}
                          </div>
                        )}
                        {result.description && (
                          <div className="text-sm text-gray-500 truncate">
                            {result.description.substring(0, 60)}...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* View All Results Link */}
                  <div className="p-3 bg-gray-50">
                    <button
                      onClick={handleSearchClick}
                      className="w-full text-center text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View all results for "{query}"
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </section>
  );
};

export default HeaderSearchSection;

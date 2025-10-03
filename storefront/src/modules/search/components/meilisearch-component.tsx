"use client"
import React, { useState, useEffect } from 'react';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  handle: string;
  variant_sku?: string;
  [key: string]: any;
}

const MeiliSearchComponent = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const performSearch = async (searchQuery: string) => {
    console.log('🔍 PERFORM SEARCH CALLED with:', searchQuery);
    
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
          limit: 10
        })
      });

      const data = await response.json();
      console.log('✅ Got results:', data.hits?.length || 0, 'items');
      setResults(data.hits || []);
      setShowResults(true);
    } catch (error) {
      console.error('❌ Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Search with debounce
  useEffect(() => {
    console.log('🕐 Effect triggered, query:', query);
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('⌨️ Input changed to:', newValue);
    setQuery(newValue);
  };
  // Handle Enter key - go to search results page
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter' && query.trim()) {
    e.preventDefault();
    console.log('🔍 Enter pressed, navigating to store with search:', query);
    window.location.href = `/store?q=${encodeURIComponent(query)}`;
  }
};

  // Handle clicking on search icon
  const handleSearchClick = () => {
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  };

  // Handle clicking on specific product
  const handleResultClick = (result: SearchResult) => {
    window.location.href = `/products/${result.handle}`;
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const featuredResult = results[0];
  const otherResults = results.slice(1);

  return (
    <div style={{ position: 'relative', padding: '20px', marginTop: '100px' }}>
      <div style={{ position: 'relative' }}>
        {/* Search input with icons */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <input
            type='text'
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder='Search by product name or SKU...'
            style={{ 
              padding: '15px 60px 15px 20px', 
              width: '800px', 
              border: '2px solid #007acc',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none'
            }}
          />
          
          {/* Right side icons */}
          <div style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {/* Clear button (X) */}
            {query && (
              <button
                onClick={clearSearch}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#666',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            )}
            
            {/* Search button (magnifying glass) */}
            <button
              onClick={handleSearchClick}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#007acc',
                padding: '4px'
              }}
            >
              🔍
            </button>
          </div>
        </div>
        
        {/* Live search dropdown */}
        {showResults && query && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            width: '800px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '0 0 8px 8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            maxHeight: '500px',
            overflow: 'hidden'
          }}>
            {isLoading && (
              <div style={{ padding: '20px', color: '#666', textAlign: 'center' }}>
                Searching...
              </div>
            )}
            
            {!isLoading && results.length === 0 && (
              <div style={{ padding: '20px', color: '#666', textAlign: 'center' }}>
                No results found
              </div>
            )}
            
            {!isLoading && results.length > 0 && (
              <div style={{ display: 'flex', minHeight: '300px' }}>
                {/* Left side - small product list */}
                <div style={{ 
                  flex: '1', 
                  borderRight: '1px solid #eee',
                  maxHeight: '500px',
                  overflowY: 'auto'
                }}>
                  {otherResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'white';
                      }}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '4px',
                        marginRight: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        C
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', color: '#333' }}>
                          {result.title}
                        </div>
                        {/* Show SKU if available */}
                        {result.variant_sku && (
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#007acc',
                            fontWeight: '500',
                            marginTop: '2px'
                          }}>
                            SKU: {result.variant_sku}
                          </div>
                        )}
                        {result.description && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#888',
                            marginTop: '2px'
                          }}>
                            {result.description.substring(0, 50)}...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right side - featured product */}
                {featuredResult && (
                  <div style={{ 
                    flex: '1', 
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fafbfc'
                  }}>
                    <div 
                      onClick={() => handleResultClick(featuredResult)}
                      style={{ 
                        cursor: 'pointer',
                        textAlign: 'center',
                        width: '100%'
                      }}
                    >
                      {featuredResult.thumbnail ? (
                        <img
                          src={featuredResult.thumbnail}
                          alt={featuredResult.title}
                          style={{
                            width: '120px',
                            height: '120px',
                            objectFit: 'contain',
                            marginBottom: '15px',
                            borderRadius: '8px'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '120px',
                          height: '120px',
                          backgroundColor: '#e9ecef',
                          margin: '0 auto 15px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          color: '#6c757d'
                        }}>
                          No Image
                        </div>
                      )}
                      
                      <h3 style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#333'
                      }}>
                        {featuredResult.title}
                      </h3>
                      
                      {/* Show featured product SKU */}
                      {featuredResult.variant_sku && (
                        <div style={{
                          fontSize: '14px',
                          color: '#007acc',
                          fontWeight: '600',
                          marginBottom: '8px'
                        }}>
                          SKU: {featuredResult.variant_sku}
                        </div>
                      )}
                      
                      <p style={{ 
                        margin: '0 0 12px 0', 
                        fontSize: '14px',
                        color: '#666',
                        lineHeight: '1.4'
                      }}>
                        {featuredResult.description 
                          ? featuredResult.description.substring(0, 100) + '...'
                          : 'No description available'
                        }
                      </p>
                      
                      <div style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        1 in stock
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Click outside to close */}
      {showResults && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
};

export default MeiliSearchComponent;

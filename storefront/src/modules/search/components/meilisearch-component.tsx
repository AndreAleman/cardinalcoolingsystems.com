"use client"
import React, { useState, useEffect } from 'react';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  handle: string;
  variants?: Array<{
    id: string;
    sku: string;
    title?: string;
    options?: Array<{
      option?: { title: string };
      value: string;
    }>;
    metadata?: {
      competitor_skus?: string[];
    };
  }>;
  [key: string]: any;
}

const MeiliSearchComponent = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const performSearch = async (searchQuery: string) => {
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
      setResults(data.hits || []);
      setShowResults(true);
    } catch (error) {
      console.error('❌ Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

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
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  };

  // ✅ Find matching variant for each result
  const getMatchedVariant = (result: SearchResult) => {
    if (!result.variants || !query) return null;
    
    const lowerQuery = query.toLowerCase();
    return result.variants.find(v => {
      // Check SKU
      if (v.sku?.toLowerCase().includes(lowerQuery)) return true;
      
      // Check competitor SKUs
      const competitorSkus = v.metadata?.competitor_skus;
      if (competitorSkus?.some(sku => sku.toLowerCase().includes(lowerQuery))) {
        return true;
      }
      
      return false;
    });
  };

  // ✅ Get variant options as readable string
  const getVariantOptionsString = (variant: any) => {
    if (!variant?.options) return '';
    
    return variant.options
      .filter((opt: any) => opt.option?.title && opt.value)
      .map((opt: any) => opt.value)
      .join(' | ');
  };

  const handleResultClick = (result: SearchResult, matchedVariant?: any) => {
    const url = matchedVariant 
      ? `/products/${result.handle}?sku=${matchedVariant.sku}`
      : `/products/${result.handle}`;
    window.location.href = url;
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div style={{ position: 'relative', padding: '20px', marginTop: '100px' }}>
      <div style={{ position: 'relative' }}>
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
          
          <div style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {query && (
              <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#666', padding: '4px' }}>
                ✕
              </button>
            )}
            <button onClick={handleSearchClick} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#007acc', padding: '4px' }}>
              🔍
            </button>
          </div>
        </div>
        
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
            overflowY: 'auto'
          }}>
            {isLoading && (
              <div style={{ padding: '20px', color: '#666', textAlign: 'center' }}>Searching...</div>
            )}
            
            {!isLoading && results.length === 0 && (
              <div style={{ padding: '20px', color: '#666', textAlign: 'center' }}>No results found</div>
            )}
            
            {!isLoading && results.length > 0 && (
              <div>
                {results.map((result) => {
                  const matchedVariant = getMatchedVariant(result);
                  const variantOptions = matchedVariant ? getVariantOptionsString(matchedVariant) : '';
                  const competitorSkus = matchedVariant?.metadata?.competitor_skus;
                  
                  return (
                    <div
                      key={result.id}
                      onClick={() => handleResultClick(result, matchedVariant)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'white'}
                    >
                      {/* ✅ Product Image - proper sizing */}
                      {result.thumbnail ? (
                        <img
                          src={result.thumbnail}
                          alt={result.title}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'contain',
                            borderRadius: '4px',
                            flexShrink: 0
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '60px',
                          height: '60px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '4px',
                          flexShrink: 0
                        }} />
                      )}
                      
                      {/* ✅ Product Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '500', color: '#333', fontSize: '14px' }}>
                            {result.title}
                          </span>
                          {variantOptions && (
                            <span style={{ fontSize: '12px', color: '#666', backgroundColor: '#e9ecef', padding: '2px 6px', borderRadius: '3px' }}>
                              {variantOptions}
                            </span>
                          )}
                        </div>
                        
                        {matchedVariant && (
                          <div style={{ fontSize: '12px', color: '#007acc', fontWeight: '500', marginTop: '4px', fontFamily: 'monospace' }}>
                            SKU: {matchedVariant.sku}
                          </div>
                        )}
                        
                        {competitorSkus && competitorSkus.length > 0 && (
                          <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '2px' }}>
                            Compatible: {competitorSkus.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      
      {showResults && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
};

export default MeiliSearchComponent;

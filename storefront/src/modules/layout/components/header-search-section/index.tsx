"use client"
import React, { useState, useEffect, useCallback } from 'react';

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

type VariantOption = {
  title: string;
  value: string;
};

// ✅ Expanded result that shows each matching variant as separate row
type ExpandedResult = {
  productId: string;
  productTitle: string;
  productHandle: string;
  productThumbnail?: string;
  variant: {
    id: string;
    sku: string;
    options?: Array<{
      option?: { title: string };
      value: string;
    }>;
    metadata?: {
      competitor_skus?: string[];
    };
  };
};

const HeaderSearchSection = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [expandedResults, setExpandedResults] = useState<ExpandedResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setExpandedResults([]);
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
          limit: 20 // ✅ Increased to get more products
        })
      });

      const data = await response.json();
      setResults(data.hits || []);
      
      // ✅ Expand products into individual variant results
      const expanded: ExpandedResult[] = [];
      const lowerQuery = searchQuery.toLowerCase();
      
      (data.hits || []).forEach((product: SearchResult) => {
        if (!product.variants) return;
        
        // Find ALL matching variants (not just first one)
        product.variants.forEach(variant => {
          const isMatch = 
            variant.sku?.toLowerCase().includes(lowerQuery) ||
            variant.metadata?.competitor_skus?.some(sku => 
              sku.toLowerCase().includes(lowerQuery)
            );
          
          if (isMatch) {
            expanded.push({
              productId: product.id,
              productTitle: product.title,
              productHandle: product.handle,
              productThumbnail: product.thumbnail,
              variant
            });
          }
        });
      });
      
      // Limit to 6 variant results
      setExpandedResults(expanded.slice(0, 6));
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

  const getVariantOptions = (variant: any): VariantOption[] => {
    if (!variant?.options) return [];
    
    return variant.options
      .filter((opt: any) => opt.option?.title && opt.value)
      .map((opt: any) => ({
        title: opt.option.title,
        value: opt.value
      }));
  };

  const handleResultClick = (result: ExpandedResult) => {
    const url = `/products/${result.productHandle}?sku=${result.variant.sku}`;
    window.location.href = url;
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setExpandedResults([]);
    setShowResults(false);
  };

  return (
    <section className="fixed top-20 lg:top-24 left-0 right-0 z-40 bg-blue-50 border-b border-blue-200 pt-4 pb-0">
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Search by product name or SKU..."
              className="w-full px-4 py-3 pr-20 text-base border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
            />
            
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

          {showResults && query && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg z-50 max-h-96 overflow-y-auto">
              {isLoading && (
                <div className="p-4 text-center text-gray-500">
                  Searching...
                </div>
              )}
              
              {!isLoading && expandedResults.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No results found for "{query}"
                </div>
              )}
              
              {!isLoading && expandedResults.length > 0 && (
                <div className="divide-y divide-gray-100">
                  {expandedResults.map((result, idx) => {
                    const variantOptions = getVariantOptions(result.variant);
                    const competitorSkus = result.variant.metadata?.competitor_skus;
                      // ✅ ADD THIS DEBUG LOG
                    console.log('Variant data:', {
                      sku: result.variant.sku,
                      hasOptions: !!result.variant.options,
                      options: result.variant.options,
                      variantOptions
                    });
                    
                    return (
                      <div
                        key={`${result.productId}-${result.variant.id}-${idx}`}
                        onClick={() => handleResultClick(result)}
                        className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="w-16 h-16 bg-white rounded flex-shrink-0 overflow-hidden">
                          {result.productThumbnail ? (
                            <img
                              src={result.productThumbnail}
                              alt={result.productTitle}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <svg className="w-full h-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                            </svg>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* ✅ Title with inline variant options */}
                          <div className="font-medium text-gray-900 text-sm mb-1">
                            {result.productTitle}
                            {variantOptions.length > 0 && (
                              <span className="text-gray-600 font-normal">
                                {' '}{variantOptions.map((opt: VariantOption) => opt.value).join(', ')}
                              </span>
                            )}
                          </div>
                          
                          {/* SKU */}
                          <div className="text-xs text-blue-600 font-semibold font-mono mb-1">
                            SKU: {result.variant.sku}
                          </div>
                          
                          {/* Compatible SKUs */}
                          {competitorSkus && competitorSkus.length > 0 && (
                            <div className="text-xs text-gray-500">
                              Compatible: {competitorSkus.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="p-3 bg-gray-50">
                    <button
                      onClick={handleSearchClick}
                      className="w-full text-center text-blue-600 hover:text-blue-800 font-medium text-sm"
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

      {showResults && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowResults(false)}
        />
      )}
    </section>
  );
};

export default HeaderSearchSection;

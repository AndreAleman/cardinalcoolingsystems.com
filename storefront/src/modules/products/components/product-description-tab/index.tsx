"use client"

import React from "react"

interface ProductDescriptionTabProps {
  description?: string
  title?: string
}

const ProductDescriptionTab: React.FC<ProductDescriptionTabProps> = ({
  description,
  title = "Product Specifications"
}) => {
  console.log('🔍 ProductDescriptionTab - description:', description)
  console.log('🔍 ProductDescriptionTab - description length:', description?.length)
  
  if (!description) {
    console.log('❌ No description found, component returning null')
    return null
  }

  console.log('✅ Rendering ProductDescriptionTab with description')

  return (
    <div className="bg-ui-bg-subtle">
      <div className="content-container">
        <div className="max-w-6xl mx-auto py-12">
          <div className="space-y-8">
            
            {/* Tab Header */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-ui-fg-base mb-2">
                {title}
              </h2>
              <p className="text-ui-fg-subtle">
                Detailed product specifications and information
              </p>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border border-ui-border-base">
              <div className="p-8">
                <div 
                  className="woocommerce-content"
                  style={{
                    // ✅ FORCE TABLE STYLING WITH INLINE STYLES
                  }}
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* ✅ FORCE TABLE STYLES */}
      <style jsx global>{`
        .woocommerce-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          border: 2px solid #000 !important;
        }
        
        .woocommerce-content table th,
        .woocommerce-content table td {
          border: 1px solid #000 !important;
          padding: 8px 12px;
          text-align: left;
        }
        
        .woocommerce-content table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        
        .woocommerce-content img {
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}

export default ProductDescriptionTab

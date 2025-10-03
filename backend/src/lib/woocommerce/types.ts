export interface WooCommerceProduct {
  id: number
  name: string
  slug: string
  sku: string
  price: string
  regular_price?: string
  sale_price?: string
  stock_quantity?: number
  manage_stock?: boolean
  type: 'simple' | 'variable' | 'variation'
  parent_id?: number
  attributes?: {
    id?: number
    name: string
    slug?: string
    options: string[]        // Plural - array of options
    option?: string          // ✅ ADD: Singular - single option value
    position?: number
    visible?: boolean
    variation?: boolean
  }[]
  images?: {
    src: string
    alt?: string
  }[]
  description?: string
  short_description?: string
  categories?: {
    id: number
    name: string
    slug: string
  }[]
  variations?: number[]
  meta_data?: {
    key: string
    value: any
  }[]
}



export interface WooCommerceAttribute {
  id: number
  name: string
  slug: string
  position: number
  visible: boolean
  variation: boolean
  options: string[]
}

export interface WooCommerceImage {
  id: number
  src: string
  name: string
  alt: string
}

export interface WooCommerceCategory {
  id: number
  name: string
  slug: string
}

export interface WooCommerceApiResponse<T> {
  data: T
  headers: Record<string, string>
}

export interface ApiCredentials {
  baseUrl: string
  consumerKey: string
  consumerSecret: string
  version: string
}



export interface MedusaProductInput {
  title: string
  handle: string
  status: 'published',    
  sales_channels: { id: string }[]
  options: { title: string, values: string[] }[]
  variants: {
    title: string
    sku: string
    options: Record<string, string>
    prices: { amount: number, currency_code: string }[]
    manage_inventory: boolean
  }[]
  images?: { url: string }[]
  thumbnail?: string
  description?: string
  metadata?: Record<string, any>
}

export interface MedusaProductOption {
  id: string
  title: string
  values: MedusaOptionValue[]
}

export interface MedusaOptionValue {
  id: string
  value: string
  option_id: string
}

export interface MedusaProductVariant {
  id: string
  title: string
  sku: string
  product_id: string
  options: MedusaVariantOption[]
  prices: MedusaVariantPrice[]
  manage_inventory: boolean
  inventory_quantity?: number
}

export interface MedusaVariantOption {
  id: string
  value: string
  option_id: string
}

export interface MedusaVariantPrice {
  id: string
  amount: number
  currency_code: string
  variant_id: string
}

export interface MedusaProductImage {
  id: string
  url: string
  alt_text?: string
}

export interface MedusaProductTag {
  id: string
  value: string
}

export interface MedusaProductCategory {
  id: string
  name: string
  handle: string
}

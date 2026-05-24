import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { getVariantAvailability, QueryContext } from "@medusajs/framework/utils"
import { CalculatedPriceSet } from "@medusajs/framework/types"

export type FeedItem = {
  id: string
  title: string
  description: string
  link: string
  image_link?: string
  additional_image_link?: string
  availability: string
  price: string
  sale_price?: string
  item_group_id: string
  condition?: string
  brand: string
  gtin?: string
  mpn?: string
  identifier_exists: string
  shipping_weight?: string
  shipping_length?: string
  shipping_width?: string
  shipping_height?: string
}

const formatPrice = (price: number, currency_code: string) => {
  return `${new Intl.NumberFormat("en-US", {
    currency: currency_code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)} ${currency_code.toUpperCase()}`
}

type StepInput = {
  currency_code: string
  country_code: string
}

export const getProductFeedItemsStep = createStep(
  "get-product-feed-items", 
  async (input: StepInput, { container }) => {
    const feedItems: FeedItem[] = []
    const query = container.resolve("query")
    const configModule = container.resolve("configModule")
    const storefrontUrl = configModule.admin.storefrontUrl || 
      process.env.STOREFRONT_URL ||
      "https://cardinalcoolingsystems.com"

    const limit = 100
    let offset = 0
    let count = 0
    const countryCode = input.country_code.toLowerCase()
    const currencyCode = input.currency_code.toLowerCase()

    do {
      const {
        data: products,
        metadata,
      } = await query.graph({
        entity: "product",
        fields: [
          "id",
          "title",
          "description",
          "handle",
          "thumbnail",
          "images.*",
          "status",
          "variants.*",
          "variants.calculated_price.*",
          "variants.options.*",
          "variants.options.option.*",
          "sales_channels.*",
          "sales_channels.stock_locations.*",
          "sales_channels.stock_locations.address.*",
        ],
        filters: {
          status: "published",
        },
        context: {
          variants: {
            calculated_price: QueryContext({
              currency_code: currencyCode,
            }),
          },
        },
        pagination: {
          take: limit,
          skip: offset,
        },
      })
      
      count = metadata?.count ?? 0
      offset += limit

      for (const product of products) {
        if (!product.variants.length) {continue}

        // Per Google Merchant Center policy (support.google.com/merchants/answer/10249082):
        // "Websites that only allow a customer to request a quote are not supported."
        // Skip the entire product if it's flagged quote-only at the product level.
        const productRequiresQuote =
          product.metadata?.requires_quote === true ||
          product.metadata?.requires_quote === "true"
        if (productRequiresQuote) {continue}

        const salesChannel = product.sales_channels?.find((channel) => {
          return channel?.stock_locations?.some((location) => {
            return location?.address?.country_code.toLowerCase() === countryCode
          })
        })

        const availability = salesChannel?.id ? await getVariantAvailability(query, {
          variant_ids: product.variants.map((variant) => variant.id),
          sales_channel_id: salesChannel?.id,
        }) : undefined

        for (const variant of product.variants) {
          // Skip variant-level quote-only items.
          const variantRequiresQuote =
            variant.metadata?.requires_quote === true ||
            variant.metadata?.requires_quote === "true"
          if (variantRequiresQuote) {continue}

          // @ts-ignore
          const calculatedPrice = variant.calculated_price as CalculatedPriceSet

          // Skip variants with no calculated price for this currency.
          // Per policy, advertised products must be purchasable; price must also be
          // consistent between feed and landing page.
          if (
            !calculatedPrice ||
            calculatedPrice.calculated_amount === undefined ||
            calculatedPrice.calculated_amount === null ||
            Number.isNaN(Number(calculatedPrice.calculated_amount))
          ) {continue}

          const hasOriginalPrice = calculatedPrice?.original_amount !== calculatedPrice?.calculated_amount
          const originalPrice = hasOriginalPrice ? calculatedPrice.original_amount :
            calculatedPrice.calculated_amount
          const salePrice = hasOriginalPrice ? calculatedPrice.calculated_amount : undefined
          const stockStatus = !variant.manage_inventory ? "in stock" :
            !availability?.[variant.id]?.availability ? "out of stock" : "in stock"

          // Determine if product has identifiers
          const hasGtin = variant.ean || variant.upc || variant.barcode
          const hasMpn = variant.sku
          const identifierExists = (hasGtin || hasMpn) ? "yes" : "no"

          // Build variant title with options
          let variantTitle = product.title
          if (variant.options && variant.options.length > 0) {
            const optionString = variant.options
              .map((opt: any) => `${opt.option?.title}: ${opt.value}`)
              .join(", ")
            if (optionString) {
              variantTitle = `${product.title} - ${optionString}`
            }
          }

          // Create a proper description if empty
          let description = product.description && product.description.trim() 
            ? product.description 
            : `${product.title}. High-quality industrial equipment available for purchase.`
          
          // Add variant info to description if available
          if (variant.options && variant.options.length > 0) {
            const optionString = variant.options
              .map((opt: any) => `${opt.option?.title}: ${opt.value}`)
              .join(", ")
            if (optionString) {
              description = `${product.title} with ${optionString}. SKU: ${variant.sku}. ${description}`
            }
          }

          // Build variant-specific URL matching your site's format
          let variantUrl = `${storefrontUrl}/${input.country_code}/products/${product.handle}`
          
          if (variant.options && variant.options.length > 0) {
            const queryParams = variant.options
              .map((opt: any) => {
                // Get the option name and clean it up
                let optionName = opt.option?.title?.toLowerCase() || ''
                
                // Remove parentheses and their content, trim spaces
                optionName = optionName.replace(/\s*\([^)]*\)/g, '').trim()
                
                // Get the option value
                let optionValue = opt.value?.toLowerCase() || ''
                
                // Replace the " symbol with "in" for measurements
                optionValue = optionValue.replace(/["'']/g, 'in')
                
                // Remove any spaces
                optionValue = optionValue.replace(/\s+/g, '')
                
                return `${optionName}=${optionValue}`
              })
              .join('&')
            
            if (queryParams) {
              variantUrl += `?${queryParams}`
            }
          }

          feedItems.push({
            id: variant.sku || variant.id,
            title: variantTitle,
            description: description,
            link: variantUrl,
            image_link: variant.thumbnail || product.thumbnail || "",
            additional_image_link: product.images?.map(
              (image) => image.url
            )?.join(","),
            availability: stockStatus,
            price: formatPrice(originalPrice as number, currencyCode),
            sale_price: salePrice ? formatPrice(salePrice as number, currencyCode) : undefined,
            item_group_id: product.id,
            condition: "new",
            brand: "Cardinal Cooling Systems",
            gtin: variant.ean || variant.upc || variant.barcode || undefined,
            mpn: variant.sku || undefined,
            identifier_exists: identifierExists,
            shipping_weight: variant.weight ? `${variant.weight} lb` : undefined,
            shipping_length: variant.length ? `${variant.length} in` : undefined,
            shipping_width: variant.width ? `${variant.width} in` : undefined,
            shipping_height: variant.height ? `${variant.height} in` : undefined,
          })
        }
      }
    } while (count > offset)

    return new StepResponse({ items: feedItems })
  }
)

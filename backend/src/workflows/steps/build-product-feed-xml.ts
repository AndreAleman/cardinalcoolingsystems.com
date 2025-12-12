import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { FeedItem } from "./get-product-feed-items"


type StepInput = {
  items: FeedItem[]
}


export const buildProductFeedXmlStep = createStep(
  "build-product-feed-xml",
  async (input: StepInput) => {
    const escape = (str: string) => {
      if (!str) return ''
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")
    }


    // Build using String.fromCharCode to avoid any encoding issues
    const openChannel = String.fromCharCode(60, 99, 104, 97, 110, 110, 101, 108, 62) // hannel>
    const closeChannel = String.fromCharCode(60, 47, 99, 104, 97, 110, 110, 101, 108, 62) // </channel>


    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n'
    xml += '  ' + openChannel + '\n'
    xml += '    <title>Product Feed</title>\n'
    xml += '    <description>Product Feed for Social Platforms</description>\n'


    for (const item of input.items) {
      xml += '    <item>\n'
      xml += `      <g:id>${escape(item.id)}</g:id>\n`
      xml += `      <title>${escape(item.title)}</title>\n`
      xml += `      <description>${escape(item.description)}</description>\n`
      xml += `      <link>${escape(item.link)}</link>\n`
      
      if (item.image_link) {
        xml += `      <g:image_link>${escape(item.image_link)}</g:image_link>\n`
      }
      
      if (item.additional_image_link) {
        const additionalImages = item.additional_image_link.split(',')
        // Google allows up to 10 additional images
        additionalImages.slice(0, 10).forEach(imageUrl => {
          const trimmedUrl = imageUrl.trim()
          if (trimmedUrl) {
            xml += `      <g:additional_image_link>${escape(trimmedUrl)}</g:additional_image_link>\n`
          }
        })
      }
      
      xml += `      <g:availability>${escape(item.availability)}</g:availability>\n`
      xml += `      <g:price>${escape(item.price)}</g:price>\n`
      
      if (item.sale_price) {
        xml += `      <g:sale_price>${escape(item.sale_price)}</g:sale_price>\n`
      }
      
      xml += `      <g:condition>${escape(item.condition || "new")}</g:condition>\n`
      
      if (item.brand) {
        xml += `      <g:brand>${escape(item.brand)}</g:brand>\n`
      }
      
      xml += `      <g:identifier_exists>${escape(item.identifier_exists)}</g:identifier_exists>\n`
      
      if (item.gtin) {
        xml += `      <g:gtin>${escape(item.gtin)}</g:gtin>\n`
      }
      if (item.mpn) {
        xml += `      <g:mpn>${escape(item.mpn)}</g:mpn>\n`
      }
      
      xml += `      <g:item_group_id>${escape(item.item_group_id)}</g:item_group_id>\n`
      
      if (item.shipping_weight) {
        xml += `      <g:shipping_weight>${escape(item.shipping_weight)}</g:shipping_weight>\n`
      }
      if (item.shipping_length) {
        xml += `      <g:shipping_length>${escape(item.shipping_length)}</g:shipping_length>\n`
      }
      if (item.shipping_width) {
        xml += `      <g:shipping_width>${escape(item.shipping_width)}</g:shipping_width>\n`
      }
      if (item.shipping_height) {
        xml += `      <g:shipping_height>${escape(item.shipping_height)}</g:shipping_height>\n`
      }
      
      xml += '    </item>\n'
    }


    xml += '  ' + closeChannel + '\n'
    xml += '</rss>'


    return new StepResponse(xml)
  }
)

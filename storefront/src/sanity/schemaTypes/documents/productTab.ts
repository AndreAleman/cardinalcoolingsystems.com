///Users/andresreality/Documents/cowbird_ecommerce/medusajs-2.0-for-railway-boilerplate/storefront/src/sanity/schemaTypes/documents/productTab.ts

import { defineType, defineField, defineArrayMember } from "sanity"

export const productTab = defineType({
  name: "productTab",
  type: "object",
  title: "Product Tab",
  fields: [
      defineField({ name: 'title', type: 'string', title: 'Tab Title' }),
      defineField({ name: 'content', type: 'array', of: [
        { type: 'block' },
        { type: 'youtube' }, // allow YouTube embeds inside tab content
               // <-- Add this for tables
       { type: 'image' },    // <-- You might want images too
      ]}),
    ]
})
import { type SchemaTypeDefinition } from 'sanity'

// New blog schemas from template
import {blockContentType} from './blockContentType'
import {categoryType} from './categoryType'
import {postType} from './postType'
import {authorType} from './authorType'

// Your existing product schemas
import productSchema from "./documents/product"
import { productTab } from "./documents/productTab"
import { youtube } from "./youTubeType"

// Update import name
import { productTable } from "./objects/table"

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // Blog schemas (new from template)
    blockContentType, 
    categoryType, 
    postType, 
    authorType,
    // Your existing product schemas
    productSchema, 
    productTab, 
    youtube,
    // Update type name
    productTable
  ],
}

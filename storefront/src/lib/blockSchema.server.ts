// src/lib/blockSchema.server.ts
import {Schema} from '@sanity/schema'
import type {FieldDefinition} from 'sanity'

// Import just the schema types (not the Studio bundle)
import {schema} from '../sanity/schemaTypes'

// Compile the schema and extract just what we need
const defaultSchema = Schema.compile({types: schema.types})

// Get the product description field type
const blockContentSchema = defaultSchema
  .get('product')
  ?.fields?.find((field: FieldDefinition) => field.name === 'description')?.type

// Export just the compiled type (as plain data, no Studio dependencies)
export function getBlockContentSchema() {
  return blockContentSchema
}

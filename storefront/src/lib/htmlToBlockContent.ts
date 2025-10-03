// src/lib/htmlToBlockContent.ts

"use client"

import {htmlToBlocks} from '@portabletext/block-tools'
import {Schema} from '@sanity/schema'
import {uuid} from '@sanity/uuid'
import {JSDOM} from 'jsdom'
import type {FieldDefinition} from 'sanity'

export async function htmlToBlockContent(html: string): Promise<any[]> {
  if (!html) return []

  // Import schema server-side only
  const {schema} = await import('../sanity/schemaTypes')
  
  const defaultSchema = Schema.compile({types: schema.types})
  const blockContentSchema = defaultSchema
    .get('product')
    ?.fields?.find((field: FieldDefinition) => field.name === 'description')?.type

  if (!blockContentSchema) {
    console.error('Could not find product description field in schema')
    return []
  }

  // Convert HTML to Portable Text (basic version first)
  let blocks = htmlToBlocks(html, blockContentSchema, {
    parseHtml: (html) => new JSDOM(html).window.document,
    rules: [
      // Start with just paragraphs and basic formatting - no tables/images yet
    ],
  })

  // Add _key to blocks
  blocks = blocks.map((block: any) => (block._key ? block : {...block, _key: uuid()}))

  console.log('Converted blocks:', blocks)
  return blocks
}

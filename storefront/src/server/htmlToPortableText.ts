// src/server/htmlToPortableText.ts (server-only import path)
import {htmlToBlocks} from '@portabletext/block-tools'
import {Schema} from '@sanity/schema'
import {JSDOM} from 'jsdom'
import type {FieldDefinition} from 'sanity'
import {schema} from '../sanity/schemaTypes'

const defaultSchema = Schema.compile({types: schema.types})
const blockContentSchema =
  defaultSchema
    .get('product')
    ?.fields?.find((f: FieldDefinition) => f.name === 'description')?.type
  || defaultSchema.get('blockContent')
  || defaultSchema.get('block')

function getNodeText(el: Element): string {
  return (el.textContent || '').trim()
}

export function htmlToPortableText(html: string) {
  if (!html) return []

  const blocks = htmlToBlocks(html, blockContentSchema, {
    parseHtml: (inputHtml) => new JSDOM(inputHtml).window.document,
    rules: [
      // <figure><img/></figure>
      {
        deserialize(el, next, block) {
          const node = el as Element
          if (node.nodeName.toLowerCase() !== 'figure') return undefined
          const img = node.querySelector('img')
          const src = img?.getAttribute('src') || ''
          if (!img || !src) return undefined
          const alt = img.getAttribute('alt') || ''
          return block({_type: 'image', url: src, alt})
        },
      },
      // standalone <img/>
      {
        deserialize(el, next, block) {
          const node = el as Element
          if (node.nodeName.toLowerCase() !== 'img') return undefined
          const src = node.getAttribute('src') || ''
          if (!src) return undefined
          const alt = node.getAttribute('alt') || ''
          return block({_type: 'image', url: src, alt})
        },
      },
      // <table> → {_type:'table', rows:[{cells:[{text, colspan?, rowspan?}]}]}
      {
        deserialize(el, next, block) {
          const node = el as Element
          if (node.nodeName.toLowerCase() !== 'table') return undefined
          const rows: {cells: {text: string; colspan?: number; rowspan?: number}[]}[] = []
          const trNodes = Array.from(node.querySelectorAll('tr'))
          for (const tr of trNodes) {
            const cells = Array.from(tr.querySelectorAll('th,td')).map((cell) => {
              const colspan = parseInt(cell.getAttribute('colspan') || '1', 10)
              const rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10)
              const entry: {text: string; colspan?: number; rowspan?: number} = {
                text: getNodeText(cell),
              }
              if (colspan > 1) entry.colspan = colspan
              if (rowspan > 1) entry.rowspan = rowspan
              return entry
            })
            if (cells.length) rows.push({cells})
          }
          return block({_type: 'table', rows})
        },
      },
      // leave p/strong/em/ul/ol/li to defaults
    ],
  })

  return blocks
}

// src/sanity/schemaTypes/objects/table.ts
import { defineType } from 'sanity'

export const productTable = defineType({
  name: 'productTable',  // Changed from 'table' to 'productTable'
  type: 'object',
  title: 'Product Table',
  fields: [
    {
      name: 'rows',
      type: 'array',
      title: 'Table Rows',
      of: [
        {
          type: 'object',
          name: 'row',
          title: 'Row',
          fields: [
            {
              name: 'cells',
              type: 'array',
              title: 'Cells',
              of: [
                {
                  type: 'object',
                  name: 'cell',
                  title: 'Cell',
                  fields: [
                    {
                      name: 'text',
                      type: 'string',
                      title: 'Text',
                    },
                    {
                      name: 'colspan',
                      type: 'number',
                      title: 'Column Span',
                      initialValue: 1,
                    },
                    {
                      name: 'rowspan',
                      type: 'number', 
                      title: 'Row Span',
                      initialValue: 1,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  preview: {
    select: {
      rows: 'rows',
    },
    prepare({ rows }) {
      const rowCount = rows?.length || 0
      return {
        title: `Product Table (${rowCount} rows)`,
        subtitle: 'Product specifications table',
      }
    },
  },
})

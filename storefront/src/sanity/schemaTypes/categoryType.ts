import {TagIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const categoryType = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Brief description shown on category cards',
      rows: 3,
    }),
    defineField({
      name: 'metaDescription',
      title: 'SEO Meta Description',
      type: 'text',
      description: 'Description for search engines (150-160 characters)',
      validation: (Rule) => Rule.max(160),
      rows: 2,
    }),
    defineField({
      name: 'image',
      title: 'Category Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Important for SEO and accessibility.',
        },
      ],
    }),
    defineField({
      name: 'tags',
      title: 'Category Tags',
      type: 'array',
      description: 'Tags to help group related categories (optional)',
      of: [
        {
          type: 'string',
        },
      ],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'industry',
      title: 'Industry Group',
      type: 'string',
      description: 'Group categories by industry for better relationships',
      options: {
        list: [
          { title: 'Food Processing', value: 'food-processing' },
          { title: 'Pharmaceuticals', value: 'pharmaceuticals' },
          { title: 'Data Centers', value: 'data-centers' },
          { title: 'Brewing & Beverage', value: 'brewing-beverage' },
          { title: 'Technical Guides', value: 'technical' },
          { title: 'Standards & Compliance', value: 'standards' },
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'industry',
      media: 'image',
    },
  },
})

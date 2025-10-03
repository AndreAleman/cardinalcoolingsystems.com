import {defineType, defineArrayMember} from 'sanity'
export const blockContentType = defineType({
  name: 'blockContent',
  type: 'array',
  title: 'Body',
  of: [
    defineArrayMember({ type: 'block' }),
    defineArrayMember({ type: 'youtube' }),
    defineArrayMember({ type: 'tab' }),
    // add other custom types here
  ]
})
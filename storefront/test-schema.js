// test-schema.js
async function testSchema() {
  try {
    const { getBlockContentSchema } = await import('./dist/lib/blockSchema.server.js')
    const schema = getBlockContentSchema()
    console.log('Schema loaded successfully!')
    console.log('Schema type:', schema?.name || 'Unknown')
    console.log('Has block content schema:', !!schema)
  } catch (error) {
    console.error('Schema test failed:', error.message)
  }
}

testSchema()

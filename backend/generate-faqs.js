// generate-faqs.js
// Run: node generate-faqs.js
// Calls Claude API to generate FAQs for each category, saves to faq-data.json

const fs = require('fs')

const categories = [
  { handle: "fittings", name: "Sanitary Fittings", context: "Parent category for all sanitary stainless steel fittings including clamp, butt weld, bevel seat, I-line fittings. Used in food processing, pharma, dairy, beverage industries." },
  { handle: "clamp-fittings", name: "Clamp Fittings", context: "Tri-clamp/Tri-Clover sanitary fittings that use ferrule-gasket-clamp assembly. Quick disassembly for CIP. Food, beverage, pharma." },
  { handle: "clamps", name: "Sanitary Clamps", context: "Mechanical clamps that compress ferrules and gaskets. Single-pin to high-pressure double-bolted designs. Stainless steel." },
  { handle: "clamp-adapters", name: "Clamp Adapters", context: "Transition from clamp ends to NPT, bevel, threaded, or butt-weld. 304 and 316L stainless." },
  { handle: "crosses", name: "Crosses", context: "Four-way clamp cross fittings for distributing flow. CIP/COP process piping skids." },
  { handle: "clamp-ferrules", name: "Clamp Ferrules", context: "Welded/brazed to tubing to create tri-clamp connection point. Precision-machined faces." },
  { handle: "clamp-eccentric-reducers", name: "Clamp Eccentric Reducers", context: "Offset centerline between different tube sizes, prevents pooling in horizontal runs. Suction lines." },
  { handle: "clamp-concentric-reducers", name: "Clamp Concentric Reducers", context: "Connect different tube sizes on common centerline. Clamp ends for easy install/removal." },
  { handle: "clamp-caps", name: "Clamp Caps", context: "Solid end caps attach to tri-clamp ferrule to close sanitary line or instrument port." },
  { handle: "laterals-and-wyes", name: "Laterals and Wyes", context: "Split or merge flow at shallow angles, reduce turbulence vs 90-degree tees. Drainability priority." },
  { handle: "45-clamp-elbows", name: "45° Clamp Elbows", context: "Gentle 45-degree redirects with reduced pressure drop. Tri-clamp ends for quick disassembly." },
  { handle: "90-clamp-elbows", name: "90° Clamp Elbows", context: "Right-angle turns in sanitary tubing. Smooth bore, minimize turbulence. Tri-clamp connections." },
  { handle: "bevel-seat-fittings", name: "Bevel Seat Fittings", context: "Threaded nut draws plain and threaded bevel ferrule together. Metal-to-metal seal. Dairy, food, beverage." },
  { handle: "hex-nuts", name: "Hex Nuts", context: "Bevel seat hex nuts draw threaded and plain bevel ferrules together. Stainless steel, repeated assembly." },
  { handle: "bevel-seat-caps", name: "Bevel Seat Caps", context: "Terminate or close bevel seat connections. Sanitary acme thread caps, stainless steel plugs." },
  { handle: "bevel-seat-gaskets", name: "Bevel Seat Gaskets", context: "Elastomer or PTFE seals between mating bevel ferrules. EPDM, Viton, PTFE options." },
  { handle: "sanitary-butt-weld-fittings", name: "Sanitary Butt Weld Fittings", context: "Permanently welded elbows, tees, reducers, caps. Smooth crevice-free process lines. High sanitary requirements." },
  { handle: "45-elbows", name: "45° Butt Weld Elbows", context: "Butt-weld 45-degree elbows for gradual directional changes. Fully welded seams, high-purity lines." },
  { handle: "90-elbows", name: "90° Butt Weld Elbows", context: "Butt-weld 90-degree right-angle turns. CIP return, product transfer, utility lines." },
  { handle: "adapters", name: "Butt Weld Adapters", context: "Transition from welded tube to clamp, threaded, or flanged ends. Integrate valves, pumps." },
  { handle: "caps", name: "Butt Weld Caps", context: "Permanently close end of stainless tube. Dead-end branches, tank nozzles, future expansion points." },
  { handle: "concentric-reducers", name: "Butt Weld Concentric Reducers", context: "Join different tube sizes on common centerline. Welded design for high-sanitary/high-pressure sections." },
  { handle: "stub-ends", name: "Stub Ends", context: "Short welded fittings paired with lap joint flanges. Replaceable gasket surface, carbon-steel backing flanges." },
  { handle: "eccentric-reducers", name: "Butt Weld Eccentric Reducers", context: "Offset tube sizes, flat side for drainage in horizontal lines. Pump suction lines, air entrapment prevention." },
  { handle: "hangers", name: "Sanitary Hangers", context: "Support sanitary tube runs. Allow thermal expansion, maintain drainage slope. Stainless construction." },
  { handle: "spray-balls", name: "Spray Balls", context: "Fixed or rotating CIP devices for tank cleaning. Distribute cleaning solution over tank/vessel interiors." },
  { handle: "sight-glass", name: "Sight Glass", context: "Clear viewing window into process lines or vessels. Monitor product clarity, foam, flow. CIP/SIP compatible." },
  { handle: "i-line-fittings", name: "I-Line Fittings", context: "Heavy-duty sanitary unions with male/female ferrules and clamp. High-vibration and high-pressure service." },
  { handle: "i-line-ferrules", name: "I-Line Ferrules", context: "Weld to tubing, present I-Line interface for gasket and clamp. Superior rigidity vs tri-clamp." },
  { handle: "tube-flanges", name: "Tube Flanges", context: "Plate flanges sized to sanitary tubing. Flush crevice-free ID. Bolted connections on hygienic tube systems." },
  { handle: "pipe-flanges", name: "Pipe Flanges", context: "Bolt process piping to equipment. Tank nozzles, heat exchangers, CIP manifolds. Gasketed cleanable bore." },
  { handle: "plate-flanges", name: "Plate Flanges", context: "Flat circular component for strong secure connections. Steel plate flanges for industrial piping." },
  { handle: "valves", name: "Sanitary Valves", context: "Parent category for all sanitary valves. Ball, butterfly, check, needle, pressure relief. Stainless steel." },
  { handle: "butterfly-valves", name: "Butterfly Valves", context: "Rotating disc for throttle/shutoff. Compact, lightweight. Manual and air actuated. Tri-clamp ends." },
  { handle: "sanitary-ball-valves", name: "Sanitary Ball Valves", context: "Polished stainless ball with full-bore port. Tight shutoff, low pressure drop. Multi-port configurations." },
  { handle: "socket-weld-ball-valves", name: "Socket Weld Ball Valves", context: "Weld-in ends for permanent high-integrity connections to schedule pipe. High-pressure/high-cycle service." },
  { handle: "threaded-ball-valves", name: "Threaded Ball Valves", context: "NPT threaded ends. Easy installation in utility or non-CIP lines. Stainless steel corrosion resistance." },
  { handle: "check-valves", name: "Check Valves", context: "One-way stainless steel valves. Prevent reverse flow, protect equipment. Ball and disc designs." },
  { handle: "clamp-check-valves", name: "Clamp Check Valves", context: "Non-return valves with tri-clamp ends. Quick removal for inspection. CIP and SIP systems." },
  { handle: "tube", name: "Sanitary Tube", context: "Stainless steel sanitary tubing for hygienic piping. Food grade, pharma grade, medical grade. CIP compatible." },
  { handle: "tubes", name: "Sanitary Tubes", context: "Stainless steel sanitary tubing. Smooth interior for hygienic flow. Food processing, pharma, biotech." },
]

async function generateFAQsForCategory(category) {
  const prompt = `You are an expert in sanitary stainless steel piping products for food processing, pharmaceutical, dairy, and beverage industries.

Generate exactly 4 frequently asked questions (FAQs) with detailed answers for the product category: "${category.name}"

Context: ${category.context}

Requirements:
- Questions should be practical and what real buyers/engineers would ask
- Cover topics like: materials (304 vs 316L stainless), sizing/compatibility, CIP/SIP compliance, applications, installation, differences between similar products
- Answers should be 2-4 sentences, informative and specific to Cardinal Cooling Systems products
- Do NOT mention specific prices
- Return ONLY valid JSON, no markdown, no extra text

Format:
[
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."}
]`

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || "[]"
  
  try {
    const clean = text.replace(/```json|```/g, "").trim()
    return JSON.parse(clean)
  } catch {
    console.error(`Failed to parse FAQs for ${category.handle}:`, text.substring(0, 200))
    return []
  }
}

async function main() {
  console.log(`🤖 Generating FAQs for ${categories.length} categories using Claude API...\n`)
  
  const faqData = {}
  
  for (const category of categories) {
    try {
      console.log(`⏳ Generating FAQs for: ${category.name}`)
      const faqs = await generateFAQsForCategory(category)
      faqData[category.handle] = faqs
      console.log(`✅ ${category.name}: ${faqs.length} FAQs generated`)
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500))
    } catch (err) {
      console.error(`❌ Failed for ${category.handle}:`, err.message)
      faqData[category.handle] = []
    }
  }
  
  fs.writeFileSync('./faq-data.json', JSON.stringify(faqData, null, 2))
  console.log(`\n🎉 Done! FAQ data saved to faq-data.json`)
  console.log(`📊 Total categories: ${Object.keys(faqData).length}`)
}

main().catch(console.error)

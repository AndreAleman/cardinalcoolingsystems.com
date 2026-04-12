// update-seo-missing.js
// Run: node update-seo-missing.js

const BACKEND_URL = 'http://localhost:9000'
const ADMIN_EMAIL = 'admin@yourmail.com'
const ADMIN_PASSWORD = 'lbd9fbfl5hgxj7jzfevy0yuagyft1fd3'

const seoData = [
  {
    id: 'prod_01K2ZKH2JYFJA45A1X744VD0FE',
    meta_title: 'Long Plain Bevel Seat Ferrule | 304 & 316L Stainless | Cardinal Cooling Systems',
    meta_description: 'Shop Long Plain Bevel Seat Ferrules in T304 and T316L stainless steel. Available in 1" to 4" sizes. 3A certified, ships in 1 business day.'
  },
  {
    id: 'prod_01K31CET4VED2WQ06TRQJP64JN',
    meta_title: 'Plain Bevel Seat Solid End Cap | Sanitary Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'Plain Bevel Seat Solid End Caps in T304 stainless steel. Multiple sizes available. 3A certified sanitary fittings. Ships in 1 business day.'
  },
  {
    id: 'prod_01K3PG0MVEEGC1GVBQ5BEV0FX1',
    meta_title: 'Teflon® Bevel Seat Gasket | Sanitary Gaskets | Cardinal Cooling Systems',
    meta_description: 'Teflon® Bevel Seat Gaskets for sanitary bevel seat fittings. Available in 1" to 4". FDA approved materials. Ships in 1 business day.'
  },
  {
    id: 'prod_01K4K1N96KYTQWC888D2CTE2YG',
    meta_title: 'Butt Weld 90° Elbow with Tangents | Sanitary Stainless | Cardinal Cooling Systems',
    meta_description: 'Butt Weld 90° Elbows with Tangents in T304 and T316L stainless steel. ASTM A270 compliant. Available in 1" to 4". Ships in 1 business day.'
  },
  {
    id: 'prod_01K4K20VKQ8B1HVYTM4PD8Z77B',
    meta_title: 'Long Threaded Bevel Seat Ferrule | Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'Long Threaded Bevel Seat Ferrules in T304 stainless steel. Available 1" to 4". 3A certified sanitary fittings. Ships in 1 business day.'
  },
  {
    id: 'prod_01K4K2Q1PXTZT87XR9AN0HQF1X',
    meta_title: 'Butt Weld 45° Elbow | Sanitary Stainless Steel Fittings | Cardinal Cooling Systems',
    meta_description: 'Sanitary Butt Weld 45° Elbows in T304 and T316L stainless steel. ASTM A270 compliant. Multiple sizes. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5S683SC732VMN92NWDTY7T6',
    meta_title: 'Type A (VB) Stub End | Sanitary Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'Type A VB Stub Ends in stainless steel for sanitary piping systems. Multiple alloy and size options. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SE1WR6GA23QC3QPNFM8KFC',
    meta_title: 'Polished End Cap | Sanitary Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'Polished End Caps in T304 and T316L stainless steel. Interior polished to 20Ra or better. Available 1.5" to 4". Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SEW5AEGXRA0HZ8N0NWPVE2',
    meta_title: 'Butt Weld Lateral Wye | Sanitary Stainless Fittings | Cardinal Cooling Systems',
    meta_description: 'Butt Weld Lateral Wye fittings in T304 and T316L stainless steel. ASTM A270 compliant. Multiple sizes available. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SF05FQV3EG2SHN6C0F744G',
    meta_title: 'Butt Weld 90° Elbow | Sanitary Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'Sanitary Butt Weld 90° Elbows in T304 and T316L stainless steel. ASTM A270 compliant. Available 1" to 6". Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SFE5D58Y3BF8VMY51XAY80',
    meta_title: 'Butt Weld Concentric Reducer | Sanitary Stainless | Cardinal Cooling Systems',
    meta_description: 'Butt Weld Concentric Reducers in T304 and T316L stainless steel. ASTM A270 compliant. Multiple size combinations. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SFH2YNSA60Q19PYTF7AXSD',
    meta_title: 'Butt Weld Eccentric Reducer | Sanitary Stainless | Cardinal Cooling Systems',
    meta_description: 'Butt Weld Eccentric Reducers in T304 and T316L stainless steel. ASTM A270 compliant. Multiple size combinations. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SFKBPHHPMRY616GESP33GS',
    meta_title: 'Butt Weld Short Tee | Sanitary Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'Sanitary Butt Weld Short Tees in T304 and T316L stainless steel. ASTM A270 compliant. Available 1" to 4". Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SKAMR0YV64GAMFRNNPBT07',
    meta_title: 'Butt Weld Cross | Sanitary Stainless Steel Fittings | Cardinal Cooling Systems',
    meta_description: 'Butt Weld Cross fittings in T304 and T316L stainless steel. ASTM A270 compliant. Multiple sizes available. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SKECKB92VBK90GY87HZYWE',
    meta_title: 'Long Weld Clamp Ferrule | Sanitary Stainless | Cardinal Cooling Systems',
    meta_description: 'Long Weld Clamp Ferrules in T304 and T316L stainless steel. Multiple sizes available. 3A certified. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SKJN5A10Q2G40H3NWJQFRF',
    meta_title: 'Solid Clamp End Cap | Sanitary Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'Solid Clamp End Caps in T304 and T316L stainless steel. Multiple sizes. 3A certified sanitary fittings. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SKYWQ2RRJMGGR3EKQ52TYE',
    meta_title: 'Clamp Gasket | Sanitary Tri-Clamp Gaskets | Cardinal Cooling Systems',
    meta_description: 'Sanitary Clamp Gaskets in EPDM, Silicone, Buna, and Teflon. Multiple sizes. FDA approved materials. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SM1B0SPXJ84RGDJGCT8PVG',
    meta_title: 'Hexagonal Tube Hanger with PP Insert | Pipe Supports | Cardinal Cooling Systems',
    meta_description: 'Hexagonal Tube Hangers with Polypropylene Insert for sanitary tubing support. Multiple sizes. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SM5SBNBC7ATAS8309TW6M2',
    meta_title: '1/2 Inch Thick Tube Flange | Sanitary Stainless | Cardinal Cooling Systems',
    meta_description: '1/2 inch thick tube flanges in stainless steel for sanitary piping systems. Multiple sizes available. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SMGT3Z6MQHKWXHVQ3R2K1G',
    meta_title: 'Polished 45° Elbow with Tangents | Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'Polished 45° Elbows with Tangents in T304 and T316L stainless steel. Interior polished to 20Ra. Multiple sizes. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SMQRNXPPG51XHDYXQA46ED',
    meta_title: 'Bolted Clamps | Sanitary Tri-Clamp Fittings | Cardinal Cooling Systems',
    meta_description: 'Sanitary Bolted Clamps in stainless steel. Heavy duty design for high pressure applications. Multiple sizes. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SMV7D3B71ZFFW30A92GDZY',
    meta_title: 'Bolted I-Line Clamps | Sanitary Stainless | Cardinal Cooling Systems',
    meta_description: 'Bolted I-Line Clamps in stainless steel for I-Line fitting connections. Multiple sizes available. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SMXD84TX1KBA0B2STTNRCE',
    meta_title: 'Wingnut I-Line Clamps | Sanitary Fittings | Cardinal Cooling Systems',
    meta_description: 'Wingnut I-Line Clamps in stainless steel. Easy tool-free tightening. Multiple sizes available. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SN0G5NHMKD8DXAF7NQ66CN',
    meta_title: 'Rubber Hose Adapters | Sanitary Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'Rubber Hose Adapters for connecting sanitary stainless tubing to rubber hose. Multiple sizes. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SN322GAY4RKQQM0MFKK2C2',
    meta_title: 'Tygon Hose Adapters | Sanitary Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'Tygon Hose Adapters for connecting sanitary stainless tubing to Tygon hose. FDA compliant. Multiple sizes. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SN5GC5Z62KJA5JGKZYX7NQ',
    meta_title: 'Heavy Duty Tank Weld Ferrules ASME | Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'ASME certified Heavy Duty Tank Weld Ferrules in T304 and T316L stainless steel. Multiple sizes. Certified for pressure vessels. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SN7R0GRWK3EEK4P55V8K36',
    meta_title: '(Short) Male I-Line Ferrule | Sanitary Stainless | Cardinal Cooling Systems',
    meta_description: 'Short Male I-Line Ferrules in T304 and T316L stainless steel. Multiple sizes. 3A certified. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SNF11E0QDZKQ94CKK9F8VY',
    meta_title: 'Light Duty Tank Ferrules | Sanitary Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'Light Duty Tank Ferrules in stainless steel for tank weld connections. Multiple sizes available. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SNJ7MPHRXAC1QN3SMMKBHN',
    meta_title: 'Short Weld Clamp Ferrules | Sanitary Stainless | Cardinal Cooling Systems',
    meta_description: 'Short Weld Clamp Ferrules in T304 and T316L stainless steel. Multiple sizes. 3A certified sanitary fittings. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SNNF0MC000CR7WTT7T9M6N',
    meta_title: 'Female Short Weld I-Line Ferrules | Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'Female Short Weld I-Line Ferrules in T304 and T316L stainless steel. Multiple sizes. 3A certified. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SPC4V8CNXEFK4M7B20X23N',
    meta_title: 'Clamp x Schedule 5S Weld Adapters | Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'Clamp x Schedule 5S Weld Adapters in T304 and T316L stainless steel. Multiple sizes. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SPFZS2TT596B6X4C40D29N',
    meta_title: 'Clamp x Schedule 10S Weld Adapters | Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'Clamp x Schedule 10S Weld Adapters in T304 and T316L stainless steel. Multiple sizes. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SQ099JYF6E2W5STV0Z042Z',
    meta_title: 'Clamp Laterals | Sanitary Stainless Steel Fittings | Cardinal Cooling Systems',
    meta_description: 'Sanitary Clamp Laterals in T304 and T316L stainless steel. Multiple sizes. 3A certified. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SQ273BRBSYF0NWGFHSS7H1',
    meta_title: 'Clamp True Wyes | Sanitary Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'Sanitary Clamp True Wyes in T304 and T316L stainless steel. Multiple sizes. 3A certified fittings. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SQ59R7P3DYVDWAAEXFB3PT',
    meta_title: 'Butt Weld True Wyes | Sanitary Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'Butt Weld True Wyes in T304 and T316L stainless steel. ASTM A270 compliant. Multiple sizes. Ships in 1 business day.'
  },
  {
    id: 'prod_01K5SQ83ASWT9N6BHH7EVMN07C',
    meta_title: 'Tri-Clamp 45° Elbows | Sanitary Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'Sanitary Tri-Clamp 45° Elbows in T304 and T316L stainless steel. Multiple sizes. 3A certified. Ships in 1 business day.'
  },
  {
    id: 'prod_01K9RF3C4J137AJ4XBX9RYD9MD',
    meta_title: 'Roll-On Expanding Ferrules | Sanitary Stainless | Cardinal Cooling Systems',
    meta_description: 'Roll-On Expanding Ferrules in stainless steel. Easy installation without welding. Multiple sizes available. Ships in 1 business day.'
  },
  {
    id: 'prod_01K9RG0TA17T27BYTMX0V1J6QJ',
    meta_title: 'Single Pin Heavy Duty Clamp with Wing Nut | Stainless | Cardinal Cooling Systems',
    meta_description: 'Single Pin Heavy Duty Clamps with Wing Nut in stainless steel. Easy tool-free operation. Multiple sizes. Ships in 1 business day.'
  },
  {
    id: 'prod_01KNZGDP935MASEXY4G2M4WYEF',
    meta_title: 'Female NPT x Clamp Adapter | Sanitary Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'Female NPT x Clamp Adapters in T304 and T316L stainless steel. Connect NPT threads to tri-clamp fittings. Multiple sizes. Ships in 1 business day.'
  },
  {
    id: 'prod_01KNZGRT6DJ7Z1VEF3HWFZSJGK',
    meta_title: 'Automatic Weld 45° Elbows | Sanitary Stainless Steel | Cardinal Cooling Systems',
    meta_description: 'Automatic Weld 45° Elbows in T316L stainless steel for orbital welding applications. Precision tolerances. Multiple sizes. Ships in 1 business day.'
  }
]

async function getToken() {
  const res = await fetch(`${BACKEND_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  })
  const data = await res.json()
  return data.token
}

async function main() {
  console.log('🔐 Authenticating...')
  const token = await getToken()
  console.log(`✅ Authenticated\n`)
  console.log(`📦 Updating SEO for ${seoData.length} products...\n`)

  let updated = 0
  let failed = 0

  for (const product of seoData) {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/products/${product.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          metadata: {
            meta_title: product.meta_title,
            meta_description: product.meta_description
          }
        })
      })

      if (res.ok) {
        console.log(`✅ ${product.meta_title.split('|')[0].trim()}`)
        updated++
      } else {
        const err = await res.json()
        console.error(`❌ Failed: ${product.id} — ${JSON.stringify(err)}`)
        failed++
      }
    } catch (err) {
      console.error(`❌ Error: ${product.id} — ${err.message}`)
      failed++
    }
  }

  console.log(`\n🎉 Done! Updated: ${updated}, Failed: ${failed}`)
  console.log(`\nNote: Medusa sample products (Sweatshirt/Sweatpants/Shorts) were skipped as they should be deleted.`)
}

main().catch(console.error)

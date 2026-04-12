// update-seo-missing.js
// Run: node update-seo-missing.js

const BACKEND_URL = 'http://localhost:9000'
const ADMIN_EMAIL = 'admin@yourmail.com'
const ADMIN_PASSWORD = 'lbd9fbfl5hgxj7jzfevy0yuagyft1fd3'

const seoData = [
  {
    id: 'prod_01K2ZKH2JYFJA45A1X744VD0FE',
    meta_title: 'Long Plain Bevel Seat Ferrule | 3A SS Fitting',
    meta_description: 'Seal bevel seat connections with long plain ferrule. 3A stainless steel, extended weld length, and plain end for clean sanitary piping.'
  },
  {
    id: 'prod_01K31CET4VED2WQ06TRQJP64JN',
    meta_title: 'Plain Bevel Seat Solid End Cap | 3A SS Cap',
    meta_description: 'Cap bevel seat lines cleanly with solid end cap. 3A stainless steel, plain bevel seat design, and smooth bore for sanitary systems.'
  },
  {
    id: 'prod_01K3PG0MVEEGC1GVBQ5BEV0FX1',
    meta_title: 'Teflon® Bevel Seat Gasket | 3A SS Seal',
    meta_description: 'Seal bevel seat fittings with Teflon® gasket. 3A compliant, chemical resistant PTFE material, and precision fit for sanitary connections.'
  },
  {
    id: 'prod_01K4K1N96KYTQWC888D2CTE2YG',
    meta_title: 'Butt Weld 90° Elbow with Tangents | 3A SS Fitting',
    meta_description: 'Change direction cleanly with 90° butt weld elbow. 3A stainless steel, tangent extensions, and weld ends for smooth sanitary systems.'
  },
  {
    id: 'prod_01K4K20VKQ8B1HVYTM4PD8Z77B',
    meta_title: 'Long Threaded Bevel Seat Ferrule | 3A SS Fitting',
    meta_description: 'Connect threaded bevel seat lines with long ferrule. 3A stainless steel, extended weld length, and threaded end for secure sanitary joints.'
  },
  {
    id: 'prod_01K4K2Q1PXTZT87XR9AN0HQF1X',
    meta_title: 'Butt Weld 45° Elbow | 3A SS Fitting',
    meta_description: 'Redirect flow at 45° with butt weld elbow. 3A stainless steel, smooth bore interior, and weld ends for clean sanitary piping systems.'
  },
  {
    id: 'prod_01K5S683SC732VMN92NWDTY7T6',
    meta_title: 'Type A (VB) Stub End | 3A SS Lap Joint',
    meta_description: 'Create lap joint connections with Type A VB stub end. 3A stainless steel, smooth face, and weld end for removable sanitary flanges.'
  },
  {
    id: 'prod_01K5SE1WR6GA23QC3QPNFM8KFC',
    meta_title: 'Polished End Cap | 3A SS Weld Cap',
    meta_description: 'Close pipeline ends cleanly with polished end cap. 3A stainless steel, interior polished to 20Ra, and weld end for sanitary systems.'
  },
  {
    id: 'prod_01K5SEW5AEGXRA0HZ8N0NWPVE2',
    meta_title: 'Butt Weld Lateral Wye | 3A SS Branch Fitting',
    meta_description: 'Split flow at an angle with butt weld lateral wye. 3A stainless steel, angled branch design, and weld ends for clean sanitary systems.'
  },
  {
    id: 'prod_01K5SF05FQV3EG2SHN6C0F744G',
    meta_title: 'Butt Weld 90° Elbow | 3A SS Right Angle Fit',
    meta_description: 'Turn flow 90° with butt weld elbow. 3A stainless steel, smooth radius interior, and weld ends for hygienic sanitary piping systems.'
  },
  {
    id: 'prod_01K5SFE5D58Y3BF8VMY51XAY80',
    meta_title: 'Butt Weld Concentric Reducer | 3A SS Reducer',
    meta_description: 'Reduce pipe size smoothly with concentric reducer. 3A stainless steel, centered bore transition, and weld ends for sanitary systems.'
  },
  {
    id: 'prod_01K5SFH2YNSA60Q19PYTF7AXSD',
    meta_title: 'Butt Weld Eccentric Reducer | 3A SS Reducer',
    meta_description: 'Reduce pipe size with flat bottom eccentric reducer. 3A stainless steel, offset bore design, and weld ends for drainable sanitary lines.'
  },
  {
    id: 'prod_01K5SFKBPHHPMRY616GESP33GS',
    meta_title: 'Butt Weld Short Tee | 3A SS Branch Fitting',
    meta_description: 'Branch sanitary lines with butt weld short tee. 3A stainless steel, compact body design, and weld ends for clean process piping.'
  },
  {
    id: 'prod_01K5SKAMR0YV64GAMFRNNPBT07',
    meta_title: 'Butt Weld Cross | 3A SS Four-Way Fitting',
    meta_description: 'Split flow four ways with butt weld cross fitting. 3A stainless steel, equal leg design, and weld ends for complex sanitary systems.'
  },
  {
    id: 'prod_01K5SKECKB92VBK90GY87HZYWE',
    meta_title: 'Long Weld Clamp Ferrule | 3A SS Ferrule',
    meta_description: 'Connect tri-clamp fittings with long weld ferrule. 3A stainless steel, extended weld length, and precision clamp seat for sanitary lines.'
  },
  {
    id: 'prod_01K5SKJN5A10Q2G40H3NWJQFRF',
    meta_title: 'Solid Clamp End Cap | 3A SS Blank Cap',
    meta_description: 'Cap tri-clamp lines securely with solid end cap. 3A stainless steel, flat blank design, and standard clamp seat for sanitary systems.'
  },
  {
    id: 'prod_01K5SKYWQ2RRJMGGR3EKQ52TYE',
    meta_title: 'Clamp Gasket | 3A Sanitary Tri-Clamp Seal',
    meta_description: 'Seal tri-clamp connections with sanitary gasket. 3A compliant, multiple elastomer options, and precision fit for leak-free sanitary joints.'
  },
  {
    id: 'prod_01K5SM1B0SPXJ84RGDJGCT8PVG',
    meta_title: 'Hex Tube Hanger with PP Insert | SS Support',
    meta_description: 'Support sanitary tubing cleanly with hex hanger. Stainless steel body, polypropylene insert, and hex design for secure pipe support.'
  },
  {
    id: 'prod_01K5SM5SBNBC7ATAS8309TW6M2',
    meta_title: '1/2" Thick Tube Flange | 3A SS Flange',
    meta_description: 'Connect sanitary lines to flanged equipment with thick tube flange. 3A stainless steel, 1/2" face thickness, and weld end for secure joints.'
  },
  {
    id: 'prod_01K5SMGT3Z6MQHKWXHVQ3R2K1G',
    meta_title: 'Polished 45° Elbow with Tangents | 3A SS Fit',
    meta_description: 'Redirect flow at 45° with polished elbow. 3A stainless steel, tangent extensions, and interior polished to 20Ra for smooth sanitary systems.'
  },
  {
    id: 'prod_01K5SMQRNXPPG51XHDYXQA46ED',
    meta_title: 'Bolted Clamps | Heavy Duty Sanitary SS Clamp',
    meta_description: 'Secure high-pressure tri-clamp joints with bolted clamp. Stainless steel, bolt-and-nut closure, and heavy duty design for demanding applications.'
  },
  {
    id: 'prod_01K5SMV7D3B71ZFFW30A92GDZY',
    meta_title: 'Bolted I-Line Clamps | Sanitary SS I-Line',
    meta_description: 'Join I-Line fittings securely with bolted clamp. Stainless steel, bolt closure design, and precision seat for leak-free I-Line connections.'
  },
  {
    id: 'prod_01K5SMXD84TX1KBA0B2STTNRCE',
    meta_title: 'Wingnut I-Line Clamps | Tool-Free SS Clamp',
    meta_description: 'Connect I-Line fittings fast with wingnut clamp. Stainless steel, tool-free wingnut closure, and precision seat for quick sanitary assembly.'
  },
  {
    id: 'prod_01K5SN0G5NHMKD8DXAF7NQ66CN',
    meta_title: 'Rubber Hose Adapters | Sanitary SS Adapter',
    meta_description: 'Connect sanitary tubing to rubber hose with SS adapter. Stainless steel ferrule end, barbed hose connection, and smooth bore for clean flow.'
  },
  {
    id: 'prod_01K5SN322GAY4RKQQM0MFKK2C2',
    meta_title: 'Tygon Hose Adapters | Sanitary SS Adapter',
    meta_description: 'Connect sanitary tubing to Tygon hose with SS adapter. Stainless steel ferrule end, FDA compliant, and barbed connection for clean systems.'
  },
  {
    id: 'prod_01K5SN5GC5Z62KJA5JGKZYX7NQ',
    meta_title: 'Heavy Duty Tank Weld Ferrules ASME | SS Tank Fit',
    meta_description: 'Weld sanitary connections to pressure vessels with ASME ferrule. 3A stainless steel, ASME certified, and heavy duty wall for tank applications.'
  },
  {
    id: 'prod_01K5SN7R0GRWK3EEK4P55V8K36',
    meta_title: 'Short Male I-Line Ferrule | 3A SS I-Line Fit',
    meta_description: 'Create male I-Line connections with short ferrule. 3A stainless steel, precision I-Line thread, and weld end for secure sanitary joints.'
  },
  {
    id: 'prod_01K5SNF11E0QDZKQ94CKK9F8VY',
    meta_title: 'Light Duty Tank Ferrules | Sanitary SS Fitting',
    meta_description: 'Weld sanitary connections to tanks with light duty ferrule. Stainless steel, standard wall design, and weld end for low-pressure tank lines.'
  },
  {
    id: 'prod_01K5SNJ7MPHRXAC1QN3SMMKBHN',
    meta_title: 'Short Weld Clamp Ferrules | 3A SS Ferrule',
    meta_description: 'Connect tri-clamp fittings with short weld ferrule. 3A stainless steel, compact weld length, and precision clamp seat for tight spaces.'
  },
  {
    id: 'prod_01K5SNNF0MC000CR7WTT7T9M6N',
    meta_title: 'Female Short Weld I-Line Ferrules | 3A SS Fit',
    meta_description: 'Create female I-Line connections with short weld ferrule. 3A stainless steel, precision I-Line thread, and compact weld end for sanitary lines.'
  },
  {
    id: 'prod_01K5SPC4V8CNXEFK4M7B20X23N',
    meta_title: 'Clamp x Schedule 5S Weld Adapters | SS Adapter',
    meta_description: 'Adapt tri-clamp to Schedule 5S pipe with weld adapter. Stainless steel, clamp seat one end, and schedule 5S weld end for mixed systems.'
  },
  {
    id: 'prod_01K5SPFZS2TT596B6X4C40D29N',
    meta_title: 'Clamp x Schedule 10S Weld Adapters | SS Adapter',
    meta_description: 'Adapt tri-clamp to Schedule 10S pipe with weld adapter. Stainless steel, clamp seat one end, and schedule 10S weld end for mixed systems.'
  },
  {
    id: 'prod_01K5SQ099JYF6E2W5STV0Z042Z',
    meta_title: 'Clamp Laterals | 3A SS Angled Branch Fitting',
    meta_description: 'Branch sanitary lines at an angle with clamp lateral. 3A stainless steel, angled outlet design, and clamp ends for flexible process piping.'
  },
  {
    id: 'prod_01K5SQ273BRBSYF0NWGFHSS7H1',
    meta_title: 'Clamp True Wyes | 3A SS Y Branch Fitting',
    meta_description: 'Split flow evenly with clamp true wye fitting. 3A stainless steel, equal 120° branch design, and clamp ends for balanced sanitary systems.'
  },
  {
    id: 'prod_01K5SQ59R7P3DYVDWAAEXFB3PT',
    meta_title: 'Butt Weld True Wyes | 3A SS Y Branch Fitting',
    meta_description: 'Split flow evenly with butt weld true wye fitting. 3A stainless steel, equal 120° branch design, and weld ends for balanced sanitary systems.'
  },
  {
    id: 'prod_01K5SQ83ASWT9N6BHH7EVMN07C',
    meta_title: 'Tri-Clamp 45° Elbows | 3A SS Clamp Elbow',
    meta_description: 'Redirect flow at 45° with tri-clamp elbow. 3A stainless steel, smooth radius interior, and clamp ends for clean sanitary piping systems.'
  },
  {
    id: 'prod_01K9RF3C4J137AJ4XBX9RYD9MD',
    meta_title: 'Roll-On Expanding Ferrules | No-Weld SS Fit',
    meta_description: 'Install clamp ferrules without welding with roll-on expanding design. Stainless steel, mechanical expansion fit, and clamp seat for quick assembly.'
  },
  {
    id: 'prod_01K9RG0TA17T27BYTMX0V1J6QJ',
    meta_title: 'Single Pin Heavy Duty Clamp Wing Nut | SS Clamp',
    meta_description: 'Secure heavy duty tri-clamp joints with single pin clamp. Stainless steel, wing nut closure, and heavy duty hinge for demanding sanitary systems.'
  },
  {
    id: 'prod_01KNZGDP935MASEXY4G2M4WYEF',
    meta_title: 'Female NPT x Clamp Adapter | 3A SS Adapter',
    meta_description: 'Connect NPT threaded equipment to tri-clamp lines with female adapter. 3A stainless steel, FNPT one end, and clamp seat for mixed piping systems.'
  },
  {
    id: 'prod_01KNZGRT6DJ7Z1VEF3HWFZSJGK',
    meta_title: 'Automatic Weld 45° Elbows | 3A SS Orbital Fit',
    meta_description: 'Weld 45° elbows automatically with orbital weld precision. 3A T316L stainless steel, tight tolerances, and smooth bore for automated sanitary welding.'
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
}

main().catch(console.error)

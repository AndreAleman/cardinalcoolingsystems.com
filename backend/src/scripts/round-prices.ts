// import "reflect-metadata"
// import { loadEnv } from "@medusajs/framework/utils"
// import { MedusaContainer } from "@medusajs/framework/types"
// import { startApp } from "@medusajs/medusa"
// import { IPricingModuleService } from "@medusajs/pricing"

// loadEnv(process.env.NODE_ENV || "development", process.cwd())

// async function main() {
//   const app = await startApp({
//     directory: process.cwd(),
//   })

//   const container = app.container as MedusaContainer
//   const pricingModule = container.resolve<IPricingModuleService>(
//     "@medusajs/pricing"
//   )

//   // STEP 1: fetch prices
//   const [prices, count] = await pricingModule.listPrices(
//     {},
//     { take: 100000 }
//   )

//   console.log(`Found ${count} prices. Rounding to 2 decimals...`)

//   // STEP 2: round + prepare updates
//   const updates = prices
//     .map((price) => {
//       if (price.amount == null) return null

//       const rounded = Math.round(price.amount * 100) / 100

//       if (rounded === price.amount) return null

//       return {
//         id: price.id,
//         amount: rounded,
//       }
//     })
//     .filter(
//       (p): p is { id: string; amount: number } => p !== null
//     )

//   console.log(`Will update ${updates.length} prices.`)

//   if (!updates.length) {
//     console.log("Nothing to update. Exiting.")
//     process.exit(0)
//   }

//   // STEP 3: apply updates
//   await pricingModule.updatePrices(
//     updates.map((u) => ({
//       id: u.id,
//       amount: u.amount,
//     }))
//   )

//   console.log("Price rounding completed.")
//   process.exit(0)
// }

// main().catch((err) => {
//   console.error(err)
//   process.exit(1)
// })

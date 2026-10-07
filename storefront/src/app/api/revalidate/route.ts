// storefront/src/app/api/revalidate/route.ts
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const tags = searchParams.get("tags") as string

  if (!tags) {
    return NextResponse.json({ error: "No tags provided" }, { status: 400 })
  }

  const tagsArray = tags.split(",")

  await Promise.all(
    tagsArray.map(async (tag) => {
      switch (tag) {
        case "products":
          // Store listing page: [countryCode]/(main)/store
          revalidatePath("/[countryCode]/(main)/store", "page")

          // Product detail pages: [countryCode]/(main)/products/[handle]
          revalidatePath("/[countryCode]/(main)/products/[handle]", "page")

          // ✅ Home page: [countryCode]/(main)/page.tsx
          revalidatePath("/[countryCode]/(main)", "page")
          break
        case "categories":
          // Category index + every category page (titles/H1s come from Medusa metadata)
          revalidatePath("/[countryCode]/(main)/categories", "page")
          revalidatePath("/[countryCode]/(main)/categories/[...category]", "page")
          break
        case "blog":
          // Blog index, category listings and every post (content comes from Sanity)
          revalidatePath("/[countryCode]/(main)/blog", "page")
          revalidatePath("/[countryCode]/(main)/blog/category/[slug]", "page")
          revalidatePath("/[countryCode]/(main)/blog/[slug]", "page")
          break
      }
    })
  )

  return NextResponse.json({ message: "Revalidated" }, { status: 200 })
}

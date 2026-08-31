import { model } from "@medusajs/framework/utils";

/* A part a Team Member has starred for quick reuse. Belongs to the
   person, not the Company (CONTEXT.md "Favorite"). */
export const Favorite = model
  .define("favorite", {
    id: model.id({ prefix: "fav" }).primaryKey(),
    customer_id: model.text(),
    variant_id: model.text(),
  })
  .indexes([
    {
      on: ["customer_id", "variant_id"],
      unique: true,
    },
  ]);

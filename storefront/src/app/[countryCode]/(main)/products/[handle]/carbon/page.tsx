"use client";

import React, { useEffect, useState } from "react";

// ✅ For consistency and later reuse, define the base URL
const API_BASE = "http://localhost:9000/store/products";

export default function ProductPage({
  params,
}: {
  params: { handle: string };
}) {
  // ✅ Local state to store product data and loading status
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch the product data from Medusa API on initial render (or when handle changes)
  useEffect(() => {
    const fetchProductByHandle = async () => {
      try {
        const url = `${API_BASE}?handle=${encodeURIComponent(params.handle)}`;
        const response = await fetch(url, {
          headers: {
            "accept": "application/json",
            "content-type": "application/json",
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
          },
        });
        const data = await response.json();
        setProduct(data.products?.[0] || null);
      } catch (error) {
        console.error("Failed to fetch product by handle:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProductByHandle();
  }, [params.handle]);

  return (
    <main>
      {/* ✅ Display loading, not-found, or product */}
      {loading && <p>Loading product...</p>}
      {!loading && !product && <p>Product not found.</p>}
      {!loading && product && <h1>{product.title}</h1>}
    </main>
  );
}

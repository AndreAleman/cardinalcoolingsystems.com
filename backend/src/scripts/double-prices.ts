import axios from 'axios';
import fs from 'fs';

const MEDUSA_API_URL = process.env.MEDUSA_API_URL || 'http://localhost:9000/admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@yourmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'lbd9fbfl5hgxj7jzfevy0yuagyft1fd3';

// Types (same as before)
interface Price {
  id: string;
  currency_code: string;
  amount: number;
}

interface Variant {
  id: string;
  sku: string;
  prices: Price[];
}

interface Product {
  id: string;
  title: string;
  variants: Variant[];
}

interface ProductsResponse {
  products: Product[];
  count: number;
  offset: number;
  limit: number;
}

interface PriceMap {
  [sku: string]: number;
}

interface VariantUpdate {
  id: string;
  prices: Array<{
    id: string;
    currency_code: string;
    amount: number;
  }>;
}

// Axios instance (will be configured after login)
let medusa: any;

// Login and get authenticated session
async function login(): Promise<void> {
  console.log('Authenticating with Medusa...');
  
  const authClient = axios.create({
    baseURL: MEDUSA_API_URL,
    withCredentials: true, // Important for cookie auth
  });
  
  try {
    const response = await authClient.post('/auth/user/emailpass', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    
    console.log('✓ Successfully authenticated!\n');
    
    // Create authenticated axios instance with cookies
    medusa = axios.create({
      baseURL: MEDUSA_API_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': response.headers['set-cookie']?.join('; ') || '',
      },
    });
    
  } catch (error: any) {
    console.error('✗ Authentication failed:', error.response?.data || error.message);
    throw error;
  }
}

// 1. Read CSV manually
function readCsvPrices(filePath: string): PriceMap {
  const prices: PriceMap = {};
  
  console.log(`Reading CSV from: ${filePath}\n`);
  
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split(/\r?\n/).filter(line => line.trim());
  
  console.log(`Total lines in CSV: ${lines.length}`);
  console.log(`First line (header): ${lines[0]}`);
  console.log(`Second line (first data): ${lines[1]}\n`);
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    
    if (parts.length >= 2) {
      const sku = parts[0].trim();
      const priceStr = parts[1].trim();
      
      if (i <= 3) {
        console.log(`Row ${i}: SKU="${sku}", Price="${priceStr}"`);
      }
      
      if (sku && priceStr) {
        const price = parseFloat(priceStr);
        if (!isNaN(price) && price > 0) {
          prices[sku] = Math.round(price * 100);
          
          if (i <= 3) {
            console.log(`  ✓ Loaded: ${sku} = $${price.toFixed(2)} (${Math.round(price * 100)} cents)`);
          }
        }
      }
    }
  }
  
  console.log(`\nLoaded ${Object.keys(prices).length} prices from CSV`);
  console.log('\nSample prices (first 5):');
  Object.entries(prices).slice(0, 5).forEach(([sku, price]) => {
    console.log(`  ${sku}: $${(price / 100).toFixed(2)} (${price} cents)`);
  });
  
  return prices;
}

// 2. Fetch all products and variants
async function fetchAllProducts(): Promise<Product[]> {
  let products: Product[] = [];
  const limit = 100;
  let offset = 0;
  let done = false;

  console.log('\n' + '='.repeat(50));
  console.log('Fetching products from Medusa...');
  console.log('='.repeat(50) + '\n');
  
  while (!done) {
    try {
      const response = await medusa.get('/products', {
        params: { offset, limit, expand: 'variants,variants.prices' },
      });
      
      products = products.concat(response.data.products);
      console.log(`Fetched ${products.length} products so far...`);
      
      if (response.data.products.length < limit) {
        done = true;
      } else {
        offset += limit;
      }
    } catch (error: any) {
      console.error('Error fetching products:', error.message);
      throw error;
    }
  }
  
  console.log(`\nTotal products fetched: ${products.length}`);
  return products;
}

// 3. Update variants by SKU
async function updateVariantsBySku(pricesBySku: PriceMap): Promise<void> {
  const products = await fetchAllProducts();
  let updatedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;

  console.log('\n' + '='.repeat(50));
  console.log('Starting price updates...');
  console.log('='.repeat(50) + '\n');

  for (const product of products) {
    const updates: VariantUpdate[] = [];
    
    for (const variant of product.variants) {
      if (!variant.sku) {
        skippedCount++;
        continue;
      }

      if (pricesBySku[variant.sku] !== undefined) {
        if (variant.prices && variant.prices.length > 0) {
          const price = variant.prices[0];
          updates.push({
            id: variant.id,
            prices: [{
              id: price.id,
              currency_code: price.currency_code,
              amount: pricesBySku[variant.sku],
            }],
          });
        } else {
          console.warn(`  ⚠ Variant ${variant.sku} has no existing prices, skipping...`);
          skippedCount++;
        }
      } else {
        notFoundCount++;
      }
    }
    
    if (updates.length > 0) {
      try {
        await medusa.post(`/products/${product.id}/variants/batch`, { 
          update: updates 
        });
        updatedCount += updates.length;
        console.log(`✓ Updated ${updates.length} variant(s) for: ${product.title}`);
      } catch (error: any) {
        console.error(`✗ Error updating product ${product.title}:`, error.response?.data || error.message);
      }
    }
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log('SUMMARY');
  console.log('='.repeat(50));
  console.log(`✓ Variants updated: ${updatedCount}`);
  console.log(`⚠ Variants skipped (no prices): ${skippedCount}`);
  console.log(`ℹ Variants not in CSV: ${notFoundCount}`);
  console.log('='.repeat(50));
}

// 4. Main execution
(async () => {
  try {
    console.log('\n' + '='.repeat(50));
    console.log('PRICE UPDATE SCRIPT');
    console.log('='.repeat(50) + '\n');
    
    // Login first
    await login();
    
    const pricesBySku = readCsvPrices('prices.csv');
    
    if (Object.keys(pricesBySku).length === 0) {
      console.error('\n✗ No prices found in CSV! Check the file format.');
      process.exit(1);
    }
    
    await updateVariantsBySku(pricesBySku);
    
    console.log('\n✅ Price update process completed successfully!\n');
  } catch (error: any) {
    console.error('\n✗ Error updating prices:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();

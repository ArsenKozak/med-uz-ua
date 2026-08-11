import fs from 'node:fs';
import path from 'node:path';

interface ProductSeed {
  id: string;
  title: string;
  category: 'lenses' | 'care' | 'frames' | 'sunglasses';
  brand: string;
  price: number;
  inStock: boolean;
  image: string;
  description: string;
}

const SEED_FILE = path.join(process.cwd(), 'shop_seed.json');
const TARGET_DIR = path.join(process.cwd(), 'src', 'content', 'products');

function seedProducts() {
  console.log('🚀 Починаємо генерацію Astro Content Collections для товарів...');

  if (!fs.existsSync(SEED_FILE)) {
    console.error(`❌ Помилка: Файл ${SEED_FILE} не знайдено! Спочатку створи shop_seed.json.`);
    process.exit(1);
  }

  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  const rawData = fs.readFileSync(SEED_FILE, 'utf-8');
  const products: ProductSeed[] = JSON.parse(rawData);

  let createdCount = 0;
  const categoryStats: Record<string, number> = {
    lenses: 0,
    care: 0,
    frames: 0,
    sunglasses: 0
  };

  for (const product of products) {
    const filePath = path.join(TARGET_DIR, `${product.id}.json`);
    
    // Записуємо окремий JSON-файл для кожного товару
    fs.writeFileSync(filePath, JSON.stringify(product, null, 2), 'utf-8');
    
    createdCount++;
    if (categoryStats[product.category] !== undefined) {
      categoryStats[product.category]++;
    }
  }

  console.log(`\n✅ Успішно створено ${createdCount} JSON-файлів у ${TARGET_DIR}:\n`);
  console.log(` 📦 Контактні лінзи (lenses):    ${categoryStats.lenses}`);
  console.log(` 🧴 Засоби догляду (care):        ${categoryStats.care}`);
  console.log(` 👓 Окуляри та оправи (frames):   ${categoryStats.frames}`);
  console.log(` 🕶️  Сонцезахисні (sunglasses):   ${categoryStats.sunglasses}\n`);
  console.log('🎉 Готово! Astro Content Layer тепер має повний типізований каталог.');
}

seedProducts();

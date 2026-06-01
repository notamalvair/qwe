import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

// Ensure the data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR);
}

const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const OPTIONS_FILE = path.join(DATA_DIR, 'options.json');

// Interface definition for products
interface ColorOption {
  n: string; // name
  c: string; // color hex/value
  image: string; // photo URL
}

interface Product {
  id: number;
  name: string;
  price: number;
  oldPrice: number | null;
  cat: string;
  badge: string | null;
  brand: string;
  storage: number; // in GB
  image: string;
  desc: string;
  colors: ColorOption[];
  specs: { [key: string]: string }[];
  gallery: string[];
}

interface OrderItem {
  productId: number;
  name: string;
  color: string;
  storage: number;
  count: number;
  price: number;
  image?: string;
}

interface Order {
  id: number;
  fio: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  comment: string;
  payment: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'new' | 'confirmed' | 'canceled';
  date: string;
  source: string;
}

interface ShopOptions {
  phone: string;
  email: string;
  address: string;
  telegramAdmin: string;
  socials: {
    vk?: string;
    telegram?: string;
    whatsapp?: string;
  };
  banners: {
    id: number;
    title: string;
    subtitle: string;
    link: string;
    image: string;
  }[];
  seo: {
    title: string;
    description: string;
    robots: string;
  };
}

// Global Shop Options Fallback
const DEFAULT_OPTIONS: ShopOptions = {
  phone: '+7 (495) 123-4567',
  email: 'info@ibro.ru',
  address: 'г. Москва, ул. Арбат, д. 10',
  telegramAdmin: '@ibro_manager',
  socials: {
    vk: 'https://vk.com/ibro_store',
    telegram: 'https://t.me/ibro_store',
    whatsapp: 'https://wa.me/79251234567'
  },
  banners: [
    {
      id: 1,
      title: 'iPhone 16 Pro Max',
      subtitle: 'Превосходство в каждой грани. Процессор A18 Pro, камера 48 Мп и невероятный титановый корпус.',
      link: '/category/iPhone',
      image: 'https://images.unsplash.com/photo-1727371714282-3d96434442ef?q=80&w=1200'
    },
    {
      id: 2,
      title: 'MacBook Pro M4',
      subtitle: 'Невероятная мощность в ультратонком дизайне для настоящих профессионалов.',
      link: '/category/Mac',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200'
    },
    {
      id: 3,
      title: 'Apple Watch Series 10',
      subtitle: 'Наш самый большой дисплей и самый тонкий дизайн. Ваша забота о здоровье.',
      link: '/category/Watch',
      image: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=1200'
    }
  ],
  seo: {
    title: 'Мобильный интернет магазин техники Apple I:Bro',
    description: 'Оригинальная техника Apple, Samsung, Xiaomi, Dyson по низким ценам в Москве. Официальная гарантия, быстрая доставка.',
    robots: 'index, follow'
  }
};

// Beautiful Fallback Products
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 1832,
    name: "Apple iPhone 16 Pro Max 256GB Desert Titanium",
    price: 139990,
    oldPrice: 154990,
    cat: "iPhone",
    badge: "Хит",
    brand: "Apple",
    storage: 256,
    image: "https://images.unsplash.com/photo-1727371583571-0818276f570d?q=80&w=600",
    desc: "iPhone 16 Pro Max в титановом исполнении с мощным чипом A18 Pro, кнопкой Camera Control и непревзойдённым временем автономной работы.",
    colors: [
      { n: "desert titanium", c: "#B3A68C", image: "https://images.unsplash.com/photo-1727371583571-0818276f570d?q=80&w=600" },
      { n: "natural titanium", c: "#A5A5A1", image: "https://images.unsplash.com/photo-1727371714282-3d96434442ef?q=80&w=600" },
      { n: "white titanium", c: "#EDECE9", image: "https://images.unsplash.com/photo-1727371583852-5202868019ab?q=80&w=600" },
      { n: "black titanium", c: "#2C2D30", image: "https://images.unsplash.com/photo-1727371583840-7e61e0892dd8?q=80&w=600" }
    ],
    specs: [
      { "Серия": "iPhone 16 Pro Max" },
      { "Память": "256 ГБ" },
      { "Процессор": "Apple A18 Pro" },
      { "Камера": "48 + 48 + 12 Мп" },
      { "Дисплей": "6.9 дюймов, OLED, Super Retina XDR" }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1727371583571-0818276f570d?q=80&w=600",
      "https://images.unsplash.com/photo-1727371714282-3d96434442ef?q=80&w=600",
      "https://images.unsplash.com/photo-1727371583852-5202868019ab?q=80&w=600"
    ]
  },
  {
    id: 1833,
    name: "Apple iPhone 16 Pro 128GB Natural Titanium",
    price: 114990,
    oldPrice: null,
    cat: "iPhone",
    badge: "Новинка",
    brand: "Apple",
    storage: 128,
    image: "https://images.unsplash.com/photo-1727371714282-3d96434442ef?q=80&w=600",
    desc: "iPhone 16 Pro с экраном 6.3 дюйма, камерой с 5-кратным оптическим зумом и новой тактильной панелью управления камерой.",
    colors: [
      { n: "natural titanium", c: "#A5A5A1", image: "https://images.unsplash.com/photo-1727371714282-3d96434442ef?q=80&w=600" },
      { n: "desert titanium", c: "#B3A68C", image: "https://images.unsplash.com/photo-1727371583571-0818276f570d?q=80&w=600" },
      { n: "black titanium", c: "#2C2D30", image: "https://images.unsplash.com/photo-1727371583840-7e61e0892dd8?q=80&w=600" }
    ],
    specs: [
      { "Серия": "iPhone 16 Pro" },
      { "Память": "128 ГБ" },
      { "Процессор": "Apple A18 Pro" },
      { "Камера": "48 + 48 + 12 Мп" }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1727371714282-3d96434442ef?q=80&w=600"
    ]
  },
  {
    id: 2389,
    name: "Apple iPhone 16 128GB Ultramarine",
    price: 89990,
    oldPrice: 99990,
    cat: "iPhone",
    badge: "Скидка",
    brand: "Apple",
    storage: 128,
    image: "https://images.unsplash.com/photo-1727184206512-c51feac9e86c?q=80&w=600",
    desc: "Базовый iPhone 16 в умопомрачительном синем цвете Ultramarine. Кнопка экшена, чип A18 и порт USB-C.",
    colors: [
      { n: "ultramarine", c: "#4C6B94", image: "https://images.unsplash.com/photo-1727184206512-c51feac9e86c?q=80&w=600" },
      { n: "pink", c: "#F3C5CE", image: "https://images.unsplash.com/photo-1727184133499-d4da5e917d5e?q=80&w=600" },
      { n: "black", c: "#222222", image: "https://images.unsplash.com/photo-1727184133446-5fd71a06df5c?q=80&w=600" },
      { n: "white", c: "#FFFFFF", image: "https://images.unsplash.com/photo-1727184133544-7ecdbd28bc9a?q=80&w=600" }
    ],
    specs: [
      { "Серия": "iPhone 16" },
      { "Память": "128 ГБ" },
      { "Процессор": "Apple A18" }
    ],
    gallery: ["https://images.unsplash.com/photo-1727184206512-c51feac9e86c?q=80&w=600"]
  },
  {
    id: 2404,
    name: "Apple iPhone 15 128GB Black",
    price: 74990,
    oldPrice: null,
    cat: "iPhone",
    badge: null,
    brand: "Apple",
    storage: 128,
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=600",
    desc: "Надёжный флагман прошлого года с Dynamic Island, процессором A16 Bionic и великолепной камерой 48 Мп.",
    colors: [
      { n: "black", c: "#1F2124", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=600" },
      { n: "blue", c: "#D4E2EC", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=600" }
    ],
    specs: [
      { "Серия": "iPhone 15" },
      { "Память": "128 ГБ" }
    ],
    gallery: []
  },
  {
    id: 3001,
    name: "MacBook Pro 14 M4 16GB 512GB Space Gray",
    price: 189990,
    oldPrice: 209990,
    cat: "Mac",
    badge: "Суперцена",
    brand: "Apple",
    storage: 512,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600",
    desc: "Макбук нового поколения с невероятными 16 ГБ объединённой памяти в базовой конфигурации и мощнейшим процессором M4.",
    colors: [
      { n: "space gray", c: "#4A4A4A", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600" },
      { n: "silver", c: "#D1D5DB", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600" }
    ],
    specs: [
      { "Процессор": "Apple M4 (10 ядер)" },
      { "ОЗУ": "16 ГБ" },
      { "SSD": "512 ГБ" },
      { "Экран": "14.2 Liquid Retina XDR 120Hz" }
    ],
    gallery: []
  },
  {
    id: 3002,
    name: "Apple iPad Pro 11 M4 Ultra-thin 256GB WiFi Space Black",
    price: 104990,
    oldPrice: null,
    cat: "iPad",
    badge: "Хит",
    brand: "Apple",
    storage: 256,
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600",
    desc: "Самый тонкий продукт в истории Apple! Невероятный OLED-дисплей Tandem Ultra, сверхмощный процессор M4.",
    colors: [
      { n: "space black", c: "#232426", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600" },
      { n: "silver", c: "#E2E8F0", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600" }
    ],
    specs: [
      { "Процессор": "Apple M4" },
      { "Память": "256 ГБ" },
      { "Экран": "11 дюймов Ultra Retina XDR OLED" }
    ],
    gallery: []
  },
  {
    id: 3003,
    name: "Apple Watch Series 10 46mm Jet Black Aluminum",
    price: 43990,
    oldPrice: 48990,
    cat: "Watch",
    badge: "Новинка",
    brand: "Apple",
    storage: 64,
    image: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=600",
    desc: "Watch Series 10 — увеличенный дисплей, тонкий корпус 9.7 мм, быстрая зарядка и мониторинг апноэ во сне.",
    colors: [
      { n: "jet black", c: "#1C1D21", image: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=600" },
      { n: "rose gold", c: "#ECC5C0", image: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=600" }
    ],
    specs: [
      { "Размер": "46 мм" },
      { "Материал": "Алюминий" },
      { "Защита": "IP6X, 50 метров" }
    ],
    gallery: []
  },
  {
    id: 3004,
    name: "Apple AirPods Max Lightning Green",
    price: 52990,
    oldPrice: 59990,
    cat: "Audio",
    badge: "В тренде",
    brand: "Apple",
    storage: 0,
    image: "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?q=80&w=600",
    desc: "Полноразмерные наушники от Apple с непревзойдённым качеством звука, активным шумоподавлением и премиальным дизайном.",
    colors: [
      { n: "green", c: "#B3C4B3", image: "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?q=80&w=600" },
      { n: "silver", c: "#E2E8F0", image: "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?q=80&w=600" },
      { n: "sky blue", c: "#A5C7E0", image: "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?q=80&w=600" }
    ],
    specs: [
      { "Тип": "Полноразмерные" },
      { "Шумоподавление": "Активное (ANC)" },
      { "Время работы": "До 20 часов" }
    ],
    gallery: []
  },
  {
    id: 4001,
    name: "Samsung Galaxy S24 Ultra 256GB Titanium Gray",
    price: 112990,
    oldPrice: 124990,
    cat: "Samsung",
    badge: "Флагман",
    brand: "Samsung",
    storage: 256,
    image: "https://images.unsplash.com/photo-1707507183020-f1361fd658ec?q=80&w=600",
    desc: "Технологическое чудо от Samsung с ИИ-функциями Galaxy AI, стилусом S Pen, титановым корпусом и камерой 200 Мп.",
    colors: [
      { n: "titanium gray", c: "#8F9094", image: "https://images.unsplash.com/photo-1707507183020-f1361fd658ec?q=80&w=600" },
      { n: "titanium black", c: "#2B2C2E", image: "https://images.unsplash.com/photo-1707507183020-f1361fd658ec?q=80&w=600" }
    ],
    specs: [
      { "Серия": "Galaxy S24 Ultra" },
      { "Память": "256 ГБ" },
      { "Камера": "200 + 50 + 12 + 10 Мп" },
      { "Процессор": "Snapdragon 8 Gen 3" }
    ],
    gallery: []
  },
  {
    id: 5001,
    name: "Xiaomi 14 Ultra 512GB Black",
    price: 99990,
    oldPrice: 119990,
    cat: "Xiaomi",
    badge: "Лейка",
    brand: "Xiaomi",
    storage: 512,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600",
    desc: "Камерофон высшего пика со светосильной оптикой Leica, дюймовым сенсором, экраном WQHD+ AMOLED и беспроводной зарядкой 80 Вт.",
    colors: [
      { n: "black", c: "#151617", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600" },
      { n: "white", c: "#EAEAEA", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600" }
    ],
    specs: [
      { "Серия": "Xiaomi 14 Ultra" },
      { "Память": "512 ГБ" },
      { "Оптика": "Leica Summilux" }
    ],
    gallery: []
  },
  {
    id: 6001,
    name: "Dyson Airwrap Complete Long Prussian Blue",
    price: 59990,
    oldPrice: null,
    cat: "Home",
    badge: "Хит продаж",
    brand: "Dyson",
    storage: 0,
    image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=600",
    desc: "Легендарный стайлер Dyson для бережной укладки волос без экстремального перегрева. Полный комплект насадок в кофре.",
    colors: [
      { n: "prussian blue", c: "#1C3144", image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=600" },
      { n: "nickel copper", c: "#D48C70", image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=600" }
    ],
    specs: [
      { "Мощность": "1300 Вт" },
      { "Режимы скорости": "3" },
      { "Режимы нагрева": "3" }
    ],
    gallery: []
  }
];

// Asynchronously load data
async function initData() {
  // Initialize Options
  if (!existsSync(OPTIONS_FILE)) {
    await fs.writeFile(OPTIONS_FILE, JSON.stringify(DEFAULT_OPTIONS, null, 2), 'utf-8');
  }

  // Initialize Orders
  if (!existsSync(ORDERS_FILE)) {
    await fs.writeFile(ORDERS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }

  // Initialize Products
  if (existsSync(PRODUCTS_FILE)) {
    console.log('Local products.json exists.');
    return;
  }

  // Try to download from GitHub
  const repoUrl = 'https://raw.githubusercontent.com/notamalvair/iq/main/products.json';
  console.log(`Starting background download from ${repoUrl}...`);
  
  try {
    const response = await fetch(repoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch: statusCode=${response.status}`);
    }
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      await fs.writeFile(PRODUCTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`Successfully downloaded and cached ${data.length} products from GitHub.`);
      return;
    } else {
      throw new Error('Retrieved empty or invalid array from GitHub.');
    }
  } catch (err: any) {
    console.error('Failed to retrieve products from GitHub. Using high-fidelity fallbacks.', err.message);
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(FALLBACK_PRODUCTS, null, 2), 'utf-8');
  }
}

// REST API Endpoints

// GET products with pagination, search, filter
app.get('/wp-json/ibro/v1/products', async (req, res) => {
  try {
    if (!existsSync(PRODUCTS_FILE)) {
      await initData();
    }
    const productsData = await fs.readFile(PRODUCTS_FILE, 'utf-8');
    let products: Product[] = JSON.parse(productsData);

    // Filter by Search
    const search = req.query.search ? String(req.query.search).toLowerCase() : '';
    if (search) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.cat.toLowerCase().includes(search) || 
        (p.desc && p.desc.toLowerCase().includes(search)) ||
        p.brand.toLowerCase().includes(search)
      );
    }

    // Filter by Category
    const cat = req.query.cat ? String(req.query.cat) : '';
    if (cat) {
      const catsList = cat.split(',').map(c => c.trim().toLowerCase());
      products = products.filter(p => catsList.includes(p.cat.toLowerCase()));
    }

    // Filter by Brand
    const brand = req.query.brand ? String(req.query.brand).toLowerCase() : '';
    if (brand) {
      products = products.filter(p => p.brand.toLowerCase() === brand);
    }

    // Filter by Price range
    const priceMin = req.query.price_min ? Number(req.query.price_min) : NaN;
    const priceMax = req.query.price_max ? Number(req.query.price_max) : NaN;
    if (!isNaN(priceMin)) {
      products = products.filter(p => p.price >= priceMin);
    }
    if (!isNaN(priceMax)) {
      products = products.filter(p => p.price <= priceMax);
    }

    // Filter by Storage
    const storageStr = req.query.storage ? String(req.query.storage) : '';
    if (storageStr) {
      const storageList = storageStr.split(',').map(s => Number(s.trim()));
      products = products.filter(p => storageList.includes(p.storage));
    }

    // Sort order
    const sort = req.query.sort ? String(req.query.sort) : '';
    if (sort === 'price_asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      products.sort((a, b) => b.price - a.price);
    } else if (sort === 'discount') {
      products.sort((a, b) => {
        const discA = a.oldPrice ? (a.oldPrice - a.price) : 0;
        const discB = b.oldPrice ? (b.oldPrice - b.price) : 0;
        return discB - discA;
      });
    } else if (sort === 'newest') {
      products.sort((a, b) => b.id - a.id); // Higher ID first
    } else {
      // Default: Alphabetical by name
      products.sort((a, b) => a.name.localeCompare(b.name));
    }

    const total = products.length;
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 20;
    const page = req.query.page ? parseInt(String(req.query.page)) : 1;
    const offset = (page - 1) * limit;

    const paginatedProducts = products.slice(offset, offset + limit);

    res.json({
      products: paginatedProducts,
      total,
      page,
      pagesCount: Math.ceil(total / limit)
    });
  } catch (err: any) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET categories with item count
app.get('/wp-json/ibro/v1/categories', async (req, res) => {
  try {
    const productsData = await fs.readFile(PRODUCTS_FILE, 'utf-8');
    const products: Product[] = JSON.parse(productsData);

    const counts: { [key: string]: number } = {};
    products.forEach(p => {
      counts[p.cat] = (counts[p.cat] || 0) + 1;
    });

    res.json(counts);
  } catch (err: any) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET Shop info / options
app.get('/wp-json/ibro/v1/options', async (req, res) => {
  try {
    const rawOptions = await fs.readFile(OPTIONS_FILE, 'utf-8');
    res.json(JSON.parse(rawOptions));
  } catch (err: any) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// POST Shop options (save configuration from admin)
app.post('/wp-json/ibro/v1/options', async (req, res) => {
  try {
    const updatedOptions = req.body;
    await fs.writeFile(OPTIONS_FILE, JSON.stringify(updatedOptions, null, 2), 'utf-8');
    res.json({ success: true, message: 'Настройки магазина успешно обновлены!' });
  } catch (err: any) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// POST create a new order
app.post('/wp-json/ibro/v1/orders', async (req, res) => {
  try {
    const orderData = req.body;
    if (!orderData.fio || !orderData.phone || !orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ error: true, message: 'Пожалуйста, заполните имя, телефон и добавьте товары в корзину.' });
    }

    const ordersData = await fs.readFile(ORDERS_FILE, 'utf-8');
    const orders: Order[] = JSON.parse(ordersData);

    const newOrderId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1001;

    // Calculate total price
    const totalPrice = orderData.items.reduce((sum: number, item: any) => sum + (item.price * item.count), 0);

    const newOrder: Order = {
      id: newOrderId,
      fio: orderData.fio,
      phone: orderData.phone,
      email: orderData.email || '',
      city: orderData.city || '',
      address: orderData.address || '',
      comment: orderData.comment || '',
      payment: orderData.payment || 'Наличные',
      items: orderData.items,
      totalPrice,
      status: 'new',
      date: new Date().toISOString(),
      source: 'I:Bro Headless Front'
    };

    orders.unshift(newOrder); // Add to the top
    await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');

    // EMAIL SENDING IMPLEMENTATION (SIMULATOR + REAL WORKER)
    const emailHtmlBody = `
      <div style="font-family: Arial, sans-serif; background-color: #f6f9fc; padding: 20px; color: #333333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px; border: 1px solid #eef2f6;">
          <h2 style="color: #1a1a1a; margin-top: 0; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0; text-align: center;">Новый заказ №${newOrderId} в магазине I:Bro</h2>
          
          <table style="width: 100%; margin-bottom: 25px; font-size: 14px; line-height: 1.6;">
            <tr>
              <td style="font-weight: bold; width: 140px; color: #718096; padding: 5px 0;">Клиент:</td>
              <td style="color: #2d3748; padding: 5px 0;">${newOrder.fio}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #718096; padding: 5px 0;">Телефон:</td>
              <td style="color: #2d3748; padding: 5px 0;">${newOrder.phone}</td>
            </tr>
            ${newOrder.email ? `
            <tr>
              <td style="font-weight: bold; color: #718096; padding: 5px 0;">Email:</td>
              <td style="color: #2d3748; padding: 5px 0;">${newOrder.email}</td>
            </tr>` : ''}
            <tr>
              <td style="font-weight: bold; color: #718096; padding: 5px 0;">Доставка:</td>
              <td style="color: #2d3748; padding: 5px 0;">${newOrder.city}, ${newOrder.address}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #718096; padding: 5px 0;">Оплата:</td>
              <td style="color: #2d3748; padding: 5px 0;">${newOrder.payment}</td>
            </tr>
            ${newOrder.comment ? `
            <tr>
              <td style="font-weight: bold; color: #718096; padding: 5px 0;">Комментарий:</td>
              <td style="color: #2d3748; padding: 5px 0; font-style: italic;">"${newOrder.comment}"</td>
            </tr>` : ''}
          </table>

          <h3 style="color: #1a1a1a; border-top: 1px solid #f0f0f0; padding-top: 20px; margin-top: 20px;">Содержимое заказа:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f7fafc; border-bottom: 1px solid #edf2f7;">
                <th style="padding: 10px; text-align: left; font-size: 12px; color: #718096;">Наименование товара</th>
                <th style="padding: 10px; text-align: center; font-size: 12px; color: #718096;">Цвет / Память</th>
                <th style="padding: 10px; text-align: center; font-size: 12px; color: #718096;">Кол-во</th>
                <th style="padding: 10px; text-align: right; font-size: 12px; color: #718096;">Цена</th>
              </tr>
            </thead>
            <tbody>
              ${newOrder.items.map(item => `
                <tr style="border-bottom: 1px solid #edf2f7; font-size: 14px;">
                  <td style="padding: 12px 10px; color: #2d3748; font-weight: 500;">${item.name}</td>
                  <td style="padding: 12px 10px; text-align: center; color: #4a5568; font-size: 13px;">
                    ${item.color ? `<span style="display:inline-block; padding: 2px 6px; background:#edf2f7; border-radius:4px; font-weight:500;">${item.color}</span>` : ''}
                    ${item.storage ? ` / ${item.storage}ГБ` : ''}
                  </td>
                  <td style="padding: 12px 10px; text-align: center; color: #2d3748; font-weight: bold;">${item.count} шт.</td>
                  <td style="padding: 12px 10px; text-align: right; color: #2d3748; font-weight: bold;">${(item.price * item.count).toLocaleString('ru-RU')} ₽</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="background-color: #f7fafc; border: 1px solid #edf2f7; border-radius: 6px; padding: 15px; text-align: right; font-size: 16px; font-weight: bold; color: #2d3748;">
            Итого к оплате: <span style="font-size: 20px; color: #e53e3e;">${totalPrice.toLocaleString('ru-RU')} ₽</span>
          </div>

          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #a0aec0;">
            Письмо сгенерировано автоматически интернет-магазином I:Bro.
          </div>
        </div>
      </div>
    `;

    console.log(`[SIMULATED MAIL SERVER] Sending alert for Order #${newOrderId}`);
    console.log(`Customer: ${newOrder.fio} (${newOrder.phone})`);
    console.log(`Total: ${newOrder.totalPrice} RUB`);

    // Actual SMTP Dispatch (if credentials exist)
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const SMTP_FROM = process.env.SMTP_FROM || 'no-reply@ibro.ru';
    const STORE_MAIL_RECEIVER = process.env.STORE_MAIL_RECEIVER || 'orders@ibro.ru';

    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: SMTP_PORT === 465, // true for 465, false for other ports e.g. 587
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
          },
        });

        // 1. Send warning to store manager
        await transporter.sendMail({
          from: `"I:Bro Store" <${SMTP_FROM}>`,
          to: STORE_MAIL_RECEIVER,
          subject: `🔥 Новый заказ №${newOrderId} – ${newOrder.fio}`,
          html: emailHtmlBody,
        });

        // 2. Duplicate to customer if email is provided
        if (newOrder.email) {
          await transporter.sendMail({
            from: `"Магазин I:Bro" <${SMTP_FROM}>`,
            to: newOrder.email,
            subject: `📦 Ваш заказ №${newOrderId} успешно принят!`,
            html: emailHtmlBody,
          });
        }
        console.log(`[SMTP] Real order emails sent for Order #${newOrderId}`);
      } catch (smtpErr: any) {
        console.error('[SMTP ERROR] Failed to send real emails:', smtpErr.message);
      }
    }

    res.json({
      success: true,
      orderId: newOrderId,
      message: 'Заказ успешно создан! Менеджер свяжется с вами в течение 10 минут.'
    });
  } catch (err: any) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// Admin management routes

// GET all orders
app.get('/api/orders', async (req, res) => {
  try {
    const ordersData = await fs.readFile(ORDERS_FILE, 'utf-8');
    res.json(JSON.parse(ordersData));
  } catch (err: any) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// Update order status (PUT)
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;
    if (!['new', 'confirmed', 'canceled'].includes(status)) {
      return res.status(400).json({ error: true, message: 'Неверный статус заказа' });
    }

    const ordersData = await fs.readFile(ORDERS_FILE, 'utf-8');
    const orders: Order[] = JSON.parse(ordersData);

    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ error: true, message: 'Заказ не найден' });
    }

    orders[orderIndex].status = status;
    await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');

    res.json({ success: true, message: `Статус заказа №${orderId} изменен на "${status}"` });
  } catch (err: any) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// Create product (POST /api/products)
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = req.body;
    if (!newProduct.name || !newProduct.price || !newProduct.cat) {
      return res.status(400).json({ error: true, message: 'Заполните обязательные поля: название, цена, категория' });
    }

    const productsData = await fs.readFile(PRODUCTS_FILE, 'utf-8');
    const products: Product[] = JSON.parse(productsData);

    const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 9001;
    const finalProduct: Product = {
      id: nextId,
      name: newProduct.name,
      price: Number(newProduct.price),
      oldPrice: newProduct.oldPrice ? Number(newProduct.oldPrice) : null,
      cat: newProduct.cat,
      badge: newProduct.badge || null,
      brand: newProduct.brand || 'Apple',
      storage: newProduct.storage ? Number(newProduct.storage) : 256,
      image: newProduct.image || 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600',
      desc: newProduct.desc || 'Описание товара',
      colors: Array.isArray(newProduct.colors) ? newProduct.colors : [{ n: "Grey", c: "#888888", image: newProduct.image }],
      specs: Array.isArray(newProduct.specs) ? newProduct.specs : [],
      gallery: Array.isArray(newProduct.gallery) ? newProduct.gallery : []
    };

    products.unshift(finalProduct); // Add to beginning
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');

    res.json({ success: true, product: finalProduct, message: 'Товар успешно добавлен в каталог!' });
  } catch (err: any) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// Update product (PUT /api/products/:id)
app.put('/api/products/:id', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const updatedData = req.body;

    const productsData = await fs.readFile(PRODUCTS_FILE, 'utf-8');
    const products: Product[] = JSON.parse(productsData);

    const index = products.findIndex(p => p.id === productId);
    if (index === -1) {
      return res.status(404).json({ error: true, message: 'Товар не найден' });
    }

    products[index] = {
      ...products[index],
      ...updatedData,
      id: productId // Guarantee ID is unchanged
    };

    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
    res.json({ success: true, product: products[index], message: 'Товар успешно обновлен!' });
  } catch (err: any) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// Delete product (DELETE /api/products/:id)
app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const productsData = await fs.readFile(PRODUCTS_FILE, 'utf-8');
    let products: Product[] = JSON.parse(productsData);

    const initialLength = products.length;
    products = products.filter(p => p.id !== productId);

    if (products.length === initialLength) {
      return res.status(404).json({ error: true, message: 'Товар не найден' });
    }

    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
    res.json({ success: true, message: 'Товар удален из каталога!' });
  } catch (err: any) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// Serve frontend assets in production
const distPath = path.join(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.NODE_ENV === 'production' ? 3000 : 3005;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Premium I:Bro backend server hosting on port ${PORT} (${process.env.NODE_ENV || 'development'} mode)`);
  try {
    await initData();
  } catch (e: any) {
    console.error('Error in post-init sequence:', e.message);
  }
});

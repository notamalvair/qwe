import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Smartphone, Laptop, Tablet, Watch, Headphones, Gamepad, Camera, 
  Layers, Heart, Search, X, SlidersHorizontal, ArrowUpDown, 
  LayoutGrid, LayoutList, Check, Sparkles, ChevronLeft, ChevronRight, 
  Settings, Plus, Trash2, Edit, Save, RefreshCw, FileSpreadsheet, 
  Info, CheckCircle, Clock, ArrowRight, ShieldCheck, Truck, 
  RotateCcw, Award, CheckSquare, Square, ShoppingBag, Eye, Phone,
  Mail, MapPin, ExternalLink, Calendar, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import ProductCard from './components/ProductCard';

// Interfaces matching server schemas
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

interface CartItem {
  productId: number;
  name: string;
  color: string;
  storage: number;
  count: number;
  price: number;
  image: string;
}

const CATEGORIES = [
  { id: 'all', name: 'Все товары' },
  { id: 'iPhone', name: 'iPhone' },
  { id: 'Mac', name: 'Mac' },
  { id: 'iPad', name: 'iPad' },
  { id: 'Watch', name: 'Watch' },
  { id: 'Audio', name: 'AirPods' },
  { id: 'Gaming', name: 'Gaming' },
  { id: 'Samsung', name: 'Samsung' },
  { id: 'Xiaomi', name: 'Xiaomi' },
  { id: 'Nothing', name: 'Nothing' },
  { id: 'Home', name: 'Dyson & Home' },
  { id: 'Accessory', name: 'Аксессуары' },
  { id: 'Other', name: 'Другое' }
];

// Extractor helper to find Model Name (e.g., "Apple iPhone 16 Pro Max")
function extractModel(name: string): string {
  let m = name;
  const storageStop = ['128GB', '256GB', '512GB', '1TB', '2TB', '8/256GB', '8/512GB', '16/512GB', '16/1TB', '8/128GB', '64GB', '32GB'];
  for (const s of storageStop) {
    const idx = m.indexOf(s);
    if (idx !== -1) {
      m = m.substring(0, idx).trim();
      break;
    }
  }
  const colorStop = ['midnight', 'starlight', 'space gray', 'space black', 'silver', 'gold', 'desert titanium', 'natural titanium', 'white titanium', 'black titanium', 'titanium', 'black', 'white', 'teal', 'pink', 'ultramarine', 'green', 'blue', 'yellow', 'purple', 'Standard', 'jet black', 'rose gold'];
  const lower = m.toLowerCase();
  for (const c of colorStop) {
    const idx = lower.lastIndexOf(c);
    if (idx > m.length * 0.3) {
      m = m.substring(0, idx).trim();
      break;
    }
  }
  return m.trim().replace(/\s+/g, ' ');
}

function getCategoryIcon(id: string) {
  switch (id) {
    case 'all': return <LayoutGrid className="w-5 h-5" />;
    case 'iPhone': return <Smartphone className="w-5 h-5" />;
    case 'Mac': return <Laptop className="w-5 h-5" />;
    case 'iPad': return <Tablet className="w-5 h-5" />;
    case 'Watch': return <Watch className="w-5 h-5" />;
    case 'Audio': return <Headphones className="w-5 h-5" />;
    case 'Gaming': return <Gamepad className="w-5 h-5" />;
    case 'Samsung': return <Smartphone className="w-5 h-5 rotate-[12deg]" />;
    case 'Xiaomi': return <Smartphone className="w-5 h-5" />;
    case 'Nothing': return <Smartphone className="w-5 h-5" />;
    case 'Home': return <Zap className="w-5 h-5 text-amber-500" />;
    case 'Accessory': return <Layers className="w-5 h-5" />;
    default: return <Info className="w-5 h-5" />;
  }
}

const API_BASE = ((import.meta as any).env?.VITE_WP_API_URL || '').replace(/\/$/, '');

export default function App() {
  // Store Catalog States
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorOccurred, setErrorOccurred] = useState(false);
  
  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  // Shop configurations
  const [shopOptions, setShopOptions] = useState<ShopOptions>({
    phone: '8 (800) 100-00-00',
    email: 'info@ibro.ru',
    address: 'г. Москва, ул. Арбат, 10',
    telegramAdmin: '@ibro_manager',
    socials: { vk: '', telegram: '', whatsapp: '' },
    banners: [
      {
        id: 1,
        title: 'iPhone 16 Pro',
        subtitle: 'Титановый корпус. Чип A18 Pro. Камера 48 Мп. Кнопка Camera Control.',
        link: 'iPhone',
        image: 'https://image.qwenlm.ai/public_source/d277a0af-480d-4633-a108-8e5f4eea33a6/150c7f294-0be3-4a47-b19d-416b6150d773.png'
      },
      {
        id: 2,
        title: 'MacBook Air M3',
        subtitle: '15-дюймовый дисплей Liquid Retina. До 18 часов автономной работы. Всего 1,51 кг.',
        link: 'Mac',
        image: 'https://image.qwenlm.ai/public_source/d277a0af-480d-4633-a108-8e5f4eea33a6/10242b93e-a6ac-4c91-b34a-e9c361a15ba3.png'
      },
      {
        id: 3,
        title: 'Apple Watch Ultra 2',
        subtitle: 'Титановый корпус 49 мм. Яркость до 3000 нит. Глубиномер.',
        link: 'Watch',
        image: 'https://image.qwenlm.ai/public_source/d277a0af-480d-4633-a108-8e5f4eea33a6/1c8287569-8b17-4c75-bf0c-cffa1fda0691.png'
      }
    ],
    seo: { title: 'I:Bro — Премиум магазин техники Apple', description: '', robots: '' }
  });

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcat, setSelectedSubcat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceMin, setPriceMin] = useState<number | ''>('');
  const [priceMax, setPriceMax] = useState<number | ''>('');
  const [priceRange, setPriceRange] = useState<number>(300000);
  const [selectedStorage, setSelectedStorage] = useState<number[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [onlyNewest, setOnlyNewest] = useState(false);
  const [sortOrder, setSortOrder] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter Accordion State
  const [priceOpen, setPriceOpen] = useState(true);
  const [colorsOpen, setColorsOpen] = useState(true);
  const [storageOpen, setStorageOpen] = useState(true);
  const [additionalOpen, setAdditionalOpen] = useState(true);

  // UI Control States
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  const [activeDetailColorIndex, setActiveDetailColorIndex] = useState<number>(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cart & Favorites Cache
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('ibro_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem('ibro_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Client checkout state
  const [checkoutForm, setCheckoutForm] = useState({
    fio: '',
    phone: '',
    email: '',
    city: 'Москва',
    address: '',
    comment: '',
    payment: 'Оплата наличными'
  });
  const [isOrdering, setIsOrdering] = useState(false);

  // One-Click Checkout States
  const [oneClickOpen, setOneClickOpen] = useState(false);
  const [oneClickProduct, setOneClickProduct] = useState<Product | null>(null);
  const [oneClickColor, setOneClickColor] = useState('Standard');
  const [oneClickStorage, setOneClickStorage] = useState(256);
  const [oneClickForm, setOneClickForm] = useState({ name: '', phone: '', comment: '' });
  const [isSubmittingOneClick, setIsSubmittingOneClick] = useState(false);

  // Trigger quick checkout
  const handleOpenOneClickCheckout = (product: Product, colorName: string, storageValue: number) => {
    setOneClickProduct(product);
    setOneClickColor(colorName);
    setOneClickStorage(storageValue);
    setOneClickForm({ name: '', phone: '', comment: '' });
    setOneClickOpen(true);
  };

  // Admin Side state
  const [adminMode, setAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState<'orders' | 'products' | 'options'>('orders');
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminEditingProduct, setAdminEditingProduct] = useState<Product | null>(null);
  const [adminCreatingProduct, setAdminCreatingProduct] = useState(false);
  const [adminProductForm, setAdminProductForm] = useState<Partial<Product>>({
    name: '',
    price: 99990,
    oldPrice: null,
    cat: 'iPhone',
    badge: 'Новинка',
    brand: 'Apple',
    storage: 256,
    image: '',
    desc: 'Оригинальный продукт премиум качества.',
    colors: [{ n: 'starlight', c: '#F5F0E8', image: '' }],
    specs: [{ 'Серия': 'Оригинал' }],
    gallery: []
  });

  // Toast System
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'info' | 'error' }[]>([]);

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('ibro_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('ibro_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Load Catalog from API
  const loadCatalogData = async () => {
    setLoading(true);
    setErrorOccurred(false);
    try {
      const res = await fetch(`${API_BASE}/wp-json/ibro/v1/products?limit=1000`);
      if (res.ok) {
        const data = await res.json();
        // Since API returns paginated products or list of products, store them
        setProducts(data.products || data || []);
      } else {
        throw new Error();
      }
    } catch (err) {
      console.error('Core catalog fetch error:', err);
      setErrorOccurred(true);
      triggerToast('Ошибка подключения к серверу API', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load SEO & Info
  const loadOptions = async () => {
    try {
      const res = await fetch(`${API_BASE}/wp-json/ibro/v1/options`);
      if (res.ok) {
        const data = await res.json();
        setShopOptions(data);
        if (data.seo && data.seo.title) {
          document.title = data.seo.title;
        }
      }
    } catch (err) {
      console.error('Failed to retrieve options:', err);
    }
  };

  useEffect(() => {
    loadCatalogData();
    loadOptions();
  }, []);

  // Admin orders loader
  const loadAdminOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setAdminOrders(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (adminMode && adminTab === 'orders') {
      loadAdminOrders();
    }
  }, [adminMode, adminTab]);

  // Handle image error fallback
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null; // Infinite loop shield
    e.currentTarget.src = "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=400";
  };

  // Open interactive product detail modal
  const openProductDetails = (product: Product) => {
    setSelectedProductDetails(product);
    setActiveDetailColorIndex(0);
  };

  // Handle active details pricing & specs
  const activeDetailColor = selectedProductDetails?.colors[activeDetailColorIndex] || null;

  // Render variables & Filter Logic (Performed on client-side for ultra fast responsiveness!)
  const filteredProducts = useMemo(() => {
    let items = [...products];

    // Category Filter
    if (selectedCategory !== 'all') {
      items = items.filter(p => p.cat.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Subcategory (model) Filter
    if (selectedSubcat) {
      items = items.filter(p => extractModel(p.name) === selectedSubcat);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.cat.toLowerCase().includes(q) || 
        (p.desc && p.desc.toLowerCase().includes(q))
      );
    }

    // Colors Filter
    if (selectedColors.length > 0) {
      items = items.filter(p => p.colors.some(c => selectedColors.includes(c.n.toLowerCase())));
    }

    // Storage Filter
    if (selectedStorage.length > 0) {
      items = items.filter(p => selectedStorage.includes(p.storage));
    }

    // Pricing range filter
    const pMin = priceMin !== '' ? Number(priceMin) : 0;
    const pMax = priceMax !== '' ? Number(priceMax) : priceRange;
    items = items.filter(p => p.price >= pMin && p.price <= pMax);

    // Only discount
    if (onlyDiscount) {
      items = items.filter(p => p.oldPrice && p.oldPrice > p.price);
    }

    // Only new
    if (onlyNewest) {
      items = items.filter(p => p.badge === 'Новинка');
    }

    // Sorting
    if (sortOrder === 'price-asc') {
      items.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-desc') {
      items.sort((a, b) => b.price - a.price);
    } else if (sortOrder === 'discount') {
      items.sort((a, b) => {
        const discA = a.oldPrice ? (a.oldPrice - a.price) : 0;
        const discB = b.oldPrice ? (b.oldPrice - b.price) : 0;
        return discB - discA;
      });
    } else if (sortOrder === 'new') {
      items.sort((a, b) => (b.badge === 'Новинка' ? 1 : 0) - (a.badge === 'Новинка' ? 1 : 0));
    }

    return items;
  }, [products, selectedCategory, selectedSubcat, searchQuery, selectedColors, selectedStorage, priceMin, priceMax, priceRange, onlyDiscount, onlyNewest, sortOrder]);

  // Derived subcategories dynamically listed in the horizontal scrolling strip
  const subcategoriesList = useMemo(() => {
    if (selectedCategory === 'all') return [];
    const models = new Map<string, string>();
    products
      .filter(p => p.cat.toLowerCase() === selectedCategory.toLowerCase())
      .forEach(p => {
        const m = extractModel(p.name);
        if (m && !models.has(m)) {
          models.set(m, p.image || '');
        }
      });
    return Array.from(models.entries()).map(([name, image]) => ({ name, image }));
  }, [products, selectedCategory]);

  // All colors dynamically populated from currently displayed category
  const activeCategoryColors = useMemo(() => {
    const colorSet = new Set<string>();
    const items = selectedCategory === 'all' ? products : products.filter(p => p.cat.toLowerCase() === selectedCategory.toLowerCase());
    items.forEach(p => {
      p.colors.forEach(c => colorSet.add(c.n.toLowerCase()));
    });
    return Array.from(colorSet).sort();
  }, [products, selectedCategory]);

  // All storage sizes dynamically populated from active category
  const activeCategoryStorages = useMemo(() => {
    const storageSet = new Set<number>();
    const items = selectedCategory === 'all' ? products : products.filter(p => p.cat.toLowerCase() === selectedCategory.toLowerCase());
    items.forEach(p => {
      if (p.storage) storageSet.add(p.storage);
    });
    return Array.from(storageSet).sort((a, b) => a - b);
  }, [products, selectedCategory]);

  // Reset category level sub filters
  const resetFilters = () => {
    setPriceMin('');
    setPriceMax('');
    setPriceRange(300000);
    setSelectedColors([]);
    setSelectedStorage([]);
    setOnlyDiscount(false);
    setOnlyNewest(false);
    setSelectedSubcat(null);
    setSearchQuery('');
    triggerToast('Фильтры успешно сброшены', 'info');
  };

  // Add Item to cart
  const addToCart = (product: Product, colorName?: string, storageValue?: number) => {
    const selectedColor = colorName || product.colors[0]?.n || 'Standard';
    const selectedColorHex = product.colors.find(c => c.n === selectedColor)?.c || '#ccc';
    const selectedColorImg = product.colors.find(c => c.n === selectedColor)?.image || product.image;
    const finalStorage = storageValue || product.storage || 0;

    setCart(prev => {
      const match = prev.find(item => item.productId === product.id && item.color === selectedColor);
      if (match) {
        triggerToast(`Количество ${product.name} увеличено`, 'success');
        return prev.map(item => item.productId === product.id && item.color === selectedColor 
          ? { ...item, count: item.count + 1 }
          : item
        );
      } else {
        triggerToast(`${product.name} добавлен в корзину`, 'success');
        return [...prev, {
          productId: product.id,
          name: product.name,
          color: selectedColor,
          storage: finalStorage,
          count: 1,
          price: product.price,
          image: selectedColorImg
        }];
      }
    });
  };

  // Quantifier controls
  const updateCartQty = (productId: number, color: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId && item.color === color) {
          const nextVal = item.count + delta;
          return nextVal > 0 ? { ...item, count: nextVal } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  // Remove from Bag
  const removeFromCart = (productId: number, color: string) => {
    setCart(prev => prev.filter(item => !(item.productId === productId && item.color === color)));
    triggerToast('Удалено из корзины', 'info');
  };

  // Switch Category
  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedSubcat(null);
  };

  // Toggle Favorite
  const toggleFavorite = (productId: number) => {
    setFavorites(prev => {
      const has = prev.includes(productId);
      if (has) {
        triggerToast('Удалено из избранного', 'info');
        return prev.filter(id => id !== productId);
      } else {
        triggerToast('Добавлено в избранное!', 'success');
        return [...prev, productId];
      }
    });
  };

  // Submit Order Form
  const handleSendCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutForm.fio || !checkoutForm.phone) {
      triggerToast('Пожалуйста, укажите имя и контактный телефон', 'error');
      return;
    }
    setIsOrdering(true);
    try {
      const payload = {
        fio: checkoutForm.fio,
        phone: checkoutForm.phone,
        email: checkoutForm.email,
        city: checkoutForm.city,
        address: checkoutForm.address,
        comment: checkoutForm.comment,
        payment: checkoutForm.payment,
        items: cart
      };

      const res = await fetch(`${API_BASE}/wp-json/ibro/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        triggerToast(`Заказ №${data.orderId || 'успешно'} оформлен!`, 'success');
        setCart([]);
        setCheckoutOpen(false);
        setCheckoutForm({ fio: '', phone: '', email: '', city: 'Москва', address: '', comment: '', payment: 'Оплата наличными' });
      } else {
        throw new Error();
      }
    } catch (err) {
      triggerToast('Ошибка оформления заказа', 'error');
    } finally {
      setIsOrdering(false);
    }
  };

  // Submit Quick 1-Click Order Form
  const handleOneClickCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oneClickForm.name || !oneClickForm.phone) {
      triggerToast('Пожалуйста, заполните Имя и Номер телефона', 'error');
      return;
    }
    if (!oneClickProduct) return;

    setIsSubmittingOneClick(true);
    try {
      const payload = {
        fio: oneClickForm.name,
        phone: oneClickForm.phone,
        email: '1click@ibro.ru',
        city: 'Москва',
        address: 'Быстрый заказ в 1 клик',
        comment: `${oneClickForm.comment ? oneClickForm.comment + '\n' : ''}Быстрый заказ в 1 клик на товар: ${oneClickProduct.name} (Выбранный цвет: ${oneClickColor}, Память: ${oneClickStorage >= 1000 ? (oneClickStorage / 1000).toFixed(0) + ' TB' : oneClickStorage + ' GB'})`,
        payment: 'Предоплата',
        items: [
          {
            productId: oneClickProduct.id,
            name: oneClickProduct.name,
            color: oneClickColor,
            storage: oneClickStorage,
            count: 1,
            price: oneClickProduct.price,
            image: oneClickProduct.image
          }
        ]
      };

      const res = await fetch(`${API_BASE}/wp-json/ibro/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        triggerToast(`Заказ №${data.orderId || 'успешно'} оформлен в 1 клик! Наш менеджер свяжется с вами.`, 'success');
        setOneClickOpen(false);
        setOneClickForm({ name: '', phone: '', comment: '' });
      } else {
        throw new Error();
      }
    } catch (err) {
      triggerToast('Ошибка оформления быстрого заказа', 'error');
    } finally {
      setIsSubmittingOneClick(false);
    }
  };

  // Carriage Slider banner intervals
  useEffect(() => {
    const bannerTimer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % shopOptions.banners.length);
    }, 6000);
    return () => clearInterval(bannerTimer);
  }, [shopOptions.banners.length]);

  // Admin section: Deletion
  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Вы точно желаете навсегда удалить этот товар?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerToast('Товар успешно удален', 'success');
        loadCatalogData();
      }
    } catch (err) {
      triggerToast('Ошибка удаления товара', 'error');
    }
  };

  // Admin section: Save / Create product
  const handleSaveAdminProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProductForm.name || !adminProductForm.price) {
      triggerToast('Укажите название и цену товара', 'error');
      return;
    }
    const isEditing = !!adminEditingProduct;
    const url = isEditing ? `/api/products/${adminEditingProduct?.id}` : '/api/products';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminProductForm)
      });
      if (res.ok) {
        triggerToast(isEditing ? 'Товар успешно изменен' : 'Создан новый товар', 'success');
        setAdminEditingProduct(null);
        setAdminCreatingProduct(false);
        setAdminProductForm({
          name: '', price: 99990, oldPrice: null, cat: 'iPhone', badge: 'Новинка',
          brand: 'Apple', storage: 256, image: '', desc: '', colors: [{ n: 'starlight', c: '#F5F0E8', image: '' }],
          specs: [{ 'Серия': 'Оригинал' }], gallery: []
        });
        loadCatalogData();
      }
    } catch (err) {
      triggerToast('Не удалось сохранить изменения', 'error');
    }
  };

  // Update order status on admin
  const handleAdminOrderStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        triggerToast('Статус заказа успешно обновлен', 'success');
        loadAdminOrders();
      }
    } catch (err) {
      triggerToast('Не удалось обновить статус', 'error');
    }
  };

  // Export orders code
  const handleExportCSV = () => {
    if (adminOrders.length === 0) {
      triggerToast('Список заказов пуст', 'error');
      return;
    }
    let csv = "\uFEFFID;ФИО;Телефон;Сумма;Статус;Дата;Товары\n";
    adminOrders.forEach(o => {
      const items = o.items.map(i => `${i.name} (${i.color}) x${i.count}`).join(', ');
      csv += `${o.id};${o.fio};${o.phone};${o.totalPrice};${o.status};${o.date};${items}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `ibro_orders_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Экспорт скачан', 'success');
  };

  // Save Shop configs
  const handleSaveShopSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/wp-json/ibro/v1/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shopOptions)
      });
      if (res.ok) {
        triggerToast('Глобальные настройки обновлены!', 'success');
      }
    } catch (err) {
      triggerToast('Не удалось сохранить настройки', 'error');
    }
  };

  // Helper formatting currency
  const fmt = (price: number) => {
    return price.toLocaleString('ru-RU') + ' ₽';
  };

  // Sum total price of cart
  const cartTotalPrice = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.count), 0);
  }, [cart]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 selection:bg-blue-600 selection:text-white overflow-x-hidden">
      
      {/* Dynamic Toasts Overlay */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ transform: 'translateX(120%)', opacity: 0 }}
              animate={{ transform: 'translateX(0)', opacity: 1 }}
              exit={{ transform: 'translateX(120%)', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-md pointer-events-auto max-w-sm ${
                t.type === 'success' ? 'bg-[#34C759] text-white' : 
                t.type === 'error' ? 'bg-[#FF3B30] text-white' : 'bg-gray-900/95 text-white'
              }`}
            >
              {t.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <Info className="w-5 h-5 flex-shrink-0" />}
              <span className="text-sm font-medium pr-1">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Double-row Header precisely mimicking i-shop.ru */}
      <div className="bg-[#F8FAFB] text-[#6A737F] text-[11px] select-none border-b border-[#EDEEF0] h-[36px] flex items-center">
        <div className="max-w-[1320px] mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 hover:text-[#333333] transition-colors cursor-pointer text-[#6A737F]">
              <MapPin className="w-3 h-3 text-[#6A737F]" /> Москва
            </span>
            <span className="hidden md:inline hover:text-[#333333] transition-colors cursor-pointer text-[#6A737F]">Доставка</span>
            <span className="hidden md:inline hover:text-[#333333] transition-colors cursor-pointer text-[#6A737F]">Сервис</span>
            <span className="hidden md:inline hover:text-[#333333] transition-colors cursor-pointer text-[#6A737F]">Trade-in</span>
          </div>
          <div className="flex items-center gap-6">
            <a href={`tel:${shopOptions.phone}`} className="hover:text-[#2066B0] transition-colors flex items-center gap-1.5 font-bold text-[#333333]">
              <Phone className="w-3 h-3 text-[#6A737F]" /> {shopOptions.phone}
            </a>
            <button 
              onClick={() => setAdminMode(!adminMode)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-[2px] font-semibold transition-all cursor-pointer ${
                adminMode 
                  ? 'bg-amber-500 text-gray-950 shadow-xs' 
                  : 'bg-white border border-[#EDEEF0] text-[#333333] hover:bg-gray-100'
              }`}
            >
              <Settings className="w-3 h-3" /> {adminMode ? 'Выход' : 'Админ'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Row Sticky */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#EDEEF0] transition-all">
        <div className="max-w-[1320px] mx-auto px-6 h-[48px] flex items-center gap-6 justify-between">
          
          {/* Mobile hamburger & Logo left side */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-[#333333] hover:text-black transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>

            {/* Logo brand / Title */}
            <button 
              onClick={() => {
                handleSelectCategory('all');
                setSearchQuery('');
                setSelectedSubcat(null);
              }}
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-90 align-middle"
            >
              <span className="text-[20px] font-bold tracking-tight text-black font-display leading-none">I:Bro</span>
              <span className="text-[8px] tracking-wide bg-black text-white px-1 py-0.5 rounded-[2px] font-bold leading-none">iShop</span>
            </button>
          </div>

          {/* Sticky Desktop Categories Navigation - Styled precisely like catalog of i-shop.ru */}
          <nav className="hidden lg:flex items-center gap-6 text-[12px] font-semibold text-[#333333] h-full">
            {CATEGORIES.slice(1, 7).map(cat => {
              const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    handleSelectCategory(cat.id);
                    setSelectedSubcat(null);
                  }}
                  className={`h-full flex items-center hover:text-[#2066B0] transition-colors relative border-b-2 cursor-pointer ${
                    isSelected ? 'text-[#2066B0] border-[#2066B0] font-semibold' : 'border-transparent text-[#333333]'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
            
            <button
              onClick={() => {
                handleSelectCategory('all');
                setOnlyDiscount(true);
                setSelectedSubcat(null);
              }}
              className="h-full flex items-center text-[#F0371B] hover:text-[#c42812] transition-colors gap-1 font-semibold cursor-pointer"
            >
              <span className="w-1.5 h-1.5 bg-[#F0371B] rounded-full inline-block animate-pulse"></span> Скидки
            </button>
          </nav>

          {/* Search bar & Icons section */}
          <div className="flex items-center gap-4">
            
            {/* Search Input Widget */}
            <div className="relative hidden md:block">
              <input 
                type="text" 
                placeholder="Поиск по сайту..." 
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setSelectedSubcat(null); // Clear subcategory on typing
                }}
                className="w-52 lg:w-64 pl-8 pr-8 py-1.5 bg-[#F8FAFB] border border-[#EDEEF0] rounded-[2px] text-[12px] focus:outline-none focus:bg-white focus:border-black transition-all text-[#333333] placeholder-[#828B95]"
              />
              <Search className="w-3.5 h-3.5 text-[#6A737F] absolute left-2.5 top-2.5" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-[#6A737F] hover:text-[#333333]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Like Counter */}
            <button 
              onClick={() => {
                if (favorites.length === 0) {
                  triggerToast('В избранном пока нет товаров', 'info');
                } else {
                  triggerToast(`У вас в избранном ${favorites.length} шт. товаров`, 'success');
                }
              }}
              className="text-[#333333] hover:text-[#F0371B] transition-colors relative p-1 cursor-pointer"
              title="Избранное"
            >
              <Heart className={`w-[18px] h-[18px] ${favorites.length > 0 ? 'fill-[#F0371B] text-[#F0371B]' : 'text-[#333333]'}`} />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#000000] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold tracking-tight">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Bag Cart Action toggle */}
            <button 
              onClick={() => setCartOpen(true)}
              className="text-[#333333] hover:text-black transition-colors relative p-1 cursor-pointer"
              title="Корзина покупок"
            >
              <ShoppingBag className="w-[18px] h-[18px]" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#000000] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold tracking-tight">
                  {cart.reduce((sum, item) => sum + item.count, 0)}
                </span>
              )}
            </button>

          </div>
        </div>
      </header>

      {/* 3. i-shop.ru Category Strip (под шапкой) */}
      <div className="bg-white border-b border-[#EDEEF0] py-3 select-none">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="flex items-center gap-6 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
            {CATEGORIES.map(cat => {
              const isActive = selectedCategory.toLowerCase() === cat.id.toLowerCase();
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    handleSelectCategory(cat.id);
                    setSelectedSubcat(null);
                  }}
                  className={`flex flex-col items-center justify-center gap-1.5 min-w-[70px] cursor-pointer transition-all ${
                    isActive 
                      ? 'text-black font-semibold' 
                      : 'text-[#6A737F] hover:text-[#333333] font-medium'
                  }`}
                >
                  <div className={`p-1.5 rounded-full transition-colors ${
                    isActive ? 'bg-[#F2F4F5] text-black' : 'text-[#6A737F]'
                  }`}>
                    {getCategoryIcon(cat.id)}
                  </div>
                  <span className="text-[11px] whitespace-nowrap leading-none font-sans">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ADMIN INTERACTIVE CONTROL PANEL VIEW */}
      <AnimatePresence>
        {adminMode && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-50 border-b border-amber-100 overflow-hidden"
          >
            <div className="max-w-[1360px] mx-auto px-5 py-6">
              <div className="flex items-center justify-between border-b border-amber-200/50 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-amber-600" /> Панель управления магазином (Админ-зона)
                  </h2>
                  <p className="text-xs text-amber-700 mt-1">Добавление техники Apple, обработка входящих заявок и редактирование настроек</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setAdminTab('orders')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      adminTab === 'orders' ? 'bg-amber-600 text-white shadow' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                  >
                    Заказы ({adminOrders.length})
                  </button>
                  <button 
                    onClick={() => setAdminTab('products')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      adminTab === 'products' ? 'bg-amber-600 text-white shadow' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                  >
                    Товары ({products.length})
                  </button>
                  <button 
                    onClick={() => setAdminTab('options')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      adminTab === 'options' ? 'bg-amber-600 text-white shadow' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                  >
                    Контакты / SEO
                  </button>
                </div>
              </div>

              {/* ADMIN TAB: ORDERS */}
              {adminTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-amber-900">Поступившие заказы в базу</h3>
                    <button 
                      onClick={handleExportCSV}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Экспортировать в CSV
                    </button>
                  </div>
                  {adminOrders.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed border-amber-200 text-amber-700 text-sm">
                      Входящих заказов пока нет. Оформите заказ на сайте, и он появится здесь!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {adminOrders.map(order => (
                        <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
                          <div className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.status === 'new' ? 'bg-[#FF9F0A]/10 text-[#FF9F0A]' :
                            order.status === 'confirmed' ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'
                          }`}>
                            {order.status === 'new' ? 'Новый' : order.status === 'confirmed' ? 'Подтвержден' : 'Отменен'}
                          </div>
                          <div>
                            <div className="text-gray-400 text-[10px] font-semibold">ЗАКАЗ №{order.id}</div>
                            <div className="font-bold text-sm text-gray-900 mt-1">{order.fio}</div>
                            <div className="text-xs font-medium text-gray-600 mt-1">{order.phone}</div>
                            <div className="text-gray-400 text-[11px] mt-2 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> {new Date(order.date).toLocaleString('ru-RU')}
                            </div>
                            <div className="border-t border-gray-100 my-3 pt-2">
                              <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Товары ({order.items?.length || 0})</div>
                              <div className="space-y-1 mt-1 max-h-24 overflow-y-auto pr-1">
                                {order.items?.map((item, idx) => (
                                  <div key={idx} className="text-xs text-gray-700 flex justify-between items-center gap-2">
                                    <span className="truncate">• {item.name} ({item.color})</span>
                                    <span className="font-bold flex-shrink-0">{item.count} шт.</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="border-t border-gray-100 mt-2 pt-3 flex justify-between items-center bg-gray-50 -mx-4 -mb-4 p-4 rounded-b-xl">
                            <span className="font-extrabold text-[#1D1D1F] text-sm">{fmt(order.totalPrice)}</span>
                            <div className="flex gap-1">
                              <button 
                                onClick={() => handleAdminOrderStatus(order.id, 'confirmed')}
                                className="px-2 py-1 bg-[#34C759] hover:bg-[#2cb250] text-white text-[10px] font-bold rounded"
                              >
                                В работу
                              </button>
                              <button 
                                onClick={() => handleAdminOrderStatus(order.id, 'canceled')}
                                className="px-2 py-1 bg-[#FF3B30] hover:bg-[#e0342a] text-white text-[10px] font-bold rounded"
                              >
                                Отменить
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ADMIN TAB: PRODUCTS LIST & ADD */}
              {adminTab === 'products' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-end gap-4">
                    <h3 className="text-sm font-bold text-[#1D1D1F]">Список позиций на сайте</h3>
                    <button 
                      onClick={() => {
                        setAdminProductForm({
                          name: '', price: 99990, oldPrice: null, cat: 'iPhone', badge: 'Новинка',
                          brand: 'Apple', storage: 256, image: '', desc: 'Оригинальный продукт премиум качества.',
                          colors: [{ n: 'starlight', c: '#F5F0E8', image: '' }], specs: [{ 'Серия': 'Оригинал' }], gallery: []
                        });
                        setAdminCreatingProduct(true);
                        setAdminEditingProduct(null);
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Добавить товар
                    </button>
                  </div>

                  {/* FORM TO CREATE OR EDIT CONTAINER */}
                  {(adminCreatingProduct || adminEditingProduct) && (
                    <form onSubmit={handleSaveAdminProduct} className="bg-white p-5 rounded-2xl border border-amber-200/50 shadow-md space-y-4 max-w-2xl">
                      <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                        <Edit className="w-4 h-4 text-amber-600" /> 
                        {adminEditingProduct ? `Редактирование: ${adminEditingProduct.name}` : 'Добавление нового товара в каталог'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Название товара *</label>
                          <input 
                            type="text" 
                            required
                            value={adminProductForm.name || ''}
                            onChange={e => setAdminProductForm({ ...adminProductForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500"
                            placeholder="Например, Apple iPhone 16 Pro 256GB"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Категория *</label>
                          <select 
                            value={adminProductForm.cat || 'iPhone'}
                            onChange={e => setAdminProductForm({ ...adminProductForm, cat: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500"
                          >
                            {CATEGORIES.slice(1).map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Цена, ₽ *</label>
                          <input 
                            type="number" 
                            required
                            value={adminProductForm.price || ''}
                            onChange={e => setAdminProductForm({ ...adminProductForm, price: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Старая цена, ₽ (необязательно)</label>
                          <input 
                            type="number" 
                            value={adminProductForm.oldPrice || ''}
                            onChange={e => setAdminProductForm({ ...adminProductForm, oldPrice: e.target.value ? Number(e.target.value) : null })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Ссылка на фото обложки *</label>
                          <input 
                            type="text" 
                            value={adminProductForm.image || ''}
                            onChange={e => setAdminProductForm({ ...adminProductForm, image: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                            placeholder="https://imageUrl.jpg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Объем памяти (ГБ, только число например 256)</label>
                          <input 
                            type="number" 
                            value={adminProductForm.storage || ''}
                            onChange={e => setAdminProductForm({ ...adminProductForm, storage: e.target.value ? Number(e.target.value) : 256 })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Описание товара</label>
                          <textarea 
                            value={adminProductForm.desc || ''}
                            onChange={e => setAdminProductForm({ ...adminProductForm, desc: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button 
                          type="button" 
                          onClick={() => {
                            setAdminEditingProduct(null);
                            setAdminCreatingProduct(false);
                          }}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Отмена
                        </button>
                        <button 
                          type="submit" 
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 shadow"
                        >
                          <Save className="w-3.5 h-3.5" /> Сохранить
                        </button>
                      </div>
                    </form>
                  )}

                  {/* SMALL PRODUCT ITEMS TABLE */}
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm max-h-96 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                          <th className="p-3">Фото</th>
                          <th className="p-3">Название</th>
                          <th className="p-3">Категория</th>
                          <th className="p-3">Цена</th>
                          <th className="p-3 text-right">Управление</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {products.slice(0, 100).map(p => (
                          <tr key={p.id} className="hover:bg-gray-50/50">
                            <td className="p-3">
                              <img src={p.image} className="w-9 h-9 object-contain rounded bg-light" alt="" />
                            </td>
                            <td className="p-3 font-semibold text-gray-900 truncate max-w-xs">{p.name}</td>
                            <td className="p-3 text-gray-500">{p.cat}</td>
                            <td className="p-3 font-bold text-gray-900">{fmt(p.price)}</td>
                            <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                              <button 
                                type="button" 
                                onClick={() => {
                                  setAdminEditingProduct(p);
                                  setAdminProductForm(p);
                                  setAdminCreatingProduct(false);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ADMIN TAB: SHOP OPTIONS */}
              {adminTab === 'options' && (
                <form onSubmit={handleSaveShopSettings} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm max-w-xl space-y-4">
                  <h3 className="font-bold text-gray-900 text-sm pb-1 border-b border-gray-100">Основные реквизиты сайта</h3>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Телефон в шапке сайта</label>
                    <input 
                      type="text" 
                      value={shopOptions.phone}
                      onChange={e => setShopOptions({ ...shopOptions, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">E-mail адрес</label>
                    <input 
                      type="email" 
                      value={shopOptions.email}
                      onChange={e => setShopOptions({ ...shopOptions, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Адрес торговой точки</label>
                    <input 
                      type="text" 
                      value={shopOptions.address}
                      onChange={e => setShopOptions({ ...shopOptions, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Почтовый ID Telegram Администратора</label>
                    <input 
                      type="text" 
                      value={shopOptions.telegramAdmin}
                      onChange={e => setShopOptions({ ...shopOptions, telegramAdmin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">SEO Мета-заголовок главной страницы</label>
                    <input 
                      type="text" 
                      value={shopOptions.seo?.title || ''}
                      onChange={e => setShopOptions({ 
                        ...shopOptions, 
                        seo: { ...(shopOptions.seo || { title: '', description: '', robots: '' }), title: e.target.value } 
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md transition-colors"
                  >
                    Сохранить настройки магазина
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO BANNER SECTION (Apple Carousel Banner) */}
      <section className="relative overflow-hidden bg-[#F5F5F7] h-auto border-b border-gray-100">
        <div className="max-w-[1360px] mx-auto overflow-hidden relative">
          
          {/* Inner sliders wrapper */}
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {shopOptions.banners.map((slide, sIdx) => (
              <div 
                key={slide.id} 
                className="min-w-full flex flex-col md:flex-row items-center justify-between px-8 md:px-16 py-12 md:py-16 bg-gradient-to-br from-[#FAFAFA] to-[#F5F5F7]"
              >
                <div className="md:w-1/2 space-y-4 text-center md:text-left mb-8 md:mb-0">
                  <span className="inline-flex px-2.5 py-1 bg-blue-100 text-blue-600 text-[10px] font-extrabold uppercase tracking-wide rounded-full">
                    Популярное устройство
                  </span>
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
                    {slide.title}
                  </h1>
                  <p className="text-gray-500 text-sm md:text-base max-w-md mx-auto md:mx-0">
                    {slide.subtitle}
                  </p>
                  <div className="flex gap-2 justify-center md:justify-start pt-2">
                    <button 
                      onClick={() => handleSelectCategory(slide.link)}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold shadow-md transition-colors cursor-pointer"
                    >
                      Смотреть в каталоге
                    </button>
                    <button 
                      onClick={() => triggerToast('Запросите подробности у @ibro_manager в Telegram', 'info')}
                      className="px-5 py-2.5 text-blue-600 hover:underline text-xs font-semibold cursor-pointer"
                    >
                      Подробнее &gt;
                    </button>
                  </div>
                </div>
                <div className="md:w-1/2 flex justify-center">
                  <img 
                    src={slide.image} 
                    alt={slide.title} 
                    className="max-h-[280px] md:max-h-[350px] object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500" 
                    onError={handleImageError}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Previous & Next Control arrows */}
          <button 
            onClick={() => setCurrentSlide(prev => (prev - 1 + shopOptions.banners.length) % shopOptions.banners.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/70 backdrop-blur rounded-full shadow flex items-center justify-center hover:bg-white text-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentSlide(prev => (prev + 1) % shopOptions.banners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/70 backdrop-blur rounded-full shadow flex items-center justify-center hover:bg-white text-gray-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Navigation sliders indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 ">
            {shopOptions.banners.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => setCurrentSlide(dotIdx)}
                className={`h-2.5 rounded-full transition-all ${dotIdx === currentSlide ? 'bg-blue-600 w-5' : 'bg-gray-300 w-2.5'}`}
              />
            ))}
          </div>

        </div>
      </section>

      {/* i-shop.ru STYLED MAIN CATEGORIES (52x47) & DYNAMIC MODEL CHIPS CAROUSEL */}
      <section className="py-6 border-b border-[#EDEEF0] bg-[#FFFFFF] select-none">
        <div className="max-w-[1320px] mx-auto px-6">
          
          {/* Main Categories Row */}
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-none pb-2 scroll-smooth">
            {CATEGORIES.map(cat => {
              const isActive = selectedCategory.toLowerCase() === cat.id.toLowerCase();
              
              // Map categories to modern vector icons
              const getCategoryIcon = (id: string, css: string) => {
                switch (id) {
                  case 'all': return <LayoutGrid className={css} />;
                  case 'iPhone': return <Smartphone className={css} />;
                  case 'Mac': return <Laptop className={css} />;
                  case 'iPad': return <Tablet className={css} />;
                  case 'Watch': return <Watch className={css} />;
                  case 'Audio': return <Headphones className={css} />;
                  case 'Gaming': return <Gamepad className={css} />;
                  case 'Samsung': return <Smartphone className={css} />;
                  case 'Xiaomi': return <Smartphone className={css} />;
                  case 'Home': return <Sparkles className={css} />;
                  case 'Accessory': return <Layers className={css} />;
                  default: return <Plus className={css} />;
                }
              };

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    handleSelectCategory(cat.id);
                    setSelectedSubcat(null);
                  }}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className={`w-[52px] h-[47px] flex items-center justify-center rounded-[4px] border transition-all duration-200 ${
                    isActive 
                      ? 'bg-white border-black shadow-xs' 
                      : 'bg-[#F8FAFB] border-[#EDEEF0] hover:bg-white hover:border-gray-400'
                  }`}>
                    {getCategoryIcon(cat.id, `w-5 h-5 ${isActive ? 'text-black' : 'text-[#6A737F] group-hover:text-black'}`)}
                  </div>
                  <span className={`text-[12px] font-semibold mt-1.5 transition-colors whitespace-nowrap ${
                    isActive ? 'text-black' : 'text-[#6A737F] group-hover:text-black'
                  }`}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* i-shop.ru Subcategories (Models horizontal scroll): image (90x90) + small model name title */}
          {subcategoriesList.length > 0 && (
            <div className="relative mt-6 pt-5 border-t border-[#EDEEF0]">
              <div className="flex items-center justify-between mb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <span>Выберите модель:</span>
                {selectedSubcat && (
                  <button 
                    onClick={() => setSelectedSubcat(null)}
                    className="text-[#2066B0] hover:underline cursor-pointer font-semibold capitalize"
                  >
                    Сбросить модель
                  </button>
                )}
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none w-full scroll-smooth" id="subcatStrip">
                {/* Visual "All Models" block with outline wrapper */}
                <div 
                  onClick={() => setSelectedSubcat(null)}
                  className={`flex-shrink-0 w-[110px] p-2 bg-white border rounded-[6px] transition-all cursor-pointer select-none text-center ${
                    !selectedSubcat ? 'border-black' : 'border-[#EDEEF0] hover:border-black'
                  }`}
                >
                  <div className="w-[90px] h-[90px] mx-auto flex items-center justify-center bg-[#F8FAFB] rounded-[6px]">
                    <Layers className="w-6 h-6 text-[#6A737F]" />
                  </div>
                  <div className="text-[10px] font-medium text-[#333333] mt-2 leading-tight min-h-[2.4em] flex items-center justify-center">
                    Все модели
                  </div>
                </div>

                {/* Subcategories elements matching the active model products */}
                {subcategoriesList.map(sub => {
                  const isSubActive = selectedSubcat === sub.name;
                  return (
                    <div 
                      key={sub.name}
                      onClick={() => setSelectedSubcat(sub.name)}
                      className={`flex-shrink-0 w-[110px] p-2 bg-white border rounded-[6px] transition-all cursor-pointer select-none text-[#333333] text-center ${
                        isSubActive ? 'border-black' : 'border-[#EDEEF0] hover:border-black'
                      }`}
                    >
                      <div className="w-[90px] h-[90px] mx-auto flex items-center justify-center bg-[#F8FAFB] rounded-[6px] overflow-hidden p-1.5">
                        <img 
                          src={sub.image} 
                          alt={sub.name} 
                          className="max-w-full max-h-full object-contain transition-transform duration-300 hover:scale-[1.03]"
                          onError={handleImageError}
                        />
                      </div>
                      <div className="text-[10px] font-medium text-[#333333] mt-2 leading-tight line-clamp-2 min-h-[2.4em] px-0.5">
                        {sub.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* MAIN SCREEN SECTION (Catalogs, Accordeon Accordance filter Sidebar, and Cards panel) */}
      <main className="flex-1 py-8 max-w-[1360px] mx-auto px-5 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT-SIDE FILTER SIDEBAR - i-shop.ru style */}
          <aside className="w-full lg:w-68 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-[2px] border border-[#EDEEF0] p-5 select-none divide-y divide-[#EDEEF0] space-y-3">
              
              <div className="flex items-center justify-between pb-2">
                <h3 className="font-bold text-[#333333] text-[13px] uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-[#828B95]" /> Фильтры
                </h3>
                <button 
                  onClick={resetFilters}
                  className="text-[11px] font-semibold text-[#2066B0] hover:underline cursor-pointer"
                >
                  Сбросить
                </button>
              </div>

              {/* Price accordion */}
              <div className="pt-3">
                <div 
                  onClick={() => setPriceOpen(!priceOpen)}
                  className="flex items-center justify-between cursor-pointer group py-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-[#333333] uppercase tracking-wider text-[11px] transition-colors group-hover:text-black">Цена, ₽</span>
                    {(priceMin !== '' || priceMax !== '') && (
                      <span className="bg-[#F2F4F5] text-black text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                        {priceMin !== '' && priceMax !== '' ? '2' : '1'}
                      </span>
                    )}
                  </div>
                  {priceOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#828B95]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#828B95]" />}
                </div>

                <AnimatePresence initial={false}>
                  {priceOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: 10 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden space-y-3"
                    >
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          placeholder="от" 
                          value={priceMin}
                          onChange={e => setPriceMin(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-1/2 px-2.5 py-1.5 bg-[#F8FAFB] border border-[#EDEEF0] rounded-[2px] text-[12px] font-medium focus:outline-none focus:border-black text-[#333333]"
                        />
                        <input 
                          type="number" 
                          placeholder="до" 
                          value={priceMax}
                          onChange={e => setPriceMax(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-1/2 px-2.5 py-1.5 bg-[#F8FAFB] border border-[#EDEEF0] rounded-[2px] text-[12px] font-medium focus:outline-none focus:border-black text-[#333333]"
                        />
                      </div>
                      
                      {/* Custom-styled Range Slider */}
                      <input 
                        type="range" 
                        min="5000" 
                        max="400000" 
                        step="5000"
                        value={priceMax || priceRange} 
                        onChange={e => {
                          const val = Number(e.target.value);
                          setPriceRange(val);
                          setPriceMax(val);
                        }}
                        className="w-full h-[4px] bg-[#EDEEF0] rounded-lg appearance-none cursor-pointer accent-black focus:outline-none mt-2
                                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:cursor-pointer
                                   [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-black [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                      />
                      
                      <div className="flex justify-between text-[11px] font-semibold text-gray-400">
                        <span>от 5 000 ₽</span>
                        <span>до {(priceMax || priceRange).toLocaleString('ru-RU')} ₽</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* COLORS SELECTOR COMPONENT */}
              {activeCategoryColors.length > 0 && (
                <div className="pt-3">
                  <div 
                    onClick={() => setColorsOpen(!colorsOpen)}
                    className="flex items-center justify-between cursor-pointer group py-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-bold text-[#333333] uppercase tracking-wider text-[11px] transition-colors group-hover:text-black">Цвета</span>
                      {selectedColors.length > 0 && (
                        <span className="bg-[#F2F4F5] text-black text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                          {selectedColors.length}
                        </span>
                      )}
                    </div>
                    {colorsOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#828B95]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#828B95]" />}
                  </div>

                  <AnimatePresence initial={false}>
                    {colorsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 10 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-2 pt-1">
                          {activeCategoryColors.map(color => {
                            const isSelected = selectedColors.includes(color);
                            
                            const getColorHex = (name: string): string => {
                              const norm = name.toLowerCase().trim();
                              if (norm.includes('desert')) return '#C2B29A';
                              if (norm.includes('natural')) return '#A6A9AA';
                              if (norm.includes('white titanium')) return '#F3F2EE';
                              if (norm.includes('black titanium')) return '#3B3C3E';
                              if (norm.includes('titanium')) return '#A6A9AA';
                              if (norm.includes('midnight')) return '#1D232C';
                              if (norm.includes('starlight')) return '#F0EFEA';
                              if (norm.includes('space gray') || norm.includes('space grey')) return '#53565A';
                              if (norm.includes('space black')) return '#1C1C1E';
                              if (norm.includes('silver')) return '#E3E4E5';
                              if (norm.includes('gold')) return '#F5E3D2';
                              if (norm.includes('jet black')) return '#050505';
                              if (norm.includes('rose gold')) return '#B76E79';
                              if (norm.includes('black')) return '#000000';
                              if (norm.includes('white')) return '#FFFFFF';
                              if (norm.includes('teal')) return '#307E84';
                              if (norm.includes('pink')) return '#F2D1CE';
                              if (norm.includes('ultramarine')) return '#5C74B5';
                              if (norm.includes('green')) return '#A2E0CA';
                              if (norm.includes('blue')) return '#C5E0F3';
                              if (norm.includes('yellow')) return '#FEF0B2';
                              if (norm.includes('purple')) return '#D9D2E9';
                              return '#CCCCCC';
                            };

                            const hexValue = getColorHex(color);
                            const isLight = ['white', 'starlight', 'silver', 'white titanium'].some(w => color.toLowerCase().includes(w));
                            const friendlyName = color.charAt(0).toUpperCase() + color.slice(1);

                            return (
                              <button
                                key={color}
                                onClick={() => {
                                  setSelectedColors(prev => 
                                    prev.includes(color) 
                                      ? prev.filter(c => c !== color) 
                                      : [...prev, color]
                                  );
                                }}
                                className={`w-6 h-6 rounded-full transition-all relative flex-shrink-0 cursor-pointer ${
                                  isSelected 
                                    ? 'ring-2 ring-black ring-offset-1 scale-105' 
                                    : isLight ? 'border border-[#DDDDDD]' : 'border border-transparent'
                                }`}
                                style={{ backgroundColor: hexValue }}
                                title={friendlyName}
                              />
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* STORAGE COMPONENT CHIPS */}
              {activeCategoryStorages.length > 0 && (
                <div className="pt-3">
                  <div 
                    onClick={() => setStorageOpen(!storageOpen)}
                    className="flex items-center justify-between cursor-pointer group py-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-bold text-[#333333] uppercase tracking-wider text-[11px] transition-colors group-hover:text-black">Объем памяти</span>
                      {selectedStorage.length > 0 && (
                        <span className="bg-[#F2F4F5] text-black text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                          {selectedStorage.length}
                        </span>
                      )}
                    </div>
                    {storageOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#828B95]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#828B95]" />}
                  </div>

                  <AnimatePresence initial={false}>
                    {storageOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 10 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-2 pt-1">
                          {activeCategoryStorages.map(size => {
                            const isSelected = selectedStorage.includes(size);
                            return (
                              <button
                                key={size}
                                onClick={() => {
                                  setSelectedStorage(prev => 
                                    prev.includes(size) 
                                      ? prev.filter(s => s !== size) 
                                      : [...prev, size]
                                  );
                                }}
                                className={`px-2.5 py-1 text-[11px] font-semibold border rounded-[2px] transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#333333] text-white border-[#333333]'
                                    : 'bg-white text-[#333333] border-[#EDEEF0] hover:border-black'
                                }`}
                              >
                                {size >= 1000 ? `${size/1000} TB` : `${size} GB`}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ADDITIONAL STATUS ACCORDIONS */}
              <div className="pt-3">
                <div 
                  onClick={() => setAdditionalOpen(!additionalOpen)}
                  className="flex items-center justify-between cursor-pointer group py-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-[#333333] uppercase tracking-wider text-[11px] transition-colors group-hover:text-black">Дополнительно</span>
                    {((onlyDiscount ? 1 : 0) + (onlyNewest ? 1 : 0)) > 0 && (
                      <span className="bg-[#F2F4F5] text-black text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                        {((onlyDiscount ? 1 : 0) + (onlyNewest ? 1 : 0))}
                      </span>
                    )}
                  </div>
                  {additionalOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#828B95]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#828B95]" />}
                </div>

                <AnimatePresence initial={false}>
                  {additionalOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: 10 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden space-y-2.5 pt-1"
                    >
                      {/* Only discounts */}
                      <div 
                        onClick={() => setOnlyDiscount(!onlyDiscount)}
                        className="flex items-center gap-2 cursor-pointer select-none group"
                      >
                        <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${
                          onlyDiscount ? 'bg-black border-black text-white' : 'border-[#C5CACF] bg-[#F8FAFB] group-hover:border-black'
                        }`}>
                          {onlyDiscount && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="text-[12px] font-medium text-[#333333]">Только со скидкой</span>
                      </div>

                      {/* Only newest */}
                      <div 
                        onClick={() => setOnlyNewest(!onlyNewest)}
                        className="flex items-center gap-2 cursor-pointer select-none group"
                      >
                        <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${
                          onlyNewest ? 'bg-black border-black text-white' : 'border-[#C5CACF] bg-[#F8FAFB] group-hover:border-black'
                        }`}>
                          {onlyNewest && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="text-[12px] font-medium text-[#333333]">Показать новинки</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </aside>

          {/* RIGHT SIDE MAIN PRODUCTS RENDERING GRID */}
          <div className="flex-1">
            
            {/* Catalog Info & Grid Header controllers */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 font-display">
                  {selectedSubcat || CATEGORIES.find(c => c.id === selectedCategory)?.name || 'Все товары'}
                </h2>
                <p className="text-xs text-gray-400 font-semibold mt-1">
                  Найдено: <span className="text-blue-600 font-extrabold">{filteredProducts.length}</span> позиций
                </p>
              </div>

              {/* Sorting triggers and Grid layout view modifiers */}
              <div className="flex items-center gap-3 self-start sm:self-auto">
                
                {/* View grids vs representation rows list */}
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-400 hover:text-gray-900'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-400 hover:text-gray-900'}`}
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                </div>

                {/* Sorter Selection Dropdown */}
                <select 
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                  className="bg-[#F5F5F7] border-0 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="popular">По популярности</option>
                  <option value="price-asc">Сначала дешёвые</option>
                  <option value="price-desc">Сначала дорогие</option>
                  <option value="discount">По скидке</option>
                  <option value="new">Новинки</option>
                </select>

              </div>
            </div>

            {/* PRODUCT CARDS LIST GRID */}
            {loading ? (
              <div className="text-center py-20 flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 text-black animate-spin mb-3" />
                <p className="text-gray-400 text-xs font-bold">Синхронизация каталога с базой CRM...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-24 bg-[#F8FAFB] rounded-[4px] border border-[#EDEEF0]">
                <Info className="w-12 h-12 text-[#828B95] mx-auto mb-4" />
                <h3 className="text-sm font-bold text-[#333333] uppercase tracking-wider">По этим фильтрам ничего не найдено</h3>
                <p className="text-xs text-[#828B95] mt-1.5 max-w-sm mx-auto font-medium">Попробуйте изменить ценовой диапазон или сбросить активные свитчи</p>
                <button 
                  onClick={resetFilters}
                  className="mt-5 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-[4px] text-xs font-bold transition-all uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  Очистить фильтры
                </button>
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5" 
                  : "flex flex-col gap-4"
              }>
                {filteredProducts.map(prod => (
                  <ProductCard
                    key={prod.id}
                    prod={prod}
                    allProducts={products}
                    favorites={favorites}
                    cart={cart}
                    toggleFavorite={toggleFavorite}
                    addToCart={addToCart}
                    openProductDetails={openProductDetails}
                    handleImageError={handleImageError}
                    onOneClickCheckout={handleOpenOneClickCheckout}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}

          </div>
        </div>
      </main>

      {/* PROMOTIONAL MARKETING DOUBLE GRID BANNERS */}
      <section className="py-10 bg-[#F5F5F7] select-none border-y border-gray-100 mt-12">
        <div className="max-w-[1360px] mx-auto px-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 cursor-pointer hover:-translate-y-1 transition-transform border border-gray-100 shadow-xs group">
            <div className="flex-1 text-center sm:text-left space-y-1">
              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest leading-none">Выгодные Условия</span>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 font-display pt-1">Рассрочка на технику</h3>
              <p className="text-xs text-gray-400 max-w-xs pt-1">Оформление рассрочки 0-0-12 без первого взноса и переплат за 10 минут.</p>
              <div className="text-blue-600 hover:underline pt-2 font-semibold text-xs flex items-center justify-center sm:justify-start gap-1">Узнать подробнее <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-all" /></div>
            </div>
            <div className="text-5xl md:text-6xl bg-blue-50/50 p-4 rounded-2xl w-20 h-20 flex items-center justify-center">💳</div>
          </div>
          <div className="bg-white rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 cursor-pointer hover:-translate-y-1 transition-transform border border-gray-100 shadow-xs group">
            <div className="flex-1 text-center sm:text-left space-y-1">
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest leading-none">Обнови Девайс</span>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 font-display pt-1">Трейд-Ин программа</h3>
              <p className="text-xs text-gray-400 max-w-xs pt-1">Сдай свое старое устройство Apple и получи скидку до 65 000 руб на новое.</p>
              <div className="text-emerald-600 hover:underline pt-2 font-semibold text-xs flex items-center justify-center sm:justify-start gap-1">Рассчитать выгоду <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-all" /></div>
            </div>
            <div className="text-5xl md:text-6xl bg-emerald-50/50 p-4 rounded-2xl w-20 h-20 flex items-center justify-center">📱</div>
          </div>
        </div>
      </section>

      {/* RETAIL OUTSTANDING OFFERS ADVANTAGES */}
      <section className="py-14 bg-white">
        <div className="max-w-[1360px] mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-8 text-center select-none">
          <div className="space-y-2.5">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl mx-auto"><Truck className="w-6 h-6" /></div>
            <h3 className="font-bold text-sm text-gray-900">Экспресс Доставка</h3>
            <p className="text-xs text-gray-400 leading-normal max-w-[160px] mx-auto">Доставим покупки за 1 час по всей территории Москвы.</p>
          </div>
          <div className="space-y-2.5">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl mx-auto"><ShieldCheck className="w-6 h-6" /></div>
            <h3 className="font-bold text-sm text-gray-900">Гарантия Качества</h3>
            <p className="text-xs text-gray-400 leading-normal max-w-[160px] mx-auto">Официальные гарантийные обязательства в течение года.</p>
          </div>
          <div className="space-y-2.5">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl mx-auto"><Award className="w-6 h-6" /></div>
            <h3 className="font-bold text-sm text-gray-900">100% Оригинал</h3>
            <p className="text-xs text-gray-400 leading-normal max-w-[160px] mx-auto">Товары прошли верификацию по серийным номерам.</p>
          </div>
          <div className="space-y-2.5">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-xl mx-auto"><RotateCcw className="w-6 h-6" /></div>
            <h3 className="font-bold text-sm text-gray-900">Простой Обмен</h3>
            <p className="text-xs text-gray-400 leading-normal max-w-[160px] mx-auto">Предоставляем легкий возврат/обмен 14 дней.</p>
          </div>
        </div>
      </section>

      {/* FOOTER BLOCK CONFIG SECTION */}
      <footer className="bg-[#F8FAFB] text-[#6A737F] text-xs border-t border-[#EDEEF0] mt-auto">
        <div className="max-w-[1320px] mx-auto px-6 py-12 border-b border-[#EDEEF0] grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 text-left">
            <h3 className="font-display font-extrabold text-[#333333] text-lg tracking-tight flex items-center gap-1.5 cursor-default select-none">I:Bro</h3>
            <p className="text-[12px] text-[#828B95] leading-relaxed">
              Ваш премиальный гид по новинкам оригинальных девайсов Apple, Samsung и Dyson. Поставки по невероятным розничным условиям цен.
            </p>
          </div>
          <div className="space-y-3 text-left">
            <h4 className="font-bold text-[#333333] text-[13px] tracking-wider uppercase">Каталог</h4>
            <ul className="space-y-2 text-[12px]">
              {CATEGORIES.slice(1, 6).map(c => (
                <li key={c.id}>
                  <button 
                    onClick={() => {
                      handleSelectCategory(c.id);
                      setSelectedSubcat(null);
                    }} 
                    className="hover:text-black transition-colors"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3 text-left">
            <h4 className="font-bold text-[#333333] text-[13px] tracking-wider uppercase">Услуги</h4>
            <ul className="space-y-2 text-[12px]">
              <li><span className="hover:text-black transition-colors cursor-pointer">Трейд-Ин девайсов</span></li>
              <li><span className="hover:text-black transition-colors cursor-pointer">Карты лояльности I:Bro</span></li>
              <li><span className="hover:text-black transition-colors cursor-pointer">Доставка и оплата</span></li>
              <li><span className="hover:text-black transition-colors cursor-pointer">Гарантийный сервис</span></li>
            </ul>
          </div>
          <div className="space-y-4 text-left">
            <h4 className="font-bold text-[#333333] text-[13px] tracking-wider uppercase">Контакты</h4>
            <div className="space-y-2.5 text-[12px] leading-relaxed">
              <span className="flex items-start gap-2 text-[#6A737F]">
                <MapPin className="w-4 h-4 text-[#828B95] flex-shrink-0 mt-0.5" />
                <span>{shopOptions.address}</span>
              </span>
              <span className="flex items-center gap-2 text-[#6A737F]">
                <Phone className="w-4 h-4 text-[#828B95]" />
                <span>{shopOptions.phone}</span>
              </span>
              <span className="flex items-center gap-2 text-black font-semibold">
                <Mail className="w-4 h-4 text-[#828B95]" />
                <span>Менеджер: {shopOptions.telegramAdmin}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="max-w-[1320px] mx-auto px-6 py-6 text-center text-[#828B95] flex flex-col md:flex-row items-center justify-between gap-4 text-[11px]">
          <div>&copy; {new Date().getFullYear()} I:Bro. Все права защищены. Цены указаны для ознакомления, не является публичной офертой.</div>
          <div className="flex gap-4">
            <span className="hover:underline hover:text-black cursor-pointer">Политика безопасности</span>
            <span className="hover:underline hover:text-black cursor-pointer">Пользовательское соглашение</span>
          </div>
        </div>
      </footer>

      {/* DRAWER INTERACTION: CART SLIDE_OUT OVERLAY FROM CLIENT STATE */}
      <AnimatePresence>
        {cartOpen && (
          <>
            {/* Background Backdrop Overlay Screen */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            {/* Sliding Drawer sidebar precisely matching .drawer.open */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-white z-50 shadow-2xl flex flex-col justify-between select-none"
            >
              {/* Drawer Header details */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h3 className="font-extrabold text-[#1D1D1F] text-base font-display">Корзина покупок</h3>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">{cart.length} товаров на выбор</p>
                </div>
                <button 
                  onClick={() => setCartOpen(false)}
                  className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items scroll area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-20">
                    <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h4 className="font-bold text-gray-400 text-sm">Ваша корзина пока пуста</h4>
                    <p className="text-xs text-gray-400 mt-1">Добавьте оригинальные товары Apple в корзину для быстрого заказа!</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={`${item.productId}-${item.color}-${item.storage}`} className="flex gap-3 justify-between items-start pb-4 border-b border-gray-100 last-of-type:border-b-0">
                      <div className="w-16 h-16 bg-[#F5F5F7] rounded-xl flex items-center justify-center p-2 flex-shrink-0 border border-gray-100">
                        <img src={item.image} alt={item.name} className="h-full object-contain" onError={handleImageError} />
                      </div>
                      <div className="flex-1 min-w-0 pr-1 select-none">
                        <h4 className="font-bold text-xs md:text-sm text-gray-900 leading-tight truncate">{item.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] bg-gray-100 text-gray-500 font-extrabold px-1.5 py-0.5 rounded uppercase">{item.color}</span>
                          {item.storage > 0 && (
                            <span className="text-[10px] bg-gray-100 text-gray-500 font-extrabold px-1.5 py-0.5 rounded">{item.storage >= 1000 ? `${item.storage/1000} TB` : `${item.storage} GB`}</span>
                          )}
                        </div>
                        <div className="flex justify-between items-end mt-2">
                          <span className="font-extrabold text-xs md:text-sm text-gray-900">{(item.price * item.count).toLocaleString('ru-RU')} ₽</span>
                          
                          {/* Delta count controllers plus/minus */}
                          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 select-none gap-2">
                            <button 
                              onClick={() => updateCartQty(item.productId, item.color, -1)}
                              className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-dark transition-colors rounded hover:bg-white"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-gray-900 w-4 text-center">{item.count}</span>
                            <button 
                              onClick={() => updateCartQty(item.productId, item.color, 1)}
                              className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-dark transition-colors rounded hover:bg-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.productId, item.color)}
                        className="text-gray-300 hover:text-[#FF3B30] p-1 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom total layout & checkout button representation */}
              {cart.length > 0 && (
                <div className="p-5 border-t border-gray-100 bg-gray-50 space-y-3 rounded-t-3xl shadow-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500">Итого в корзине:</span>
                    <span className="font-extrabold text-base text-gray-900">{cartTotalPrice.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="flex gap-2 pt-1.5">
                    <button 
                      onClick={() => {
                        setCheckoutOpen(true);
                        setCartOpen(false);
                      }}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Оформить без онлайн оплаты <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PRODUCT DETAILS DETAIL MODAL (Matching openModal parameters precisely) */}
      <AnimatePresence>
        {selectedProductDetails && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProductDetails(null)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed left-5 right-5 top-5 bottom-5 md:top-1/2 md:bottom-auto md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[780px] md:max-h-[90vh] bg-white z-50 rounded-3xl shadow-2xl overflow-y-auto flex flex-col justify-between"
            >
              {/* Header section with closing button cross popup details */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 cursor-default select-none">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                    {selectedProductDetails.cat} · {selectedProductDetails.brand}
                  </span>
                  <h3 className="font-extrabold text-gray-900 text-sm md:text-base leading-tight mt-0.5 pr-2">
                    {selectedSubcat || extractModel(selectedProductDetails.name)}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedProductDetails(null)}
                  className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main content columns detail specifications grid */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Variant image picker */}
                <div className="flex flex-col justify-center items-center select-none">
                  <div className="relative w-full aspect-square bg-[#F5F5F7] rounded-3xl p-6 flex items-center justify-center border border-gray-100 shadow-inner">
                    <img 
                      src={activeDetailColor?.image || selectedProductDetails.image} 
                      alt="" 
                      className="h-full max-h-[220px] object-contain drop-shadow-xl hover:scale-105 transition-all duration-300"
                    />
                  </div>
                  {/* Gallery thumbnails mapping optionally */}
                  {selectedProductDetails.gallery && selectedProductDetails.gallery.length > 0 && (
                    <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-none w-full justify-center">
                      <img 
                        src={selectedProductDetails.image}
                        className="w-10 h-10 rounded-lg p-1 bg-[#F5F5F7] hover:border-blue-500 border cursor-pointer object-contain"
                        alt=""
                        onClick={() => triggerToast('Загружено основное фото', 'info')}
                      />
                      {selectedProductDetails.gallery.slice(0, 4).map((img, index) => (
                        <img 
                          key={index}
                          src={img}
                          className="w-10 h-10 rounded-lg p-1 bg-[#F5F5F7] hover:border-blue-500 border cursor-pointer object-contain"
                          alt=""
                          onClick={() => triggerToast(`Изображение галлереи #${index+1}`, 'info')}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Details list features */}
                <div className="space-y-5">
                  
                  {/* Price display option */}
                  <div className="space-y-1">
                    <div className="flex items-end gap-2">
                      <span className="font-extrabold text-xl md:text-2xl text-gray-900">
                        {selectedProductDetails.price.toLocaleString('ru-RU')} ₽
                      </span>
                      {selectedProductDetails.oldPrice && (
                        <span className="text-gray-400 text-xs md:text-sm line-through pb-1">
                          {selectedProductDetails.oldPrice.toLocaleString('ru-RU')} ₽
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#34C759] font-extrabold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> В наличии. Официальная годовая гарантия.
                    </p>
                  </div>

                  {/* Colors selector trigger buttons */}
                  {selectedProductDetails.colors && selectedProductDetails.colors.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs select-none">
                        <span className="font-bold text-gray-400 uppercase tracking-wider text-[11px]">Выбор цвета</span>
                        <span className="font-bold text-blue-600 uppercase tracking-tight text-[11px]">{activeDetailColor?.n}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {selectedProductDetails.colors.map((c, idx) => (
                          <button
                            key={`${c.n}-${idx}`}
                            onClick={() => {
                              setActiveDetailColorIndex(idx);
                              triggerToast(`Выбран цвет ${c.n}`, 'info');
                            }}
                            className={`w-7.5 h-7.5 rounded-full border-2 border-white shadow-xs cursor-pointer ring-1 transition-all ${
                              idx === activeDetailColorIndex ? 'ring-2 ring-blue-600 ring-offset-2' : 'ring-gray-200 hover:ring-blue-600'
                            }`}
                            style={{ backgroundColor: c.c }}
                            title={c.n}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Internal descriptive text options */}
                  <div className="space-y-1 text-xs text-gray-500 leading-relaxed max-height-32 overflow-y-auto pr-1 border-t border-gray-100 pt-3">
                    <span className="font-bold text-gray-400 uppercase tracking-wider text-[11px] block select-none">Описание</span>
                    <p className="pt-0.5">{selectedProductDetails.desc || 'Оригинальный ультимативный флагман. Оснащен мощным фирменным процессором и превосходным дисплеем Liquid Retina.'}</p>
                  </div>

                  {/* Hard specifications grid mapping keys */}
                  {selectedProductDetails.specs && selectedProductDetails.specs.length > 0 && (
                    <div className="space-y-1.5 pt-3 border-t border-gray-100">
                      <span className="font-bold text-gray-400 uppercase tracking-wider text-[11px] block select-none mb-1">Характеристики</span>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] bg-gray-50 p-3.5 rounded-2xl border border-gray-200/50">
                        {selectedProductDetails.specs.map((item, keyIndex) => {
                          const tag = Object.keys(item)[0];
                          const val = Object.values(item)[0];
                          return (
                            <React.Fragment key={keyIndex}>
                              <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px] truncate">{tag}</span>
                              <span className="text-gray-700 font-semibold truncate text-right">{val}</span>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Modal controls bar */}
              <div className="p-5 border-t border-gray-100 bg-[#F5F5F7] flex flex-col sm:flex-row gap-2 justify-between items-center rounded-b-3xl">
                <span className="text-xxs text-gray-400 max-w-xs text-center sm:text-left leading-normal">При оформлении заказа менеджер свяжется с вами для конечного подтверждения параметров и способа доставки.</span>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => {
                      addToCart(selectedProductDetails, activeDetailColor?.n);
                      setSelectedProductDetails(null);
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    В корзину и закрыть
                  </button>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CHECKOUT POPUP FORM DIRECT MODAL (Form onSubmit send, checkout elements details) */}
      <AnimatePresence>
        {checkoutOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setCheckoutOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed left-5 right-5 top-5 bottom-5 md:top-1/2 md:bottom-auto md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] md:max-h-[92vh] bg-white z-50 rounded-3xl shadow-2xl overflow-y-auto flex flex-col justify-between"
            >
              {/* Checkout header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 cursor-default">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base font-display">Оформление заказа</h3>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">Без онлайн-оплаты, подтверждение через менеджера</p>
                </div>
                <button 
                  onClick={() => setCheckoutOpen(false)}
                  className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form entries for direct order registration */}
              <form onSubmit={handleSendCheckout} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
                
                {/* Checkout item mini indicators summary list */}
                <div className="bg-gray-50 p-4 border border-gray-200/50 rounded-2xl select-none mb-4">
                  <div className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider mb-2">Получаемые товары ({cart.length})</div>
                  <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
                    {cart.map(item => (
                      <div key={`${item.productId}-${item.color}-${item.storage}`} className="text-xs text-gray-700 flex justify-between items-center">
                        <span className="truncate pr-2 font-semibold">• {item.name} ({item.color})</span>
                        <span className="font-extrabold text-blue-600 whitespace-nowrap">{item.count} шт. × {item.price.toLocaleString('ru-RU')} ₽</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200/50 mt-3 pt-3 flex justify-between items-center text-sm">
                    <span className="font-extrabold text-gray-900">Общая сумма:</span>
                    <span className="font-extrabold text-gray-950 text-base">{cartTotalPrice.toLocaleString('ru-RU')} ₽</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Имя и фамилия *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Иван Иванов"
                      value={checkoutForm.fio}
                      onChange={e => setCheckoutForm({ ...checkoutForm, fio: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Номер телефона *</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="+7 (900) 123-45-67"
                      value={checkoutForm.phone}
                      onChange={e => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 text-gray-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">E-mail (необязательно)</label>
                    <input 
                      type="email" 
                      placeholder="user@gmail.com"
                      value={checkoutForm.email}
                      onChange={e => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Город назначения</label>
                    <input 
                      type="text" 
                      value={checkoutForm.city}
                      onChange={e => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Адрес доставки</label>
                    <input 
                      type="text" 
                      placeholder="Улица, дом, квартира"
                      value={checkoutForm.address}
                      onChange={e => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Выбор способа оплаты</label>
                    <select 
                      value={checkoutForm.payment}
                      onChange={e => setCheckoutForm({ ...checkoutForm, payment: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs outline-none text-gray-800"
                    >
                      <option value="Оплата наличными">Оплата наличными при получении курьеру</option>
                      <option value="Безналичный расчет">Безналичный расчет переводом (СБП)</option>
                      <option value="Оплата по карте">Оплата по карте на месте встречи</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Комментарий к вашему заказу</label>
                    <textarea 
                      placeholder="Любые пожелания или уточнения..."
                      value={checkoutForm.comment}
                      onChange={e => setCheckoutForm({ ...checkoutForm, comment: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-800"
                    />
                  </div>
                </div>

                {/* Confirm send triggers action */}
                <div className="pt-4 flex justify-end gap-2 text-xs">
                  <button 
                    type="submit"
                    disabled={isOrdering}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isOrdering ? 'Оформление в CRM...' : 'Подтвердить заказ'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 1-CLICK CHECKOUT MODAL POPUP */}
      <AnimatePresence>
        {oneClickOpen && oneClickProduct && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setOneClickOpen(false)}
              className="fixed inset-0 bg-black/60 z-55 cursor-pointer"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed left-5 right-5 top-1/2 bottom-auto -translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:w-[480px] bg-white z-55 rounded-3xl shadow-2xl p-6 flex flex-col justify-between overflow-hidden"
              style={{ zIndex: 9999 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4 select-none">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm md:text-base font-display">Купить в 1 клик</h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase tracking-wide">Быстрый заказ без лишних полей</p>
                </div>
                <button 
                  onClick={() => setOneClickOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Product preview and pricing */}
              <div className="flex items-center gap-4 bg-[#F5F5F7] p-3 rounded-2xl mb-4 select-none">
                <img 
                  src={oneClickProduct.image} 
                  alt="" 
                  className="w-14 h-14 object-contain"
                  onError={handleImageError}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-xs text-gray-900 truncate leading-tight">{oneClickProduct.name}</h4>
                  <div className="flex items-center gap-2 mt-1 font-bold text-[10px] text-gray-400">
                    <span className="capitalize">Цвет: {oneClickColor}</span>
                    <span>•</span>
                    <span>Память: {oneClickStorage >= 1000 ? `${(oneClickStorage/1000).toFixed(0)} TB` : `${oneClickStorage} GB`}</span>
                  </div>
                  <div className="text-xs font-extrabold text-blue-600 mt-0.5">
                    Цена: {oneClickProduct.price.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              </div>

              {/* Form elements */}
              <form onSubmit={handleOneClickCheckoutSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Ваше Имя *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Алексей"
                    value={oneClickForm.name}
                    onChange={e => setOneClickForm({ ...oneClickForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Номер телефона *</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="+7 (999) 999-99-99"
                    value={oneClickForm.phone}
                    onChange={e => setOneClickForm({ ...oneClickForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Комментарий к заказу</label>
                  <textarea 
                    placeholder="Удобное время для звонка, адрес..."
                    rows={2}
                    value={oneClickForm.comment}
                    onChange={e => setOneClickForm({ ...oneClickForm, comment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={isSubmittingOneClick}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    {isSubmittingOneClick ? 'Оформление быстрого заказа...' : `Заказать в 1 клик · ${oneClickProduct.price.toLocaleString('ru-RU')} ₽`}
                  </button>
                  <p className="text-[9px] text-gray-400 text-center mt-2 leading-tight">
                    Отправляя форму, вы подтверждаете согласие на обработку персональных данных. Менеджер позвонит для урегулирования доставки.
                  </p>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MOBILE COLLAPSIBLE DRAWER SCREEN */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="fixed left-0 top-0 h-full w-[290px] bg-white z-50 shadow-2xl flex flex-col justify-between select-none lg:hidden"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <span className="font-extrabold text-gray-900 tracking-tight text-base font-display">I:Bro Каталог</span>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      handleSelectCategory(cat.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-xs font-semibold rounded-xl transition-all ${
                      selectedCategory.toLowerCase() === cat.id.toLowerCase() 
                        ? 'bg-blue-50 text-blue-600 font-extrabold border-l-4 border-blue-600' 
                        : 'text-gray-600 hover:bg-[#F5F5F7] hover:text-gray-950'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
                <hr className="my-4 border-gray-100" />
                <button
                  onClick={() => {
                    handleSelectCategory('all');
                    setOnlyDiscount(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-xs font-extrabold text-[#FF3B30] hover:bg-red-50 rounded-xl transition-all"
                >
                  🔥 Горячие предложения (Sale)
                </button>
              </div>
              <div className="p-5 border-t border-gray-100 bg-gray-50 text-[10px] text-gray-400 space-y-1">
                <div className="font-semibold text-gray-900">Контакты I:Bro</div>
                <div>Телефон: {shopOptions.phone}</div>
                <div>Адрес: {shopOptions.address}</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

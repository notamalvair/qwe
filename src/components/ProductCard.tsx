import React, { useState, useMemo } from 'react';
import { Heart, Check, Zap, ShieldCheck } from 'lucide-react';

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

interface ProductCardProps {
  key?: React.Key | null | undefined;
  prod: Product;
  allProducts: Product[];
  favorites: number[];
  cart: any[];
  toggleFavorite: (id: number) => void;
  addToCart: (product: Product, colorName?: string, storageValue?: number) => void;
  openProductDetails: (product: Product) => void;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onOneClickCheckout: (product: Product, colorName: string, storageValue: number) => void;
  viewMode?: 'grid' | 'list';
}

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

export default function ProductCard({
  prod,
  allProducts,
  favorites,
  cart,
  toggleFavorite,
  addToCart,
  openProductDetails,
  handleImageError,
  onOneClickCheckout,
  viewMode = 'grid'
}: ProductCardProps) {
  // Find current core model base name
  const modelBaseName = useMemo(() => extractModel(prod.name), [prod.name]);

  // Find other sibling products with matching base model
  const siblings = useMemo(() => {
    return allProducts.filter(p => extractModel(p.name) === modelBaseName);
  }, [allProducts, modelBaseName]);

  // Find all available unique storages in siblings
  const availableStorages = useMemo(() => {
    const storages = siblings.map(s => s.storage).filter(Boolean);
    return Array.from(new Set(storages)).sort((a: any, b: any) => Number(a) - Number(b));
  }, [siblings]);

  // Find current active storage quantity. If none present, use current
  const [selectedStorage, setSelectedStorage] = useState<number>(prod.storage || 256);

  // Filter components by storage sibling
  const activeStorageSiblings = useMemo(() => {
    const list = siblings.filter(s => s.storage === selectedStorage);
    return list.length > 0 ? list : [prod];
  }, [siblings, selectedStorage, prod]);

  // Inside selected storage, manage the active product state configuration
  const activeProduct = useMemo(() => {
    const match = activeStorageSiblings.find(s => s.storage === selectedStorage) || activeStorageSiblings[0] || prod;
    return match;
  }, [activeStorageSiblings, selectedStorage, prod]);

  // Color selection swatches of the active variant
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0);

  const activeColor = useMemo(() => {
    if (activeProduct.colors && activeProduct.colors.length > 0) {
      const index = Math.min(selectedColorIndex, activeProduct.colors.length - 1);
      return activeProduct.colors[index];
    }
    return null;
  }, [activeProduct.colors, selectedColorIndex]);

  // Reset color index dynamically when active product variant shifts to avoid overflow errors
  React.useEffect(() => {
    setSelectedColorIndex(0);
  }, [activeProduct.id]);

  const hasDiscount = activeProduct.oldPrice && activeProduct.oldPrice > activeProduct.price;
  const discountPercent = hasDiscount && activeProduct.oldPrice 
    ? Math.round(((activeProduct.oldPrice - activeProduct.price) / activeProduct.oldPrice) * 100) 
    : 0;

  // Check if active item is already in cart
  const cartItemCount = useMemo(() => {
    const colorName = activeColor?.n || 'Standard';
    const match = cart.find(item => item.productId === activeProduct.id && item.color === colorName);
    return match ? match.count : 0;
  }, [cart, activeProduct.id, activeColor]);

  const activeImage = activeColor?.image && !activeColor.image.startsWith('data:') 
    ? activeColor.image 
    : activeProduct.image;

  // Render for both grid/list mode with exact premium styling specifications
  if (viewMode === 'list') {
    return (
      <div 
        onClick={() => openProductDetails(activeProduct)}
        className="catalog-card bg-white rounded-[2px] border border-[#EDEEF0] transition-all duration-250 p-3 flex gap-4 items-center cursor-pointer group hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-[1px] ease-in-out"
      >
        {/* __img Area */}
        <div className="relative w-24 h-24 bg-white flex items-center justify-center p-2 flex-shrink-0 select-none">
          <img 
            src={activeImage} 
            alt={activeProduct.name} 
            className="h-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
            onError={handleImageError}
          />
          {activeProduct.badge && (
            <span className={`absolute top-0 left-0 text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] text-white tracking-wider ${
              activeProduct.badge === 'Новинка' ? 'bg-[#29AD49]' : 'bg-[#EF6C00]'
            }`}>
              {activeProduct.badge}
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            {/* __info */}
            <h3 className="text-[13px] font-medium text-[#333333] line-clamp-2 leading-snug">
              {activeProduct.name}
            </h3>

            {/* Storage options */}
            {availableStorages.length > 1 && (
              <div className="flex flex-wrap gap-1 pt-1" onClick={e => e.stopPropagation()}>
                {availableStorages.map(st => (
                  <button
                    key={st}
                    onClick={() => setSelectedStorage(st)}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded-[2px] border transition-all cursor-pointer ${
                      selectedStorage === st 
                        ? 'bg-[#333333] text-white border-[#333333]' 
                        : 'bg-white text-[#6A737F] border-[#EDEEF0] hover:border-gray-400'
                    }`}
                  >
                    {st >= 1000 ? `${(st/1000).toFixed(0)} TB` : `${st} GB`}
                  </button>
                ))}
              </div>
            )}

            {/* Colors Swatches inside listing */}
            {activeProduct.colors && activeProduct.colors.length > 1 && (
              <div className="flex items-center gap-1.5 pt-1" onClick={e => e.stopPropagation()}>
                {activeProduct.colors.map((c, idx) => {
                  const isWhiteIsh = c.c.toLowerCase() === '#ffffff' || c.c.toLowerCase() === '#fff' || c.c.toLowerCase() === '#f5f5f7';
                  return (
                    <button
                      key={`${c.n}-${idx}`}
                      onClick={() => setSelectedColorIndex(idx)}
                      className={`w-6 h-6 rounded-full border transition-all relative cursor-pointer ${
                        selectedColorIndex === idx 
                          ? 'ring-[2px] ring-black border-transparent scale-105' 
                          : isWhiteIsh ? 'border-[#C5CACF]' : 'border-[#EDEEF0] hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: c.c }}
                      title={c.n}
                    />
                  );
                })}
              </div>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOneClickCheckout(activeProduct, activeColor?.n || 'Standard', selectedStorage);
              }}
              className="text-[#2066B0] text-[11px] font-semibold hover:underline block pt-1 cursor-pointer border-b border-dashed border-[#2066B0]/40 hover:border-transparent w-max"
            >
              Купить в 1 клик
            </button>
          </div>

          {/* __bottom section */}
          <div className="flex flex-col items-start md:items-end justify-between mt-2 md:mt-0 gap-3 flex-shrink-0 pl-0 md:pl-4 border-l border-transparent md:border-[#EDEEF0]">
            <div className="text-left md:text-right">
              <div className="text-[16px] font-bold text-[#000000] leading-none">
                {activeProduct.price.toLocaleString('ru-RU')} ₽
              </div>
              {hasDiscount && (
                <div className="flex items-center gap-1.5 mt-1 justify-start md:justify-end">
                  <span className="text-[12px] text-[#828B95] line-through">
                    {activeProduct.oldPrice?.toLocaleString('ru-RU')} ₽
                  </span>
                  <span className="text-[10px] text-white bg-[#F0371B] px-1 py-0.5 rounded-[2px] font-bold leading-none">
                    -{discountPercent}%
                  </span>
                </div>
              )}
            </div>

            <div onClick={e => e.stopPropagation()}>
              <button
                onClick={() => addToCart(activeProduct, activeColor?.n)}
                className={`py-[6px] px-[16px] rounded-[2px] text-[12px] font-semibold transition-all duration-200 cursor-pointer ${
                  cartItemCount > 0 
                    ? 'bg-[#29AD49] text-white hover:bg-[#208a39]' 
                    : 'bg-[#000000] text-white hover:bg-[#333333]'
                }`}
              >
                {cartItemCount > 0 ? (
                  <span className="flex items-center gap-1 leading-none">
                    <Check className="w-3.5 h-3.5" /> В корзине
                  </span>
                ) : (
                  'Купить'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // HIGHEST FIDELITY i-shop.ru GRID CARD LAYOUT
  return (
    <div 
      onClick={() => openProductDetails(activeProduct)}
      className="catalog-card bg-white rounded-[2px] border border-[#EDEEF0] transition-all duration-250 flex flex-col cursor-pointer overflow-hidden p-3 group select-none relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-[1px] ease-in-out"
    >
      
      {/* __actions inside card */}
      <div className="flex items-center justify-between z-10 w-full mb-1 absolute top-3 left-3 right-3 pr-6">
        {/* Badges in top-left */}
        <div>
          {activeProduct.badge && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] text-white tracking-wider ${
              activeProduct.badge === 'Новинка' ? 'bg-[#29AD49]' : 'bg-[#EF6C00]'
            }`}>
              {activeProduct.badge}
            </span>
          )}
        </div>

        {/* Favorite icon on top right corner */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(activeProduct.id);
          }}
          className="w-7 h-7 rounded-full bg-white/90 shadow-2xs flex items-center justify-center text-[#6A737F] hover:text-[#F0371B] transition-colors cursor-pointer absolute right-0"
        >
          <Heart className={`w-[15px] h-[15px] ${favorites.includes(activeProduct.id) ? 'fill-[#F0371B] text-[#F0371B]' : 'text-[#6A737F]'}`} />
        </button>
      </div>

      {/* __img Area */}
      <div className="relative aspect-square bg-white flex items-center justify-center p-2 mb-2 overflow-hidden mt-6">
        <img 
          src={activeImage} 
          alt={activeProduct.name} 
          className="h-full max-h-[160px] object-contain group-hover:scale-[1.03] transition-transform duration-300 ease-in-out"
          onError={handleImageError}
        />
      </div>

      {/* __info AND parameters */}
      <div className="flex-1 flex flex-col justify-between pt-1">
        
        <div className="space-y-2">
          {/* Main title: 13px, #333333, line-clamp-2, medium font */}
          <h3 className="text-[13px] font-medium text-[#333333] line-clamp-2 min-h-[2.6em] leading-snug">
            {activeProduct.name}
          </h3>

          {/* Sibling Capacities Option Selector - Clean minimalist i-shop chips */}
          {availableStorages.length > 1 && (
            <div className="flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
              {availableStorages.map(st => (
                <button
                  key={st}
                  onClick={() => setSelectedStorage(st)}
                  className={`px-1.5 py-0.5 text-[11px] font-medium rounded-[2px] border transition-all cursor-pointer ${
                    selectedStorage === st 
                      ? 'bg-[#333333] text-white border-[#333333]' 
                      : 'bg-white text-[#6A737F] border-[#EDEEF0] hover:border-gray-400'
                  }`}
                >
                  {st >= 1000 ? `${(st/1000).toFixed(0)} TB` : `${st} GB`}
                </button>
              ))}
            </div>
          )}

          {/* Color swatches with borders */}
          {activeProduct.colors && activeProduct.colors.length > 1 && (
            <div className="flex flex-wrap gap-1 pt-0.5" onClick={e => e.stopPropagation()}>
              {activeProduct.colors.map((c, idx) => {
                const isWhiteIsh = c.c.toLowerCase() === '#ffffff' || c.c.toLowerCase() === '#fff' || c.c.toLowerCase() === '#f5f5f7';
                return (
                  <button
                    key={`${c.n}-${idx}`}
                    onClick={() => setSelectedColorIndex(idx)}
                    className={`w-6 h-6 rounded-full border transition-all relative cursor-pointer ${
                      selectedColorIndex === idx 
                        ? 'ring-[2px] ring-black border-transparent scale-105' 
                        : isWhiteIsh ? 'border-[#C5CACF]' : 'border-[#EDEEF0] hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: c.c }}
                    title={c.n}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* __bottom: PRICING AND BUY BUTTON */}
        <div className="pt-3 mt-auto border-t border-transparent">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[16px] font-bold text-[#000000] leading-none">
                {activeProduct.price.toLocaleString('ru-RU')} ₽
              </span>
              {hasDiscount && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[12px] text-[#828B95] line-through leading-none">
                    {activeProduct.oldPrice?.toLocaleString('ru-RU')} ₽
                  </span>
                  <span className="text-[10px] text-white bg-[#F0371B] px-1 py-0.5 rounded-[2px] font-bold leading-none">
                    -{discountPercent}%
                  </span>
                </div>
              )}
            </div>

            <div onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => addToCart(activeProduct, activeColor?.n)}
                className={`py-[6px] px-[16px] rounded-[2px] text-[12px] font-semibold transition-all duration-200 cursor-pointer ${
                  cartItemCount > 0 
                    ? 'bg-[#29AD49] text-white hover:bg-[#208a39]' 
                    : 'bg-[#000000] text-white hover:bg-[#333333]'
                }`}
              >
                {cartItemCount > 0 ? (
                  <span className="flex items-center gap-1 leading-none">
                    <Check className="w-3.5 h-3.5" /> В корзине
                  </span>
                ) : (
                  'Купить'
                )}
              </button>
            </div>
          </div>

          {/* Dotted underline minimalist link to trigger "1 click checkout" right below purchase row */}
          <div className="text-center pt-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onOneClickCheckout(activeProduct, activeColor?.n || 'Standard', selectedStorage)}
              className="text-[#2066B0] text-[11px] font-semibold hover:underline inline-block border-b border-dashed border-[#2066B0]/40 hover:border-transparent cursor-pointer"
            >
              Купить в 1 клик
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

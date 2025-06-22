import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

const DEFAULT_IMAGE = 'https://via.placeholder.com/300x300?text=Нет+фото';

// Функция для проверки истечения срока годности
const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return null;
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { status: 'expired', text: 'Истек', color: 'red' };
  } else if (diffDays <= 7) {
    return { status: 'expiring-soon', text: `${diffDays} дн.`, color: 'orange' };
  }
  
  return null; // Не показываем для товаров с нормальным сроком годности
};

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const [imageError, setImageError] = useState(false);

  // Форматирование цены
  const formatPrice = (price) => {
    return `${price.toLocaleString('ru-RU')} ₽`;
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Функция для проверки и форматирования URL изображения
  const getImageUrl = () => {
    if (imageError) return DEFAULT_IMAGE;
    
    // Проверяем, есть ли URL изображения и начинается ли он с http
    if (!product.imageUrl) return DEFAULT_IMAGE;
    
    // Если URL начинается с @, значит это внешняя ссылка (убираем @ в начале)
    if (product.imageUrl.startsWith('@')) {
      return product.imageUrl.substring(1);
    }
    
    return product.imageUrl;
  };

  const isNew = product.createdAt && new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const hasDiscount = product.price < product.originalPrice;

  return (
    <Link 
      to={`/products/${product.id}`} 
      className="card group hover-shadow transform transition-all duration-300 hover:-translate-y-2"
    >
      {/* Картинка товара */}
      <div className="relative overflow-hidden bg-gray-100 aspect-square">
        <img 
          src={getImageUrl()} 
          alt={product.name} 
          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
          onError={handleImageError}
        />
        
        {/* Бэйджи */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {isNew && (
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              Новинка
            </span>
          )}
          
          {hasDiscount && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              Скидка {Math.round(100 - (product.price * 100 / product.originalPrice))}%
            </span>
          )}
          
          {product.inStock === 0 && (
            <span className="bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded-full">
              Нет в наличии
            </span>
          )}
          
          {/* Бейдж срока годности */}
          {(() => {
            const expiryStatus = getExpiryStatus(product.expiryDate);
            if (!expiryStatus) return null;
            
            const colorClasses = {
              red: 'bg-red-500 text-white',
              orange: 'bg-orange-500 text-white'
            };
            
            return (
              <span className={`${colorClasses[expiryStatus.color]} text-xs font-bold px-2 py-1 rounded-full`}>
                {expiryStatus.text}
              </span>
            );
          })()}
        </div>
        
        {/* Кнопка быстрого добавления в корзину */}
        <button
          onClick={handleAddToCart}
          disabled={product.inStock === 0}
          className={`absolute bottom-4 right-4 w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 transform 
            ${product.inStock === 0 
              ? 'bg-gray-400 cursor-not-allowed opacity-50' 
              : 'bg-pink-600 hover:bg-pink-700 hover:scale-110 text-white'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        </button>
      </div>
      
      {/* Информация о товаре */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-gray-800 font-medium text-lg line-clamp-2 group-hover:text-pink-600 transition-colors">
            {product.name}
          </h3>
        </div>
        
        <p className="text-gray-500 text-sm line-clamp-2 mb-3 h-10">
          {product.description}
        </p>

        <div className="flex justify-between items-center mt-auto">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-gray-500 text-sm line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            <span className="text-pink-600 font-bold">
              {formatPrice(product.price)}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
            </svg>
            {product.rating || '4.5'}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard; 
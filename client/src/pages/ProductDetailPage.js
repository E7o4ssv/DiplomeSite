import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { fetchWithRetry } from '../utils/apiUtils';

const DEFAULT_IMAGE = 'https://via.placeholder.com/600x400?text=Конфетти';

// Функция для форматирования даты
const formatDate = (dateString) => {
  if (!dateString) return 'Не указан';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  } catch (error) {
    console.error('Ошибка форматирования даты:', error);
    return 'Ошибка даты';
  }
};

// Функция для проверки истечения срока годности
const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return { status: 'no-date', text: 'Не указан', color: 'gray' };
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { status: 'expired', text: 'Истек', color: 'red' };
  } else if (diffDays <= 7) {
    return { status: 'expiring-soon', text: `Истекает через ${diffDays} дн.`, color: 'orange' };
  } else {
    return { status: 'valid', text: `Истекает ${formatDate(expiryDate)}`, color: 'green' };
  }
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        try {
          const data = await fetchWithRetry(`products/${id}`);
          setProduct(data);
          
          // Получаем связанные товары из той же категории
          const relatedData = await fetchWithRetry(`products?category=${data.categoryId}`);
          setRelatedProducts(relatedData.filter(item => item.id !== data.id).slice(0, 3));
        } catch (err) {
          console.error('Ошибка загрузки товара:', err);
          
          let errorMessage = 'Товар не найден или произошла ошибка при загрузке.';
          // Пытаемся извлечь более подробную информацию об ошибке
          try {
            const parsedError = JSON.parse(err.message);
            if (parsedError.data && parsedError.data.error) {
              errorMessage = parsedError.data.error;
            } else if (parsedError.message) {
              errorMessage = parsedError.message;
            }
          } catch (parseError) {
            // Если не удалось распарсить, используем исходное сообщение
            errorMessage = err.message || errorMessage;
          }
          
          setError(errorMessage);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Неожиданная ошибка:', err);
        setError('Произошла непредвиденная ошибка. Пожалуйста, обновите страницу.');
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);
  
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };
  
  const handleAddToCart = () => {
    addToCart(product, quantity);
    navigate('/cart');
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-600">Загрузка товара...</p>
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-100 text-red-700 p-6 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-2">Ошибка</h2>
          <p>{error || 'Товар не найден'}</p>
          <Link to="/products" className="btn btn-primary mt-4 inline-block">
            Вернуться к списку товаров
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Навигационные хлебные крошки */}
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link to="/" className="text-gray-600 hover:text-pink-500">
                Главная
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <Link to="/products" className="ml-1 text-gray-600 hover:text-pink-500 md:ml-2">
                  Каталог
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <Link 
                  to={`/products?category=${product.categoryId}`} 
                  className="ml-1 text-gray-600 hover:text-pink-500 md:ml-2"
                >
                  {product.category?.name || 'Категория'}
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <span className="ml-1 text-gray-500 md:ml-2">{product.name}</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>
      
      {/* Основная информация о товаре */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2">
            <img
              src={product.imageUrl || DEFAULT_IMAGE}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 md:w-1/2">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
            
            {product.category && (
              <div className="mb-4">
                <span className="inline-block bg-pink-100 text-pink-600 px-2 py-1 rounded-full text-sm">
                  {product.category.name}
                </span>
              </div>
            )}
            
            <div className="mb-6">
              <span className="text-3xl font-bold text-gray-800">{product.price.toFixed(2)} ₽</span>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Описание</h2>
              <p className="text-gray-600">
                {product.description || 'Описание товара отсутствует.'}
              </p>
            </div>
            
            {/* Информация о сроке годности */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Срок годности</h2>
              {(() => {
                const status = getExpiryStatus(product.expiryDate);
                const colorClasses = {
                  red: 'bg-red-100 text-red-800 border-red-200',
                  orange: 'bg-orange-100 text-orange-800 border-orange-200',
                  green: 'bg-green-100 text-green-800 border-green-200',
                  gray: 'bg-gray-100 text-gray-800 border-gray-200'
                };
                
                return (
                  <div className={`inline-flex items-center px-3 py-2 rounded-lg border ${colorClasses[status.color]}`}>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{status.text}</span>
                  </div>
                );
              })()}
            </div>
            
            <div className="mb-6">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Количество
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  className="w-10 h-10 rounded-l-md bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-300"
                  onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                >
                  -
                </button>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min="1"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="h-10 w-16 border-gray-300 text-center focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                />
                <button
                  type="button"
                  className="w-10 h-10 rounded-r-md bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-300"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleAddToCart}
                className="btn btn-primary flex-grow py-3"
              >
                Добавить в корзину
              </button>
              <Link to="/products" className="btn btn-secondary py-3">
                Назад к каталогу
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Похожие товары */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Похожие товары</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map(relatedProduct => (
              <div key={relatedProduct.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <Link to={`/products/${relatedProduct.id}`}>
                  <div className="relative pb-[66.666%] overflow-hidden">
                    <img
                      src={relatedProduct.imageUrl || DEFAULT_IMAGE}
                      alt={relatedProduct.name}
                      className="absolute h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/products/${relatedProduct.id}`}>
                    <h3 className="text-lg font-semibold text-gray-800 hover:text-pink-500 transition-colors mb-2">
                      {relatedProduct.name}
                    </h3>
                  </Link>
                  <p className="text-xl font-bold text-gray-800">{relatedProduct.price.toFixed(2)} ₽</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage; 
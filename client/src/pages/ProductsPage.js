import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { fetchWithRetry } from '../utils/apiUtils';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Получение категории из параметров URL
  const categoryId = searchParams.get('category');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Получение категорий с использованием функции с повторами
        try {
          const categoriesData = await fetchWithRetry('categories');
          setCategories(categoriesData);
        } catch (err) {
          console.error('Ошибка загрузки категорий:', err);
          // Продолжаем выполнение, чтобы попытаться загрузить товары
        }
        
        // Получение продуктов с учётом фильтра по категории
        let url = 'products';
        if (categoryId) {
          url += `?category=${categoryId}`;
        }
        
        try {
          const productsData = await fetchWithRetry(url);
          setProducts(productsData);
        } catch (err) {
          console.error('Ошибка загрузки товаров:', err);
          let errorMessage = 'Ошибка загрузки данных. Пожалуйста, попробуйте позже.';
          
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
    
    fetchData();
  }, [categoryId]);
  
  // Обработчик изменения категории
  const handleCategoryChange = (id) => {
    if (id === 'all') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: id });
    }
  };
  
  // Получение имени текущей выбранной категории
  const getCurrentCategoryName = () => {
    if (!categoryId) return 'Все товары';
    const category = categories.find(cat => cat.id === parseInt(categoryId));
    return category ? category.name : 'Все товары';
  };
  
  return (
    <div>
      <section className="bg-gradient-to-r from-pink-100 to-pink-200 rounded-xl overflow-hidden shadow-lg mb-8">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {getCurrentCategoryName()}
          </h1>
        </div>
      </section>
      
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Боковая панель с фильтрами */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Категории</h2>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className={`block w-full text-left py-2 px-3 rounded ${
                      !categoryId ? 'bg-pink-100 text-pink-600' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Все товары
                  </button>
                </li>
                {categories.map(category => (
                  <li key={category.id}>
                    <button
                      onClick={() => handleCategoryChange(category.id)}
                      className={`block w-full text-left py-2 px-3 rounded ${
                        categoryId === category.id.toString() ? 'bg-pink-100 text-pink-600' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Основной контент со списком товаров */}
          <div className="lg:w-3/4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-gray-600">Загрузка товаров...</p>
              </div>
            ) : error ? (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg text-center">
                {error}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <p className="text-gray-700 text-lg">
                  Товаров в данной категории пока нет.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage; 
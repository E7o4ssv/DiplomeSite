import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { fetchWithRetry } from '../utils/apiUtils';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Загружаем категории с помощью fetchWithRetry
        try {
          const categoriesData = await fetchWithRetry('categories');
          setCategories(categoriesData);
        } catch (err) {
          console.error('Ошибка загрузки категорий:', err);
          // Продолжаем выполнение, чтобы попытаться загрузить товары
        }

        // Загружаем товары с помощью fetchWithRetry
        try {
          const productsData = await fetchWithRetry('products');
          setFeaturedProducts(productsData.slice(0, 4));
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
  }, []);

  return (
    <div>
      {/* Баннер */}
      <section className="relative overflow-hidden mb-16">
        <div className="absolute top-0 left-0 w-full h-full bg-sweet-pattern opacity-30"></div>
        <div className="bg-gradient-to-r from-pink-100 via-pink-50 to-white rounded-3xl overflow-hidden shadow-xl relative">
          <div className="container mx-auto px-4 py-20 md:py-28">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-center md:text-left max-w-xl z-10 animate-fade-in">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-6">
                  Добро пожаловать в "Конфетти"
                </h1>
                <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
                  Магазин изысканных кондитерских изделий для любого случая. 
                  Наша миссия – превращать каждый день в праздник!
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <Link
                    to="/products"
                    className="btn btn-primary text-lg px-8 py-3 shadow-md hover:shadow-pink-200/50"
                  >
                    Перейти в каталог
                  </Link>
                  <Link
                    to="/about"
                    className="btn btn-secondary text-lg px-8 py-3"
                  >
                    О компании
                  </Link>
                </div>
              </div>
              <div className="hidden md:block relative mt-8 md:mt-0">
                <img
                  src="https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
                  alt="Ассортимент десертов"
                  className="w-80 h-80 object-cover rounded-full shadow-2xl transform hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute -bottom-4 -right-4 bg-white rounded-full p-4 shadow-lg hover-scale">
                  <span className="text-pink-600 font-bold">-20%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Категории */}
      <section className="mb-20">
        <div className="container mx-auto px-4">
          <h2 className="section-title">
            Категории
          </h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-lg text-gray-600">Загрузка категорий...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="h-40 bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                    <div className="w-24 h-24 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <span className="text-5xl">
                        {/* Эмодзи для категорий */}
                        {index === 0 ? '🍰' : index === 1 ? '🍪' : index === 2 ? '🍫' : '🧁'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {category.name}
                    </h3>
                    <span className="inline-block bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-sm">
                      Смотреть товары
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Популярные товары */}
      <section className="mb-20">
        <div className="container mx-auto px-4">
          <h2 className="section-title">
            Популярные товары
          </h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-lg text-gray-600">Загрузка товаров...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : (
            <>
              <div className="product-card-grid mt-12">
                {featuredProducts.map((product, index) => (
                  <div 
                    key={product.id} 
                    className="animate-fade-in" 
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-12">
                <Link
                  to="/products"
                  className="inline-block btn btn-primary px-8 py-3 shadow-md hover:shadow-pink-200/50"
                >
                  Посмотреть все товары
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Преимущества */}
      <section className="mb-20 py-16 bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl">
        <div className="container mx-auto px-4">
          <h2 className="section-title">
            Почему выбирают нас
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white p-8 rounded-xl shadow-md text-center transform transition-all duration-300 hover:shadow-lg hover:-translate-y-2">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-pink-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Высокое качество</h3>
              <p className="text-gray-600">
                Мы используем только натуральные ингредиенты высочайшего качества. Без консервантов и красителей.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md text-center transform transition-all duration-300 hover:shadow-lg hover:-translate-y-2">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-pink-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Оперативная доставка</h3>
              <p className="text-gray-600">
                Доставим ваш заказ в кратчайшие сроки в удобное для вас время по всему городу.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md text-center transform transition-all duration-300 hover:shadow-lg hover:-translate-y-2">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-pink-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Широкий ассортимент</h3>
              <p className="text-gray-600">
                В нашем каталоге представлены сотни наименований на любой вкус и для любого праздника.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Отзывы клиентов */}
      <section className="mb-20">
        <div className="container mx-auto px-4">
          <h2 className="section-title">
            Отзывы наших клиентов
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            <div className="bg-white p-6 rounded-xl shadow-md relative">
              <div className="absolute -top-5 left-6">
                <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
              </div>
              <div className="mb-4 mt-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 italic mb-4">
                "Заказывала торт на день рождения дочери. Все были в восторге! Очень красивый и вкусный. Доставка точно в срок."
              </p>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                    <span className="text-pink-700 font-semibold">АК</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Анна Ковалева</h4>
                  <p className="text-sm text-gray-500">г. Москва</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md relative">
              <div className="absolute -top-5 left-6">
                <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
              </div>
              <div className="mb-4 mt-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 italic mb-4">
                "Регулярно заказываю сладости для офиса. Коллеги очень довольны. Особенно нравятся эклеры и пирожные. Рекомендую!"
              </p>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                    <span className="text-pink-700 font-semibold">МС</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Михаил Соколов</h4>
                  <p className="text-sm text-gray-500">г. Москва</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md relative">
              <div className="absolute -top-5 left-6">
                <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
              </div>
              <div className="mb-4 mt-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 italic mb-4">
                "Шоколадные конфеты просто бомба! Всегда беру набор 'Ассорти' - не разочаровывает. Спасибо за качество и сервис!"
              </p>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                    <span className="text-pink-700 font-semibold">ЕП</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Елена Петрова</h4>
                  <p className="text-sm text-gray-500">г. Москва</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Подписка на рассылку */}
      <section className="mb-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl overflow-hidden shadow-xl text-white py-12 px-6 md:px-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Подпишитесь на нашу рассылку</h2>
              <p className="text-lg mb-8 opacity-90">
                Будьте в курсе новых акций, скидок и специальных предложений. Получите скидку 10% на первый заказ!
              </p>
              <form className="flex flex-col sm:flex-row gap-4 justify-center">
                <input 
                  type="email" 
                  placeholder="Ваш e-mail" 
                  className="py-3 px-5 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-white w-full sm:w-auto"
                />
                <button 
                  type="submit" 
                  className="bg-white text-pink-600 py-3 px-8 rounded-full font-medium hover:bg-gray-100 transition-colors w-full sm:w-auto"
                >
                  Подписаться
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 
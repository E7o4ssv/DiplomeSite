import React, { useState, useEffect, useContext } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { fetchWithRetry } from '../../utils/apiUtils';

const DEFAULT_IMAGE = 'https://via.placeholder.com/100x100?text=Конфетти';

// Функция для форматирования URL изображения
const formatImageUrl = (url) => {
  if (!url || url.trim() === '') return DEFAULT_IMAGE;
  
  try {
    const trimmedUrl = url.trim();
    if (trimmedUrl.startsWith('@')) {
      return trimmedUrl.substring(1);
    }
    return trimmedUrl;
  } catch (error) {
    console.error('Ошибка форматирования URL:', error);
    return DEFAULT_IMAGE;
  }
};

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

const AdminExpiredProductsPage = () => {
  const { user, isAdmin, loading: authLoading } = useContext(AuthContext);
  const [expiredProducts, setExpiredProducts] = useState([]);
  const [expiringSoonProducts, setExpiringSoonProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('expired'); // 'expired' или 'expiring-soon'

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !isAdmin()) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Получение продуктов с истекшим сроком годности
        try {
          const expiredData = await fetchWithRetry('products/expired');
          setExpiredProducts(expiredData);
        } catch (err) {
          console.error('Ошибка загрузки продуктов с истекшим сроком годности:', err);
        }
        
        // Получение продуктов с истекающим сроком годности
        try {
          const expiringSoonData = await fetchWithRetry('products/expiring-soon');
          setExpiringSoonProducts(expiringSoonData);
        } catch (err) {
          console.error('Ошибка загрузки продуктов с истекающим сроком годности:', err);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Неожиданная ошибка:', err);
        setError('Произошла непредвиденная ошибка. Пожалуйста, обновите страницу.');
        setLoading(false);
      }
    };
    
    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading, isAdmin]);

  // Редирект если пользователь не админ
  if (!authLoading && (!user || !isAdmin())) {
    return <Navigate to="/login" replace />;
  }

  const handleImageError = (e) => {
    e.target.src = DEFAULT_IMAGE;
  };

  const currentProducts = activeTab === 'expired' ? expiredProducts : expiringSoonProducts;
  const currentTitle = activeTab === 'expired' ? 'Продукты с истекшим сроком годности' : 'Продукты с истекающим сроком годности';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Контроль сроков годности</h1>
        <Link to="/admin/products" className="text-pink-600 hover:text-pink-700">
          ← Вернуться к управлению товарами
        </Link>
      </div>

      {/* Табы */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('expired')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'expired'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Истекшие ({expiredProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('expiring-soon')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'expiring-soon'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Истекающие ({expiringSoonProducts.length})
            </button>
          </nav>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Загрузка данных...</p>
        </div>
      ) : currentProducts.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-600 mb-4">
            {activeTab === 'expired' 
              ? 'Продуктов с истекшим сроком годности не найдено.' 
              : 'Продуктов с истекающим сроком годности не найдено.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-medium text-gray-900">{currentTitle}</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Товар
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Категория
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Цена
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Срок годности
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentProducts.map(product => (
                <tr key={product.id} className={activeTab === 'expired' ? 'bg-red-50' : 'bg-orange-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={formatImageUrl(product.imageUrl)}
                          alt={product.name}
                          onError={handleImageError}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {product.description || 'Нет описания'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                      {product.category?.name || 'Без категории'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.price.toFixed(2)} ₽
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activeTab === 'expired' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {formatDate(product.expiryDate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/admin/products`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Редактировать
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminExpiredProductsPage; 
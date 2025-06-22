import React, { useState, useEffect, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { fetchWithRetry } from '../utils/apiUtils';

const DEFAULT_IMAGE = 'https://via.placeholder.com/40x40?text=Конфетти';

// Функция для форматирования URL изображения
const formatImageUrl = (url) => {
  if (!url || url.trim() === '') return DEFAULT_IMAGE;
  
  // Если URL начинается с @, значит это внешняя ссылка (убираем @ в начале)
  if (url.startsWith('@')) {
    return url.substring(1);
  }
  
  return url;
};

const OrdersPage = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testDataStatus, setTestDataStatus] = useState('');
  
  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        try {
          // Используем функцию с повторами
          const ordersData = await fetchWithRetry('/api/orders');
          setOrders(ordersData);
        } catch (err) {
          console.error('Не удалось загрузить заказы:', err);
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
    
    loadOrders();
  }, [user]);
  
  // Редирект на страницу входа, если пользователь не авторизован
  if (!authLoading && !user) {
    return <Navigate to="/login?redirect=orders" replace />;
  }
  
  // Функция форматирования даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Функция для определения класса статуса заказа
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Функция для перевода статуса заказа
  const translateStatus = (status) => {
    switch (status) {
      case 'pending':
        return 'Ожидает обработки';
      case 'processing':
        return 'В обработке';
      case 'shipped':
        return 'Отправлен';
      case 'delivered':
        return 'Доставлен';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };
  
  // Функция для создания тестовых данных
  const createTestData = async () => {
    try {
      setTestDataStatus('Создание тестовых данных...');
      // Сначала создадим тестовую категорию и продукт
      const { data: productData } = await axios.get('/api/test/create-test-data');
      console.log('Тестовые данные продуктов созданы:', productData);
      
      // Теперь создадим тестовый заказ
      const { data: orderData } = await axios.get('/api/test/create-test-order');
      console.log('Тестовый заказ создан:', orderData);
      
      // Перезагрузим список заказов
      const { data: refreshedOrders } = await axios.get('/api/orders');
      setOrders(refreshedOrders);
      
      setTestDataStatus('Тестовые данные успешно созданы и заказы загружены.');
      setTimeout(() => setTestDataStatus(''), 3000);
    } catch (err) {
      console.error('Ошибка создания тестовых данных:', err);
      setTestDataStatus('Ошибка создания тестовых данных: ' + (err.response?.data?.message || err.message));
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Мои заказы</h1>
      
      {testDataStatus && (
        <div className="bg-blue-100 border border-blue-200 text-blue-700 p-4 rounded-lg mb-6">
          {testDataStatus}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="text-red-700 hover:text-red-900"
          >
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Загрузка заказов...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">У вас пока нет заказов</h2>
          <p className="text-gray-600 mb-6">
            Перейдите в каталог, чтобы сделать первый заказ
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/products" className="btn btn-primary">
              Перейти в каталог
            </Link>
            <button 
              onClick={createTestData} 
              className="btn btn-secondary"
            >
              Создать тестовый заказ
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {orders.map(order => (
            <div key={order.id} className="border-b border-gray-200 last:border-0">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Заказ #{order.id}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Дата: {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0 flex items-center">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                      {translateStatus(order.status)}
                    </span>
                    <span className="ml-4 text-lg font-bold text-gray-800">
                      {order.total.toFixed(2)} ₽
                    </span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Товары в заказе:</h4>
                  <div className="space-y-3">
                    {order.orderItems.map(item => (
                      <div key={item.id} className="flex items-center border-b border-gray-100 pb-3 last:border-0">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={formatImageUrl(item.product.imageUrl)}
                            alt={item.product.name}
                            onError={(e) => { e.target.src = DEFAULT_IMAGE }}
                          />
                        </div>
                        <div className="ml-4 flex-grow">
                          <Link 
                            to={`/products/${item.product.id}`} 
                            className="text-sm font-medium text-gray-900 hover:text-pink-500"
                          >
                            {item.product.name}
                          </Link>
                        </div>
                        <div className="text-sm text-gray-500 whitespace-nowrap">
                          {item.quantity} шт.
                        </div>
                        <div className="ml-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {item.price.toFixed(2)} ₽
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage; 
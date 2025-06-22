import React, { useState, useEffect, useContext } from 'react';
import { Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { fetchWithRetry } from '../../utils/apiUtils';

const DEFAULT_IMAGE = 'https://via.placeholder.com/100x100?text=Конфетти';

// Функция для форматирования URL изображения
const formatImageUrl = (url) => {
  if (!url || url.trim() === '') return DEFAULT_IMAGE;
  
  // Если URL начинается с @, значит это внешняя ссылка (убираем @ в начале)
  if (url.startsWith('@')) {
    return url.substring(1);
  }
  
  return url;
};

const AdminOrdersPage = () => {
  const { user, isAdmin, loading: authLoading } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [testDataStatus, setTestDataStatus] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !isAdmin()) return;
      
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
    
    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading, isAdmin]);
  
  // Редирект если пользователь не админ
  if (!authLoading && (!user || !isAdmin())) {
    return <Navigate to="/login" replace />;
  }
  
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // Устанавливаем ID заказа, статус которого обновляется
      setUpdatingOrderId(orderId);
      // Сбрасываем предыдущую ошибку
      setError(null);
      
      // Используем новый маршрут API для обновления статуса
      const updatedOrder = await fetchWithRetry(`orders/${orderId}/status`, {
        method: 'post',
        data: { status: newStatus }
      });
      
      // Обновляем массив заказов с новым статусом
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? updatedOrder : order
        )
      );
    } catch (err) {
      console.error('Ошибка обновления статуса:', err);
      let errorMessage = 'Ошибка обновления статуса. Пожалуйста, попробуйте позже.';
      
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
    } finally {
      // Снимаем флаг загрузки
      setUpdatingOrderId(null);
    }
  };
  
  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Ожидает обработки</span>;
      case 'processing':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">В обработке</span>;
      case 'shipped':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">Отправлен</span>;
      case 'delivered':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Доставлен</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Отменен</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Управление заказами</h1>
        {orders.length === 0 && (
          <button 
            onClick={createTestData} 
            className="btn btn-secondary"
          >
            Создать тестовый заказ
          </button>
        )}
      </div>
      
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
          <p className="text-gray-600 mb-4">Заказов пока нет.</p>
          <button
            onClick={createTestData}
            className="btn btn-primary"
          >
            Создать тестовый заказ
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md">
          {orders.map((order) => (
            <div key={order.id} className="border-b border-gray-200 last:border-b-0">
              <div className="px-6 py-4">
                <div className="flex flex-col sm:flex-row justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Заказ №{order.id}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <div className="flex items-center">
                      <span className="mr-3 text-sm text-gray-500">Статус:</span>
                      {getStatusLabel(order.status)}
                    </div>
                    <div className="mt-2">
                      <span className="text-sm text-gray-900 font-medium">
                        Сумма: {order.total.toFixed(2)} ₽
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Информация о клиенте
                  </h4>
                  <div className="text-sm">
                    <p><span className="font-medium">Имя:</span> {order.user?.name}</p>
                    <p><span className="font-medium">Email:</span> {order.user?.email}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Товары
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Товар
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Цена
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Количество
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Итого
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {order.orderItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={formatImageUrl(item.product?.imageUrl)}
                                    alt={item.product?.name}
                                    onError={(e) => { e.target.src = DEFAULT_IMAGE }}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.product?.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.price.toFixed(2)} ₽
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {(item.price * item.quantity).toFixed(2)} ₽
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <div className="mt-2">
                    <label htmlFor={`order-status-${order.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Изменить статус:
                    </label>
                    <div className="flex items-center">
                      <select
                        id={`order-status-${order.id}`}
                        className="form-input text-sm"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingOrderId === order.id}
                      >
                        <option value="pending">Ожидает обработки</option>
                        <option value="processing">В обработке</option>
                        <option value="shipped">Отправлен</option>
                        <option value="delivered">Доставлен</option>
                        <option value="cancelled">Отменен</option>
                      </select>
                      
                      {updatingOrderId === order.id && (
                        <div className="ml-3">
                          <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6">
        <Link to="/admin/products" className="text-pink-600 hover:text-pink-700">
          ← Вернуться к управлению товарами
        </Link>
      </div>
    </div>
  );
};

export default AdminOrdersPage; 
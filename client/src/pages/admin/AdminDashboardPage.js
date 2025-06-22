import React, { useContext } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import ExpiryStatistics from '../../components/ExpiryStatistics';

const AdminDashboardPage = () => {
  const { user, isAdmin, loading: authLoading } = useContext(AuthContext);

  // Редирект если пользователь не админ
  if (!authLoading && (!user || !isAdmin())) {
    return <Navigate to="/login" replace />;
  }

  const adminCards = [
    {
      title: 'Управление товарами',
      description: 'Добавление, редактирование и удаление товаров',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      link: '/admin/products',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Управление категориями',
      description: 'Создание и редактирование категорий товаров',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      link: '/admin/categories',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Управление заказами',
      description: 'Просмотр и обработка заказов клиентов',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      link: '/admin/orders',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Контроль сроков годности',
      description: 'Мониторинг товаров с истекающим сроком годности',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      link: '/admin/expired-products',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Панель администратора</h1>
        <p className="text-gray-600 mt-2">Добро пожаловать, {user?.name}!</p>
      </div>

      {/* Статистика сроков годности */}
      <div className="mb-8">
        <ExpiryStatistics />
      </div>

      {/* Карточки управления */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminCards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex items-center mb-4">
              <div className={`${card.color} text-white p-3 rounded-lg mr-4`}>
                {card.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-800">{card.title}</h3>
            </div>
            <p className="text-gray-600 text-sm">{card.description}</p>
          </Link>
        ))}
      </div>

      {/* Быстрые действия */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Быстрые действия</h3>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/admin/products"
            className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Добавить товар
          </Link>
          
          <Link
            to="/admin/categories"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Добавить категорию
          </Link>
          
          <Link
            to="/admin/expired-products"
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Проверить сроки годности
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage; 
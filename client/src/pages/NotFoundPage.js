import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="mb-8">
        <h1 className="text-9xl font-bold text-pink-500">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mt-4 mb-6">
          Страница не найдена
        </h2>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          Запрашиваемая страница не существует или была перемещена.
          Вернитесь на главную страницу или перейдите в каталог товаров.
        </p>
        <div className="flex space-x-4 justify-center">
          <Link
            to="/"
            className="btn btn-primary"
          >
            На главную
          </Link>
          <Link
            to="/products"
            className="btn btn-secondary"
          >
            Каталог товаров
          </Link>
        </div>
      </div>
      <div className="max-w-md mx-auto">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 500 500"
          className="w-full h-64 text-pink-100"
        >
          <circle cx="250" cy="250" r="200" fill="currentColor" />
          <path
            fill="#FFF"
            d="M170.5 200c5.5 0 10 4.5 10 10s-4.5 10-10 10-10-4.5-10-10 4.5-10 10-10zM330.5 200c5.5 0 10 4.5 10 10s-4.5 10-10 10-10-4.5-10-10 4.5-10 10-10z"
          />
          <path
            stroke="#EC4899"
            strokeWidth="8"
            strokeLinecap="round"
            d="M180 280c20 20 50 40 70 40s50-20 70-40"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
};

export default NotFoundPage; 
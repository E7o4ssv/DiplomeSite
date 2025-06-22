import React, { useState, useEffect } from 'react';
import { fetchWithRetry } from '../utils/apiUtils';

const ExpiryStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchWithRetry('products/expiry-statistics');
        setStatistics(data);
      } catch (err) {
        console.error('Ошибка загрузки статистики:', err);
        setError('Ошибка загрузки статистики');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Статистика сроков годности</h3>
        <div className="text-center py-4">
          <div className="inline-block w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Статистика сроков годности</h3>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const { expired, expiringWeek, expiringMonth, totalWithExpiry, totalProducts } = statistics;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Статистика сроков годности</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{expired}</div>
          <div className="text-sm text-gray-600">Истекли</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{expiringWeek}</div>
          <div className="text-sm text-gray-600">Истекают в течение недели</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{expiringMonth}</div>
          <div className="text-sm text-gray-600">Истекают в течение месяца</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalWithExpiry}</div>
          <div className="text-sm text-gray-600">Всего с указанным сроком</div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Всего товаров: <span className="font-semibold">{totalProducts}</span>
        </div>
        <div className="text-sm text-gray-600">
          Товаров без срока годности: <span className="font-semibold">{totalProducts - totalWithExpiry}</span>
        </div>
      </div>
      
      {(expired > 0 || expiringWeek > 0) && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-orange-800 text-sm font-medium">
              {expired > 0 && `${expired} товар(ов) с истекшим сроком годности`}
              {expired > 0 && expiringWeek > 0 && ' и '}
              {expiringWeek > 0 && `${expiringWeek} товар(ов) истекает в течение недели`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpiryStatistics; 
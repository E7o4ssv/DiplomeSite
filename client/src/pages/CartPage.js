import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const DEFAULT_IMAGE = 'https://via.placeholder.com/100x100?text=Конфетти';

const CartPage = () => {
  const { cartItems, total, updateQuantity, removeFromCart, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Обработчик оформления заказа
  const handleCheckout = async () => {
    if (!user) {
      navigate('/login?redirect=cart');
      return;
    }
    
    if (cartItems.length === 0) {
      setError('Корзина пуста. Добавьте товары для оформления заказа.');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      
      const orderItems = cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      }));
      
      await axios.post('/orders', {
        orderItems,
        total
      });
      
      clearCart();
      setSuccess(true);
      setIsProcessing(false);
      
      // Редирект на страницу с заказами через 3 секунды
      setTimeout(() => {
        navigate('/orders');
      }, 3000);
      
    } catch (err) {
      console.error('Ошибка оформления заказа:', err);
      setError('Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте позже.');
      setIsProcessing(false);
    }
  };
  
  // Если корзина пуста
  if (cartItems.length === 0 && !success) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Корзина</h1>
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
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Ваша корзина пуста</h2>
          <p className="text-gray-600 mb-6">
            Добавьте товары в корзину, чтобы оформить заказ
          </p>
          <Link to="/products" className="btn btn-primary">
            Перейти в каталог
          </Link>
        </div>
      </div>
    );
  }
  
  // Если заказ успешно оформлен
  if (success) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-green-100 p-8 rounded-lg shadow-md text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-green-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Заказ успешно оформлен!
          </h2>
          <p className="text-gray-600 mb-6">
            Спасибо за ваш заказ. Вы будете перенаправлены на страницу заказов через несколько секунд.
          </p>
          <Link to="/orders" className="btn btn-primary">
            Перейти к заказам
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Корзина</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Таблица товаров */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                    Кол-во
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сумма
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Удалить</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cartItems.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={item.imageUrl || DEFAULT_IMAGE}
                            alt={item.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            <Link to={`/products/${item.id}`} className="hover:text-pink-500">
                              {item.name}
                            </Link>
                          </div>
                          {item.category && (
                            <div className="text-sm text-gray-500">{item.category.name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.price.toFixed(2)} ₽</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <button
                          type="button"
                          className="w-8 h-8 rounded-l-md bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-300"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                          className="h-8 w-12 border-gray-300 text-center focus:ring-pink-500 focus:border-pink-500 text-sm"
                          min="1"
                        />
                        <button
                          type="button"
                          className="w-8 h-8 rounded-r-md bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-300"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {(item.price * item.quantity).toFixed(2)} ₽
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex justify-between">
            <Link to="/products" className="btn btn-secondary">
              Продолжить покупки
            </Link>
            <button
              onClick={() => clearCart()}
              className="btn btn-danger"
            >
              Очистить корзину
            </button>
          </div>
        </div>
        
        {/* Сводка и оформление */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Сводка заказа</h2>
            
            <div className="border-t border-b py-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Товары ({cartItems.length})</span>
                <span className="text-gray-800 font-medium">{total.toFixed(2)} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Доставка</span>
                <span className="text-gray-800 font-medium">0.00 ₽</span>
              </div>
            </div>
            
            <div className="flex justify-between mb-6">
              <span className="text-lg font-semibold text-gray-800">Итого</span>
              <span className="text-lg font-bold text-gray-800">{total.toFixed(2)} ₽</span>
            </div>
            
            <button
              type="button"
              onClick={handleCheckout}
              disabled={isProcessing}
              className={`btn btn-primary w-full py-3 ${
                isProcessing ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Оформление...
                </span>
              ) : (
                'Оформить заказ'
              )}
            </button>
            
            {!user && (
              <div className="mt-4 text-center text-sm text-gray-600">
                <p className="mb-2">Для оформления заказа необходимо авторизоваться</p>
                <Link to="/login?redirect=cart" className="text-pink-600 hover:text-pink-700">
                  Войти в аккаунт
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage; 
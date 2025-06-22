import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Получение параметра redirect из URL
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect');
  
  // Если пользователь уже авторизован, перенаправляем на главную или указанную страницу
  useEffect(() => {
    if (user) {
      if (redirectTo === 'cart') {
        navigate('/cart');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate, redirectTo]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Проверка заполнения всех полей
    if (!name || !email || !password || !confirmPassword) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    
    // Проверка совпадения паролей
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    
    // Проверка минимальной длины пароля
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const result = await register(name, email, password);
      
      if (!result.success) {
        setError(result.message);
        setIsLoading(false);
        return;
      }
      
      // Успешная регистрация, перенаправление
      if (redirectTo === 'cart') {
        navigate('/cart');
      } else {
        navigate('/');
      }
      
    } catch (err) {
      console.error('Ошибка регистрации:', err);
      setError('Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Регистрация
          </h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="form-label">
                Имя
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="Ваше имя"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="example@example.com"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="form-label">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Минимум 6 символов"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="form-label">
                Подтверждение пароля
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="Введите пароль еще раз"
                required
              />
            </div>
            
            <button
              type="submit"
              className={`btn btn-primary w-full py-3 ${
                isLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
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
                  Регистрация...
                </span>
              ) : (
                'Зарегистрироваться'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Уже есть аккаунт?{' '}
              <Link 
                to={redirectTo ? `/login?redirect=${redirectTo}` : '/login'} 
                className="text-pink-600 hover:text-pink-700"
              >
                Войти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 
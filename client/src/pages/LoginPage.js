import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState('');
  
  const { login, user } = useContext(AuthContext);
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
    
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const result = await login(email, password);
      
      if (!result.success) {
        setError(result.message);
        setIsLoading(false);
        return;
      }
      
      // Успешный вход, перенаправление
      if (redirectTo === 'cart') {
        navigate('/cart');
      } else {
        navigate('/');
      }
      
    } catch (err) {
      console.error('Ошибка входа:', err);
      setError('Произошла ошибка при входе. Пожалуйста, попробуйте позже.');
      setIsLoading(false);
    }
  };
  
  // Функция для проверки соединения с сервером
  const checkConnection = async () => {
    try {
      setIsLoading(true);
      setError('');
      setDiagnosticResult('Проверка соединения...');
      
      // Проверяем доступность основного сервера
      try {
        const response = await fetch('http://localhost:5001/api/test/create-admin');
        const data = await response.json();
        
        setDiagnosticResult(prev => prev + '\n✅ Основной сервер доступен: ' + JSON.stringify(data.message));
      } catch (err) {
        setDiagnosticResult(prev => prev + '\n❌ Ошибка соединения с основным сервером: ' + err.message);
      }
      
      // Проверка текущих заголовков Axios
      setDiagnosticResult(prev => prev + '\n\nНастройки Axios:');
      setDiagnosticResult(prev => prev + '\nbaseURL: ' + axios.defaults.baseURL);
      setDiagnosticResult(prev => prev + '\nЗаголовки: ' + JSON.stringify(axios.defaults.headers.common));
      
      // Попытка входа напрямую с полным URL
      try {
        const loginResult = await axios.post('http://localhost:5001/api/login', {
          email: 'admin@example.com',
          password: 'admin123'
        });
        
        setDiagnosticResult(prev => prev + '\n\n✅ Тестовый запрос на вход успешен!');
        setDiagnosticResult(prev => prev + '\nРезультат: ' + JSON.stringify(loginResult.data));
      } catch (err) {
        setDiagnosticResult(prev => prev + '\n\n❌ Ошибка тестового запроса на вход: ' + err.message);
        if (err.response) {
          setDiagnosticResult(prev => prev + '\nСтатус: ' + err.response.status);
          setDiagnosticResult(prev => prev + '\nДанные: ' + JSON.stringify(err.response.data));
        }
      }
      
      setIsLoading(false);
    } catch (err) {
      setDiagnosticResult('Ошибка диагностики: ' + err.message);
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Вход в аккаунт
          </h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          {diagnosticResult && (
            <div className="bg-blue-100 text-blue-700 p-4 rounded-lg mb-6 whitespace-pre-wrap text-xs font-mono">
              {diagnosticResult}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
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
            
            <div className="mb-6">
              <label htmlFor="password" className="form-label">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
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
                  Вход...
                </span>
              ) : (
                'Войти'
              )}
            </button>
            
            <button
              type="button"
              onClick={checkConnection}
              className="mt-4 w-full py-2 px-3 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Диагностика соединения
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Ещё нет аккаунта?{' '}
              <Link 
                to={redirectTo ? `/register?redirect=${redirectTo}` : '/register'} 
                className="text-pink-600 hover:text-pink-700"
              >
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 
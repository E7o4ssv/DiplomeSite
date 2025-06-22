import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверка наличия токена при загрузке приложения
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      console.log('Авторизация из localStorage: токен найден');
      setUser(JSON.parse(userData));
      // Устанавливаем заголовок авторизации для всех запросов axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Заголовок Authorization установлен:', `Bearer ${token}`);
    } else {
      console.log('Авторизация из localStorage: токен не найден');
    }
    
    setLoading(false);
  }, []);

  // Функция для входа в систему
  const login = async (email, password) => {
    try {
      console.log('Отправка запроса на авторизацию:', '/api/login');
      console.log('Данные для входа:', { email });
      
      const { data } = await axios.post('/api/login', { email, password });
      
      console.log('Успешная авторизация, получен токен');
      setUser(data);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      // Устанавливаем заголовок авторизации для всех запросов axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      console.log('Заголовок Authorization установлен:', `Bearer ${data.token}`);
      
      return { success: true };
    } catch (error) {
      console.error('Ошибка авторизации:', error);
      
      // Более подробное логирование ошибок
      if (error.response) {
        console.error('Ответ сервера:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('Запрос без ответа:', error.request);
      } else {
        console.error('Ошибка настройки запроса:', error.message);
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Ошибка входа. Проверьте соединение с сервером.'
      };
    }
  };

  // Функция для регистрации
  const register = async (name, email, password) => {
    try {
      console.log('Отправка запроса на регистрацию:', '/api/register');
      console.log('Данные для регистрации:', { name, email });
      
      const { data } = await axios.post('/api/register', { name, email, password });
      
      console.log('Успешная регистрация, получен токен');
      setUser(data);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      console.log('Заголовок Authorization установлен:', `Bearer ${data.token}`);
      
      return { success: true };
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      
      // Более подробное логирование ошибок
      if (error.response) {
        console.error('Ответ сервера:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('Запрос без ответа:', error.request);
      } else {
        console.error('Ошибка настройки запроса:', error.message);
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Ошибка регистрации. Проверьте соединение с сервером.'
      };
    }
  };

  // Функция для выхода из системы
  const logout = () => {
    console.log('Выход из системы, удаление токена');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    console.log('Заголовок Authorization удален');
  };

  // Проверка, является ли пользователь администратором
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}; 
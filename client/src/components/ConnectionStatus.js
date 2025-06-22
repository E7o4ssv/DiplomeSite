import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ConnectionStatus = () => {
  const [status, setStatus] = useState('checking');
  const [isVisible, setIsVisible] = useState(false);
  const [port, setPort] = useState(null);
  
  useEffect(() => {
    // Функция для проверки статуса соединения
    const checkStatus = async () => {
      setStatus('checking');
      setIsVisible(true);
      
      // Пробуем разные порты, начиная с 5001
      const portsToTry = [5001, 5002, 5003, 5004, 5005];
      let connected = false;
      
      // Сначала проверим работает ли прокси (относительный URL)
      try {
        await axios.get('/api/test/cors-check');
        setStatus('connected');
        setPort('proxy');
        connected = true;
        console.log('Соединение установлено через прокси');
      } catch (error) {
        console.log('Ошибка соединения через прокси:', error.message);
      }
      
      // Если прокси не работает, пробуем прямое соединение с разными портами
      if (!connected) {
        for (const p of portsToTry) {
          try {
            await axios.get(`http://localhost:${p}/api/test/cors-check`);
            setStatus('connected');
            setPort(p);
            connected = true;
            console.log(`Соединение установлено на порту ${p}`);
            
            // Обновляем baseURL для axios
            axios.defaults.baseURL = `http://localhost:${p}/api`;
            console.log(`Обновлен baseURL для axios: ${axios.defaults.baseURL}`);
            
            break;
          } catch (error) {
            console.log(`Ошибка соединения на порту ${p}:`, error.message);
          }
        }
      }
      
      // Если не удалось подключиться ни к одному порту
      if (!connected) {
        setStatus('disconnected');
        setPort(null);
        console.error('Не удалось подключиться ни к одному порту');
      } else {
        // Скрываем индикатор через 3 секунды после успешного соединения
        setTimeout(() => setIsVisible(false), 3000);
      }
    };
    
    // Проверяем соединение при монтировании и каждые 30 секунд
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Если индикатор скрыт, не отображаем ничего
  if (!isVisible) return null;
  
  return (
    <div 
      className={`fixed bottom-4 left-4 px-4 py-2 rounded-full shadow-lg flex items-center transition-all ${
        status === 'connected' ? 'bg-green-500 text-white' : 
        status === 'disconnected' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
      }`}
    >
      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
        status === 'connected' ? 'bg-green-200' : 
        status === 'disconnected' ? 'bg-red-200' : 'bg-yellow-200'
      } ${status === 'checking' ? 'animate-pulse' : ''}`}></span>
      
      <span className="text-sm font-medium">
        {status === 'connected' && (port === 'proxy' 
          ? 'Соединение установлено (прокси)' 
          : `Соединение установлено (порт ${port})`)}
        {status === 'disconnected' && 'Ошибка соединения с сервером'}
        {status === 'checking' && 'Проверка соединения...'}
      </span>
    </div>
  );
};

export default ConnectionStatus; 
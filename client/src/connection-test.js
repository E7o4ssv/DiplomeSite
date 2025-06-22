// Утилита для тестирования подключения к серверу
const axios = require('axios');

async function testConnection() {
  console.log('=== Тест соединения с сервером ===');
  console.log('Время запуска:', new Date().toLocaleString());
  console.log('');
  
  // Проверка соединения с основным сервером
  try {
    console.log('1. Проверка основного сервера (порт 5001):');
    const response = await axios.get('http://localhost:5001/api/test/cors-check');
    console.log('✅ Соединение установлено!');
    console.log('Ответ:', response.data);
  } catch (error) {
    console.log('❌ Ошибка соединения с основным сервером:');
    if (error.response) {
      console.log('Статус:', error.response.status);
      console.log('Ответ:', error.response.data);
    } else if (error.request) {
      console.log('Запрос отправлен, но ответ не получен');
      console.log('Детали:', error.message);
    } else {
      console.log('Ошибка настройки запроса:', error.message);
    }
  }
  
  console.log('\n-----------------------------------\n');
  
  // Тест авторизации
  try {
    console.log('2. Проверка авторизации admin@example.com:admin123:');
    const loginResponse = await axios.post('http://localhost:5001/api/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    console.log('✅ Авторизация успешна!');
    console.log('Токен:', loginResponse.data.token.substring(0, 30) + '...');
    console.log('Роль:', loginResponse.data.role);
    
    // Проверка защищенного маршрута с полученным токеном
    try {
      console.log('\n3. Проверка доступа к защищенному маршруту с токеном:');
      const ordersResponse = await axios.get('http://localhost:5001/api/orders', {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`
        }
      });
      console.log('✅ Доступ к защищенному маршруту получен!');
      console.log('Количество заказов:', ordersResponse.data.length);
    } catch (error) {
      console.log('❌ Ошибка доступа к защищенному маршруту:');
      if (error.response) {
        console.log('Статус:', error.response.status);
        console.log('Ответ:', error.response.data);
      } else {
        console.log('Ошибка:', error.message);
      }
    }
  } catch (error) {
    console.log('❌ Ошибка авторизации:');
    if (error.response) {
      console.log('Статус:', error.response.status);
      console.log('Ответ:', error.response.data);
    } else if (error.request) {
      console.log('Запрос отправлен, но ответ не получен');
      console.log('Детали:', error.message);
    } else {
      console.log('Ошибка настройки запроса:', error.message);
    }
  }
  
  console.log('\n=== Тест завершен ===');
}

testConnection().catch(err => {
  console.error('Неожиданная ошибка:', err);
}); 
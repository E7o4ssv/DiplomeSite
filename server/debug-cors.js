const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5002;

// Установка CORS с полной диагностикой
app.use(cors({
  origin: function(origin, callback) {
    console.log('Запрос от источника:', origin);
    callback(null, true); // Разрешаем все источники
  },
  credentials: true
}));

// Промежуточное ПО для логирования запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Заголовки:', JSON.stringify(req.headers, null, 2));
  
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Тело запроса:', JSON.stringify(req.body, null, 2));
  }
  
  next();
});

// Включаем парсинг JSON
app.use(express.json());

// Тестовый маршрут для диагностики
app.post('/api/test-login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Попытка входа с credentials:', { email, password });
  
  // Проверяем тестовые учетные данные
  if (email === 'admin@example.com' && password === 'admin123') {
    return res.json({
      success: true,
      message: 'Успешный вход (тестовый сервер диагностики)',
      user: {
        id: 1,
        name: 'Администратор',
        email: 'admin@example.com',
        role: 'admin',
        token: 'test-token-123'
      }
    });
  }
  
  return res.status(401).json({
    success: false,
    message: 'Неверные учетные данные (тестовый сервер диагностики)'
  });
});

// Тестовый маршрут для диагностики GET запросов
app.get('/api/test-connection', (req, res) => {
  res.json({
    success: true,
    message: 'Соединение с диагностическим сервером установлено',
    timestamp: new Date().toISOString()
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Тестовый сервер запущен на порту ${PORT}`);
  console.log(`Перейдите в браузере по адресу http://localhost:${PORT}/api/test-connection для проверки соединения`);
  console.log('Для проверки авторизации отправьте POST запрос на http://localhost:5002/api/test-login');
  console.log('с телом {"email": "admin@example.com", "password": "admin123"}');
}); 
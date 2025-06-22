const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

// Инициализация Prisma и Express
const prisma = new PrismaClient();
const app = express();
const JWT_SECRET = 'confectionery_secret_key';

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Разрешаем любой источник в режиме разработки
    console.log('CORS запрос от:', origin);
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Middleware для исправления двойных путей /api/api/
app.use((req, res, next) => {
  if (req.url.startsWith('/api/api/')) {
    console.log(`Исправление двойного пути: ${req.url} -> ${req.url.replace('/api/api/', '/api/')}`);
    req.url = req.url.replace('/api/api/', '/api/');
  }
  next();
});

// Логирование запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Вспомогательные функции
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

const authenticate = async (req, res, next) => {
  try {
    console.log('Проверка аутентификации запроса');
    console.log('Заголовки авторизации:', req.headers.authorization);
    
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('Токен не найден в заголовке запроса');
      return res.status(401).json({ message: 'Требуется авторизация' });
    }
    
    console.log('Токен получен, проверка...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Токен валиден, пользователь:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    res.status(401).json({ message: 'Ошибка авторизации' });
  }
};

// Роуты для аутентификации
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const userExists = await prisma.user.findUnique({
      where: { email }
    });
    
    if (userExists) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    });
    
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user)
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[/api/login] Попытка входа с email: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log(`[/api/login] Пользователь с email ${email} не найден`);
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }
    
    console.log(`[/api/login] Пользователь найден: ${user.email}, роль: ${user.role}`);
    
    const passwordValid = await bcrypt.compare(password, user.password);
    
    if (!passwordValid) {
      console.log('[/api/login] Неверный пароль');
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }
    
    console.log('[/api/login] Авторизация успешна, генерация токена');
    
    const token = generateToken(user);
    console.log('[/api/login] Токен создан');
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    console.error('[/api/login] Ошибка входа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Диагностический маршрут для проверки CORS
app.get('/api/test/cors-check', (req, res) => {
  res.json({
    success: true,
    message: 'CORS проверка пройдена успешно',
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Создаем тестовый маршрут для быстрой проверки авторизации
app.post('/api/test-auth', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Тестовая авторизация:', email);
    
    // Обновляем пароль админа, если email = admin@example.com
    if (email === 'admin@example.com') {
      const admin = await prisma.user.findUnique({
        where: { email }
      });
      
      if (admin) {
        // Сравниваем пароль
        const isValidPassword = await bcrypt.compare(password, admin.password);
        
        if (isValidPassword) {
          return res.json({
            success: true,
            user: {
              id: admin.id,
              name: admin.name,
              email: admin.email,
              role: admin.role
            },
            token: generateToken(admin)
          });
        } else {
          return res.status(401).json({
            success: false,
            message: 'Неверный пароль',
            suggestion: 'Используйте admin123 для тестового пользователя admin@example.com'
          });
        }
      } else {
        // Создаем админа, если его нет
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const newAdmin = await prisma.user.create({
          data: {
            name: 'Администратор',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin'
          }
        });
        
        return res.json({
          success: true,
          message: 'Создан новый администратор',
          user: {
            id: newAdmin.id,
            name: newAdmin.name,
            email: newAdmin.email,
            role: newAdmin.role
          },
          token: generateToken(newAdmin)
        });
      }
    }
    
    // Для других пользователей
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Неверные учетные данные'
      });
    }
    
    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: generateToken(user)
    });
  } catch (error) {
    console.error('Ошибка тестовой авторизации:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });
  }
});

// Добавим маршрут для проверки здоровья API и соединения с базой данных
app.get('/api/health', async (req, res) => {
  try {
    // Простой запрос к базе данных для проверки соединения
    const adminCount = await prisma.user.count({
      where: { role: 'admin' }
    });
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      adminCount
    });
  } catch (error) {
    console.error('Ошибка проверки здоровья API:', error);
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Улучшим маршрут для получения заказов с лучшей обработкой ошибок
app.get('/api/orders', authenticate, async (req, res) => {
  try {
    console.log('Получен запрос на получение заказов');
    console.log('Пользователь:', req.user);
    
    const where = req.user.role === 'admin' ? {} : { userId: req.user.id };
    console.log('Условие поиска заказов:', where);
    
    // Добавим таймаут для отлова долгих запросов
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout fetching orders')), 5000)
    );
    
    // Выполняем запрос с таймаутом
    const ordersPromise = prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        orderItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Ожидаем первый результат: либо данные, либо таймаут
    const orders = await Promise.race([ordersPromise, timeoutPromise]);
    
    console.log('Найдено заказов:', orders.length);
    res.json(orders);
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    
    // Подробная информация об ошибке для отладки
    let errorDetails = {
      message: 'Ошибка загрузки данных',
      originalError: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    
    if (error.message === 'Timeout fetching orders') {
      errorDetails.message = 'Превышено время ожидания при загрузке заказов';
      errorDetails.suggestion = 'Возможно, база данных перегружена. Попробуйте позже.';
    }
    
    res.status(500).json({ 
      error: errorDetails.message,
      details: errorDetails
    });
  }
});

// Роуты для категорий
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/categories', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const category = await prisma.category.create({
      data: { name }
    });
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Ошибка создания категории:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Роуты для продуктов
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query;
    let where = {};
    
    if (category) {
      where.categoryId = parseInt(category);
    }
    
    const products = await prisma.product.findMany({
      where,
      include: { category: true }
    });
    
    res.json(products);
  } catch (error) {
    console.error('Ошибка получения продуктов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { category: true }
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Продукт не найден' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Ошибка получения продукта:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/products', authenticate, async (req, res) => {
  try {
    const { name, description, price, imageUrl, categoryId } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        categoryId: parseInt(categoryId)
      }
    });
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Ошибка создания продукта:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Маршрут для обновления продукта
app.post('/api/products/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, imageUrl, categoryId } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        categoryId: parseInt(categoryId)
      },
      include: { category: true }
    });
    
    res.json(product);
  } catch (error) {
    console.error('Ошибка обновления продукта:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Добавляем маршрут PUT для обновления продукта (аналогичный POST выше)
app.put('/api/products/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, imageUrl, categoryId } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        categoryId: parseInt(categoryId)
      },
      include: { category: true }
    });
    
    res.json(product);
  } catch (error) {
    console.error('Ошибка обновления продукта (PUT):', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Маршрут для удаления продукта
app.delete('/api/products/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    await prisma.product.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Продукт успешно удален' });
  } catch (error) {
    console.error('Ошибка удаления продукта:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Роуты для заказов
app.post('/api/orders', authenticate, async (req, res) => {
  try {
    const { orderItems, total } = req.body;
    
    // Проверяем существование пользователя
    const user = await prisma.user.findUnique({
      where: { email: req.user.email }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Используем ID пользователя из базы данных
    const order = await prisma.order.create({
      data: {
        userId: user.id, // Используем ID найденного пользователя
        total: parseFloat(total),
        orderItems: {
          create: orderItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Маршрут для обновления статуса заказа
app.post('/api/orders/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Проверяем, что пользователь - администратор
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    // Проверяем, существует ли заказ
    const orderExists = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!orderExists) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }
    
    // Проверяем валидность статуса
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Некорректный статус заказа' });
    }
    
    // Обновляем статус заказа
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });
    
    res.json(updatedOrder);
  } catch (error) {
    console.error('Ошибка обновления статуса заказа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Экспортируем приложение и prisma для использования в других файлах
module.exports = { app, prisma, authenticate };
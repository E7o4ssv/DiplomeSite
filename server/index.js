const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { getExpiryStatistics, generateExpiryReport } = require('./utils/expiryChecker');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5001;
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
// В режиме разработки нам не нужно обслуживать статические файлы из build директории
// app.use(express.static(path.join(__dirname, '../client/build')));

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

// Маршрут для получения продуктов с истекшим сроком годности
app.get('/api/products/expired', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const currentDate = new Date();
    
    const expiredProducts = await prisma.product.findMany({
      where: {
        expiryDate: {
          not: null,
          lt: currentDate
        }
      },
      include: { category: true }
    });
    
    res.json(expiredProducts);
  } catch (error) {
    console.error('Ошибка получения продуктов с истекшим сроком годности:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Маршрут для получения продуктов, срок годности которых истекает в ближайшие дни
app.get('/api/products/expiring-soon', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const currentDate = new Date();
    const daysAhead = parseInt(req.query.days) || 7; // По умолчанию 7 дней
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + daysAhead);
    
    const expiringSoonProducts = await prisma.product.findMany({
      where: {
        expiryDate: {
          not: null,
          gte: currentDate,
          lte: futureDate
        }
      },
      include: { category: true }
    });
    
    res.json(expiringSoonProducts);
  } catch (error) {
    console.error('Ошибка получения продуктов с истекающим сроком годности:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Маршрут для получения статистики по срокам годности
app.get('/api/products/expiry-statistics', async (req, res) => {
  try {
    const statistics = await getExpiryStatistics();
    
    if (!statistics) {
      return res.status(500).json({ message: 'Ошибка получения статистики' });
    }
    
    res.json(statistics);
  } catch (error) {
    console.error('Ошибка получения статистики по срокам годности:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Маршрут для получения отчета по срокам годности
app.get('/api/products/expiry-report', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const report = await generateExpiryReport();
    
    if (!report) {
      return res.status(500).json({ message: 'Ошибка создания отчета' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Ошибка создания отчета по срокам годности:', error);
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
    const { name, description, price, imageUrl, categoryId, expiryDate } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        categoryId: parseInt(categoryId),
        expiryDate: expiryDate ? new Date(expiryDate) : null
      }
    });
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Ошибка создания продукта:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Маршрут для обновления продукта (PUT)
app.put('/api/products/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, imageUrl, categoryId, expiryDate } = req.body;

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
        categoryId: parseInt(categoryId),
        expiryDate: expiryDate ? new Date(expiryDate) : null
      },
      include: { category: true }
    });

    res.json(product);
  } catch (error) {
    console.error('Ошибка обновления продукта:', error);
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
    
    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
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

app.get('/api/orders', authenticate, async (req, res) => {
  try {
    console.log('Получен запрос на получение заказов');
    console.log('Пользователь:', req.user);
    
    const where = req.user.role === 'admin' ? {} : { userId: req.user.id };
    console.log('Условие поиска заказов:', where);
    
    const orders = await prisma.order.findMany({
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
    
    console.log('Найдено заказов:', orders.length);
    res.json(orders);
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
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

// Маршрут для создания тестовых данных (категория и продукт)
app.get('/api/test/create-test-data', async (req, res) => {
  try {
    console.log('Создание тестовых данных...');
    
    // Создаем тестовую категорию
    const category = await prisma.category.upsert({
      where: { name: 'Тестовая категория' },
      update: {},
      create: {
        name: 'Тестовая категория'
      }
    });
    
    console.log('Тестовая категория создана/обновлена:', category);
    
    // Создаем тестовый продукт
    const product = await prisma.product.upsert({
      where: { 
        id: 1 
      },
      update: {},
      create: {
        name: 'Тестовый продукт',
        description: 'Это тестовый продукт для демонстрации',
        price: 100.0,
        imageUrl: '@https://via.placeholder.com/300x300?text=Тестовый+продукт',
        categoryId: category.id
      }
    });
    
    console.log('Тестовый продукт создан/обновлен:', product);
    
    // Получаем все категории для проверки
    const allCategories = await prisma.category.findMany();
    console.log('Всего категорий в базе:', allCategories.length);
    
    // Получаем все продукты для проверки
    const allProducts = await prisma.product.findMany();
    console.log('Всего продуктов в базе:', allProducts.length);
    
    res.json({
      category,
      product,
      categoriesCount: allCategories.length,
      productsCount: allProducts.length
    });
  } catch (error) {
    console.error('Ошибка создания тестовых данных:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Маршрут для создания тестового заказа
app.get('/api/test/create-test-order', async (req, res) => {
  try {
    console.log('Создание тестового заказа...');
    
    // Проверяем наличие администратора
    const admin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });
    
    if (!admin) {
      return res.status(404).json({ message: 'Администратор не найден' });
    }
    
    // Получаем первый товар
    const firstProduct = await prisma.product.findFirst();
    
    if (!firstProduct) {
      return res.status(404).json({ message: 'Товары не найдены' });
    }
    
    // Создаем тестовый заказ
    const testOrder = await prisma.order.create({
      data: {
        userId: admin.id,
        total: firstProduct.price * 2,
        status: 'pending',
        orderItems: {
          create: [{
            productId: firstProduct.id,
            quantity: 2,
            price: firstProduct.price
          }]
        }
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        user: true
      }
    });
    
    console.log('Тестовый заказ создан:', testOrder);
    
    // Получаем все заказы для проверки
    const allOrders = await prisma.order.findMany({
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
    
    console.log('Всего заказов в базе:', allOrders.length);
    
    res.json({ testOrder, allOrders });
  } catch (error) {
    console.error('Ошибка создания тестового заказа:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Маршрут для диагностики авторизации
app.post('/api/test/login-debug', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Попытка входа с email: ${email}`);
    
    // Ищем пользователя по email
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log(`Пользователь с email ${email} не найден`);
      return res.status(401).json({ 
        message: 'Пользователь не найден',
        debug: { userExists: false }
      });
    }
    
    console.log(`Пользователь найден: ${user.email}, роль: ${user.role}`);
    
    // Проверяем пароль
    const passwordValid = await bcrypt.compare(password, user.password);
    
    if (!passwordValid) {
      console.log('Неверный пароль');
      return res.status(401).json({ 
        message: 'Неверный пароль',
        debug: { userExists: true, passwordValid: false }
      });
    }
    
    console.log('Пароль верный, авторизация успешна');
    
    res.json({
      message: 'Авторизация успешна',
      debug: {
        userExists: true,
        passwordValid: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Ошибка диагностики входа:', error);
    res.status(500).json({ 
      message: 'Ошибка сервера', 
      error: error.message,
      debug: { error: true }
    });
  }
});

// Маршрут для проверки и создания тестового администратора
app.get('/api/test/create-admin', async (req, res) => {
  try {
    console.log('Проверка наличия администратора...');
    
    // Проверяем, существует ли администратор
    const adminExists = await prisma.user.findFirst({
      where: { role: 'admin' }
    });
    
    if (adminExists) {
      console.log('Администратор найден:', adminExists.email);
      
      // Обновляем пароль администратора
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const updatedAdmin = await prisma.user.update({
        where: { id: adminExists.id },
        data: { password: hashedPassword }
      });
      
      console.log('Пароль администратора обновлен');
      
      return res.json({
        message: 'Администратор найден, пароль обновлен',
        admin: {
          id: updatedAdmin.id,
          email: updatedAdmin.email,
          name: updatedAdmin.name,
          role: updatedAdmin.role
        }
      });
    }
    
    // Если администратора нет, создаем его
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const newAdmin = await prisma.user.create({
      data: {
        name: 'Администратор',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      }
    });
    
    console.log('Администратор создан:', newAdmin.email);
    
    res.json({
      message: 'Администратор создан',
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role
      }
    });
  } catch (error) {
    console.error('Ошибка создания/проверки администратора:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
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

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Обработка всех остальных запросов для работы с React Router
// В режиме разработки эта часть не нужна, т.к. запросы обрабатывает webpack-dev-server
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
// });

// Запуск сервера
const startServer = async (port) => {
  try {
    await new Promise((resolve, reject) => {
      const server = app.listen(port, () => {
        console.log(`Сервер запущен на порту ${port}`);
        resolve();
      });
      
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Порт ${port} занят, пробуем порт ${port + 1}`);
          reject(err);
        } else {
          reject(err);
        }
      });
    });
    
    // Создаем администратора при первом запуске
    try {
      const adminExists = await prisma.user.findFirst({
        where: { role: 'admin' }
      });
      
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await prisma.user.create({
          data: {
            name: 'Администратор',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin'
          }
        });
        console.log('Администратор создан: admin@example.com / admin123');
      }
    } catch (error) {
      console.error('Ошибка инициализации базы данных:', error);
    }
  } catch (err) {
    // Если порт занят, пробуем следующий
    if (err.code === 'EADDRINUSE') {
      startServer(port + 1);
    } else {
      console.error('Ошибка запуска сервера:', err);
    }
  }
};

// Начинаем с порта 5001
startServer(PORT); 
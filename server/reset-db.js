const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('Начало сброса базы данных...');
    
    // Удаляем все записи из таблиц в правильном порядке
    console.log('Удаление существующих данных...');
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('Все данные успешно удалены.');
    
    // Создаем нового администратора
    console.log('Создание администратора...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Администратор',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      }
    });
    
    console.log('Администратор создан:', admin.email);
    
    // Создаем тестовую категорию
    console.log('Создание тестовой категории...');
    const category = await prisma.category.create({
      data: {
        name: 'Тестовая категория'
      }
    });
    
    console.log('Категория создана:', category.name);
    
    // Создаем тестовый продукт
    console.log('Создание тестового продукта...');
    const product = await prisma.product.create({
      data: {
        name: 'Тестовый продукт',
        description: 'Это тестовый продукт для демонстрации',
        price: 100.0,
        imageUrl: '@https://via.placeholder.com/300x300?text=Тестовый+продукт',
        categoryId: category.id
      }
    });
    
    console.log('Продукт создан:', product.name);
    
    // Создаем тестовый заказ
    console.log('Создание тестового заказа...');
    const order = await prisma.order.create({
      data: {
        userId: admin.id,
        total: product.price * 2,
        status: 'pending',
        orderItems: {
          create: [{
            productId: product.id,
            quantity: 2,
            price: product.price
          }]
        }
      }
    });
    
    console.log('Заказ создан с ID:', order.id);
    
    console.log('База данных успешно сброшена и заполнена тестовыми данными!');
    console.log('Данные для входа администратора:');
    console.log('Email: admin@example.com');
    console.log('Пароль: admin123');
    
  } catch (error) {
    console.error('Ошибка сброса базы данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase(); 
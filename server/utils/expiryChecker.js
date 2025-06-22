const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Функция для проверки продуктов с истекшим сроком годности
const checkExpiredProducts = async () => {
  try {
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
    
    return expiredProducts;
  } catch (error) {
    console.error('Ошибка при проверке истекших продуктов:', error);
    return [];
  }
};

// Функция для проверки продуктов с истекающим сроком годности
const checkExpiringSoonProducts = async (daysAhead = 7) => {
  try {
    const currentDate = new Date();
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
    
    return expiringSoonProducts;
  } catch (error) {
    console.error('Ошибка при проверке продуктов с истекающим сроком годности:', error);
    return [];
  }
};

// Функция для получения статистики по срокам годности
const getExpiryStatistics = async () => {
  try {
    const currentDate = new Date();
    const weekAhead = new Date();
    weekAhead.setDate(currentDate.getDate() + 7);
    const monthAhead = new Date();
    monthAhead.setDate(currentDate.getDate() + 30);
    
    const [expired, expiringWeek, expiringMonth, totalWithExpiry] = await Promise.all([
      prisma.product.count({
        where: {
          expiryDate: {
            not: null,
            lt: currentDate
          }
        }
      }),
      prisma.product.count({
        where: {
          expiryDate: {
            not: null,
            gte: currentDate,
            lt: weekAhead
          }
        }
      }),
      prisma.product.count({
        where: {
          expiryDate: {
            not: null,
            gte: weekAhead,
            lt: monthAhead
          }
        }
      }),
      prisma.product.count({
        where: {
          expiryDate: {
            not: null
          }
        }
      })
    ]);
    
    return {
      expired,
      expiringWeek,
      expiringMonth,
      totalWithExpiry,
      totalProducts: await prisma.product.count()
    };
  } catch (error) {
    console.error('Ошибка при получении статистики сроков годности:', error);
    return null;
  }
};

// Функция для форматирования даты
const formatDate = (date) => {
  return date.toLocaleDateString('ru-RU');
};

// Функция для создания отчета о сроках годности
const generateExpiryReport = async () => {
  try {
    const [expiredProducts, expiringSoonProducts, statistics] = await Promise.all([
      checkExpiredProducts(),
      checkExpiringSoonProducts(7),
      getExpiryStatistics()
    ]);
    
    const report = {
      timestamp: new Date().toISOString(),
      statistics,
      expiredProducts: expiredProducts.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category?.name || 'Без категории',
        expiryDate: formatDate(new Date(product.expiryDate)),
        price: product.price
      })),
      expiringSoonProducts: expiringSoonProducts.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category?.name || 'Без категории',
        expiryDate: formatDate(new Date(product.expiryDate)),
        daysLeft: Math.ceil((new Date(product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)),
        price: product.price
      }))
    };
    
    return report;
  } catch (error) {
    console.error('Ошибка при создании отчета о сроках годности:', error);
    return null;
  }
};

module.exports = {
  checkExpiredProducts,
  checkExpiringSoonProducts,
  getExpiryStatistics,
  generateExpiryReport,
  formatDate
}; 
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const http = require('http');

// Импортируем основной файл сервера
const { app } = require('./index-app');

// Указываем фиксированный порт
const PORT = 5001;

// Создаем HTTP-сервер
const server = http.createServer(app);

// Функция для завершения процесса при ошибке
const handleError = (error) => {
  console.error('Ошибка запуска сервера:', error);
  console.error('Невозможно запустить сервер на порту 5001. Убедитесь, что порт свободен.');
  process.exit(1);
};

// Пытаемся запустить сервер на фиксированном порту 5001
server.listen(PORT, () => {
  console.log(`Сервер успешно запущен на порту ${PORT}`);
  console.log('Для проверки соединения перейдите по адресу: http://localhost:5001/api/test/cors-check');
});

// Обработка ошибок
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Порт ${PORT} уже используется другим процессом.`);
    console.error('Пожалуйста, остановите все процессы, использующие порт 5001:');
    console.error('Linux/Mac: killall node или lsof -ti:5001 | xargs kill');
    console.error('Windows: открыть Task Manager и завершить процессы node.js');
  }
  handleError(error);
}); 
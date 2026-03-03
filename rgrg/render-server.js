// Простой сервер для раздачи localStorage-api.js на Render
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Включаем CORS для доступа с любых доменов
app.use(cors());

// Раздаем статические файлы из текущей директории
app.use(express.static(__dirname));

// Специальный роут для localStorage-api.js
app.get('/localStorage-api.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Кеширование на 1 час
  res.sendFile(path.join(__dirname, 'localStorage-api.js'));
});

// Роут для проверки работоспособности
app.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Server is alive' 
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log('✅ Сервер запущен успешно!');
  console.log('📁 Файл localStorage-api.js доступен по адресу:');
  console.log(`   http://localhost:${PORT}/localStorage-api.js`);
  console.log(`   https://ваш-проект.onrender.com/localStorage-api.js`);
});
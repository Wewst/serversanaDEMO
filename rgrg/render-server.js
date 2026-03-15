// Сервер для раздачи localStorage-api.js И хранения данных на Render
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Включаем CORS для доступа с любых доменов
app.use(cors());
app.use(express.json());

// Путь к файлу данных
const dataFile = path.join(__dirname, 'data.json');

// Инициализация данных
let appData = {
  deals: [],
  tasks: [],
  goals: [],
  users: {},
  adminId: null,
  bonusWithdrawals: {}
};

// Загрузка данных из файла (если существует)
function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf8');
      appData = JSON.parse(data);
      console.log('✅ Данные загружены из файла');
    }
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
  }
}

// Сохранение данных в файл
function saveData() {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(appData, null, 2), 'utf8');
  } catch (error) {
    console.error('Ошибка сохранения данных:', error);
  }
}

// Загружаем данные при старте
loadData();

// Обработчик для OVERSEER (чтобы сервер не засыпал на Render)
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'localStorage-api-server',
    timestamp: new Date().toISOString(),
    message: 'Server is running and ready'
  });
});

// Раздаем статические файлы из текущей директории
app.use(express.static(__dirname));

// Специальный роут для localStorage-api.js
app.get('/localStorage-api.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(__dirname, 'localStorage-api.js'));
});

// ========== API для синхронизации данных ==========

// Получение сделок
app.get('/api/deals', (req, res) => {
  res.json(appData.deals || []);
});

// Сохранение сделок
app.post('/api/deals', (req, res) => {
  try {
    appData.deals = req.body;
    saveData();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение заданий
app.get('/api/tasks', (req, res) => {
  res.json(appData.tasks || []);
});

// Сохранение заданий
app.post('/api/tasks', (req, res) => {
  try {
    appData.tasks = req.body;
    saveData();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение целей
app.get('/api/goals', (req, res) => {
  res.json(appData.goals || []);
});

// Сохранение целей
app.post('/api/goals', (req, res) => {
  try {
    appData.goals = req.body;
    saveData();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение пользователей
app.get('/api/users', (req, res) => {
  res.json(appData.users || {});
});

// Сохранение пользователей
app.post('/api/users', (req, res) => {
  try {
    appData.users = req.body;
    saveData();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение ID админа
app.get('/api/admin-id', (req, res) => {
  res.json({ adminId: appData.adminId });
});

// Сохранение ID админа
app.post('/api/admin-id', (req, res) => {
  try {
    appData.adminId = req.body.adminId;
    saveData();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение выводов бонусов
app.get('/api/bonus-withdrawals', (req, res) => {
  res.json(appData.bonusWithdrawals || {});
});

// Сохранение выводов бонусов
app.post('/api/bonus-withdrawals', (req, res) => {
  try {
    appData.bonusWithdrawals = req.body;
    saveData();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Роут для проверки работоспособности
app.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Server is alive',
    dataLoaded: !!appData
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log('✅ Сервер запущен успешно!');
  console.log('📁 Файл localStorage-api.js доступен по адресу:');
  console.log(`   http://localhost:${PORT}/localStorage-api.js`);
  console.log('📡 API для синхронизации данных доступен по адресу:');
  console.log(`   http://localhost:${PORT}/api/deals`);
});

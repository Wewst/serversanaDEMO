// Общий API для работы с localStorage и синхронизацией через сервер
// Данные хранятся локально для быстрого доступа и синхронизируются с сервером

const DEAL_AMOUNT_ADMIN = 9500;
const DEAL_AMOUNT_TEAM = 2000;

// URL сервера для синхронизации (автоматически определяется или можно задать вручную)
// Если не задан, используется только localStorage
let SYNC_SERVER_URL = null;

// Инициализация URL сервера
(function() {
  // Пытаемся определить URL из скрипта или из переменной окружения
  if (typeof window !== 'undefined') {
    // Проверяем, есть ли переменная с URL сервера
    if (window.LOCAL_STORAGE_API_URL) {
      // Извлекаем базовый URL (убираем /localStorage-api.js)
      SYNC_SERVER_URL = window.LOCAL_STORAGE_API_URL.replace('/localStorage-api.js', '');
    } else {
      // Пытаемся определить из текущего скрипта
      const scripts = document.getElementsByTagName('script');
      for (let i = 0; i < scripts.length; i++) {
        const src = scripts[i].src;
        if (src && src.includes('localStorage-api.js')) {
          SYNC_SERVER_URL = src.replace('/localStorage-api.js', '');
          break;
        }
      }
    }
  }
})();

// Функция синхронизации с сервером
async function syncWithServer(key, data) {
  if (!SYNC_SERVER_URL) return false;
  
  try {
    const endpoint = '/api/' + key.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase();
    const response = await fetch(SYNC_SERVER_URL + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.ok;
  } catch (error) {
    console.error('Ошибка синхронизации с сервером:', error);
    return false;
  }
}

// Функция загрузки с сервера
async function loadFromServer(key) {
  if (!SYNC_SERVER_URL) return null;
  
  try {
    const endpoint = '/api/' + key.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase();
    const response = await fetch(SYNC_SERVER_URL + endpoint);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Ошибка загрузки с сервера:', error);
  }
  return null;
}

// Ключи для localStorage
const STORAGE_KEYS = {
  DEALS: 'golden_traff_deals',
  TASKS: 'golden_traff_tasks',
  GOALS: 'golden_traff_goals',
  USERS: 'golden_traff_users',
  ADMIN_ID: 'golden_traff_admin_id',
  BONUS_WITHDRAWALS: 'golden_traff_bonus_withdrawals'
};

// Утилиты для работы с localStorage
function loadFromStorage(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('Ошибка чтения из localStorage:', error);
    return defaultValue;
  }
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Ошибка записи в localStorage:', error);
    return false;
  }
}

// Функции для работы со сделками
async function loadDeals() {
  // Сначала пытаемся загрузить с сервера для синхронизации
  const serverData = await loadFromServer('deals');
  if (serverData && Array.isArray(serverData)) {
    // Сохраняем локально для быстрого доступа
    saveToStorage(STORAGE_KEYS.DEALS, serverData);
    return serverData;
  }
  // Если сервер недоступен, используем localStorage
  return loadFromStorage(STORAGE_KEYS.DEALS, []);
}

async function saveDeals(deals) {
  const saved = saveToStorage(STORAGE_KEYS.DEALS, deals);
  // Синхронизируем с сервером в фоне
  syncWithServer('deals', deals).catch(() => {});
  return saved;
}

// Функции для работы с заданиями
async function loadTasks() {
  const serverData = await loadFromServer('tasks');
  if (serverData && Array.isArray(serverData)) {
    saveToStorage(STORAGE_KEYS.TASKS, serverData);
    return serverData;
  }
  return loadFromStorage(STORAGE_KEYS.TASKS, []);
}

async function saveTasks(tasks) {
  const saved = saveToStorage(STORAGE_KEYS.TASKS, tasks);
  syncWithServer('tasks', tasks).catch(() => {});
  return saved;
}

// Функции для работы с целями
async function loadGoals() {
  const serverData = await loadFromServer('goals');
  if (serverData && Array.isArray(serverData)) {
    saveToStorage(STORAGE_KEYS.GOALS, serverData);
    return serverData;
  }
  return loadFromStorage(STORAGE_KEYS.GOALS, []);
}

async function saveGoals(goals) {
  const saved = saveToStorage(STORAGE_KEYS.GOALS, goals);
  syncWithServer('goals', goals).catch(() => {});
  return saved;
}

// Функции для работы с пользователями
async function loadUsers() {
  const serverData = await loadFromServer('users');
  if (serverData && typeof serverData === 'object') {
    saveToStorage(STORAGE_KEYS.USERS, serverData);
    return serverData;
  }
  return loadFromStorage(STORAGE_KEYS.USERS, {});
}

async function saveUsers(users) {
  const saved = saveToStorage(STORAGE_KEYS.USERS, users);
  syncWithServer('users', users).catch(() => {});
  return saved;
}

// Функции для работы с ID админа
async function loadAdminId() {
  if (SYNC_SERVER_URL) {
    try {
      const response = await fetch(SYNC_SERVER_URL + '/api/admin-id');
      if (response.ok) {
        const data = await response.json();
        if (data.adminId) {
          saveToStorage(STORAGE_KEYS.ADMIN_ID, data.adminId);
          return data.adminId;
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки adminId с сервера:', error);
    }
  }
  return loadFromStorage(STORAGE_KEYS.ADMIN_ID, null);
}

async function saveAdminId(userId) {
  const saved = saveToStorage(STORAGE_KEYS.ADMIN_ID, userId);
  if (SYNC_SERVER_URL) {
    fetch(SYNC_SERVER_URL + '/api/admin-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: userId })
    }).catch(() => {});
  }
  return saved;
}

// Функции для работы с выводами бонусов
async function loadBonusWithdrawals() {
  const serverData = await loadFromServer('bonus-withdrawals');
  if (serverData && typeof serverData === 'object') {
    saveToStorage(STORAGE_KEYS.BONUS_WITHDRAWALS, serverData);
    return serverData;
  }
  return loadFromStorage(STORAGE_KEYS.BONUS_WITHDRAWALS, {});
}

async function saveBonusWithdrawals(withdrawals) {
  const saved = saveToStorage(STORAGE_KEYS.BONUS_WITHDRAWALS, withdrawals);
  syncWithServer('bonus-withdrawals', withdrawals).catch(() => {});
  return saved;
}

// Вспомогательные функции для расчетов
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function calculateDeductions(amount) {
  const tax = Math.round(amount * 0.06); // 6% налог
  const leads = 500; // Оплата лидам
  const employees = 2000; // Выплата сотрудникам
  const totalDeductions = tax + leads + employees;
  const final = amount - totalDeductions;
  
  return {
    tax,
    leads,
    employees,
    totalDeductions,
    final
  };
}

// Получение данных суммы для админского приложения (с вычетами)
async function getSumData() {
  try {
    const deals = await loadDeals();
    const now = new Date();
    const todayStart = startOfDay(now);
    const monthStart = startOfMonth(now);

    let total = 0, monthSum = 0, daySum = 0;
    let totalTax = 0, monthTax = 0, dayTax = 0;
    let totalLeads = 0, monthLeads = 0, dayLeads = 0;
    let totalEmployees = 0, monthEmployees = 0, dayEmployees = 0;

    for (const d of deals) {
      const amt = DEAL_AMOUNT_ADMIN;
      const t = new Date(d.date).getTime();
      const deductions = calculateDeductions(amt);
      
      total += amt;
      totalTax += deductions.tax;
      totalLeads += deductions.leads;
      totalEmployees += deductions.employees;
      
      if (t >= monthStart) {
        monthSum += amt;
        monthTax += deductions.tax;
        monthLeads += deductions.leads;
        monthEmployees += deductions.employees;
      }
      
      if (t >= todayStart) {
        daySum += amt;
        dayTax += deductions.tax;
        dayLeads += deductions.leads;
        dayEmployees += deductions.employees;
      }
    }

    return {
      total,
      month: monthSum,
      day: daySum,
      totalTax,
      totalLeads,
      totalEmployees,
      totalFinal: total - totalTax - totalLeads - totalEmployees,
      monthTax,
      monthLeads,
      monthEmployees,
      monthFinal: monthSum - monthTax - monthLeads - monthEmployees,
      dayTax,
      dayLeads,
      dayEmployees,
      dayFinal: daySum - dayTax - dayLeads - dayEmployees
    };
  } catch (error) {
    console.error('Ошибка получения данных:', error);
    return {
      total: 0, month: 0, day: 0,
      totalTax: 0, totalLeads: 0, totalEmployees: 0, totalFinal: 0,
      monthTax: 0, monthLeads: 0, monthEmployees: 0, monthFinal: 0,
      dayTax: 0, dayLeads: 0, dayEmployees: 0, dayFinal: 0
    };
  }
}

// Получение данных суммы для командного приложения (без вычетов, с персональной суммой)
async function getTeamSumData(userId) {
  try {
    const deals = await loadDeals();
    const now = new Date();
    const todayStart = startOfDay(now);
    const monthStart = startOfMonth(now);

    let totalAll = 0;
    let totalPersonal = 0;
    let monthAll = 0, dayAll = 0;
    let monthPersonal = 0, dayPersonal = 0;

    for (const d of deals) {
      const t = new Date(d.date).getTime();
      let dealAmount = d.amount || (d.appType === 'admin' ? DEAL_AMOUNT_ADMIN : DEAL_AMOUNT_TEAM);
      
      if (d.appType === 'admin') {
        dealAmount = DEAL_AMOUNT_TEAM;
      }
      
      if (d.status === 'success' && !d.isBonus) {
        totalAll += dealAmount;
        if (t >= monthStart) monthAll += dealAmount;
        if (t >= todayStart) dayAll += dealAmount;
      }
      
      if (userId && d.userId && String(d.userId) === String(userId)) {
        totalPersonal += dealAmount;
        if (t >= monthStart) monthPersonal += dealAmount;
        if (t >= todayStart) dayPersonal += dealAmount;
      }
    }
    
    // Добавляем выведенные бонусы в личный доход
    if (userId) {
      const users = await loadUsers();
      const userData = users[String(userId)];
      if (userData && userData.withdrawnBonuses) {
        totalPersonal += userData.withdrawnBonuses || 0;
      }
    }

    return {
      totalAll,
      monthAll,
      dayAll,
      totalPersonal,
      monthPersonal,
      dayPersonal
    };
  } catch (error) {
    console.error('Ошибка получения данных команды:', error);
    return {
      totalAll: 0, monthAll: 0, dayAll: 0,
      totalPersonal: 0, monthPersonal: 0, dayPersonal: 0
    };
  }
}

// Получение турнирной таблицы (по подтвержденным сделкам и заданиям)
async function getLeaderboard() {
  try {
    const deals = await loadDeals();
    const tasks = await loadTasks();
    const users = await loadUsers();
    const userStats = {};
    
    // Подсчитываем только успешные сделки (исключая бонусы)
    for (const d of deals) {
      if (d.status === 'success' && d.userId && !d.isBonus) {
        const userId = String(d.userId);
        if (!userStats[userId]) {
          const userData = users[userId];
          userStats[userId] = {
            userId: d.userId,
            username: userData ? userData.username : (d.createdBy || d.username || 'Неизвестный'),
            avatar: userData ? userData.avatar : (d.avatar || null),
            dealsCount: 0,
            tasksCount: 0,
            totalAmount: 0
          };
        }
        userStats[userId].dealsCount++;
        userStats[userId].totalAmount += DEAL_AMOUNT_TEAM;
      }
    }
    
    // Подсчитываем подтвержденные задания
    for (const task of tasks) {
      if (task.completedBy && Array.isArray(task.completedBy)) {
        for (const userId of task.completedBy) {
          const userIdStr = String(userId);
          if (!userStats[userIdStr]) {
            const userData = users[userIdStr];
            userStats[userIdStr] = {
              userId: userId,
              username: userData ? userData.username : 'Пользователь',
              avatar: userData ? userData.avatar : null,
              dealsCount: 0,
              tasksCount: 0,
              totalAmount: 0
            };
          }
          userStats[userIdStr].tasksCount++;
        }
      }
    }
    
    // Преобразуем в массив и сортируем
    const leaderboard = Object.values(userStats).sort((a, b) => {
      if (b.dealsCount !== a.dealsCount) {
        return b.dealsCount - a.dealsCount;
      }
      if (b.tasksCount !== a.tasksCount) {
        return b.tasksCount - a.tasksCount;
      }
      return b.totalAmount - a.totalAmount;
    });
    
    return leaderboard;
  } catch (error) {
    console.error('Ошибка получения турнирной таблицы:', error);
    return [];
  }
}

  // Экспорт API для использования в HTML файлах
window.LocalStorageAPI = {
  // URL сервера для синхронизации (можно задать вручную)
  setSyncServerUrl: function(url) {
    SYNC_SERVER_URL = url;
  },
  getSyncServerUrl: function() {
    return SYNC_SERVER_URL;
  },
  // Константы
  DEAL_AMOUNT_ADMIN,
  DEAL_AMOUNT_TEAM,
  
  // Сделки
  loadDeals,
  saveDeals,
  
  // Задания
  loadTasks,
  saveTasks,
  
  // Цели
  loadGoals,
  saveGoals,
  
  // Пользователи
  loadUsers,
  saveUsers,
  
  // Админ ID
  loadAdminId,
  saveAdminId,
  
  // Выводы бонусов
  loadBonusWithdrawals,
  saveBonusWithdrawals,
  
  // Расчеты
  getSumData,
  getTeamSumData,
  getLeaderboard,
  
  // Утилиты
  startOfDay,
  startOfMonth,
  calculateDeductions
};


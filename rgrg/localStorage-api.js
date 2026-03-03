// Общий API для работы с localStorage (заменяет серверные функции)
// Все данные хранятся локально, уведомления отключены

const DEAL_AMOUNT_ADMIN = 9500;
const DEAL_AMOUNT_TEAM = 2000;

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
function loadDeals() {
  return loadFromStorage(STORAGE_KEYS.DEALS, []);
}

function saveDeals(deals) {
  return saveToStorage(STORAGE_KEYS.DEALS, deals);
}

// Функции для работы с заданиями
function loadTasks() {
  return loadFromStorage(STORAGE_KEYS.TASKS, []);
}

function saveTasks(tasks) {
  return saveToStorage(STORAGE_KEYS.TASKS, tasks);
}

// Функции для работы с целями
function loadGoals() {
  return loadFromStorage(STORAGE_KEYS.GOALS, []);
}

function saveGoals(goals) {
  return saveToStorage(STORAGE_KEYS.GOALS, goals);
}

// Функции для работы с пользователями
function loadUsers() {
  return loadFromStorage(STORAGE_KEYS.USERS, {});
}

function saveUsers(users) {
  return saveToStorage(STORAGE_KEYS.USERS, users);
}

// Функции для работы с ID админа
function loadAdminId() {
  return loadFromStorage(STORAGE_KEYS.ADMIN_ID, null);
}

function saveAdminId(userId) {
  return saveToStorage(STORAGE_KEYS.ADMIN_ID, userId);
}

// Функции для работы с выводами бонусов
function loadBonusWithdrawals() {
  return loadFromStorage(STORAGE_KEYS.BONUS_WITHDRAWALS, {});
}

function saveBonusWithdrawals(withdrawals) {
  return saveToStorage(STORAGE_KEYS.BONUS_WITHDRAWALS, withdrawals);
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
function getSumData() {
  try {
    const deals = loadDeals();
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
function getTeamSumData(userId) {
  try {
    const deals = loadDeals();
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
      const users = loadUsers();
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
function getLeaderboard() {
  try {
    const deals = loadDeals();
    const tasks = loadTasks();
    const users = loadUsers();
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


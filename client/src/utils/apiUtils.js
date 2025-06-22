import axios from 'axios';

/**
 * Функция для выполнения запросов с автоматическими повторными попытками и
 * проверкой доступности API на разных портах
 * 
 * @param {string} url - URL запроса (относительный или абсолютный)
 * @param {object} options - Параметры для axios
 * @param {number} maxRetries - Максимальное количество попыток запроса
 * @returns {Promise<any>} - Данные ответа
 */
export const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
  let lastError = null;
  let currentPort = null;
  
  // Проверка соединения через различные порты если базовый URL не работает
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Повторная попытка #${attempt} запроса к ${url}`);
      }
      
      if (attempt === 1 && !currentPort) {
        // Проверим здоровье API через относительный URL
        try {
          await axios.get('/api/health');
          console.log('API доступен через прокси');
          // Если работает, используем текущие настройки
        } catch (healthError) {
          console.log('API недоступен через прокси:', healthError.message);
          // Пробуем напрямую через порты
          for (const port of [5001, 5002, 5003, 5004, 5005]) {
            try {
              console.log(`Проверка API на порту ${port}...`);
              const response = await axios.get(`http://localhost:${port}/api/health`);
              if (response.data.status === 'healthy') {
                console.log(`API найден на порту ${port}`);
                currentPort = port;
                // Устанавливаем базовый URL без префикса /api, так как он будет добавлен в url
                axios.defaults.baseURL = `http://localhost:${port}`;
                break;
              }
            } catch (portError) {
              console.log(`Порт ${port} недоступен:`, portError.message);
            }
          }
        }
      }
      
      // Нормализуем URL запроса, убираем двойной префикс /api/api/
      let requestUrl = url;
      if (url.startsWith('/api/') && axios.defaults.baseURL && 
          axios.defaults.baseURL.includes('localhost')) {
        // Если базовый URL настроен на прямое соединение с сервером,
        // не будем изменять URL, который уже содержит /api/
        requestUrl = url;
      } else if (!url.startsWith('/api/') && !url.startsWith('http')) {
        // Если URL не содержит /api/ и не является абсолютным,
        // добавим префикс /api/
        requestUrl = `/api/${url}`;
      }
      
      // Выполняем основной запрос
      const method = options.method || 'get';
      let response;
      
      if (method.toLowerCase() === 'get') {
        response = await axios.get(requestUrl, options);
      } else if (method.toLowerCase() === 'post') {
        response = await axios.post(requestUrl, options.data, options);
      } else if (method.toLowerCase() === 'put') {
        response = await axios.put(requestUrl, options.data, options);
      } else if (method.toLowerCase() === 'delete') {
        response = await axios.delete(requestUrl, options);
      } else {
        response = await axios(requestUrl, options);
      }
      
      return response.data;
    } catch (error) {
      console.error(`Ошибка при попытке #${attempt + 1}:`, error);
      lastError = error;
      
      // Если ошибка авторизации, не повторяем запрос
      if (error.response && error.response.status === 401) {
        throw error;
      }
      
      // Пауза перед следующей попыткой
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  // Если все попытки не удались, создаем информативную ошибку
  const errorInfo = lastError.response ? {
    status: lastError.response.status,
    data: lastError.response.data,
    message: 'Превышено количество попыток загрузки данных'
  } : {
    message: lastError.message || 'Ошибка соединения с сервером'
  };
  
  throw new Error(JSON.stringify(errorInfo));
};

/**
 * Функция для проверки доступности сервера API
 */
export const checkApiHealth = async () => {
  try {
    const response = await fetchWithRetry('/api/health');
    return {
      healthy: response.status === 'healthy',
      database: response.database === 'connected',
      message: 'API доступен',
      details: response
    };
  } catch (error) {
    return {
      healthy: false,
      database: false,
      message: 'API недоступен',
      error
    };
  }
};

/**
 * Функция для инициализации настроек API
 */
export const initializeApi = async () => {
  const ports = [5001, 5002, 5003, 5004, 5005];
  
  // Сначала проверяем через прокси
  try {
    const response = await axios.get('/api/health');
    if (response.data.status === 'healthy') {
      console.log('API доступен через прокси');
      return true;
    }
  } catch (error) {
    console.log('API недоступен через прокси:', error.message);
  }
  
  // Затем проверяем все порты напрямую
  for (const port of ports) {
    try {
      const response = await axios.get(`http://localhost:${port}/api/health`);
      if (response.data.status === 'healthy') {
        console.log(`API найден на порту ${port}`);
        // Устанавливаем базовый URL без /api
        axios.defaults.baseURL = `http://localhost:${port}`;
        return true;
      }
    } catch (error) {
      // Игнорируем ошибки
    }
  }
  
  console.error('Не удалось подключиться к API ни на одном порту');
  return false;
}; 
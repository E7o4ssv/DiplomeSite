import React, { useState, useEffect, useContext } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { fetchWithRetry } from '../../utils/apiUtils';

const DEFAULT_IMAGE = 'https://via.placeholder.com/100x100?text=Конфетти';

// Функция для форматирования URL изображения
const formatImageUrl = (url) => {
  if (!url || url.trim() === '') return DEFAULT_IMAGE;
  
  try {
    // Удаляем лишние пробелы в начале и конце
    const trimmedUrl = url.trim();
    
    // Если URL начинается с @, значит это внешняя ссылка (убираем @ в начале)
    if (trimmedUrl.startsWith('@')) {
      return trimmedUrl.substring(1);
    }
    
    return trimmedUrl;
  } catch (error) {
    console.error('Ошибка форматирования URL:', error);
    return DEFAULT_IMAGE;
  }
};

// Функция для форматирования даты
const formatDate = (dateString) => {
  if (!dateString) return 'Не указан';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  } catch (error) {
    console.error('Ошибка форматирования даты:', error);
    return 'Ошибка даты';
  }
};

// Функция для проверки истечения срока годности
const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return { status: 'no-date', text: 'Не указан', color: 'gray' };
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { status: 'expired', text: 'Истек', color: 'red' };
  } else if (diffDays <= 7) {
    return { status: 'expiring-soon', text: `Истекает через ${diffDays} дн.`, color: 'orange' };
  } else {
    return { status: 'valid', text: `Истекает ${formatDate(expiryDate)}`, color: 'green' };
  }
};

const AdminProductsPage = () => {
  const { user, isAdmin, loading: authLoading } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Добавляем состояние для отслеживания процесса сохранения
  const [saving, setSaving] = useState(false);
  
  // Состояние для формы добавления/редактирования товара
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' или 'edit'
  const [currentProduct, setCurrentProduct] = useState({
    id: null,
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    categoryId: '',
    expiryDate: ''
  });
  
  // Состояние для отображения предпросмотра изображения
  const [imagePreview, setImagePreview] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !isAdmin()) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Получение категорий с использованием функции fetchWithRetry
        try {
          const categoriesData = await fetchWithRetry('categories');
          setCategories(categoriesData);
        } catch (err) {
          console.error('Ошибка загрузки категорий:', err);
          // Продолжаем загрузку товаров даже при ошибке категорий
        }
        
        // Получение товаров с использованием функции fetchWithRetry
        try {
          const productsData = await fetchWithRetry('products');
          setProducts(productsData);
        } catch (err) {
          console.error('Ошибка загрузки товаров:', err);
          let errorMessage = 'Ошибка загрузки данных. Пожалуйста, попробуйте позже.';
          
          // Пытаемся извлечь более подробную информацию об ошибке
          try {
            const parsedError = JSON.parse(err.message);
            if (parsedError.data && parsedError.data.error) {
              errorMessage = parsedError.data.error;
            } else if (parsedError.message) {
              errorMessage = parsedError.message;
            }
          } catch (parseError) {
            // Если не удалось распарсить, используем исходное сообщение
            errorMessage = err.message || errorMessage;
          }
          
          setError(errorMessage);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Неожиданная ошибка:', err);
        setError('Произошла непредвиденная ошибка. Пожалуйста, обновите страницу.');
        setLoading(false);
      }
    };
    
    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading, isAdmin]);
  
  // Отслеживаем изменение imageUrl для предпросмотра
  useEffect(() => {
    if (currentProduct.imageUrl) {
      try {
        // Проверяем валидность URL
        const url = formatImageUrl(currentProduct.imageUrl);
        
        // Проверяем, начинается ли URL с http:// или https://
        if (url.startsWith('http://') || url.startsWith('https://')) {
          setImagePreview(url);
        } else {
          // Если URL не начинается с http:// или https://, считаем его некорректным
          setImagePreview(DEFAULT_IMAGE);
          
          // Уведомляем пользователя, если URL не начинается с http:// или https://
          if (url !== DEFAULT_IMAGE) {
            setError('URL изображения должен начинаться с http:// или https://');
          }
        }
      } catch (err) {
        console.error('Ошибка обработки URL изображения:', err);
        setImagePreview(DEFAULT_IMAGE);
      }
    } else {
      setImagePreview('');
    }
  }, [currentProduct.imageUrl]);
  
  // Редирект если пользователь не админ
  if (!authLoading && (!user || !isAdmin())) {
    return <Navigate to="/login" replace />;
  }
  
  const openAddForm = () => {
    setCurrentProduct({
      id: null,
      name: '',
      description: '',
      price: '',
      imageUrl: '',
      categoryId: categories.length > 0 ? categories[0].id.toString() : '',
      expiryDate: ''
    });
    setImagePreview('');
    setFormMode('add');
    setIsFormOpen(true);
  };
  
  const openEditForm = (product) => {
    // Форматируем дату для input type="date" (YYYY-MM-DD)
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      } catch (error) {
        console.error('Ошибка форматирования даты:', error);
        return '';
      }
    };

    setCurrentProduct({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      imageUrl: product.imageUrl || '',
      categoryId: product.categoryId.toString(),
      expiryDate: formatDateForInput(product.expiryDate)
    });
    setImagePreview(formatImageUrl(product.imageUrl));
    setFormMode('edit');
    setIsFormOpen(true);
  };
  
  const closeForm = () => {
    setIsFormOpen(false);
    setImagePreview('');
    setError(null);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (error) {
      setError(null);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      let expiryDate = currentProduct.expiryDate;
      if (!expiryDate) {
        expiryDate = null;
      }
      const productData = {
        name: currentProduct.name,
        description: currentProduct.description,
        price: parseFloat(currentProduct.price),
        imageUrl: currentProduct.imageUrl,
        categoryId: parseInt(currentProduct.categoryId),
        expiryDate
      };
      
      if (formMode === 'add') {
        const data = await fetchWithRetry('products', {
          method: 'post',
          data: productData
        });
        
        setProducts(prev => [...prev, data]);
      } else if (formMode === 'edit') {
        const data = await fetchWithRetry(`products/${currentProduct.id}`, {
          method: 'put',
          data: productData
        });
        
        setProducts(prev => 
          prev.map(product => 
            product.id === currentProduct.id ? data : product
          )
        );
      }
      
      closeForm();
    } catch (err) {
      console.error('Ошибка сохранения товара:', err);
      
      let errorMessage = 'Ошибка сохранения товара. Пожалуйста, попробуйте позже.';
      // Пытаемся извлечь более подробную информацию об ошибке
      try {
        const parsedError = JSON.parse(err.message);
        if (parsedError.data && parsedError.data.error) {
          errorMessage = parsedError.data.error;
        } else if (parsedError.message) {
          errorMessage = parsedError.message;
        }
      } catch (parseError) {
        // Если не удалось распарсить, используем исходное сообщение
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async (productId) => {
    if (!window.confirm('Вы действительно хотите удалить этот товар?')) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      await fetchWithRetry(`products/${productId}`, {
        method: 'delete'
      });
      
      setProducts(prev => prev.filter(product => product.id !== productId));
    } catch (err) {
      console.error('Ошибка удаления товара:', err);
      
      let errorMessage = 'Ошибка удаления товара. Пожалуйста, попробуйте позже.';
      // Пытаемся извлечь более подробную информацию об ошибке
      try {
        const parsedError = JSON.parse(err.message);
        if (parsedError.data && parsedError.data.error) {
          errorMessage = parsedError.data.error;
        } else if (parsedError.message) {
          errorMessage = parsedError.message;
        }
      } catch (parseError) {
        // Если не удалось распарсить, используем исходное сообщение
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };
  
  // Обработчик ошибки загрузки изображения
  const handleImageError = (e) => {
    e.target.src = DEFAULT_IMAGE;
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Управление товарами</h1>
        <div className="flex space-x-4">
          <Link 
            to="/admin/expired-products" 
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Контроль сроков годности
          </Link>
          <button
            onClick={openAddForm}
            className="btn btn-primary"
          >
            Добавить товар
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Загрузка товаров...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-600 mb-4">Товаров пока нет. Добавьте первый товар.</p>
          <button
            onClick={openAddForm}
            className="btn btn-primary"
          >
            Добавить товар
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Товар
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Категория
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Цена
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Срок годности
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map(product => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={formatImageUrl(product.imageUrl)}
                          alt={product.name}
                          onError={handleImageError}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {product.description || 'Нет описания'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                      {product.category?.name || 'Без категории'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.price.toFixed(2)} ₽
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const status = getExpiryStatus(product.expiryDate);
                      const colorClasses = {
                        red: 'bg-red-100 text-red-800',
                        orange: 'bg-orange-100 text-orange-800',
                        green: 'bg-green-100 text-green-800',
                        gray: 'bg-gray-100 text-gray-800'
                      };
                      
                      return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[status.color]}`}>
                          {status.text}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditForm(product)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Модальное окно формы добавления/редактирования товара */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {formMode === 'add' ? 'Добавление товара' : 'Редактирование товара'}
              </h3>
            </div>
            
            {error && (
              <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
              <div className="mb-4">
                <label htmlFor="name" className="form-label">
                  Название товара
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={currentProduct.name}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="form-label">
                  Описание
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={currentProduct.description}
                  onChange={handleInputChange}
                  className="form-input"
                  rows="3"
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label htmlFor="price" className="form-label">
                  Цена
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={currentProduct.price}
                  onChange={handleInputChange}
                  className="form-input"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="imageUrl" className="form-label">
                  URL изображения
                </label>
                <input
                  type="text"
                  id="imageUrl"
                  name="imageUrl"
                  value={currentProduct.imageUrl}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="https://example.com/image.jpg или @https://example.com/image.jpg"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Для внешних изображений добавьте символ @ в начале URL (например, @https://example.com/image.jpg)
                </p>
              </div>
              
              {/* Предпросмотр изображения */}
              {imagePreview && (
                <div className="mb-4">
                  <p className="form-label">Предпросмотр</p>
                  <div className="w-32 h-32 rounded-lg border overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Предпросмотр"
                      className="w-full h-full object-cover"
                      onError={() => setImagePreview(DEFAULT_IMAGE)}
                    />
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <label htmlFor="categoryId" className="form-label">
                  Категория
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={currentProduct.categoryId}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="expiryDate" className="form-label">
                  Срок годности
                </label>
                <input
                  type="date"
                  id="expiryDate"
                  name="expiryDate"
                  value={currentProduct.expiryDate}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex items-center justify-center"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {formMode === 'add' ? 'Добавление...' : 'Сохранение...'}
                    </>
                  ) : (
                    formMode === 'add' ? 'Добавить' : 'Сохранить'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <Link to="/admin/categories" className="text-pink-600 hover:text-pink-700">
          Перейти к управлению категориями →
        </Link>
      </div>
    </div>
  );
};

export default AdminProductsPage; 
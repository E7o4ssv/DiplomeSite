import React, { useState, useEffect, useContext } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { fetchWithRetry } from '../../utils/apiUtils';

const AdminCategoriesPage = () => {
  const { user, isAdmin, loading: authLoading } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingInProgress, setSavingInProgress] = useState(false);
  
  // Состояние для формы добавления/редактирования категории
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' или 'edit'
  const [currentCategory, setCurrentCategory] = useState({
    id: null,
    name: ''
  });
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !isAdmin()) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Получение категорий с использованием функции с повторами
        try {
          const categoriesData = await fetchWithRetry('categories');
          setCategories(categoriesData);
        } catch (err) {
          console.error('Ошибка загрузки категорий:', err);
          
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
  
  // Редирект если пользователь не админ
  if (!authLoading && (!user || !isAdmin())) {
    return <Navigate to="/login" replace />;
  }
  
  const openAddForm = () => {
    setCurrentCategory({
      id: null,
      name: ''
    });
    setFormMode('add');
    setIsFormOpen(true);
  };
  
  const openEditForm = (category) => {
    setCurrentCategory({
      id: category.id,
      name: category.name
    });
    setFormMode('edit');
    setIsFormOpen(true);
  };
  
  const closeForm = () => {
    setIsFormOpen(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCategory(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSavingInProgress(true);
      setError(null);
      
      const categoryData = {
        name: currentCategory.name
      };
      
      if (formMode === 'add') {
        const data = await fetchWithRetry('categories', {
          method: 'post',
          data: categoryData
        });
        setCategories(prev => [...prev, data]);
      } else if (formMode === 'edit') {
        const data = await fetchWithRetry(`categories/${currentCategory.id}`, {
          method: 'post',
          data: categoryData
        });
        setCategories(prev => 
          prev.map(category => 
            category.id === currentCategory.id ? data : category
          )
        );
      }
      
      closeForm();
    } catch (err) {
      console.error('Ошибка сохранения категории:', err);
      
      let errorMessage = 'Ошибка сохранения категории. Пожалуйста, попробуйте позже.';
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
      setSavingInProgress(false);
    }
  };
  
  const handleDelete = async (categoryId) => {
    if (!window.confirm('Вы действительно хотите удалить эту категорию? Все товары в этой категории также будут удалены.')) {
      return;
    }
    
    try {
      setSavingInProgress(true);
      setError(null);
      
      await fetchWithRetry(`categories/${categoryId}`, {
        method: 'delete'
      });
      setCategories(prev => prev.filter(category => category.id !== categoryId));
    } catch (err) {
      console.error('Ошибка удаления категории:', err);
      
      let errorMessage = 'Ошибка удаления категории. Пожалуйста, попробуйте позже.';
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
      setSavingInProgress(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Управление категориями</h1>
        <button
          onClick={openAddForm}
          className="btn btn-primary"
          disabled={savingInProgress}
        >
          Добавить категорию
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Загрузка категорий...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-600 mb-4">Категорий пока нет. Добавьте первую категорию.</p>
          <button
            onClick={openAddForm}
            className="btn btn-primary"
            disabled={savingInProgress}
          >
            Добавить категорию
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Количество товаров
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map(category => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {category.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.products?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditForm(category)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      disabled={savingInProgress}
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={savingInProgress}
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
      
      {/* Модальное окно формы добавления/редактирования категории */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {formMode === 'add' ? 'Добавление категории' : 'Редактирование категории'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
              <div className="mb-4">
                <label htmlFor="name" className="form-label">
                  Название категории
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={currentCategory.name}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  disabled={savingInProgress}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="btn btn-secondary"
                  disabled={savingInProgress}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingInProgress}
                >
                  {savingInProgress ? (
                    <span className="flex items-center">
                      <span className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Сохранение...
                    </span>
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
        <Link to="/admin/products" className="text-pink-600 hover:text-pink-700">
          ← Вернуться к управлению товарами
        </Link>
      </div>
    </div>
  );
};

export default AdminCategoriesPage; 
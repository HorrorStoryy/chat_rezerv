import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface Employee {
  id: string;
  created_at: string;
  email: string;
  name: string;
  role: string;
}

interface AdminPageProps {
  onBackToChat: () => void;
  onLogout: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBackToChat, onLogout }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'employee'>('employee');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading employees:', error);
      setError('Ошибка загрузки сотрудников: ' + error.message);
    } else {
      setEmployees(data || []);
      setError(null);
    }
    setLoading(false);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    // Создаём пользователя через Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
    });

    if (authError) {
      setError('Ошибка создания пользователя: ' + authError.message);
      setCreating(false);
      return;
    }

    if (!authData.user) {
      setError('Не удалось создать пользователя');
      setCreating(false);
      return;
    }

    // Добавляем запись в таблицу employees
    const { error: dbError } = await supabase.from('employees').insert({
      id: authData.user.id,
      email: newEmail,
      name: newName,
      role: newRole,
    });

    if (dbError) {
      setError('Ошибка сохранения в базу: ' + dbError.message);
      // Пытаемся удалить созданного пользователя
      await supabase.auth.admin.deleteUser(authData.user.id);
      setCreating(false);
      return;
    }

    // Успех
    setNewEmail('');
    setNewName('');
    setNewPassword('');
    setNewRole('employee');
    setShowCreateForm(false);
    setCreating(false);
    loadEmployees();
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (!window.confirm(`Удалить сотрудника ${employee.name} (${employee.email})?`)) {
      return;
    }

    // Удаляем из таблицы employees
    const { error: dbError } = await supabase
      .from('employees')
      .delete()
      .eq('id', employee.id);

    if (dbError) {
      setError('Ошибка удаления: ' + dbError.message);
      return;
    }

    // Удаляем пользователя из Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(employee.id);

    if (authError) {
      console.error('Ошибка удаления пользователя из Auth:', authError);
      // Не показываем ошибку, так как запись уже удалена из БД
    }

    loadEmployees();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToChat}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-bold text-gray-800">Панель администратора</h1>
        </div>
        <button
          onClick={onLogout}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Выйти
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Сотрудники</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить сотрудника
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
            <h3 className="font-medium text-gray-800 mb-4">Новый сотрудник</h3>
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Иван Иванов"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Пароль
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Минимум 6 символов"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Роль
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'employee')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="employee">Сотрудник</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {creating ? 'Создание...' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Employees List */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">Загрузка...</div>
        ) : employees.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>Нет сотрудников</p>
          </div>
        ) : (
          <div className="space-y-3">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-800">{emp.name}</h4>
                    {emp.role === 'admin' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        Админ
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{emp.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Добавлен: {new Date(emp.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteEmployee(emp)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                  title="Удалить"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

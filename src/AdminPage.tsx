import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface Employee {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
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
      setError('Ошибка загрузки: ' + error.message);
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

    // Создаём пользователя
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
    });

    if (authError) {
      setError('Ошибка создания: ' + authError.message);
      setCreating(false);
      return;
    }

    if (!authData.user) {
      setError('Не удалось создать пользователя');
      setCreating(false);
      return;
    }

    // Добавляем в таблицу employees
    const { error: dbError } = await supabase.from('employees').insert({
      id: authData.user.id,
      email: newEmail,
      name: newName,
      role: newRole,
    });

    if (dbError) {
      setError('Ошибка сохранения: ' + dbError.message);
      setCreating(false);
      return;
    }

    setNewEmail('');
    setNewName('');
    setNewPassword('');
    setNewRole('employee');
    setShowCreateForm(false);
    setCreating(false);
    loadEmployees();
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (!window.confirm(`Удалить ${employee.name}?`)) return;

    await supabase.from('employees').delete().eq('id', employee.id);
    loadEmployees();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBackToChat} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            ←
          </button>
          <h1 className="font-bold text-gray-800">Панель администратора</h1>
        </div>
        <button onClick={onLogout} className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 rounded-lg">
          Выйти
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Сотрудники</h2>
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
            + Добавить
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl">
            <h3 className="font-medium mb-4">Новый сотрудник</h3>
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Имя" className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required placeholder="Email" className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="Пароль (мин. 6 символов)" className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)} className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                <option value="employee">Сотрудник</option>
                <option value="admin">Администратор</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" disabled={creating} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                  {creating ? 'Создание...' : 'Создать'}
                </button>
                <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Отмена</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Загрузка...</div>
        ) : (
          <div className="space-y-3">
            {employees.map(emp => (
              <div key={emp.id} className="p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{emp.name}</h4>
                    {emp.role === 'admin' && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Админ</span>}
                  </div>
                  <p className="text-sm text-gray-500">{emp.email}</p>
                </div>
                <button onClick={() => handleDeleteEmployee(emp)} className="text-red-600 hover:text-red-800">🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

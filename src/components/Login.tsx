import React from 'react';
import { Employee } from '../types';

interface LoginProps {
  employees: Employee[];
  onLogin: (employee: Employee) => void;
}

export const Login: React.FC<LoginProps> = ({ employees, onLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Чат поддержки</h1>
          <p className="text-gray-500 mt-2">Выберите свою учетную запись для входа</p>
        </div>
        
        <div className="space-y-3">
          {employees.map((emp) => (
            <button
              key={emp.id}
              onClick={() => onLogin(emp)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all duration-200 group"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                style={{ backgroundColor: emp.color }}
              >
                {emp.avatar}
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800 group-hover:text-indigo-700">{emp.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-400">Сотрудник поддержки</p>
                  {emp.role === 'admin' && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Админ</span>
                  )}
                  {emp.role === 'editor' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Редактор</span>
                  )}
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

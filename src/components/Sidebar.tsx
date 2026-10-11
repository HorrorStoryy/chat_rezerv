import React, { useState } from 'react';
import { Chat, Employee } from '../types';

interface SidebarProps {
  chat: Chat;
  employees: Employee[];
  onUpdateChat: (chat: Chat) => void;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ chat, employees, onUpdateChat, onClose }) => {
  const [companyName, setCompanyName] = useState(chat.companyName);
  const [companyLink, setCompanyLink] = useState(chat.companyLink);
  const [comments, setComments] = useState(chat.comments);
  const [isEditing, setIsEditing] = useState(false);

  const assignedEmployee = employees.find((e) => e.id === chat.assignedTo);
  const creatorEmployee = employees.find((e) => e.id === chat.createdBy);

  const handleSave = () => {
    onUpdateChat({
      ...chat,
      companyName,
      companyLink,
      comments,
      updatedAt: Date.now(),
    });
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setCompanyName(chat.companyName);
    setCompanyLink(chat.companyLink);
    setComments(chat.comments);
    setIsEditing(true);
  };

  return (
    <div className="w-72 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-sm">Информация</h3>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Chat Number */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Номер чата</label>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg font-bold text-indigo-600">#{chat.number}</span>
            {chat.isShared && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                В общих
              </span>
            )}
          </div>
        </div>

        {/* Assigned Employee */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Назначен на</label>
          {assignedEmployee ? (
            <div className="mt-1 flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                style={{ backgroundColor: assignedEmployee.color }}
              >
                {assignedEmployee.avatar}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{assignedEmployee.name}</p>
                <p className="text-xs text-gray-400">Сотрудник</p>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-400">Не назначен</p>
          )}
        </div>

        {/* Creator */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Создал</label>
          {creatorEmployee && (
            <div className="mt-1 flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                style={{ backgroundColor: creatorEmployee.color }}
              >
                {creatorEmployee.avatar}
              </div>
              <p className="text-sm text-gray-700">{creatorEmployee.name}</p>
            </div>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* Company Info */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Компания
            </label>
            {!isEditing && (
              <button
                onClick={handleStartEdit}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Редактировать
              </button>
            )}
          </div>

          {!isEditing ? (
            <div className="mt-2 space-y-3">
              <div>
                <p className="text-xs text-gray-400">Название</p>
                <p className="text-sm text-gray-800 font-medium">
                  {chat.companyName || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Ссылка на сотрудника, который обращается в чат</p>
                {chat.companyLink ? (
                  <a
                    href={chat.companyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:underline break-all"
                  >
                    {chat.companyLink}
                  </a>
                ) : (
                  <p className="text-sm text-gray-400">—</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400">Комментарии</p>
                <p className="text-sm text-gray-700 mt-0.5">
                  {chat.comments || 'Нет комментариев'}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-3">
              <div>
                <label className="text-xs text-gray-500">Название компании</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="ООО «Компания»"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Ссылка на сотрудника, который обращается в чат</label>
                <input
                  type="url"
                  value={companyLink}
                  onChange={(e) => setCompanyLink(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Комментарии</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  rows={3}
                  placeholder="Заметки по клиенту..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Сохранить
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* Stats */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Статистика</label>
          <div className="mt-2 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Сообщений</span>
              <span className="font-medium text-gray-800">
                {chat.messages.filter((m) => m.type !== 'system').length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Участников</span>
              <span className="font-medium text-gray-800">
                {new Set(chat.messages.filter(m => m.type !== 'system').map(m => m.authorId)).size}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Создан</span>
              <span className="font-medium text-gray-800">
                {new Date(chat.createdAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

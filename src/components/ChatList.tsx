import React, { useState } from 'react';
import { Chat, Employee } from '../types';

interface ChatListProps {
  chats: Chat[];
  currentUser: Employee;
  employees: Employee[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCreateChat: () => void;
  onSearch: (query: string) => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  currentUser,
  employees,
  selectedChatId,
  onSelectChat,
  onCreateChat,
  onSearch,
}) => {
  const [activeTab, setActiveTab] = useState<'my' | 'shared' | 'closed' | 'all'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStats, setShowStats] = useState(false);

  const myChats = chats.filter(
    (c) => c.assignedTo === currentUser.id && !c.isShared && !c.isClosed
  );
  const sharedChats = chats.filter((c) => c.isShared && !c.isClosed);
  const closedChats = chats.filter((c) => c.isClosed);
  const allChats = chats.filter((c) => !c.isClosed);

  const displayChats = 
    activeTab === 'my' ? myChats : 
    activeTab === 'shared' ? sharedChats : 
    activeTab === 'closed' ? closedChats : 
    allChats;

  const filteredChats = displayChats.filter((chat) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    
    // Поиск по номеру чата
    if (chat.number.toString().includes(q)) return true;
    
    // Поиск по названию компании
    if (chat.companyName.toLowerCase().includes(q)) return true;
    
    // Поиск по заголовку
    if (chat.title.toLowerCase().includes(q)) return true;
    
    // Поиск по имени назначенного сотрудника
    const assignedEmp = employees.find(e => e.id === chat.assignedTo);
    if (assignedEmp && assignedEmp.name.toLowerCase().includes(q)) return true;
    
    // Поиск по содержимому сообщений
    const hasMatchInMessages = chat.messages.some((msg) => {
      if (msg.type === 'system') return false;
      if (msg.isDeleted) return false;
      const temp = document.createElement('div');
      temp.innerHTML = msg.content;
      const text = temp.textContent || temp.innerText || '';
      return text.toLowerCase().includes(q);
    });
    
    return hasMatchInMessages;
  });

  const getLastMessage = (chat: Chat) => {
    const msgs = chat.messages.filter((m) => m.type !== 'system' && !m.isDeleted);
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  };

  const getPlainText = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  // Статистика по сотрудникам
  const getEmployeeStats = () => {
    return employees.map(emp => {
      const empChats = chats.filter(c => c.assignedTo === emp.id && !c.isClosed);
      return {
        employee: emp,
        activeChats: empChats.length,
      };
    }).sort((a, b) => b.activeChats - a.activeChats);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800">Чаты</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center transition-colors"
              title="Статистика сотрудников"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            <button
              onClick={onCreateChat}
              className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center transition-colors"
              title="Создать новый чат"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-2">Нагрузка сотрудников:</p>
            <div className="space-y-2">
              {getEmployeeStats().map(({ employee, activeChats }) => (
                <div key={employee.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                      style={{ backgroundColor: employee.color }}
                    >
                      {employee.avatar}
                    </div>
                    <span className="text-xs text-gray-700">{employee.name}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {activeChats} {activeChats === 1 ? 'чат' : activeChats < 5 ? 'чата' : 'чатов'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Search */}
        <div className="relative">
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Поиск по номеру, компании, тексту..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
          />
        </div>

        {/* Tabs */}
        <div className="flex mt-3 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'my'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Мои ({myChats.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Все ({allChats.length})
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'shared'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Общие ({sharedChats.length})
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'closed'
                ? 'bg-white text-gray-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Закрытые ({closedChats.length})
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">
            {activeTab === 'my' ? 'Нет чатов. Создайте новый!' : 
             activeTab === 'all' ? 'Нет активных чатов' :
             activeTab === 'shared' ? 'Нет общих чатов' : 
             'Нет закрытых чатов'}
          </div>
        ) : (
          filteredChats.map((chat) => {
            const lastMsg = getLastMessage(chat);
            const assignedEmp = employees.find(e => e.id === chat.assignedTo);
            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  selectedChatId === chat.id ? 'bg-indigo-50 border-l-3 border-l-indigo-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-gray-800">
                    #{chat.number}
                  </span>
                  <div className="flex gap-1">
                    {chat.isClosed && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        Закрыт
                      </span>
                    )}
                    {chat.isShared && !chat.isClosed && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Общий
                      </span>
                    )}
                  </div>
                </div>
                {chat.companyName && (
                  <p className="text-xs text-gray-500 mb-1">{chat.companyName}</p>
                )}
                {activeTab === 'all' && assignedEmp && (
                  <div className="flex items-center gap-1 mb-1">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-semibold"
                      style={{ backgroundColor: assignedEmp.color }}
                    >
                      {assignedEmp.avatar}
                    </div>
                    <span className="text-xs text-gray-500">{assignedEmp.name}</span>
                  </div>
                )}
                {lastMsg && (
                  <p className="text-xs text-gray-400 truncate">
                    {lastMsg.type === 'image' ? '📷 Фото' : getPlainText(lastMsg.content).substring(0, 50)}
                  </p>
                )}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-300">
                    {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  <span className="text-xs text-gray-400">
                    {chat.messages.filter(m => m.type !== 'system' && !m.isDeleted).length} сообщ.
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

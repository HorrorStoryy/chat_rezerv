import React, { useState } from 'react';
import { Chat, Employee } from '../types';

interface ChatListProps {
  chats: Chat[];
  currentUser: Employee;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCreateChat: () => void;
  onSearch: (query: string) => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  currentUser,
  selectedChatId,
  onSelectChat,
  onCreateChat,
  onSearch,
}) => {
  const [activeTab, setActiveTab] = useState<'my' | 'shared'>('my');
  const [searchQuery, setSearchQuery] = useState('');

  const myChats = chats.filter(
    (c) => c.assignedTo === currentUser.id && !c.isShared
  );
  const sharedChats = chats.filter((c) => c.isShared);

  const displayChats = activeTab === 'my' ? myChats : sharedChats;

  const filteredChats = displayChats.filter((chat) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      chat.title.toLowerCase().includes(q) ||
      chat.companyName.toLowerCase().includes(q) ||
      chat.number.toString().includes(q)
    );
  });

  const getLastMessage = (chat: Chat) => {
    const msgs = chat.messages.filter((m) => m.type !== 'system');
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

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800">Чаты</h2>
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
        
        {/* Search */}
        <div className="relative">
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Поиск по чатам..."
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
            Мои чаты ({myChats.length})
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
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">
            {activeTab === 'my' ? 'Нет чатов. Создайте новый!' : 'Нет общих чатов'}
          </div>
        ) : (
          filteredChats.map((chat) => {
            const lastMsg = getLastMessage(chat);
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
                  {chat.isShared && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      Общий
                    </span>
                  )}
                </div>
                {chat.companyName && (
                  <p className="text-xs text-gray-500 mb-1">{chat.companyName}</p>
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
                    {chat.messages.filter(m => m.type !== 'system').length} сообщ.
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

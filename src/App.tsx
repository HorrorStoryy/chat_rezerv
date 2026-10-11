import React, { useState, useEffect, useCallback } from 'react';
import { Employee, Chat, Message, AppState, Template } from './types';
import { loadState, saveState, createChat, createMessage } from './store';
import { Login } from './components/Login';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { Sidebar } from './components/Sidebar';
import { TemplateManager } from './components/TemplateManager';

function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Save state on changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  const currentUser = state.currentUser;
  const employees = state.employees;
  const chats = state.chats;
  const selectedChat = chats.find((c) => c.id === selectedChatId) || null;

  const handleLogin = useCallback((employee: Employee) => {
    setState((prev) => ({ ...prev, currentUser: employee }));
  }, []);

  const handleLogout = useCallback(() => {
    setState((prev) => ({ ...prev, currentUser: null }));
    setSelectedChatId(null);
  }, []);

  const handleCreateChat = useCallback(() => {
    if (!currentUser) return;
    setState((prev) => {
      const { chat, nextChatNumber } = createChat(currentUser, prev.nextChatNumber);
      // Select new chat after state update
      setTimeout(() => setSelectedChatId(chat.id), 0);
      return {
        ...prev,
        chats: [...prev.chats, chat],
        nextChatNumber,
      };
    });
  }, [currentUser]);

  const handleSendMessage = useCallback((message: Message) => {
    setState((prev) => ({
      ...prev,
      chats: prev.chats.map((chat) =>
        chat.id === message.chatId
          ? {
              ...chat,
              messages: [...chat.messages, message],
              updatedAt: Date.now(),
            }
          : chat
      ),
    }));
  }, []);

  const handleShareChat = useCallback((chatId: string) => {
    setState((prev) => ({
      ...prev,
      chats: prev.chats.map((chat) => {
        if (chat.id !== chatId) return chat;
        const systemMsg: Message = {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
          chatId,
          authorId: 'system',
          authorName: 'Система',
          content: `Чат #${chat.number} перемещён в общую папку сотрудником <strong>${prev.currentUser?.name}</strong>`,
          timestamp: Date.now(),
          type: 'system',
        };
        return {
          ...chat,
          isShared: true,
          assignedTo: null,
          messages: [...chat.messages, systemMsg],
          updatedAt: Date.now(),
        };
      }),
    }));
  }, []);

  const handleTakeChat = useCallback((chatId: string) => {
    if (!currentUser) return;
    setState((prev) => ({
      ...prev,
      chats: prev.chats.map((chat) => {
        if (chat.id !== chatId) return chat;
        const systemMsg: Message = {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
          chatId,
          authorId: 'system',
          authorName: 'Система',
          content: `Чат #${chat.number} взят в работу сотрудником <strong>${currentUser.name}</strong>`,
          timestamp: Date.now(),
          type: 'system',
        };
        return {
          ...chat,
          isShared: false,
          assignedTo: currentUser.id,
          messages: [...chat.messages, systemMsg],
          updatedAt: Date.now(),
        };
      }),
    }));
  }, [currentUser]);

  const handleUpdateChat = useCallback((updatedChat: Chat) => {
    setState((prev) => ({
      ...prev,
      chats: prev.chats.map((chat) =>
        chat.id === updatedChat.id ? updatedChat : chat
      ),
    }));
  }, []);

  const handleCloseChat = useCallback((chatId: string) => {
    setState((prev) => ({
      ...prev,
      chats: prev.chats.map((chat) => {
        if (chat.id !== chatId) return chat;
        const systemMsg: Message = {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
          chatId,
          authorId: 'system',
          authorName: 'Система',
          content: `Чат #${chat.number} закрыт сотрудником <strong>${prev.currentUser?.name}</strong>`,
          timestamp: Date.now(),
          type: 'system',
        };
        return {
          ...chat,
          isClosed: true,
          closedAt: Date.now(),
          messages: [...chat.messages, systemMsg],
          updatedAt: Date.now(),
        };
      }),
    }));
  }, []);

  const handleReopenChat = useCallback((chatId: string) => {
    setState((prev) => ({
      ...prev,
      chats: prev.chats.map((chat) => {
        if (chat.id !== chatId) return chat;
        const systemMsg: Message = {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
          chatId,
          authorId: 'system',
          authorName: 'Система',
          content: `Чат #${chat.number} переоткрыт сотрудником <strong>${prev.currentUser?.name}</strong>`,
          timestamp: Date.now(),
          type: 'system',
        };
        return {
          ...chat,
          isClosed: false,
          closedAt: undefined,
          assignedTo: prev.currentUser?.id || chat.assignedTo,
          messages: [...chat.messages, systemMsg],
          updatedAt: Date.now(),
        };
      }),
    }));
  }, []);

  const handleDeleteMessage = useCallback((chatId: string, messageId: string) => {
    setState((prev) => ({
      ...prev,
      chats: prev.chats.map((chat) => {
        if (chat.id !== chatId) return chat;
        return {
          ...chat,
          messages: chat.messages.map((msg) => {
            if (msg.id !== messageId) return msg;
            return {
              ...msg,
              isDeleted: true,
              deletedBy: prev.currentUser?.id,
              deletedByName: prev.currentUser?.name,
              deletedAt: Date.now(),
            };
          }),
          updatedAt: Date.now(),
        };
      }),
    }));
  }, []);

  const handleToggleImportant = useCallback((chatId: string, messageId: string) => {
    setState((prev) => ({
      ...prev,
      chats: prev.chats.map((chat) => {
        if (chat.id !== chatId) return chat;
        return {
          ...chat,
          messages: chat.messages.map((msg) => {
            if (msg.id !== messageId) return msg;
            return {
              ...msg,
              isImportant: !msg.isImportant,
            };
          }),
          updatedAt: Date.now(),
        };
      }),
    }));
  }, []);

  const [showTemplateManager, setShowTemplateManager] = useState(false);

  const canManageTemplates = currentUser?.role === 'admin' || currentUser?.role === 'editor';

  const handleAddTemplate = useCallback((title: string, content: string) => {
    setState((prev) => {
      const newTemplate: Template = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
        title,
        content,
        createdBy: prev.currentUser?.id || '',
        createdByName: prev.currentUser?.name || '',
        createdAt: Date.now(),
      };
      return {
        ...prev,
        templates: [...prev.templates, newTemplate],
      };
    });
  }, []);

  const handleEditTemplate = useCallback((id: string, title: string, content: string) => {
    setState((prev) => ({
      ...prev,
      templates: prev.templates.map((tpl) =>
        tpl.id === id
          ? { ...tpl, title, content, updatedAt: Date.now() }
          : tpl
      ),
    }));
  }, []);

  const handleDeleteTemplate = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      templates: prev.templates.filter((tpl) => tpl.id !== id),
    }));
  }, []);

  // Login screen
  if (!currentUser) {
    return <Login employees={employees} onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="font-bold text-gray-800 text-sm">Чат Поддержки</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.avatar}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">{currentUser.name}</span>
              {currentUser.role === 'admin' && (
                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Админ</span>
              )}
              {currentUser.role === 'editor' && (
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Редактор</span>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Выйти
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Chat List */}
        <ChatList
          chats={chats}
          currentUser={currentUser}
          employees={employees}
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
          onCreateChat={handleCreateChat}
          onSearch={() => {}}
        />

        {/* Chat Window */}
        {selectedChat ? (
          <>
            <ChatWindow
              chat={selectedChat}
              currentUser={currentUser}
              employees={employees}
              templates={state.templates}
              onSendMessage={handleSendMessage}
              onShareChat={handleShareChat}
              onTakeChat={handleTakeChat}
              onCloseChat={handleCloseChat}
              onReopenChat={handleReopenChat}
              onUpdateChat={handleUpdateChat}
              onDeleteMessage={handleDeleteMessage}
              onToggleImportant={handleToggleImportant}
              onManageTemplates={() => setShowTemplateManager(true)}
              canManageTemplates={canManageTemplates}
            />
            {showSidebar && (
              <Sidebar
                chat={selectedChat}
                employees={employees}
                onUpdateChat={handleUpdateChat}
                onClose={() => setShowSidebar(false)}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-500">Выберите чат</h3>
              <p className="text-sm text-gray-400 mt-1">
                Или создайте новый, нажав «+» в списке чатов
              </p>
            </div>
          </div>
        )}

        {/* Sidebar Toggle */}
        {selectedChat && !showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-gray-200 rounded-l-lg flex items-center justify-center hover:bg-gray-50"
            style={{ right: 0 }}
          >
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Template Manager Modal */}
      {showTemplateManager && canManageTemplates && (
        <TemplateManager
          templates={state.templates}
          currentUser={currentUser}
          onAddTemplate={handleAddTemplate}
          onEditTemplate={handleEditTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onClose={() => setShowTemplateManager(false)}
        />
      )}
    </div>
  );
}

export default App;

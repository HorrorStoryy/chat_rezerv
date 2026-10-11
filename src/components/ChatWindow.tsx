import React, { useRef, useEffect, useState } from 'react';
import { Chat, Employee, Message, Template } from '../types';
import { formatTime, formatFullDate, createMessage } from '../store';
import { RichTextEditor } from './RichTextEditor';

interface ChatWindowProps {
  chat: Chat;
  currentUser: Employee;
  employees: Employee[];
  templates: Template[];
  onSendMessage: (message: Message) => void;
  onShareChat: (chatId: string) => void;
  onTakeChat: (chatId: string) => void;
  onCloseChat: (chatId: string) => void;
  onReopenChat: (chatId: string) => void;
  onUpdateChat: (chat: Chat) => void;
  onDeleteMessage: (chatId: string, messageId: string) => void;
  onToggleImportant: (chatId: string, messageId: string) => void;
  onManageTemplates?: () => void;
  canManageTemplates?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  chat,
  currentUser,
  employees,
  templates,
  onSendMessage,
  onShareChat,
  onTakeChat,
  onCloseChat,
  onReopenChat,
  onUpdateChat,
  onDeleteMessage,
  onToggleImportant,
  onManageTemplates,
  canManageTemplates,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  const getAuthorColor = (authorId: string): string => {
    const emp = employees.find((e) => e.id === authorId);
    return emp?.color || '#6b7280';
  };

  const handleSend = (html: string, text: string) => {
    const msg = createMessage(chat.id, currentUser, html, 'text');
    onSendMessage(msg);
  };

  const isOwnMessage = (msg: Message) => msg.authorId === currentUser.id;
  const canManageMessages = chat.assignedTo === currentUser.id;

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-bold text-gray-800">
            Чат #{chat.number}
            {chat.companyName && (
              <span className="ml-2 text-sm font-normal text-gray-500">— {chat.companyName}</span>
            )}
          </h3>
          <p className="text-xs text-gray-400">
            Создан: {formatFullDate(chat.createdAt)}
            {chat.assignedTo && (
              <span className="ml-2">
                | Назначен: {employees.find(e => e.id === chat.assignedTo)?.name || 'Не назначен'}
              </span>
            )}
            {chat.isClosed && chat.closedAt && (
              <span className="ml-2 text-red-500">
                | Закрыт: {formatFullDate(chat.closedAt)}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {!chat.isClosed && (
            <>
              {!chat.isShared ? (
                <button
                  onClick={() => onShareChat(chat.id)}
                  className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                  title="Переместить в общую папку"
                >
                  📂 В общие
                </button>
              ) : (
                chat.assignedTo !== currentUser.id && (
                  <button
                    onClick={() => onTakeChat(chat.id)}
                    className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                    title="Взять чат в работу"
                  >
                    ✋ Взять в работу
                  </button>
                )
              )}
              <button
                onClick={() => onCloseChat(chat.id)}
                className="px-3 py-1.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                title="Закрыть чат"
              >
                🔒 Закрыть
              </button>
            </>
          )}
          {chat.isClosed && (
            <button
              onClick={() => onReopenChat(chat.id)}
              className="px-3 py-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              title="Переоткрыть чат"
            >
              🔓 Переоткрыть
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chat.messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="flex justify-center">
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {msg.content}
                </span>
              </div>
            );
          }

          const own = isOwnMessage(msg);
          
          // Deleted message
          if (msg.isDeleted) {
            return (
              <div key={msg.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${own ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-center gap-2 mb-1 ${own ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs font-medium" style={{ color: getAuthorColor(msg.authorId) }}>
                      {msg.authorName}
                    </span>
                    <span className="text-xs text-gray-300">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className="rounded-2xl px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-bl-md">
                    <div className="flex items-center gap-2 text-sm text-gray-400 italic">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Сообщение удалено</span>
                      {msg.deletedByName && (
                        <span className="text-xs">
                          ({msg.deletedByName}, {msg.deletedAt ? formatTime(msg.deletedAt) : ''})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div 
              key={msg.id} 
              className={`flex ${own ? 'justify-end' : 'justify-start'} group`}
              onMouseEnter={() => setHoveredMessageId(msg.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              <div className={`max-w-[70%] ${own ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-center gap-2 mb-1 ${own ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-xs font-medium" style={{ color: getAuthorColor(msg.authorId) }}>
                    {msg.authorName}
                  </span>
                  <span className="text-xs text-gray-300">{formatTime(msg.timestamp)}</span>
                  {msg.isImportant && (
                    <span className="text-xs text-amber-600 font-medium">⭐ Важно</span>
                  )}
                </div>
                <div className="relative">
                  <div
                    className={`rounded-2xl px-4 py-2.5 ${
                      msg.isImportant
                        ? 'bg-amber-50 border-2 border-amber-300 rounded-bl-md'
                        : own
                        ? 'bg-amber-50 border border-amber-200 text-gray-800 rounded-br-md'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                    }`}
                  >
                    {msg.type === 'image' && msg.imageUrl ? (
                      <img
                        src={msg.imageUrl}
                        alt={msg.content}
                        className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90"
                        onClick={() => window.open(msg.imageUrl, '_blank')}
                      />
                    ) : (
                      <div
                        className={`text-sm leading-relaxed break-words message-content prose prose-sm max-w-none ${
                          own ? 'prose-amber' : ''
                        }`}
                        dangerouslySetInnerHTML={{ __html: msg.content }}
                      />
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  {canManageMessages && hoveredMessageId === msg.id && !chat.isClosed && (
                    <div className={`absolute top-0 ${own ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex gap-1 px-2`}>
                      <button
                        onClick={() => onToggleImportant(chat.id, msg.id)}
                        className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                          msg.isImportant
                            ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title={msg.isImportant ? 'Снять выделение' : 'Выделить как важное'}
                      >
                        <svg className="w-4 h-4" fill={msg.isImportant ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Удалить это сообщение?')) {
                            onDeleteMessage(chat.id, msg.id);
                          }
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                        title="Удалить сообщение"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Rich Text Editor */}
      {!chat.isClosed ? (
        <RichTextEditor 
          onSend={handleSend} 
          placeholder="Введите сообщение..." 
          templates={templates}
          onManageTemplates={onManageTemplates}
          canManageTemplates={canManageTemplates}
        />
      ) : (
        <div className="bg-gray-100 border-t border-gray-200 px-4 py-3 text-center text-sm text-gray-500">
          Этот чат закрыт. Переоткройте его, чтобы продолжить переписку.
        </div>
      )}
    </div>
  );
};

import React, { useRef, useEffect } from 'react';
import { Chat, Employee, Message } from '../types';
import { formatTime, formatFullDate, createMessage } from '../store';
import { RichTextEditor } from './RichTextEditor';

interface ChatWindowProps {
  chat: Chat;
  currentUser: Employee;
  employees: Employee[];
  onSendMessage: (message: Message) => void;
  onShareChat: (chatId: string) => void;
  onTakeChat: (chatId: string) => void;
  onUpdateChat: (chat: Chat) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  chat,
  currentUser,
  employees,
  onSendMessage,
  onShareChat,
  onTakeChat,
  onUpdateChat,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          </p>
        </div>
        <div className="flex gap-2">
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
          return (
            <div key={msg.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${own ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-center gap-2 mb-1 ${own ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-xs font-medium" style={{ color: getAuthorColor(msg.authorId) }}>
                    {msg.authorName}
                  </span>
                  <span className="text-xs text-gray-300">{formatTime(msg.timestamp)}</span>
                </div>
                <div
                  className={`rounded-2xl px-4 py-2.5 ${
                    own
                      ? 'bg-indigo-600 text-white rounded-br-md'
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
                        own ? 'prose-invert' : ''
                      }`}
                      dangerouslySetInnerHTML={{ __html: msg.content }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Rich Text Editor */}
      <RichTextEditor onSend={handleSend} placeholder="Введите сообщение..." />
    </div>
  );
};

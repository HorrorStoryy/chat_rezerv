import React, { useState, useRef, useEffect } from 'react';
import { Chat, Employee, Message } from '../types';
import { formatTime, formatFullDate, createMessage } from '../store';

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
  const [inputText, setInputText] = useState('');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  const getAuthorColor = (authorId: string): string => {
    const emp = employees.find((e) => e.id === authorId);
    return emp?.color || '#6b7280';
  };

  const handleSend = () => {
    let content = inputText.trim();
    if (!content) return;

    if (isBold) content = `**${content}**`;
    if (isItalic) content = `*${content}*`;

    const msg = createMessage(chat.id, currentUser, content, 'text');
    onSendMessage(msg);
    setInputText('');
    setIsBold(false);
    setIsItalic(false);
    textareaRef.current?.focus();
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    const displayText = linkText.trim() || linkUrl;
    const content = `[${displayText}](${linkUrl})`;
    const msg = createMessage(chat.id, currentUser, content, 'text');
    onSendMessage(msg);
    setShowLinkInput(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      const msg = createMessage(chat.id, currentUser, file.name, 'image', imageUrl);
      onSendMessage(msg);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'b' && e.ctrlKey) {
      e.preventDefault();
      setIsBold(!isBold);
    }
    if (e.key === 'i' && e.ctrlKey) {
      e.preventDefault();
      setIsItalic(!isItalic);
    }
  };

  const renderMessageContent = (content: string) => {
    // Process links [text](url)
    let processed = content.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 underline hover:text-indigo-800">$1</a>'
    );
    // Process bold **text**
    processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Process italic *text*
    processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Process URLs
    processed = processed.replace(
      /(?<!["\(])(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-indigo-600 underline hover:text-indigo-800">$1</a>'
    );
    return processed;
  };

  const isOwnMessage = (msg: Message) => msg.authorId === currentUser.id;

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
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
                      className="text-sm leading-relaxed break-words"
                      dangerouslySetInnerHTML={{ __html: renderMessageContent(msg.content) }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setIsBold(!isBold)}
            className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-bold transition-colors ${
              isBold ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Жирный (Ctrl+B)"
          >
            B
          </button>
          <button
            onClick={() => setIsItalic(!isItalic)}
            className={`w-8 h-8 flex items-center justify-center rounded-md text-sm italic transition-colors ${
              isItalic ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Курсив (Ctrl+I)"
          >
            I
          </button>
          <button
            onClick={() => setShowLinkInput(!showLinkInput)}
            className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
              showLinkInput ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Вставить ссылку"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="Прикрепить фото"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Link Input */}
        {showLinkInput && (
          <div className="flex gap-2 mb-2 p-2 bg-gray-50 rounded-lg">
            <input
              type="text"
              placeholder="Текст ссылки"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <input
              type="url"
              placeholder="URL (https://...)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <button
              onClick={handleAddLink}
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Вставить
            </button>
          </div>
        )}

        {/* Message Input */}
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение... (Enter — отправить, Shift+Enter — перенос)"
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

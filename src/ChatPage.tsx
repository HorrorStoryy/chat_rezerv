import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { Chat, ChatMessage, Template, Employee } from './types';

interface ChatPageProps {
  user: any;
  employeeName: string;
  employeeRole: string;
  onLogout: () => void;
  onGoToAdmin: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ user, employeeName, employeeRole, onLogout, onGoToAdmin }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my' | 'all' | 'shared' | 'closed'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyLink, setCompanyLink] = useState('');
  const [comments, setComments] = useState('');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedChat = chats.find(c => c.id === selectedChatId);
  const selectedMessages = messages.filter(m => m.chat_id === selectedChatId).sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const colors = ['#6366f1', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];
  const getEmployeeColor = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    return emp?.color || colors[Math.abs(empId.charCodeAt(0)) % colors.length];
  };

  // Загрузка данных
  useEffect(() => {
    loadData();
    subscribeToChanges();
    return () => {
      supabase.removeAllChannels();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedMessages]);

  useEffect(() => {
    if (selectedChat) {
      setCompanyName(selectedChat.company_name);
      setCompanyLink(selectedChat.company_link);
      setComments(selectedChat.comments);
    }
  }, [selectedChatId]);

  const loadData = async () => {
    const [chatsRes, messagesRes, templatesRes, employeesRes] = await Promise.all([
      supabase.from('chats').select('*').order('created_at', { ascending: false }),
      supabase.from('messages').select('*'),
      supabase.from('templates').select('*').order('created_at', { ascending: true }),
      supabase.from('employees').select('*'),
    ]);

    if (chatsRes.data) setChats(chatsRes.data);
    if (messagesRes.data) setMessages(messagesRes.data);
    if (templatesRes.data) setTemplates(templatesRes.data);
    if (employeesRes.data) {
      setEmployees(employeesRes.data.map((e: any, i: number) => ({
        ...e,
        color: colors[i % colors.length],
        avatar: e.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
      })));
    }
  };

  const subscribeToChanges = () => {
    supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'templates' }, () => loadData())
      .subscribe();
  };

  // Создание чата
  const handleCreateChat = async () => {
    const maxNumber = chats.reduce((max, c) => Math.max(max, c.number), 1000);
    const newNumber = maxNumber + 1;

    const { data, error } = await supabase.from('chats').insert({
      number: newNumber,
      title: `Чат #${newNumber}`,
      created_by: user.id,
      created_by_name: employeeName,
      assigned_to: user.id,
      assigned_to_name: employeeName,
    }).select().single();

    if (data) {
      setSelectedChatId(data.id);
      // Системное сообщение
      await supabase.from('messages').insert({
        chat_id: data.id,
        text: `Чат #${newNumber} создан сотрудником ${employeeName}`,
        author: 'Система',
        user_id: user.id,
        msg_type: 'system',
      });
    }
  };

  // Отправка сообщения
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChatId) return;

    let content = messageInput.trim();
    if (isBold) content = `**${content}**`;
    if (isItalic) content = `*${content}*`;

    await supabase.from('messages').insert({
      chat_id: selectedChatId,
      text: content,
      author: employeeName,
      user_id: user.id,
      msg_type: 'text',
    });

    setMessageInput('');
    setIsBold(false);
    setIsItalic(false);
    textareaRef.current?.focus();
  };

  // Вставка изображения
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChatId) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageUrl = event.target?.result as string;
      await supabase.from('messages').insert({
        chat_id: selectedChatId,
        text: file.name,
        author: employeeName,
        user_id: user.id,
        msg_type: 'image',
        image_url: imageUrl,
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Вставка ссылки
  const handleInsertLink = () => {
    const url = prompt('Введите URL:');
    if (url) {
      const displayText = prompt('Текст ссылки (оставьте пустым для URL):') || url;
      setMessageInput(prev => prev + ` [${displayText}](${url})`);
    }
  };

  // Удаление сообщения
  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm('Удалить это сообщение?')) return;
    await supabase.from('messages').update({
      is_deleted: true,
      deleted_by_name: employeeName,
      deleted_at: new Date().toISOString(),
    }).eq('id', msgId);
  };

  // Выделение важного
  const handleToggleImportant = async (msg: ChatMessage) => {
    await supabase.from('messages').update({
      is_important: !msg.is_important,
    }).eq('id', msg.id);
  };

  // Перемещение в общие
  const handleShareChat = async (chatId: string) => {
    await supabase.from('chats').update({
      is_shared: true,
      assigned_to: null,
      assigned_to_name: '',
      updated_at: new Date().toISOString(),
    }).eq('id', chatId);

    await supabase.from('messages').insert({
      chat_id: chatId,
      text: `Чат перемещён в общую папку сотрудником ${employeeName}`,
      author: 'Система',
      user_id: user.id,
      msg_type: 'system',
    });
  };

  // Взять в работу
  const handleTakeChat = async (chatId: string) => {
    await supabase.from('chats').update({
      is_shared: false,
      assigned_to: user.id,
      assigned_to_name: employeeName,
      updated_at: new Date().toISOString(),
    }).eq('id', chatId);

    await supabase.from('messages').insert({
      chat_id: chatId,
      text: `Чат взят в работу сотрудником ${employeeName}`,
      author: 'Система',
      user_id: user.id,
      msg_type: 'system',
    });
  };

  // Закрыть чат
  const handleCloseChat = async (chatId: string) => {
    await supabase.from('chats').update({
      is_closed: true,
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', chatId);

    await supabase.from('messages').insert({
      chat_id: chatId,
      text: `Чат закрыт сотрудником ${employeeName}`,
      author: 'Система',
      user_id: user.id,
      msg_type: 'system',
    });
  };

  // Переоткрыть чат
  const handleReopenChat = async (chatId: string) => {
    await supabase.from('chats').update({
      is_closed: false,
      closed_at: null,
      assigned_to: user.id,
      assigned_to_name: employeeName,
      updated_at: new Date().toISOString(),
    }).eq('id', chatId);

    await supabase.from('messages').insert({
      chat_id: chatId,
      text: `Чат переоткрыт сотрудником ${employeeName}`,
      author: 'Система',
      user_id: user.id,
      msg_type: 'system',
    });
  };

  // Обновление информации о чате
  const handleSaveChatInfo = async () => {
    if (!selectedChatId) return;
    await supabase.from('chats').update({
      company_name: companyName,
      company_link: companyLink,
      comments: comments,
      updated_at: new Date().toISOString(),
    }).eq('id', selectedChatId);
    setIsEditingInfo(false);
  };

  // Шаблоны
  const handleInsertTemplate = (template: Template) => {
    setMessageInput(template.content.replace(/<[^>]*>/g, ''));
    setShowTemplates(false);
  };

  const handleAddTemplate = async (title: string, content: string) => {
    await supabase.from('templates').insert({
      title,
      content,
      created_by: user.id,
      created_by_name: employeeName,
    });
  };

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm('Удалить этот шаблон?')) {
      await supabase.from('templates').delete().eq('id', id);
    }
  };

  // Фильтрация чатов
  const filteredChats = chats.filter(chat => {
    if (activeTab === 'my') return chat.assigned_to === user.id && !chat.is_shared && !chat.is_closed;
    if (activeTab === 'all') return !chat.is_closed;
    if (activeTab === 'shared') return chat.is_shared && !chat.is_closed;
    if (activeTab === 'closed') return chat.is_closed;
    return true;
  }).filter(chat => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return chat.title.toLowerCase().includes(q) ||
           chat.company_name.toLowerCase().includes(q) ||
           chat.number.toString().includes(q) ||
           chat.assigned_to_name.toLowerCase().includes(q);
  });

  // Статистика
  const getEmployeeStats = () => {
    return employees.map(emp => ({
      employee: emp,
      activeChats: chats.filter(c => c.assigned_to === emp.id && !c.is_closed).length,
    })).sort((a, b) => b.activeChats - a.activeChats);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageContent = (content: string) => {
    let processed = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-indigo-600 underline">$1</a>');
    processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
    return processed;
  };

  const canManageMessages = selectedChat?.assigned_to === user.id;
  const canManageTemplates = employeeRole === 'admin' || employeeRole === 'editor';

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="font-bold text-gray-800 text-sm">Чат Поддержки</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700 font-medium">{employeeName}</span>
          {employeeRole === 'admin' && (
            <button onClick={onGoToAdmin} className="px-3 py-1.5 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100">
              Админка
            </button>
          )}
          <button onClick={onLogout} className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
            Выйти
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-800">Чаты</h2>
              <button onClick={handleCreateChat} className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <div className="flex mt-3 bg-gray-100 rounded-lg p-1">
              {(['my', 'all', 'shared', 'closed'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md ${
                    activeTab === tab ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {tab === 'my' ? 'Мои' : tab === 'all' ? 'Все' : tab === 'shared' ? 'Общие' : 'Закрытые'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredChats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 ${
                  selectedChatId === chat.id ? 'bg-indigo-50 border-l-3 border-l-indigo-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-gray-800">#{chat.number}</span>
                  {chat.is_shared && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Общий</span>}
                  {chat.is_closed && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Закрыт</span>}
                </div>
                {chat.company_name && <p className="text-xs text-gray-500 mb-1">{chat.company_name}</p>}
                <p className="text-xs text-gray-400">{chat.assigned_to_name || 'Не назначен'}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">
                  Чат #{selectedChat.number}
                  {selectedChat.company_name && <span className="ml-2 text-sm font-normal text-gray-500">— {selectedChat.company_name}</span>}
                </h3>
                <p className="text-xs text-gray-400">
                  Назначен: {selectedChat.assigned_to_name || 'Не назначен'}
                  {selectedChat.is_closed && <span className="ml-2 text-red-500">| Закрыт</span>}
                </p>
              </div>
              <div className="flex gap-2">
                {!selectedChat.is_closed && (
                  <>
                    {!selectedChat.is_shared ? (
                      <button onClick={() => handleShareChat(selectedChat.id)} className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100">
                        📂 В общие
                      </button>
                    ) : (
                      selectedChat.assigned_to !== user.id && (
                        <button onClick={() => handleTakeChat(selectedChat.id)} className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100">
                          ✋ Взять в работу
                        </button>
                      )
                    )}
                    <button onClick={() => handleCloseChat(selectedChat.id)} className="px-3 py-1.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100">
                      🔒 Закрыть
                    </button>
                  </>
                )}
                {selectedChat.is_closed && (
                  <button onClick={() => handleReopenChat(selectedChat.id)} className="px-3 py-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100">
                    🔓 Переоткрыть
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedMessages.map(msg => {
                if (msg.msg_type === 'system') {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{msg.text}</span>
                    </div>
                  );
                }

                if (msg.is_deleted) {
                  return (
                    <div key={msg.id} className="flex justify-start">
                      <div className="max-w-[70%]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500">{msg.author}</span>
                          <span className="text-xs text-gray-300">{formatTime(msg.created_at)}</span>
                        </div>
                        <div className="rounded-2xl px-4 py-2.5 bg-gray-100 border border-gray-200">
                          <p className="text-sm text-gray-400 italic">
                            Сообщение удалено {msg.deleted_by_name && `(${msg.deleted_by_name})`}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                const isOwn = msg.user_id === user.id;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
                    <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs font-medium" style={{ color: getEmployeeColor(msg.user_id) }}>
                          {msg.author}
                        </span>
                        <span className="text-xs text-gray-300">{formatTime(msg.created_at)}</span>
                        {msg.is_important && <span className="text-xs text-amber-600">⭐ Важно</span>}
                      </div>
                      <div className="relative">
                        <div className={`rounded-2xl px-4 py-2.5 ${
                          msg.is_important ? 'bg-amber-50 border-2 border-amber-300' :
                          isOwn ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-gray-200 shadow-sm'
                        }`}>
                          {msg.msg_type === 'image' && msg.image_url ? (
                            <img src={msg.image_url} alt={msg.text} className="max-w-full max-h-64 rounded-lg cursor-pointer" onClick={() => window.open(msg.image_url, '_blank')} />
                          ) : (
                            <div className="text-sm text-gray-800 break-words" dangerouslySetInnerHTML={{ __html: renderMessageContent(msg.text) }} />
                          )}
                        </div>
                        {canManageMessages && !selectedChat.is_closed && (
                          <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} hidden group-hover:flex gap-1 px-2`}>
                            <button onClick={() => handleToggleImportant(msg)} className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 hover:bg-amber-100 text-gray-500 hover:text-amber-600">
                              ⭐
                            </button>
                            <button onClick={() => handleDeleteMessage(msg.id)} className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600">
                              🗑️
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

            {/* Input */}
            {!selectedChat.is_closed ? (
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setIsBold(!isBold)} className={`w-8 h-8 flex items-center justify-center rounded-md font-bold ${isBold ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>B</button>
                  <button onClick={() => setIsItalic(!isItalic)} className={`w-8 h-8 flex items-center justify-center rounded-md italic ${isItalic ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>I</button>
                  <button onClick={handleInsertLink} className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200">🔗</button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200">🖼️</button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <div className="relative">
                    <button onClick={() => setShowTemplates(!showTemplates)} className="px-3 h-8 flex items-center gap-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm">
                      📋 Шаблоны
                    </button>
                    {showTemplates && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <div className="p-2">
                          {templates.map(tpl => (
                            <button key={tpl.id} onClick={() => handleInsertTemplate(tpl)} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 rounded-md">
                              {tpl.title}
                            </button>
                          ))}
                          {canManageTemplates && (
                            <button onClick={() => { setShowTemplateManager(true); setShowTemplates(false); }} className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md">
                              ⚙️ Управление шаблонами
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <textarea
                    ref={textareaRef}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                    placeholder="Введите сообщение..."
                    className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    rows={2}
                  />
                  <button onClick={handleSendMessage} disabled={!messageInput.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                    Отправить
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 border-t border-gray-200 px-4 py-3 text-center text-sm text-gray-500">
                Чат закрыт. Переоткройте для продолжения.
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <p className="text-lg text-gray-500">Выберите чат</p>
            </div>
          </div>
        )}

        {/* Sidebar */}
        {selectedChat && showSidebar && (
          <div className="w-72 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-sm">Информация</h3>
              <button onClick={() => setShowSidebar(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Номер чата</label>
                <p className="text-lg font-bold text-indigo-600">#{selectedChat.number}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Назначен</label>
                <p className="text-sm text-gray-800">{selectedChat.assigned_to_name || 'Не назначен'}</p>
              </div>
              <hr />
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-500">Компания</label>
                  {!isEditingInfo && <button onClick={() => setIsEditingInfo(true)} className="text-xs text-indigo-600">Редактировать</button>}
                </div>
                {!isEditingInfo ? (
                  <div className="mt-2 space-y-2">
                    <div><p className="text-xs text-gray-400">Название</p><p className="text-sm text-gray-800">{selectedChat.company_name || '—'}</p></div>
                    <div><p className="text-xs text-gray-400">Ссылка на сотрудника, который обращается в чат</p>
                      {selectedChat.company_link ? <a href={selectedChat.company_link} target="_blank" className="text-sm text-indigo-600 hover:underline break-all">{selectedChat.company_link}</a> : <p className="text-sm text-gray-400">—</p>}
                    </div>
                    <div><p className="text-xs text-gray-400">Комментарии</p><p className="text-sm text-gray-700">{selectedChat.comments || 'Нет'}</p></div>
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Название компании" className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg" />
                    <input type="url" value={companyLink} onChange={(e) => setCompanyLink(e.target.value)} placeholder="Ссылка на сотрудника" className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg" />
                    <textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Комментарии" className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg" rows={3} />
                    <div className="flex gap-2">
                      <button onClick={handleSaveChatInfo} className="flex-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Сохранить</button>
                      <button onClick={() => setIsEditingInfo(false)} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg">Отмена</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Template Manager Modal */}
      {showTemplateManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold">Управление шаблонами</h2>
              <button onClick={() => setShowTemplateManager(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {templates.map(tpl => (
                <div key={tpl.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">{tpl.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{tpl.content.replace(/<[^>]*>/g, '').substring(0, 100)}...</p>
                  </div>
                  <button onClick={() => handleDeleteTemplate(tpl.id)} className="text-red-600 hover:text-red-800">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

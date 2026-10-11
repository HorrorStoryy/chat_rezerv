import { Employee, Chat, Message, AppState, Template } from './types';

const STORAGE_KEY = 'support-chat-app';

const defaultEmployees: Employee[] = [
  { id: 'emp1', name: 'Анна Иванова', avatar: 'АИ', color: '#6366f1', role: 'admin' },
  { id: 'emp2', name: 'Петр Сидоров', avatar: 'ПС', color: '#0891b2', role: 'editor' },
  { id: 'emp3', name: 'Мария Козлова', avatar: 'МК', color: '#059669', role: 'user' },
  { id: 'emp4', name: 'Дмитрий Волков', avatar: 'ДВ', color: '#d97706', role: 'user' },
  { id: 'emp5', name: 'Елена Новикова', avatar: 'ЕН', color: '#dc2626', role: 'user' },
];

const defaultTemplates: Template[] = [
  {
    id: 'tpl1',
    title: 'Приветствие',
    content: '<p>Здравствуйте!</p><p>Спасибо за обращение в нашу поддержку. Чем могу помочь?</p>',
    createdBy: 'system',
    createdByName: 'Система',
    createdAt: Date.now(),
  },
  {
    id: 'tpl2',
    title: 'Уточнение проблемы',
    content: '<p>Уточните, пожалуйста:</p><ul><li>Когда возникла проблема?</li><li>Что именно не работает?</li><li>Появляются ли какие-то ошибки?</li></ul>',
    createdBy: 'system',
    createdByName: 'Система',
    createdAt: Date.now(),
  },
  {
    id: 'tpl3',
    title: 'Решение найдено',
    content: '<p>Отличные новости! Мы нашли решение вашей проблемы.</p><p><strong>Что нужно сделать:</strong></p><ol><li>Первый шаг</li><li>Второй шаг</li><li>Третий шаг</li></ol><p>Если возникнут вопросы — обращайтесь!</p>',
    createdBy: 'system',
    createdByName: 'Система',
    createdAt: Date.now(),
  },
  {
    id: 'tpl4',
    title: 'Передача специалисту',
    content: '<p>Ваш вопрос требует дополнительной экспертизы.</p><p>Я передам его профильному специалисту, который свяжется с вами в ближайшее время.</p>',
    createdBy: 'system',
    createdByName: 'Система',
    createdAt: Date.now(),
  },
  {
    id: 'tpl5',
    title: 'Завершение',
    content: '<p>Был рад помочь!</p><p>Если появятся дополнительные вопросы — не стесняйтесь обращаться.</p><p>Хорошего дня!</p>',
    createdBy: 'system',
    createdByName: 'Система',
    createdAt: Date.now(),
  },
];

function getDefaultState(): AppState {
  return {
    currentUser: null,
    chats: [],
    employees: defaultEmployees,
    templates: defaultTemplates,
    nextChatNumber: 1001,
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...getDefaultState(), ...parsed };
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return getDefaultState();
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function createChat(creator: Employee, nextNumber: number): { chat: Chat; nextChatNumber: number } {
  const chat: Chat = {
    id: generateId(),
    number: nextNumber,
    title: `Чат #${nextNumber}`,
    companyName: '',
    companyLink: '',
    comments: '',
    createdBy: creator.id,
    assignedTo: creator.id,
    isShared: false,
    isClosed: false,
    messages: [
      {
        id: generateId(),
        chatId: '',
        authorId: 'system',
        authorName: 'Система',
        content: `Чат #${nextNumber} создан сотрудником <strong>${creator.name}</strong>`,
        timestamp: Date.now(),
        type: 'system',
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  chat.messages[0].chatId = chat.id;
  return { chat, nextChatNumber: nextNumber + 1 };
}

export function createMessage(
  chatId: string,
  author: Employee,
  content: string,
  type: 'text' | 'image' = 'text',
  imageUrl?: string
): Message {
  return {
    id: generateId(),
    chatId,
    authorId: author.id,
    authorName: author.name,
    content,
    timestamp: Date.now(),
    type,
    imageUrl,
  };
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  
  if (isToday) {
    return time;
  }
  
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) + ' ' + time;
}

export function formatFullDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

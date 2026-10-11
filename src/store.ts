import { Employee, Chat, Message, AppState } from './types';

const STORAGE_KEY = 'support-chat-app';

const defaultEmployees: Employee[] = [
  { id: 'emp1', name: 'Анна Иванова', avatar: 'АИ', color: '#6366f1' },
  { id: 'emp2', name: 'Петр Сидоров', avatar: 'ПС', color: '#0891b2' },
  { id: 'emp3', name: 'Мария Козлова', avatar: 'МК', color: '#059669' },
  { id: 'emp4', name: 'Дмитрий Волков', avatar: 'ДВ', color: '#d97706' },
  { id: 'emp5', name: 'Елена Новикова', avatar: 'ЕН', color: '#dc2626' },
];

function getDefaultState(): AppState {
  return {
    currentUser: null,
    chats: [],
    employees: defaultEmployees,
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

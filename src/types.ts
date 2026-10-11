export interface Employee {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: 'admin' | 'editor' | 'user';
}

export interface Template {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: number;
  updatedAt?: number;
}

export interface Message {
  id: string;
  chatId: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'system';
  imageUrl?: string;
  isDeleted?: boolean;
  deletedBy?: string;
  deletedByName?: string;
  deletedAt?: number;
  isImportant?: boolean;
}

export interface Chat {
  id: string;
  number: number;
  title: string;
  companyName: string;
  companyLink: string;
  comments: string;
  createdBy: string;
  assignedTo: string | null;
  isShared: boolean;
  isClosed: boolean;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  closedAt?: number;
}

export interface AppState {
  currentUser: Employee | null;
  chats: Chat[];
  employees: Employee[];
  templates: Template[];
  nextChatNumber: number;
}

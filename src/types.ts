export interface Employee {
  id: string;
  name: string;
  avatar: string;
  color: string;
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
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  currentUser: Employee | null;
  chats: Chat[];
  employees: Employee[];
  nextChatNumber: number;
}

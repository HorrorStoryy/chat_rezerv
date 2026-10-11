export interface Employee {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  color: string;
  avatar: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  text: string;
  author: string;
  user_id: string;
  msg_type: 'text' | 'image' | 'system';
  image_url?: string;
  is_deleted: boolean;
  deleted_by_name?: string;
  deleted_at?: string;
  is_important: boolean;
  created_at: string;
}

export interface Chat {
  id: string;
  number: number;
  title: string;
  company_name: string;
  company_link: string;
  comments: string;
  created_by: string;
  created_by_name: string;
  assigned_to: string | null;
  assigned_to_name: string;
  is_shared: boolean;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface Template {
  id: string;
  title: string;
  content: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at?: string;
}

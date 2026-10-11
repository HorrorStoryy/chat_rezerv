import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cxbfzmfgttcxqwftlrg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey || supabaseAnonKey === 'ВСТАВЬ_СЮДА_СВОЙ_КЛЮЧ') {
  console.warn('⚠️ Supabase Anon Key не установлен. Вставьте ключ в файл .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

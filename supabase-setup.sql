-- ============================================
-- ВЫПОЛНИТЕ ЭТОТ SQL В SUPABASE DASHBOARD → SQL EDITOR
-- ============================================

-- 1. Модифицируем существующую таблицу messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS chat_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS msg_type TEXT DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by_name TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT FALSE;

-- 2. Таблица чатов
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  company_name TEXT DEFAULT '',
  company_link TEXT DEFAULT '',
  comments TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT DEFAULT '',
  assigned_to UUID REFERENCES auth.users(id),
  assigned_to_name TEXT DEFAULT '',
  is_shared BOOLEAN DEFAULT FALSE,
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- 3. Таблица шаблонов
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 4. Включаем Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE templates;

-- 5. Включаем RLS
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- 6. Политики доступа
-- Chats
DROP POLICY IF EXISTS "Все читают чаты" ON chats;
CREATE POLICY "Все читают чаты" ON chats FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Все создают чаты" ON chats;
CREATE POLICY "Все создают чаты" ON chats FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Все обновляют чаты" ON chats;
CREATE POLICY "Все обновляют чаты" ON chats FOR UPDATE USING (auth.role() = 'authenticated');

-- Messages
DROP POLICY IF EXISTS "Все обновляют сообщения" ON messages;
CREATE POLICY "Все обновляют сообщения" ON messages FOR UPDATE USING (auth.role() = 'authenticated');

-- Templates
DROP POLICY IF EXISTS "Все читают шаблоны" ON templates;
CREATE POLICY "Все читают шаблоны" ON templates FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Все создают шаблоны" ON templates;
CREATE POLICY "Все создают шаблоны" ON templates FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Все обновляют шаблоны" ON templates;
CREATE POLICY "Все обновляют шаблоны" ON templates FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Все удаляют шаблоны" ON templates;
CREATE POLICY "Все удаляют шаблоны" ON templates FOR DELETE USING (auth.role() = 'authenticated');

-- 7. Стандартные шаблоны
INSERT INTO templates (title, content, created_by_name) VALUES
('Приветствие', '<p>Здравствуйте!</p><p>Спасибо за обращение в нашу поддержку. Чем могу помочь?</p>', 'Система'),
('Уточнение проблемы', '<p>Уточните, пожалуйста:</p><ul><li>Когда возникла проблема?</li><li>Что именно не работает?</li><li>Появляются ли какие-то ошибки?</li></ul>', 'Система'),
('Решение найдено', '<p>Отличные новости! Мы нашли решение вашей проблемы.</p><p><strong>Что нужно сделать:</strong></p><ol><li>Первый шаг</li><li>Второй шаг</li><li>Третий шаг</li></ol><p>Если возникнут вопросы — обращайтесь!</p>', 'Система'),
('Передача специалисту', '<p>Ваш вопрос требует дополнительной экспертизы.</p><p>Я передам его профильному специалисту, который свяжется с вами в ближайшее время.</p>', 'Система'),
('Завершение', '<p>Был рад помочь!</p><p>Если появятся дополнительные вопросы — не стесняйтесь обращаться.</p><p>Хорошего дня!</p>', 'Система')
ON CONFLICT DO NOTHING;

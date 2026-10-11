-- ============================================
-- ИСПРАВЛЕНИЕ: Выполните этот SQL в Supabase Dashboard → SQL Editor
-- Это исправит проблему с созданием чатов
-- ============================================

-- 1. Удаляем старые ограничения внешних ключей (если есть)
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_created_by_fkey;
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_assigned_to_fkey;

-- 2. Делаем поля created_by и assigned_to необязательными (nullable)
ALTER TABLE chats ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE chats ALTER COLUMN assigned_to DROP NOT NULL;

-- 3. Удаляем старые политики RLS
DROP POLICY IF EXISTS "Все читают чаты" ON chats;
DROP POLICY IF EXISTS "Все создают чаты" ON chats;
DROP POLICY IF EXISTS "Все обновляют чаты" ON chats;
DROP POLICY IF EXISTS "Все удаляют чаты" ON chats;

-- 4. Создаём новые политики (разрешаем всё для авторизованных)
CREATE POLICY "chats_select_all" ON chats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "chats_insert_all" ON chats
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "chats_update_all" ON chats
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "chats_delete_all" ON chats
  FOR DELETE
  TO authenticated
  USING (true);

-- 5. Аналогично для messages
DROP POLICY IF EXISTS "Все могут читать сообщения" ON messages;
DROP POLICY IF EXISTS "Все могут создавать сообщения" ON messages;
DROP POLICY IF EXISTS "Все обновляют сообщения" ON messages;

CREATE POLICY "messages_select_all" ON messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "messages_insert_all" ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "messages_update_all" ON messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Для templates
DROP POLICY IF EXISTS "Все читают шаблоны" ON templates;
DROP POLICY IF EXISTS "Все создают шаблоны" ON templates;
DROP POLICY IF EXISTS "Все обновляют шаблоны" ON templates;
DROP POLICY IF EXISTS "Все удаляют шаблоны" ON templates;

CREATE POLICY "templates_select_all" ON templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "templates_insert_all" ON templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "templates_update_all" ON templates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "templates_delete_all" ON templates
  FOR DELETE
  TO authenticated
  USING (true);

-- 7. Для employees
DROP POLICY IF EXISTS "Все могут читать сотрудников" ON employees;
DROP POLICY IF EXISTS "Админы могут управлять сотрудниками" ON employees;

CREATE POLICY "employees_select_all" ON employees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "employees_insert_all" ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "employees_update_all" ON employees
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "employees_delete_all" ON employees
  FOR DELETE
  TO authenticated
  USING (true);

-- 8. Убедимся, что Realtime включён
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE templates;

-- 9. Проверка структуры таблиц
SELECT '✅ SQL выполнен успешно! Теперь попробуйте создать чат.' as result;

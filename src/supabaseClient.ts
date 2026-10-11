import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cxbfzmfgtttcxqwftrlg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4YmZ6bWZndHR0Y3hxd2Z0cmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3Mzg1OTgsImV4cCI6MjEwNzMxNDU5OH0.X_IAAJf1Sf5AnE-rJg9pdfTNaZDROsZk-WLvZwszNrY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

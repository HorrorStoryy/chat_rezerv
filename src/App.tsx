import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { LoginPage } from './LoginPage';
import { ChatPage } from './ChatPage';
import { AdminPage } from './AdminPage';

type Page = 'login' | 'chat' | 'admin';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем текущую сессию
    checkSession();

    // Слушаем изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          loadUserProfile(session.user.id);
          setCurrentPage('chat');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(null);
          setCurrentPage('login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      setUser(session.user);
      await loadUserProfile(session.user.id);
      setCurrentPage('chat');
    }
    
    setLoading(false);
  };

  const loadUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error loading user profile:', error);
      return;
    }

    if (data) {
      setUserProfile({
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
      });
    }
  };

  const handleLoginSuccess = () => {
    setCurrentPage('chat');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentPage('login');
  };

  const handleGoToAdmin = () => {
    setCurrentPage('admin');
  };

  const handleBackToChat = () => {
    setCurrentPage('chat');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentPage === 'admin' && userProfile?.role === 'admin') {
    return (
      <AdminPage
        onBackToChat={handleBackToChat}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <ChatPage
      user={user}
      employeeName={userProfile?.name || user.email}
      onLogout={handleLogout}
      onGoToAdmin={handleGoToAdmin}
      isAdmin={userProfile?.role === 'admin'}
    />
  );
}

export default App;

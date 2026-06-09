import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

import Quiz from './Quiz';
import TastingJournal from './TastingJournal';
import FoodJournal from './FoodJournal';
import PairingEngine from './PairingEngine';
import Profile from './Profile';
import Auth from './Auth';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

const MainLayout = ({ children, setActiveTab, activeTab, user, onLogout, userName }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <header className="bg-white p-4 shadow-sm flex justify-between items-center px-6 sticky top-0 z-50">
      <div className="font-extrabold text-wine-red tracking-tighter text-xl">WINELINK</div>
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-600 hidden sm:block">Ciao, <span className="font-bold text-wine-red">{userName || 'Appassionato'}</span></span>
            <button onClick={onLogout} className="text-xs font-bold text-gray-400 uppercase hover:text-wine-red transition">Esci</button>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-wine-yellow uppercase tracking-widest">Modalità Ospite</span>
        )}
      </div>
    </header>

    <main className="flex-grow">{children}</main>

    <footer className="bg-white py-6 border-t border-gray-100 text-center">
      <p className="text-gray-400 text-[10px] font-medium uppercase tracking-widest mb-1">Progettato con passione per l'enoturismo</p>
      <p className="text-wine-red font-bold text-sm">WineLink Project &copy; {new Date().getFullYear()}</p>
      <p className="text-gray-300 text-[10px]">Ideato e sviluppato per l'eccellenza del vino</p>
    </footer>

    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-3 flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50">
      <button onClick={() => setActiveTab('academy')} className={`flex flex-col items-center gap-1 ${activeTab === 'academy' ? 'text-wine-red' : 'text-gray-400'}`}>
        <span className="text-[10px] font-bold uppercase">Academy</span>
      </button>
      <button onClick={() => setActiveTab('wine')} className={`flex flex-col items-center gap-1 ${activeTab === 'wine' ? 'text-wine-red' : 'text-gray-400'}`}>
        <span className="text-[10px] font-bold uppercase">Vino</span>
      </button>
      <button onClick={() => setActiveTab('food')} className={`flex flex-col items-center gap-1 ${activeTab === 'food' ? 'text-wine-red' : 'text-gray-400'}`}>
        <span className="text-[10px] font-bold uppercase">Cibo</span>
      </button>
      <button onClick={() => setActiveTab('pair')} className={`flex flex-col items-center gap-1 ${activeTab === 'pair' ? 'text-wine-red' : 'text-gray-400'}`}>
        <span className="text-[10px] font-bold uppercase">Pairing</span>
      </button>
      <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-wine-red' : 'text-gray-400'}`}>
        <span className="text-[10px] font-bold uppercase">Profilo</span>
      </button>
      {!user && (
        <div className="absolute -top-12 right-4">
          <button onClick={() => window.location.href='/auth'} className="bg-wine-yellow text-wine-red text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">ENTRA</button>
        </div>
      )}
    </nav>
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState('academy');
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const { data: profile } = await supabase.from('user_profiles').select('username').eq('id', session.user.id).single();
          setUserName(profile?.username || 'Appassionato');
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: profile } = await supabase.from('user_profiles').select('username').eq('id', session.user.id).single();
        setUserName(profile?.username || 'Appassionato');
      } else {
        setUserName('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserName('');
    setActiveTab('academy');
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-wine-red font-bold">Caricamento...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <MainLayout setActiveTab={setActiveTab} activeTab={activeTab} user={user} userName={userName} onLogout={handleLogout}>
            {activeTab === 'academy' && <Quiz user={user} />}
            {activeTab === 'wine' && <TastingJournal user={user} />}
            {activeTab === 'food' && <FoodJournal user={user} />}
            {activeTab === 'pair' && <PairingEngine user={user} />}
            {activeTab === 'profile' && <Profile user={user} />}
          </MainLayout>
        } />
        <Route path="/auth" element={<Auth onSession={(u) => setUser(u)} />} />
        <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <AdminLogin setAdmin={setIsAdmin} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
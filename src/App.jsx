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
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 flex flex-col font-sans">
    {/* HEADER: Più raffinato */}
    <header className="bg-white/80 backdrop-blur-md p-4 shadow-sm flex justify-between items-center px-6 sticky top-0 z-50 border-b border-gray-100">
      <div className="flex flex-col">
        <span className="font-black text-wine-red tracking-tighter text-2xl leading-none">WINELINK</span>
        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Sensory Experience</span>
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-600 hidden sm:block">Ciao, <span className="font-bold text-wine-red">{userName || 'Appassionato'}</span></span>
            <button onClick={onLogout} className="text-xs font-bold text-gray-400 uppercase hover:text-wine-red transition-colors">Esci</button>
          </div>
        ) : (
          <button onClick={() => window.location.href='/auth'} className="bg-wine-yellow text-wine-red text-[10px] font-black px-4 py-1.5 rounded-full shadow-sm hover:scale-105 transition-transform">ENTRA</button>
        )}
      </div>
    </header>

    {/* MAIN: Aggiunto padding bottom per non coprire i contenuti con la nav */}
    <main className="flex-grow pb-24">{children}</main>

    {/* FOOTER: Riprogettato per essere un "sigillo di qualità" */}
    <footer className="bg-white py-12 border-t border-gray-100 text-center px-6 mt-auto">
      <div className="max-w-xs mx-auto">
        <div className="text-wine-red font-black text-lg tracking-tighter mb-2">WineLink</div>
        <p className="text-gray-400 text-[10px] font-medium uppercase tracking-widest mb-4">
          L'eccellenza del vino, <br/> a portata di touch.
        </p>
        <div className="h-px w-8 bg-wine-yellow mx-auto mb-4"></div>
        <p className="text-gray-300 text-[9px] uppercase tracking-tighter font-bold">
          &copy; {new Date().getFullYear()} WineLink Project <br/> Design for Sommelier
        </p>
      </div>
    </footer>

    {/* NAV: Più moderna con effetto blur */}
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 px-2 py-3 flex justify-around items-center shadow-[0_-10px_25px_rgba(0,0,0,0.05)] z-50">
      {[
        { id: 'academy', label: 'Academy', icon: '🎓' },
        { id: 'wine', label: 'Vino', icon: '🍇' },
        { id: 'food', label: 'Cibo', icon: '🍽️' },
        { id: 'pair', label: 'Pairing', icon: '🧪' },
        { id: 'profile', label: 'Profilo', icon: '👤' },
      ].map((tab) => (
        <button 
          key={tab.id} 
          onClick={() => setActiveTab(tab.id)} 
          className={`flex flex-col items-center gap-1 transition-all duration-300 px-3 py-1 rounded-2xl ${activeTab === tab.id ? 'text-wine-red scale-110' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <span className="text-xl">{tab.icon}</span>
          <span className="text-[9px] font-black uppercase tracking-tighter">{tab.label}</span>
        </button>
      ))}
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
            {activeTab === 'profile' && <Profile user={user} setActiveTab={setActiveTab} />}
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
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// Importiamo i componenti. Se uno di questi fallisce, l'errore apparirà in console.
import Quiz from './Quiz';
import TastingJournal from './TastingJournal';
import FoodJournal from './FoodJournal';
import PairingEngine from './PairingEngine';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import Auth from './Auth';

const MainLayout = ({ children, setActiveTab, activeTab, user, onLogout }) => (
  <div className="min-h-screen bg-gray-50">
    <header className="bg-white p-4 shadow-sm flex justify-between items-center px-6">
      <div className="font-extrabold text-wine-red tracking-tighter text-xl">WINELINK</div>
      {user ? (
        <button onClick={onLogout} className="text-xs font-bold text-gray-400 uppercase hover:text-wine-red transition">Esci</button>
      ) : (
        <span className="text-[10px] font-bold text-wine-yellow uppercase">Modalità Ospite</span>
      )}
    </header>
    <main>{children}</main>
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
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
      {!user && (
        <button onClick={() => window.location.href='/auth'} className="flex flex-col items-center gap-1 text-wine-yellow">
           <span className="text-[10px] font-bold uppercase">Entra</span>
        </button>
      )}
    </nav>
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState('academy');
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (err) {
        console.error("Errore sessione:", err);
      } finally {
        setLoading(false);
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-wine-red">Caricamento WineLink...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <MainLayout setActiveTab={setActiveTab} activeTab={activeTab} user={user} onLogout={handleLogout}>
            {activeTab === 'academy' && <Quiz />}
            {activeTab === 'wine' && <TastingJournal user={user} />}
            {activeTab === 'food' && <FoodJournal user={user} />}
            {activeTab === 'pair' && <PairingEngine user={user} />}
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
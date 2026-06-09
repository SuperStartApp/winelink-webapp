import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// Importazione di tutti i componenti del sistema
import Quiz from './Quiz';
import TastingJournal from './TastingJournal';
import FoodJournal from './FoodJournal';
import PairingEngine from './PairingEngine';
import Profile from './Profile';
import Auth from './Auth';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

// --- COMPONENTE LAYOUT PRINCIPALE ---
// Questo componente gestisce l'intestazione e la barra di navigazione in basso
const MainLayout = ({ children, setActiveTab, activeTab, user, onLogout }) => (
  <div className="min-h-screen bg-gray-50">
    {/* Header superiore */}
    <header className="bg-white p-4 shadow-sm flex justify-between items-center px-6 sticky top-0 z-50">
      <div className="font-extrabold text-wine-red tracking-tighter text-xl">WINELINK</div>
      {user ? (
        <button 
          onClick={onLogout} 
          className="text-xs font-bold text-gray-400 uppercase hover:text-wine-red transition tracking-widest"
        >
          Esci
        </button>
      ) : (
        <span className="text-[10px] font-bold text-wine-yellow uppercase tracking-widest">Modalità Ospite</span>
      )}
    </header>

    {/* Area dei contenuti (cambia in base alla Tab attiva) */}
    <main>{children}</main>

    {/* BARRA DI NAVIGAZIONE IN BASSO (Sempre visibile) */}
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-3 flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50">
      <button 
        onClick={() => setActiveTab('academy')} 
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'academy' ? 'text-wine-red' : 'text-gray-400'}`}
      >
        <span className="text-[10px] font-bold uppercase">Academy</span>
      </button>

      <button 
        onClick={() => setActiveTab('wine')} 
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'wine' ? 'text-wine-red' : 'text-gray-400'}`}
      >
        <span className="text-[10px] font-bold uppercase">Vino</span>
      </button>

      <button 
        onClick={() => setActiveTab('food')} 
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'food' ? 'text-wine-red' : 'text-gray-400'}`}
      >
        <span className="text-[10px] font-bold uppercase">Cibo</span>
      </button>

      <button 
        onClick={() => setActiveTab('pair')} 
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'pair' ? 'text-wine-red' : 'text-gray-400'}`}
      >
        <span className="text-[10px] font-bold uppercase">Pairing</span>
      </button>

      <button 
        onClick={() => setActiveTab('profile')} 
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-wine-red' : 'text-gray-400'}`}
      >
        <span className="text-[10px] font-bold uppercase">Profilo</span>
      </button>

      {/* Se l'utente non è loggato, mostriamo un tasto rapido per l'Auth a lato o possiamo gestirlo via Profilo */}
      {!user && (
        <div className="absolute -top-12 right-4">
          <button 
            onClick={() => window.location.href='/auth'} 
            className="bg-wine-yellow text-wine-red text-[10px] font-bold px-3 py-1 rounded-full shadow-sm"
          >
            ENTRA
          </button>
        </div>
      )}
    </nav>
  </div>
);

// --- COMPONENTE PRINCIPALE APP ---
function App() {
  const [activeTab, setActiveTab] = useState('academy');
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verifica se l'utente ha già una sessione attiva all'avvio
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (err) {
        console.error("Errore durante il recupero della sessione:", err);
      } finally {
        setLoading(false);
      }
    };
    getSession();

    // 2. Ascolta i cambiamenti di stato (Login / Logout) in tempo reale
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Funzione per effettuare il logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveTab('academy'); // Riporta l'utente all'inizio
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 font-sans">
        <div className="w-12 h-12 border-4 border-wine-yellow border-t-wine-red rounded-full animate-spin mb-4"></div>
        <p className="text-wine-red font-bold animate-pulse">Caricamento WineLink...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Rotta Principale: Gestisce tutte le Tab dell'utente */}
        <Route path="/" element={
          <MainLayout setActiveTab={setActiveTab} activeTab={activeTab} user={user} onLogout={handleLogout}>
            {activeTab === 'academy' && <Quiz />}
            {activeTab === 'wine' && <TastingJournal user={user} />}
            {activeTab === 'food' && <FoodJournal user={user} />}
            {activeTab === 'pair' && <PairingEngine user={user} />}
            {activeTab === 'profile' && <Profile user={user} />}
          </MainLayout>
        } />

        {/* Rotta Autenticazione (Login/Registrazione) */}
        <Route path="/auth" element={<Auth onSession={(u) => setUser(u)} />} />

        {/* Rotta Area Amministratore */}
        <Route path="/admin" element={
          isAdmin ? <AdminDashboard /> : <AdminLogin setAdmin={setIsAdmin} />
        } />

        {/* Gestione errori 404: se l'URL non esiste, torna alla Home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
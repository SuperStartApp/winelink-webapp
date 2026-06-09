import { useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom'; // Importiamo il navigatore

function Auth({ onSession }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Inizializziamo il navigatore

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Registrazione
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        alert("Account creato con successo! Benvenuto in WineLink! 🍷✨");
        
        // Se l'utente è stato creato e loggato automaticamente
        if (data.session) {
          onSession(data.session.user);
          navigate('/'); // Torna alla Home
        }
      } else {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        alert("Accesso effettuato! Bentornato! 🍷");
        
        if (data.session) {
          onSession(data.session.user);
          navigate('/'); // Torna alla Home
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-wine-red px-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-8">
        <h2 className="text-3xl font-extrabold text-gray-800 text-center mb-2">
          {isSignUp ? 'Crea il tuo Account' : 'Bentornato!'}
        </h2>
        <p className="text-gray-500 text-center mb-8 text-sm">
          {isSignUp ? 'Inizia il tuo viaggio nel mondo del vino' : 'Accedi al tuo diario personale'}
        </p>

        {error && <div className="bg-red-100 text-red-600 p-3 rounded-xl text-sm mb-4 text-center font-bold">{error}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none"
            required
          />
          <button
            disabled={loading}
            className="w-full bg-wine-red text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-opacity-90 transition-all"
          >
            {loading ? 'Elaborazione...' : isSignUp ? 'Registrati' : 'Accedi'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-wine-red text-sm font-bold underline"
          >
            {isSignUp ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;
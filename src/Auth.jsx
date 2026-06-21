import { useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

function Auth({ onSession }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [privacy, setPrivacy] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // --- LOGICA EMAIL/PASSWORD ---
  const handleAuth = async (e) => {
    e.preventDefault();
    if (isSignUp && !privacy) return alert("Per favore, accetta l'informativa sulla privacy 🛡️");
    
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (data.user) {
          await supabase.from('user_profiles').update({ username: userName }).eq('id', data.user.id);
        }
        alert("Account creato con successo! Benvenuto in WineLink! 🍷✨");
        if (data.session) {
          onSession(data.session.user);
          navigate('/');
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        if (data.session) {
          onSession(data.session.user);
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGICA GOOGLE LOGIN (Il "Ponte" tra le due app) ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // window.location.origin assicura che l'utente torni all'app corrente dopo il login
          redirectTo: window.location.origin 
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-wine-red px-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8">
        <h2 className="text-3xl font-extrabold text-gray-800 text-center mb-2">
          {isSignUp ? 'Crea Account' : 'Bentornato!'}
        </h2>
        <p className="text-gray-500 text-center mb-8 text-sm">
          {isSignUp ? 'Unisciti alla nostra community' : 'Accedi alla tua esperienza sensoriale'}
        </p>

        {error && <div className="bg-red-100 text-red-600 p-3 rounded-xl text-sm mb-4 text-center font-bold">{error}</div>}

        {/* Bottoni Social - Messo in alto per dare priorità a Google */}
        <div className="flex flex-col gap-3 mb-6">
          <button 
            onClick={handleGoogleLogin} 
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Continua con Google
          </button>
        </div>

        {/* Separatore */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">Oppure</span></div>
        </div>

        {/* Form Email/Password */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <input type="text" placeholder="Il tuo Nome" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none" required />
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none" required />
          
          {isSignUp && (
            <label className="flex items-center gap-3 p-2 cursor-pointer text-sm text-gray-600">
              <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} className="w-4 h-4 accent-wine-red" />
              <span>Accetto l'informativa sulla privacy 🛡️</span>
            </label>
          )}

          <button disabled={loading} className="w-full bg-wine-red text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-opacity-90 transition-all disabled:opacity-50">
            {loading ? 'Elaborazione...' : isSignUp ? 'Registrati' : 'Accedi'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-wine-red text-sm font-bold underline">
            {isSignUp ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;
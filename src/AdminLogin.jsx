import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin({ setAdmin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Il tuo PIN magico
    if (pin === '100101') {
      setAdmin(true);
      navigate('/admin');
    } else {
      setError('PIN errato. Accesso negato! ❌');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-wine-red px-4 font-sans">
      <div className="max-w-sm w-full bg-white rounded-[2rem] shadow-2xl p-8 text-center">
        <div className="w-20 h-20 bg-wine-yellow rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl text-wine-red font-bold">🔐</span>
        </div>
        <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Area Riservata</h2>
        <p className="text-gray-500 text-sm mb-8">Inserisci il tuo PIN di accesso per gestire WineLink</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Inserisci il PIN"
            className="w-full p-4 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow text-center text-2xl tracking-[0.5em] outline-none"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          <button
            type="submit"
            className="w-full bg-wine-red text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
          >
            Accedi al Pannello
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
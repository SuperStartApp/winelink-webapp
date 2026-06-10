import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

function Profile({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const syncAndFetch = async () => {
        try {
          // 1. Riscuoti badge dal baule locale (Guest -> User)
          const pending = JSON.parse(localStorage.getItem('pending_badges') || '[]');
          if (pending.length > 0) {
            const { data: p } = await supabase.from('user_profiles').select('badges').eq('id', user.id).single();
            const current = p?.badges || [];
            const updated = [...new Set([...current, ...pending])];
            await supabase.from('user_profiles').update({ badges: updated }).eq('id', user.id);
            localStorage.removeItem('pending_badges');
          }

          // 2. Carica profilo aggiornato
          const { data, error } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
          if (!error) {
            setProfile(data);
          }
        } catch (err) {
          console.error("Errore durante il caricamento profilo:", err);
        } finally {
          setLoading(false);
        }
      };
      syncAndFetch();
    } else {
      setLoading(false);
    }
  }, [user]);

  // SCHERMATA BLOCCO: Se l'utente non è loggato
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-wine-red mb-2">Area Riservata</h2>
        <p className="text-gray-500 mb-8">Accedi per sbloccare il tuo profilo, i tuoi badge e il tuo diario personale.</p>
        <button onClick={() => window.location.href='/auth'} className="bg-wine-red text-white px-8 py-3 rounded-full font-bold shadow-lg">Accedi Ora</button>
      </div>
    );
  }

  // SCHERMATA CARICAMENTO
  if (loading) return <div className="h-screen flex items-center justify-center text-wine-red font-bold">Caricamento Profilo...</div>;

  // Mapping per rendere i nomi delle categorie più belli nel profilo
  const progressMapping = {
    general: { label: 'Basi del Vino', icon: '🍷' },
    territory: { label: 'Territori & Vigneti', icon: '🗺️' },
    pairing: { label: 'L\'Arte dell\'Abbinamento', icon: '🍽️' },
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-8 px-4 font-sans">
      <div className="max-w-md mx-auto">
        
        {/* CARD PROFILO PRINCIPALE */}
        <div className="bg-white rounded-[2rem] shadow-xl p-8 text-center border border-gray-100 mb-8">
          <div className="w-24 h-24 bg-wine-yellow rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-inner">🍷</div>
          <h2 className="text-2xl font-extrabold text-gray-800">{profile?.username || user.email}</h2>
          <p className="text-wine-red font-bold uppercase tracking-widest text-xs mb-6">Membro WineLink</p>
          
          {/* NUOVA SEZIONE PROGRESSI MODULARI */}
          <div className="grid grid-cols-1 gap-3 mb-8">
            {Object.entries(profile?.progress || { general: 1, territory: 1, pairing: 1 }).map(([cat, lvl]) => (
              <div key={cat} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{progressMapping[cat]?.icon || '⭐'}</span>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-tight">
                    {progressMapping[cat]?.label || cat}
                  </p>
                </div>
                <p className="text-xl font-black text-wine-red">Liv. {lvl}</p>
              </div>
            ))}
          </div>

          {/* SEZIONE BADGES */}
          <div className="text-left">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest text-center">I tuoi Badge</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {profile?.badges && profile.badges.length > 0 ? (
                profile.badges.map((badge, idx) => (
                  <div key={idx} className="bg-wine-yellow/20 text-wine-red border border-wine-yellow p-2 rounded-xl text-xs font-bold flex items-center gap-2">
                    <span>🏅</span> {badge}
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-xs italic text-center">Ancora nessun badge. Completa i quiz!</p>
              )}
            </div>
          </div>
        </div>

        {/* LINK RAPIDI AI DIARI */}
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'wine' }))} 
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-wine-red transition"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">🍇</span>
              <div className="text-left">
                <p className="font-bold text-gray-800">La mia Cantina</p>
                <p className="text-xs text-gray-500">Gestisci i tuoi vini salvati</p>
              </div>
            </div>
            <span className="text-gray-300 group-hover:text-wine-red">→</span>
          </button>

          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'food' }))} 
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-wine-green transition"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">🍽️</span>
              <div className="text-left">
                <p className="font-bold text-gray-800">Il mio Menu</p>
                <p className="text-xs text-gray-500">Gestisci i tuoi piatti salvati</p>
              </div>
            </div>
            <span className="text-gray-300 group-hover:text-wine-green">→</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default Profile;
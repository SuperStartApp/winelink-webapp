import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

function Profile({ user, setActiveTab }) { // Aggiunto setActiveTab come prop
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const syncAndFetch = async () => {
        try {
          const pending = JSON.parse(localStorage.getItem('pending_badges') || '[]');
          if (pending.length > 0) {
            const { data: p } = await supabase.from('user_profiles').select('badges').eq('id', user.id).single();
            const current = p?.badges || [];
            const updated = [...new Set([...current, ...pending])];
            await supabase.from('user_profiles').update({ badges: updated }).eq('id', user.id);
            localStorage.removeItem('pending_badges');
          }
          const { data, error } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
          if (!error) setProfile(data);
        } catch (err) {
          console.error("Errore profilo:", err);
        } finally {
          setLoading(false);
        }
      };
      syncAndFetch();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-wine-red mb-2">Area Riservata</h2>
        <p className="text-gray-500 mb-8">Accedi per sbloccare il tuo profilo e i tuoi progressi.</p>
        <button onClick={() => window.location.href='/auth'} className="bg-wine-red text-white px-8 py-3 rounded-full font-bold shadow-lg">Accedi Ora</button>
      </div>
    );
  }

  if (loading) return <div className="h-screen flex items-center justify-center text-wine-red font-bold">Caricamento...</div>;

  const progressMapping = {
    general: { label: 'Basi del Vino', icon: '🍷' },
    territory: { label: 'Territori & Vigneti', icon: '🗺️' },
    pairing: { label: 'L\'Arte dell\'Abbinamento', icon: '🍽️' },
  };

  return (
    <div className="min-h-screen bg-transparent pb-24 pt-8 px-4 font-sans">
      <div className="max-w-md mx-auto">
        
        {/* TESTO DI INTRODUZIONE (Il "Tocco di Classe") */}
        <div className="text-center mb-10 px-4">
          <h2 className="text-3xl font-black text-wine-red tracking-tighter mb-3">Il Tuo Viaggio</h2>
          <p className="text-gray-500 text-sm leading-relaxed font-medium">
            Percorri i moduli, colleziona i badge e affina il tuo palato. <br/> 
            <span className="text-wine-red font-bold">Diventa un estimatore consapevole.</span>
          </p>
          <div className="mt-4 flex justify-center gap-1">
            <div className="w-6 h-1 bg-wine-red rounded-full"></div>
            <div className="w-2 h-1 bg-wine-yellow rounded-full"></div>
            <div className="w-2 h-1 bg-gray-300 rounded-full"></div>
          </div>
        </div>

        {/* CARD PROFILO */}
        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 text-center border border-gray-100 mb-10">
          <div className="w-24 h-24 bg-wine-yellow rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-inner ring-4 ring-wine-yellow/20">🍷</div>
          <h2 className="text-2xl font-extrabold text-gray-800">{profile?.username || user.email}</h2>
          <p className="text-wine-red font-bold uppercase tracking-widest text-[10px] mb-6">Membro WineLink</p>
          
          <div className="grid grid-cols-1 gap-3 mb-8">
            {Object.entries(profile?.progress || { general: 1, territory: 1, pairing: 1 }).map(([cat, lvl]) => (
              <div key={cat} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center group hover:bg-wine-yellow/5 transition-colors">
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

          <div className="text-left">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-widest text-center">I tuoi Badge</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {profile?.badges && profile.badges.length > 0 ? (
                profile.badges.map((badge, idx) => (
                  <div key={idx} className="bg-wine-yellow/20 text-wine-red border border-wine-yellow p-2 rounded-xl text-[10px] font-bold flex items-center gap-2">
                    <span>🏅</span> {badge}
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-xs italic text-center">Ancora nessun badge. Inizia il percorso!</p>
              )}
            </div>
          </div>
        </div>

        {/* ACCESSORIO RAPIDO (Ora Funzionanti!) */}
        <div className="grid grid-cols-1 gap-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-2">Accesso Rapido</h3>
          
          <button 
            onClick={() => setActiveTab('wine')} 
            className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between group hover:border-wine-red transition-all active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-wine-red group-hover:text-white transition-colors">🍇</div>
              <div className="text-left">
                <p className="font-bold text-gray-800">La mia Cantina</p>
                <p className="text-xs text-gray-500">Gestisci i tuoi vini salvati</p>
              </div>
            </div>
            <span className="text-gray-300 group-hover:text-wine-red font-bold">→</span>
          </button>

          <button 
            onClick={() => setActiveTab('food')} 
            className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between group hover:border-wine-green transition-all active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-green-600 group-hover:text-white transition-colors">🍽️</div>
              <div className="text-left">
                <p className="font-bold text-gray-800">Il mio Menu</p>
                <p className="text-xs text-gray-500">Gestisci i tuoi piatti salvati</p>
              </div>
            </div>
            <span className="text-gray-300 group-hover:text-green-600 font-bold">→</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default Profile;
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

function Profile({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const syncAndFetch = async () => {
        // 1. Riscuoti badge dal baule locale
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
        if (!error) setProfile(data);
        setLoading(false);
      };
      syncAndFetch();
    }
  }, [user]);

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="text-6xl mb-4">🔐</div>
      <h2 className="text-2xl font-bold text-wine-red mb-2">Area Riservata</h2>
      <p className="text-gray-500 mb-8">Accedi per sbloccare il tuo profilo e i tuoi badge.</p>
      <button onClick={() => window.location.href='/auth'} className="bg-wine-red text-white px-8 py-3 rounded-full font-bold">Accedi Ora</button>
    </div>
  );

  if (loading) return <div className="h-screen flex items-center justify-center text-wine-red font-bold">Sincronizzazione Profilo...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-8 px-4 font-sans">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-[2rem] shadow-xl p-8 text-center border border-gray-100 mb-8">
          <div className="w-24 h-24 bg-wine-yellow rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-inner">🍷</div>
          <h2 className="text-2xl font-extrabold text-gray-800">{user.email}</h2>
          <p className="text-wine-red font-bold uppercase tracking-widest text-xs mb-6">Membro WineLink</p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><p className="text-gray-400 text-[10px] font-bold uppercase">Livello</p><p className="text-2xl font-black text-gray-800">{profile?.current_level || 1}</p></div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><p className="text-gray-400 text-[10px] font-bold uppercase">Punti</p><p className="text-2xl font-black text-gray-800">{profile?.total_score || 0}</p></div>
          </div>
          <div className="text-left">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">I tuoi Badge</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {profile?.badges && profile.badges.length > 0 ? (
                profile.badges.map((badge, idx) => <div key={idx} className="bg-wine-yellow/20 text-wine-red border border-wine-yellow p-2 rounded-xl text-xs font-bold flex items-center gap-2"><span>🏅</span> {badge}</div>)
              ) : <p className="text-gray-400 text-xs italic">Ancora nessun badge. Completa i quiz!</p>}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <button onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'wine' }))} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-wine-red transition">
            <div className="flex items-center gap-4"><span className="text-3xl">🍇</span><div className="text-left"><p className="font-bold text-gray-800">La mia Cantina</p><p className="text-xs text-gray-500">Gestisci i tuoi vini salvati</p></div></div>
            <span className="text-gray-300 group-hover:text-wine-red">→</span>
          </button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'food' }))} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-wine-green transition">
            <div className="flex items-center gap-4"><span className="text-3xl">🍽️</span><div className="text-left"><p className="font-bold text-gray-800">Il mio Menu</p><p className="text-xs text-gray-500">Gestisci i tuoi piatti salvati</p></div></div>
            <span className="text-gray-300 group-hover:text-wine-green">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
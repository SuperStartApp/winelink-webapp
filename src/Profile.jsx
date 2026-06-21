import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Heart, ExternalLink, Trophy, Award, Info } from 'lucide-react';

function Profile({ user, setActiveTab }) {
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
    general: { label: 'Basi del Vino', icon: '🍷', color: 'bg-red-500' },
    territory: { label: 'Territori & Vigneti', icon: '🗺️', color: 'bg-green-500' },
    pairing: { label: 'L\'Arte dell\'Abbinamento', icon: '🍽️', color: 'bg-yellow-500' },
  };

  const openLink = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-transparent pb-24 pt-8 px-4 font-sans">
      <div className="max-w-md mx-auto space-y-10">
        
        {/* INTRODUZIONE */}
        <div className="text-center mb-8 px-4">
          <h2 className="text-3xl font-black text-wine-red tracking-tighter mb-3">Il Tuo Viaggio</h2>
          <p className="text-gray-500 text-sm leading-relaxed font-medium">
            Percorri i moduli, colleziona i badge e affina il tuo palato. <br/> 
            <span className="text-wine-red font-bold">Diventa un estimatore consapevole.</span>
          </p>
        </div>

        {/* CARD PROFILO PRINCIPALE */}
        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 text-center border border-gray-100">
          <div className="w-24 h-24 bg-wine-yellow rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-inner ring-4 ring-wine-yellow/20">🍷</div>
          <h2 className="text-2xl font-extrabold text-gray-800">{profile?.username || user.email}</h2>
          <p className="text-wine-red font-bold uppercase tracking-widest text-[10px] mb-8">Membro WineLink Academy</p>
          
          {/* SEZIONE PROGRESSO: Barre di Avanzamento */}
          <div className="space-y-6 mb-10 text-left">
            {Object.entries(profile?.progress || { general: 1, territory: 1, pairing: 1 }).map(([cat, lvl]) => {
              const progressPercent = ((lvl - 1) / 4) * 100; // Basato su 5 livelli max
              return (
                <div key={cat} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{progressMapping[cat]?.icon}</span>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">{progressMapping[cat]?.label}</span>
                    </div>
                    <span className="text-xs font-black text-wine-red">Liv. {lvl}/5</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${progressMapping[cat]?.color || 'bg-wine-red'}`} 
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SEZIONE BADGE: Griglia di Trofei */}
          <div className="text-left border-t border-gray-100 pt-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Trophy size={14} className="text-wine-yellow" />
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">I tuoi Trofei</h3>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {profile?.badges && profile.badges.length > 0 ? (
                profile.badges.map((badge, idx) => (
                  <div key={idx} className="bg-white border border-wine-yellow/50 text-wine-red px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 shadow-sm hover:bg-wine-yellow/10 transition-colors">
                    <span>🏅</span> {badge}
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-xs italic text-center">Ancora nessun badge. Inizia il percorso!</p>
              )}
            </div>
          </div>
        </div>

        {/* ACCESSO RAPIDO */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-2">Collegamenti Rapidi</h3>
          <div className="grid grid-cols-1 gap-3">
            <button onClick={() => setActiveTab('wine')} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group active:scale-95 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-wine-red group-hover:text-white transition-colors">🍇</div>
                <div className="text-left">
                  <p className="font-bold text-gray-800 text-sm">La mia Cantina</p>
                  <p className="text-[10px] text-gray-500">Gestisci i tuoi vini salvati</p>
                </div>
              </div>
              <span className="text-gray-300 group-hover:text-wine-red font-bold">→</span>
            </button>

            <button onClick={() => setActiveTab('food')} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group active:scale-95 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-green-600 group-hover:text-white transition-colors">🍽️</div>
                <div className="text-left">
                  <p className="font-bold text-gray-800 text-sm">Il mio Menu</p>
                  <p className="text-[10px] text-gray-500">Gestisci i tuoi piatti salvati</p>
                </div>
              </div>
              <span className="text-gray-300 group-hover:text-green-600 font-bold">→</span>
            </button>
          </div>
        </div>

        {/* CARD SOSTIENICI (Freemium Etico) */}
        <div className="bg-gradient-to-br from-wine-red to-red-900 rounded-[2.5rem] p-8 text-center text-white shadow-xl">
          <Heart className="mx-auto mb-4 text-wine-yellow" size={32} fill="currentColor" />
          <h3 className="text-xl font-black mb-2">Sostieni WineLink</h3>
          <p className="text-white/80 text-xs leading-relaxed mb-6">
            L'Academy è gratuita per tutti perché crediamo nella divulgazione. <br/> 
            Se l'app ti è utile, puoi sostenerci e scoprire le nostre altre app.
          </p>
          <button 
            onClick={() => openLink('https://www.winelink.info/winediary-app/')}
            className="w-full bg-white text-wine-red py-3 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Sostieni il Progetto <ExternalLink size={14}/>
          </button>
        </div>

        {/* SIGILLO IDEA INNOVATIVA LAZIO */}
        <div className="bg-gray-100/50 rounded-3xl p-6 text-center border border-gray-200">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Award size={18} className="text-wine-yellow" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Progetto Certificato</span>
          </div>
          <p className="text-gray-600 text-xs font-medium leading-relaxed mb-4">
            App progettata con il ❤️ <span className="font-bold text-wine-red">SuPeR</span> <br/> 
            per il progetto <span className="font-bold text-gray-800">"IDEA INNOVATIVA LAZIO"</span> WineLink
          </p>
          <button 
            onClick={() => openLink('https://www.winelink.info/support')}
            className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-400 hover:text-wine-red transition-colors uppercase tracking-tighter"
          >
            <Info size={12} /> Supporto & Info
          </button>
        </div>

      </div>
    </div>
  );
}

export default Profile;
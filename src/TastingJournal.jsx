import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// --- 1. COMPONENTI DI SUPPORTO (UI Elements) ---

const CustomInput = ({ label, ...props }) => (
  <div>
    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{label}</label>
    <input {...props} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-red-200 outline-none text-sm font-medium" />
  </div>
);

const VisualProfile = ({ data, colorClass }) => (
  <div className="w-full space-y-2 mb-6">
    {Object.entries(data).map(([key, val]) => (
      <div key={key} className="flex items-center">
        <div className="w-24 text-[10px] font-bold text-gray-500 uppercase truncate">{key}</div>
        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden ml-2">
          <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${val * 10}%` }}></div>
        </div>
        <div className="w-6 text-[10px] font-bold text-right ml-2 opacity-70">{val}</div>
      </div>
    ))}
  </div>
);

const SavedItemCard = ({ item, onDelete, type }) => {
  const isWine = type === 'wine';
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {/* Icona */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${isWine ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {isWine ? '🍷' : '🍽️'}
        </div>

        {/* Testo e Dettagli */}
        <div className="flex flex-col">
          <h4 className="font-bold text-gray-800 leading-tight text-sm">
            {isWine ? (item.wine_name || item.wineName) : (item.food_name || item.foodName)}
          </h4>
          
          <div className="text-[9px] text-gray-500 mt-1 leading-tight max-w-[220px]">
            {isWine ? (
              <>
                {/* Riga 1: Cantina (evidenziata leggermente) */}
                <p className="font-semibold text-gray-600 uppercase tracking-tighter">
                  {item.cellar_name || item.cellar || 'Cantina non indicata'}
                </p>
                {/* Riga 2: Uvaggio e Annata */}
                <p className="text-[10px]">
                  {item.grape_variety || item.grape || 'Uvaggio ignoto'} • {item.vintage || 'N/A'}
                </p>
                {/* Riga 3: Tipo e Denominazione */}
                <p>
                  {item.wine_type || item.type || ''} • {item.denomination || ''}
                </p>
                {/* Riga 4: Affinamento (se esiste) */}
                {item.aging && (
                  <p className="italic text-gray-400">{item.aging}</p>
                )}
              </>
            ) : (
              /* Logica per il Food (rimane pulita come prima) */
              <>
                <p className="font-semibold text-gray-600 uppercase">{item.category || ''}</p>
                <p>{item.tasting_date || item.tastingDate || ''}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottone Elimina */}
      <button onClick={onDelete} className="text-red-400 hover:text-red-600 p-2 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};

const PairingModal = ({ isOpen, onClose, result }) => {
  if (!isOpen || !result) return null;
  const colors = {
    danger: 'bg-red-100 text-red-800 border-red-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    success: 'bg-green-100 text-green-800 border-green-300',
    perfect: 'bg-emerald-200 text-emerald-900 border-emerald-400'
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`max-w-sm w-full rounded-[2.5rem] border-2 p-8 shadow-2xl ${colors[result.status]}`}>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Risultato Abbinamento</p>
          <h3 className="text-5xl font-black mb-2">{result.score}<span className="text-xl opacity-60">/100</span></h3>
          <div className="text-xl font-extrabold mb-4">{result.title}</div>
          <div className="bg-white/50 rounded-2xl p-4 text-sm mb-6 text-left">{result.description}</div>
          <div className="bg-white/30 rounded-2xl p-4 text-sm mb-8 text-left italic border-l-4 border-current">
            <span className="font-bold block not-italic mb-1">💡 Consiglio:</span>{result.tip}
          </div>
          <button onClick={onClose} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold">Chiudi Analisi</button>
        </div>
      </div>
    </div>
  );
};

// --- 2. COMPONENTE PRINCIPALE (TastingJournal) ---

function TastingJournal({ user }) {
  // Stato Valori Degustazione
  const [values, setValues] = useState({ acidita: 5, tannicita: 5, alcolicita: 5, morbidezza: 5, intensita: 5, persistenza: 5 });
  
  // Stato Dettagli Vino (TUTTI i campi ripristinati)
  const [details, setDetails] = useState({ 
    wineName: '', cellar: '', grape: '', vintage: '', 
    type: 'Rosso', denomination: '', aging: '', 
    date: new Date().toISOString().split('T')[0] 
  });

  const [savedWines, setSavedWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); 
  const [searchTerm, setSearchTerm] = useState(''); // NUOVO: Stato Ricerca
  const [matchResult, setMatchResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { loadData(); }, [user]);

  async function loadData() {
    if (user) {
      const { data } = await supabase.from('tasting_logs').select('*').order('tasting_date', { ascending: false });
      if (data) setSavedWines(data);
    } else {
      const localData = localStorage.getItem('guest_wines');
      if (localData) setSavedWines(JSON.parse(localData));
    }
  }

  const handleSliderChange = (e) => setValues(prev => ({ ...prev, [e.target.name]: parseInt(e.target.value) }));
  const handleInputChange = (e) => setDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // LOGICA DI FILTRO UNIFICATA (Data + Testo)
  const getFilteredItems = () => {
    const now = new Date();
    return savedWines.filter(item => {
      // 1. Filtro Testuale (Nome o Uvaggio)
      const nameMatch = (item.wine_name || item.wineName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const grapeMatch = (item.grape_variety || item.grape || '').toLowerCase().includes(searchTerm.toLowerCase());
      const textMatch = nameMatch || grapeMatch;

      // 2. Filtro Temporale
      const d = new Date(item.tasting_date || item.date);
      let dateMatch = true;
      if (filter === 'week') dateMatch = (now - d) / (1000 * 60 * 60 * 24) <= 7;
      if (filter === 'month') dateMatch = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (filter === 'year') dateMatch = d.getFullYear() === now.getFullYear();

      return textMatch && dateMatch;
    });
  };

  const saveTasting = async () => {
    if (!details.wineName) return alert("Nome vino mancante!");
    setLoading(true);

    const dbEntry = {
      user_id: user?.id || null,
      wine_name: details.wineName,
      cellar_name: details.cellar,
      grape_variety: details.grape,
      vintage: details.vintage ? parseInt(details.vintage) : null,
      wine_type: details.type,
      denomination: details.denomination,
      aging: details.aging,
      tasting_date: details.date,
      acidita: values.acidita,
      tannicita: values.tannicita,
      alcolicita: values.alcolicita,
      morbidezza: values.morbidezza,
      intensita: values.intensita,
      persistenza: values.persistenza,
    };

    if (user) {
      const { error } = await supabase.from('tasting_logs').insert([dbEntry]);
      if (error) alert(error.message); else { alert("Salvato!"); await loadData(); }
    } else {
      const updated = [{ ...details, ...values, id: Date.now() }, ...savedWines];
      localStorage.setItem('guest_wines', JSON.stringify(updated));
      setSavedWines(updated);
      alert("Salvato localmente!");
    }
    // Reset Form
    setDetails({ wineName: '', cellar: '', grape: '', vintage: '', type: 'Rosso', denomination: '', aging: '', date: new Date().toISOString().split('T')[0] });
    setValues({ acidita: 5, tannicita: 5, alcolicita: 5, morbidezza: 5, intensita: 5, persistenza: 5 });
    setLoading(false);
  };

  const calculatePairing = () => {
    // Simulazione per il test
    setMatchResult({
      status: 'success',
      score: 85,
      title: 'Abbinamento Armonico ✅',
      description: 'Sinergia rilevata tra le tue scelte.',
      tip: 'Ottima scelta!'
    });
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-8 px-4 font-sans">
      <div className="max-w-md mx-auto">
        <h2 className="text-3xl font-extrabold text-red-900 text-center mb-6">Il mio Diario 🍷</h2>
        
        {/* 1. PROFILO VISIVO */}
        <div className="bg-white rounded-[2rem] shadow-xl p-6 mb-6 border border-gray-100">
          <VisualProfile data={values} colorClass="bg-red-800" />
        </div>

        {/* 2. SLIDER DEGUSTAZIONE */}
        <div className="bg-white rounded-[2rem] shadow-xl p-6 mb-6 border border-gray-100 space-y-4">
          {Object.keys(values).map(key => (
            <div key={key} className="flex flex-col">
              <div className="flex justify-between text-sm font-bold mb-1"><span className="capitalize">{key}</span><span className="text-red-800">{values[key]}</span></div>
              <input type="range" name={key} min="1" max="10" value={values[key]} onChange={handleSliderChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-800" />
            </div>
          ))}
        </div>

        {/* 3. FORM DETTAGLI (TUTTI I CAMPI) */}
        <div className="bg-white rounded-[2rem] shadow-xl p-6 space-y-4 border border-gray-100">
          <CustomInput label="Nome Vino" name="wineName" value={details.wineName} onChange={handleInputChange} placeholder="es. Chianti" />
          <CustomInput label="Cantina" name="cellar" value={details.cellar} onChange={handleInputChange} placeholder="es. Antinori" />
          
          <div className="grid grid-cols-2 gap-4">
            <CustomInput label="Uvaggio" name="grape" value={details.grape} onChange={handleInputChange} placeholder="es. Sangiovese" />
            <CustomInput label="Annata" name="vintage" type="number" value={details.vintage} onChange={handleInputChange} placeholder="2020" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tipo</label>
              <select name="type" value={details.type} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm">
                <option>Rosso</option><option>Bianco</option><option>Rosato</option><option>Bollicine</option>
              </select>
            </div>
            <CustomInput label="Data" name="date" type="date" value={details.date} onChange={handleInputChange} />
          </div>

          <CustomInput label="Denominazione" name="denomination" value={details.denomination} onChange={handleInputChange} placeholder="DOCG" />
          <CustomInput label="Affinamento" name="aging" value={details.aging} onChange={handleInputChange} placeholder="es. Legno" />
          
          <button onClick={saveTasting} disabled={loading} className="w-full bg-red-800 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform">
            {loading ? "Salvataggio..." : "Salva nel Diario ✨"}
          </button>
        </div>

        {/* 4. ARCHIVIO CON RICERCA E FILTRI */}
        {savedWines.length > 0 && (
          <div className="mt-10 space-y-4">
            <h3 className="text-xl font-bold text-gray-800 px-2">Il tuo Archivio</h3>

            {/* BARRA RICERCA */}
            <div className="relative px-2">
              <input 
                type="text" 
                placeholder="Cerca nome o uvaggio..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 bg-white rounded-xl shadow-sm border border-gray-100 text-sm outline-none focus:ring-2 focus:ring-red-100"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* FILTRI TEMPORALI */}
            <div className="flex bg-gray-200/50 p-1 rounded-xl w-full max-w-[280px] mx-auto">
              {['all', 'week', 'month', 'year'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${
                    filter === f ? 'bg-white text-red-800 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {f === 'all' ? 'Tutti' : f === 'week' ? 'Sett' : f === 'month' ? 'Mese' : 'Anno'}
                </button>
              ))}
            </div>

            {/* LISTA RISULTATI */}
            <div className="space-y-3">
              {getFilteredItems().length > 0 ? (
                getFilteredItems().map((w, i) => (
                  <SavedItemCard 
                    key={w.id || i} 
                    item={w} 
                    type="wine"
                    onDelete={async () => {
                      if(user) {
                        await supabase.from('tasting_logs').delete().eq('id', w.id);
                        loadData();
                      } else {
                        const updated = savedWines.filter(x => x.id !== w.id);
                        localStorage.setItem('guest_wines', JSON.stringify(updated));
                        setSavedWines(updated);
                      }
                    }}
                  />
                ))
              ) : (
                <p className="text-center text-gray-400 text-sm py-10">Nessun vino trovato con questi filtri.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <PairingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} result={matchResult} />
    </div>
  );
}

export default TastingJournal;
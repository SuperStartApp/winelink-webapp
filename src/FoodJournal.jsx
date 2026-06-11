import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// --- 1. COMPONENTI DI SUPPORTO (UI Elements) ---

const CustomInput = ({ label, ...props }) => (
  <div>
    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{label}</label>
    <input {...props} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-green-200 outline-none text-sm font-medium" />
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
  const isFood = type === 'food';
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${isFood ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {isFood ? '🍽️' : '🍷'}
        </div>
        <div>
          <h4 className="font-bold text-gray-800 leading-tight text-sm">{isFood ? (item.food_name || item.foodName) : (item.wine_name || item.wineName)}</h4>
          <div className="text-[10px] text-gray-500 mt-1 leading-relaxed">
            {isFood ? (
              <>
                <p>{item.category || ''}</p>
                <p>{item.tasting_date || item.tastingDate || ''}</p>
              </>
            ) : (
              <>
                <p>{item.grape_variety || item.grape || ''}</p>
                <p>{item.vintage || ''} • {item.wine_type || item.type || ''}</p>
              </>
            )}
          </div>
        </div>
      </div>
      <button onClick={onDelete} className="text-red-400 hover:text-red-600 p-2 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};

// --- 2. COMPONENTE PRINCIPALE (FoodJournal) ---

function FoodJournal({ user }) {
  // Stato Valori Degustazione
  const [values, setValues] = useState({ 
    grassezza: 5, sapidita: 5, acidita: 5, dolcezza: 5, 
    speziatura: 5, persistenza: 5, succulenza: 5, untuosita: 5 
  });
  
  // Stato Dettagli Piatto
  const [details, setDetails] = useState({ 
    foodName: '', category: 'Secondo', tastingDate: new Date().toISOString().split('T')[0] 
  });

  const [savedFoods, setSavedFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { loadData(); }, [user]);

  async function loadData() {
    if (user) {
      const { data } = await supabase.from('food_logs').select('*').order('tasting_date', { ascending: false });
      if (data) setSavedFoods(data);
    } else {
      const localData = localStorage.getItem('guest_foods');
      if (localData) setSavedFoods(JSON.parse(localData));
    }
  }

  const handleSliderChange = (e) => setValues(prev => ({ ...prev, [e.target.name]: parseInt(e.target.value) }));
  const handleInputChange = (e) => setDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // LOGICA DI FILTRO UNIFICATA (Testo + Data)
  const getFilteredItems = () => {
    const now = new Date();
    return savedFoods.filter(item => {
      // 1. Filtro Testuale (Nome Piatto o Categoria)
      const nameMatch = (item.food_name || item.foodName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = (item.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      const textMatch = nameMatch || categoryMatch;

      // 2. Filtro Temporale
      const d = new Date(item.tasting_date || item.tastingDate);
      let dateMatch = true;
      if (filter === 'week') dateMatch = (now - d) / (1000 * 60 * 60 * 24) <= 7;
      if (filter === 'month') dateMatch = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (filter === 'year') dateMatch = d.getFullYear() === now.getFullYear();

      return textMatch && dateMatch;
    });
  };

  const saveFood = async () => {
    if (!details.foodName) return alert("Nome piatto mancante!");
    setLoading(true);

    const dbEntry = {
      user_id: user?.id || null,
      food_name: details.foodName,
      category: details.category,
      tasting_date: details.tastingDate,
      grassezza: values.grassezza,
      sapidita: values.sapidita,
      acidita: values.acidita,
      dolcezza: values.dolcezza,
      speziatura: values.speziatura,
      persistenza: values.persistenza,
      succulenza: values.succulenza,
      untuosita: values.untuosita,
    };

    if (user) {
      const { error } = await supabase.from('food_logs').insert([dbEntry]);
      if (error) alert(error.message); else { alert("Salvataggio riuscito!"); await loadData(); }
    } else {
      const updated = [{ ...details, ...values, id: Date.now() }, ...savedFoods];
      localStorage.setItem('guest_foods', JSON.stringify(updated));
      setSavedFoods(updated);
      alert("Salvato localmente!");
    }
    // Reset Form
    setDetails({ foodName: '', category: 'Secondo', tastingDate: new Date().toISOString().split('T')[0] });
    setValues({ grassezza: 5, sapidita: 5, acidita: 5, dolcezza: 5, speziatura: 5, persistenza: 5, succulenza: 5, untuosita: 5 });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-8 px-4 font-sans">
      <div className="max-md mx-auto max-w-md">
        <h2 className="text-3xl font-extrabold text-green-900 text-center mb-6">Il mio Diario Food 🍽️</h2>
        
        {/* 1. PROFILO VISIVO */}
        <div className="bg-white rounded-[2rem] shadow-xl p-6 mb-6 border border-gray-100">
          <VisualProfile data={values} colorClass="bg-green-600" />
        </div>

        {/* 2. SLIDER DEGUSTAZIONE */}
        <div className="bg-white rounded-[2rem] shadow-xl p-6 mb-6 border border-gray-100 space-y-4">
          {Object.keys(values).map(key => (
            <div key={key} className="flex flex-col">
              <div className="flex justify-between text-sm font-bold mb-1"><span className="capitalize">{key}</span><span className="text-green-700">{values[key]}</span></div>
              <input type="range" name={key} min="1" max="10" value={values[key]} onChange={handleSliderChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600" />
            </div>
          ))}
        </div>

        {/* 3. FORM DETTAGLI */}
        <div className="bg-white rounded-[2rem] shadow-xl p-6 space-y-4 border border-gray-100">
          <CustomInput label="Nome Piatto" name="foodName" value={details.foodName} onChange={handleInputChange} placeholder="es. Tagliata" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Categoria</label>
              <select name="category" value={details.category} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm">
                <option>Antipasto</option><option>Primo</option><option>Secondo</option><option>Dessert</option>
              </select>
            </div>
            <CustomInput label="Data" name="tastingDate" type="date" value={details.tastingDate} onChange={handleInputChange} />
          </div>
          <button onClick={saveFood} disabled={loading} className="w-full bg-green-700 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform">
            {loading ? "Salvataggio..." : "Salva Piatto ✨"}
          </button>
        </div>

        {/* 4. ARCHIVIO CON RICERCA E FILTRI */}
        {savedFoods.length > 0 && (
          <div className="mt-10 space-y-4">
            <h3 className="text-xl font-bold text-gray-800 px-2">I tuoi piatti</h3>

            {/* BARRA RICERCA */}
            <div className="relative px-2">
              <input 
                type="text" 
                placeholder="Cerca piatto o categoria..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 bg-white rounded-xl shadow-sm border border-gray-100 text-sm outline-none focus:ring-2 focus:ring-green-100"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 01-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* FILTRI TEMPORALI */}
            <div className="flex bg-gray-200/50 p-1 rounded-xl w-full max-w-[280px] mx-auto">
              {['all', 'week', 'month', 'year'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${
                    filter === f ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {f === 'all' ? 'Tutti' : f === 'week' ? 'Sett' : f === 'month' ? 'Mese' : 'Anno'}
                </button>
              ))}
            </div>

            {/* LISTA RISULTATI */}
            <div className="space-y-3">
              {getFilteredItems().length > 0 ? (
                getFilteredItems().map((item, i) => (
                  <SavedItemCard 
                    key={item.id || i} 
                    item={item} 
                    type="food"
                    onDelete={async () => {
                      if(user) {
                        await supabase.from('food_logs').delete().eq('id', item.id);
                        loadData();
                      } else {
                        const updated = savedFoods.filter(x => x.id !== item.id);
                        localStorage.setItem('guest_foods', JSON.stringify(updated));
                        setSavedFoods(updated);
                      }
                    }}
                  />
                ))
              ) : (
                <p className="text-center text-gray-400 text-sm py-10">Nessun piatto trovato.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FoodJournal;
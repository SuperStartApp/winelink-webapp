import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const PairingModal = ({ isOpen, onClose, result }) => {
  if (!isOpen || !result) return null;

  const colors = {
    danger: 'bg-red-100 text-red-800 border-red-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    success: 'bg-green-100 text-green-800 border-green-300',
    perfect: 'bg-emerald-200 text-emerald-900 border-emerald-400'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`max-w-sm w-full rounded-[2.5rem] border-2 p-8 shadow-2xl animate-in zoom-in-95 duration-300 ${colors[result.status]}`}>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Risultato Abbinamento</p>
          <h3 className="text-5xl font-black mb-2">{result.score}<span className="text-xl opacity-60">/100</span></h3>
          <div className="text-xl font-extrabold mb-4 leading-tight">{result.title}</div>
          <div className="bg-white/50 rounded-2xl p-4 text-sm mb-6 text-left leading-relaxed">{result.description}</div>
          <div className="bg-white/30 rounded-2xl p-4 text-sm mb-8 text-left italic border-l-4 border-current">
            <span className="font-bold block not-italic mb-1">💡 Consiglio del Sommelier:</span>
            {result.tip}
          </div>
          <button onClick={onClose} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform">Chiudi Analisi</button>
        </div>
      </div>
    </div>
  );
};

function PairingEngine({ user }) {
  const [wines, setWines] = useState([]);
  const [foods, setFoods] = useState([]);
  const [selectedWineId, setSelectedWineId] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [wineSensoryData, setWineSensoryData] = useState(null); // Dati per il calcolo
  const [matchResult, setMatchResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) fetchData(); }, [user]);

  async function fetchData() {
    try {
      // 🍇 PESCAGGIO VINI: Usiamo la VIEW e filtriamo per utente
      const { data: wineData } = await supabase
        .from('academy_all_wines')
        .select('*')
        .eq('user_id', user.id);

      // 🍽️ PESCAGGIO CIBI: Filtriamo per utente
      const { data: foodData } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id);

      setWines(wineData || []);
      setFoods(foodData || []);
    } catch (error) {
      console.error("Errore caricamento:", error);
    }
  }

  // FUNZIONE PONTE: Recupera l'ultima degustazione per avere i valori sensoriali
  async function fetchWineSensoryProfile(wineId) {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('diar_tastings') // Usiamo la tabella delle degustazioni della Diary
        .select('*')
        .eq('wine_id', wineId)
        .order('data_degustazione', { ascending: false })
        .limit(1);
      
      setWineSensoryData(data && data.length > 0 ? data[0] : null);
    } catch (e) {
      console.error("Errore recupero profilo sensoriale:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedWineId) fetchWineSensoryProfile(selectedWineId);
    else setWineSensoryData(null);
  }, [selectedWineId]);

  const getVal = (obj, ...names) => {
    for (let name of names) {
      if (obj && obj[name] !== undefined && obj[name] !== null) return obj[name];
    }
    return 5;
  };

  const calculatePairing = () => {
    const food = foods.find(f => f.id === selectedFoodId);
    const wine = wineSensoryData; // Usiamo i dati sensoriali pescati dal ponte
    if (!wine || !food) {
      alert("Per favore, scegli un vino che abbia almeno una nota di degustazione registrata.");
      return;
    }

    const pairs = [
      { 
        label: 'Grassezza vs Freschezza', 
        v1: getVal(food, 'grassezza', 'fat'), 
        v2: (getVal(wine, 'acidita', 'acidity') + getVal(wine, 'tannicita', 'tannicity')) / 2,
        type: 'contrast'
      },
      { 
        name: 'Sapidità vs Morbidezza', 
        v1: getVal(food, 'sapidita', 'saltiness'), 
        v2: getVal(wine, 'morbidezza', 'morbidezza'), 
        type: 'contrast' 
      },
      { 
        name: 'Dolcezza vs Dolcezza', 
        v1: getVal(food, 'dolcezza', 'sweetness'), 
        v2: getVal(wine, 'dolcezza', 'sweetness'), 
        type: 'concordance' 
      },
      { 
        name: 'Speziatura vs Intensità', 
        v1: getVal(food, 'speziatura', 'speziatura'), 
        v2: getVal(wine, 'intensita', 'intensita'), 
        type: 'concordance' 
      },
      { 
        name: 'Persistenza vs Persistenza', 
        v1: getVal(food, 'persistenza', 'persistenza'), 
        v2: getVal(wine, 'persistenza', 'persistenza'), 
        type: 'concordance' 
      },
    ];

    let totalScore = 0;
    pairs.forEach(pair => {
      const diff = Math.abs(pair.v1 - pair.v2);
      const scoreFromPair = Math.max(0, (10 - diff) * 2);
      totalScore += scoreFromPair;
    });

    let result = {};
    if (totalScore >= 90) {
      result = { status: 'perfect', score: Math.round(totalScore), title: 'Abbinamento Eccellente 🌟', description: 'Sinergia ideale tra piatto e calice. Le sensazioni si integrano reciprocamente.', tip: 'Un connubio di alto livello!' };
    } else if (totalScore >= 70) {
      result = { status: 'success', score: Math.round(totalScore), title: 'Abbinamento Armonico ✅', description: 'Ottima sinergia. Le durezze del cibo sono ben compensate.', tip: 'È una scelta sicura.' };
    } else if (totalScore >= 50) {
      result = { status: 'warning', score: Math.round(totalScore), title: 'Abbinamento Accettabile 🆗', description: 'Un accostamento sufficiente, ma manca la giusta sinergia.', tip: 'Prova a bilanciare meglio l\'intensità.' };
    } else {
      result = { status: 'danger', score: Math.round(totalScore), title: 'Abbinamento Disarmonico ⚠️', description: 'Cibo e vino non si valorizzano o uno dei due copre l\'altro.', tip: 'Prova un vino più fresco se il cibo è grasso.' };
    }

    setMatchResult(result);
    setIsModalOpen(true);
  };

  const comparisonRows = [
    { label: 'Grassezza / Freschezza', foodKey: ['grassezza', 'fat'], wineKey: ['acidita', 'tannicita'], isMixed: true },
    { label: 'Sapidità / Morbidezza', foodKey: ['sapidita', 'saltiness'], wineKey: ['morbidezza'], isMixed: false },
    { label: 'Dolcezza / Dolcezza', foodKey: ['dolcezza', 'sweetness'], wineKey: ['dolcezza'], isMixed: false },
    { label: 'Speziatura / Intensità', foodKey: ['speziatura', 'speziatura'], wineKey: ['intensita'], isMixed: false },
    { label: 'Persistenza / Persistenza', foodKey: ['persistenza', 'persistenza'], wineKey: ['persistenza'], isMixed: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-8 px-4 font-sans">
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-red-900 mb-2">Pairing Engine 🧪</h2>
        <p className="text-gray-500 text-sm mb-8">Sinergia Enogastronomica Professionale</p>

        <div className="bg-white rounded-[2rem] shadow-xl p-6 mb-6 border border-gray-100">
          <div className="space-y-4 mb-8">
            <div className="text-left">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Vino</label>
              <select value={selectedWineId} onChange={(e) => setSelectedWineId(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm font-medium">
                <option value="">-- Scegli un vino --</option>
                {wines.map(w => <option key={w.id} value={w.id}>{w.nome_vino}</option>)}
              </select>
            </div>
            <div className="text-left">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Piatto</label>
              <select value={selectedFoodId} onChange={(e) => setSelectedFoodId(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm font-medium">
                <option value="">-- Scegli un piatto --</option>
                {foods.map(f => <option key={f.id} value={f.id}>{f.food_name}</option>)}
              </select>
            </div>
            <button 
              onClick={calculatePairing} 
              disabled={!selectedWineId || !selectedFoodId || loading} 
              className="w-full bg-red-800 text-white py-4 rounded-2xl font-bold text-lg shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Sintonizzando...' : 'Analizza Armonia'}
            </button>
          </div>

          {selectedWineId && selectedFoodId && (
            <div className="animate-in fade-in zoom-in duration-500 mt-4">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-4 px-2">
                <span>Cibo (Input)</span>
                <span>Vino (Risposta)</span>
              </div>
              
              <div className="space-y-5">
                {comparisonRows.map((row, idx) => {
                  const food = foods.find(f => f.id === selectedFoodId);
                  const foodVal = getVal(food, ...row.foodKey);
                  
                  let wineVal = 0;
                  if (row.isMixed) {
                    wineVal = (getVal(wineSensoryData, row.wineKey[0]) + getVal(wineSensoryData, row.wineKey[1])) / 2;
                  } else {
                    wineVal = getVal(wineSensoryData, ...row.wineKey);
                  }
                  
                  return (
                    <div key={idx} className="flex items-center">
                      <div className="flex-1 flex justify-end pr-2">
                        <div className="h-3 bg-green-500 rounded-l-full transition-all duration-1000" style={{ width: `${foodVal * 10}%` }}></div>
                      </div>
                      <div className="w-32 text-[9px] font-extrabold text-gray-500 uppercase text-center tracking-tighter leading-tight px-1">
                        {row.label}
                      </div>
                      <div className="flex-1 flex justify-start pl-2">
                        <div className="h-3 bg-red-800 rounded-r-full transition-all duration-1000" style={{ width: `${wineVal * 10}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 h-1 w-full bg-gray-100 rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      <PairingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} result={matchResult} />
    </div>
  );
}

export default PairingEngine;
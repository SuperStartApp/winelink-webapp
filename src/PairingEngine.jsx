import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// --- COMPONENTE MODAL (UI Risultato) ---
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
          
          <div className="bg-white/50 rounded-2xl p-4 text-sm mb-6 text-left leading-relaxed">
            {result.description}
          </div>

          <div className="bg-white/30 rounded-2xl p-4 text-sm mb-8 text-left italic border-l-4 border-current">
            <span className="font-bold block not-italic mb-1">💡 Consiglio del Sommelier:</span>
            {result.tip}
          </div>

          <button 
            onClick={onClose} 
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform"
          >
            Chiudi Analisi
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MOTORE DI PAIRING (LOGICA CORE) ---
function PairingEngine() {
  const [wines, setWines] = useState([]);
  const [foods, setFoods] = useState([]);
  const [selectedWineId, setSelectedWineId] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const { data: wineData } = await supabase.from('tasting_logs').select('*');
      const { data: foodData } = await supabase.from('food_logs').select('*');
      setWines(wineData || []);
      setFoods(foodData || []);
    } catch (error) {
      console.error("Errore caricamento:", error);
    }
  }

  // Helper per recuperare valori dal DB gestendo eventuali nomi diversi
  const getVal = (obj, ...names) => {
    for (let name of names) {
      if (obj[name] !== undefined && obj[name] !== null) return obj[name];
    }
    return 5; // Default centrale
  };

  const calculatePairing = () => {
    const wine = wines.find(w => w.id === selectedWineId);
    const food = foods.find(f => f.id === selectedFoodId);
    if (!wine || !food) return;

    /**
     * LOGICA ENOLOGICA PROFESSIONALE (Metodo FIS)
     * Definiamo le coppie di confronto. 
     * Per i contrasti, l'obiettivo è che v1 (cibo) e v2 (vino) siano simili.
     */
    const pairs = [
      { 
        label: 'Grassezza vs Freschezza', 
        v1: getVal(food, 'grassezza', 'fat'), 
        // La grassezza si combatte con la media di acidità e tannicità
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
        v2: getVal(wine, 'dolcezza', 'sweetness'), // Fondamentale per il dessert!
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

    // Calcolo Punteggio: Più la differenza è vicina a 0, più il punteggio è alto.
    // Ogni coppia può contribuire con max 20 punti (5 coppie * 20 = 100).
    let totalScore = 0;
    pairs.forEach(pair => {
      const diff = Math.abs(pair.v1 - pair.v2);
      // Limitiamo la differenza massima a 10 per evitare punteggi negativi
      const scoreFromPair = Math.max(0, (10 - diff) * 2);
      totalScore += scoreFromPair;
    });

    // Determinazione Categoria e Feedback (Basato sui tuoi testi)
    let result = {};
    if (totalScore >= 90) {
      result = {
        status: 'perfect',
        score: Math.round(totalScore),
        title: 'Abbinamento Eccellente 🌟',
        description: 'Sinergia ideale tra piatto e calice. Le sensazioni si integrano reciprocamente, creando un perfetto equilibrio.',
        tip: 'Un connubio di alto livello in cui il vino e il piatto si esaltano al massimo delle loro potenzialità.'
      };
    } else if (totalScore >= 70) {
      result = {
        status: 'success',
        score: Math.round(totalScore),
        title: 'Abbinamento Armonico ✅',
        description: 'Ottima sinergia. Le durezze del cibo sono ben compensate dalla morbidezza e dalla freschezza del vino.',
        tip: 'È una scelta sicura che rispetta i principi della degustazione e garantisce un\'ottima esperienza.'
      };
    } else if (totalScore >= 50) {
      result = {
        status: 'warning',
        score: Math.round(totalScore),
        title: 'Abbinamento Accettabile 🆗',
        description: 'Un accostamento sufficiente. Cibo e vino convivono senza darsi fastidio, ma manca la giusta sinergia.',
        tip: 'Cerca di avvicinare l\'intensità del vino a quella del piatto: un cibo strutturato richiede un vino più complesso.'
      };
    } else {
      result = {
        status: 'danger',
        score: Math.round(totalScore),
        title: 'Abbinamento Disarmonico ⚠️',
        description: 'Cibo e vino non si valorizzano o uno dei due copre l\'altro. Potrebbero crearsi sensazioni spiacevoli.',
        tip: 'Prova un vino più fresco (acido) se il cibo è molto grasso, o uno più morbido se il piatto è troppo sapido.'
      };
    }

    setMatchResult(result);
    setIsModalOpen(true);
  };

  // Definiamo le righe per il grafico UI. 
  // Nota: Le chiavi devono corrispondere alla logica usata in calculatePairing per mostrare i dati giusti.
  const comparisonRows = [
    { label: 'Grassezza / Freschezza', foodKey: ['grassezza', 'fat'], wineKey: ['acidita', 'tannicita', 'acidity'], isMixed: true },
    { label: 'Sapidità / Morbidezza', foodKey: ['sapidita', 'saltiness'], wineKey: ['morbidezza', 'morbidezza'], isMixed: false },
    { label: 'Dolcezza / Dolcezza', foodKey: ['dolcezza', 'sweetness'], wineKey: ['dolcezza', 'sweetness'], isMixed: false },
    { label: 'Speziatura / Intensità', foodKey: ['speziatura', 'speziatura'], wineKey: ['intensita', 'intensita'], isMixed: false },
    { label: 'Persistenza / Persistenza', foodKey: ['persistenza', 'persistenza'], wineKey: ['persistenza', 'persistenza'], isMixed: false },
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
                {wines.map(w => <option key={w.id} value={w.id}>{w.wine_name}</option>)}
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
              disabled={!selectedWineId || !selectedFoodId} 
              className="w-full bg-red-800 text-white py-4 rounded-2xl font-bold text-lg shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              Analizza Armonia
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
                  const wine = wines.find(w => w.id === selectedWineId);
                  const food = foods.find(f => f.id === selectedFoodId);
                  const foodVal = getVal(food, ...row.foodKey);
                  
                  let wineVal = 0;
                  if (row.isMixed) {
                    // Se è la riga della grassezza, facciamo la media tra acidità e tannicità
                    wineVal = (getVal(wine, row.wineKey[0], row.wineKey[1]) + getVal(wine, row.wineKey[0], row.wineKey[1])) / 2;
                    // Nota: per semplicità di visualizzazione qui prendiamo la media se il DB non ha un campo "freschezza" unico
                    // In un'app reale, useresti una funzione dedicata per la media dei valori vino.
                  } else {
                    wineVal = getVal(wine, ...row.wineKey);
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

      <PairingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        result={matchResult} 
      />
    </div>
  );
}

export default PairingEngine;
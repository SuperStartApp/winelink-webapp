import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function PairingEngine() {
  const [wines, setWines] = useState([]);
  const [foods, setFoods] = useState([]);
  const [selectedWineId, setSelectedWineId] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Carica i dati da Supabase all'avvio
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: wineData } = await supabase.from('tasting_logs').select('*');
    const { data: foodData } = await supabase.from('food_logs').select('*');
    setWines(wineData || []);
    setFoods(foodData || []);
  }

  // 2. L'ALGORITMO DI ABBINAMENTO (La Magia)
  const checkPairing = () => {
    const wine = wines.find(w => w.id === selectedWineId);
    const food = foods.find(f => f.id === selectedFoodId);

    if (!wine || !food) return;

    let score = 0;

    // Logica di equilibrio chimico:
    // - Alta acidità del vino bilancia l'alto grasso del cibo
    if (wine.acidity > 6 && food.fat > 6) score += 1;
    // - Alti tannini del vino bilanciano l'alto grasso del cibo
    if (wine.tannins > 6 && food.fat > 6) score += 1;
    // - L'alcol aiuta a pulire la bocca dalla salinità
    if (wine.alcohol > 6 && food.saltiness > 6) score += 1;
    // - La dolcezza del vino bilancia l'acidità del cibo
    if (wine.sweetness > 6 && food.acidity > 6) score += 1;
    // - L'umami del cibo richiede corpo nel vino
    if (wine.body > 6 && food.umami > 6) score += 1;

    if (score >= 2) {
      setMatchResult({
        status: 'success',
        text: "Abbinamento Vincente! 🍷✨",
        sub: "Le strutture si bilanciano perfettamente."
      });
    } else if (score === 1) {
      setMatchResult({
        status: 'warning',
        text: "Abbinamento Interessante 🧐",
        sub: "Un incontro particolare, prova a bilanciare meglio."
      });
    } else {
      setMatchResult({
        status: 'danger',
        text: "Squilibrio di Sapori ⚠️",
        sub: "Uno dei due elementi sovrasta l'altro. Prova un altro vino!"
      });
    }
  };

  // 3. PREPARAZIONE DATI PER IL GRAFICO (Mappatura sugli assi comuni)
  const getChartData = () => {
    const wine = wines.find(w => w.id === selectedWineId);
    const food = foods.find(f => f.id === selectedFoodId);
    if (!wine || !food) return null;

    return {
      labels: ['Acidità', 'Struttura', 'Intensità', 'Carattere', 'Dolcezza'],
      datasets: [
        {
          label: 'Vino',
          // Mappatura: Tannini -> Struttura, Corpo -> Intensità, Alcol -> Carattere
          data: [wine.acidity, wine.tannins, wine.body, wine.alcohol, wine.sweetness],
          backgroundColor: 'rgba(153, 34, 53, 0.3)',
          borderColor: '#992235',
          borderWidth: 3,
        },
        {
          label: 'Cibo',
          // Mappatura: Grasso -> Struttura, Umami -> Intensità, Salinità -> Carattere
          data: [food.acidity, food.fat, food.umami, food.saltiness, food.sweetness],
          backgroundColor: 'rgba(213, 224, 160, 0.4)',
          borderColor: '#D5E0A0',
          borderWidth: 3,
        }
      ]
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-8 px-4 font-sans">
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-wine-red mb-2">Pairing Engine 🧪</h2>
        <p className="text-gray-500 text-sm mb-8">Trova l'armonia perfetta tra i tuoi sapori</p>

        <div className="bg-white rounded-[2rem] shadow-xl p-6 mb-6 border border-gray-100">
          <div className="space-y-4 mb-8">
            <div className="text-left">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Seleziona il Vino</label>
              <select 
                value={selectedWineId} 
                onChange={(e) => setSelectedWineId(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none text-sm font-medium"
              >
                <option value="">-- Scegli un vino dal tuo diario --</option>
                {wines.map(w => <option key={w.id} value={w.id}>{w.wine_name}</option>)}
              </select>
            </div>

            <div className="text-left">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Seleziona il Piatto</label>
              <select 
                value={selectedFoodId} 
                onChange={(e) => setSelectedFoodId(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none text-sm font-medium"
              >
                <option value="">-- Scegli un piatto dal tuo diario --</option>
                {foods.map(f => <option key={f.id} value={f.id}>{f.food_name}</option>)}
              </select>
            </div>

            <button 
              onClick={checkPairing}
              disabled={!selectedWineId || !selectedFoodId}
              className="w-full bg-wine-yellow text-wine-red py-4 rounded-2xl font-bold text-lg shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              Analizza Abbinamento
            </button>
          </div>

          {/* AREA GRAFICA */}
          {getChartData() && (
            <div className="animate-in fade-in zoom-in duration-500">
              <div className="h-64">
                <Radar 
                  data={getChartData()} 
                  options={{ 
                    scales: { r: { min: 0, max: 10, ticks: { display: false }, grid: { color: '#E5E7EB' } } },
                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } 
                  }} 
                />
              </div>
              
              {/* RISULTATO TESTUALE */}
              {matchResult && (
                <div className={`mt-6 p-4 rounded-2xl text-center animate-bounce-short ${
                  matchResult.status === 'success' ? 'bg-green-100 text-green-700' : 
                  matchResult.status === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                  <p className="font-extrabold text-lg">{matchResult.text}</p>
                  <p className="text-xs opacity-80">{matchResult.sub}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PairingEngine;
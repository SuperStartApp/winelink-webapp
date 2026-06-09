import { useState, useEffect } from 'react';
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

// Registriamo i componenti di Chart.js per la ragnatela
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

function FoodJournal({ user }) {
  // 1. STATI DEL COMPONENTE
  const [values, setValues] = useState({
    fat: 5, acidity: 5, saltiness: 5, sweetness: 5, umami: 5,
  });

  const [details, setDetails] = useState({
    foodName: '',
    category: 'Secondo',
    tastingDate: new Date().toISOString().split('T')[0],
  });

  const [savedFoods, setSavedFoods] = useState([]);
  const [loading, setLoading] = useState(false);

  // 2. CARICAMENTO DATI (All'avvio)
  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (user) {
      const { data, error } = await supabase.from('food_logs').select('*').order('tasting_date', { ascending: false });
      if (!error) setSavedFoods(data);
    } else {
      const localData = localStorage.getItem('guest_foods');
      if (localData) setSavedFoods(JSON.parse(localData));
    }
  }

  // 3. FUNZIONI DI GESTIONE (QUI C'ERA L'ERRORE!)
  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: parseInt(value) });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDetails({ ...details, [name]: value });
  };

  const saveFood = async () => {
    if (!details.foodName) return alert("Dai un nome al piatto! 🍽️");
    setLoading(true);

    const newEntry = {
      ...details,
      ...values,
      user_id: user?.id || null,
      tasting_date: details.tastingDate,
    };

    if (user) {
      const { error } = await supabase.from('food_logs').insert([newEntry]);
      if (error) {
        alert("Errore: " + error.message);
      } else {
        alert("Piatto salvato nel tuo diario! ✨");
        await loadData();
      }
    } else {
      const updatedList = [newEntry, ...savedFoods];
      localStorage.setItem('guest_foods', JSON.stringify(updatedList));
      setSavedFoods(updatedList);
      alert("Salvataggio locale effettuato! 📱");
    }

    // Reset Form
    setDetails({
      foodName: '', category: 'Secondo', tastingDate: new Date().toISOString().split('T')[0],
    });
    setValues({ fat: 5, acidity: 5, saltiness: 5, sweetness: 5, umami: 5 });
    setLoading(false);
  };

  const deleteFood = async (id, isGuest) => {
    if (isGuest) {
      const updatedList = savedFoods.filter(f => f.id !== id);
      localStorage.setItem('guest_foods', JSON.stringify(updatedList));
      setSavedFoods(updatedList);
    } else {
      const { error } = await supabase.from('food_logs').delete().eq('id', id);
      if (!error) await loadData();
    }
  };

  // 4. CONFIGURAZIONE GRAFICO RADAR
  const chartData = {
    labels: ['Grasso', 'Acidità', 'Salinità', 'Dolcezza', 'Umami'],
    datasets: [{
      label: 'Profilo Cibo',
      data: [values.fat, values.acidity, values.saltiness, values.sweetness, values.umami],
      backgroundColor: 'rgba(213, 224, 160, 0.4)',
      borderColor: '#D5E0A0',
      borderWidth: 3,
      pointBackgroundColor: '#992235',
    }],
  };

  const chartOptions = {
    scales: {
      r: {
        min: 0,
        max: 10,
        ticks: { display: false },
        grid: { color: '#E5E7EB' },
        angleLines: { color: '#E5E7EB' },
      },
    },
    plugins: { legend: { display: false } },
  };

  // 5. INTERFACCIA (JSX)
  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-8 px-4 font-sans">
      <div className="max-w-md mx-auto">
        <h2 className="text-3xl font-extrabold text-wine-red text-center mb-6">Il mio Diario Food 🍽️</h2>

        {/* Grafico */}
        <div className="bg-white rounded-[2rem] shadow-xl p-4 mb-6 border border-gray-100">
          <div className="w-full max-w-[250px] mx-auto">
            <Radar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Slider Sensoriali */}
        <div className="bg-white rounded-[2rem] shadow-xl p-6 mb-6 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">Profilo Sensoriale</h3>
          <div className="space-y-4">
            {Object.keys(values).map((key) => (
              <div key={key}>
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-bold text-gray-700 capitalize">{key}</label>
                  <span className="text-sm font-bold text-wine-green">{values[key]}</span>
                </div>
                <input 
                  type="range" 
                  name={key} 
                  min="1" 
                  max="10" 
                  value={values[key]} 
                  onChange={handleSliderChange} 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-wine-green" 
                />
              </div>
            ))}
          </div>
        </div>

        {/* Form Dettagli */}
        <div className="bg-white rounded-[2rem] shadow-xl p-6 space-y-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-2 tracking-widest">Dettagli del Piatto</h3>
          <div className="grid grid-cols-1 gap-4">
            <Input label="Nome del Piatto" name="foodName" value={details.foodName} onChange={handleInputChange} placeholder="es. Tagliata di manzo" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Categoria</label>
                <select name="category" value={details.category} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none text-sm font-medium">
                  <option>Antipasto</option><option>Primo</option><option>Secondo</option><option>Dessert</option><option>Finger Food</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Data</label>
                <input type="date" name="tastingDate" value={details.tastingDate} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none text-sm font-medium" />
              </div>
            </div>
          </div>
          <button onClick={saveFood} disabled={loading} className="w-full bg-wine-green text-gray-800 py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50 mt-4">
            Salva Piatto ✨
          </button>
        </div>

        {/* Lista Salvataggi */}
        {savedFoods.length > 0 && (
          <div className="mt-10">
            <h3 className="text-xl font-bold text-gray-800 mb-4 px-2">I tuoi ultimi piatti</h3>
            <div className="space-y-3">
              {savedFoods.map((food) => (
                <div key={food.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">{food.food_name}</p>
                    <p className="text-xs text-gray-500">{food.category} • {food.tasting_date}</p>
                  </div>
                  <button onClick={() => deleteFood(food.id, !user)} className="text-red-400 text-xs font-bold uppercase hover:text-red-600">
                    Elimina
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente Helper Input
function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{label}</label>
      <input {...props} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none text-sm font-medium" />
    </div>
  );
}

export default FoodJournal;
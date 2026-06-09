import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function FoodJournal({ user }) {
  const [values, setValues] = useState({ fat: 5, acidity: 5, saltiness: 5, sweetness: 5, umami: 5 });
  const [details, setDetails] = useState({ foodName: '', category: 'Secondo', tastingDate: new Date().toISOString().split('T')[0] });
  const [savedFoods, setSavedFoods] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleSliderChange = (e) => {
    setValues(prev => ({ ...prev, [e.target.name]: parseInt(e.target.value) }));
  };

  const handleInputChange = (e) => {
    setDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveFood = async () => {
    if (!details.foodName) return alert("Nome piatto mancante!");
    setLoading(true);

    // OGGETTO PULITO PER IL DATABASE (Senza commenti interni)
    const dbEntry = {
      user_id: user?.id || null,
      food_name: details.foodName,
      category: details.category,
      tasting_date: details.tastingDate,
      fat: values.fat,
      acidity: values.acidity,
      saltiness: values.saltiness,
      sweetness: values.sweetness,
      umami: values.umami,
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
    setDetails({ foodName: '', category: 'Secondo', tastingDate: new Date().toISOString().split('T')[0] });
    setValues({ fat: 5, acidity: 5, saltiness: 5, sweetness: 5, umami: 5 });
    setLoading(false);
  };

  const chartData = {
    labels: ['Grasso', 'Acidità', 'Salinità', 'Dolcezza', 'Umami'],
    datasets: [{
      data: [values.fat, values.acidity, values.saltiness, values.sweetness, values.umami],
      backgroundColor: 'rgba(213, 224, 160, 0.4)', borderColor: '#D5E0A0', borderWidth: 3, pointBackgroundColor: '#992235',
    }],
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-8 px-4 font-sans">
      <div className="max-w-md mx-auto">
        <h2 className="text-3xl font-extrabold text-wine-red text-center mb-6">Il mio Diario Food 🍽️</h2>
        <div className="bg-white rounded-[2rem] shadow-xl p-4 mb-6 border border-gray-100">
          <div className="w-full max-w-[250px] mx-auto"><Radar data={chartData} options={{ scales: { r: { min: 0, max: 10, ticks: { display: false } } }, plugins: { legend: { display: false } } }} /></div>
        </div>
        <div className="bg-white rounded-[2rem] shadow-xl p-6 mb-6 border border-gray-100 space-y-4">
          {Object.keys(values).map(key => (
            <div key={key} className="flex flex-col">
              <div className="flex justify-between text-sm font-bold mb-1"><span className="capitalize">{key}</span><span className="text-wine-green">{values[key]}</span></div>
              <input type="range" name={key} min="1" max="10" value={values[key]} onChange={handleSliderChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-wine-green" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-[2rem] shadow-xl p-6 space-y-4 border border-gray-100">
          <CustomInput label="Nome Piatto" name="foodName" value={details.foodName} onChange={handleInputChange} placeholder="es. Tagliata" />
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Categoria</label><select name="category" value={details.category} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm"><option>Antipasto</option><option>Primo</option><option>Secondo</option><option>Dessert</option></select></div>
            <CustomInput label="Data" name="tastingDate" type="date" value={details.tastingDate} onChange={handleInputChange} />
          </div>
          <button onClick={saveFood} disabled={loading} className="w-full bg-wine-green text-gray-800 py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform">
            {loading ? "Salvataggio..." : "Salva Piatto ✨"}
          </button>
        </div>
        {savedFoods.length > 0 && (
          <div className="mt-10 space-y-3">
            <h3 className="text-xl font-bold text-gray-800 mb-4 px-2">I tuoi piatti</h3>
            {savedFoods.map((f, i) => (
              <div key={f.id || i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div><p className="font-bold text-gray-800">{f.food_name || f.foodName}</p><p className="text-xs text-gray-500">{f.category} • {f.tasting_date}</p></div>
                <button onClick={async () => { if(user) await supabase.from('food_logs').delete().eq('id', f.id); else { const updated = savedFoods.filter(x => x.id !== f.id); localStorage.setItem('guest_foods', JSON.stringify(updated)); setSavedFoods(updated); } loadData(); }} className="text-red-400 text-xs font-bold uppercase">Elimina</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CustomInput({ label, ...props }) {
  return (
    <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">{label}</label><input {...props} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none text-sm font-medium" /></div>
  );
}

export default FoodJournal;
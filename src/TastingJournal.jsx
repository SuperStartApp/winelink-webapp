import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function TastingJournal({ user }) {
  const [values, setValues] = useState({ acidità: 5, tannini: 5, corpo: 5, alcol: 5, dolcezza: 5 });
  const [details, setDetails] = useState({ wineName: '', cellar: '', grape: '', vintage: '', type: 'Rosso', denomination: '', aging: '', date: new Date().toISOString().split('T')[0] });
  const [savedWines, setSavedWines] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleSliderChange = (e) => {
    setValues(prev => ({ ...prev, [e.target.name]: parseInt(e.target.value) }));
  };

  const handleInputChange = (e) => {
    setDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
      acidity: values.acidità,
      tannins: values.tannini,
      body: values.corpo,
      alcohol: values.alcol,
      sweetness: values.dolcezza,
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
    setDetails({ wineName: '', cellar: '', grape: '', vintage: '', type: 'Rosso', denomination: '', aging: '', date: new Date().toISOString().split('T')[0] });
    setValues({ acidità: 5, tannini: 5, corpo: 5, alcol: 5, dolcezza: 5 });
    setLoading(false);
  };

  const chartData = {
    labels: ['Acidità', 'Tannini', 'Corpo', 'Alcol', 'Dolcezza'],
    datasets: [{
      data: [values.acidità, values.tannini, values.corpo, values.alcol, values.dolcezza],
      backgroundColor: 'rgba(153, 34, 53, 0.2)', borderColor: '#992235', borderWidth: 3, pointBackgroundColor: '#EEB336',
    }],
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-8 px-4 font-sans">
      <div className="max-w-md mx-auto">
        <h2 className="text-3xl font-extrabold text-wine-red text-center mb-6">Il mio Diario 🍷</h2>
        <div className="bg-white rounded-[2rem] shadow-xl p-4 mb-6 border border-gray-100">
          <div className="w-full max-w-[250px] mx-auto"><Radar data={chartData} options={{ scales: { r: { min: 0, max: 10, ticks: { display: false } } }, plugins: { legend: { display: false } } }} /></div>
        </div>
        <div className="bg-white rounded-[2rem] shadow-xl p-6 mb-6 border border-gray-100 space-y-4">
          {Object.keys(values).map(key => (
            <div key={key} className="flex flex-col">
              <div className="flex justify-between text-sm font-bold mb-1"><span className="capitalize">{key}</span><span className="text-wine-red">{values[key]}</span></div>
              <input type="range" name={key} min="1" max="10" value={values[key]} onChange={handleSliderChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-wine-red" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-[2rem] shadow-xl p-6 space-y-4 border border-gray-100">
          <CustomInput label="Nome Vino" name="wineName" value={details.wineName} onChange={handleInputChange} placeholder="es. Chianti" />
          <CustomInput label="Cantina" name="cellar" value={details.cellar} onChange={handleInputChange} placeholder="es. Antinori" />
          <div className="grid grid-cols-2 gap-4">
            <CustomInput label="Uvaggio" name="grape" value={details.grape} onChange={handleInputChange} placeholder="es. Sangiovese" />
            <CustomInput label="Annata" name="vintage" type="number" value={details.vintage} onChange={handleInputChange} placeholder="2020" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tipo</label><select name="type" value={details.type} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm"><option>Rosso</option><option>Bianco</option><option>Rosato</option><option>Bollicine</option></select></div>
            <CustomInput label="Data" name="date" type="date" value={details.date} onChange={handleInputChange} />
          </div>
          <CustomInput label="Denominazione" name="denomination" value={details.denomination} onChange={handleInputChange} placeholder="DOCG" />
          <CustomInput label="Affinamento" name="aging" value={details.aging} onChange={handleInputChange} placeholder="es. Legno" />
          <button onClick={saveTasting} disabled={loading} className="w-full bg-wine-red text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform">
            {loading ? "Salvataggio..." : "Salva nel Diario ✨"}
          </button>
        </div>
        {savedWines.length > 0 && (
          <div className="mt-10 space-y-3">
            <h3 className="text-xl font-bold text-gray-800 mb-4 px-2">I tuoi salvataggi</h3>
            {savedWines.map((w, i) => (
              <div key={w.id || i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div><p className="font-bold text-gray-800">{w.wine_name || w.wineName}</p><p className="text-xs text-gray-500">{w.grape_variety || w.grape} • {w.vintage}</p></div>
                <button onClick={async () => { if(user) await supabase.from('tasting_logs').delete().eq('id', w.id); else { const updated = savedWines.filter(x => x.id !== w.id); localStorage.setItem('guest_wines', JSON.stringify(updated)); setSavedWines(updated); } loadData(); }} className="text-red-400 text-xs font-bold uppercase">Elimina</button>
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

export default TastingJournal;
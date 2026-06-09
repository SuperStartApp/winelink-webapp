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

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function TastingJournal({ user }) {
  const [values, setValues] = useState({
    acidità: 5, tannini: 5, corpo: 5, alcol: 5, dolcezza: 5,
  });

  const [details, setDetails] = useState({
    wineName: '',
    cellar: '',
    grape: '',
    vintage: '',
    type: 'Rosso',
    denomination: '',
    aging: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [savedWines, setSavedWines] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (user) {
      const { data, error } = await supabase.from('tasting_logs').select('*').order('tasting_date', { ascending: false });
      if (!error) setSavedWines(data);
    } else {
      const localData = localStorage.getItem('guest_wines');
      if (localData) setSavedWines(JSON.parse(localData));
    }
  }

  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: parseInt(value) }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  const saveTasting = async () => {
    if (!details.wineName) return alert("Dai un nome al vino! 🍷");
    setLoading(true);

    const newEntry = {
      ...details,
      ...values,
      user_id: user?.id || null,
      tasting_date: details.date,
    };

    if (user) {
      const { error } = await supabase.from('tasting_logs').insert([newEntry]);
      if (error) {
        alert("Errore: " + error.message);
      } else {
        alert("Salvataggio su Cloud completato! ✨");
        await loadData();
      }
    } else {
      const updatedList = [newEntry, ...savedWines];
      localStorage.setItem('guest_wines', JSON.stringify(updatedList));
      setSavedWines(updatedList);
      alert("Salvataggio locale effettuato! 📱");
    }

    setDetails({
      wineName: '', cellar: '', grape: '', vintage: '', type: 'Rosso', denomination: '', aging: '', date: new Date().toISOString().split('T')[0],
    });
    setValues({ acidità: 5, tannini: 5, corpo: 5, alcol: 5, dolcezza: 5 });
    setLoading(false);
  };

  const deleteWine = async (id, isGuest) => {
    if (isGuest) {
      const updatedList = savedWines.filter(w => w.id !== id);
      localStorage.setItem('guest_wines', JSON.stringify(updatedList));
      setSavedWines(updatedList);
    } else {
      const { error } = await supabase.from('tasting_logs').delete().eq('id', id);
      if (!error) await loadData();
    }
  };

  const chartData = {
    labels: ['Acidità', 'Tannini', 'Corpo', 'Alcol', 'Dolcezza'],
    datasets: [{
      label: 'Percezione',
      data: [values.acidità, values.tannini, values.corpo, values.alcol, values.dolcezza],
      backgroundColor: 'rgba(153, 34, 53, 0.2)',
      borderColor: '#992235',
      borderWidth: 3,
      pointBackgroundColor: '#EEB336',
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

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-8 px-4 font-sans">
      <div className="max-w-md mx-auto">
        <h2 className="text-3xl font-extrabold text-wine-red text-center mb-6">Il mio Diario 🍷</h2>

        <div className="bg-white rounded-[2rem] shadow-xl p-4 mb-6 border border-gray-100">
          <div className="w-full max-w-[250px] mx-auto">
            <Radar data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl p-6 mb-6 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">Percezione Sensoriale</h3>
          <div className="space-y-4">
            {Object.keys(values).map((key) => (
              <div key={key}>
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-bold text-gray-700 capitalize">{key}</label>
                  <span className="text-sm font-bold text-wine-red">{values[key]}</span>
                </div>
                <input type="range" name={key} min="1" max="10" value={values[key]} onChange={handleSliderChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-wine-red" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl p-6 space-y-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-2 tracking-widest">Dettagli del Vino</h3>
          <div className="grid grid-cols-1 gap-4">
            <CustomInput label="Nome del Vino" name="wineName" value={details.wineName} onChange={handleInputChange} placeholder="es. Chianti Classico" />
            <CustomInput label="Cantina" name="cellar" value={details.cellar} onChange={handleInputChange} placeholder="es. Antinori" />
            <div className="grid grid-cols-2 gap-4">
              <CustomInput label="Uvaggio" name="grape" value={details.grape} onChange={handleInputChange} placeholder="es. Sangiovese" />
              <CustomInput label="Annata" name="vintage" type="number" value={details.vintage} onChange={handleInputChange} placeholder="es. 2018" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tipologia</label>
                <select name="type" value={details.type} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none text-sm font-medium">
                  <option>Rosso</option><option>Bianco</option><option>Rosato</option><option>Bollicine</option>
                </select>
              </div>
              <CustomInput label="Data" name="date" type="date" value={details.date} onChange={handleInputChange} />
            </div>
            <CustomInput label="Denominazione" name="denomination" value={details.denomination} onChange={handleInputChange} placeholder="es. DOCG" />
            <CustomInput label="Affinamento" name="aging" value={details.aging} onChange={handleInputChange} placeholder="es. 12 mesi in legno" />
          </div>
          <button onClick={saveTasting} disabled={loading} className="w-full bg-wine-red text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50 mt-4">
            {loading ? "Salvataggio..." : "Salva nel Diario ✨"}
          </button>
        </div>

        {savedWines.length > 0 && (
          <div className="mt-10">
            <h3 className="text-xl font-bold text-gray-800 mb-4 px-2">I tuoi ultimi salvataggi</h3>
            <div className="space-y-3">
              {savedWines.map((wine) => (
                <div key={wine.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">{wine.wine_name}</p>
                    <p className="text-xs text-gray-500">{wine.grape_variety || wine.grape} • {wine.vintage || 'N/A'}</p>
                  </div>
                  <button onClick={() => deleteWine(wine.id, !user)} className="text-red-400 text-xs font-bold uppercase hover:text-red-600">
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

function CustomInput({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{label}</label>
      <input {...props} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none text-sm font-medium" />
    </div>
  );
}

export default TastingJournal;
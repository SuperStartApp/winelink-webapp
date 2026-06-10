import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

const CATEGORY_OPTIONS = [
  { id: 'general', name: 'Basi del Vino', color: 'bg-wine-red' },
  { id: 'territory', name: 'Territori & Vigneti', color: 'bg-green-600' },
  { id: 'pairing', name: 'L\'Arte dell\'Abbinamento', color: 'bg-wine-yellow' },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all'); // Per filtrare la tabella

  const [quiz, setQuiz] = useState({
    question: '', 
    option_a: '', 
    option_b: '', 
    option_c: '', 
    option_d: '', 
    correct_option: 'A', 
    level: 1,
    category: 'general' // Default categoria
  });

  useEffect(() => {
    fetchQuizzes();
  }, []);

  async function fetchQuizzes() {
    const { data } = await supabase.from('quizzes').select('*').order('category', { ascending: true }).order('level', { ascending: true });
    setAllQuizzes(data || []);
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQuiz({ ...quiz, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (editingId) {
      const { error } = await supabase.from('quizzes').update(quiz).eq('id', editingId);
      if (error) setMessage({ type: 'error', text: error.message });
      else {
        setMessage({ type: 'success', text: '✅ Quiz aggiornato con successo!' });
        setEditingId(null);
      }
    } else {
      const { error } = await supabase.from('quizzes').insert([quiz]);
      if (error) setMessage({ type: 'error', text: error.message });
      else {
        setMessage({ type: 'success', text: '🚀 Quiz pubblicato con successo!' });
      }
    }

    setQuiz({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', level: 1, category: 'general' });
    await fetchQuizzes();
    setLoading(false);
  };

  const startEdit = (q) => {
    setEditingId(q.id);
    setQuiz({
      question: q.question, 
      option_a: q.option_a, 
      option_b: q.option_b, 
      option_c: q.option_c, 
      option_d: q.option_d, 
      correct_option: q.correct_option, 
      level: q.level,
      category: q.category || 'general'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteQuiz = async (id) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa domanda?")) return;
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (error) alert(error.message);
    else {
      alert("Quiz eliminato!");
      fetchQuizzes();
    }
  };

  // Logica per filtrare i quiz visualizzati nella tabella
  const filteredQuizzes = filterCategory === 'all' 
    ? allQuizzes 
    : allQuizzes.filter(q => q.category?.toString().toLowerCase().trim() === filterCategory.toLowerCase());

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-wine-red">Admin Cockpit 🍷</h1>
            <p className="text-gray-500">Gestione contenuti WineLink Academy</p>
          </div>
          <button onClick={() => navigate('/')} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-300 transition">Esci</button>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl mb-6 font-bold text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLONNA MODULO (Sinistra) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2rem] shadow-xl p-6 border border-gray-100 sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                {editingId ? '📝 Modifica Quiz' : '➕ Nuovo Quiz'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Modulo (Categoria)</label>
                  <select name="category" value={quiz.category} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none text-sm font-bold">
                    {CATEGORY_OPTIONS.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Domanda</label>
                  <textarea name="question" value={quiz.question} onChange={handleInputChange} required rows="3" className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none text-sm" />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {['option_a', 'option_b', 'option_c', 'option_d'].map((opt, i) => (
                    <div key={opt}>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Opzione {String.fromCharCode(65 + i)}</label>
                      <input type="text" name={opt} value={quiz[opt]} onChange={handleInputChange} required className="w-full p-2 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-wine-yellow outline-none text-sm" />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Corretta</label>
                    <select name="correct_option" value={quiz.correct_option} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none font-bold text-wine-red">
                      <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Livello</label>
                    <input type="number" name="level" min="1" max="5" value={quiz.level} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none" />
                  </div>
                </div>

                <button type="submit" disabled={loading} className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-95 ${editingId ? 'bg-blue-600 text-white' : 'bg-wine-red text-white'}`}>
                  {loading ? "Elaborazione..." : editingId ? "Aggiorna Quiz ✨" : "Pubblica Quiz 🚀"}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setQuiz({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', level: 1, category: 'general' }); }} className="w-full py-2 text-gray-400 text-sm font-bold">Annulla Modifica</button>
                )}
              </form>
            </div>
          </div>

          {/* COLONNA LISTA (Destra) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] shadow-xl p-6 border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800">Tutte le Domande</h2>
                
                {/* FILTRI RAPIDI */}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setFilterCategory('all')} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition ${filterCategory === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-500'}`}>Tutti</button>
                  {CATEGORY_OPTIONS.map(cat => (
                    <button 
                      key={cat.id} 
                      onClick={() => setFilterCategory(cat.id)} 
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition ${filterCategory === cat.id ? `${cat.color} text-white` : 'bg-gray-200 text-gray-500'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase font-bold border-b border-gray-100">
                      <th className="pb-3">Modulo & Domanda</th>
                      <th className="pb-3 text-center">Liv.</th>
                      <th className="pb-3 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredQuizzes.map((q) => {
                      const catInfo = CATEGORY_OPTIONS.find(c => c.id === q.category) || CATEGORY_OPTIONS[0];
                      return (
                        <tr key={q.id} className="group hover:bg-gray-50 transition">
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-2 h-2 rounded-full ${catInfo.color}`}></span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase">{catInfo.name}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-800 line-clamp-1">{q.question}</p>
                            <p className="text-[10px] text-gray-400">Corretta: {q.correct_option}</p>
                          </td>
                          <td className="py-4 text-center">
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{q.level}</span>
                          </td>
                          <td className="py-4 text-right space-x-2">
                            <button onClick={() => startEdit(q)} className="text-blue-500 hover:text-blue-700 text-xs font-bold uppercase">Modifica</button>
                            <button onClick={() => deleteQuiz(q.id)} className="text-red-400 hover:text-red-600 text-xs font-bold uppercase">Elimina</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredQuizzes.length === 0 && <p className="text-center py-10 text-gray-400">Nessun quiz trovato in questa categoria.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
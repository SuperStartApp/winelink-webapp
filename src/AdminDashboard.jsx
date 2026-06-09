import { useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Stato per il nuovo quiz
  const [quiz, setQuiz] = useState({
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    level: 1
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQuiz({ ...quiz, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const { error } = await supabase.from('quizzes').insert([quiz]);

    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: 'Errore nel salvataggio: ' + error.message });
    } else {
      setMessage({ type: 'success', text: '🎉 Quiz pubblicato con successo!' });
      // Reset form
      setQuiz({
        question: '', option_a: '', option_b: '', option_c: '', option_d: '',
        correct_option: 'A', level: 1
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Header Dashboard */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-wine-red">Admin Cockpit 🍷</h1>
            <p className="text-gray-500">Gestione contenuti WineLink Academy</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-300 transition"
          >
            Esci
          </button>
        </div>

        {/* Messaggi di feedback */}
        {message.text && (
          <div className={`p-4 rounded-xl mb-6 font-bold text-center ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Form per Nuovo Quiz */}
        <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Aggiungi Nuovo Quiz</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Domanda */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Domanda</label>
              <textarea
                name="question"
                value={quiz.question}
                onChange={handleInputChange}
                required
                rows="3"
                className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none text-gray-700 font-medium"
                placeholder="Esempio: Qual è il vitigno principale del Barolo?"
              />
            </div>

            {/* Opzioni */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['option_a', 'option_b', 'option_c', 'option_d'].map((opt, index) => (
                <div key={opt}>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Opzione {String.fromCharCode(65 + index)}</label>
                  <input
                    type="text"
                    name={opt}
                    value={quiz[opt]}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none text-sm"
                    placeholder={`Scelta ${String.fromCharCode(65 + index)}`}
                  />
                </div>
              ))}
            </div>

            {/* Configurazione Corretta e Livello */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Risposta Corretta</label>
                <select
                  name="correct_option"
                  value={quiz.correct_option}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none font-bold text-wine-red"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Livello Difficoltà</label>
                <input
                  type="number"
                  name="level"
                  min="1"
                  max="5"
                  value={quiz.level}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-wine-yellow outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-wine-red text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-opacity-90 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "Pubblicazione in corso..." : "🚀 Pubblica Quiz"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
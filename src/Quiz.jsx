import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const CATEGORIES = [
  { id: 'general', name: 'Basi del Vino', icon: '🍷', color: 'bg-wine-red' },
  { id: 'territory', name: 'Territori & Vigneti', icon: '🗺️', color: 'bg-green-600' },
  { id: 'pairing', name: 'L\'Arte dell\'Abbinamento', icon: '🍽️', color: 'bg-wine-yellow' },
];

const LEVEL_NAMES = {
  general: ['Iniziante', 'Appassionato', 'Conoscitore', 'Esperto', 'Maestro'],
  territory: ['Esploratore', 'Viaggiatore', 'Geografo', 'Ambasciatore', 'Sommelier del Territorio'],
  pairing: ['Curioso', 'Sperimentatore', 'Armonizzatore', 'Critico', 'Maestro del Pairing'],
};

const BADGE_MAP = {
  general: ["Sognatore di Vigne 🌿", "Esploratore di Sentori 👃", "Custode della Cantina 🏰", "Wine Master 🏆", "Leggenda WineLink 🌟"],
  territory: ["Turista del Vino 🚩", "Cacciatore di Terroir ⛰️", "Guida Locale 🗺️", "Esperto di Regioni 🇮🇹", "Atlante Vivente 🌍"],
  pairing: ["Primo Assaggio 🍴", "Accoppiatore 🧀", "Alchimista del Gusto 🧪", "Maestro dell'Armonia 🎼", "Dio del Banchetto 👑"],
};

function Quiz({ user }) {
  const [view, setView] = useState('categories'); // 'categories', 'levels', 'quiz', 'result'
  const [selectedCat, setSelectedCat] = useState(null);
  const [level, setLevel] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [earnedBadge, setEarnedBadge] = useState(null);
  const [userProgress, setUserProgress] = useState({ general: 1, territory: 1, pairing: 1 });

  useEffect(() => {
    loadUserProgress();
  }, [user]);

  async function loadUserProgress() {
    if (user) {
      const { data } = await supabase.from('user_profiles').select('progress').eq('id', user.id).single();
      if (data?.progress) setUserProgress(data.progress);
    } else {
      const localProg = localStorage.getItem('guest_progress');
      if (localProg) setUserProgress(JSON.parse(localProg));
    }
  }

  const startLevel = async (lvl) => {
    if (lvl > userProgress[selectedCat]) {
      alert(`🔒 Livello bloccato! Supera prima il livello ${lvl - 1}.`);
      return;
    }
    setLoading(true);
    setLevel(lvl);
    const { data, error } = await supabase.from('quizzes').select('*').eq('category', selectedCat).eq('level', lvl);
    if (error) alert("Errore: " + error.message);
    else setQuizzes(shuffleArray(data));
    setLoading(false);
    setView('quiz');
  };

  const processBadge = async () => {
    const badgeToWin = BADGE_MAP[selectedCat][level - 1];
    const updatedProgress = { ...userProgress, [selectedCat]: level + 1 };

    if (user) {
      const { data: profile } = await supabase.from('user_profiles').select('badges').eq('id', user.id).single();
      const currentBadges = profile?.badges || [];
      if (!currentBadges.includes(badgeToWin)) {
        await supabase.from('user_profiles').update({ badges: [...currentBadges, badgeToWin] }).eq('id', user.id);
      }
      await supabase.from('user_profiles').update({ progress: updatedProgress }).eq('id', user.id);
    } else {
      const pending = JSON.parse(localStorage.getItem('pending_badges') || '[]');
      if (!pending.includes(badgeToWin)) {
        pending.push(badgeToWin);
        localStorage.setItem('pending_badges', JSON.stringify(pending));
      }
      localStorage.setItem('guest_progress', JSON.stringify(updatedProgress));
    }
    setUserProgress(updatedProgress);
    setEarnedBadge(badgeToWin);
  };

  const handleAnswer = (selectedOption) => {
    if (isAnswered) return;
    setSelectedAnswer(selectedOption);
    setIsAnswered(true);
    if (selectedOption === quizzes[currentIndex].correct_option) setScore(prev => prev + 1);
    
    setTimeout(() => {
      if (currentIndex + 1 < quizzes.length) {
        setCurrentIndex(prev => prev + 1);
        setIsAnswered(false);
        setSelectedAnswer(null);
      } else {
        setView('result');
      }
    }, 1500);
  };

  useEffect(() => {
    if (view === 'result') {
      if ((score / quizzes.length) >= 0.7) processBadge();
    }
  }, [view]);

  const shuffleArray = (array) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-wine-red font-bold">Preparando il calice...</div>;

  // VIEW: CATEGORIES
  if (view === 'categories') return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <h2 className="text-3xl font-extrabold text-wine-red text-center mb-10">Scegli un Percorso</h2>
      <div className="grid grid-cols-1 gap-6 w-full max-w-xs">
        {CATEGORIES.map(cat => (
          <button 
            key={cat.id} 
            onClick={() => { setSelectedCat(cat.id); setView('levels'); }}
            className="p-6 rounded-3xl shadow-md bg-white border-2 border-transparent hover:border-wine-yellow transition-all flex items-center gap-4 group"
          >
            <div className={`w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>{cat.icon}</div>
            <div className="text-left">
              <p className="font-black text-lg text-gray-800">{cat.name}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Livello attuale: {userProgress[cat.id]}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // VIEW: LEVELS
  if (view === 'levels') return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <button onClick={() => setView('categories')} className="mb-6 text-wine-red font-bold flex items-center gap-2 text-sm">← Torna ai Moduli</button>
      <h2 className="text-3xl font-extrabold text-wine-red text-center mb-10">{CATEGORIES.find(c => c.id === selectedCat).name}</h2>
      <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
        {[1, 2, 3, 4, 5].map(lvl => (
          <button 
            key={lvl} 
            onClick={() => startLevel(lvl)} 
            disabled={lvl > userProgress[selectedCat]}
            className={`p-6 rounded-3xl shadow-md border-2 transition-all text-left group flex justify-between items-center ${lvl <= userProgress[selectedCat] ? 'bg-white border-transparent hover:border-wine-yellow' : 'bg-gray-200 border-gray-300 opacity-60 cursor-not-allowed'}`}
          >
            <div>
              <span className="text-2xl block">{BADGE_MAP[selectedCat][lvl-1].split(' ')[0]}</span>
              <p className={`font-black text-lg ${lvl <= userProgress[selectedCat] ? 'text-gray-800' : 'text-gray-500'}`}>{LEVEL_NAMES[selectedCat][lvl-1]}</p>
              {lvl > userProgress[selectedCat] && <p className="text-[10px] font-bold text-red-400 uppercase">Bloccato 🔒</p>}
            </div>
            <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${lvl <= userProgress[selectedCat] ? 'bg-gray-100 text-gray-400 group-hover:bg-wine-red group-hover:text-white' : 'bg-gray-300 text-gray-500'}`}>{lvl}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // VIEW: RESULT
  if (view === 'result') {
    const isPassed = (score / quizzes.length) >= 0.7;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center font-sans">
        <div className="text-6xl mb-4">{isPassed ? '🎉' : '📉'}</div>
        <h1 className="text-4xl font-bold text-wine-red mb-2">{isPassed ? 'Livello Superato!' : 'Quasi fatto!'}</h1>
        <p className="text-xl mb-6 text-gray-600">Punteggio: <span className="text-wine-yellow font-bold">{score} / {quizzes.length}</span></p>
        {isPassed && (
          <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-wine-yellow mb-8 animate-bounce">
            <p className="text-sm font-bold text-gray-400 uppercase mb-2">Hai ottenuto il Badge:</p>
            <p className="text-2xl font-black text-wine-red">{earnedBadge}</p>
          </div>
        )}
        <div className="space-y-3 w-full max-w-xs">
          <button onClick={() => setView('categories')} className="w-full bg-wine-red text-white py-4 rounded-full font-bold shadow-lg">Torna alla Mappa</button>
        </div>
      </div>
    );
  }

  // VIEW: QUIZ ENGINE
  const currentQuiz = quizzes[currentIndex];
  if (!currentQuiz) return null;
  const options = [{ id: 'A', text: currentQuiz.option_a }, { id: 'B', text: currentQuiz.option_b }, { id: 'C', text: currentQuiz.option_c }, { id: 'D', text: currentQuiz.option_d }];
  const shuffledOptions = shuffleArray(options);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 font-sans">
      <div className="mb-10 text-center">
        <h2 className="text-wine-red font-extrabold text-2xl uppercase tracking-tighter">WineLink Academy</h2>
        <p className="text-xs text-gray-400 font-bold">{CATEGORIES.find(c => c.id === selectedCat).name} • LIVELLO {level} • {currentIndex + 1}/{quizzes.length}</p>
      </div>
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-50">
        <div className="bg-wine-red py-3 px-6 text-white/80 text-xs font-bold uppercase flex justify-between"><span>Progresso</span><span>{Math.round(((currentIndex + 1) / quizzes.length) * 100)}%</span></div>
        <div className="p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-8 leading-tight min-h-[80px]">{currentQuiz.question}</h3>
          <div className="space-y-3">
            {shuffledOptions.map((opt) => {
              const isCorrect = opt.id === currentQuiz.correct_option;
              const isSelected = opt.id === selectedAnswer;
              let style = "w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 font-medium flex items-center gap-4 ";
              if (!isAnswered) style += "border-gray-100 hover:border-wine-yellow text-gray-700";
              else if (isCorrect) style += "border-green-500 bg-green-100 text-green-700";
              else if (isSelected) style += "border-red-500 bg-red-100 text-red-700";
              else style += "border-gray-100 text-gray-300 opacity-50";

              return (
                <button key={opt.id} disabled={isAnswered} onClick={() => handleAnswer(opt.id)} className={style}>
                  <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${isAnswered && isCorrect ? 'bg-green-500 text-white' : 'bg-gray-100 text-wine-red'}`}>{opt.id}</span>{opt.text}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Quiz;
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

function Quiz({ user }) {
  const [level, setLevel] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [earnedBadge, setEarnedBadge] = useState(null);
  const [userCurrentLevel, setUserCurrentLevel] = useState(1);

  useEffect(() => {
    fetchUserLevel();
  }, [user]);

  async function fetchUserLevel() {
    if (user) {
      const { data } = await supabase.from('user_profiles').select('current_level').eq('id', user.id).single();
      if (data) setUserCurrentLevel(data.current_level);
    }
  }

  const shuffleArray = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const startLevel = async (lvl) => {
    if (lvl > userCurrentLevel) {
      alert(`🔒 Livello bloccato! Devi prima superare il livello ${lvl - 1}.`);
      return;
    }
    setLoading(true);
    setLevel(lvl);
    const { data, error } = await supabase.from('quizzes').select('*').eq('level', lvl);
    if (error) alert("Errore: " + error.message);
    else setQuizzes(shuffleArray(data));
    setLoading(false);
  };

  const processBadge = async () => {
    const badgeMap = {
      1: "Sognatore di Vigne 🌿",
      2: "Esploratore di Sentori 👃",
      3: "Custode della Cantina 🏰",
      4: "Maestro WineLink 🏆"
    };
    const badgeToWin = badgeMap[level];

    if (user) {
      const { data: profile } = await supabase.from('user_profiles').select('badges').eq('id', user.id).single();
      const currentBadges = profile?.badges || [];
      if (!currentBadges.includes(badgeToWin)) {
        await supabase.from('user_profiles').update({ badges: [...currentBadges, badgeToWin] }).eq('id', user.id);
      }
      const nextLevel = level + 1;
      await supabase.from('user_profiles').update({ current_level: nextLevel }).eq('id', user.id);
      setUserCurrentLevel(nextLevel);
    } else {
      const pending = JSON.parse(localStorage.getItem('pending_badges') || '[]');
      if (!pending.includes(badgeToWin)) {
        pending.push(badgeToWin);
        localStorage.setItem('pending_badges', JSON.stringify(pending));
      }
    }
    setEarnedBadge(badgeToWin);
  };

  useEffect(() => {
    if (showResult) {
      const isPassed = (score / quizzes.length) >= 0.7;
      if (isPassed) processBadge();
    }
  }, [showResult]);

  const handleAnswer = (selectedOption) => {
    if (isAnswered) return;
    setSelectedAnswer(selectedOption);
    setIsAnswered(true);
    if (selectedOption === quizzes[currentIndex].correct_option) setScore(prev => prev + 1);
    setTimeout(() => {
      if (currentIndex + 1 < quizzes.length) {
        setCurrentIndex(currentIndex + 1);
        setIsAnswered(false);
        setSelectedAnswer(null);
      } else setShowResult(true);
    }, 1500);
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-wine-red font-bold">Preparando il calice...</div>;

  if (!level) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <h2 className="text-3xl font-extrabold text-wine-red text-center mb-10">Scegli il tuo Percorso</h2>
      <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
        {[
          { lv: 1, name: 'Basi del Vino', icon: '🌱' },
          { lv: 2, name: 'Appassionato', icon: '🍷' },
          { lv: 3, name: 'Esperto', icon: '👑' },
          { lv: 4, name: 'Maestro', icon: '🏆' },
        ].map(item => (
          <button 
            key={item.lv} 
            onClick={() => startLevel(item.lv)} 
            disabled={item.lv > userCurrentLevel}
            className={`p-6 rounded-3xl shadow-md border-2 transition-all text-left group flex justify-between items-center ${item.lv <= userCurrentLevel ? 'bg-white border-transparent hover:border-wine-yellow' : 'bg-gray-200 border-gray-300 opacity-60 cursor-not-allowed'}`}
          >
            <div>
              <span className="text-2xl block">{item.icon}</span>
              <p className={`font-black text-lg ${item.lv <= userCurrentLevel ? 'text-gray-800' : 'text-gray-500'}`}>{item.name}</p>
              {item.lv > userCurrentLevel && <p className="text-[10px] font-bold text-red-400 uppercase">Bloccato 🔒</p>}
            </div>
            <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${item.lv <= userCurrentLevel ? 'bg-gray-100 text-gray-400 group-hover:bg-wine-red group-hover:text-white' : 'bg-gray-300 text-gray-500'}`}>
              {item.lv}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  if (showResult) {
    const isPassed = (score / quizzes.length) >= 0.7;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center font-sans">
        <div className="text-6xl mb-4">{isPassed ? '🎉' : '📉'}</div>
        <h1 className="text-4xl font-bold text-wine-red mb-2">{isPassed ? 'Livello Superato!' : 'Quasi fatto!'}</h1>
        <p className="text-xl mb-6 text-gray-600">Punteggio: <span className="text-wine-yellow font-bold">{score} / {quizzes.length}</span></p>
        {isPassed && (
          <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-wine-yellow mb-8 animate-bounce">
            <p className="text-sm font-bold text-gray-400 uppercase mb-2">Hai ottenuto il Badge:</p>
            <p className="text-2xl font-black text-wine-red">{earnedBadge || "Sbloccato!"}</p>
          </div>
        )}
        <div className="space-y-3 w-full max-w-xs">
          <button onClick={() => window.location.reload()} className="w-full bg-wine-red text-white py-4 rounded-full font-bold shadow-lg">Torna alla Mappa</button>
          {!user && isPassed && <button onClick={() => window.location.href='/auth'} className="w-full bg-wine-yellow text-wine-red py-3 rounded-full font-bold text-sm">Salva il tuo Badge nel Profilo 🔐</button>}
        </div>
      </div>
    );
  }

  const currentQuiz = quizzes[currentIndex];
  if (!currentQuiz) return null;
  const options = [{ id: 'A', text: currentQuiz.option_a }, { id: 'B', text: currentQuiz.option_b }, { id: 'C', text: currentQuiz.option_c }, { id: 'D', text: currentQuiz.option_d }];
  const shuffledOptions = shuffleArray(options);

  const getButtonStyles = (optionId) => {
    const isCorrect = optionId === currentQuiz.correct_option;
    const isSelected = optionId === selectedAnswer;
    let base = "w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 font-medium flex items-center gap-4 ";
    if (!isAnswered) return base + "border-gray-100 hover:border-wine-yellow hover:bg-wine-yellow/5 text-gray-700";
    if (isCorrect) return base + "border-green-500 bg-green-100 text-green-700";
    if (isSelected && !isCorrect) return base + "border-red-500 bg-red-100 text-red-700";
    return base + "border-gray-100 text-gray-300 opacity-50";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 font-// sans">
      <div className="mb-10 text-center">
        <h2 className="text-wine-red font-extrabold text-2xl uppercase tracking-tighter">WineLink Academy</h2>
        <p className="text-xs text-gray-400 font-bold">LIVELLO {level} • {currentIndex + 1}/{quizzes.length}</p>
      </div>
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-50">
        <div className="bg-wine-red py-3 px-6 text-white/80 text-xs font-bold uppercase flex justify-between"><span>Percorso Cultura</span><span>{Math.round(((currentIndex + 1) / quizzes.length) * 100)}%</span></div>
        <div className="p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-8 leading-tight min-h-[80px]">{currentQuiz.question}</h3>
          <div className="space-y-3">
            {shuffledOptions.map((opt) => (
              <button key={opt.id} disabled={isAnswered} onClick={() => handleAnswer(opt.id)} className={getButtonStyles(opt.id)}>
                <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${isAnswered && opt.id === currentQuiz.correct_option ? 'bg-green-500 text-white' : 'bg-gray-100 text-wine-red'}`}>{opt.id}</span>{opt.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Quiz;
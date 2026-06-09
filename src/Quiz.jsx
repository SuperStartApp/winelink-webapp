import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function Quiz() {
  const [quizzes, setQuizzes] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showResult, setShowResult] = useState(false)
  const [isAnswered, setIsAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState(null)

  useEffect(() => {
    fetchQuizzes()
  }, [])

  async function fetchQuizzes() {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
    
    if (error) {
      console.error('Errore nel caricamento:', error)
    } else {
      setQuizzes(data)
      setLoading(false)
    }
  }

  const handleAnswer = (selectedOption) => {
    if (isAnswered) return;

    setSelectedAnswer(selectedOption)
    setIsAnswered(true)

    const currentQuiz = quizzes[currentIndex]
    
    if (selectedOption === currentQuiz.correct_option) {
      setScore(score + 1)
    }

    setTimeout(() => {
      const nextQuestion = currentIndex + 1
      if (nextQuestion < quizzes.length) {
        setCurrentIndex(nextQuestion)
        setIsAnswered(false)
        setSelectedAnswer(null)
      } else {
        setShowResult(true)
      }
    }, 1500)
  }

  const getButtonStyles = (optionId) => {
    const currentQuiz = quizzes[currentIndex]
    const isCorrect = optionId === currentQuiz.correct_option
    const isSelected = optionId === selectedAnswer

    let baseClasses = "w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 font-medium flex items-center gap-4 "

    if (!isAnswered) {
      return baseClasses + "border-gray-100 hover:border-wine-yellow hover:bg-wine-yellow/5 text-gray-700"
    }

    if (isCorrect) {
      return baseClasses + "border-green-500 bg-green-100 text-green-700 shadow-sm"
    }

    if (isSelected && !isCorrect) {
      return baseClasses + "border-red-500 bg-red-100 text-red-700 shadow-sm"
    }

    return baseClasses + "border-gray-100 text-gray-300 opacity-50"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-wine-red animate-pulse text-xl font-bold">Caricamento Academy...</p>
      </div>
    )
  }

  if (showResult) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center font-sans">
        <h1 className="text-4xl font-bold text-wine-red mb-4">Risultato Finale 🍷</h1>
        <p className="text-2xl mb-8 text-gray-700">Punteggio: <span className="text-wine-yellow font-bold text-4xl">{score} / {quizzes.length}</span></p>
        <button onClick={() => window.location.reload()} className="bg-wine-red text-white px-10 py-4 rounded-full font-bold shadow-lg">Riprova</button>
      </div>
    )
  }

  const currentQuiz = quizzes[currentIndex]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 font-sans">
      <div className="mb-10 text-center">
        <h2 className="text-wine-red font-extrabold text-2xl uppercase tracking-tighter">WineLink Academy</h2>
        <div className="h-1 w-12 bg-wine-yellow mx-auto mt-1 rounded-full"></div>
      </div>

      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-50">
        <div className="bg-wine-red py-3 px-6 text-white/80 text-xs font-bold uppercase flex justify-between">
          <span>Quiz</span>
          <span>{currentIndex + 1} / {quizzes.length}</span>
        </div>
        
        <div className="p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-8 min-h-[80px]">{currentQuiz.question}</h3>
          <div className="space-y-3">
            {[
              { id: 'A', text: currentQuiz.option_a },
              { id: 'B', text: currentQuiz.option_b },
              { id: 'C', text: currentQuiz.option_c },
              { id: 'D', text: currentQuiz.option_d },
            ].map((option) => (
              <button
                key={option.id}
                disabled={isAnswered}
                onClick={() => handleAnswer(option.id)}
                className={getButtonStyles(option.id)}
              >
                <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${
                  isAnswered && option.id === currentQuiz.correct_option ? 'bg-green-500 text-white' : 'bg-gray-100 text-wine-red'
                }`}>
                  {option.id}
                </span>
                {option.text}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 w-full max-w-md bg-gray-200 h-2 rounded-full overflow-hidden">
        <div className="bg-wine-yellow h-full transition-all duration-500" style={{ width: `${((currentIndex + 1) / quizzes.length) * 100}%` }}></div>
      </div>
    </div>
  )
}

export default Quiz
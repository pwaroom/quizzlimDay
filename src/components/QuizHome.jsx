import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { format } from 'date-fns';

export default function QuizHome() {
  const [movie, setMovie] = useState(null);
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isWrong, setIsWrong] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTodayMovie = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener la fecha de hoy (formato YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];
        
        // Verificar si la fecha guardada en localStorage es la misma que hoy
        const storedDate = localStorage.getItem('date');
        console.log('Stored date in localStorage:', storedDate);


        // Si la fecha guardada no es hoy, actualizamos el índice de la película y la fecha
        if (storedDate !== today) {
          const nextMovieIndex = getNextMovieIndex(); // Obtener el índice de la película del día
          console.log('Setting new movie index:', nextMovieIndex);
          localStorage.setItem('date', today);  // Guardar la fecha actual
          localStorage.setItem('movieIndex', nextMovieIndex);  // Guardar el índice de la película
        }

        // Obtener el índice de la película para el día actual desde localStorage
        const movieIndex = parseInt(localStorage.getItem('movieIndex') || '1'); // Aseguramos que empiece desde 1
        console.log('Movie index from localStorage:', movieIndex);


        // Consultar Firestore para obtener la lista de películas
        const moviesRef = collection(db, 'dailyMovies');
        const querySnapshot = await getDocs(moviesRef);

        if (!querySnapshot.empty) {
          // Obtener la película correspondiente según el índice almacenado
          const movieData = querySnapshot.docs[movieIndex - 1]?.data();  // -1 porque los índices en Firestore empiezan desde 0
          
          if (movieData) {
            setMovie(movieData);  // Si encontramos la película, la mostramos
          } else {
            setError('No se encontró la película del día');
          }
        } else {
          setError('No hay películas disponibles');
        }
      } catch (err) {
        console.error('Error fetching movie:', err);
        setError('Error al cargar la película. Por favor, intenta más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchTodayMovie();
  }, []);


  // Función para obtener el índice de la película del día (basado en la fecha)
  const getNextMovieIndex = () => {
    const startDate = new Date('2024-11-24'); // Fecha de inicio
    const currentDate = new Date();
    const diffTime = currentDate - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
    // Devuelve el índice basado en los días transcurridos
    return diffDays + 1;
  };

  const handleShare = () => {
    const shareText = `¿Sabes qué peli es? ${window.location.href}`;
    if (navigator.share) {
      navigator.share({
        text: shareText,
        url: window.location.href,
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      navigator.clipboard.writeText(shareText)
    }
  };

  const normalizeText = (text) => {
    return text
      .toLowerCase() // Convertir a minúsculas
      .normalize('NFD') // Normalizar para separar caracteres diacríticos
      .replace(/[\u0300-\u036f]/g, ''); // Eliminar caracteres diacríticos
  };
  
  const checkAnswer = () => {
    if (attempts.length >= 5) return;
  
    const normalizedUserAnswer = normalizeText(answer.trim());
    const normalizedCorrectAnswer = normalizeText(movie?.answer.trim());
  
    const isAnswerCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    const newAttempts = [...attempts, { answer, correct: isAnswerCorrect }];
    setAttempts(newAttempts);

    // Solo se incrementa la jugada si el usuario ha respondido una pregunta
    let totalJugadas = parseInt(localStorage.getItem('jugadas') || '0');
    if (newAttempts.length === 1) { // Solo incrementa al responder una pregunta
      totalJugadas += 1;
    }

    // Incrementar el número de preguntas acertadas si la respuesta es correcta
    let totalAcertadas = parseInt(localStorage.getItem('acertadas') || '0');
    if (isAnswerCorrect) totalAcertadas += 1;

    // Actualizar distribución de intentos
    let attemptDistribution = JSON.parse(localStorage.getItem('distribution') || '[]');
    if (isAnswerCorrect) {
      const attemptIndex = newAttempts.length;  // Indica en qué intento acertó
      attemptDistribution[attemptIndex - 1] = (attemptDistribution[attemptIndex - 1] || 0) + 1;
    }

    // Guardar las estadísticas en localStorage
    localStorage.setItem('jugadas', totalJugadas);
    localStorage.setItem('acertadas', totalAcertadas);
    localStorage.setItem('distribution', JSON.stringify(attemptDistribution));

 
    if (isAnswerCorrect) {
      setIsCorrect(true);
      setTimeout(() => navigate('/wait'), 3000);
    } else {
      setIsWrong(true);
      setTimeout(() => setIsWrong(false), 3000);
      if (newAttempts.length >= 5) {
        setTimeout(() => navigate('/wait'), 2000);
      }
    }
    setAnswer('');
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
  );

  if (error) return (
    <div className="text-center p-4">
      <p className="text-red-500">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 bg-purple-600 px-4 py-2 rounded"
      >
        Reintentar
      </button>
    </div>
  );

  if (!movie) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white px-4">
      {/* Botón de compartir */}
      <div className="absolute top-4 right-4">
        <button
          onClick={handleShare}
          className="text-xs text-slate-500 border border-slate-500 px-3 py-1 rounded-full hover:bg-white hover:text-black transition duration-200"
        >
          Compartir ▸
        </button>
      </div>
  
      {/* Contenedor principal */}
      <div className="max-w-md w-full">

        {/* Intentos */}
        <div className="flex text-slate-500 justify-between items-center mb-6">

          {/* Texto "INTENTOS" */}
          <h2 className="text-sm text-left">INTENTOS</h2>

          {/* Puntos de intentos */}
          <div className="flex gap-2">

            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  attempts[i]?.correct
                    ? 'bg-green-500'
                    : attempts[i]
                    ? 'bg-red-500'
                    : 'bg-white'
                }`}
              />
            ))}
          </div>
        </div>
  
        {/* Pregunta y Emojis */}
        <div className="bg-[#2A2B4B] rounded-lg p-6 mb-6 shadow-md">
          <h1 className="text-2xl font-bold mb-4">
            ¿Qué peli de <span className="text-purple-500">{movie.genre}</span> es?
          </h1>
          <div className="text-6xl mb-6 flex justify-center gap-4 py-8">{movie.emoji}</div>
        </div>
  
        {/* Input y Botón */}
        <div className="space-y-4">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Título peli..."
            className="focus:outline-none focus:ring focus:ring-purple-500 w-full p-4 rounded bg-gray-100 text-black text-lg"
            onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
          />
          <button
            onClick={checkAnswer}
            disabled={!answer.trim()}
            className="w-full p-4 rounded text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            He acertado?
          </button>
        </div>
  
        {/* Mensajes de feedback */}
        {isCorrect && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-md p-4 bg-green-500 text-center text-white animate-pulse">
            ¡Has acertado! 🎉🎉🎉
          </div>
        )}
        {isWrong && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 max-w-md w-full p-4 bg-red-500 text-center text-white animate-pulse">
            La respuesta no es correcta
          </div>
        )}
      </div>
    </div>
  );
}
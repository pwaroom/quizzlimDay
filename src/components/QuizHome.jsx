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
      setTimeout(() => navigate('/wait'), 2000);
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
    <div className="flex flex-col items-center justify-center min-h-screen text-white px-2">

      {/* Logotipo alineado a la izquierda */}
      <div className="absolute top-6 left-4">
      <svg width="116" height="41" viewBox="0 0 116 41" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.1528 27.8906V9.89307L10.8184 6.67871H14.9531V27.8906H10.1528ZM0.750488 14.481V14.1836C0.750488 13.0225 0.87793 11.9652 1.13281 11.0117C1.3877 10.0488 1.7653 9.22754 2.26562 8.54785C2.76595 7.85872 3.38428 7.33008 4.12061 6.96191C4.86637 6.58431 5.72542 6.39551 6.69775 6.39551C7.61344 6.39551 8.39697 6.59375 9.04834 6.99023C9.70915 7.38672 10.2614 7.94368 10.7051 8.66113C11.1488 9.36914 11.5075 10.1999 11.7812 11.1533C12.0645 12.1068 12.2863 13.1357 12.4468 14.2402V14.5942C12.2863 15.6326 12.0645 16.6144 11.7812 17.5396C11.5075 18.4647 11.1488 19.286 10.7051 20.0034C10.2614 20.7114 9.70915 21.2684 9.04834 21.6743C8.38753 22.0802 7.59456 22.2832 6.66943 22.2832C5.70654 22.2832 4.85693 22.0897 4.12061 21.7026C3.38428 21.3062 2.76595 20.7586 2.26562 20.0601C1.7653 19.3521 1.3877 18.526 1.13281 17.582C0.87793 16.6286 0.750488 15.5949 0.750488 14.481ZM5.52246 14.1836V14.481C5.52246 15.0568 5.56022 15.5949 5.63574 16.0952C5.71126 16.5861 5.8387 17.0203 6.01807 17.3979C6.20687 17.7756 6.45231 18.0729 6.75439 18.29C7.05648 18.4977 7.43408 18.6016 7.88721 18.6016C8.57633 18.6016 9.11914 18.4505 9.51562 18.1484C9.91211 17.8464 10.1906 17.4263 10.3511 16.8882C10.5116 16.3407 10.5776 15.7035 10.5493 14.9766V13.8579C10.5588 13.2349 10.521 12.6873 10.436 12.2153C10.3511 11.7433 10.2048 11.3516 9.99707 11.04C9.79883 10.7191 9.52979 10.4784 9.18994 10.3179C8.8501 10.1574 8.42529 10.0771 7.91553 10.0771C7.47184 10.0771 7.09424 10.181 6.78271 10.3887C6.48063 10.5869 6.23519 10.8701 6.04639 11.2383C5.86702 11.6064 5.73486 12.0407 5.6499 12.541C5.56494 13.0413 5.52246 13.5889 5.52246 14.1836ZM25.4469 18.2759V6.67871H30.2331V22H25.7585L25.4469 18.2759ZM25.9001 15.1606L27.1462 15.1323C27.1462 16.1613 27.0234 17.1147 26.778 17.9927C26.5325 18.8612 26.1691 19.6164 25.6877 20.2583C25.2157 20.9002 24.6304 21.4006 23.9318 21.7593C23.2427 22.1086 22.445 22.2832 21.5387 22.2832C20.7835 22.2832 20.0897 22.1794 19.4572 21.9717C18.8341 21.7546 18.2961 21.4194 17.8429 20.9663C17.3898 20.5037 17.0358 19.9137 16.7809 19.1963C16.5355 18.4694 16.4128 17.6009 16.4128 16.5908V6.67871H21.1847V16.6191C21.1847 16.959 21.2272 17.2516 21.3122 17.4971C21.3971 17.7425 21.5199 17.9502 21.6803 18.1201C21.8408 18.2806 22.0391 18.4033 22.2751 18.4883C22.5205 18.5638 22.799 18.6016 23.1105 18.6016C23.828 18.6016 24.3896 18.4505 24.7956 18.1484C25.2015 17.8464 25.4847 17.4357 25.6452 16.9165C25.8151 16.3973 25.9001 15.812 25.9001 15.1606ZM36.7479 6.67871V22H31.9617V6.67871H36.7479ZM31.6785 2.72803C31.6785 2.04834 31.924 1.49137 32.4149 1.05713C32.9057 0.622884 33.543 0.405762 34.3265 0.405762C35.11 0.405762 35.7472 0.622884 36.2381 1.05713C36.729 1.49137 36.9744 2.04834 36.9744 2.72803C36.9744 3.40771 36.729 3.96468 36.2381 4.39893C35.7472 4.83317 35.11 5.05029 34.3265 5.05029C33.543 5.05029 32.9057 4.83317 32.4149 4.39893C31.924 3.96468 31.6785 3.40771 31.6785 2.72803ZM51.1357 18.3184V22H39.2695V18.3184H51.1357ZM50.9941 9.25586L41.4077 22H38.1367V19.3379L47.709 6.67871H50.9941V9.25586ZM49.4223 6.67871V10.3604H38.4199V6.67871H49.4223ZM64.9288 18.3184V22H53.0626V18.3184H64.9288ZM64.7872 9.25586L55.2008 22H51.9298V19.3379L61.5021 6.67871H64.7872V9.25586ZM63.2155 6.67871V10.3604H52.213V6.67871H63.2155ZM71.1604 6.67871V22H66.3743V6.67871H71.1604ZM66.0911 2.72803C66.0911 2.04834 66.3366 1.49137 66.8274 1.05713C67.3183 0.622884 67.9555 0.405762 68.7391 0.405762C69.5226 0.405762 70.1598 0.622884 70.6507 1.05713C71.1416 1.49137 71.387 2.04834 71.387 2.72803C71.387 3.40771 71.1416 3.96468 70.6507 4.39893C70.1598 4.83317 69.5226 5.05029 68.7391 5.05029C67.9555 5.05029 67.3183 4.83317 66.8274 4.39893C66.3366 3.96468 66.0911 3.40771 66.0911 2.72803ZM77.9868 0.25V22H73.2006V0.25H77.9868ZM84.5865 9.92139V22H79.8146V6.67871H84.2892L84.5865 9.92139ZM84.006 13.8154L82.9156 13.8438C82.9156 12.7676 83.0431 11.7764 83.298 10.8701C83.5528 9.96387 83.9305 9.17562 84.4308 8.50537C84.9311 7.83512 85.5447 7.31592 86.2716 6.94775C87.0079 6.57959 87.8575 6.39551 88.8204 6.39551C89.4907 6.39551 90.0996 6.49935 90.6471 6.70703C91.1946 6.90527 91.6666 7.22152 92.0631 7.65576C92.4596 8.08057 92.7617 8.63753 92.9694 9.32666C93.1865 10.0063 93.295 10.8229 93.295 11.7764V22H88.5231V12.3853C88.5231 11.7339 88.4475 11.243 88.2965 10.9126C88.1549 10.5822 87.9472 10.3604 87.6735 10.2471C87.3997 10.1338 87.0646 10.0771 86.6681 10.0771C86.2527 10.0771 85.8798 10.1715 85.5494 10.3604C85.219 10.5492 84.9358 10.8135 84.6998 11.1533C84.4733 11.4837 84.2986 11.8755 84.1759 12.3286C84.0626 12.7817 84.006 13.2773 84.006 13.8154ZM92.757 13.8154L91.4259 13.8438C91.4259 12.7676 91.5439 11.7764 91.7799 10.8701C92.0253 9.96387 92.3888 9.17562 92.8702 8.50537C93.3611 7.83512 93.97 7.31592 94.6969 6.94775C95.4238 6.57959 96.2687 6.39551 97.2316 6.39551C97.9301 6.39551 98.5721 6.49935 99.1573 6.70703C99.7426 6.91471 100.248 7.24984 100.672 7.7124C101.097 8.17497 101.428 8.78857 101.664 9.55322C101.9 10.3084 102.018 11.243 102.018 12.3569V22H97.2316V12.3569C97.2316 11.7244 97.156 11.2477 97.005 10.9268C96.8634 10.5964 96.6557 10.3745 96.382 10.2612C96.1082 10.1385 95.7825 10.0771 95.4049 10.0771C94.9518 10.0771 94.56 10.1715 94.2296 10.3604C93.8992 10.5492 93.6207 10.8135 93.3942 11.1533C93.177 11.4837 93.0166 11.8755 92.9127 12.3286C92.8089 12.7817 92.757 13.2773 92.757 13.8154Z" fill="white"/>
      </svg>
      </div>

      {/* Botón de compartir */}
      <div className="absolute top-6 right-4">
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
        <div className="flex text-slate-500 justify-between items-center mb-2">

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
          <h1 className="text-4xl font-bold mb-4">
            ¿Qué peli es? <span className="text-3xl text-purple-500">{movie.genre}</span>
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
            className="w-full p-4 text-white rounded text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ¿He acertado?
          </button>
        </div>
  
        {/* Mensajes de feedback */}
        {isCorrect && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-md p-4 bg-green-500 text-center text-white animate-pulse">
            ¡Has acertado! 🎉
          </div>
        )}
        {isWrong && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 max-w-md w-full p-4 bg-red-500 text-center text-white">
            {[
              "Cerca, pero no es esa 🎯",
              "Intenta de nuevo... tus emojis creen en ti 🙃",
              "Casi... pero no 🕵️",
              "Nada... lo importante es participar! 🎭",
              "Nope... no desesperes, Hollywood tiene paciencia! 🎬",
            ][attempts.length % 5]}
          </div>
        )}
      </div>
    </div>
  );
}
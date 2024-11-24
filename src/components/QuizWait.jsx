import { useState, useEffect } from 'react';
import { format, differenceInSeconds } from 'date-fns';

export default function QuizWait() {
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    successRate: 0,
    distribution: [0, 0, 0, 0, 0]
  });
  const [timeToNext, setTimeToNext] = useState('');

   // Función para calcular el tiempo restante hasta las 00:00
   const calculateTimeLeft = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = differenceInSeconds(tomorrow, now);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    setTimeToNext(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
  };

  useEffect(() => {
    // Obtener las estadísticas desde localStorage
    const totalJugadas = parseInt(localStorage.getItem('jugadas') || '0');
    const totalAcertadas = parseInt(localStorage.getItem('acertadas') || '0');

    // Recuperar distribución o establecer [0, 0, 0, 0, 0] si no está disponible
    let attemptDistribution = JSON.parse(localStorage.getItem('distribution') || '[0, 0, 0, 0, 0]');

    // Asegurarnos de que la distribución tenga exactamente 5 elementos
    while (attemptDistribution.length < 5) {
      attemptDistribution.push(null);  // Rellenar con ceros si hay menos de 5 elementos
    }

    setStats((prevStats) => ({
      ...prevStats,
      distribution: attemptDistribution
    }));


    // Calcular el porcentaje de aciertos basado en las preguntas, no en los intentos
   const successRate = totalJugadas > 0 ? ((totalAcertadas / totalJugadas) * 100).toFixed(2) : 0;

    setStats({
      gamesPlayed: totalJugadas,
      successRate: Math.round(successRate), // Redondeamos el porcentaje a un número entero
      distribution: attemptDistribution
    });

    // Actualizar el contador de tiempo
    calculateTimeLeft();

    const interval = setInterval(calculateTimeLeft, 1000); // Actualizar cada segundo
    return () => clearInterval(interval); // Limpiar intervalo cuando el componente se desmonte
  }, []); // Solo se ejecuta una vez cuando el componente se monta

  // Función para compartir las estadísticas
  const handleShareStats = () => {
    const statsText = `
🎬 Mis estadísticas en MovieEmoji:
📊 Partidas jugadas: ${stats.gamesPlayed}
✅ Aciertos: ${stats.successRate}%
    `;

    if (navigator.share) {
      navigator.share({
        text: statsText,
      });
    } else {
      navigator.clipboard.writeText(statsText);
      alert('¡Estadísticas copiadas al portapapeles!');
    }
  };

  return (
    <div className="max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold mb-8">TUS ESTADÍSTICAS</h1>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-4xl font-bold">{stats.gamesPlayed}</h2>
          <p className="text-gray-400">Jugadas</p>
        </div>
        <div>
          <h2 className="text-4xl font-bold">{stats.successRate}%</h2>
          <p className="text-gray-400">Acertadas</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl mb-4">DISTRIBUCIÓN</h2>
        <div className="space-y-2">
          {stats.distribution.map((count, index) => (
            <div key={index} className="flex items-center">
              <span className="w-8">{index + 1}</span>
              <div
                className="bg-purple-600 h-6 rounded"
                style={{ width: `${(count / Math.max(...stats.distribution)) * 100}%` }}
              />
              <span className="ml-2">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl mb-2">SIGUIENTE PELI</h2>
        <p className="text-4xl font-mono">{timeToNext}</p>
      </div>

      <button
        onClick={handleShareStats}
        className="bg-purple-600 px-6 py-3 rounded-full"
      >
        Compartir estadísticas
      </button>
    </div>
  );
}
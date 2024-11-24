import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import QuizHome from './components/QuizHome';
import QuizWait from './components/QuizWait';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#1a1b3b] text-white px-4">
        <Routes>
          <Route path="/" element={<QuizHome />} />
          <Route path="/wait" element={<QuizWait />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
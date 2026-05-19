import React, { useState, useEffect, useRef } from 'react';

const NOTES = [
  { id: 1, name: 'LA', position: 0, freq: 220.00 },   // 5. linija
  { id: 2, name: 'SOL', position: 1, freq: 196.00 },  // 4. praznina
  { id: 3, name: 'FA', position: 2, freq: 174.61 },   // 4. linija (Orijentir na 70px)
  { id: 4, name: 'MI', position: 3, freq: 164.81 },   // 3. praznina
  { id: 5, name: 'RE', position: 4, freq: 146.83 },   // 3. linija
  { id: 6, name: 'DO', position: 5, freq: 130.81 },   // 2. praznina
  { id: 7, name: 'SI', position: 6, freq: 123.47 },   // 2. linija
  { id: 8, name: 'LA', position: 7, freq: 110.00 },   // 1. praznina
  { id: 9, name: 'SOL', position: 8, freq: 98.00 }    // 1. linija
];

const SOLFEGIO = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'];

export default function BasKljucKviz() {
  const [mode, setMode] = useState('learn');
  const [currentNote, setCurrentNote] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState({ show: false, isCorrect: false, text: '' });
  
  const audioCtxRef = useRef(null);

  const playTone = (frequency) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    gainNode.gain.setValueAtTime(1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    oscillator.stop(ctx.currentTime + 1.5);
  };

  const pickRandomNote = () => {
    const randomIndex = Math.floor(Math.random() * NOTES.length);
    setCurrentNote(NOTES[randomIndex]);
    setFeedback({ show: false, isCorrect: false, text: '' });
  };

  useEffect(() => {
    if (mode === 'quiz') pickRandomNote();
  }, [mode]);

  const handleGuess = (guessName) => {
    if (guessName === currentNote.name) {
      setFeedback({ show: true, isCorrect: true, text: 'Bravo! 🎉' });
      setScore((prev) => prev + 1);
      playTone(currentNote.freq);
      setTimeout(() => pickRandomNote(), 1200);
    } else {
      setFeedback({ show: true, isCorrect: false, text: `To nije ${guessName}.` });
    }
  };

  return (
    <>
      <style>
        {`
          /* UVOZIMO GOOGLE FONT ZA MUZIKU */
          @import url('https://fonts.googleapis.com/css2?family=Noto+Music&display=swap');

          .app-container {
            max-width: 700px; margin: 20px auto; padding: 15px;
            font-family: sans-serif; text-align: center;
            background-color: #f9f9f9; border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          .staff-box {
            position: relative; height: 200px; width: 100%;
            background-color: #fff; border: 1px solid #ddd;
            border-radius: 10px; margin: 20px 0;
            display: flex; flex-direction: column; justify-content: space-between;
            padding: 40px 0; box-sizing: border-box; overflow: hidden;
          }
          /* KLJUČ KORISTI NOTO MUSIC FONT */
          .clef-symbol {
            position: absolute; left: 10px; top: 70px;
            font-family: 'Noto Music', sans-serif;
            font-size: 85px; color: #333;
            line-height: 0; pointer-events: none;
            transform: translateY(-12%);
          }
          .mode-btn {
            padding: 10px 15px; font-size: 14px; font-weight: bold;
            cursor: pointer; border: none; border-radius: 8px; flex: 1;
          }
          .ans-btn {
            padding: 12px 10px; font-size: 16px; font-weight: bold;
            color: white; border: none; border-radius: 8px; cursor: pointer;
            flex: 1 1 calc(30% - 10px); min-width: 70px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .note-label {
            position: absolute; top: 25px; left: 50%;
            transform: translateX(-50%) rotate(15deg);
            font-size: 11px; font-weight: bold; color: #FF9800;
          }
          @media (min-width: 600px) {
            .app-container { padding: 30px; margin: 40px auto; }
            .mode-btn { padding: 10px 20px; font-size: 16px; }
            .ans-btn { flex: none; padding: 15px 25px; font-size: 20px; }
            .note-label { font-size: 14px; }
          }
        `}
      </style>

      <div className="app-container">
        <h2 style={{ color: '#333', marginTop: 0 }}>🎵 Interaktivni Bas Ključ 🎵</h2>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
          <button className="mode-btn" onClick={() => setMode('learn')} style={{ backgroundColor: mode === 'learn' ? '#FF9800' : '#ddd', color: mode === 'learn' ? 'white' : '#333' }}>
            📖 Učenje
          </button>
          <button className="mode-btn" onClick={() => { setMode('quiz'); setScore(0); }} style={{ backgroundColor: mode === 'quiz' ? '#007BFF' : '#ddd', color: mode === 'quiz' ? 'white' : '#333' }}>
            🎯 Kviz
          </button>
        </div>

        {mode === 'quiz' && <p style={{ fontSize: '16px', margin: '10px 0' }}>Poeni: <strong style={{ color: '#007BFF', fontSize: '22px' }}>{score}</strong></p>}

        <div className="staff-box">
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ width: '100%', height: '2px', backgroundColor: '#333' }}></div>
          ))}

          {/* Vraćamo simbol, ali ga sada čita Google-ov muzički font */}
          <div className="clef-symbol">𝄢</div>

          {mode === 'learn' && NOTES.map((note, index) => {
            const leftPosition = 25 + (index * (65 / (NOTES.length - 1))); 
            return (
              <div key={note.id} onClick={() => playTone(note.freq)}
                   style={{
                     position: 'absolute', left: `${leftPosition}%`, top: `${40 + (note.position * 15) - 10}px`,
                     width: '24px', height: '20px', backgroundColor: '#111', borderRadius: '50%',
                     transform: 'translateX(-50%) rotate(-15deg)', cursor: 'pointer'
                   }}>
                <div className="note-label">{note.name}</div>
              </div>
            );
          })}

          {mode === 'quiz' && currentNote && (
            <div style={{
              position: 'absolute', left: '60%', top: `${40 + (currentNote.position * 15) - 10}px`,
              width: '24px', height: '20px', backgroundColor: feedback.isCorrect ? '#4CAF50' : '#111',
              borderRadius: '50%', transform: 'translateX(-50%) rotate(-15deg)', transition: 'top 0.3s ease, background-color 0.3s ease'
            }}></div>
          )}
        </div>

        {mode === 'learn' ? (
          <p style={{ fontSize: '15px', color: '#666' }}>Klikni na bilo koju notu da čuješ ton.</p>
        ) : (
          <>
            <div style={{ minHeight: '30px', marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', color: feedback.isCorrect ? '#4CAF50' : '#E53935' }}>
              {feedback.show ? feedback.text : 'Koja je ovo nota?'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
              {SOLFEGIO.map((solf) => (
                <button key={solf} className="ans-btn" onClick={() => handleGuess(solf)} disabled={feedback.isCorrect}
                  style={{
                    backgroundColor: feedback.isCorrect ? '#ccc' : '#007BFF',
                    cursor: feedback.isCorrect ? 'not-allowed' : 'pointer'
                  }}>
                  {solf}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

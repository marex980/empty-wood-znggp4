import React, { useState, useEffect, useRef } from 'react';

// Nova skala: Uklonjene donje tri note, dodata nota SI iznad 5. linije (pozicija -1)
const NOTES = [
  { id: 0, name: 'SI', position: -1, freq: 246.94 },  // Iznad 5. linije
  { id: 1, name: 'LA', position: 0, freq: 220.00 },   // 5. linija
  { id: 2, name: 'SOL', position: 1, freq: 196.00 },  // 4. praznina
  { id: 3, name: 'FA', position: 2, freq: 174.61 },   // 4. linija (Orijentir na 80px)
  { id: 4, name: 'MI', position: 3, freq: 164.81 },   // 3. praznina
  { id: 5, name: 'RE', position: 4, freq: 146.83 },   // 3. linija
  { id: 6, name: 'DO', position: 5, freq: 130.81 }    // 2. praznina (Orijentir - Donja granica)
];

const SOLFEGIO = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'];

// Podešavanje statičnih melodija za treći mod (Taktiranje)
const MELODY_2_4 = [
  { note: 'DO', pos: 5, left: 25 }, { note: 'MI', pos: 3, left: 40 }, // Takt 1
  { barline: true, left: 52 },                                        // Taktica
  { note: 'SOL', pos: 1, left: 65 }, { note: 'FA', pos: 2, left: 80 } // Takt 2
];

const MELODY_3_4 = [
  { note: 'DO', pos: 5, left: 22 }, { note: 'RE', pos: 4, left: 32 }, { note: 'MI', pos: 3, left: 42 }, // Takt 1
  { barline: true, left: 52 },                                                                          // Taktica
  { note: 'FA', pos: 2, left: 62 }, { note: 'SOL', pos: 1, left: 72 }, { note: 'LA', pos: 0, left: 82 } // Takt 2
];

export default function BasKljucKviz() {
  const [mode, setMode] = useState('learn'); // 'learn', 'quiz', ili 'melody'
  const [activeMelody, setActiveMelody] = useState('2/4'); // Bira melodiju unutar trećeg moda
  
  const [currentNote, setCurrentNote] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
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
    setTotalCount(prev => prev + 1); // Povećava ukupan broj pokušaja
    
    if (guessName === currentNote.name) {
      setCorrectCount(prev => prev + 1); // Povećava tačne ako pogodi
      setFeedback({ show: true, isCorrect: true, text: 'Bravo! 🎉' });
      playTone(currentNote.freq);
      setTimeout(() => pickRandomNote(), 1200);
    } else {
      setFeedback({ show: true, isCorrect: false, text: `To nije ${guessName}.` });
    }
  };

  const resetScore = () => {
    setCorrectCount(0);
    setTotalCount(0);
    setFeedback({ show: false, isCorrect: false, text: '' });
  };

  return (
    <>
      <style>
        {`
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
          .clef-symbol {
            position: absolute; left: 10px; top: 80px; /* Zadržano tvoje podešavanje */
            font-family: 'Noto Music', sans-serif;
            font-size: 85px; color: #333;
            line-height: 0; pointer-events: none;
            transform: translateY(-12%);
          }
          .mode-btn {
            padding: 10px 5px; font-size: 13px; font-weight: bold;
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
          .barline {
            position: absolute; width: 2px; height: 120px;
            background-color: #333; top: 40px;
          }
          @media (min-width: 600px) {
            .app-container { padding: 30px; margin: 40px auto; }
            .mode-btn { padding: 10px 20px; font-size: 15px; }
            .ans-btn { flex: none; padding: 15px 25px; font-size: 20px; }
            .note-label { font-size: 14px; top: 28px; }
          }
        `}
      </style>

      <div className="app-container">
        <h2 style={{ color: '#333', marginTop: 0, marginBottom: '20px' }}>🎵 Interaktivni Bas Ključ 🎵</h2>
        
        {/* TABS / MODOVI */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
          <button className="mode-btn" onClick={() => setMode('learn')} style={{ backgroundColor: mode === 'learn' ? '#FF9800' : '#ddd', color: mode === 'learn' ? 'white' : '#333' }}>
            📖 Učenje
          </button>
          <button className="mode-btn" onClick={() => { setMode('quiz'); resetScore(); }} style={{ backgroundColor: mode === 'quiz' ? '#007BFF' : '#ddd', color: mode === 'quiz' ? 'white' : '#333' }}>
            🎯 Kviz
          </button>
          <button className="mode-btn" onClick={() => setMode('melody')} style={{ backgroundColor: mode === 'melody' ? '#4CAF50' : '#ddd', color: mode === 'melody' ? 'white' : '#333' }}>
            🎼 Melodije
          </button>
        </div>

        {/* PRIKAZ SKORA ZA KVIZ */}
        {mode === 'quiz' && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', margin: '10px 0' }}>
            <p style={{ fontSize: '18px', margin: 0 }}>Rezultat: <strong style={{ color: '#007BFF', fontSize: '24px' }}>{correctCount} / {totalCount}</strong></p>
            <button onClick={resetScore} style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Resetuj
            </button>
          </div>
        )}

        {/* PRIKAZ DUGMIĆA ZA IZBOR TAKTA U MELODIJA MODU */}
        {mode === 'melody' && (
           <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '10px 0' }}>
           <button onClick={() => setActiveMelody('2/4')} style={{ padding: '8px 15px', fontWeight: 'bold', backgroundColor: activeMelody === '2/4' ? '#333' : '#eee', color: activeMelody === '2/4' ? '#fff' : '#333', border: 'none', borderRadius: '5px' }}>
             2/4 Takt
           </button>
           <button onClick={() => setActiveMelody('3/4')} style={{ padding: '8px 15px', fontWeight: 'bold', backgroundColor: activeMelody === '3/4' ? '#333' : '#eee', color: activeMelody === '3/4' ? '#fff' : '#333', border: 'none', borderRadius: '5px' }}>
             3/4 Takt
           </button>
         </div>
        )}

        {/* NOTNI SISTEM */}
        <div className="staff-box">
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ width: '100%', height: '2px', backgroundColor: '#333' }}></div>
          ))}

          <div className="clef-symbol">𝄢</div>

          {/* 1. MOD ZA UČENJE */}
          {mode === 'learn' && NOTES.map((note, index) => {
            // Ravnomerno raspoređivanje od 25% do 85% širine
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

          {/* 2. MOD ZA KVIZ */}
          {mode === 'quiz' && currentNote && (
            <div style={{
              position: 'absolute', left: '60%', top: `${40 + (currentNote.position * 15) - 10}px`,
              width: '24px', height: '20px', backgroundColor: feedback.isCorrect ? '#4CAF50' : '#111',
              borderRadius: '50%', transform: 'translateX(-50%) rotate(-15deg)', transition: 'top 0.3s ease, background-color 0.3s ease'
            }}></div>
          )}

          {/* 3. MOD ZA MELODIJU (TAKTIRANJE) */}
          {mode === 'melody' && (
            <>
              {/* Znak za takt odmah pored ključa */}
              <div style={{ position: 'absolute', left: '55px', top: '70px', fontSize: '30px', fontWeight: 'bold', lineHeight: '30px', color: '#333', display: 'flex', flexDirection: 'column' }}>
                <span>{activeMelody === '2/4' ? '2' : '3'}</span>
                <span>4</span>
              </div>
              
              {/* Iscrtavanje nota i taktova na osnovu izbora */}
              {(activeMelody === '2/4' ? MELODY_2_4 : MELODY_3_4).map((item, index) => {
                if (item.barline) {
                  return <div key={index} className="barline" style={{ left: `${item.left}%` }}></div>;
                }
                // Ako nije taktna crta, onda je nota
                return (
                  <div key={index} style={{
                    position: 'absolute', left: `${item.left}%`, top: `${40 + (item.pos * 15) - 10}px`,
                    width: '24px', height: '20px', backgroundColor: '#111', borderRadius: '50%', transform: 'translateX(-50%) rotate(-15deg)'
                  }}>
                    <div className="note-label" style={{ color: '#666' }}>{item.note}</div>
                  </div>
                );
              })}
              
              {/* Završna dvostruka taktna crta na kraju sistema */}
              <div style={{ position: 'absolute', right: '15px', top: '40px', width: '2px', height: '120px', backgroundColor: '#333' }}></div>
              <div style={{ position: 'absolute', right: '10px', top: '40px', width: '4px', height: '120px', backgroundColor: '#333' }}></div>
            </>
          )}
        </div>

        {/* DONJI KONTROLNI DEO */}
        {mode === 'learn' && (
          <p style={{ fontSize: '15px', color: '#666' }}>Klikni na bilo koju notu da čuješ ton.</p>
        )}
        
        {mode === 'melody' && (
          <p style={{ fontSize: '15px', color: '#666' }}>Otvori šaku i spremi ruku! Čitaj note redom i taktiraš.</p>
        )}

        {mode === 'quiz' && (
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

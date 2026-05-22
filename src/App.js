import React, { useState, useEffect, useRef } from 'react';

const NOTES = [
  { id: 0, name: 'SI', position: -1, freq: 246.94 },
  { id: 1, name: 'LA', position: 0, freq: 220.00 },
  { id: 2, name: 'SOL', position: 1, freq: 196.00 },
  { id: 3, name: 'FA', position: 2, freq: 174.61 },
  { id: 4, name: 'MI', position: 3, freq: 164.81 },
  { id: 5, name: 'RE', position: 4, freq: 146.83 },
  { id: 6, name: 'DO', position: 5, freq: 130.81 }
];

const SOLFEGIO = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'];

// Baza od više melodija
const MELODIES_2_4_BANK = [
  ['DO', 'MI', '|', 'SOL', 'FA', '|', 'RE', 'FA', '|', 'MI', 'DO', '||'],
  ['DO', 'RE', '|', 'MI', 'FA', '|', 'SOL', 'LA', '|', 'SI', 'SOL', '||'],
  ['MI', 'DO', '|', 'FA', 'RE', '|', 'SOL', 'MI', '|', 'DO', 'DO', '||']
];

const MELODIES_3_4_BANK = [
  ['DO', 'RE', 'MI', '|', 'FA', 'SOL', 'LA', '|', 'SI', 'LA', 'SOL', '|', 'FA', 'MI', 'RE', '||'],
  ['DO', 'MI', 'SOL', '|', 'SOL', 'FA', 'MI', '|', 'RE', 'FA', 'LA', '|', 'LA', 'SOL', 'FA', '||'],
  ['MI', 'FA', 'SOL', '|', 'DO', 'RE', 'MI', '|', 'FA', 'SOL', 'LA', '|', 'SI', 'SOL', 'DO', '||']
];

const LEARN_SCALE_RAW = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'];

const buildMelody = (symbols) => {
  let left = 40;
  let noteIndex = 0; // Broji samo prave note, ignoriše taktne crte
  const elements = [];
  
  symbols.forEach((sym, index) => {
    if (sym === '|') {
      elements.push({ id: index, type: 'barline', left: left - 15 });
    } else if (sym === '||') {
      elements.push({ id: index, type: 'doublebar', left: left });
    } else {
      const noteObj = NOTES.find(n => n.name === sym);
      if (noteObj) {
        elements.push({ 
          id: index, type: 'note', name: sym, pos: noteObj.position, 
          freq: noteObj.freq, left: left, noteIndex: noteIndex 
        });
        left += 55;
        noteIndex++;
      }
    }
  });
  return { elements, totalWidth: left + 30 };
};

export default function BasKljucKviz() {
  const [mode, setMode] = useState('learn');
  
  // KVIZ State
  const [currentNote, setCurrentNote] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [feedback, setFeedback] = useState({ show: false, isCorrect: false, text: '' });
  const [timer, setTimer] = useState(0);
  const [quizActive, setQuizActive] = useState(false);

  // MELODIJA State
  const [activeMelodyType, setActiveMelodyType] = useState('2/4');
  const [activeMelodyData, setActiveMelodyData] = useState(() => buildMelody(MELODIES_2_4_BANK[0]));
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [currentTick, setCurrentTick] = useState(-1);
  
  const audioCtxRef = useRef(null);

  const initAudio = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  };

  const playTone = (frequency) => {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    gainNode.gain.setValueAtTime(1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.stop(ctx.currentTime + 1.5);
  };

  const playClick = (isStrongBeat) => {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle'; 
    osc.frequency.value = isStrongBeat ? 880 : 440; 
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); 
    osc.stop(ctx.currentTime + 0.1);
  };

  // --- KVIZ LOGIKA I TAJMER ---
  const resetQuiz = () => {
    setCorrectCount(0);
    setTotalCount(0);
    setTimer(0);
    setQuizActive(false);
    setFeedback({ show: false, isCorrect: false, text: '' });
    pickRandomNote();
  };

  useEffect(() => {
    let interval;
    if (mode === 'quiz' && quizActive) {
      interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mode, quizActive]);

  const pickRandomNote = () => {
    const randomIndex = Math.floor(Math.random() * NOTES.length);
    setCurrentNote(NOTES[randomIndex]);
    setFeedback({ show: false, isCorrect: false, text: '' });
  };

  useEffect(() => {
    if (mode === 'quiz' && !currentNote) pickRandomNote();
  }, [mode]);

  const handleGuess = (guessName) => {
    if (!quizActive) setQuizActive(true); // Pokreće tajmer na prvi klik
    setTotalCount(prev => prev + 1);
    
    if (guessName === currentNote.name) {
      setCorrectCount(prev => prev + 1);
      setFeedback({ show: true, isCorrect: true, text: 'Bravo! 🎉' });
      playTone(currentNote.freq);
      setTimeout(() => pickRandomNote(), 1000);
    } else {
      setFeedback({ show: true, isCorrect: false, text: `To nije ${guessName}.` });
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- MELODIJA LOGIKA I METRONOM ---
  const changeMelodyBank = (type) => {
    setActiveMelodyType(type);
    setMetronomeOn(false);
    const bank = type === '2/4' ? MELODIES_2_4_BANK : MELODIES_3_4_BANK;
    setActiveMelodyData(buildMelody(bank[0]));
  };

  const pickRandomMelody = () => {
    setMetronomeOn(false);
    const bank = activeMelodyType === '2/4' ? MELODIES_2_4_BANK : MELODIES_3_4_BANK;
    const randomRaw = bank[Math.floor(Math.random() * bank.length)];
    setActiveMelodyData(buildMelody(randomRaw));
  };

  useEffect(() => {
    let interval;
    if (mode === 'melody' && metronomeOn) {
      setCurrentTick(0); 
      let beat = 1;
      playClick(true); // Otkucaj prvu dobu odmah

      interval = setInterval(() => {
        setCurrentTick(prev => prev + 1);
        beat = (beat % (activeMelodyType === '2/4' ? 2 : 3)) + 1;
        playClick(beat === 1);
      }, 1000); // 60 udaraca u sekundi
    } else {
      setCurrentTick(-1); // Resetuje ispisivanje nota kada se ugasi
    }
    return () => clearInterval(interval);
  }, [mode, metronomeOn, activeMelodyType]);

  useEffect(() => {
    if (mode !== 'melody') setMetronomeOn(false);
  }, [mode]);

  const learnData = buildMelody(LEARN_SCALE_RAW);

  return (
    <>
      <style>
        {`
          .app-container {
            max-width: 700px; margin: 20px auto; padding: 15px;
            font-family: sans-serif; text-align: center;
            background-color: #f9f9f9; border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          .scroll-wrapper {
            width: 100%; overflow-x: auto; overflow-y: hidden;
            background-color: #fff; border: 1px solid #ddd;
            border-radius: 10px; margin: 20px 0; padding: 40px 0;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.05);
          }
          .staff-content {
            position: relative; height: 120px;
            display: flex; flex-direction: column; justify-content: space-between;
          }
          .mini-clef-badge {
            position: absolute; left: 10px; top: -30px;
            font-size: 14px; font-weight: bold; color: #888;
            background: #eee; padding: 2px 8px; border-radius: 5px;
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
          .note-head {
            position: absolute; width: 20px; height: 16px;
            background-color: #111; border-radius: 50%;
            transform: translateX(-50%) rotate(-15deg);
          }
          .note-label {
            position: absolute; top: 22px; left: 50%;
            transform: translateX(-50%) rotate(15deg);
            font-size: 12px; font-weight: bold; color: #FF9800;
          }
          .barline {
            position: absolute; width: 2px; height: 120px;
            background-color: #333; top: 0;
          }
          @media (min-width: 600px) {
            .app-container { padding: 30px; margin: 40px auto; }
            .mode-btn { padding: 10px 20px; font-size: 15px; }
            .ans-btn { flex: none; padding: 15px 25px; font-size: 20px; }
          }
        `}
      </style>

      <div className="app-container">
        <h2 style={{ color: '#333', marginTop: 0, marginBottom: '20px' }}>🎵 Interaktivni Bas Ključ 🎵</h2>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
          <button className="mode-btn" onClick={() => setMode('learn')} style={{ backgroundColor: mode === 'learn' ? '#FF9800' : '#ddd', color: mode === 'learn' ? 'white' : '#333' }}>📖 Učenje</button>
          <button className="mode-btn" onClick={() => { setMode('quiz'); resetQuiz(); }} style={{ backgroundColor: mode === 'quiz' ? '#007BFF' : '#ddd', color: mode === 'quiz' ? 'white' : '#333' }}>🎯 Kviz</button>
          <button className="mode-btn" onClick={() => setMode('melody')} style={{ backgroundColor: mode === 'melody' ? '#4CAF50' : '#ddd', color: mode === 'melody' ? 'white' : '#333' }}>🎼 Melodije</button>
        </div>

        {/* --- UI ZA KVIZ --- */}
        {mode === 'quiz' && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', margin: '15px 0', backgroundColor: '#e9ecef', padding: '10px', borderRadius: '10px' }}>
            <div style={{ fontSize: '18px' }}>
              Skor: <strong style={{ color: '#007BFF', fontSize: '22px' }}>{correctCount} / {totalCount}</strong>
            </div>
            <div style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              ⏱ <strong style={{ color: '#333', fontSize: '22px', fontFamily: 'monospace' }}>{formatTime(timer)}</strong>
            </div>
            <button onClick={resetQuiz} style={{ padding: '6px 12px', fontSize: '14px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Resetuj
            </button>
          </div>
        )}

        {/* --- UI ZA MELODIJE --- */}
        {mode === 'melody' && (
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', margin: '10px 0' }}>
             <div style={{ display: 'flex', gap: '10px' }}>
               <button onClick={() => changeMelodyBank('2/4')} style={{ padding: '8px 15px', fontWeight: 'bold', backgroundColor: activeMelodyType === '2/4' ? '#333' : '#eee', color: activeMelodyType === '2/4' ? '#fff' : '#333', border: 'none', borderRadius: '5px' }}>2/4 Takt</button>
               <button onClick={() => changeMelodyBank('3/4')} style={{ padding: '8px 15px', fontWeight: 'bold', backgroundColor: activeMelodyType === '3/4' ? '#333' : '#eee', color: activeMelodyType === '3/4' ? '#fff' : '#333', border: 'none', borderRadius: '5px' }}>3/4 Takt</button>
               
               <button onClick={pickRandomMelody} style={{ padding: '8px 15px', fontWeight: 'bold', backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                 🎲 Nova
               </button>
             </div>
             
             <button onClick={() => setMetronomeOn(!metronomeOn)} style={{ padding: '10px 25px', fontSize: '16px', fontWeight: 'bold', backgroundColor: metronomeOn ? '#E53935' : '#4CAF50', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
               {metronomeOn ? '⏹ Zaustavi Metronom' : '▶ Pokreni Metronom'}
             </button>
           </div>
        )}

        {/* --- GLAVNI NOTNI SISTEM --- */}
        <div className="scroll-wrapper">
          <div className="staff-content" style={{ minWidth: mode === 'quiz' ? '100%' : (mode === 'learn' ? `${learnData.totalWidth}px` : `${activeMelodyData.totalWidth}px`) }}>
            
            <div className="mini-clef-badge">𝄢 F Ključ</div>

            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ width: '100%', height: '2px', backgroundColor: '#333' }}></div>
            ))}

            {mode === 'learn' && learnData.elements.map(el => (
               <div key={el.id} className="note-head" onClick={() => playTone(el.freq)} style={{ left: `${el.left}px`, top: `${(el.pos * 15) - 8}px`, cursor: 'pointer' }}>
                 <div className="note-label">{el.name}</div>
               </div>
            ))}

            {mode === 'quiz' && currentNote && (
              <div className="note-head" style={{ left: '50%', top: `${(currentNote.position * 15) - 8}px`, backgroundColor: feedback.isCorrect ? '#4CAF50' : '#111', transition: 'top 0.3s ease, background-color 0.3s ease' }}></div>
            )}

            {mode === 'melody' && (
              <>
                <div style={{ position: 'absolute', left: '10px', top: '30px', fontSize: '30px', fontWeight: 'bold', lineHeight: '30px', color: '#666', display: 'flex', flexDirection: 'column' }}>
                  <span>{activeMelodyType === '2/4' ? '2' : '3'}</span><span>4</span>
                </div>
                
                {activeMelodyData.elements.map(el => {
                  if (el.type === 'barline') return <div key={el.id} className="barline" style={{ left: `${el.left}px` }}></div>;
                  if (el.type === 'doublebar') return (
                    <React.Fragment key={el.id}>
                      <div className="barline" style={{ left: `${el.left}px` }}></div>
                      <div className="barline" style={{ left: `${el.left + 5}px`, width: '4px' }}></div>
                    </React.Fragment>
                  );
                  
                  // LOGIKA ZA KASNI PRIKAZ NOTA: Ime se vidi samo ako je metronom otkucao SREDEĆU notu (el.noteIndex < currentTick)
                  const showLabel = currentTick > -1 && el.noteIndex < currentTick;

                  return (
                    <div key={el.id} className="note-head" onClick={() => playTone(el.freq)} style={{ left: `${el.left}px`, top: `${(el.pos * 15) - 8}px` }}>
                      {showLabel && <div className="note-label" style={{ color: '#E53935', fontSize: '13px' }}>{el.name}</div>}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {mode === 'melody' && !metronomeOn && (
          <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>💡 Pritisni "Pokreni Metronom" za čitanje sa zakašnjenjem (shadowing)!</p>
        )}

        {mode === 'quiz' && (
          <>
            <div style={{ minHeight: '30px', marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', color: feedback.isCorrect ? '#4CAF50' : '#E53935' }}>
              {feedback.show ? feedback.text : 'Koja je ovo nota? (Tajmer kreće na prvi klik)'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
              {SOLFEGIO.map((solf) => (
                <button key={solf} className="ans-btn" onClick={() => handleGuess(solf)} disabled={feedback.isCorrect}
                  style={{ backgroundColor: feedback.isCorrect ? '#ccc' : '#007BFF', cursor: feedback.isCorrect ? 'not-allowed' : 'pointer' }}>
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

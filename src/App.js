import React, { useState, useEffect, useRef } from 'react';

// Fiksirana skala: Od donjeg DO do gornjeg SI
const NOTES = [
  { id: 0, name: 'SI', position: -1, freq: 246.94 },  // Iznad 5. linije
  { id: 1, name: 'LA', position: 0, freq: 220.00 },   // 5. linija
  { id: 2, name: 'SOL', position: 1, freq: 196.00 },  // 4. praznina
  { id: 3, name: 'FA', position: 2, freq: 174.61 },   // 4. linija
  { id: 4, name: 'MI', position: 3, freq: 164.81 },   // 3. praznina
  { id: 5, name: 'RE', position: 4, freq: 146.83 },   // 3. linija
  { id: 6, name: 'DO', position: 5, freq: 130.81 }    // 2. praznina
];

const SOLFEGIO = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'];

// Nove, duže melodije (Znak '|' je taktna crta, '||' je kraj)
const MELODY_2_4_RAW = ['DO', 'MI', '|', 'SOL', 'FA', '|', 'RE', 'FA', '|', 'MI', 'DO', '||'];
const MELODY_3_4_RAW = ['DO', 'RE', 'MI', '|', 'FA', 'SOL', 'LA', '|', 'SI', 'LA', 'SOL', '|', 'FA', 'MI', 'RE', '|', 'DO', '||'];
const LEARN_SCALE_RAW = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'];

// Pametna funkcija koja "razvlači" melodiju i automatski računa širinu ekrana
const buildMelody = (symbols) => {
  let left = 40;
  const elements = [];
  symbols.forEach((sym, index) => {
    if (sym === '|') {
      elements.push({ id: index, type: 'barline', left: left - 15 });
    } else if (sym === '||') {
      elements.push({ id: index, type: 'doublebar', left: left });
    } else {
      const noteObj = NOTES.find(n => n.name === sym);
      if (noteObj) {
        elements.push({ id: index, type: 'note', name: sym, pos: noteObj.position, freq: noteObj.freq, left: left });
        left += 55; // Razmak između nota
      }
    }
  });
  return { elements, totalWidth: left + 30 };
};

export default function BasKljucKviz() {
  const [mode, setMode] = useState('learn');
  const [activeMelody, setActiveMelody] = useState('2/4');
  
  const [currentNote, setCurrentNote] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [feedback, setFeedback] = useState({ show: false, isCorrect: false, text: '' });
  
  // Metronom state
  const [metronomeOn, setMetronomeOn] = useState(false);
  
  const audioCtxRef = useRef(null);

  // Zvuk za note
  const playTone = (frequency) => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
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

  // Zvuk za metronom (kratak "tik")
  const playClick = (isStrongBeat) => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle'; 
    osc.frequency.value = isStrongBeat ? 880 : 440; // Viši ton za prvu dobu
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); // Ekstremno kratak zvuk
    osc.stop(ctx.currentTime + 0.1);
  };

  // Metronom Logika
  useEffect(() => {
    let interval;
    if (mode === 'melody' && metronomeOn) {
      let currentBeat = 0;
      const beatsPerMeasure = activeMelody === '2/4' ? 2 : 3;
      
      interval = setInterval(() => {
        currentBeat = (currentBeat % beatsPerMeasure) + 1;
        playClick(currentBeat === 1); // Ako je 1. doba, šalje true za viši ton
      }, 1000); // 60 udaraca u minuti (1 svake sekunde)
    }
    return () => clearInterval(interval);
  }, [mode, metronomeOn, activeMelody]);

  // Isključivanje metronoma pri promeni taba
  useEffect(() => {
    if (mode !== 'melody') setMetronomeOn(false);
  }, [mode]);

  const pickRandomNote = () => {
    const randomIndex = Math.floor(Math.random() * NOTES.length);
    setCurrentNote(NOTES[randomIndex]);
    setFeedback({ show: false, isCorrect: false, text: '' });
  };

  useEffect(() => {
    if (mode === 'quiz') pickRandomNote();
  }, [mode]);

  const handleGuess = (guessName) => {
    setTotalCount(prev => prev + 1);
    if (guessName === currentNote.name) {
      setCorrectCount(prev => prev + 1);
      setFeedback({ show: true, isCorrect: true, text: 'Bravo! 🎉' });
      playTone(currentNote.freq);
      setTimeout(() => pickRandomNote(), 1200);
    } else {
      setFeedback({ show: true, isCorrect: false, text: `To nije ${guessName}.` });
    }
  };

  // Generisanje podataka za iscrtavanje
  const learnData = buildMelody(LEARN_SCALE_RAW);
  const melodyData = activeMelody === '2/4' ? buildMelody(MELODY_2_4_RAW) : buildMelody(MELODY_3_4_RAW);

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
          /* Scroll kontejner koji omogućava "svajpovanje" na telefonu */
          .scroll-wrapper {
            width: 100%; overflow-x: auto; overflow-y: hidden;
            background-color: #fff; border: 1px solid #ddd;
            border-radius: 10px; margin: 20px 0; padding: 40px 0;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.05);
          }
          /* Unutrašnji sadržaj koji se razvlači koliko mu note traže */
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
          /* Sitnije note */
          .note-head {
            position: absolute; width: 20px; height: 16px;
            background-color: #111; border-radius: 50%;
            transform: translateX(-50%) rotate(-15deg);
          }
          .note-label {
            position: absolute; top: 22px; left: 50%;
            transform: translateX(-50%) rotate(15deg);
            font-size: 11px; font-weight: bold; color: #FF9800;
          }
          .barline {
            position: absolute; width: 2px; height: 120px;
            background-color: #333; top: 0;
          }
          @media (min-width: 600px) {
            .app-container { padding: 30px; margin: 40px auto; }
            .mode-btn { padding: 10px 20px; font-size: 15px; }
            .ans-btn { flex: none; padding: 15px 25px; font-size: 20px; }
            .note-label { font-size: 13px; top: 24px; }
          }
        `}
      </style>

      <div className="app-container">
        <h2 style={{ color: '#333', marginTop: 0, marginBottom: '20px' }}>🎵 Interaktivni Bas Ključ 🎵</h2>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
          <button className="mode-btn" onClick={() => setMode('learn')} style={{ backgroundColor: mode === 'learn' ? '#FF9800' : '#ddd', color: mode === 'learn' ? 'white' : '#333' }}>
            📖 Učenje
          </button>
          <button className="mode-btn" onClick={() => { setMode('quiz'); setCorrectCount(0); setTotalCount(0); }} style={{ backgroundColor: mode === 'quiz' ? '#007BFF' : '#ddd', color: mode === 'quiz' ? 'white' : '#333' }}>
            🎯 Kviz
          </button>
          <button className="mode-btn" onClick={() => setMode('melody')} style={{ backgroundColor: mode === 'melody' ? '#4CAF50' : '#ddd', color: mode === 'melody' ? 'white' : '#333' }}>
            🎼 Melodije
          </button>
        </div>

        {/* INFO TRAKA (Skor ili Opcije Melodije) */}
        {mode === 'quiz' && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', margin: '10px 0' }}>
            <p style={{ fontSize: '18px', margin: 0 }}>Rezultat: <strong style={{ color: '#007BFF', fontSize: '24px' }}>{correctCount} / {totalCount}</strong></p>
            <button onClick={() => { setCorrectCount(0); setTotalCount(0); }} style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Resetuj
            </button>
          </div>
        )}

        {mode === 'melody' && (
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
             <div style={{ display: 'flex', gap: '10px' }}>
               <button onClick={() => {setActiveMelody('2/4'); setMetronomeOn(false);}} style={{ padding: '8px 15px', fontWeight: 'bold', backgroundColor: activeMelody === '2/4' ? '#333' : '#eee', color: activeMelody === '2/4' ? '#fff' : '#333', border: 'none', borderRadius: '5px' }}>2/4 Takt</button>
               <button onClick={() => {setActiveMelody('3/4'); setMetronomeOn(false);}} style={{ padding: '8px 15px', fontWeight: 'bold', backgroundColor: activeMelody === '3/4' ? '#333' : '#eee', color: activeMelody === '3/4' ? '#fff' : '#333', border: 'none', borderRadius: '5px' }}>3/4 Takt</button>
             </div>
             
             {/* Metronom Toggle */}
             <button onClick={() => setMetronomeOn(!metronomeOn)} style={{ padding: '8px 20px', fontWeight: 'bold', backgroundColor: metronomeOn ? '#E53935' : '#4CAF50', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
               {metronomeOn ? '⏹ Isključi Metronom' : '▶ Uključi Metronom'}
             </button>
           </div>
        )}

        {/* NOTNI SISTEM SA HORIZONTALNIM SKROLOM */}
        <div className="scroll-wrapper">
          <div className="staff-content" style={{ minWidth: mode === 'quiz' ? '100%' : (mode === 'learn' ? `${learnData.totalWidth}px` : `${melodyData.totalWidth}px`) }}>
            
            <div className="mini-clef-badge">𝄢 Bas Ključ (F)</div>

            {/* Iscrtavanje 5 linija preko cele širine */}
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ width: '100%', height: '2px', backgroundColor: '#333' }}></div>
            ))}

            {/* 1. MOD ZA UČENJE */}
            {mode === 'learn' && learnData.elements.map(el => (
               <div key={el.id} className="note-head" onClick={() => playTone(el.freq)}
                    style={{ left: `${el.left}px`, top: `${(el.pos * 15) - 8}px`, cursor: 'pointer' }}>
                 <div className="note-label">{el.name}</div>
               </div>
            ))}

            {/* 2. MOD ZA KVIZ */}
            {mode === 'quiz' && currentNote && (
              <div className="note-head" style={{
                left: '50%', top: `${(currentNote.position * 15) - 8}px`,
                backgroundColor: feedback.isCorrect ? '#4CAF50' : '#111',
                transition: 'top 0.3s ease, background-color 0.3s ease'
              }}></div>
            )}

            {/* 3. MOD ZA MELODIJU */}
            {mode === 'melody' && (
              <>
                <div style={{ position: 'absolute', left: '10px', top: '30px', fontSize: '30px', fontWeight: 'bold', lineHeight: '30px', color: '#666', display: 'flex', flexDirection: 'column' }}>
                  <span>{activeMelody === '2/4' ? '2' : '3'}</span><span>4</span>
                </div>
                
                {melodyData.elements.map(el => {
                  if (el.type === 'barline') return <div key={el.id} className="barline" style={{ left: `${el.left}px` }}></div>;
                  if (el.type === 'doublebar') return (
                    <React.Fragment key={el.id}>
                      <div className="barline" style={{ left: `${el.left}px` }}></div>
                      <div className="barline" style={{ left: `${el.left + 5}px`, width: '4px' }}></div>
                    </React.Fragment>
                  );
                  return (
                    <div key={el.id} className="note-head" onClick={() => playTone(el.freq)} style={{ left: `${el.left}px`, top: `${(el.pos * 15) - 8}px` }}>
                      <div className="note-label" style={{ color: '#666' }}>{el.name}</div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* DONJE PORUKE I TASTARURA */}
        {(mode === 'learn' || mode === 'melody') && (
          <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
            📱 <strong>Savet:</strong> Okreni telefon vodoravno ili svajpuj po notama levo-desno!
          </p>
        )}

        {mode === 'quiz' && (
          <>
            <div style={{ minHeight: '30px', marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', color: feedback.isCorrect ? '#4CAF50' : '#E53935' }}>
              {feedback.show ? feedback.text : 'Koja je ovo nota?'}
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

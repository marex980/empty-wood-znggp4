import React, { useState, useEffect, useRef } from 'react';

// ==========================================
// 1. BAZE PODATAKA (Konstante)
// ==========================================

const BASS_NOTES = [
  { id: 0, name: 'SI', position: -1, freq: 246.94 },
  { id: 1, name: 'LA', position: 0, freq: 220.00 },
  { id: 2, name: 'SOL', position: 1, freq: 196.00 },
  { id: 3, name: 'FA', position: 2, freq: 174.61 },
  { id: 4, name: 'MI', position: 3, freq: 164.81 },
  { id: 5, name: 'RE', position: 4, freq: 146.83 },
  { id: 6, name: 'DO', position: 5, freq: 130.81 }
];

const TREBLE_NOTES = [
  { id: 10, name: 'DO', position: 3, freq: 523.25 }, // Gornje DO
  { id: 11, name: 'SI', position: 4, freq: 493.88 },
  { id: 12, name: 'LA', position: 5, freq: 440.00 },
  { id: 13, name: 'SOL', position: 6, freq: 392.00 },
  { id: 14, name: 'FA', position: 7, freq: 349.23 },
  { id: 15, name: 'MI', position: 8, freq: 329.63 }, // 1. linija
  { id: 16, name: 'RE', position: 9, freq: 293.66 }, // Praznina ispod 1. linije
  { id: 17, name: 'DO', position: 10, freq: 261.63, ledger: true } // Donje DO (Prva pomoćna linija)
];

const SOLFEGIO = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'];

const MELODIES = {
  bass: {
    '2/4': [
  ['DO', 'MI', '|', 'SOL', 'FA', '|', 'RE', 'FA', '|', 'MI', 'DO', '||'],
  ['DO', 'RE', '|', 'MI', 'FA', '|', 'SOL', 'LA', '|', 'SI', 'SOL', '||'],
  ['MI', 'DO', '|', 'FA', 'RE', '|', 'SOL', 'MI', '|', 'DO', 'DO', '||']
],
    '3/4': [
  ['DO', 'RE', 'MI', '|', 'FA', 'SOL', 'LA', '|', 'SI', 'LA', 'SOL', '|', 'FA', 'MI', 'RE', '||'],
  ['DO', 'MI', 'SOL', '|', 'SOL', 'FA', 'MI', '|', 'RE', 'FA', 'LA', '|', 'LA', 'SOL', 'FA', '||'],
  ['MI', 'FA', 'SOL', '|', 'DO', 'RE', 'MI', '|', 'FA', 'SOL', 'LA', '|', 'SI', 'SOL', 'DO', '||']
]
  },
  treble: {
    '2/4': [
      ['DO', 'MI', '|', 'RE', 'FA', '|', 'MI', 'SOL', '|', 'FA', 'MI', '||'],
      ['MI', 'SOL', '|', 'DO', 'DO', '|', 'SI', 'LA', '|', 'SOL', 'MI', '||']
    ],
    '3/4': [
      ['DO', 'MI', 'SOL', '|', 'SOL', 'FA', 'MI', '|', 'RE', 'FA', 'LA', '|', 'LA', 'SOL', 'FA', '||']
    ]
  }
};

const LEARN_SCALE_RAW = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'];

// Helper funkcija za građenje niza nota iz sirovih stringova
const buildMelody = (symbols, activeNotesDb) => {
  let left = 40;
  let noteIndex = 0;
  const elements = [];
  
  symbols.forEach((sym, index) => {
    if (sym === '|') {
      elements.push({ id: index, type: 'barline', left: left - 15 });
    } else if (sym === '||') {
      elements.push({ id: index, type: 'doublebar', left: left });
    } else {
      // Za učenje nam treba redom DO, RE, MI... Ali Treble i Bass imaju te note na drugim pozicijama!
      // Tražimo prvu notu koja odgovara imenu iz aktivne baze ključa (odozdo na gore)
      const noteObjs = activeNotesDb.filter(n => n.name === sym);
      // Uzimamo najnižu notu iz opsega (sa najvećom pozicijom) za skalu
      const noteObj = noteObjs.reduce((prev, curr) => (prev.position > curr.position) ? prev : curr, noteObjs[0]);
      
      if (noteObj) {
        elements.push({ 
          id: index, type: 'note', name: sym, pos: noteObj.position, 
          freq: noteObj.freq, left: left, noteIndex: noteIndex, ledger: noteObj.ledger 
        });
        left += 55;
        noteIndex++;
      }
    }
  });
  return { elements, totalWidth: left + 30 };
};

// ==========================================
// 2. PODKOMPONENTE (UI Delovi)
// ==========================================

const HeaderButtons = ({ clef, setClef, mode, setMode, resetQuiz }) => (
  <div style={{ marginBottom: '20px' }}>
    {/* Izbor Ključa */}
    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
      <button onClick={() => { setClef('treble'); resetQuiz(); }} style={{ padding: '8px 15px', fontWeight: 'bold', borderRadius: '20px', border: 'none', backgroundColor: clef === 'treble' ? '#673AB7' : '#e0e0e0', color: clef === 'treble' ? '#fff' : '#333' }}>
        𝄞 Violinski
      </button>
      <button onClick={() => { setClef('bass'); resetQuiz(); }} style={{ padding: '8px 15px', fontWeight: 'bold', borderRadius: '20px', border: 'none', backgroundColor: clef === 'bass' ? '#009688' : '#e0e0e0', color: clef === 'bass' ? '#fff' : '#333' }}>
        𝄢 Bas ključ
      </button>
    </div>
    
    {/* Izbor Moda */}
    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
      <button onClick={() => setMode('learn')} style={{ padding: '10px 15px', fontWeight: 'bold', borderRadius: '8px', border: 'none', backgroundColor: mode === 'learn' ? '#FF9800' : '#ddd', color: mode === 'learn' ? 'white' : '#333' }}>📖 Učenje</button>
      <button onClick={() => { setMode('quiz'); resetQuiz(); }} style={{ padding: '10px 15px', fontWeight: 'bold', borderRadius: '8px', border: 'none', backgroundColor: mode === 'quiz' ? '#007BFF' : '#ddd', color: mode === 'quiz' ? 'white' : '#333' }}>🎯 Kviz</button>
      <button onClick={() => setMode('melody')} style={{ padding: '10px 15px', fontWeight: 'bold', borderRadius: '8px', border: 'none', backgroundColor: mode === 'melody' ? '#4CAF50' : '#ddd', color: mode === 'melody' ? 'white' : '#333' }}>🎼 Melodije</button>
    </div>
  </div>
);

const Staff = ({ clef, mode, width, children }) => (
  <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '10px', margin: '20px 0', padding: '40px 0', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)' }}>
    <div style={{ position: 'relative', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: width }}>
      
      <div style={{ position: 'absolute', left: '10px', top: '-30px', fontSize: '14px', fontWeight: 'bold', color: clef === 'treble' ? '#673AB7' : '#009688', background: '#eee', padding: '2px 8px', borderRadius: '5px' }}>
        {clef === 'treble' ? '𝄞 Violinski Ključ' : '𝄢 Bas Ključ (F)'}
      </div>

      {/* 5 Linija */}
      {[...Array(5)].map((_, i) => <div key={i} style={{ width: '100%', height: '2px', backgroundColor: '#333' }}></div>)}
      
      {children}
    </div>
  </div>
);

const Note = ({ left, top, name, showLabel, ledger, onClick }) => (
  <div onClick={onClick} style={{ position: 'absolute', left: `${left}px`, top: `${top}px`, width: '20px', height: '16px', backgroundColor: '#111', borderRadius: '50%', transform: 'translateX(-50%) rotate(-15deg)', cursor: 'pointer' }}>
    {/* Pomoćna linija (Ledger line) za note van sistema poput donjeg DO */}
    {ledger && <div style={{ position: 'absolute', top: '50%', left: '-30%', width: '160%', height: '2px', backgroundColor: '#111', transform: 'translateY(-50%)' }}></div>}
    {showLabel && <div style={{ position: 'absolute', top: '22px', left: '50%', transform: 'translateX(-50%) rotate(15deg)', fontSize: '12px', fontWeight: 'bold', color: '#E53935' }}>{name}</div>}
  </div>
);

// ==========================================
// 3. GLAVNA KOMPONENTA (App / Logic)
// ==========================================

export default function ClefApp() {
  const [clef, setClef] = useState('bass'); // 'bass' ili 'treble'
  const [mode, setMode] = useState('learn');
  
  // Quiz
  const [currentNote, setCurrentNote] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [feedback, setFeedback] = useState({ show: false, isCorrect: false, text: '' });
  const [timer, setTimer] = useState(0);
  const [quizActive, setQuizActive] = useState(false);

  // Melody
  const [activeMelodyType, setActiveMelodyType] = useState('2/4');
  const [activeMelodyData, setActiveMelodyData] = useState(() => buildMelody(MELODIES.bass['2/4'][0], BASS_NOTES));
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [currentTick, setCurrentTick] = useState(-1);
  
  const audioCtxRef = useRef(null);
  const activeNotesDb = clef === 'bass' ? BASS_NOTES : TREBLE_NOTES;

  const initAudio = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  };

  const playTone = (frequency) => {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = frequency;
    osc.connect(gainNode); gainNode.connect(ctx.destination);
    osc.start(); gainNode.gain.setValueAtTime(1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.stop(ctx.currentTime + 1.5);
  };

  const playClick = (isStrongBeat) => {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle'; osc.frequency.value = isStrongBeat ? 880 : 440; 
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); 
    osc.stop(ctx.currentTime + 0.1);
  };

  const resetQuiz = () => {
    setCorrectCount(0); setTotalCount(0); setTimer(0); setQuizActive(false);
    setFeedback({ show: false, isCorrect: false, text: '' });
    setCurrentNote(activeNotesDb[Math.floor(Math.random() * activeNotesDb.length)]);
  };

  useEffect(() => {
    let interval;
    if (mode === 'quiz' && quizActive) interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [mode, quizActive]);

  useEffect(() => {
    if (mode === 'quiz') resetQuiz();
  }, [mode, clef]); // Resetuj i promeni notu kad se promeni ključ!

  const handleGuess = (guessName) => {
    if (!quizActive) setQuizActive(true);
    setTotalCount(prev => prev + 1);
    
    if (guessName === currentNote.name) {
      setCorrectCount(prev => prev + 1);
      setFeedback({ show: true, isCorrect: true, text: 'Bravo! 🎉' });
      playTone(currentNote.freq);
      setTimeout(() => setCurrentNote(activeNotesDb[Math.floor(Math.random() * activeNotesDb.length)]), 1000);
    } else {
      setFeedback({ show: true, isCorrect: false, text: `To nije ${guessName}.` });
    }
  };

  const changeMelodyBank = (type) => {
    setActiveMelodyType(type); setMetronomeOn(false);
    setActiveMelodyData(buildMelody(MELODIES[clef][type][0], activeNotesDb));
  };

  useEffect(() => {
    // Ako se promeni ključ dok smo u melodijama, resetuj melodiju na novu
    setActiveMelodyData(buildMelody(MELODIES[clef][activeMelodyType][0], activeNotesDb));
    setMetronomeOn(false);
  }, [clef]);

  useEffect(() => {
    let interval;
    if (mode === 'melody' && metronomeOn) {
      setCurrentTick(0); 
      let beat = 1;
      playClick(true);
      interval = setInterval(() => {
        setCurrentTick(prev => prev + 1);
        beat = (beat % (activeMelodyType === '2/4' ? 2 : 3)) + 1;
        playClick(beat === 1);
      }, 1000);
    } else {
      setCurrentTick(-1);
    }
    return () => clearInterval(interval);
  }, [mode, metronomeOn, activeMelodyType]);

  const learnData = buildMelody(LEARN_SCALE_RAW, activeNotesDb);
  const staffWidth = mode === 'quiz' ? '100%' : (mode === 'learn' ? `${learnData.totalWidth}px` : `${activeMelodyData.totalWidth}px`);

  return (
    <div style={{ maxWidth: '700px', margin: '20px auto', padding: '15px', fontFamily: 'sans-serif', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#333', marginTop: 0, marginBottom: '20px' }}>🎵 Solfeđo Master 🎵</h2>
      
      <HeaderButtons clef={clef} setClef={setClef} mode={mode} setMode={setMode} resetQuiz={resetQuiz} />

      {/* Skok / Tajmer Kontrole */}
      {mode === 'quiz' && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '15px 0' }}>
          <div style={{ fontSize: '18px' }}>Skor: <strong style={{ color: '#007BFF' }}>{correctCount}/{totalCount}</strong></div>
          <div style={{ fontSize: '18px' }}>⏱ <strong>{Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}</strong></div>
        </div>
      )}

      {/* Melodija Kontrole */}
      {mode === 'melody' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', margin: '10px 0' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => changeMelodyBank('2/4')} style={{ padding: '8px 15px', backgroundColor: activeMelodyType === '2/4' ? '#333' : '#eee', color: activeMelodyType === '2/4' ? '#fff' : '#333', border: 'none', borderRadius: '5px' }}>2/4 Takt</button>
            <button onClick={() => changeMelodyBank('3/4')} style={{ padding: '8px 15px', backgroundColor: activeMelodyType === '3/4' ? '#333' : '#eee', color: activeMelodyType === '3/4' ? '#fff' : '#333', border: 'none', borderRadius: '5px' }}>3/4 Takt</button>
            <button onClick={() => { setMetronomeOn(false); setActiveMelodyData(buildMelody(MELODIES[clef][activeMelodyType][Math.floor(Math.random() * MELODIES[clef][activeMelodyType].length)], activeNotesDb)); }} style={{ padding: '8px 15px', backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: '5px' }}>🎲 Nova</button>
          </div>
          <button onClick={() => setMetronomeOn(!metronomeOn)} style={{ padding: '10px 25px', backgroundColor: metronomeOn ? '#E53935' : '#4CAF50', color: 'white', border: 'none', borderRadius: '25px', fontWeight: 'bold' }}>
            {metronomeOn ? '⏹ Zaustavi Metronom' : '▶ Pokreni Metronom'}
          </button>
        </div>
      )}

      {/* NOTNI SISTEM */}
      <Staff clef={clef} mode={mode} width={staffWidth}>
        
        {/* Mod Učenje */}
        {mode === 'learn' && learnData.elements.map(el => (
           <Note key={el.id} left={el.left} top={(el.pos * 15) - 8} name={el.name} showLabel={true} ledger={el.ledger} onClick={() => playTone(el.freq)} />
        ))}

        {/* Mod Kviz */}
        {mode === 'quiz' && currentNote && (
          <div style={{ position: 'absolute', left: '50%', top: `${(currentNote.position * 15) - 8}px`, width: '20px', height: '16px', backgroundColor: feedback.isCorrect ? '#4CAF50' : '#111', borderRadius: '50%', transform: 'translateX(-50%) rotate(-15deg)' }}>
            {currentNote.ledger && <div style={{ position: 'absolute', top: '50%', left: '-30%', width: '160%', height: '2px', backgroundColor: '#111' }}></div>}
          </div>
        )}

        {/* Mod Melodije */}
        {mode === 'melody' && (
          <>
            <div style={{ position: 'absolute', left: '10px', top: '30px', fontSize: '30px', fontWeight: 'bold', lineHeight: '30px', color: '#666', display: 'flex', flexDirection: 'column' }}>
              <span>{activeMelodyType === '2/4' ? '2' : '3'}</span><span>4</span>
            </div>
            {activeMelodyData.elements.map(el => {
              if (el.type === 'barline') return <div key={el.id} style={{ position: 'absolute', width: '2px', height: '120px', backgroundColor: '#333', top: 0, left: `${el.left}px` }}></div>;
              if (el.type === 'doublebar') return <React.Fragment key={el.id}><div style={{ position: 'absolute', width: '2px', height: '120px', backgroundColor: '#333', top: 0, left: `${el.left}px` }}></div><div style={{ position: 'absolute', width: '4px', height: '120px', backgroundColor: '#333', top: 0, left: `${el.left + 5}px` }}></div></React.Fragment>;
              
              const showLabel = currentTick > -1 && el.noteIndex < currentTick;
              return <Note key={el.id} left={el.left} top={(el.pos * 15) - 8} name={el.name} showLabel={showLabel} ledger={el.ledger} onClick={() => playTone(el.freq)} />;
            })}
          </>
        )}
      </Staff>

      {/* Tastatura za Kviz */}
      {mode === 'quiz' && (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
          {SOLFEGIO.map((solf) => (
            <button key={solf} onClick={() => handleGuess(solf)} disabled={feedback.isCorrect} style={{ padding: '12px 10px', fontSize: '16px', fontWeight: 'bold', color: 'white', border: 'none', borderRadius: '8px', flex: '1 1 calc(30% - 10px)', minWidth: '70px', backgroundColor: feedback.isCorrect ? '#ccc' : '#007BFF', cursor: feedback.isCorrect ? 'not-allowed' : 'pointer' }}>
              {solf}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

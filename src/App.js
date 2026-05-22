import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// ==========================================
// 1. MUSIC DATA (musicData.js)
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
  { id: 10, name: 'DO', position: 3, freq: 523.25 },
  { id: 11, name: 'SI', position: 4, freq: 493.88 },
  { id: 12, name: 'LA', position: 5, freq: 440.00 },
  { id: 13, name: 'SOL', position: 6, freq: 392.00 },
  { id: 14, name: 'FA', position: 7, freq: 349.23 },
  { id: 15, name: 'MI', position: 8, freq: 329.63 },
  { id: 16, name: 'RE', position: 9, freq: 293.66 },
  { id: 17, name: 'DO', position: 10, freq: 261.63, ledger: true }
];

const SOLFEGIO = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'];

const MELODIES = {
  bass: {
    '2/4': [
      // postojeće 3 melodije
      ['DO', 'MI', '|', 'SOL', 'FA', '|', 'RE', 'FA', '|', 'MI', 'DO', '||'],
      ['DO', 'RE', '|', 'MI', 'FA', '|', 'SOL', 'LA', '|', 'SI', 'SOL', '||'],
      ['MI', 'DO', '|', 'FA', 'RE', '|', 'SOL', 'MI', '|', 'DO', 'DO', '||'],
      // nove (minimum 5 ukupno)
      ['DO', 'SOL', '|', 'MI', 'DO', '|', 'FA', 'RE', '|', 'SOL', 'DO', '||'],
      ['RE', 'MI', '|', 'FA', 'SOL', '|', 'LA', 'FA', '|', 'MI', 'RE', '||'],
      ['DO', 'DO', '|', 'RE', 'RE', '|', 'MI', 'FA', '|', 'SOL', 'DO', '||'],
      ['SI', 'LA', '|', 'SOL', 'FA', '|', 'MI', 'RE', '|', 'DO', 'DO', '||']  // silazna lestvica
    ],
    '3/4': [
      ['DO', 'RE', 'MI', '|', 'FA', 'SOL', 'LA', '|', 'SI', 'LA', 'SOL', '|', 'FA', 'MI', 'RE', '||'],
      ['DO', 'MI', 'SOL', '|', 'SOL', 'FA', 'MI', '|', 'RE', 'FA', 'LA', '|', 'LA', 'SOL', 'FA', '||'],
      ['MI', 'FA', 'SOL', '|', 'DO', 'RE', 'MI', '|', 'FA', 'SOL', 'LA', '|', 'SI', 'SOL', 'DO', '||'],
      // nove
      ['DO', 'SOL', 'DO', '|', 'SI', 'LA', 'SOL', '|', 'FA', 'MI', 'RE', '|', 'DO', 'DO', 'DO', '||'],
      ['RE', 'FA', 'LA', '|', 'SOL', 'MI', 'DO', '|', 'RE', 'FA', 'LA', '|', 'SOL', 'DO', 'DO', '||'],
      ['DO', 'MI', 'SOL', '|', 'LA', 'SOL', 'FA', '|', 'MI', 'RE', 'DO', '|', 'SOL', 'DO', 'DO', '||'],
      ['MI', 'RE', 'DO', '|', 'FA', 'MI', 'RE', '|', 'SOL', 'FA', 'MI', '|', 'LA', 'SOL', 'FA', '||']
    ]
  },
  treble: {
    '2/4': [
      ['DO', 'MI', '|', 'RE', 'FA', '|', 'MI', 'SOL', '|', 'FA', 'MI', '||'],
      ['MI', 'SOL', '|', 'DO', 'DO', '|', 'SI', 'LA', '|', 'SOL', 'MI', '||'],
      // nove (minimum 5)
      ['DO', 'RE', '|', 'MI', 'FA', '|', 'SOL', 'LA', '|', 'SI', 'DO', '||'],  // C-dur lestvica gore
      ['DO', 'SI', '|', 'LA', 'SOL', '|', 'FA', 'MI', '|', 'RE', 'DO', '||'],  // lestvica dole
      ['MI', 'MI', '|', 'FA', 'SOL', '|', 'LA', 'SOL', '|', 'FA', 'MI', '||'],
      ['DO', 'SOL', '|', 'MI', 'DO', '|', 'FA', 'RE', '|', 'SOL', 'DO', '||'],
      ['RE', 'MI', '|', 'FA', 'SOL', '|', 'LA', 'FA', '|', 'MI', 'RE', '||']
    ],
    '3/4': [
      ['DO', 'MI', 'SOL', '|', 'SOL', 'FA', 'MI', '|', 'RE', 'FA', 'LA', '|', 'LA', 'SOL', 'FA', '||'],
      // nove (minimum 5)
      ['DO', 'RE', 'MI', '|', 'FA', 'SOL', 'LA', '|', 'SI', 'DO', 'SI', '|', 'LA', 'SOL', 'DO', '||'],
      ['MI', 'SOL', 'DO', '|', 'SI', 'LA', 'SOL', '|', 'FA', 'MI', 'RE', '|', 'DO', 'DO', 'DO', '||'],
      ['DO', 'FA', 'LA', '|', 'SOL', 'MI', 'DO', '|', 'FA', 'LA', 'DO', '|', 'SOL', 'DO', 'DO', '||'],
      ['RE', 'FA', 'LA', '|', 'SOL', 'MI', 'DO', '|', 'RE', 'FA', 'LA', '|', 'SOL', 'MI', 'DO', '||'],
      ['DO', 'MI', 'RE', '|', 'FA', 'SOL', 'FA', '|', 'MI', 'SOL', 'DO', '|', 'DO', 'DO', 'DO', '||']
    ]
  }
};

const LEARN_SCALE_RAW = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'];

// ==========================================
// 2. AUDIO UTILS (audioUtils.js)
// ==========================================
// Optimizovano da AudioContext instanca živi izvan komponente
let audioCtx = null;

const initAudio = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
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


// ==========================================
// 3. UI KOMPONENTE (components/)
// ==========================================

const HeaderButtons = React.memo(({ clef, setClef, mode, setMode, resetQuiz }) => (
  <div style={{ marginBottom: '20px' }}>
    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
      <button aria-label="Violinski Ključ" onClick={() => { setClef('treble'); resetQuiz(); }} style={{ padding: '8px 15px', fontWeight: 'bold', borderRadius: '20px', border: 'none', backgroundColor: clef === 'treble' ? '#673AB7' : '#e0e0e0', color: clef === 'treble' ? '#fff' : '#333', cursor: 'pointer' }}>
        𝄞 Violinski
      </button>
      <button aria-label="Bas Ključ" onClick={() => { setClef('bass'); resetQuiz(); }} style={{ padding: '8px 15px', fontWeight: 'bold', borderRadius: '20px', border: 'none', backgroundColor: clef === 'bass' ? '#009688' : '#e0e0e0', color: clef === 'bass' ? '#fff' : '#333', cursor: 'pointer' }}>
        𝄢 Bas ključ
      </button>
    </div>
    
    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
      <button aria-label="Mod učenje" onClick={() => setMode('learn')} style={{ padding: '10px 15px', fontWeight: 'bold', borderRadius: '8px', border: 'none', backgroundColor: mode === 'learn' ? '#FF9800' : '#ddd', color: mode === 'learn' ? 'white' : '#333', cursor: 'pointer' }}>📖 Učenje</button>
      <button aria-label="Mod kviz" onClick={() => { setMode('quiz'); resetQuiz(); }} style={{ padding: '10px 15px', fontWeight: 'bold', borderRadius: '8px', border: 'none', backgroundColor: mode === 'quiz' ? '#007BFF' : '#ddd', color: mode === 'quiz' ? 'white' : '#333', cursor: 'pointer' }}>🎯 Kviz</button>
      <button aria-label="Mod melodije" onClick={() => setMode('melody')} style={{ padding: '10px 15px', fontWeight: 'bold', borderRadius: '8px', border: 'none', backgroundColor: mode === 'melody' ? '#4CAF50' : '#ddd', color: mode === 'melody' ? 'white' : '#333', cursor: 'pointer' }}>🎼 Melodije</button>
    </div>
  </div>
));

const Staff = React.memo(({ clef, width, children }) => (
  <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '10px', margin: '20px 0', padding: '40px 0', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)' }}>
    <div style={{ position: 'relative', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: width }}>
      <div style={{ position: 'absolute', left: '10px', top: '-30px', fontSize: '14px', fontWeight: 'bold', color: clef === 'treble' ? '#673AB7' : '#009688', background: '#eee', padding: '2px 8px', borderRadius: '5px' }}>
        {clef === 'treble' ? '𝄞 Violinski Ključ' : '𝄢 Bas Ključ (F)'}
      </div>
      {[...Array(5)].map((_, i) => <div key={i} style={{ width: '100%', height: '2px', backgroundColor: '#333' }}></div>)}
      {children}
    </div>
  </div>
));

const Note = React.memo(({ left, pos, name, showLabel, ledger, onClick }) => {
  // Optimizovano računanje Y pozicije bazirano na stvarnoj visini od 120px podeljenoj na 8 koraka.
  const topPosition = (pos * 15) - 8; 

  return (
    <div onClick={onClick} style={{ position: 'absolute', left: `${left}px`, top: `${topPosition}px`, width: '20px', height: '16px', backgroundColor: '#111', borderRadius: '50%', transform: 'translateX(-50%) rotate(-15deg)', cursor: onClick ? 'pointer' : 'default' }}>
      {ledger && <div style={{ position: 'absolute', top: '50%', left: '-30%', width: '160%', height: '2px', backgroundColor: '#111', transform: 'translateY(-50%)' }}></div>}
      {showLabel && <div style={{ position: 'absolute', top: '22px', left: '50%', transform: 'translateX(-50%) rotate(15deg)', fontSize: '12px', fontWeight: 'bold', color: '#E53935' }}>{name}</div>}
    </div>
  );
});

// ==========================================
// 4. MAIN APP COMPONENT (App.js)
// ==========================================

export default function ClefApp() {
  const [clef, setClef] = useState('bass'); 
  const [mode, setMode] = useState('learn');
  
  // KVIZ STATE
  const [currentNote, setCurrentNote] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [feedback, setFeedback] = useState({ show: false, isCorrect: false, text: '' });
  const [timer, setTimer] = useState(0);
  const [quizActive, setQuizActive] = useState(false);
  
  // MELODIJA STATE
  const [activeMelodyType, setActiveMelodyType] = useState('2/4');
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [currentTick, setCurrentTick] = useState(-1);
  const [melodyIndex, setMelodyIndex] = useState(0); // Za biranje nasumične melodije

  // Refs for Cleanup
  const timeoutRef = useRef(null);

  // Optimizacija baze aktivnih nota pomoću Map objekta za brzu pretragu (Tačka 6)
  const activeNotesDb = useMemo(() => (clef === 'bass' ? BASS_NOTES : TREBLE_NOTES), [clef]);
  const activeNoteMap = useMemo(() => new Map(activeNotesDb.map(n => [n.name, n])), [activeNotesDb]);

  // Izolovana logika za građenje melodija pomoću useMemo (Tačka 1)
  const buildMelodyObj = useCallback((symbols) => {
    let left = 40;
    let noteIndex = 0;
    const elements = [];
    
    symbols.forEach((sym, index) => {
      if (sym === '|') {
        elements.push({ id: index, type: 'barline', left: left - 15 });
      } else if (sym === '||') {
        elements.push({ id: index, type: 'doublebar', left: left });
      } else {
        const noteObj = activeNoteMap.get(sym);
        if (noteObj) {
          elements.push({ id: index, type: 'note', name: sym, pos: noteObj.position, freq: noteObj.freq, left: left, noteIndex: noteIndex, ledger: noteObj.ledger });
          left += 55;
          noteIndex++;
        }
      }
    });
    return { elements, totalWidth: left + 30 };
  }, [activeNoteMap]);

  // Izvedeni podaci koji se računaju samo kada se zavisnosti promene
  const learnData = useMemo(() => buildMelodyObj(LEARN_SCALE_RAW), [buildMelodyObj]);
  const activeMelodyData = useMemo(() => buildMelodyObj(MELODIES[clef][activeMelodyType][melodyIndex] || MELODIES[clef][activeMelodyType][0]), [buildMelodyObj, clef, activeMelodyType, melodyIndex]);

  // Funkcija za izbor note obmotana u useCallback
  const pickRandomNote = useCallback(() => {
    setCurrentNote(activeNotesDb[Math.floor(Math.random() * activeNotesDb.length)]);
    setFeedback({ show: false, isCorrect: false, text: '' });
  }, [activeNotesDb]);

  const resetQuiz = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCorrectCount(0); setTotalCount(0); setTimer(0); setQuizActive(false);
    pickRandomNote();
  }, [pickRandomNote]);

  // Čišćenje tajmera prilikom unmountovanja komponente (Tačka 3)
  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  // Tajmer štoperice
  useEffect(() => {
    let interval;
    if (mode === 'quiz' && quizActive) interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [mode, quizActive]);

  useEffect(() => {
    if (mode === 'quiz') resetQuiz();
  }, [mode, clef, resetQuiz]);

  const handleGuess = useCallback((guessName) => {
    if (!currentNote) return;
    if (!quizActive) setQuizActive(true);
    setTotalCount(prev => prev + 1);
    
    if (guessName === currentNote.name) {
      setCorrectCount(prev => prev + 1);
      setFeedback({ show: true, isCorrect: true, text: 'Bravo! 🎉' });
      playTone(currentNote.freq);
      
      // Cleanup prethodnog timeouta ako korisnik brzo klikće
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => pickRandomNote(), 300);
    } else {
      setFeedback({ show: true, isCorrect: false, text: `To nije ${guessName}. Pokušaj ponovo!` });
    }
  }, [currentNote, quizActive, pickRandomNote]);

  // Metronom efekt - Popravljena logika računanja dobe (Tačka 4)
  useEffect(() => {
    let interval;
    if (mode === 'melody' && metronomeOn) {
      setCurrentTick(0);
      playClick(true); // Inicijalni klik prve dobe

      const beatsPerMeasure = activeMelodyType === '2/4' ? 2 : 3;

      interval = setInterval(() => {
        setCurrentTick(prevTick => {
          const nextTick = prevTick + 1;
          const beat = (nextTick % beatsPerMeasure) + 1;
          playClick(beat === 1);
          return nextTick;
        });
      }, 1000);
    } else {
      setCurrentTick(-1);
    }
    return () => clearInterval(interval);
  }, [mode, metronomeOn, activeMelodyType]);

  const formatTime = (sec) => `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;
  const staffWidth = mode === 'quiz' ? '100%' : (mode === 'learn' ? `${learnData.totalWidth}px` : `${activeMelodyData.totalWidth}px`);

  return (
    <div style={{ maxWidth: '700px', margin: '20px auto', padding: '15px', fontFamily: 'sans-serif', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#333', marginTop: 0, marginBottom: '20px' }}>🎵 Solfeđo Master 🎵</h2>
      
      <HeaderButtons clef={clef} setClef={setClef} mode={mode} setMode={setMode} resetQuiz={resetQuiz} />

      {/* 🎯 KVIZ INTERFEJS */}
      {mode === 'quiz' && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '15px 0' }}>
          <div style={{ fontSize: '18px' }}>Skor: <strong style={{ color: '#007BFF' }}>{correctCount}/{totalCount}</strong></div>
          <div style={{ fontSize: '18px' }}>⏱ <strong>{formatTime(timer)}</strong></div>
        </div>
      )}

      {/* 🎼 MELODIJE INTERFEJS */}
      {mode === 'melody' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', margin: '10px 0' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button aria-label="2/4 takt" onClick={() => { setActiveMelodyType('2/4'); setMetronomeOn(false); setMelodyIndex(0); }} style={{ padding: '8px 15px', backgroundColor: activeMelodyType === '2/4' ? '#333' : '#eee', color: activeMelodyType === '2/4' ? '#fff' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>2/4 Takt</button>
            <button aria-label="3/4 takt" onClick={() => { setActiveMelodyType('3/4'); setMetronomeOn(false); setMelodyIndex(0); }} style={{ padding: '8px 15px', backgroundColor: activeMelodyType === '3/4' ? '#333' : '#eee', color: activeMelodyType === '3/4' ? '#fff' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>3/4 Takt</button>
            <button aria-label="Nova melodija" onClick={() => { setMetronomeOn(false); setMelodyIndex(prev => (prev + 1) % MELODIES[clef][activeMelodyType].length); }} style={{ padding: '8px 15px', backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>🎲 Nova</button>
          </div>
          <button aria-label="Metronom" onClick={() => setMetronomeOn(!metronomeOn)} style={{ padding: '10px 25px', backgroundColor: metronomeOn ? '#E53935' : '#4CAF50', color: 'white', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' }}>
            {metronomeOn ? '⏹ Zaustavi Metronom' : '▶ Pokreni Metronom'}
          </button>
        </div>
      )}

      {/* GLAVNI NOTNI SISTEM */}
      <Staff clef={clef} width={staffWidth}>
        
        {/* Mod 1: Učenje */}
        {mode === 'learn' && learnData.elements.map(el => (
           <Note key={el.id} left={el.left} pos={el.pos} name={el.name} showLabel={true} ledger={el.ledger} onClick={() => playTone(el.freq)} />
        ))}

        {/* Mod 2: Kviz */}
        {mode === 'quiz' && currentNote && (
          <div style={{ position: 'absolute', left: '50%', top: `${(currentNote.position * 15) - 8}px`, width: '20px', height: '16px', backgroundColor: feedback.isCorrect ? '#4CAF50' : '#111', borderRadius: '50%', transform: 'translateX(-50%) rotate(-15deg)', transition: 'top 0.3s ease, background-color 0.3s ease' }}>
            {currentNote.ledger && <div style={{ position: 'absolute', top: '50%', left: '-30%', width: '160%', height: '2px', backgroundColor: '#111', transform: 'translateY(-50%)' }}></div>}
          </div>
        )}

        {/* Mod 3: Melodije sa metronom "shadowing" efektom */}
        {mode === 'melody' && (
          <>
            <div style={{ position: 'absolute', left: '10px', top: '30px', fontSize: '30px', fontWeight: 'bold', lineHeight: '30px', color: '#666', display: 'flex', flexDirection: 'column' }}>
              <span>{activeMelodyType === '2/4' ? '2' : '3'}</span><span>4</span>
            </div>
            {activeMelodyData.elements.map(el => {
              if (el.type === 'barline') return <div key={el.id} style={{ position: 'absolute', width: '2px', height: '120px', backgroundColor: '#333', top: 0, left: `${el.left}px` }}></div>;
              if (el.type === 'doublebar') return <React.Fragment key={el.id}><div style={{ position: 'absolute', width: '2px', height: '120px', backgroundColor: '#333', top: 0, left: `${el.left}px` }}></div><div style={{ position: 'absolute', width: '4px', height: '120px', backgroundColor: '#333', top: 0, left: `${el.left + 5}px` }}></div></React.Fragment>;
              
              const showLabel = currentTick > -1 && el.noteIndex < currentTick;
              return <Note key={el.id} left={el.left} pos={el.pos} name={el.name} showLabel={showLabel} ledger={el.ledger} onClick={() => playTone(el.freq)} />;
            })}
          </>
        )}
      </Staff>

      {/* TASTATURA ZA KVIZ */}
      {mode === 'quiz' && (
        <>
          <div style={{ minHeight: '30px', marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', color: feedback.isCorrect ? '#4CAF50' : '#E53935' }}>
            {feedback.show ? feedback.text : 'Koja je ovo nota? (Tajmer kreće na klik)'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {SOLFEGIO.map((solf) => (
              <button key={solf} aria-label={`Nota ${solf}`} onClick={() => handleGuess(solf)} disabled={feedback.isCorrect} style={{ padding: '12px 10px', fontSize: '16px', fontWeight: 'bold', color: 'white', border: 'none', borderRadius: '8px', flex: '1 1 calc(30% - 10px)', minWidth: '70px', backgroundColor: feedback.isCorrect ? '#ccc' : '#007BFF', cursor: feedback.isCorrect ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                {solf}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

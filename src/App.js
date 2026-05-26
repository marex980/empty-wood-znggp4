import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Vex from 'vexflow';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase'; // Tvoja Firebase konekcija

const VF = Vex.Flow;

// ==========================================
// 1. MUSIC DATA
// ==========================================

const BASS_NOTES = [
  { id: 0, name: 'SI', position: -1, freq: 246.94, vexKey: 'b/3' },
  { id: 1, name: 'LA', position: 0, freq: 220.00, vexKey: 'a/3' },
  { id: 2, name: 'SOL', position: 1, freq: 196.00, vexKey: 'g/3' },
  { id: 3, name: 'FA', position: 2, freq: 174.61, vexKey: 'f/3' },
  { id: 4, name: 'MI', position: 3, freq: 164.81, vexKey: 'e/3' },
  { id: 5, name: 'RE', position: 4, freq: 146.83, vexKey: 'd/3' },
  { id: 6, name: 'DO', position: 5, freq: 130.81, vexKey: 'c/3' }
];

const TREBLE_NOTES = [
  { id: 10, name: 'DO', position: 3, freq: 523.25, vexKey: 'c/5' },
  { id: 11, name: 'SI', position: 4, freq: 493.88, vexKey: 'b/4' },
  { id: 12, name: 'LA', position: 5, freq: 440.00, vexKey: 'a/4' },
  { id: 13, name: 'SOL', position: 6, freq: 392.00, vexKey: 'g/4' },
  { id: 14, name: 'FA', position: 7, freq: 349.23, vexKey: 'f/4' },
  { id: 15, name: 'MI', position: 8, freq: 329.63, vexKey: 'e/4' },
  { id: 16, name: 'RE', position: 9, freq: 293.66, vexKey: 'd/4' },
  { id: 17, name: 'DO', position: 10, freq: 261.63, vexKey: 'c/4', ledger: true }
];

const SOLFEGIO = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'];

const durationMap = {
  'q': 'q',
  'q.': 'q', 
  'e': '8',
  'h': 'h',
  'h.': 'h'
};

const restDurationMap = {
  'q': 'qr',
  'e': '8r',
  'h': 'hr',
};

const MELODIES_RHYTHMIC = {
  bass: {
    '2/4': [
      [
        { type: 'note', name: 'DO', duration: 'q' }, { type: 'note', name: 'MI', duration: 'q' }, { type: 'barline' },
        { type: 'note', name: 'FA', duration: 'q' }, { type: 'rest', duration: 'e' }, { type: 'note', name: 'SOL', duration: 'e' }, { type: 'barline' },
        { type: 'note', name: 'LA', duration: 'q' }, { type: 'note', name: 'SOL', duration: 'q' }, { type: 'barline' },
        { type: 'note', name: 'MI', duration: 'q' }, { type: 'rest', duration: 'q' }, { type: 'barline' },
        { type: 'note', name: 'RE', duration: 'q.' }, { type: 'note', name: 'MI', duration: 'e' }, { type: 'barline' },
        { type: 'note', name: 'RE', duration: 'q.' }, { type: 'note', name: 'DO', duration: 'e' }, { type: 'barline' },
        { type: 'note', name: 'DO', duration: 'e' }, { type: 'note', name: 'SI', duration: 'e' }, { type: 'rest', duration: 'e' }, { type: 'note', name: 'SI', duration: 'e' }, { type: 'barline' },
        { type: 'note', name: 'LA', duration: 'q' }, { type: 'rest', duration: 'q' }, { type: 'doublebar' }
      ]
    ],
    '3/4': [
      [
        { type: 'note', name: 'DO', duration: 'h' }, { type: 'note', name: 'MI', duration: 'q' }, { type: 'barline' },
        { type: 'note', name: 'SOL', duration: 'h' }, { type: 'note', name: 'FA', duration: 'q' }, { type: 'barline' },
        { type: 'note', name: 'MI', duration: 'q' }, { type: 'note', name: 'RE', duration: 'q' }, { type: 'note', name: 'DO', duration: 'q' }, { type: 'barline' },
        { type: 'note', name: 'SI', duration: 'h.' }, { type: 'doublebar' }
      ]
    ]
  },
  treble: {
    '2/4': [
      [
        { type: 'note', name: 'DO', duration: 'q' }, { type: 'note', name: 'MI', duration: 'q' }, { type: 'barline' },
        { type: 'note', name: 'SOL', duration: 'e' }, { type: 'note', name: 'FA', duration: 'e' }, { type: 'note', name: 'MI', duration: 'q' }, { type: 'barline' },
        { type: 'note', name: 'RE', duration: 'q' }, { type: 'note', name: 'FA', duration: 'q' }, { type: 'barline' },
        { type: 'note', name: 'MI', duration: 'h' }, { type: 'doublebar' }
      ]
    ],
    '3/4': [
      [
        { type: 'note', name: 'DO', duration: 'q' }, { type: 'note', name: 'MI', duration: 'q' }, { type: 'note', name: 'SOL', duration: 'q' }, { type: 'barline' },
        { type: 'note', name: 'FA', duration: 'h' }, { type: 'note', name: 'RE', duration: 'q' }, { type: 'barline' },
        { type: 'note', name: 'MI', duration: 'q' }, { type: 'note', name: 'DO', duration: 'q' }, { type: 'note', name: 'SI', duration: 'q' }, { type: 'barline' },
        { type: 'note', name: 'DO', duration: 'h.' }, { type: 'doublebar' }
      ]
    ]
  }
};

const SCALE_RHYTHMIC = [
  { type: 'note', name: 'DO', duration: 'q' }, { type: 'note', name: 'RE', duration: 'q' },
  { type: 'note', name: 'MI', duration: 'q' }, { type: 'note', name: 'FA', duration: 'q' },
  { type: 'note', name: 'SOL', duration: 'q' }, { type: 'note', name: 'LA', duration: 'q' },
  { type: 'note', name: 'SI', duration: 'q' }, { type: 'doublebar' }
];

// ==========================================
// 2. AUDIO UTILS
// ==========================================
let audioCtx = null;
const initAudio = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
};
const playTone = (freq) => {
  if (!freq) return;
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine'; osc.frequency.value = freq;
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(); gain.gain.setValueAtTime(1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
  osc.stop(ctx.currentTime + 1.0);
};
const playClick = (isStrong) => {
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle'; osc.frequency.value = isStrong ? 880 : 440;
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(); gain.gain.setValueAtTime(1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.stop(ctx.currentTime + 0.1);
};

// ==========================================
// 3. VEXFLOW RENDERER
// ==========================================
const VexStaff = React.memo(({ clef, elements, width, highlightIndex }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const renderer = new VF.Renderer(containerRef.current, VF.Renderer.Backends.SVG);
    renderer.resize(width, 170);
    const context = renderer.getContext();

    const stave = new VF.Stave(10, 30, width - 20)
      .addClef(clef === 'bass' ? 'bass' : 'treble')
      .setContext(context)
      .draw();

    const allTickables = [];
    let currentMeasureNotesForBeams = [];
    const allBeams = [];
    let globalIdx = 0;

    elements.forEach(el => {
      if (el.type === 'barline') {
        allTickables.push(new VF.BarNote(VF.Barline.type.SINGLE));
        if (currentMeasureNotesForBeams.length > 0) {
          allBeams.push(...VF.Beam.generateBeams(currentMeasureNotesForBeams));
          currentMeasureNotesForBeams = [];
        }
        return;
      } else if (el.type === 'doublebar') {
        allTickables.push(new VF.BarNote(VF.Barline.type.DOUBLE));
        if (currentMeasureNotesForBeams.length > 0) {
          allBeams.push(...VF.Beam.generateBeams(currentMeasureNotesForBeams));
          currentMeasureNotesForBeams = [];
        }
        return;
      }

      let staveElement;
      if (el.type === 'note') {
        const noteObj = clef === 'bass'
          ? BASS_NOTES.find(n => n.name === el.name)
          : TREBLE_NOTES.find(n => n.name === el.name);
        if (!noteObj) return;

        const vfDuration = durationMap[el.duration] || 'q';
        staveElement = new VF.StaveNote({
          clef: clef === 'bass' ? 'bass' : 'treble',
          keys: [noteObj.vexKey],
          duration: vfDuration
        });

        if (el.duration.includes('.')) staveElement.addModifier(new VF.Dot(), 0);
        
        // NOVO: Podrška za povisilice i snizilice
        if (el.accidental) {
          staveElement.addModifier(new VF.Accidental(el.accidental), 0);
        }

        currentMeasureNotesForBeams.push(staveElement);
      } else if (el.type === 'rest') {
        const vfRest = restDurationMap[el.duration] || 'qr';
        const restPosition = clef === 'bass' ? 'd/3' : 'b/4';
        staveElement = new VF.StaveNote({
          clef: clef === 'bass' ? 'bass' : 'treble',
          keys: [restPosition],
          duration: vfRest
        });
      }

      if (highlightIndex === globalIdx && staveElement) {
        staveElement.setStyle({ fillStyle: '#E53935', strokeStyle: '#E53935' });
      }

      allTickables.push(staveElement);
      globalIdx++;
    });

    if (currentMeasureNotesForBeams.length > 0) {
      allBeams.push(...VF.Beam.generateBeams(currentMeasureNotesForBeams));
    }

    if (allTickables.length === 0) return;

    const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
    voice.setStrict(false); 
    voice.addTickables(allTickables);

    new VF.Formatter().joinVoices([voice]).formatToStave([voice], stave);
    voice.draw(context, stave);
    allBeams.forEach(beam => beam.setContext(context).draw());

  }, [elements, clef, width, highlightIndex]);

  return <div ref={containerRef} />;
});

// ==========================================
// 4. GLAVNA APLIKACIJA
// ==========================================
export default function ClefApp() {
  const [clef, setClef] = useState('bass');
  const [mode, setMode] = useState('learn'); // 'learn', 'quiz', 'melody', 'composer'

  const [currentNote, setCurrentNote] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [feedback, setFeedback] = useState({ show: false, isCorrect: false, text: '' });
  const [timer, setTimer] = useState(0);
  const [quizActive, setQuizActive] = useState(false);

  const [activeMelodyType, setActiveMelodyType] = useState('2/4');
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [currentBeatIdx, setCurrentBeatIdx] = useState(-1);
  const [melodyIndex, setMelodyIndex] = useState(0);

  const [parlatoActive, setParlatoActive] = useState(false);
  const [tapTimes, setTapTimes] = useState([]);
  const [parlatoStart, setParlatoStart] = useState(null);
  const [parlatoResults, setParlatoResults] = useState(null);

  const [bpm, setBpm] = useState(60);
  const [activeLearnNote, setActiveLearnNote] = useState(null);

  // KOMPOZITOR STATE
  const [composerNotes, setComposerNotes] = useState([]);
  const [composerTitle, setComposerTitle] = useState('Moja prva kompozicija');
  const [composerDuration, setComposerDuration] = useState('q'); // Trenutno izabrano trajanje
  const [composerAccidental, setComposerAccidental] = useState(''); // '' | '#' | 'b' | 'n'
  const [isSaving, setIsSaving] = useState(false);

  const timeoutRef = useRef(null);
  const learnTimeoutRef = useRef(null);

  const activeNotesDb = useMemo(() => clef === 'bass' ? BASS_NOTES : TREBLE_NOTES, [clef]);
  const noteMap = useMemo(() => new Map(activeNotesDb.map(n => [n.name, n])), [activeNotesDb]);

  const currentMelody = useMemo(() => {
    if (mode === 'composer') return composerNotes;
    const list = MELODIES_RHYTHMIC[clef]?.[activeMelodyType];
    return list && list.length > 0 ? list[melodyIndex % list.length] : SCALE_RHYTHMIC;
  }, [clef, activeMelodyType, melodyIndex, mode, composerNotes]);

  const learningNotes = useMemo(() => {
    return SCALE_RHYTHMIC.filter(el => el.type === 'note').map(el => ({ name: el.name, freq: noteMap.get(el.name)?.freq }));
  }, [noteMap]);

  const beatDurationMs = 60000 / bpm;

  const timePoints = useMemo(() => {
    const points = [];
    let currentTime = 0;
    let noteIndex = 0;

    currentMelody.forEach((el) => {
      if (el.type === 'barline' || el.type === 'doublebar') return;
      
      const durStr = el.duration || 'q';
      let relativeDur = 1;
      if (durStr.startsWith('h')) relativeDur = 2;
      else if (durStr.startsWith('q')) relativeDur = 1;
      else if (durStr.startsWith('e')) relativeDur = 0.5;
      if (durStr.includes('.')) relativeDur *= 1.5;
      
      points.push({
        idx: noteIndex,
        start: currentTime,
        end: currentTime + relativeDur * beatDurationMs,
        isRest: el.type === 'rest',
        freq: el.type === 'note' ? (noteMap.get(el.name)?.freq || null) : null
      });
      
      currentTime += relativeDur * beatDurationMs;
      noteIndex++;
    });
    
    return { points, totalTime: currentTime };
  }, [currentMelody, beatDurationMs, noteMap]);

  useEffect(() => {
    if (!(mode === 'melody' && metronomeOn) && !(mode === 'composer' && metronomeOn)) {
      setCurrentBeatIdx(-1);
      return;
    }
    const points = timePoints.points;
    if (points.length === 0) return;

    setCurrentBeatIdx(0);
    const startTime = performance.now();
    let lastBeatNumber = -1;

    const interval = setInterval(() => {
      const now = performance.now() - startTime;
      if (now > timePoints.totalTime + 500) {
        setMetronomeOn(false);
        return;
      }

      const active = points.find(p => now >= p.start && now < p.end);
      if (active) {
        setCurrentBeatIdx(prev => {
          if (prev !== active.idx) {
            if (active.freq) playTone(active.freq);
            return active.idx;
          }
          return prev;
        });
      } else {
        setCurrentBeatIdx(-1);
      }

      const currentBeat = Math.floor(now / beatDurationMs);
      if (currentBeat !== lastBeatNumber) {
        lastBeatNumber = currentBeat;
        const isStrong = currentBeat % 4 === 0;
        playClick(isStrong);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [mode, metronomeOn, timePoints, beatDurationMs]);

  // Čišćenje prilikom prelaska na druge modove
  useEffect(() => {
    setParlatoResults(null);
    setParlatoActive(false);
    setMetronomeOn(false);
    setTapTimes([]);
  }, [mode, clef, activeMelodyType, melodyIndex]);

  useEffect(() => {
    let interval;
    if (parlatoActive && parlatoStart) {
      interval = setInterval(() => {
        const elapsed = performance.now() - parlatoStart;
        if (elapsed >= timePoints.totalTime + 500) {
          calculateParlatoScore();
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [parlatoActive, parlatoStart, timePoints.totalTime]);

  useEffect(() => {
    const handler = (e) => {
      if (!parlatoActive || e.key !== ' ') return;
      e.preventDefault();
      if (!parlatoStart) {
        setParlatoStart(performance.now());
        setTapTimes([0]);
        playClick(true);
      } else {
        const tap = performance.now() - parlatoStart;
        setTapTimes(prev => [...prev, tap]);
        playClick(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [parlatoActive, parlatoStart]);

  const calculateParlatoScore = useCallback(() => {
    if (tapTimes.length === 0) return;
    const expectedTaps = timePoints.points.filter(p => !p.isRest).map(p => p.start);
    let correct = 0, early = 0, late = 0, missed = 0;
    let usedTaps = new Array(tapTimes.length).fill(false);

    expectedTaps.forEach(expected => {
      let bestIdx = -1, bestDiff = Infinity;
      tapTimes.forEach((t, i) => {
        if (usedTaps[i]) return;
        const diff = Math.abs(t - expected);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestIdx = i;
        }
      });
      if (bestIdx === -1) { missed++; return; }
      const diff = tapTimes[bestIdx] - expected;
      if (Math.abs(diff) <= 150) { correct++; usedTaps[bestIdx] = true; }
      else if (diff < -150) { early++; usedTaps[bestIdx] = true; }
      else if (diff > 150) { late++; usedTaps[bestIdx] = true; }
      else { missed++; }
    });

    const scorePercentage = Math.round((correct / expectedTaps.length) * 100);
    setParlatoResults({ scorePercentage, correct, early, late, missed, total: expectedTaps.length });
    setParlatoActive(false);
    setParlatoStart(null);
  }, [tapTimes, timePoints]);

  const toggleParlato = () => {
    if (parlatoActive) {
      calculateParlatoScore();
    } else {
      setParlatoActive(true);
      setTapTimes([]);
      setParlatoStart(null);
      setParlatoResults(null);
    }
  };

  const handleLearnClick = (note) => {
    playTone(note.freq);
    setActiveLearnNote(note.name);
    if (learnTimeoutRef.current) clearTimeout(learnTimeoutRef.current);
    learnTimeoutRef.current = setTimeout(() => setActiveLearnNote(null), 400);
  };

  const resetQuiz = useCallback(() => {
    setCorrectCount(0);
    setTotalCount(0);
    setTimer(0);
    setQuizActive(false);
    const randomNote = activeNotesDb[Math.floor(Math.random() * activeNotesDb.length)];
    setCurrentNote(randomNote);
    setFeedback({ show: false, isCorrect: false, text: '' });
  }, [activeNotesDb]);

  useEffect(() => {
    if (mode === 'quiz') resetQuiz();
  }, [mode, resetQuiz]);

  useEffect(() => {
    let interval;
    if (mode === 'quiz' && quizActive) interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [mode, quizActive]);

  const handleGuess = (name) => {
    if (!currentNote || feedback.isCorrect) return;
    if (!quizActive) setQuizActive(true);
    setTotalCount(p => p + 1);
    if (name === currentNote.name) {
      setCorrectCount(p => p + 1);
      setFeedback({ show: true, isCorrect: true, text: 'Bravo! 🎉' });
      playTone(currentNote.freq);
      timeoutRef.current = setTimeout(() => {
        const next = activeNotesDb[Math.floor(Math.random() * activeNotesDb.length)];
        setCurrentNote(next);
        setFeedback({ show: false, isCorrect: false, text: '' });
      }, 800);
    } else {
      setFeedback({ show: true, isCorrect: false, text: `To nije ${name}. Pokušaj ponovo!` });
    }
  };

  // Funkcije Kompozitora
  const addComposerNote = (noteName) => {
    const noteObj = noteMap.get(noteName);
    if (noteObj) playTone(noteObj.freq);
    setComposerNotes(prev => [...prev, { type: 'note', name: noteName, duration: composerDuration, accidental: composerAccidental }]);
  };

  const addComposerRest = () => {
    setComposerNotes(prev => [...prev, { type: 'rest', duration: composerDuration }]);
  };

  const addComposerBarline = () => {
    setComposerNotes(prev => [...prev, { type: 'barline' }]);
  };

  const removeLastComposerElement = () => {
    setComposerNotes(prev => prev.slice(0, -1));
  };

  // Slanje u Firebase
  const saveMelodyToFirebase = async () => {
    if (composerNotes.length === 0) {
      alert("Melodija je prazna!");
      return;
    }
    setIsSaving(true);
    try {
      await addDoc(collection(db, "melodies"), {
        title: composerTitle,
        clef: clef,
        notes: composerNotes,
        createdAt: new Date().toISOString()
      });
      alert("Melodija je uspešno sačuvana u oblaku! ☁️");
      setComposerNotes([]);
      setComposerTitle('Moja nova kompozicija');
    } catch (e) {
      console.error("Greška pri čuvanju:", e);
      alert("Greška pri čuvanju! Proveri internet konekciju i Firebase podešavanja.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const btnStyle = (isActive) => ({
    padding: '8px 12px', fontWeight: 'bold', borderRadius: '5px', border: 'none', cursor: 'pointer',
    backgroundColor: isActive ? '#007BFF' : '#ddd', color: isActive ? '#fff' : '#333'
  });

  return (
    <div style={{ maxWidth: '750px', margin: '20px auto', padding: '15px', fontFamily: 'sans-serif', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
      <h2>🎵 Solfeđo Master 🎵</h2>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
          <button onClick={() => setClef('treble')} style={{ padding: '8px 15px', fontWeight: 'bold', borderRadius: '20px', border: 'none', backgroundColor: clef === 'treble' ? '#673AB7' : '#e0e0e0', color: clef === 'treble' ? '#fff' : '#333', cursor: 'pointer' }}>𝄞 Violinski</button>
          <button onClick={() => setClef('bass')} style={{ padding: '8px 15px', fontWeight: 'bold', borderRadius: '20px', border: 'none', backgroundColor: clef === 'bass' ? '#009688' : '#e0e0e0', color: clef === 'bass' ? '#fff' : '#333', cursor: 'pointer' }}>𝄢 Bas ključ</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setMode('learn')} style={btnStyle(mode === 'learn')}>📖 Učenje</button>
          <button onClick={() => { setMode('quiz'); setQuizActive(false); }} style={btnStyle(mode === 'quiz')}>🎯 Kviz</button>
          <button onClick={() => setMode('melody')} style={btnStyle(mode === 'melody')}>🎼 Melodije</button>
          <button onClick={() => setMode('composer')} style={{ ...btnStyle(mode === 'composer'), backgroundColor: mode === 'composer' ? '#E91E63' : '#ddd' }}>✍️ Kompozitor</button>
        </div>
      </div>

      {mode === 'quiz' && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '15px 0' }}>
          <div style={{ fontSize: '18px' }}>Skor: <strong style={{ color: '#007BFF' }}>{correctCount}/{totalCount}</strong></div>
          <div style={{ fontSize: '18px' }}>⏱ <strong>{formatTime(timer)}</strong></div>
        </div>
      )}

      {mode === 'melody' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', margin: '10px 0' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => { setActiveMelodyType('2/4'); setMetronomeOn(false); setMelodyIndex(0); }} style={btnStyle(activeMelodyType === '2/4')}>2/4 Takt</button>
            <button onClick={() => { setActiveMelodyType('3/4'); setMetronomeOn(false); setMelodyIndex(0); }} style={btnStyle(activeMelodyType === '3/4')}>3/4 Takt</button>
            <button onClick={() => { setMetronomeOn(false); setMelodyIndex(prev => prev + 1); }} style={{ padding: '8px 15px', backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🎲 Nova melodija</button>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ fontWeight: 'bold' }}>BPM: {bpm}</label>
            <input type="range" min="40" max="120" value={bpm} onChange={e => setBpm(Number(e.target.value))} />
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => setMetronomeOn(!metronomeOn)} style={{ padding: '10px 25px', backgroundColor: metronomeOn ? '#E53935' : '#4CAF50', color: 'white', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' }}>
              {metronomeOn ? '⏹ Zaustavi Metronom' : '▶ Slušaj Ritam'}
            </button>
            <button onClick={toggleParlato} style={{ padding: '10px 25px', backgroundColor: parlatoActive ? '#FF9800' : '#9E9E9E', color: 'white', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' }}>
              🖐️ Parlato Trener {parlatoActive ? '(Završi)' : ''}
            </button>
          </div>
        </div>
      )}

      {/* NOVI INTERFEJS ZA KOMPOZITORA */}
      {mode === 'composer' && (
        <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px', border: '2px solid #E91E63', marginBottom: '15px' }}>
          <input type="text" value={composerTitle} onChange={e => setComposerTitle(e.target.value)} style={{ width: '80%', padding: '10px', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ccc' }} placeholder="Unesi naziv kompozicije..." />
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'bold', alignSelf: 'center' }}>Trajanje:</span>
            <button onClick={() => setComposerDuration('h')} style={btnStyle(composerDuration === 'h')}>Polovina (h)</button>
            <button onClick={() => setComposerDuration('h.')} style={btnStyle(composerDuration === 'h.')}>Punkt. polovina (h.)</button>
            <button onClick={() => setComposerDuration('q')} style={btnStyle(composerDuration === 'q')}>Četvrtina (q)</button>
            <button onClick={() => setComposerDuration('q.')} style={btnStyle(composerDuration === 'q.')}>Punkt. četvr. (q.)</button>
            <button onClick={() => setComposerDuration('e')} style={btnStyle(composerDuration === 'e')}>Osmina (e)</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'bold', alignSelf: 'center' }}>Predznak:</span>
            <button onClick={() => setComposerAccidental('')} style={btnStyle(composerAccidental === '')}>Bez predznaka</button>
            <button onClick={() => setComposerAccidental('#')} style={btnStyle(composerAccidental === '#')}>♯ Povisilica</button>
            <button onClick={() => setComposerAccidental('b')} style={btnStyle(composerAccidental === 'b')}>♭ Snizilica</button>
            <button onClick={() => setComposerAccidental('n')} style={btnStyle(composerAccidental === 'n')}>♮ Razrešnica</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', flexWrap: 'wrap', marginBottom: '15px' }}>
            {SOLFEGIO.map(solf => (
              <button key={solf} onClick={() => addComposerNote(solf)} style={{ padding: '10px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#007BFF', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>{solf}</button>
            ))}
            <button onClick={addComposerRest} style={{ padding: '10px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#607D8B', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>𝄽 Pauza</button>
            <button onClick={addComposerBarline} style={{ padding: '10px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>| Takt</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button onClick={removeLastComposerElement} disabled={composerNotes.length === 0} style={{ padding: '10px 15px', fontWeight: 'bold', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>⏪ Obriši poslednje</button>
            <button onClick={saveMelodyToFirebase} disabled={isSaving || composerNotes.length === 0} style={{ padding: '10px 15px', fontWeight: 'bold', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>{isSaving ? '⏳ Snimanje...' : '☁️ Snimi melodiju'}</button>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '10px', margin: '20px 0', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)' }}>
        {mode === 'learn' && <VexStaff clef={clef} elements={SCALE_RHYTHMIC} width={700} highlightIndex={-1} />}
        {mode === 'quiz' && currentNote && (
          <VexStaff clef={clef} elements={[{ type: 'note', name: currentNote.name, duration: 'q' }]} width={150} highlightIndex={-1} />
        )}
        {(mode === 'melody' || mode === 'composer') && (
          <VexStaff clef={clef} elements={currentMelody} width={700} highlightIndex={metronomeOn ? currentBeatIdx : -1} />
        )}
      </div>

      {mode === 'learn' && (
        <div style={{ marginTop: '15px' }}>
          <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Klikni na ime note da čuješ ton:</p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
            {learningNotes.map(note => (
              <button
                key={note.name}
                onClick={() => handleLearnClick(note)}
                style={{
                  padding: '12px 20px', fontSize: '18px', fontWeight: 'bold', color: '#fff',
                  backgroundColor: activeLearnNote === note.name ? '#E53935' : '#FF9800',
                  border: 'none', borderRadius: '10px', cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'background-color 0.2s ease'
                }}
              >
                {note.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'quiz' && (
        <>
          <div style={{ minHeight: '30px', marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', color: feedback.isCorrect ? '#4CAF50' : '#E53935' }}>
            {feedback.show ? feedback.text : 'Koja je ovo nota? (Klikni dugme)'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {SOLFEGIO.map(solf => (
              <button key={solf} onClick={() => handleGuess(solf)} disabled={feedback.isCorrect}
                style={{ padding: '12px 10px', fontSize: '16px', fontWeight: 'bold', color: 'white', border: 'none', borderRadius: '8px', flex: '1 1 calc(30% - 10px)', minWidth: '70px', backgroundColor: feedback.isCorrect ? '#ccc' : '#007BFF', cursor: feedback.isCorrect ? 'not-allowed' : 'pointer' }}>
                {solf}
              </button>
            ))}
          </div>
        </>
      )}

      {parlatoActive && (
        <div style={{ marginTop: '10px', padding: '15px', backgroundColor: '#FFF3E0', borderRadius: '8px', border: '2px dashed #FF9800' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '18px' }}><strong>🔴 Snimanje u toku!</strong></p>
          <p style={{ margin: 0 }}>Tapši <strong>Space (razmaknicu)</strong> u ritmu nota. Snimanje će se automatski zaustaviti.</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>Udaraca: {tapTimes.length}</p>
        </div>
      )}

      {!parlatoActive && parlatoResults && (
        <div style={{ marginTop: '10px', padding: '15px', backgroundColor: '#E8F5E9', borderRadius: '8px', border: '2px solid #4CAF50' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2E7D32' }}>Tvoja ocena: {parlatoResults.scorePercentage}%</h3>
          <p style={{ margin: '5px 0' }}>✅ Savršeno na vreme: <strong>{parlatoResults.correct}</strong></p>
          <p style={{ margin: '5px 0' }}>🐇 Požurila si na: <strong>{parlatoResults.early}</strong> nota</p>
          <p style={{ margin: '5px 0' }}>🐢 Zakasnila si na: <strong>{parlatoResults.late}</strong> nota</p>
          <p style={{ margin: '5px 0', color: '#D32F2F' }}>❌ Promašeno: <strong>{parlatoResults.missed}</strong> nota</p>
        </div>
      )}
    </div>
  );
}

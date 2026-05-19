import React, { useState, useEffect, useRef } from "react";

// Dodate su tačne frekvencije (u Hercima) za svaku notu u bas ključu (od velike oktave do male oktave)
const NOTES = [
  { id: 1, name: "LA", position: 0, freq: 220.0 }, // 5. linija
  { id: 2, name: "SOL", position: 1, freq: 196.0 }, // 4. praznina
  { id: 3, name: "FA", position: 2, freq: 174.61 }, // 4. linija (Orijentir)
  { id: 4, name: "MI", position: 3, freq: 164.81 }, // 3. praznina
  { id: 5, name: "RE", position: 4, freq: 146.83 }, // 3. linija
  { id: 6, name: "DO", position: 5, freq: 130.81 }, // 2. praznina (Orijentir)
  { id: 7, name: "SI", position: 6, freq: 123.47 }, // 2. linija
  { id: 8, name: "LA", position: 7, freq: 110.0 }, // 1. praznina
  { id: 9, name: "SOL", position: 8, freq: 98.0 }, // 1. linija
];

const SOLFEGIO = ["DO", "RE", "MI", "FA", "SOL", "LA", "SI"];

export default function BasKljucKviz() {
  const [mode, setMode] = useState("learn"); // 'learn' ili 'quiz'
  const [currentNote, setCurrentNote] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState({
    show: false,
    isCorrect: false,
    text: "",
  });

  const audioCtxRef = useRef(null);

  // Funkcija za generisanje zvuka pomoću Web Audio API
  const playTone = (frequency) => {
    // Inicijalizacija Audio Konteksta (mora na klik zbog sigurnosnih pravila browsera)
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "sine"; // Čist, blag ton
    oscillator.frequency.value = frequency;

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    // Brzo utišavanje zvuka da ne bi bilo pucketanja, traje 1.5 sekundi
    gainNode.gain.setValueAtTime(1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    oscillator.stop(ctx.currentTime + 1.5);
  };

  const pickRandomNote = () => {
    const randomIndex = Math.floor(Math.random() * NOTES.length);
    setCurrentNote(NOTES[randomIndex]);
    setFeedback({ show: false, isCorrect: false, text: "" });
  };

  useEffect(() => {
    if (mode === "quiz") {
      pickRandomNote();
    }
  }, [mode]);

  const handleGuess = (guessName) => {
    if (guessName === currentNote.name) {
      setFeedback({ show: true, isCorrect: true, text: "Bravo! 🎉" });
      setScore((prev) => prev + 1);
      playTone(currentNote.freq); // Sviraj ton kada pogodi!
      setTimeout(() => pickRandomNote(), 1200);
    } else {
      setFeedback({
        show: true,
        isCorrect: false,
        text: `Ups! To nije ${guessName}.`,
      });
    }
  };

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "sans-serif",
        textAlign: "center",
        backgroundColor: "#f9f9f9",
        borderRadius: "15px",
        boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ color: "#333", marginBottom: "20px" }}>
        🎵 Interaktivni Bas Ključ 🎵
      </h2>

      {/* Dugmići za promenu moda */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => setMode("learn")}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            backgroundColor: mode === "learn" ? "#FF9800" : "#ddd",
            color: mode === "learn" ? "white" : "#333",
            border: "none",
            borderRadius: "8px",
          }}
        >
          📖 Mod za učenje
        </button>
        <button
          onClick={() => {
            setMode("quiz");
            setScore(0);
          }}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            backgroundColor: mode === "quiz" ? "#007BFF" : "#ddd",
            color: mode === "quiz" ? "white" : "#333",
            border: "none",
            borderRadius: "8px",
          }}
        >
          🎯 Mod za kviz
        </button>
      </div>

      {mode === "quiz" && (
        <p style={{ fontSize: "18px" }}>
          Poeni:{" "}
          <strong style={{ color: "#007BFF", fontSize: "24px" }}>
            {score}
          </strong>
        </p>
      )}

      {/* Notni sistem */}
      <div
        style={{
          position: "relative",
          height: "220px",
          width: "100%",
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: "10px",
          margin: "30px 0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "50px 0",
          boxSizing: "border-box",
        }}
      >
        {/* Generisanje 5 linija */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{ width: "100%", height: "2px", backgroundColor: "#333" }}
          ></div>
        ))}

        {/* Simbol Bas ključa */}
        <div
          style={{
            position: "absolute",
            left: "10px",
            top: "35px",
            fontSize: "100px",
            fontFamily: "serif",
            lineHeight: 1,
            color: "#333",
          }}
        >
          𝄢
        </div>

        {/* MOD ZA UČENJE: Prikazivanje svih nota */}
        {mode === "learn" &&
          NOTES.map((note, index) => {
            // Raspoređujemo ih ravnomerno sa desne strane ključa (od 15% do 90% širine)
            const leftPosition = 15 + index * 9.5;
            return (
              <div
                key={note.id}
                onClick={() => playTone(note.freq)}
                style={{
                  position: "absolute",
                  left: `${leftPosition}%`,
                  top: `${50 + note.position * 15 - 10}px`,
                  width: "24px",
                  height: "20px",
                  backgroundColor: "#111",
                  borderRadius: "50%",
                  transform: "translateX(-50%) rotate(-15deg)",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
                title="Klikni da čuješ ton"
                onMouseOver={(e) =>
                  (e.currentTarget.style.transform =
                    "translateX(-50%) rotate(-15deg) scale(1.3)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.transform =
                    "translateX(-50%) rotate(-15deg) scale(1)")
                }
              >
                <div
                  style={{
                    position: "absolute",
                    top: "25px",
                    left: "50%",
                    transform: "translateX(-50%) rotate(15deg)",
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#FF9800",
                  }}
                >
                  {note.name}
                </div>
              </div>
            );
          })}

        {/* MOD ZA KVIZ: Prikazivanje samo jedne nasumične note */}
        {mode === "quiz" && currentNote && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: `${50 + currentNote.position * 15 - 10}px`,
              width: "24px",
              height: "20px",
              backgroundColor: feedback.isCorrect ? "#4CAF50" : "#111",
              borderRadius: "50%",
              transform: "translateX(-50%) rotate(-15deg)",
              transition: "top 0.3s ease, background-color 0.3s ease",
            }}
          ></div>
        )}
      </div>

      {/* Prikaz ispod notnog sistema na osnovu moda */}
      {mode === "learn" ? (
        <p style={{ fontSize: "18px", color: "#666" }}>
          Klikni na bilo koju notu da je čuješ. Obrati pažnju na zvezdice
          (orijentire)!
        </p>
      ) : (
        <>
          <div
            style={{
              minHeight: "30px",
              marginBottom: "25px",
              fontSize: "18px",
              fontWeight: "bold",
              color: feedback.isCorrect ? "#4CAF50" : "#E53935",
            }}
          >
            {feedback.show ? feedback.text : "Koja je ovo nota?"}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {SOLFEGIO.map((solf) => (
              <button
                key={solf}
                onClick={() => handleGuess(solf)}
                disabled={feedback.isCorrect}
                style={{
                  padding: "15px 25px",
                  fontSize: "20px",
                  fontWeight: "bold",
                  cursor: feedback.isCorrect ? "not-allowed" : "pointer",
                  backgroundColor: feedback.isCorrect ? "#ccc" : "#007BFF",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
              >
                {solf}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

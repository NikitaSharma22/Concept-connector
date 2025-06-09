import React, { useState, useCallback, useEffect } from 'react';
import { LucideSparkles } from 'lucide-react';

// --- SOLUTION ---
// The `allSuggestions` array has been moved outside the component.
// It is now a true constant and is not recreated on every render.
const allSuggestions = [
  { title: "The Science of Sleep", concepts: ["Circadian Rhythm", "REM Sleep", "Melatonin"] },
  { title: "Basics of Economics", concepts: ["Supply and Demand", "Inflation", "Interest Rates"] },
  { title: "The Roman Empire", concepts: ["Julius Caesar", "Augustus", "The Colosseum"] },
  { title: "AI & Machine Learning", concepts: ["Neural Networks", "Large Language Models", "Supervised Learning"] },
  { title: "Space Exploration", concepts: ["James Webb Telescope", "Black Holes", "Mars Rover"] },
  { title: "Existentialism", concepts: ["Jean-Paul Sartre", "Absurdism", "Free Will"] },
  { title: "Greek Philosophy", concepts: ["Socrates", "Plato", "Aristotle"] },
  { title: "Quantum Physics", concepts: ["Quantum Entanglement", "Superposition", "Schrödinger's Cat"] },
  { title: "Musical Theory", concepts: ["Chords", "Scales", "Harmony"] },
  { title: "World War I", concepts: ["Archduke Ferdinand", "Trench Warfare", "Treaty of Versailles"] },
  { title: "Climate Change", concepts: ["Greenhouse Effect", "Fossil Fuels", "Renewable Energy"] },
];

const SuggestionCarousel = ({ onSuggestionClick }) => {
    const [shuffledList, setShuffledList] = useState([]);

    // This useCallback now correctly has no dependencies because `allSuggestions`
    // is a stable constant defined outside the component's scope.
    const shuffleSuggestions = useCallback(() => {
        setShuffledList([...allSuggestions].sort(() => 0.5 - Math.random()));
    }, []);

    useEffect(() => {
        shuffleSuggestions();
    }, [shuffleSuggestions]);

    return (
        <div className="text-center py-6">
            <h3 className="text-lg font-semibold text-slate-600 flex items-center justify-center gap-2 mb-4">
                <LucideSparkles className="text-amber-500"/> Or, discover a new topic:
            </h3>
            <div className="w-full overflow-hidden relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'}}>
                <div className="flex w-max hover:[animation-play-state:paused] animate-scroll">
                    {[...shuffledList, ...shuffledList].map((s, index) => (
                        <button key={`${s.title}-${index}`} onClick={() => onSuggestionClick(s.concepts)} className="mx-3 px-5 py-2.5 bg-white border border-slate-200 rounded-full text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all whitespace-nowrap">
                            {s.title}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SuggestionCarousel;
import React, { useState, useCallback } from 'react';
import { LucideBrainCircuit, LucideRefreshCcw, LucidePlus, LucideTrash2, LucideLoader } from 'lucide-react';
import SuggestionCarousel from './SuggestionsCarousel';
import ConceptMap from './ConceptMap';

const App = () => {
    // Start with 3 empty inputs for a cleaner initial look
    const [concepts, setConcepts] = useState(['', '', '']);
    const [explanation, setExplanation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const placeholders = ["e.g., Photosynthesis", "e.g., Cellular Respiration", "e.g., ATP", "e.g., Mitochondria", "e.g., Chloroplast"];

    const handleSuggestionClick = (suggestedConcepts) => {
        // We ensure a max of 5 concepts, even from suggestions
        const filledConcepts = [...suggestedConcepts];
        while (filledConcepts.length < 3) filledConcepts.push('');
        setConcepts(filledConcepts.slice(0, 5));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleConceptChange = (index, value) => {
        const newConcepts = [...concepts];
        newConcepts[index] = value;
        setConcepts(newConcepts);
    };

    const addConcept = () => {
        // Strict limit to 5 concepts
        if (concepts.length < 5) {
            setConcepts([...concepts, '']);
        }
    };

    const removeConcept = (index) => {
        const newConcepts = concepts.filter((_, i) => i !== index);
        setConcepts(newConcepts);
    };

    const isFormValid = concepts.filter(c => c.trim() !== '').length >= 2;

    const fetchExplanation = useCallback(async () => {
        if (!isFormValid) return;
        setIsLoading(true);
        setError(null);
        setExplanation(null);
        
        const validConcepts = concepts.filter(c => c.trim() !== '');

        try {
            // This now calls your secure Netlify Function endpoint
            const response = await fetch('/.netlify/functions/getExplanation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ concepts: validConcepts }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Request failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            
            const rawText = result.candidates[0].content.parts[0].text;
            const jsonStringMatch = rawText.match(/\{[\s\S]*\}/);

            if (!jsonStringMatch) {
                throw new Error("Could not find a valid JSON object in the AI's response.");
            }
            
            const parsedJson = JSON.parse(jsonStringMatch[0]);
            setExplanation(parsedJson);

        } catch (e) {
            setError(`Sorry, something went wrong. ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [concepts, isFormValid]);

    const handleSubmit = (e) => {
        e.preventDefault();
        fetchExplanation();
    };

    const handleRefresh = () => {
        setExplanation(null);
        setError(null);
        setConcepts(['', '', '']);
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans text-slate-800 antialiased">
            <div className="container mx-auto p-4 md:p-8">
                <header className="text-center mb-10">
                    <h1 className="text-5xl font-bold text-slate-900 flex items-center justify-center gap-3">
                        <LucideBrainCircuit className="text-blue-600" size={48} /> Concept Connector
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">The intelligent way to visualize connections.</p>
                </header>
                <main className="max-w-7xl mx-auto">
                    {!explanation && !isLoading && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <label className="block text-lg font-semibold text-slate-700">Enter items to connect:</label>
                                        {concepts.map((concept, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={concept}
                                                    onChange={(e) => handleConceptChange(index, e.target.value)}
                                                    placeholder={placeholders[index] || `Concept ${index + 1}`}
                                                    className="flex-grow w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                                />
                                                {concepts.length > 2 && (
                                                    <button type="button" onClick={() => removeConcept(index)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                                        <LucideTrash2 size={20} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {/* Updated condition to strictly enforce 5 concepts max */}
                                    {concepts.length < 5 && (
                                        <button type="button" onClick={addConcept} className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
                                            <LucidePlus size={16} /> Add Item
                                        </button>
                                    )}
                                    <div className="mt-6 text-center">
                                        <button type="submit" disabled={!isFormValid || isLoading} className="w-full sm:w-auto px-10 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105">
                                            Generate
                                        </button>
                                    </div>
                                </form>
                            </div>
                            <SuggestionCarousel onSuggestionClick={handleSuggestionClick} />
                        </div>
                    )}
                    {isLoading && (
                        <div className="text-center p-10">
                            <LucideLoader className="mx-auto animate-spin text-blue-500" size={64} />
                            <p className="mt-4 text-lg text-slate-600">Connecting the dots...</p>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md" role="alert">
                            <p className="font-bold">An error occurred.</p>
                            <p>{error}</p>
                            <button onClick={handleRefresh} className="mt-4 flex items-center gap-2 text-red-700 hover:text-red-900 font-medium">
                                <LucideRefreshCcw size={16} /> Try Again
                            </button>
                        </div>
                    )}
                    {explanation && !isLoading && (
                        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-slate-200">
                            <ConceptMap data={explanation} />
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 pt-6 border-t border-slate-200">
                                <button onClick={handleRefresh} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
                                    <LucideRefreshCcw size={16} /> New Map
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;

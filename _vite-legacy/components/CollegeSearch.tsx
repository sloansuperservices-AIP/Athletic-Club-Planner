import React, { useState, useCallback } from 'react';
import Card from './shared/Card';
import { GoogleGenAI } from "@google/genai";

interface SearchResult {
    title: string;
    uri: string;
}

const CollegeSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults([]);
    setSummary('');

    try {
        if (!process.env.API_KEY) {
            throw new Error("API key for Gemini not found. Please set the process.env.API_KEY environment variable.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Summarize top NCAA Division 1 volleyball colleges for a strong Outside Hitter with a 3.8 GPA. My search query is: "${query}"`,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        const textSummary = response.text;
        setSummary(textSummary);
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
            const searchResults: SearchResult[] = groundingChunks.map((chunk: any) => ({
                title: chunk.web?.title || 'Unknown Title',
                uri: chunk.web?.uri || '#',
            }));
            setResults(searchResults);
        }

    } catch (err) {
        if (err instanceof Error) {
            setError(`Failed to perform search: ${err.message}`);
        } else {
            setError('An unknown error occurred during the search.');
        }
        console.error("Error during college search:", err);
    } finally {
        setIsLoading(false);
    }
  }, [query]);

  return (
    <Card>
      <h3 className="text-xl font-bold text-white mb-2">AI-Powered College Search</h3>
      <p className="text-slate-400 mb-6">Find colleges that match your athletic and academic profile.</p>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., 'Top engineering schools with D1 volleyball'"
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-sky-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-600 transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="text-center text-red-400">{error}</p>}
      
      {isLoading && <LoadingSpinner />}

      {summary && (
        <div className="mb-8 p-4 bg-slate-700/50 rounded-lg">
            <h4 className="font-bold text-sky-300 mb-2">AI Summary</h4>
            <p className="text-slate-300 whitespace-pre-wrap">{summary}</p>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h4 className="font-bold text-sky-300 mb-3">Search Sources</h4>
          <ul className="space-y-2">
            {results.map((result, index) => (
              <li key={index} className="bg-slate-800 p-3 rounded-lg">
                <a href={result.uri} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-sky-400 hover:underline truncate block">
                  {result.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

    </Card>
  );
};

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-400"></div>
    </div>
);

export default CollegeSearch;

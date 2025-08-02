import React, { useState, useCallback, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Route, TripPlan } from '../types';
import { Location } from '../App';
import { mtrLines, mtrStations } from '../data/mtrStations';
import Loader from './Loader';
import ErrorDisplay from './ErrorDisplay';
import TripPlanResult from './TripPlanResult';
import AutoCompleteInput from './AutoCompleteInput';

interface TripPlannerPanelProps {
    allRoutes: Route[];
    locations: Location[];
    apiKey: string;
}

const TripPlannerPanel: React.FC<TripPlannerPanelProps> = ({ allRoutes, locations, apiKey }) => {
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [plan, setPlan] = useState<TripPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isButtonDisabled = !origin.trim() || !destination.trim() || loading || !apiKey;

    const stripParentheses = (text: string | undefined | null): string => {
        if (!text) return '';
        return text.replace(/\s*\([^)]*\)\s*/g, '').trim();
    };

    const promptContext = useMemo(() => {
        const kmbRouteData = allRoutes
            .filter(r => r.bound === 'O') // Use only outbound for a cleaner list
            .map(r => `Route ${r.route}: ${stripParentheses(r.orig_tc)} to ${stripParentheses(r.dest_tc)}`)
            .join('\n');
            
        const mtrLineData = mtrLines.map(line => {
            const stations = mtrStations[line.code].map(s => stripParentheses(s.name_tc)).join(', ');
            return `MTR ${line.name} (${line.code}): ${stations}`;
        }).join('\n');
        
        const validLocationsData = locations.map(l => stripParentheses(l.name_tc)).join('\n');

        return `
You are an expert Hong Kong transportation planner. Your goal is to create the most efficient, logical, and accurate multi-modal trip plan. You must strictly adhere to the following rules.

**//-- Plan Generation Rules --//**
1.  **Efficiency First:** Prioritize direct routes. Minimize transfers. Suggest walking only for very short connections (e.g., under 500m between a bus stop and an MTR station).
2.  **Mode Selection:** Generally, prefer MTR for long-distance or cross-harbour travel. Prefer buses for routes not well-served by MTR or for shorter, more direct trips.
3.  **Infer Locations:** The user's start and end points may be landmarks, buildings, or general areas (e.g., "K11 Musea", "Tuen Mun Town Plaza"). You MUST use your knowledge and Google Search to identify the most appropriate, nearby KMB bus stop or MTR station from the "VALID TRANSPORT HUBS" list provided below. This inferred, official stop/station name is what you must use in the plan steps.
4.  **Strict Data Adherence:** All bus stop and MTR station names used in your plan MUST EXACTLY MATCH a name from the "VALID TRANSPORT HUBS" list. Do not invent or guess names. For bus routes, only use routes from the "AVAILABLE KMB ROUTES" list. For MTR, the "direction" should be the name of the terminal station for that line in the direction of travel, in Traditional Chinese (e.g., "往荃灣", "往中環").

**//-- Output Format: JSON ONLY --//**
1.  You MUST return the final plan in a single, valid JSON object.
2.  The JSON must be enclosed in a \`\`\`json markdown block.
3.  Do NOT include any text, conversation, or explanation outside of the JSON block.
4.  The JSON object must follow this exact structure:
    \`\`\`
    {
      "plan": [
        {
          "type": "walk" | "bus" | "mtr",
          "summary": "A brief, clear summary of this step in Traditional Chinese.",
          "details": { ... }
        }
      ]
    }
    \`\`\`
5.  **Details object structure:**
    -   **type: "walk"** -> \`{ "instruction": "Walking directions in Traditional Chinese." }\`
    -   **type: "bus"** -> \`{ "route": "1A", "boarding_stop": "尖沙咀碼頭", "alighting_stop": "旺角街市", "num_stops": 5 }\` (Use names from VALID TRANSPORT HUBS)
    -   **type: "mtr"** -> \`{ "line": "荃灣綫", "boarding_station": "尖沙咀", "alighting_station": "旺角", "direction": "往荃灣", "num_stops": 2 }\` (Use names from VALID TRANSPORT HUBS & AVAILABLE MTR LINES)

**//-- Reference Data --//**

**AVAILABLE KMB ROUTES (Route: Origin to Destination):**
---
${kmbRouteData}
---

**AVAILABLE MTR LINES & STATIONS:**
---
${mtrLineData}
---

**VALID TRANSPORT HUBS (Bus Stops & MTR Stations - Use these exact TC names):**
---
${validLocationsData}
---

Now, based on this data and live information from Google Search, generate a multi-modal trip plan.
        `;
    }, [allRoutes, locations]);
    
    const handleGetPlan = useCallback(async () => {
        if (isButtonDisabled) return;

        setLoading(true);
        setError(null);
        setPlan(null);

        try {
            if (!apiKey) {
                throw new Error("API key is missing.");
            }
            const ai = new GoogleGenAI({ apiKey });

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-lite",
                contents: `Generate a trip plan in Hong Kong from "${origin}" to "${destination}".`,
                config: {
                    systemInstruction: promptContext,
                    tools: [{ googleSearch: {} }],
                },
            });
            
            const textResponse = response.text;
            let parsedPlan;

            const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/);
            
            if (jsonMatch && jsonMatch[1]) {
                try {
                    parsedPlan = JSON.parse(jsonMatch[1]);
                } catch (e) {
                    console.error("Failed to parse JSON from markdown block", e);
                    throw new Error("The AI returned a malformed plan. Could not understand the format.");
                }
            } else {
                // If no markdown block, try to parse the whole response as JSON as a fallback
                try {
                    parsedPlan = JSON.parse(textResponse);
                } catch (e) {
                    console.error("Failed to parse the entire response as JSON", e);
                    throw new Error("The AI returned a response that was not in the expected JSON format.");
                }
            }
            
            if (!parsedPlan || !parsedPlan.plan) {
                 throw new Error("The generated plan is incomplete or in an invalid format.");
            }
            
            setPlan(parsedPlan);

        } catch (err) {
            console.error("Error generating trip plan:", err);
            const errorMessage = (err instanceof Error) ? err.message : String(err);
             if (errorMessage.toLowerCase().includes('api key not valid')) {
                setError("Your API key appears to be invalid. Please check it in the Settings tab.");
            } else if (errorMessage.includes('API key is missing')) {
                setError("Please set your Gemini API key in the Settings tab to use the planner.");
            } else {
                setError(`Sorry, I couldn't generate a trip plan. ${errorMessage}`);
            }
        } finally {
            setLoading(false);
        }
    }, [origin, destination, promptContext, isButtonDisabled, apiKey]);

    return (
        <div className="space-y-4 pt-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg space-y-4 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">AI Trip Planner</h2>
                <div className="space-y-3">
                    <AutoCompleteInput
                        value={origin}
                        onChange={setOrigin}
                        placeholder="From: e.g., Tsim Sha Tsui Ferry Pier"
                        suggestions={locations}
                        icon={<svg className="h-6 w-6 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                    />
                    <AutoCompleteInput
                        value={destination}
                        onChange={setDestination}
                        placeholder="To: e.g., Mong Kok MTR Station"
                        suggestions={locations}
                        icon={<svg className="h-6 w-6 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    />
                </div>
                <button
                    onClick={handleGetPlan}
                    disabled={isButtonDisabled}
                    className="w-full bg-[color:var(--accent)] text-[color:var(--accent-text)] font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 hover:bg-[color:var(--accent-hover)] disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed dark:disabled:text-gray-400 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:-translate-y-0.5"
                >
                     {loading ? (
                       <>
                        <div className="w-5 h-5 border-2 border-inherit border-t-transparent rounded-full animate-spin"></div>
                        <span>Generating Plan...</span>
                       </>
                     ) : (
                       <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" /><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" /></svg>
                        Get Plan
                       </>
                     )}
                </button>
            </div>
            {!apiKey && (
                 <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-xl flex items-start gap-3" role="alert">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <strong className="font-bold block">API Key Required</strong>
                        <span className="block text-sm">Please go to the <strong>Settings</strong> tab to add your Gemini API key.</span>
                    </div>
                </div>
            )}
            {loading && <div className="py-8"><Loader message="Planning your trip..." /></div>}
            {error && <ErrorDisplay message={error} />}
            {plan && <TripPlanResult plan={plan} />}
            {!plan && !loading && !error && apiKey && (
                 <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p className="font-semibold">Where are you headed?</p>
                    <p className="text-sm">Enter your start and end points to get a travel plan.</p>
                </div>
            )}
        </div>
    );
};

export default TripPlannerPanel;
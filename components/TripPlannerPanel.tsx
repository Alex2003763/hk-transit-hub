import React, { useState, useCallback, useMemo } from 'react';
import { Route, TripResult } from '../types';
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
    const [plan, setPlan] = useState<TripResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

    const isButtonDisabled = !origin.trim() || !destination.trim() || loading || !apiKey;

    // Function to get user's current location with fallback
    const getUserLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by this browser.');
            return;
        }

        setIsGettingLocation(true);
        setError(null);

        const handleSuccess = (position: GeolocationPosition) => {
            const { latitude, longitude, accuracy } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });

            // Use reverse geocoding to get a readable location name
            // Show full precision coordinates for better accuracy
            const locationName = `Current Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
            setOrigin(locationName);
            setIsGettingLocation(false);

            // Log accuracy for debugging
            if (accuracy) {
                console.log(`Location obtained with accuracy: ${accuracy} meters`);
            }
        };

        const handleError = (error: GeolocationPositionError, isRetry = false) => {
            console.error('Error getting location:', error);

            // If first attempt failed and it's not a permission error, try with different settings
            if (!isRetry && error.code !== 1) {
                console.log('Retrying with fallback settings...');
                navigator.geolocation.getCurrentPosition(
                    handleSuccess,
                    (retryError) => {
                        console.error('Retry also failed:', retryError);
                        // Only show error if retry also fails
                        let errorMessage = 'Unable to get your location. ';
                        if (retryError.code === 1) {
                            errorMessage += 'Please allow location access in your browser settings and try again.';
                        } else if (retryError.code === 2) {
                            errorMessage += 'Location information is unavailable. Please check your device settings.';
                        } else if (retryError.code === 3) {
                            errorMessage += 'Location request timed out. Please try again or check your connection.';
                        } else {
                            errorMessage += 'An unknown error occurred. Please try again.';
                        }
                        setError(errorMessage);
                        setIsGettingLocation(false);
                    },
                    {
                        enableHighAccuracy: false,
                        timeout: 15000,
                        maximumAge: 60000
                    }
                );
                return;
            }

            // Only show error for permission denied or if this is already a retry
            if (error.code === 1 || isRetry) {
                let errorMessage = 'Unable to get your location. ';
                if (error.code === 1) {
                    errorMessage += 'Please allow location access in your browser settings and try again.';
                } else if (error.code === 2) {
                    errorMessage += 'Location information is unavailable. Please check your device settings.';
                } else if (error.code === 3) {
                    errorMessage += 'Location request timed out. Please try again or check your connection.';
                } else {
                    errorMessage += 'An unknown error occurred. Please try again.';
                }
                setError(errorMessage);
            }
            setIsGettingLocation(false);
        };

        // Try high accuracy first, fallback to lower accuracy if needed
        navigator.geolocation.getCurrentPosition(
            handleSuccess,
            (error) => handleError(error, false),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000
            }
        );
    }, []);

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
You are an expert Hong Kong transportation planner. Your goal is to generate two distinct trip plans: the absolute CHEAPEST and the absolute FASTEST.

**//-- Core Task --//**
1.  **Generate Two Plans:** Create two separate, complete trip plans for the user's request.
    -   **Plan 1: The CHEAPEST.** This plan must prioritize the lowest possible total cost, even if it takes longer.
    -   **Plan 2: The FASTEST.** This plan must prioritize the minimum possible travel time, even if it costs more.
2.  **Use Google Search Extensively:** You MUST use Google Search to find:
    -   **Fares:** "KMB route [route number] price", "MTR fare from [station] to [station] Octopus". Search for exact fares.
    -   **Travel Times:** Use Google Maps for realistic travel time estimates for MTR, bus, and walking segments.
    -   **Service Status:** Check for any real-time disruptions, delays, or route changes for all relevant transport modes.
3.  **Strict Data Adherence:**
    -   All transport hubs (stops/stations) MUST EXACTLY MATCH a name from the "VALID TRANSPORT HUBS" list.
    -   Bus routes must come from "AVAILABLE KMB ROUTES".
    -   MTR directions must be the terminal station name in Traditional Chinese (e.g., "往荃灣").
4.  **Infer Locations:** If the start/end points are landmarks (e.g., "K11 Musea"), use Google Search to find the nearest official transport hub from the provided lists and use that exact name.

**//-- Output Format: JSON ONLY --//**
1.  You MUST return a single, valid JSON object in a \`\`\`json markdown block.
2.  Your entire response MUST be ONLY the JSON object. Do NOT include any text, conversation, or explanation outside the JSON block.
3.  The JSON object MUST contain two top-level keys: 'cheapest_plan' and 'fastest_plan'.
4.  The structure MUST be exactly as follows:
    \`\`\`
    {
      "cheapest_plan": {
        "current_conditions": "Brief note on service status for this plan (in English).",
        "total_time_minutes": 55,
        "total_cost_hkd": 12.5,
        "plan": [
          {
            "type": "walk" | "bus" | "mtr",
            "summary": "A brief summary of this step in Traditional Chinese.",
            "details": { ... },
            "duration_minutes": 10,
            "cost_hkd": 0
          }
        ]
      },
      "fastest_plan": {
        "current_conditions": "Brief note on service status for this plan (in English).",
        "total_time_minutes": 30,
        "total_cost_hkd": 22.0,
        "plan": [ ... ]
      }
    }
    \`\`\`
5.  **Details Object Structure:**
    -   **type: "walk"**: \`{ "instruction": "Walking directions in Traditional Chinese." }\`
    -   **type: "bus"**: \`{ "route": "1A", "boarding_stop": "尖沙咀碼頭", "alighting_stop": "旺角街市", "num_stops": 5 }\`
    -   **type: "mtr"**: \`{ "line": "荃灣綫", "boarding_station": "尖沙咀", "alighting_station": "旺角", "direction": "往荃灣", "num_stops": 2 }\`
6.  **Cost and Time Rules:**
    -   The 'cost_hkd' for a walk step is always 0.
    -   The 'duration_minutes' must be a realistic estimate for each step.

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

            // Prepare the content with location context if available
            let contentText = `Generate a trip plan in Hong Kong from "${origin}" to "${destination}".`;
            if (userLocation && origin.includes('Current Location')) {
                contentText += ` The starting location coordinates are: Latitude ${userLocation.lat}, Longitude ${userLocation.lng}.`;
            }

            // Use direct fetch to the proxy with Google Search tools
            const requestBody = {
                contents: [{
                    parts: [{
                        text: contentText
                    }]
                }],
                systemInstruction: {
                    parts: [{
                        text: promptContext + `

                    IMPORTANT: You have access to Google Search. Use it to:
                    1. Find real-time information about Hong Kong public transport
                    2. Check for any service disruptions or delays
                    3. Get current operating hours and schedules
                    4. Find alternative routes if needed
                    5. Verify bus stop locations and accessibility
                      
                    When searching, use specific queries like:
                    - "Hong Kong KMB bus route [route_number] current status"
                    - "MTR [line_name] service status today"
                    - "[location_name] Hong Kong public transport access"
                    - "Hong Kong transport disruptions today"

                    Always provide the most current and accurate information available.

CRITICAL OUTPUT FORMAT REQUIREMENT:
Your response must be ONLY a valid JSON object. Do not include any markdown formatting, code blocks, explanations, or any other text. Start your response directly with { and end with }. The JSON must be parseable and follow the exact schema specified above.`
                    }]
                },
                tools: [{
                     googleSearch: {}
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 3072,
                }
            };

            console.log('Making request to AI proxy...');
            const response = await fetch(`https://ai-proxy.chatwise.app/generativelanguage/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('AI API Error:', response.status, errorText);
                throw new Error(`AI API request failed: ${response.status} ${response.statusText}`);
            }

            const responseData = await response.json();
            console.log('AI Response:', responseData);

            if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content) {
                throw new Error('Invalid response format from AI API');
            }

            const textResponse = responseData.candidates[0].content.parts[0].text;
            let parsedPlan: any;

            // First try to parse as pure JSON (new format)
            try {
                parsedPlan = JSON.parse(textResponse.trim());
            } catch (e) {
                // Fallback: try to extract JSON from markdown block (old format)
                const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/);

                if (jsonMatch && jsonMatch[1]) {
                    try {
                        parsedPlan = JSON.parse(jsonMatch[1]);
                    } catch (e2) {
                        console.error("Failed to parse JSON from markdown block", e2);
                        throw new Error("The AI returned a malformed plan. Could not understand the format.");
                    }
                } else {
                    console.error("Failed to parse response as JSON", e);
                    console.log("Raw response:", textResponse);
                    throw new Error("The AI returned a response that was not in the expected JSON format.");
                }
            }
            
            if (!parsedPlan || !parsedPlan.cheapest_plan || !parsedPlan.fastest_plan) {
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
    }, [origin, destination, promptContext, isButtonDisabled, apiKey, userLocation]);

    return (
        <div className="space-y-4 pt-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg space-y-4 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">AI Trip Planner</h2>
                <div className="space-y-3">
                    <div className="relative">
                        <AutoCompleteInput
                            value={origin}
                            onChange={setOrigin}
                            placeholder="From: e.g., Tsim Sha Tsui Ferry Pier"
                            suggestions={locations}
                            icon={<svg className="h-6 w-6 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                        />
                        <button
                            onClick={getUserLocation}
                            disabled={isGettingLocation}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-gray-400 hover:text-[#00f5d4] hover:bg-gray-100 dark:text-gray-500 dark:hover:text-[#00f5d4] dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            title={isGettingLocation ? "Getting your location..." : "Use my current location"}
                            aria-label={isGettingLocation ? "Getting your location..." : "Use my current location"}
                        >
                            {isGettingLocation ? (
                                <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M12 6v6l4 2"></path>
                                </svg>
                            ) : (
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            )}
                        </button>
                        {isGettingLocation && (
                            <div className="absolute -bottom-6 left-0 text-xs text-[#00f5d4] dark:text-[#00f5d4] flex items-center space-x-1">
                                <svg className="h-3 w-3 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                    <circle cx="10" cy="10" r="3"/>
                                </svg>
                                <span>Getting your location...</span>
                            </div>
                        )}
                    </div>
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
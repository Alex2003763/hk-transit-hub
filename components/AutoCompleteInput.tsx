import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Location } from '../App';

interface AutoCompleteInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    suggestions: Location[];
    icon: React.ReactNode;
}

const AutoCompleteInput: React.FC<AutoCompleteInputProps> = ({ value, onChange, placeholder, suggestions, icon }) => {
    const [filteredSuggestions, setFilteredSuggestions] = useState<Location[]>([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const stripParentheses = (text: string): string => {
        if (!text) return '';
        return text.replace(/\s*\([^)]*\)\s*/g, '').trim();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const userInput = e.currentTarget.value;
        onChange(userInput);

        if(userInput) {
            const lowerCaseInput = userInput.toLowerCase();
            const filtered = suggestions.filter(
                suggestion => 
                    stripParentheses(suggestion.name_tc).toLowerCase().includes(lowerCaseInput) ||
                    stripParentheses(suggestion.name_en).toLowerCase().includes(lowerCaseInput)
            );
            setFilteredSuggestions(filtered.slice(0, 10)); // Limit to 10 suggestions
            setShowSuggestions(true);
            setActiveSuggestionIndex(0);
        } else {
            setFilteredSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleClick = (suggestion: Location) => {
        onChange(stripParentheses(suggestion.name_tc));
        setFilteredSuggestions([]);
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (showSuggestions) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestionIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : prev));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredSuggestions[activeSuggestionIndex]) {
                    handleClick(filteredSuggestions[activeSuggestionIndex]);
                }
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        }
    };

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    return (
        <div className="relative" ref={containerRef}>
            <div className="relative">
                {icon}
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => value && filteredSuggestions.length > 0 && setShowSuggestions(true)}
                    placeholder={placeholder}
                    className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 pl-11 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] transition-all"
                    autoComplete="off"
                />
            </div>
            {showSuggestions && filteredSuggestions.length > 0 && (
                <ul className="absolute z-30 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg animate-fade-in">
                    {filteredSuggestions.map((suggestion, index) => (
                        <li
                            key={suggestion.name_tc}
                            onClick={() => handleClick(suggestion)}
                            className={`p-3 cursor-pointer ${
                                index === activeSuggestionIndex ? 'bg-[color:var(--accent)] text-[color:var(--accent-text)]' : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600/50'
                            }`}
                        >
                            <p className="font-semibold">{stripParentheses(suggestion.name_tc)}</p>
                            <p className={`text-sm ${index === activeSuggestionIndex ? 'text-teal-900' : 'text-gray-500 dark:text-gray-400'}`}>{stripParentheses(suggestion.name_en)}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AutoCompleteInput;
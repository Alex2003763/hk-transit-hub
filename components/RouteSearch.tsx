import React from 'react';
import { Route } from '../types';

interface RouteSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  routes: Route[];
  onSelectRoute: (route: Route) => void;
}

const RouteListItem: React.FC<{ route: Route, onSelectRoute: (route: Route) => void }> = React.memo(({ route, onSelectRoute }) => {
  const stripParentheses = (text: string) => text.replace(/\s*\([^)]*\)\s*/g, '').trim();

  return (
    <li
      onClick={() => onSelectRoute(route)}
      className="bg-white dark:bg-gray-800 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-[1.02] border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center gap-4">
        <div className="bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 font-bold rounded-lg w-14 h-10 flex items-center justify-center text-lg flex-shrink-0">
          {route.route}
        </div>
        <div className="overflow-hidden">
          <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">To</p>
          <p className="font-semibold text-gray-900 dark:text-white text-base truncate">{stripParentheses(route.dest_tc)}</p>
        </div>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300 dark:text-gray-500 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </li>
  );
});


const RouteSearch: React.FC<RouteSearchProps> = ({ searchTerm, setSearchTerm, routes, onSelectRoute }) => {
  return (
    <div className="space-y-4 pt-4">
      <div className="sticky top-[64px] z-10 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md -mx-4 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search route or destination (e.g., 1A, 尖沙咀, Tsim Sha Tsui)"
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl py-3 px-5 pl-12 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] transition-shadow"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      <ul className="space-y-3 animate-fade-in">
        {routes.map(route => (
          <RouteListItem key={`${route.route}-${route.bound}-${route.service_type}`} route={route} onSelectRoute={onSelectRoute} />
        ))}
        {routes.length === 0 && searchTerm && (
           <div className="text-center py-12 text-gray-500 dark:text-gray-400">
             <p className="font-semibold">No routes found for "{searchTerm}"</p>
             <p className="text-sm">Please check your search term.</p>
           </div>
        )}
      </ul>
    </div>
  );
};

export default RouteSearch;
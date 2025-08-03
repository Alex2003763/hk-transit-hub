import React from 'react';
import MinibusIcon from './icons/MinibusIcon';

type ActiveTab = 'planner' | 'kmb' | 'mtr' | 'minibus' | 'settings';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const PlannerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.5 21.75l-.398-1.197a3.375 3.375 0 00-2.456-2.456L12.5 18l1.197-.398a3.375 3.375 0 002.456-2.456L16.5 14.25l.398 1.197a3.375 3.375 0 002.456 2.456L20.25 18l-1.197.398a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);
const KmbIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="145.9 331.7 354.1 138" className="h-5 w-auto">
        <rect x="145.9" y="331.7" fill="currentColor" width="30.7" height="137.8"/>
        <path fill="currentColor" d="M386.7,344.8c0-6-8.7-13.1-16.7-13.1h-37.3v13.1c0,0-0.6-0.3-1.8-4.2c-1.2-5.1-6.9-8.9-14.6-8.9h-71v111.3h-16.4l-21.5-52.2l30.1-59.1h-31.9l-29.8,59.1l31.9,78.8h252.8c10.7,0,21.5-5.1,26.6-9.8c18.5-18.2,13.1-35.8,8.9-44.2c-6.6-12.8-21.5-19.4-21.5-19.4s10.7-6.3,15.5-13.1c6.6-9.5,6-23.9-1.5-33.4c-9.2-11.9-19.1-17.6-38.5-17.9c-7.8-0.3-21.5,0-21.5,0h-30.7v100.8h30.7v-72.8c0,0,12.8-0.6,24.5,0c12.2,0.6,13.7,22.4-0.9,22.7c-7.8,0.3-16.7,0-16.7,0v25.7c0,0,11.6,0.3,16.4,0c13.4-0.9,19.7,33.4-0.3,34.9c-4.5,0.3-8.7,0-8.7,0H276.4v-82.6h25.7v72.2h30.7v-72.2h23.3v72.2h30.7v-72.2v-15.7H386.7z"/>
    </svg>
);
const MtrIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="-12 -14 30 30">
      <g transform="scale(1, -1)">
        <path
            fill="currentColor"
            d="m 0,0 c -5.192,-0.806 -9.212,-5.149 -9.507,-10.483 l 4.181,-0.006 c 0.19,3.187 2.421,5.827 5.41,6.62 v -7.49 h 4.193 v 7.49 c 2.986,-0.793 5.219,-3.433 5.406,-6.62 l 4.19,0.006 C 13.564,-5.149 9.55,-0.806 4.363,0 v 3.46 c 5.187,0.809 9.201,5.15 9.51,10.487 H 9.683 C 9.496,10.76 7.263,8.126 4.277,7.33 v 7.49 H 0.084 V 7.33 c -2.989,0.796 -5.22,3.43 -5.41,6.617 H -9.507 C -9.212,8.61 -5.192,4.269 0,3.46 Z"
        />
      </g>
    </svg>
);
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);

const NavButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full pt-3 pb-2 transition-colors duration-200 relative ${
            isActive
                ? 'text-[color:var(--accent)]'
                : 'text-gray-500 dark:text-gray-400'
        } hover:text-[color:var(--accent-hover)] dark:hover:text-[color:var(--accent)]`}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
    >
        {icon}
        <span className={`text-xs mt-1 transition-all ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </button>
);


const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
    
    const tabs: {id: ActiveTab, label: string, icon: React.ReactNode}[] = [
        { id: 'planner', label: 'Planner', icon: <PlannerIcon /> },
        { id: 'kmb', label: 'Bus', icon: <KmbIcon /> },
        { id: 'mtr', label: 'MTR', icon: <MtrIcon /> },
        { id: 'minibus', label: 'Minibus', icon: <MinibusIcon className="h-6 w-6" /> },
        { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
    ];
    
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 z-30">
            <div className="max-w-4xl mx-auto h-full grid grid-cols-5">
                {tabs.map(tab => (
                    <NavButton
                        key={tab.id}
                        label={tab.label}
                        icon={tab.icon}
                        isActive={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                    />
                ))}
            </div>
        </nav>
    );
};


export default BottomNav;
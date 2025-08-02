import React, { useState } from 'react';
import { TripPlan, TripStep, WalkDetails, BusDetails, MtrDetails, TripResult } from '../types';
import ErrorDisplay from './ErrorDisplay';

const WalkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" /></svg>;
const KmbIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="145.9 223.65 354.1 354.1" className="h-6 w-6">
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

const StepCard: React.FC<{ icon: React.ReactNode; children: React.ReactNode; typeColor: string; isLast: boolean }> = ({ icon, children, typeColor, isLast }) => (
    <div className="flex gap-4">
        <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${typeColor}`}>
                {icon}
            </div>
            {!isLast && <div className="w-0.5 flex-grow bg-gray-300 dark:bg-gray-600 my-2"></div>}
        </div>
        <div className="flex-1 pb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md -mt-1 border border-gray-200 dark:border-gray-700 h-full">
                {children}
            </div>
        </div>
    </div>
);

const DetailItem: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => {
    if (!value && value !== 0) return null;
    return (
        <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">{label}: </span>
            <span className="text-gray-800 dark:text-gray-200 font-medium">{value}</span>
        </div>
    );
};

interface TripPlanResultProps {
    plan: TripResult;
}

const TripSummary: React.FC<{ time: number; cost: number }> = ({ time, cost }) => (
    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex justify-around text-center shadow-sm">
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Time</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{time} <span className="text-sm font-normal">min</span></p>
        </div>
        <div className="border-l border-gray-200 dark:border-gray-600"></div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Cost</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">HK$ {cost.toFixed(1)}</p>
        </div>
    </div>
);

const PlanDetails: React.FC<{ plan: TripPlan }> = ({ plan }) => {
    if (!plan || !plan.plan || plan.plan.length === 0) {
        return <ErrorDisplay message="The generated plan is empty or invalid." />;
    }

    const renderStepDetails = (step: TripStep) => {
        const details = step.details;
        switch (step.type) {
            case 'walk':
                const walkDetails = details as WalkDetails;
                return <p className="text-gray-800 dark:text-gray-200 text-sm">{walkDetails.instruction}</p>;
            case 'bus':
                const busDetails = details as BusDetails;
                return (
                     <div className="space-y-1.5">
                        <DetailItem label="Route" value={busDetails.route} />
                        <DetailItem label="Board at" value={busDetails.boarding_stop} />
                        <DetailItem label="Alight at" value={busDetails.alighting_stop} />
                        <DetailItem label="Stops" value={busDetails.num_stops} />
                    </div>
                );
            case 'mtr':
                 const mtrDetails = details as MtrDetails;
                return (
                     <div className="space-y-1.5">
                        <DetailItem label="Line" value={mtrDetails.line} />
                        <DetailItem label="Direction" value={mtrDetails.direction} />
                        <DetailItem label="Board at" value={mtrDetails.boarding_station} />
                        <DetailItem label="Alight at" value={mtrDetails.alighting_station} />
                        <DetailItem label="Stops" value={mtrDetails.num_stops} />
                    </div>
                );
            default:
                return null;
        }
    }

    const getStepConfig = (type: TripStep['type']) => {
        switch (type) {
            case 'walk': return { icon: <WalkIcon />, color: 'bg-green-500' };
            case 'bus': return { icon: <KmbIcon />, color: 'bg-red-500' };
            case 'mtr': return { icon: <MtrIcon />, color: 'bg-red-700' };
            default: return { icon: <div />, color: 'bg-gray-500' };
        }
    };

    return (
        <div className="pt-4">
            <TripSummary time={plan.total_time_minutes} cost={plan.total_cost_hkd} />

            {plan.current_conditions && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start">
                        <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Current Service Information</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">{plan.current_conditions}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative">
                {plan.plan.map((step, index) => {
                     const { icon, color } = getStepConfig(step.type);
                     return (
                        <StepCard key={index} icon={icon} typeColor={color} isLast={index === plan.plan.length -1}>
                            <div className="flex justify-between items-start mb-2">
                                <p className="font-bold text-base text-gray-900 dark:text-white flex-1 pr-2">{step.summary}</p>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{step.duration_minutes} min</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">HK$ {step.cost_hkd.toFixed(1)}</p>
                                </div>
                            </div>
                            {renderStepDetails(step)}
                        </StepCard>
                    );
                })}
            </div>
        </div>
    );
};

const TripPlanResult: React.FC<TripPlanResultProps> = ({ plan }) => {
    const [activeTab, setActiveTab] = useState<'cheapest' | 'fastest'>('fastest');

    if (!plan || !plan.cheapest_plan || !plan.fastest_plan) {
        return <ErrorDisplay message="The generated plan is incomplete or invalid." />;
    }

    const tabs = [
        { id: 'fastest', label: 'Fastest' },
        { id: 'cheapest', label: 'Cheapest' },
    ];

    return (
        <div className="pt-4 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Trip Plan:</h3>
            <div className="mb-4">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'cheapest' | 'fastest')}
                            className={`py-2 px-4 text-sm font-medium transition-colors duration-200 ${
                                activeTab === tab.id
                                    ? 'border-b-2 border-[color:var(--accent)] text-[color:var(--accent)]'
                                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                {activeTab === 'fastest' && <PlanDetails plan={plan.fastest_plan} />}
                {activeTab === 'cheapest' && <PlanDetails plan={plan.cheapest_plan} />}
            </div>
        </div>
    );
};

export default TripPlanResult;
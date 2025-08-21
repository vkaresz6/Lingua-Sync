




import React, { useState } from 'react';
import { BoundingBox } from './BoundingBox';
import { useDisplay } from './DisplayContext';
import { EditToolbar } from './EditToolbar';
import { ReviewToolbar } from './ReviewToolbar';
import { Logo } from './Logo';
import { STRINGS } from '../strings';
import { useProject } from './contexts/ProjectContext';
import { ModalType } from './contexts/UIStateContext';
import { Contributor } from '../types';

// --- Overall Status Indicators Component ---
interface OverallStatusIndicatorsProps {
    quality: number; // 0-100
    consistency: number; // 0-100
    qualityTrend: 'up' | 'down' | null;
    consistencyTrend: 'up' | 'down' | null;
}

const TrendIndicator: React.FC<{ trend: 'up' | 'down' | null }> = ({ trend }) => {
    if (!trend) return <div className="w-4 h-4" />;
    const isUp = trend === 'up';
    return (
        <span className={`animate-trend ${isUp ? 'text-green-500' : 'text-red-500'}`}>
            {isUp ? '▲' : '▼'}
        </span>
    );
};

const IndicatorBar: React.FC<{ value: number; label: string; trend: 'up' | 'down' | null }> = ({ value, label, trend }) => {
    const color = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-sky-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="w-48">
            <div className="flex justify-between items-center mb-0.5">
                <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-slate-600">{label}</span>
                    <TrendIndicator trend={trend} />
                </div>
                <span className="text-xs font-bold text-slate-700">{value.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div 
                    className={`${color} h-1.5 rounded-full transition-all duration-500 ease-out`} 
                    style={{ width: `${Math.max(0, value)}%` }}
                ></div>
            </div>
        </div>
    );
};

const OverallStatusIndicators: React.FC<OverallStatusIndicatorsProps> = ({ quality, consistency, qualityTrend, consistencyTrend }) => {
    return (
        <div className="flex items-center gap-6 border-l border-slate-200 pl-4">
            <IndicatorBar value={quality} label="Quality" trend={qualityTrend} />
            <IndicatorBar value={consistency} label="Consistency" trend={consistencyTrend} />
        </div>
    );
};


const ActionButton: React.FC<{ onClick?: () => void; href?: string; title: string; children: React.ReactNode; disabled?: boolean; }> = ({ onClick, href, title, children, disabled }) => {
    const commonClasses = "p-2 rounded-md text-slate-600 hover:bg-slate-300 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent";

    if (href && !disabled) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" title={title} className={commonClasses}>
                {children}
            </a>
        );
    }

    return (
        <button onClick={onClick} title={title} disabled={disabled} className={commonClasses}>
            {children}
        </button>
    );
};


const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; }> = ({ active, onClick, children }) => (
    <button 
        onClick={onClick}
        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
            active 
                ? 'bg-white text-indigo-700 shadow-sm' 
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'
        }`}
    >
        {children}
    </button>
);

const ProjectsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v18h16.5V3H3.75zM9 9h6v6H9V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5" />
    </svg>
);


const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5a2.25 2.25 0 0 1-2.25 2.25H10.5a2.25 2.25 0 0 1-2.25-2.25V3.75m.75 1.5H15m-4.5 0H5.25m4.5 0V3.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5" />
    </svg>
);

const GitHubCommitIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor">
        <path fillRule="evenodd" d="M1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zM8 0a8 8 0 100 16A8 8 0 008 0zm.25 4.75a.75.75 0 00-1.5 0v3.5a.75.75 0 00.25 1.75l2.5.5a.75.75 0 00.5-1.41L8.25 8.81V4.75z"></path>
    </svg>
);

const GitHubPushIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-2.475 2.475M12 9.75l2.475 2.475M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const GitHubLogo = () => (
    <svg height="20" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="20" fill="currentColor">
        <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
    </svg>
);

const GitHubDisconnectIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.47 2 2 6.47 2 12a9.994 9.994 0 006.264 9.243.6.6 0 00.81-.505.602.602 0 00-.23-1.033A7.98 7.98 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 2.39-1.05 4.54-2.73 6.01a.598.598 0 000 .848.599.599 0 00.848 0A9.99 9.99 0 0022 12c0-5.53-4.47-10-10-10z" />
        <path d="M4.22 19.78a.75.75 0 001.06 1.06L20.84 5.28a.75.75 0 00-1.06-1.06L4.22 19.78z" />
    </svg>
);

const DownloadProjectIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const PullIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const SyncIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-3.181-3.183l-3.181-3.183A8.25 8.25 0 006.82 6.82l-3.182 3.182" />
    </svg>
);

const PullRequestIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor">
        <path fillRule="evenodd" d="M1.5 3.25a2.25 2.25 0 113.402 1.834.75.75 0 00-1.06 1.061 3.75 3.75 0 105.316 0 .75.75 0 00-1.06-1.06A2.25 2.25 0 111.5 3.25zM8 10.25a.75.75 0 00-.75.75v2.25H6a.75.75 0 000 1.5h1.25V17a.75.75 0 001.5 0v-2.25H10a.75.75 0 000-1.5H8.75V11a.75.75 0 00-.75-.75z" />
    </svg>
);

const ManageUsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zM10.5 12a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h10.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25H3.75a2.25 2.25 0 01-2.25-2.25V9a2.25 2.25 0 012.25-2.25z" />
    </svg>
);

const ManageTerminologyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
);

const CloudDownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
    </svg>
);


const ImportTmArchiveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625a1.875 1.875 0 0 0-1.875 1.875v17.25a1.875 1.875 0 0 0 1.875 1.875h12.75a1.875 1.875 0 0 0 1.875-1.875V10.5" />
    </svg>
);

const DatabaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.75v10.5c0 1.242-3.682 2.25-8.25 2.25S3.75 18.542 3.75 17.25V6.75" />
    </svg>
);

const FindTmMatchesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h10.5M3.75 12h10.5m-10.5 5.25h7.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75v10.5c0 1.242-2.348 2.25-5.25 2.25S6.75 18.542 6.75 17.25V6.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-3.5-3.5m0 0a4.5 4.5 0 10-6.364-6.364 4.5 4.5 0 006.364 6.364z" />
    </svg>
);


const ExportDocxIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3v11.25" />
    </svg>
);

const ExportHtmlIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
);

const AdvancedExportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
    </svg>
);

const RebuildIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 3a1 1 0 011 1v1.162l.23-.23a1 1 0 111.414 1.414l-2.43 2.43a1.5 1.5 0 01-2.122 0l-2.43-2.43a1 1 0 111.415-1.414l.23.23V4a1 1 0 011-1z" />
      <path d="M3 9a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
      <path d="M10 17a1 1 0 01-1-1v-1.162l-.23.23a1 1 0 11-1.414-1.414l2.43-2.43a1.5 1.5 0 012.122 0l2.43 2.43a1 1 0 11-1.415 1.414l-.23-.23V16a1 1 0 01-1-1z" />
    </svg>
);

const ViewXmlIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const FlaskIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M7 2a1 1 0 00-1 1v1.132a5.001 5.001 0 00-2.632 4.343 1 1 0 00.264.868l3.58 3.581a1 1 0 001.414 0l3.58-3.581a1 1 0 00.265-.868A5.001 5.001 0 009 4.132V3a1 1 0 00-1-1H7zm1 6.132a3 3 0 00-1.042.183l-2.408 1.204a1 1 0 00-.55.894V14.5a1 1 0 001 1h6a1 1 0 001-1v-4.087a1 1 0 00-.55-.894l-2.408-1.204A3 3 0 008 8.132z" clipRule="evenodd" />
    </svg>
);

const ExportSrtIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V17.25m-4.5 0v3.375c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V17.25m-4.5 0v-3.375c0-.621.504 1.125 1.125 1.125h2.25c.621 0 1.125.504 1.125 1.125V17.25" />
    </svg>
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
    </svg>
);

const AutoTranslateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.358-.45.557-.327l5.603 3.112Zm-6.543-.327a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.358-.45.557-.327l5.603 3.112Z" />
    </svg>
);

const QaCheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const StatisticsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 11h3v5H2v-5zM6 6h3v10H6V6zM10 3h3v13h-3V3zM14 8h3v8h-3V8z" />
    </svg>
);

const ViewIcon: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${active ? 'text-indigo-600' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
);

const TinySpinner = () => (
    <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface HeaderProps {
    onGoToProjects: () => void;
    onSaveProject: () => void;
    onDownloadProject: () => void;
    onExport: (format: 'docx' | 'pdf' | 'srt' | 'html') => void;
    onAdvancedExport?: () => void;
    isAdvancedExporting?: boolean;
    onRebuildDocx?: () => void;
    isRebuildingDocx?: boolean;
    onExpExport?: () => void;
    isExpExporting?: boolean;
    onOpenModal: (type: ModalType) => void;
    isEditingDisabled: boolean;
    onPull?: () => void;
    onSync?: () => void;
    onImportTmArchiveClick?: () => void;
    onFindTmMatches?: () => void;
    isFindingTms?: boolean;
    isGitHubConnected: boolean;
    onDisconnectFromGitHub: () => void;
    onSyncFormatting: () => void;
    isSyncingFormatting: boolean;
    onBatchSyncFormatting: () => void;
    isBatchSyncingFormatting: boolean;
    onResegment: () => void;
    onViewDocxXml?: () => void;
    isViewingDocxXml?: boolean;
    overallQuality: number;
    overallConsistency: number;
    qualityTrend: 'up' | 'down' | null;
    consistencyTrend: 'up' | 'down' | null;
    isSubtitleProject: boolean;
    isWebpageProject: boolean;
    isProofreaderMode: boolean;
    onToggleProofreaderMode: () => void;
    contributors: Contributor[];
    proofreader1?: string;
    proofreader2?: string;
    onFinalizeProject: () => void;
    isFinalizeDisabled: boolean;
    onBatchReevaluate: () => void;
    isBatchEvaluating: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
    onGoToProjects, onSaveProject, onDownloadProject, onExport, onAdvancedExport, isAdvancedExporting, 
    onRebuildDocx, isRebuildingDocx, onExpExport, isExpExporting,
    onOpenModal, isEditingDisabled,
    onPull, onSync, onImportTmArchiveClick, onFindTmMatches, isFindingTms,
    isGitHubConnected, onDisconnectFromGitHub,
    onSyncFormatting, isSyncingFormatting, onBatchSyncFormatting, isBatchSyncingFormatting, onResegment,
    onViewDocxXml, isViewingDocxXml,
    overallQuality, overallConsistency, qualityTrend, consistencyTrend, isSubtitleProject, isWebpageProject,
    isProofreaderMode, onToggleProofreaderMode, contributors, proofreader1, proofreader2,
    onFinalizeProject, isFinalizeDisabled, onBatchReevaluate, isBatchEvaluating
}) => {
    const { documentName, isGitHubProject, isYouTubeProject, isLeader, repoUrl } = useProject();
    const { showBoundingBoxes, toggleBoundingBoxes } = useDisplay();
    const [activeTab, setActiveTab] = useState<'file' | 'edit' | 'review' | 'github' | 'dev'>('file');

    const saveTitle = isGitHubProject ? STRINGS.TITLE_PUSH_CHANGES_GITHUB : STRINGS.TITLE_SAVE_BROWSER;
    const SaveOrPushIcon = isGitHubProject ? GitHubPushIcon : SaveIcon;

    return (
        <BoundingBox name="header" className="!m-0 !p-0">
            <header className="bg-white shadow-sm sticky top-0 z-20">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        
                        <div className="flex-1 flex items-center gap-4">
                             <BoundingBox name="title area">
                                <Logo />
                            </BoundingBox>
                            {!isSubtitleProject && (
                                <OverallStatusIndicators 
                                    quality={overallQuality}
                                    consistency={overallConsistency}
                                    qualityTrend={qualityTrend}
                                    consistencyTrend={consistencyTrend}
                                />
                            )}
                            <ActionButton onClick={onGoToProjects} title={STRINGS.TITLE_BACK_TO_PROJECTS}>
                                <ProjectsIcon />
                            </ActionButton>
                        </div>

                        <div className="flex-shrink-0 flex items-center justify-center gap-4">
                            <div className="flex items-center gap-1 p-1 bg-slate-200 rounded-lg">
                                <TabButton active={activeTab === 'file'} onClick={() => setActiveTab('file')}>{STRINGS.TAB_FILE}</TabButton>
                                <TabButton active={activeTab === 'edit'} onClick={() => setActiveTab('edit')}>{STRINGS.TAB_EDIT}</TabButton>
                                <TabButton active={activeTab === 'review'} onClick={() => setActiveTab('review')}>Review</TabButton>
                                <TabButton active={activeTab === 'github'} onClick={() => setActiveTab('github')}>GitHub</TabButton>
                                <TabButton active={activeTab === 'dev'} onClick={() => setActiveTab('dev')}>Dev</TabButton>
                            </div>
                           
                            {activeTab === 'file' && (
                                <BoundingBox name="file pane">
                                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                                        <ActionButton onClick={onSaveProject} title={saveTitle}>
                                            <SaveOrPushIcon />
                                        </ActionButton>
                                        <ActionButton onClick={onDownloadProject} title={STRINGS.TITLE_DOWNLOAD_PROJECT}>
                                            <DownloadProjectIcon />
                                        </ActionButton>
                                        <div className="h-6 w-px bg-slate-300 mx-1"></div>
                                        <ActionButton onClick={() => onExport('docx')} title={STRINGS.TITLE_EXPORT_DOCX}>
                                            <ExportDocxIcon />
                                        </ActionButton>
                                        <ActionButton onClick={() => onExport('pdf')} title={STRINGS.TITLE_EXPORT_PDF}>
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v5.25a2.25 2.25 0 0 1-2.25 2.25H6.75a2.25 2.25 0 0 1-2.25-2.25v-5.25m15 0-3-3m0 0-3 3m3-3V3" />
                                            </svg>
                                        </ActionButton>
                                        {isYouTubeProject && (
                                            <ActionButton onClick={() => onExport('srt')} title={STRINGS.TITLE_EXPORT_SRT}>
                                                <ExportSrtIcon />
                                            </ActionButton>
                                        )}
                                        {isWebpageProject && (
                                            <ActionButton onClick={() => onExport('html')} title="Export as HTML file">
                                                <ExportHtmlIcon />
                                            </ActionButton>
                                        )}
                                         <div className="h-6 w-px bg-slate-300 mx-1"></div>
                                        <ActionButton onClick={() => onOpenModal('statisticsReport')} title="Statistics Report">
                                            <StatisticsIcon />
                                        </ActionButton>
                                         <div className="h-6 w-px bg-slate-300 mx-1"></div>
                                          {onImportTmArchiveClick && isGitHubConnected && (
                                            <ActionButton onClick={() => onOpenModal('manageTermDbs')} title={STRINGS.TITLE_MANAGE_TERMDBS}>
                                                <ManageTerminologyIcon />
                                            </ActionButton>
                                        )}
                                        {isGitHubProject && (
                                            <ActionButton onClick={() => onOpenModal('loadTermDb')} title={STRINGS.TITLE_LOAD_TERMDBS}>
                                                <CloudDownloadIcon />
                                            </ActionButton>
                                        )}
                                        {onImportTmArchiveClick && isGitHubConnected &&(
                                            <ActionButton onClick={onImportTmArchiveClick} title={STRINGS.TITLE_IMPORT_TM_ARCHIVE}>
                                                <ImportTmArchiveIcon />
                                            </ActionButton>
                                        )}
                                        {isGitHubConnected && (
                                            <ActionButton onClick={() => onOpenModal('manageTms')} title={STRINGS.TITLE_MANAGE_TMS}>
                                                <DatabaseIcon />
                                            </ActionButton>
                                        )}
                                        {onFindTmMatches && isGitHubProject && (
                                                <ActionButton onClick={onFindTmMatches} title={STRINGS.TITLE_FIND_TM_MATCHES} disabled={isFindingTms}>
                                                {isFindingTms ? <TinySpinner /> : <FindTmMatchesIcon />}
                                            </ActionButton>
                                        )}
                                        <ActionButton onClick={() => onOpenModal('autoTranslate')} title={STRINGS.AUTOTRANSLATE_HEADER_BUTTON_TITLE} disabled={isEditingDisabled}>
                                            <AutoTranslateIcon />
                                        </ActionButton>
                                        <div className="h-6 w-px bg-slate-300 mx-1"></div>
                                         <ActionButton onClick={() => onOpenModal('settings')} title={STRINGS.TITLE_SETTINGS}>
                                            <SettingsIcon />
                                        </ActionButton>
                                    </div>
                                </BoundingBox>
                            )}
                            
                             {activeTab === 'edit' && (
                                <EditToolbar 
                                    isDisabled={isEditingDisabled} 
                                    onSyncFormatting={onSyncFormatting} 
                                    isSyncingFormatting={isSyncingFormatting}
                                    onBatchSyncFormatting={onBatchSyncFormatting}
                                    isBatchSyncingFormatting={isBatchSyncingFormatting}
                                    onResegment={onResegment}
                                />
                             )}

                            {activeTab === 'review' && (
                                <BoundingBox name="review pane">
                                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                                        <ReviewToolbar
                                            isProofreaderMode={isProofreaderMode}
                                            onToggleProofreaderMode={onToggleProofreaderMode}
                                            proofreader1={proofreader1}
                                            proofreader2={proofreader2}
                                            isLeader={isLeader}
                                            onFinalizeProject={onFinalizeProject}
                                            isFinalizeDisabled={isFinalizeDisabled}
                                            onBatchReevaluate={onBatchReevaluate}
                                            isBatchEvaluating={isBatchEvaluating}
                                        />
                                        <div className="h-6 w-px bg-slate-300 mx-1"></div>
                                        <ActionButton onClick={() => onOpenModal('qaReport')} title={STRINGS.QA_CHECK_TITLE}>
                                            <QaCheckIcon />
                                        </ActionButton>
                                    </div>
                                </BoundingBox>
                            )}

                            {activeTab === 'github' && (
                                <BoundingBox name="github pane">
                                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                                        {!isGitHubConnected ? (
                                             <ActionButton onClick={() => onOpenModal('connectGitHub')} title={STRINGS.TITLE_CONNECT_GITHUB}><GitHubLogo /></ActionButton>
                                        ) : (
                                            <>
                                                <ActionButton onClick={onDisconnectFromGitHub} title={STRINGS.TITLE_DISCONNECT_GITHUB}><GitHubDisconnectIcon /></ActionButton>
                                                <div className="h-6 w-px bg-slate-300 mx-1"></div>

                                                {isGitHubProject ? (
                                                    <>
                                                        {onPull && <ActionButton onClick={onPull} title={STRINGS.TITLE_PULL_GITHUB}><PullIcon /></ActionButton>}
                                                        {onSync && <ActionButton onClick={onSync} title={STRINGS.TITLE_SYNC_GITHUB}><SyncIcon /></ActionButton>}
                                                        <ActionButton onClick={() => onOpenModal('commit')} title={STRINGS.TITLE_PUSH_CHANGES_GITHUB}><GitHubPushIcon /></ActionButton>
                                                        <ActionButton onClick={() => onOpenModal('manageUsers')} title={STRINGS.TITLE_MANAGE_USERS} disabled={!isLeader}><ManageUsersIcon/></ActionButton>
                                                        <ActionButton href={`${repoUrl}/pulls`} title={STRINGS.TITLE_PULL_REQUESTS} disabled={!repoUrl}><PullRequestIcon/></ActionButton>
                                                    </>
                                                ) : (
                                                    <ActionButton onClick={() => onOpenModal('push')} title={STRINGS.TITLE_PUSH_GITHUB}><GitHubPushIcon /></ActionButton>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </BoundingBox>
                            )}

                            {activeTab === 'dev' && (
                                <BoundingBox name="dev pane">
                                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                                        {onRebuildDocx && (
                                            <ActionButton onClick={onRebuildDocx} title={STRINGS.DEV_REBUILD_DOCX_TITLE} disabled={isRebuildingDocx}>
                                                {isRebuildingDocx ? <TinySpinner /> : <RebuildIcon />}
                                            </ActionButton>
                                        )}
                                        {onViewDocxXml && (
                                            <ActionButton onClick={onViewDocxXml} title="View Source DOCX XML" disabled={isViewingDocxXml}>
                                                {isViewingDocxXml ? <TinySpinner /> : <ViewXmlIcon />}
                                            </ActionButton>
                                        )}
                                        {onAdvancedExport && (
                                            <ActionButton onClick={onAdvancedExport} title="Advanced Export (DOCX)" disabled={isAdvancedExporting}>
                                                {isAdvancedExporting ? <TinySpinner /> : <AdvancedExportIcon />}
                                            </ActionButton>
                                        )}
                                        {onExpExport && (
                                            <ActionButton onClick={onExpExport} title="Experimental Export (DOCX)" disabled={isExpExporting}>
                                                {isExpExporting ? <TinySpinner /> : <FlaskIcon />}
                                            </ActionButton>
                                        )}
                                    </div>
                                </BoundingBox>
                            )}

                             <BoundingBox name="view pane">
                                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                                    <ActionButton onClick={toggleBoundingBoxes} title={STRINGS.TITLE_TOGGLE_DEV_VIEW}>
                                        <ViewIcon active={showBoundingBoxes} />
                                    </ActionButton>
                                </div>
                            </BoundingBox>
                        </div>

                        <div className="flex-1 flex items-center justify-end">
                            <BoundingBox name="document name">
                                <span className="text-sm font-medium text-slate-500 truncate text-right" title={documentName}>
                                    <span className="hidden sm:inline">{STRINGS.LABEL_PROJECT_PREFIX}</span>
                                    <span className="font-semibold text-slate-700">{documentName}</span>
                                </span>
                            </BoundingBox>
                        </div>
                    </div>
                </div>
            </header>
        </BoundingBox>
    );
};
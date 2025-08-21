

import React, { useState } from 'react';
import { ProjectState } from '../types';
import { BoundingBox } from './BoundingBox';
import { Logo } from './Logo';
import { stripHtml } from '../utils/fileHandlers';
import { GitHubPanel } from './GitHubPanel';
import { GitHubRepo, GitHubFile } from '../utils/githubApi';
import { STRINGS } from '../strings';

interface ProjectListViewProps {
    projects: Record<string, ProjectState>;
    onOpenFile: () => void;
    onOpenProject: (projectId: string) => void;
    onDeleteProject: (projectId: string) => void;
    onOpenGitHubProject: (repo: GitHubRepo, file: GitHubFile) => void;
    onOpenTranscriptImport: () => void;
    onOpenWebpageImport: () => void;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-t-md border-b-2 transition-colors focus:outline-none ${
            active
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
        }`}
    >
        {children}
    </button>
);


const ProjectCard: React.FC<{ project: ProjectState, onOpen: () => void, onDelete: () => void }> = ({ project, onOpen, onDelete }) => {
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${project.project.name}"? This action cannot be undone.`)) {
            onDelete();
        }
    };
    
    const totalCount = project.data.segments.length;
    const completedCount = project.data.segments.filter(s => stripHtml(s.target).trim() !== '').length;
    const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col cursor-pointer group" onClick={onOpen}>
            <div className="p-5 flex-grow flex flex-col">
                <div className="flex-grow">
                    <h3 className="text-lg font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors" title={project.project.name}>{project.project.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        {project.project.sourceLanguage || 'N/A'} → {project.project.targetLanguage || 'N/A'}
                    </p>
                    
                    {/* Completion Meter */}
                    <div className="mt-4" title={`${completedCount} of ${totalCount} segments completed`}>
                        <div className="flex justify-between mb-1">
                            <span className="text-xs font-medium text-slate-500">Progress</span>
                            <span className="text-xs font-bold text-indigo-600">{completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${completionPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
                    <p className="text-xs text-slate-500">
                        <span className="font-medium text-slate-600">Last saved: </span>
                        {new Date(project.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500" title={ project.sourceControl ? `Versioned on GitHub: ${project.sourceControl.repo}` : "Projects are stored in your browser's local storage and are not available on other devices or browsers."}>
                        <span className="font-medium text-slate-600">Location: </span>
                        {project.sourceControl ? 'GitHub' : 'Browser Storage'}
                    </p>
                </div>
            </div>
            <div className="bg-slate-50 p-3 flex justify-between items-center rounded-b-lg border-t border-slate-200">
                <span className="text-xs font-medium text-slate-600">{project.data.segments.length} segments</span>
                <button onClick={handleDelete} className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-100 p-1 rounded-md transition-colors opacity-50 group-hover:opacity-100">Delete</button>
            </div>
        </div>
    );
};

const LocalProjectsView: React.FC<Omit<ProjectListViewProps, 'onOpenGitHubProject' | 'onOpenTranscriptImport' | 'onOpenWebpageImport'>> = ({ projects, onOpenProject, onDeleteProject }) => {
    const projectList = Object.entries(projects).sort(([, a], [, b]) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

     if (projectList.length > 0) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {projectList.map(([id, project]) => (
                    <BoundingBox name={`project card ${id}`} key={id}>
                        <ProjectCard 
                            project={project}
                            onOpen={() => onOpenProject(id)}
                            onDelete={() => onDeleteProject(id)}
                        />
                    </BoundingBox>
                ))}
            </div>
        )
     }

    return (
        <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v8a2 2 0 01-2-2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-xl font-semibold text-slate-700">No local projects yet</h3>
            <p className="mt-1 text-sm text-slate-500">Click "Create Project" to start a new project from a file.</p>
        </div>
    );
};

export const ProjectListView: React.FC<ProjectListViewProps> = ({ projects, onOpenFile, onOpenProject, onDeleteProject, onOpenGitHubProject, onOpenTranscriptImport, onOpenWebpageImport }) => {
    const [activeTab, setActiveTab] = useState<'local' | 'github'>('local');
    
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                 <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Logo />
                        <div className="flex items-center gap-3">
                             <button
                                onClick={onOpenTranscriptImport}
                                title="Create a new project from a timed transcript"
                                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center gap-2"
                            >
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {STRINGS.BUTTON_OPEN_PROJECT_YOUTUBE}
                            </button>
                            <button
                                onClick={onOpenWebpageImport}
                                title="Create a new project from a webpage URL"
                                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                            >
                                {STRINGS.BUTTON_OPEN_PROJECT_WEBPAGE}
                            </button>
                            <button
                                onClick={onOpenFile}
                                title="Create a new project or open an existing .lingua file"
                                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {STRINGS.BUTTON_OPEN_PROJECT_FILE}
                            </button>
                        </div>
                    </div>
                 </div>
            </header>
            <main className="flex-grow p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Your Projects</h1>
                    <div className="border-b border-slate-200 mb-6">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <TabButton active={activeTab === 'local'} onClick={() => setActiveTab('local')}>Local Projects</TabButton>
                            <TabButton active={activeTab === 'github'} onClick={() => setActiveTab('github')}>GitHub</TabButton>
                        </nav>
                    </div>

                    {activeTab === 'local' && (
                        <LocalProjectsView 
                            projects={projects} 
                            onOpenProject={onOpenProject} 
                            onDeleteProject={onDeleteProject} 
                            onOpenFile={onOpenFile} 
                        />
                    )}
                    {activeTab === 'github' && (
                        <GitHubPanel 
                            onOpenGitHubProject={onOpenGitHubProject}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};
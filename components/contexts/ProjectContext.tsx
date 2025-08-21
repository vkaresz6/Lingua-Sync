
import React, { createContext, useContext, useMemo } from 'react';
import { Project, ProjectSettings, ProjectState } from '../../types';
import { getGitHubAuth } from '../../utils/projectManager';

export interface ProjectContextState {
    project: Project;
    settings: ProjectSettings;
    sourceControl: ProjectState['sourceControl'];
    sourceDocumentHtml: ProjectState['sourceDocumentHtml'];
    sourceFile: ProjectState['sourceFile'];
    isGitHubProject: boolean;
    isYouTubeProject: boolean;
    repoUrl: string;
    isLeader: boolean;
    documentName: string;
    sourceLanguage: string;
    targetLanguage: string;
}

const ProjectContext = createContext<ProjectContextState | undefined>(undefined);

export const ProjectProvider: React.FC<{
    projectState: ProjectState;
    children: React.ReactNode;
}> = ({ projectState, children }) => {
    
    const value = useMemo(() => {
        const isGitHubProject = !!projectState.sourceControl;
        const repoUrl = isGitHubProject ? `https://github.com/${projectState.sourceControl!.owner}/${projectState.sourceControl!.repo}` : '';
        
        const currentUserLogin = getGitHubAuth()?.login;
        let isLeader = false;
        if (currentUserLogin) {
            const user = projectState.project.contributors?.find(c => c.githubUsername === currentUserLogin);
            if (user?.roles?.includes('Owner') || user?.roles?.includes('Project Leader')) {
                isLeader = true;
            }
            // Also, owner of repo is always a leader, even if not explicitly in contributors list
            if (!isLeader && isGitHubProject && currentUserLogin === projectState.sourceControl!.owner) {
                isLeader = true;
            }
            // Fallback for older projects that haven't been migrated yet
            if (!isLeader && currentUserLogin === projectState.project.leader) {
                isLeader = true;
            }
        }

        return {
            project: projectState.project,
            settings: projectState.settings,
            sourceControl: projectState.sourceControl,
            sourceDocumentHtml: projectState.sourceDocumentHtml,
            sourceFile: projectState.sourceFile,
            isGitHubProject,
            isYouTubeProject: !!projectState.project.youtubeUrl,
            repoUrl,
            isLeader,
            documentName: projectState.project.name,
            sourceLanguage: projectState.project.sourceLanguage,
            targetLanguage: projectState.project.targetLanguage,
        };
    }, [projectState]);

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = (): ProjectContextState => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
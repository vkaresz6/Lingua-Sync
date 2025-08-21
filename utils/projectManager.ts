import { ProjectState } from '../types';

const PROJECTS_STORAGE_KEY = 'lingua-sync-projects';
const GITHUB_AUTH_KEY = 'lingua-sync-github-auth';

type ProjectsStore = Record<string, ProjectState>;

export const getProjects = (): ProjectsStore => {
    try {
        const data = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Failed to parse projects from localStorage", e);
        localStorage.removeItem(PROJECTS_STORAGE_KEY);
    }
    return {};
};

export const saveProject = (projectId: string, state: ProjectState): void => {
    try {
        const projects = getProjects();
        projects[projectId] = state;
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
        console.error("Failed to save project to localStorage", e);
        alert("Could not save project. Your browser's storage might be full.");
    }
};

export const deleteProject = (projectId: string): void => {
    try {
        const projects = getProjects();
        delete projects[projectId];
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
        console.error("Failed to delete project from localStorage", e);
    }
};

export const saveGitHubAuth = (token: string, login: string): void => {
    try {
        const auth = { token, login };
        sessionStorage.setItem(GITHUB_AUTH_KEY, JSON.stringify(auth));
    } catch (e) {
        console.error("Failed to save GitHub auth to sessionStorage", e);
    }
};

export const getGitHubAuth = (): { token: string; login: string } | null => {
    try {
        const data = sessionStorage.getItem(GITHUB_AUTH_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error("Failed to retrieve GitHub auth from sessionStorage", e);
        return null;
    }
};

export const clearGitHubAuth = (): void => {
    try {
        sessionStorage.removeItem(GITHUB_AUTH_KEY);
    } catch (e) {
        console.error("Failed to clear GitHub auth from sessionStorage", e);
    }
};

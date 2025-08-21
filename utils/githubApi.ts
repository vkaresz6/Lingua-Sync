

export interface GitHubUser {
    login: string;
    avatar_url: string;
    html_url: string;
    name: string;
}

export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    owner: {
        login: string;
    };
    description: string;
    updated_at: string;
}

export interface GitHubFile {
    name: string;
    path: string;
    sha: string;
    type: 'file' | 'dir';
    download_url: string | null;
    content?: string;
}


const GITHUB_API_BASE = 'https://api.github.com';

const makeRequest = async (token: string, endpoint: string, options: RequestInit = {}) => {
    const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
        ...options.headers,
    };

    const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, { ...options, headers });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
        throw new Error(`GitHub API Error: ${response.status} ${response.statusText} - ${errorData.message || 'No message'}`);
    }
    // For 204 No Content responses (like disconnect), return an empty object.
    if (response.status === 204) {
        return {};
    }
    return response.json();
};

export const verifyTokenAndGetUser = (token: string): Promise<GitHubUser> => {
    return makeRequest(token, '/user');
};

export const listRepos = (token: string, page = 1, perPage = 100): Promise<GitHubRepo[]> => {
    return makeRequest(token, `/user/repos?affiliation=owner,collaborator&sort=updated&per_page=${perPage}&page=${page}`);
};

export const listTms = async (token: string, owner: string, repo: string): Promise<GitHubFile[]> => {
    const tmFolderPath = 'translation_memories';
    try {
        const files = await getRepoContents(token, owner, repo, tmFolderPath);
        return files.filter(file => file.type === 'file' && file.name.endsWith('.trmem'));
    } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
            return [];
        }
        throw error;
    }
};

export const listTermDbs = async (token: string, owner: string, repo: string): Promise<GitHubFile[]> => {
    const termDbFolderPath = 'terminology_databases';
    try {
        const files = await getRepoContents(token, owner, repo, termDbFolderPath);
        return files.filter(file => file.type === 'file' && file.name.endsWith('.termdb'));
    } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
            return [];
        }
        throw error;
    }
};


export const getRepo = (token: string, owner: string, repo: string): Promise<GitHubRepo> => {
    return makeRequest(token, `/repos/${owner}/${repo}`);
};

export const createRepo = async (token: string, name: string, description: string, isPrivate: boolean): Promise<GitHubRepo> => {
    const body = {
        name,
        description,
        private: isPrivate,
    };
    return makeRequest(token, '/user/repos', {
        method: 'POST',
        body: JSON.stringify(body),
    });
};

export const getRepoContents = async (token: string, owner: string, repo: string, path: string): Promise<GitHubFile[]> => {
    const contents = await makeRequest(token, `/repos/${owner}/${repo}/contents/${path}`);
    return Array.isArray(contents) ? contents : [contents];
};

/**
 * Decodes a base64 string that was encoded with UTF-8 support.
 * @param str The base64 encoded string.
 * @returns The decoded UTF-8 string.
 */
function b64DecodeUnicode(str: string): string {
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

export const getRawFileContent = async (token: string, owner: string, repo: string, path: string): Promise<{ content: string, sha: string }> => {
    const fileData = await makeRequest(token, `/repos/${owner}/${repo}/contents/${path}`) as GitHubFile;

    if (Array.isArray(fileData)) {
        throw new Error(`Path "${path}" is a directory, not a file.`);
    }

    if (fileData.type !== 'file' || typeof fileData.content !== 'string') {
        throw new Error(`Could not retrieve file content for "${path}".`);
    }

    return { content: fileData.content, sha: fileData.sha };
};

export const getFileContent = async (token: string, owner: string, repo: string, path: string): Promise<{ content: string, sha: string }> => {
    const fileData = await makeRequest(token, `/repos/${owner}/${repo}/contents/${path}`) as GitHubFile;

    if (Array.isArray(fileData)) {
        throw new Error(`Path "${path}" is a directory, not a file.`);
    }

    if (fileData.type !== 'file' || typeof fileData.content !== 'string') {
        throw new Error(`Could not retrieve file content for "${path}". Response was not a file object with content.`);
    }

    try {
        const decodedContent = b64DecodeUnicode(fileData.content);
        return { content: decodedContent, sha: fileData.sha };
    } catch (e) {
        throw new Error(`Failed to decode file content for "${path}". Error: ${e instanceof Error ? e.message : 'Unknown decoding error'}`);
    }
};

export const commitFile = async (
    token: string,
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string,
    isBase64?: boolean,
): Promise<{ sha: string }> => {
    const encodedContent = isBase64 ? content : btoa(unescape(encodeURIComponent(content)));
    const body: { message: string; content: string; sha?: string } = {
        message,
        content: encodedContent,
    };
    if (sha) {
        body.sha = sha;
    }
    const response = await makeRequest(token, `/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
    return { sha: response.content.sha };
};

// --- AUTH HELPERS ---
const GITHUB_AUTH_KEY = 'lingua-sync-github-auth';

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

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API Client
class ApiClient {
    private baseUrl: string;
    private currentUser: any = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        // Load user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
        }
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // Authentication
    async login(username: string, password: string) {
        const data = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        
        this.currentUser = data.user;
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
    }

    async logout() {
        await this.request('/api/auth/logout', { method: 'POST' });
        this.currentUser = null;
        localStorage.removeItem('user');
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // Users
    async getUsers() {
        return this.request('/api/users');
    }

    async getUser(userId: string) {
        return this.request(`/api/users/${userId}`);
    }

    async getUserResume(userId: string) {
        return this.request(`/api/users/${userId}/resume`);
    }

    async updateUserResume(userId: string, resumeJson: any) {
        return this.request(`/api/users/${userId}/resume`, {
            method: 'PUT',
            body: JSON.stringify(resumeJson),
        });
    }



    // Jobs
    async getJobs(filters?: { platform?: string; hours?: number }) {
        const params = new URLSearchParams();
        if (filters?.platform) params.append('platform', filters.platform);
        if (filters?.hours) params.append('hours', filters.hours.toString());
        
        const query = params.toString() ? `?${params}` : '';
        return this.request(`/api/jobs${query}`);
    }

    async getJob(jobId: string) {
        return this.request(`/api/jobs/${jobId}`);
    }

    async getUnscoredJobs(userId: string) {
        return this.request(`/api/users/${userId}/jobs/unscored`);
    }

    // Scores
    async getUserScores(userId: string, recommendation?: string, limit = 20, offset = 0) {
        let query = `?limit=${limit}&offset=${offset}`;
        if (recommendation) query += `&recommendation=${recommendation}`;
        return this.request(`/api/users/${userId}/scores${query}`);
    }

    async getJobScore(userId: string, jobId: string) {
        return this.request(`/api/users/${userId}/jobs/${jobId}/score`);
    }

    // Applications
    async getUserApplications(userId: string, status?: string, limit = 20, offset = 0) {
        let query = `?limit=${limit}&offset=${offset}`;
        if (status) query += `&status=${status}`;
        return this.request(`/api/users/${userId}/applications${query}`);
    }

    async createApplication(userId: string, jobId: string, autoApply = false) {
        return this.request(`/api/users/${userId}/applications`, {
            method: 'POST',
            body: JSON.stringify({ job_id: jobId, auto_apply: autoApply }),
        });
    }

    async markAsApplied(applicationId: string) {
        return this.request(`/api/applications/${applicationId}/apply`, {
            method: 'PUT',
        });
    }

    async updateApplication(applicationId: string, updates: any) {
        return this.request(`/api/applications/${applicationId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    async markCallback(applicationId: string, notes = '') {
        return this.request(`/api/applications/${applicationId}/callback`, {
            method: 'PUT',
            body: JSON.stringify({ notes }),
        });
    }

    async getPendingAutoApplyJobs(userId: string) {
        return this.request(`/api/users/${userId}/applications/auto-apply`);
    }

    async getUserStats(userId: string) {
        return this.request(`/api/users/${userId}/stats`);
    }

    // Preferences
    async getUserPreferences(userId: string) {
        return this.request(`/api/users/${userId}/preferences`);
    }

    async updateUserPreferences(userId: string, preferences: any) {
        return this.request(`/api/users/${userId}/preferences`, {
            method: 'PUT',
            body: JSON.stringify(preferences),
        });
    }

    // Portals
    async getPortals() {
        return this.request('/api/portals');
    }

    async getUserPortals(userId: string) {
        return this.request(`/api/users/${userId}/portals`);
    }

    async updateUserPortal(userId: string, portalName: string, data: { is_enabled?: boolean; priority?: number }) {
        return this.request(`/api/users/${userId}/portals/${portalName}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
}

export const api = new ApiClient(API_BASE_URL);

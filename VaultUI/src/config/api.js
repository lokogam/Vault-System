class ApiClient {
    constructor() {
        this.baseURL = 'http://localhost:8000/api';
    }

    getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    async handleResponse(response) {
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '../index.html';
                return;
            }
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    }

    async get(endpoint) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'GET',
            headers: this.getAuthHeaders()
        });
        
        return this.handleResponse(response);
    }

    async post(endpoint, data = {}) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data)
        });
        
        return this.handleResponse(response);
    }

    async put(endpoint, data = {}) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data)
        });
        
        return this.handleResponse(response);
    }

    async delete(endpoint) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });
        
        return this.handleResponse(response);
    }

    async uploadFile(endpoint, formData, onProgress = null) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            // Configurar progreso
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = Math.round((e.loaded / e.total) * 100);
                        onProgress(percentComplete);
                    }
                });
            }

            xhr.addEventListener('load', async () => {
                try {
                    const data = JSON.parse(xhr.responseText);
                    
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(data);
                    } else {
                        if (xhr.status === 401) {
                            localStorage.removeItem('token');
                            window.location.href = '../index.html';
                            return;
                        }
                        reject(new Error(data.message || `HTTP error! status: ${xhr.status}`));
                    }
                } catch (error) {
                    reject(new Error('Error parsing response'));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error'));
            });

            const token = localStorage.getItem('token');
            xhr.open('POST', `${this.baseURL}${endpoint}`);
            
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            
            xhr.send(formData);
        });
    }
}

export const api = new ApiClient();
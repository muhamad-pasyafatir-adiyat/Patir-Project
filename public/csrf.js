window.CSRF = {
    async getToken() {
        const res = await fetch('/api/csrf-token');
        if (!res.ok) throw new Error('csrf');
        const data = await res.json();
        return data.csrfToken;
    },

    async postJson(url, payload) {
        const csrfToken = await this.getToken();
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
            body: JSON.stringify(payload)
        });
    },

    async post(url) {
        const csrfToken = await this.getToken();
        return fetch(url, {
            method: 'POST',
            headers: { 'x-csrf-token': csrfToken }
        });
    }
};

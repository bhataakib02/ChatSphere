import api from '../api';

class AuthService {
    login(username: string, password: string) {
        return api
            .post('/auth/login', {
                username,
                password
            })
            .then(response => {
                if (response.data.token) {
                    localStorage.setItem('user', JSON.stringify(response.data));
                }
                return response.data;
            });
    }

    logout() {
        localStorage.removeItem('user');
    }

    register(username: string, email: string, password: string, fullName: string) {
        return api.post('/auth/register', {
            username,
            email,
            password,
            fullName
        });
    }

    verify(username: string, code: string) {
        return api.post('/auth/verify', { username, code });
    }

    forgotPassword(email: string) {
        return api.post('/auth/forgot-password', { email });
    }

    resetPassword(email: string, code: string, newPassword: string) {
        return api.post('/auth/reset-password', { email, code, newPassword });
    }

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) return JSON.parse(userStr);
        return null;
    }
}

export default new AuthService();

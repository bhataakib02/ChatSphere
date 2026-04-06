import axios from 'axios';
import authHeader from './auth-header';

const API_URL = '/api/users';

class UserService {
    getAllUsers() {
        return axios.get(API_URL, { headers: authHeader() });
    }
}

export default new UserService();

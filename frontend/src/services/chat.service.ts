import axios from 'axios';
import authHeader from './auth-header';

const API_URL = '/api/chats/';

class ChatService {
    getUserChats(userId: number) {
        return axios.get(API_URL + 'user/' + userId, { headers: authHeader() });
    }

    createChat(name: string, isGroup: boolean, participantIds: number[]) {
        return axios.post(API_URL + 'create', {
            name,
            isGroup,
            participantIds
        }, { headers: authHeader() });
    }
}

export default new ChatService();

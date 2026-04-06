import axios from 'axios';
import authHeader from './auth-header';

const API_URL = '/api/messages/';

class MessageService {
    getChatMessages(chatId: number) {
        return axios.get(API_URL + 'chat/' + chatId, { headers: authHeader() });
    }

    uploadFile(file: File) {
        const formData = new FormData();
        formData.append("file", file);
        return axios.post(API_URL + 'upload', formData, {
            headers: {
                ...authHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });
    }
}

export default new MessageService();

import api from '../api';

class MessageService {
    getChatMessages(chatId: number) {
        return api.get(`/messages/chat/${chatId}`);
    }

    uploadFile(file: File) {
        const formData = new FormData();
        formData.append("file", file);
        return api.post('/messages/upload', formData);
    }
}

export default new MessageService();

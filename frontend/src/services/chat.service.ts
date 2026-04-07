import api from '../api';

class ChatService {
    getUserChats(userId: number) {
        return api.get(`/chats/user/${userId}`);
    }

    createChat(name: string, isGroup: boolean, participantIds: number[]) {
        return api.post('/chats/create', {
            name,
            isGroup,
            participantIds
        });
    }
}

export default new ChatService();

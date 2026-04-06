import api from '../api';

class ContactService {
    getContacts() {
        return api.get('/contacts');
    }

    searchForAdd(q: string) {
        return api.get('/contacts/search', {
            params: { q },
        });
    }

    sendRequest(receiverId: number) {
        return api.post('/contacts/requests', { receiverId });
    }

    getIncomingRequests() {
        return api.get('/contacts/requests/incoming');
    }

    getOutgoingRequests() {
        return api.get('/contacts/requests/outgoing');
    }

    acceptRequest(requestId: number) {
        return api.post(`/contacts/requests/${requestId}/accept`, {});
    }

    rejectRequest(requestId: number) {
        return api.post(`/contacts/requests/${requestId}/reject`, {});
    }

    cancelRequest(requestId: number) {
        return api.delete(`/contacts/requests/${requestId}`);
    }

    blockUser(userId: number) {
        return api.post(`/contacts/block/${userId}`, {});
    }

    unblockUser(userId: number) {
        return api.delete(`/contacts/block/${userId}`);
    }
}

export default new ContactService();

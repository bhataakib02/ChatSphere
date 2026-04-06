import axios from 'axios';
import authHeader from './auth-header';

const API = '/api/contacts';

class ContactService {
    getContacts() {
        return axios.get(API, { headers: authHeader() });
    }

    searchForAdd(q: string) {
        return axios.get(`${API}/search`, {
            headers: authHeader(),
            params: { q },
        });
    }

    sendRequest(receiverId: number) {
        return axios.post(`${API}/requests`, { receiverId }, { headers: authHeader() });
    }

    getIncomingRequests() {
        return axios.get(`${API}/requests/incoming`, { headers: authHeader() });
    }

    getOutgoingRequests() {
        return axios.get(`${API}/requests/outgoing`, { headers: authHeader() });
    }

    acceptRequest(requestId: number) {
        return axios.post(`${API}/requests/${requestId}/accept`, {}, { headers: authHeader() });
    }

    rejectRequest(requestId: number) {
        return axios.post(`${API}/requests/${requestId}/reject`, {}, { headers: authHeader() });
    }

    cancelRequest(requestId: number) {
        return axios.delete(`${API}/requests/${requestId}`, { headers: authHeader() });
    }

    blockUser(userId: number) {
        return axios.post(`${API}/block/${userId}`, {}, { headers: authHeader() });
    }

    unblockUser(userId: number) {
        return axios.delete(`${API}/block/${userId}`, { headers: authHeader() });
    }
}

export default new ContactService();

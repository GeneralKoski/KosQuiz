import { io } from 'socket.io-client';

const URL: string | undefined = import.meta.env.DEV ? undefined : window.location.origin;

let token = localStorage.getItem('kosquiz_token');
if (!token) {
  token = crypto.randomUUID();
  localStorage.setItem('kosquiz_token', token);
}

const socket = io(URL, {
  autoConnect: true,
  auth: { token },
});

export default socket;

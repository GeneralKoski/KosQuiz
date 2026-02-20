import { io } from 'socket.io-client';

const URL: string | undefined = import.meta.env.DEV ? undefined : window.location.origin;

const socket = io(URL, {
  autoConnect: true,
});

export default socket;

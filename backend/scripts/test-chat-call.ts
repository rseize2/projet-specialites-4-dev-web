// Petit test manuel : vérifie que chat + appels fonctionnent bout en bout.
// Lance le backend, puis : npx tsx scripts/test-chat-call.ts <documentId>
import { io as ioc } from 'socket.io-client';

const API = 'http://localhost';

async function login(email: string, password: string) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  return body?.data?.token as string;
}

async function main() {
  const documentId = process.argv[2];
  if (!documentId) {
    console.error('Usage : npx tsx scripts/test-chat-call.ts <documentId>');
    process.exit(1);
  }

  const aliceToken = await login('alice@test.com', 'password123');
  const bobToken = await login('bob@test.com', 'password123');
  console.log('Login OK');

  const alice = ioc(API, { auth: { token: aliceToken } });
  const bob = ioc(API, { auth: { token: bobToken } });

  await new Promise((r) => alice.on('connect', r));
  await new Promise((r) => bob.on('connect', r));
  console.log('Sockets connectées');

  bob.on('chat:message', (msg) => console.log('Bob reçoit :', msg.content));
  alice.emit('chat:send', { documentId, content: 'Salut Bob !' });

  setTimeout(() => {
    alice.close();
    bob.close();
    process.exit(0);
  }, 2000);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

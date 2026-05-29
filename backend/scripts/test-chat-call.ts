/* eslint-disable no-console */
import { io as ioc, type Socket } from 'socket.io-client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API = 'http://localhost';

async function http(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ok = (label: string, cond: boolean, extra?: unknown) => {
  console.log(`${cond ? '✅' : '❌'}  ${label}${extra !== undefined ? ' - ' + JSON.stringify(extra).slice(0, 200) : ''}`);
};

async function login(email: string, password: string) {
  const r = await http('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return r.body?.data?.token as string | undefined;
}

async function ensureUser(email: string, password: string, firstName: string, lastName: string, adminToken: string) {
  const r = await http('/api/admin/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ email, password, firstName, lastName }),
  });
  return r.status === 201 || r.status === 409;
}

function connect(token: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const s = ioc(API, { auth: { token }, transports: ['websocket', 'polling'] });
    s.on('connect', () => resolve(s));
    s.on('connect_error', (err) => reject(err));
  });
}

async function main() {
  console.log('🔐 Login admin');
  const adminToken = await login('admin@spe4.local', 'AdminSpe4!');
  ok('Admin login', !!adminToken);
  if (!adminToken) return;

  console.log('👥 S\'assurer que 2 users de test existent');
  await ensureUser('alice@test.com', 'password123', 'Alice', 'Aa', adminToken);
  await ensureUser('bob@test.com', 'password123', 'Bob', 'Bb', adminToken);

  const aliceToken = await login('alice@test.com', 'password123');
  const bobToken = await login('bob@test.com', 'password123');
  ok('Alice login', !!aliceToken);
  ok('Bob login', !!bobToken);
  if (!aliceToken || !bobToken) return;

  console.log('📄 Alice crée un document');
  const createDoc = await http('/api/documents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({ title: 'Doc de test', content: '' }),
  });
  ok('Document créé', createDoc.status === 201, createDoc.body);
  const docId = createDoc.body?.data?.id as string;
  if (!docId) return;

  console.log('🤝 Alice invite Bob (direct BDD car endpoint /invite pas encore exposé)');
  const usersList = await http('/api/admin/users?search=bob', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const bobId = usersList.body?.data?.users?.[0]?.id as string;
  await prisma.documentInvite.upsert({
    where: { documentId_userId: { documentId: docId, userId: bobId } },
    update: {},
    create: { documentId: docId, userId: bobId },
  });

  console.log('🔌 Connexion Socket.io (Alice et Bob)');
  const aliceSocket = await connect(aliceToken);
  const bobSocket = await connect(bobToken);
  ok('Alice connectée', aliceSocket.connected);
  ok('Bob connecté', bobSocket.connected);

  // ====== CHAT ======
  console.log('\n💬 === CHAT ===');
  // Les 2 rejoignent la room du doc via le gateway documents
  aliceSocket.emit('join-doc', { documentId: docId });
  bobSocket.emit('join-doc', { documentId: docId });
  await wait(200);

  // Bob écoute les messages
  const received: any[] = [];
  bobSocket.on('chat:message', (msg) => received.push(msg));

  // Alice envoie un message
  const ackChat = await new Promise<any>((resolve) =>
    aliceSocket.emit('chat:send', { documentId: docId, content: 'Salut Bob !' }, resolve),
  );
  ok('chat:send ack ok', ackChat?.ok === true, ackChat);

  await wait(300);
  ok('Bob a reçu le message', received.length === 1, received[0]);
  ok(
    'Message a le contenu attendu',
    received[0]?.content === 'Salut Bob !',
  );

  // GET /messages historique
  const history = await http(`/api/documents/${docId}/messages`, {
    headers: { Authorization: `Bearer ${bobToken}` },
  });
  ok(
    'Historique GET retourne 1 message',
    history.body?.data?.length === 1,
    history.body?.data?.[0],
  );

  // Validation : message vide rejeté
  const ackEmpty = await new Promise<any>((resolve) =>
    aliceSocket.emit('chat:send', { documentId: docId, content: '   ' }, resolve),
  );
  ok('Message vide rejeté', ackEmpty?.ok === false, ackEmpty);

  // ====== APPELS ======
  console.log('\n📞 === APPELS ===');
  // Alice rejoint
  const ackAlice = await new Promise<any>((resolve) =>
    aliceSocket.emit('call:join', { documentId: docId }, resolve),
  );
  ok('Alice call:join ok', ackAlice?.ok === true);

  // Bob écoute participant-joined
  const bobNotifs: any[] = [];
  bobSocket.on('call:participants', (d) => bobNotifs.push({ kind: 'participants', d }));
  bobSocket.on('call:participant-joined', (d) =>
    bobNotifs.push({ kind: 'participant-joined', d }),
  );

  // Bob rejoint
  const ackBob = await new Promise<any>((resolve) =>
    bobSocket.emit('call:join', { documentId: docId }, resolve),
  );
  ok('Bob call:join ok', ackBob?.ok === true);
  await wait(200);
  ok(
    "Bob reçoit la liste avec Alice déjà présente",
    bobNotifs.some(
      (n) =>
        n.kind === 'participants' &&
        n.d.participants.some((p: any) => p.socketId === aliceSocket.id),
    ),
    bobNotifs[0],
  );

  // Alice doit recevoir 'participant-joined' pour Bob
  const aliceJoined: any[] = [];
  aliceSocket.on('call:participant-joined', (d) => aliceJoined.push(d));

  // Test signal relay : Bob envoie une offer à Alice
  const aliceSignals: any[] = [];
  aliceSocket.on('call:signal', (d) => aliceSignals.push(d));
  bobSocket.emit('call:signal', {
    documentId: docId,
    to: aliceSocket.id,
    kind: 'offer',
    data: { sdp: 'fake-sdp', type: 'offer' },
  });
  await wait(300);
  ok(
    'Alice reçoit le signal de Bob',
    aliceSignals.length === 1 && aliceSignals[0].kind === 'offer',
    aliceSignals[0],
  );

  // Bob quitte
  const bobLefts: any[] = [];
  aliceSocket.on('call:participant-left', (d) => bobLefts.push(d));
  bobSocket.emit('call:leave', { documentId: docId });
  await wait(300);
  ok(
    'Alice notifiée du départ de Bob',
    bobLefts.some((d) => d.socketId === bobSocket.id),
    bobLefts[0],
  );

  // ====== ACCÈS REFUSÉ ======
  console.log('\n🚫 === ACCÈS REFUSÉ ===');
  // Créer un user "extérieur" sans accès au doc
  await ensureUser('extern@test.com', 'password123', 'Ext', 'Ern', adminToken);
  const externToken = await login('extern@test.com', 'password123');
  const externSocket = await connect(externToken!);

  const externAck = await new Promise<any>((resolve) =>
    externSocket.emit('chat:send', { documentId: docId, content: 'pwn' }, resolve),
  );
  ok(
    "User externe rejeté du chat",
    externAck?.ok === false && externAck.error === 'FORBIDDEN',
    externAck,
  );

  const externCallAck = await new Promise<any>((resolve) =>
    externSocket.emit('call:join', { documentId: docId }, resolve),
  );
  ok(
    "User externe rejeté de l'appel",
    externCallAck?.ok === false && externCallAck.error === 'FORBIDDEN',
    externCallAck,
  );

  // ====== TOKEN INVALIDE ======
  console.log('\n🛂 === TOKEN INVALIDE ===');
  try {
    await new Promise<Socket>((resolve, reject) => {
      const s = ioc(API, { auth: { token: 'invalid' }, transports: ['websocket'] });
      s.on('connect', () => resolve(s));
      s.on('connect_error', (err) => reject(err));
    });
    ok('Token invalide rejeté', false);
  } catch (err: any) {
    ok('Token invalide rejeté', err.message === 'INVALID_TOKEN', err.message);
  }

  // Cleanup
  aliceSocket.close();
  bobSocket.close();
  externSocket.close();

  // suppression du doc pour repartir propre
  await http(`/api/documents/${docId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${aliceToken}` },
  });

  await prisma.$disconnect();
  console.log('\n✨ Terminé');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

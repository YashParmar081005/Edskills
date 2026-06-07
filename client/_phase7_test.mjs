import { io } from 'socket.io-client';

const API = 'http://localhost:5500/api';
const SOCKET = 'http://localhost:5500';
const j = async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) });
const auth = (t) => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + t });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log('  PASS', m)) : (fail++, console.log('  FAIL', m)); };
const rnd = Math.floor(Math.random() * 99999);

function connect(token) {
  return new Promise((resolve, reject) => {
    const s = io(SOCKET, { auth: { token }, transports: ['websocket'], reconnection: false });
    s.on('connect', () => resolve(s));
    s.on('connect_error', (e) => reject(e));
  });
}
function waitFor(socket, event, timeout = 6000, predicate = () => true) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => { socket.off(event, h); reject(new Error('timeout: ' + event)); }, timeout);
    function h(p) { if (predicate(p)) { clearTimeout(t); socket.off(event, h); resolve(p); } }
    socket.on(event, h);
  });
}

let r, body;

// --- setup: instructor(admin) course + student enroll ---
r = await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@ailms.dev', password: 'Admin@12345' }) });
const adm = (await j(r)).body; const AH = auth(adm.accessToken); ok(!!adm.accessToken, 'instructor(admin) login');

r = await fetch(API + '/courses', { method: 'POST', headers: AH, body: JSON.stringify({ title: 'Forum Course ' + rnd, category: 'Development' }) });
const cid = (await j(r)).body.course._id;
r = await fetch(API + '/courses/' + cid + '/modules', { method: 'POST', headers: AH, body: JSON.stringify({ title: 'M' }) });
const mid = (await j(r)).body.module._id;
await fetch(API + '/modules/' + mid + '/lessons', { method: 'POST', headers: AH, body: JSON.stringify({ title: 'L', type: 'text', content: 'x' }) });
await fetch(API + '/courses/' + cid + '/publish', { method: 'POST', headers: AH, body: JSON.stringify({}) });

r = await fetch(API + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Forum Stu', email: 'fs' + rnd + '@demo.dev', password: 'Passw0rd!', role: 'student' }) });
const stu = (await j(r)).body; const SH = auth(stu.accessToken);
await fetch(API + '/courses/' + cid + '/enroll', { method: 'POST', headers: SH });

// --- connect sockets ---
const iSock = await connect(adm.accessToken);
const sSock = await connect(stu.accessToken);
ok(iSock.connected && sSock.connected, 'both sockets connected (authenticated)');

// non-enrolled access blocked
r = await fetch(API + '/courses/' + cid + '/threads', { headers: auth('bad.token') });
ok(r.status === 401, 'invalid token blocked from forum (401)');

// --- TEST A: new thread notifies the instructor in real time ---
const instrNotif = waitFor(iSock, 'notification:new', 6000, (n) => n.type === 'thread');
r = await fetch(API + '/courses/' + cid + '/threads', { method: 'POST', headers: SH, body: JSON.stringify({ title: 'How do closures work?', body: 'Confused about scope.' }) });
const thread = (await j(r)).body.thread; const tid = thread._id;
ok(!!tid, 'student created thread');
try { const n = await instrNotif; ok(n.type === 'thread', 'instructor got LIVE notification on new thread'); }
catch { ok(false, 'instructor got LIVE notification on new thread'); }

// --- TEST B: instructor reply appears live for student in the thread room ---
sSock.emit('thread:join', tid);
iSock.emit('thread:join', tid);
await sleep(400); // let room joins settle
const liveUpdate = waitFor(sSock, 'thread:update', 6000, (p) => String(p.threadId) === String(tid));
const studentNotif = waitFor(sSock, 'notification:new', 6000, (n) => n.type === 'reply');
r = await fetch(API + '/threads/' + tid + '/replies', { method: 'POST', headers: AH, body: JSON.stringify({ body: 'A closure captures its lexical scope.' }) });
const reply = (await j(r)).body.reply; const rid = reply._id;
ok(!!rid, 'instructor posted reply');
try { await liveUpdate; ok(true, 'student got LIVE thread:update on new reply'); }
catch { ok(false, 'student got LIVE thread:update on new reply'); }
try { const n = await studentNotif; ok(n.type === 'reply', 'thread author got LIVE reply notification'); }
catch { ok(false, 'thread author got LIVE reply notification'); }

// --- REST: upvote, mark answer ---
r = await fetch(API + '/threads/' + tid + '/upvote', { method: 'POST', headers: SH }); ({ body } = await j(r));
ok(body.upvoteCount === 1 && body.hasUpvoted, 'upvote thread -> count 1');
r = await fetch(API + '/threads/' + tid + '/upvote', { method: 'POST', headers: SH }); ({ body } = await j(r));
ok(body.upvoteCount === 0, 'toggle upvote off -> count 0');

r = await fetch(API + '/replies/' + rid + '/answer', { method: 'POST', headers: AH }); ({ body } = await j(r));
ok(body.isAnswer === true, 'instructor marked reply as answer');
r = await fetch(API + '/threads/' + tid, { headers: SH }); ({ body } = await j(r));
ok(body.replies[0].isAnswer === true && body.canModerate === false, 'getThread reflects answer; student !canModerate');

// student tries to mark answer on own thread? student IS thread author -> allowed. Try a different student.
r = await fetch(API + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Other', email: 'ot' + rnd + '@demo.dev', password: 'Passw0rd!', role: 'student' }) });
const OH = auth((await j(r)).body.accessToken);
await fetch(API + '/courses/' + cid + '/enroll', { method: 'POST', headers: OH });
r = await fetch(API + '/replies/' + rid + '/answer', { method: 'POST', headers: OH });
ok(r.status === 403, 'non-author/non-owner cannot mark answer (403)');

// --- notifications REST ---
r = await fetch(API + '/notifications', { headers: SH }); ({ body } = await j(r));
ok(body.unreadCount >= 1 && body.notifications.length >= 1, 'student has unread notifications');
const firstId = body.notifications[0]._id;
r = await fetch(API + '/notifications/' + firstId + '/read', { method: 'POST', headers: SH }); ({ body } = await j(r));
ok(typeof body.unreadCount === 'number', 'mark one read returns unreadCount');
r = await fetch(API + '/notifications/read-all', { method: 'POST', headers: SH }); ({ body } = await j(r));
ok(body.unreadCount === 0, 'mark all read -> unreadCount 0');

// cleanup
iSock.disconnect(); sSock.disconnect();
await fetch(API + '/courses/' + cid, { method: 'DELETE', headers: AH });

console.log('\n  RESULT: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);

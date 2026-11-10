import { db } from './firebase-config.js'; 
import { collection, addDoc, onSnapshot, doc, serverTimestamp, query, where, getDocs, writeBatch, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- SABİTLER VE TANIMLAR (cırt.docx verileri) ---
const ROLES = {
    villager: { title: "Köylü", team: "İyiler", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30", icon: "fa-wheat-awn", desc: "Özel yeteneği yoktur. Sadece gündüz konuşur ve oy verir." },
    seer:     { title: "Kahin", team: "İyiler", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "fa-eye", desc: "Her gece 1 kişinin rolünü öğrenir." },
    doctor:   { title: "Doktor", team: "İyiler", color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/30", icon: "fa-user-nurse", desc: "Her gece bir kişiyi korur. Kendini koruyamaz, üst üste aynı kişiyi koruyamaz." },
    inspector:{ title: "Müfettiş", team: "İyiler", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30", icon: "fa-magnifying-glass", desc: "Bir kişinin hangi tarafta olduğunu (iyi/kötü/nötr) öğrenir." },
    witch:    { title: "Cadı", team: "İyiler", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", icon: "fa-hat-wizard", desc: "Zehirlenen birini kurtarma veya birini zehirleme hakkı vardır." },
    hunter:   { title: "Avcı", team: "İyiler", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: "fa-crosshairs", desc: "El başına bir adet öldürme hakkı bulunur." },
    guard:    { title: "Muhafız", team: "İyiler", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30", icon: "fa-shield-halved", desc: "Bir kişinin gece yeteneğini iptal eder." },
    leader:   { title: "Köy Reisi", team: "İyiler", color: "text-green-300", bg: "bg-green-500/10", border: "border-green-500/30", icon: "fa-gavel", desc: "Oyu 2 sayılır. Susturucu tarafından susturulamaz." },
    vampire:  { title: "Vampir", team: "Kötüler", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", icon: "fa-bat", desc: "Gece ekipçe 1 kişiyi öldürür." },
    lord:     { title: "Lord Vampir", team: "Kötüler", color: "text-red-600", bg: "bg-red-600/10", border: "border-red-600/30", icon: "fa-crown", desc: "Oylama haricinde öldürülemez." },
    diseased: { title: "Hasta", team: "Kötüler", color: "text-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: "fa-virus", desc: "Zehirlediği kişi bir sonraki turda ölür." },
    silencer: { title: "Susturucu", team: "Kötüler", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/30", icon: "fa-comment-slash", desc: "Bir kişiyi bir günlüğüne susturur." },
    jester:   { title: "Soytarı", team: "Tarafsız", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/30", icon: "fa-masks-theater", desc: "Kendini astırmaya çalışır. Öldürülemez." },
    avenger:  { title: "İntikamcı", team: "Tarafsız", color: "text-amber-700", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "fa-fire", desc: "Seçtiği hedefi astırırsa kazanır." },
    lovers:   { title: "Aşık", team: "Tarafsız", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", icon: "fa-heart", desc: "Eşinle hayatta kal." }
};

const DEFAULT_DISTRIBUTIONS = {
    6: { villager: 5, vampire: 1 },
    7: { villager: 5, vampire: 2 },
    8: { villager: 6, vampire: 2 },
    9: { villager: 7, vampire: 2 },
    10: { villager: 5, vampire: 2, doctor: 1, seer: 1, jester: 1 },
    11: { villager: 6, vampire: 3, doctor: 1, seer: 1, jester: 1 },
    12: { villager: 6, vampire: 3, doctor: 1, seer: 1, jester: 1 },
    13: { villager: 6, vampire: 3, doctor: 1, seer: 1, jester: 1, hunter: 1 },
    14: { villager: 7, vampire: 3, doctor: 1, seer: 1, jester: 1, hunter: 1 },
    15: { villager: 7, vampire: 3, doctor: 1, seer: 1, jester: 1, guard: 1, hunter: 1 },
    16: { villager: 7, vampire: 3, doctor: 1, seer: 1, jester: 1, guard: 1, hunter: 1, lord: 1 },
    17: { villager: 8, vampire: 3, doctor: 1, seer: 1, jester: 1, guard: 1, hunter: 1, lord: 1 },
    18: { villager: 8, vampire: 4, doctor: 1, inspector: 1, guard: 1, hunter: 1, lord: 1, witch: 1, jester: 1 },
    19: { villager: 7, vampire: 3, doctor: 1, hunter: 1, jester: 1, guard: 1, lord: 1, inspector: 1, witch: 1, avenger: 1, diseased: 1 },
};

let currentRoomId = localStorage.getItem('vampir_room_id');
let myPlayerId = localStorage.getItem('vampir_player_id');
let myRoleType = localStorage.getItem('vampir_role_type');
let timerInterval;

let activeRoleCounts = {}; 
let currentTotalPlayers = 0;

const safeText = (id, text) => { const el = document.getElementById(id); if(el) el.innerText = text; };

// --- GLOBAL PENCERE YÖNETİMİ ---
window.openScreen = (screenId) => {
    ['landingScreen', 'createScreen', 'joinScreen', 'adminPanel', 'playerLobby', 'gameScreen'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });
    const target = document.getElementById(screenId);
    if(target) target.classList.remove('hidden');
    if(screenId === 'joinScreen') loadRooms();
};

window.toggleRoleInfo = () => {
    const el = document.getElementById('roleInfoModal');
    if(el.classList.contains('hidden')) {
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
    }
};

if (currentRoomId && myRoleType) {
    if (myRoleType === 'admin') initAdmin();
    else if (myRoleType === 'player') initPlayer();
    else openScreen('landingScreen');
} else {
    openScreen('landingScreen');
}

// --- ODA YÖNETİMİ ---
document.getElementById('createForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('createBtn');
    btn.disabled = true; btn.innerText = "Oluşturuluyor...";
    const roomName = document.getElementById('newRoomName').value.trim();
    if(!roomName) return;

    try {
        // isStarted: false varsayılan olarak ekleniyor
        const roomRef = await addDoc(collection(db, "vampireRooms"), { 
            name: roomName, 
            isStarted: false, 
            createdAt: serverTimestamp() 
        });
        localStorage.setItem('vampir_room_id', roomRef.id);
        localStorage.setItem('vampir_role_type', 'admin');
        currentRoomId = roomRef.id;
        initAdmin();
    } catch(err) { alert(err.message); btn.disabled = false; }
});

// --- KATILMA VE KİLİT KONTROLÜ ---
document.getElementById('joinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('joinBtn');
    btn.disabled = true; 
    const roomId = document.getElementById('roomSelect').value;
    const name = document.getElementById('playerName').value.trim();
    if(!roomId || !name) { btn.disabled = false; return; }

    try {
        // 1. Odayı Kontrol Et
        const roomRef = doc(db, "vampireRooms", roomId);
        const roomSnap = await getDoc(roomRef);
        
        if (!roomSnap.exists()) {
             alert("Oda bulunamadı!");
             btn.disabled = false;
             return;
        }

        if (roomSnap.data().isStarted) {
             alert("⚠️ Bu odada oyun başladı, şu an katılamazsınız!");
             btn.disabled = false;
             return;
        }

        // 2. Oyuncuyu Ekle
        const playerRef = await addDoc(collection(db, "vampirePlayers"), {
            roomId: roomId, name: name, role: null, isAlive: true, votes: 0, joinedAt: serverTimestamp()
        });
        localStorage.setItem('vampir_room_id', roomId);
        localStorage.setItem('vampir_player_id', playerRef.id);
        localStorage.setItem('vampir_role_type', 'player');
        currentRoomId = roomId; myPlayerId = playerRef.id;
        initPlayer();
    } catch(err) { alert(err.message); btn.disabled = false; }
});

window.loadRooms = async () => {
    const select = document.getElementById('roomSelect');
    if(!select) return;
    select.innerHTML = '<option>Yükleniyor...</option>';
    const q = query(collection(db, "vampireRooms")); 
    const snap = await getDocs(q);
    select.innerHTML = '<option value="" disabled selected>Oda Seçiniz...</option>';
    snap.forEach(doc => {
        const data = doc.data();
        const opt = document.createElement('option');
        opt.value = doc.id; 
        // Başlayan oyunları listede belirt ve pasif yap
        if (data.isStarted) {
            opt.text = `${data.name} (OYUN BAŞLADI)`;
            opt.disabled = true;
        } else {
            opt.text = data.name;
        }
        select.appendChild(opt);
    });
};

// --- ADMIN MANTIĞI ---
function initAdmin() {
    openScreen('adminPanel');
    
    onSnapshot(doc(db, "vampireRooms", currentRoomId), (docSnap) => {
        if(!docSnap.exists()) { logout(); return; }
        const data = docSnap.data();
        safeText('adminRoomDisplay', data.name);
    });

    const q = query(collection(db, "vampirePlayers"), where("roomId", "==", currentRoomId));
    onSnapshot(q, (snapshot) => {
        let players = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
        players.sort((a, b) => (a.joinedAt?.seconds || 0) - (b.joinedAt?.seconds || 0));
        
        if (players.length !== currentTotalPlayers) {
            currentTotalPlayers = players.length;
            applyDefaultDistribution(currentTotalPlayers);
        }

        safeText('totalPlayerCount', currentTotalPlayers);
        renderPlayerList(players);
        renderRoleConfig(); 
    });
}

function applyDefaultDistribution(count) {
    let defaults = DEFAULT_DISTRIBUTIONS[count];
    if (!defaults) {
        if (count < 6) defaults = { villager: count > 0 ? count - 1 : 0, vampire: 1 };
        else defaults = DEFAULT_DISTRIBUTIONS[19]; 
    }
    activeRoleCounts = {};
    Object.keys(ROLES).forEach(key => activeRoleCounts[key] = 0);
    Object.entries(defaults).forEach(([role, num]) => {
        if(activeRoleCounts[role] !== undefined) activeRoleCounts[role] = num;
    });
    let assigned = Object.values(activeRoleCounts).reduce((a,b)=>a+b,0);
    if(assigned < count && activeRoleCounts['villager'] !== undefined) {
        activeRoleCounts['villager'] += (count - assigned);
    }
}

function renderRoleConfig() {
    const listEl = document.getElementById('roleConfigList');
    if(!listEl) return;
    let totalAssigned = Object.values(activeRoleCounts).reduce((a, b) => a + b, 0);
    const totalCountEl = document.getElementById('totalRoleCount');
    if(totalCountEl) {
        totalCountEl.innerText = totalAssigned;
        totalCountEl.className = totalAssigned === currentTotalPlayers ? "text-green-400 font-bold" : "text-red-500 font-bold";
    }
    listEl.innerHTML = Object.keys(ROLES).map(key => {
        const roleDef = ROLES[key];
        const count = activeRoleCounts[key] || 0;
        return `
            <div class="flex items-center justify-between bg-slate-900/50 p-1.5 rounded border border-white/5">
                <div class="flex items-center gap-2">
                    <i class="${roleDef.icon} ${roleDef.color} w-4 text-center"></i>
                    <span class="text-xs text-slate-300 font-medium">${roleDef.title}</span>
                </div>
                <div class="flex items-center bg-slate-800 rounded">
                    <button onclick="window.updateRoleCount('${key}', -1)" class="w-6 h-6 hover:bg-slate-700 text-slate-400">-</button>
                    <span class="w-6 text-center text-xs font-bold ${count > 0 ? 'text-white' : 'text-slate-600'}">${count}</span>
                    <button onclick="window.updateRoleCount('${key}', 1)" class="w-6 h-6 hover:bg-slate-700 text-slate-400">+</button>
                </div>
            </div>
        `;
    }).join('');
}

window.updateRoleCount = (key, delta) => {
    const current = activeRoleCounts[key] || 0;
    const newVal = Math.max(0, current + delta);
    activeRoleCounts[key] = newVal;
    renderRoleConfig();
};

function renderPlayerList(players) {
    const listEl = document.getElementById('adminPlayerList');
    if(!listEl) return;
    if(players.length === 0) { listEl.innerHTML = '<div class="text-center text-slate-600 text-xs">Kimse yok.</div>'; return; }

    listEl.innerHTML = players.map(p => {
        const isDead = !p.isAlive;
        const roleDef = ROLES[p.role];
        const roleName = roleDef ? roleDef.title : '-';
        const roleColor = roleDef ? roleDef.color : 'text-slate-500';
        
        return `
            <div class="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-white/5 ${isDead ? 'opacity-50 grayscale' : ''}">
                <div class="flex flex-col leading-none">
                    <span class="font-bold text-xs text-slate-200 ${isDead ? 'line-through' : ''}">${p.name}</span>
                    <span class="text-[9px] ${roleColor} font-bold mt-0.5">${roleName}</span>
                </div>
                <div class="flex items-center gap-1">
                    <div class="flex items-center bg-slate-950 rounded px-1 border border-white/5">
                        <button onclick="window.vote('${p.id}', -1)" class="text-slate-500 hover:text-white px-1">-</button>
                        <span class="text-yellow-500 font-mono text-xs w-4 text-center">${p.votes || 0}</span>
                        <button onclick="window.vote('${p.id}', 1)" class="text-blue-500 hover:text-blue-400 px-1">+</button>
                    </div>
                    ${!isDead ? `<button onclick="window.kill('${p.id}')" class="w-6 h-6 flex items-center justify-center text-xs text-red-500 bg-red-900/10 rounded hover:bg-red-900/30"><i class="fa-solid fa-skull"></i></button>` : ''}
                    <button onclick="window.kick('${p.id}')" class="w-6 h-6 flex items-center justify-center text-xs text-slate-600 hover:text-white"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

window.addBotsModal = async () => {
    const countStr = prompt("Kaç bot eklensin?", "1");
    const count = parseInt(countStr);
    if(!count) return;
    const batch = writeBatch(db);
    for(let i=0; i<count; i++) {
        const ref = doc(collection(db, "vampirePlayers"));
        batch.set(ref, { roomId: currentRoomId, name: `Bot ${Math.floor(Math.random()*900)+100}`, role: null, isAlive: true, votes: 0, joinedAt: serverTimestamp() });
    }
    await batch.commit();
};

window.distributeRoles = async () => {
    let totalAssigned = Object.values(activeRoleCounts).reduce((a, b) => a + b, 0);
    if (totalAssigned !== currentTotalPlayers) {
        alert(`Hata: ${currentTotalPlayers} oyuncu var ama ${totalAssigned} rol seçili. Lütfen sayıları eşitleyin.`);
        return;
    }

    let roleDeck = [];
    Object.entries(activeRoleCounts).forEach(([roleKey, count]) => {
        for(let i=0; i<count; i++) roleDeck.push(roleKey);
    });
    roleDeck.sort(() => Math.random() - 0.5);

    const q = query(collection(db, "vampirePlayers"), where("roomId", "==", currentRoomId));
    const snap = await getDocs(q);
    let players = snap.docs.map(d => d.id);
    
    const batch = writeBatch(db);
    players.forEach((pid, index) => {
        if(roleDeck[index]) {
            batch.update(doc(db, "vampirePlayers", pid), { role: roleDeck[index], isAlive: true, votes: 0 });
        }
    });
    
    // OYUNU KİLİTLE (BAŞLAT)
    batch.update(doc(db, "vampireRooms", currentRoomId), { isStarted: true });
    
    await batch.commit();
};

window.resetRolesOnly = async () => {
    if(!confirm("Roller sıfırlanacak ve oda kilidi açılacak?")) return;
    const q = query(collection(db, "vampirePlayers"), where("roomId", "==", currentRoomId));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.forEach(d => batch.update(d.ref, { role: null, votes: 0, isAlive: true }));
    
    // ODA KİLİDİNİ AÇ (YENİ OYUNCU GELEBİLİR)
    batch.update(doc(db, "vampireRooms", currentRoomId), { isStarted: false });
    
    await batch.commit();
};

window.deleteRoom = async () => {
    if(!confirm("Odayı ve oyuncuları kalıcı olarak silmek istediğinize emin misiniz?")) return;
    
    try {
        // 1. Oyuncuları Bul
        const q = query(collection(db, "vampirePlayers"), where("roomId", "==", currentRoomId));
        const snap = await getDocs(q);
        
        // 2. Batch ile Sil (Chunking: 500 limiti için)
        const batchSize = 400; 
        const docs = snap.docs;
        const chunks = [];

        for (let i = 0; i < docs.length; i += batchSize) {
            chunks.push(docs.slice(i, i + batchSize));
        }

        // Her parça için ayrı batch çalıştır
        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(d => batch.delete(d.ref));
            await batch.commit();
        }

        // 3. Odayı Sil (Oyuncular bittikten sonra)
        await deleteDoc(doc(db, "vampireRooms", currentRoomId));
        
        logout();
    } catch(e) {
        console.error(e);
        alert("Silme işleminde hata oluştu: " + e.message);
    }
};

window.vote = async (pid, delta) => {
    const ref = doc(db, "vampirePlayers", pid);
    const s = await getDoc(ref);
    if(s.exists()) {
        const nv = Math.max(0, (s.data().votes || 0) + delta);
        await updateDoc(ref, { votes: nv });
    }
};

window.kill = async (pid) => { if(confirm("Öldür?")) await updateDoc(doc(db, "vampirePlayers", pid), { isAlive: false }); };
window.kick = async (pid) => { if(confirm("At?")) await deleteDoc(doc(db, "vampirePlayers", pid)); };
window.startTimer = (sec) => { clearInterval(timerInterval); let t = sec; const el = document.getElementById('timerDisplay'); el.innerText = t; timerInterval = setInterval(() => { t--; el.innerText = t; if(t <= 0) { clearInterval(timerInterval); el.innerText = "BİTTİ"; } }, 1000); };
window.stopTimer = () => { clearInterval(timerInterval); document.getElementById('timerDisplay').innerText = "00:00"; };

function initPlayer() {
    onSnapshot(doc(db, "vampireRooms", currentRoomId), (docSnap) => {
        if(!docSnap.exists()) { logout(); return; }
        const data = docSnap.data();
        safeText('lobbyRoomName', data.name);
    });

    onSnapshot(doc(db, "vampirePlayers", myPlayerId), (docSnap) => {
        if(!docSnap.exists()) { logout(); return; }
        const data = docSnap.data();
        if(!data.role) {
            openScreen('playerLobby');
        } else {
            openScreen('gameScreen');
            renderRoleCard(data);
        }
    });
}

function renderRoleCard(data) {
    const el = (id) => document.getElementById(id);
    const isDead = !data.isAlive;
    const roleDef = ROLES[data.role] || ROLES['villager']; 

    if(isDead) {
        el('roleCard').classList.add('grayscale', 'opacity-20');
        el('deadBadge').classList.remove('hidden');
    } else {
        el('roleCard').classList.remove('grayscale', 'opacity-20');
        el('deadBadge').classList.add('hidden');
    }

    el('roleTitle').innerText = roleDef.title;
    el('roleTitle').className = `text-3xl font-black mb-3 uppercase drop-shadow-lg tracking-wide ${roleDef.color}`;
    el('roleDesc').innerText = roleDef.desc;
    el('roleIcon').className = `text-6xl relative z-10 ${roleDef.icon} ${roleDef.color}`;
    el('teamBadge').innerText = roleDef.team;
    el('teamBadge').className = `inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6 border ${roleDef.border} ${roleDef.bg} ${roleDef.color}`;
    const glowColor = roleDef.team === 'Kötüler' ? 'bg-red-500' : (roleDef.team === 'İyiler' ? 'bg-blue-500' : 'bg-purple-500');
    el('roleGlow').className = `absolute inset-0 blur-3xl opacity-20 ${glowColor}`;
}

window.logout = () => {
    localStorage.removeItem('vampir_room_id');
    localStorage.removeItem('vampir_player_id');
    localStorage.removeItem('vampir_role_type');
    window.location.reload();
};

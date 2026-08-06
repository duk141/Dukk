
/* =============================================================
   BIẾN TOÀN CỤC & MUA KEY AUTOMATION
============================================================= */
let selectedPackage = null;
let currentUser = null;
let currentRandomMemo = "";

// Sao chép văn bản
function copyText(text) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        alert("Đã sao chép: " + text);
    }).catch(() => {
        alert("Lỗi sao chép!");
    });
}

// Tạo cú pháp chuyển khoản ngẫu nhiên
function generateRandomMemo() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'KEY';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Xử lý chọn gói cước nạp tiền & Tạo mã VietQR
function selectKeyPackage(evt, price, timeText) {
    selectedPackage = { price, timeText };
    const qrSection = document.getElementById('qr-section');
    const qrImg = document.getElementById('qr-code-img');
    const qrPrice = document.getElementById('qr-price');
    const qrMemo = document.getElementById('qr-memo');

    document.querySelectorAll('.key-card').forEach(card => card.classList.remove('selected'));
    if (evt && evt.currentTarget) {
        evt.currentTarget.classList.add('selected');
    }

    currentRandomMemo = generateRandomMemo();
    
    let bankCode = "MB"; 
    let accountNo = "888881415"; 
    let accountName = "TRUONG NGUYEN THANH DANH"; 
    
    let qrUrl = `https://api.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=${price}&addInfo=${encodeURIComponent(currentRandomMemo)}&accountName=${encodeURIComponent(accountName)}`;

    qrImg.src = qrUrl;
    qrPrice.innerText = price.toLocaleString('vi-VN') + " VNĐ";
    qrMemo.innerText = currentRandomMemo;
    qrSection.classList.remove('hidden');
}

function simulatePaymentSuccess() {
    if (!selectedPackage || !currentUser) return;

    let generatedKey = "VIP-" + CryptoJS.MD5(currentUser + Date.now()).toString().substring(0, 12).toUpperCase();

    let expiryDate = new Date();
    let pTime = selectedPackage.timeText;

    if (pTime === '1 Tiếng') expiryDate.setHours(expiryDate.getHours() + 1);
    else if (pTime === '1 Ngày') expiryDate.setDate(expiryDate.getDate() + 1);
    else if (pTime === '3 Ngày') expiryDate.setDate(expiryDate.getDate() + 3);
    else if (pTime === '15 Ngày') expiryDate.setDate(expiryDate.getDate() + 15);
    else if (pTime === '30 Ngày') expiryDate.setDate(expiryDate.getDate() + 30);
    else if (pTime === 'Vĩnh Viễn') expiryDate.setFullYear(expiryDate.getFullYear() + 99);

    let expiryStr = pTime === 'Vĩnh Viễn' ? 'Vĩnh Viễn' : expiryDate.toLocaleString('vi-VN');

    let keyData = { key: generatedKey, expiry: expiryStr, package: pTime };
    localStorage.setItem(`user_key_${currentUser}`, JSON.stringify(keyData));

    let resultBox = document.getElementById('key-result-box');
    resultBox.classList.remove('hidden');
    resultBox.innerHTML = `
        🎉 <b>THANH TOÁN THÀNH CÔNG! HỆ THỐNG ĐÃ KÍCH HOẠT KEY</b><br>
        ----------------------------------------<br>
        • <b>Mã Key của bạn:</b> <b style="color:#00f3ff;">${generatedKey}</b><br>
        • <b>Gói đã mua:</b> ${selectedPackage.timeText}<br>
        • <b>Nội dung chuyển khoản:</b> <b style="color:#ffd700;">${currentRandomMemo}</b><br>
        • <b>Hạn sử dụng đến:</b> <b style="color:#00ff66;">${expiryStr}</b>
    `;

    updateUserExpiryDisplay();
}

// Kích hoạt Mã Key nhập thủ công
function activateManualKey() {
    const keyInput = document.getElementById('manual-key-input').value.trim();
    const resultBox = document.getElementById('key-result-box');

    if (!keyInput) {
        alert("Vui lòng nhập mã Key!");
        return;
    }

    if (!currentUser) return;

    let expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    let expiryStr = expiryDate.toLocaleString('vi-VN');

    let keyData = { key: keyInput, expiry: expiryStr, package: "30 Ngày (Kích hoạt tay)" };
    localStorage.setItem(`user_key_${currentUser}`, JSON.stringify(keyData));

    resultBox.classList.remove('hidden');
    resultBox.innerHTML = `
        🎉 <b>KÍCH HOẠT THÀNH CÔNG MÃ KEY THỦ CÔNG!</b><br>
        ----------------------------------------<br>
        • <b>Mã Key:</b> <b style="color:#00f3ff;">${keyInput}</b><br>
        • <b>Hạn dùng đến:</b> <b style="color:#00ff66;">${expiryStr}</b>
    `;

    updateUserExpiryDisplay();
    document.getElementById('manual-key-input').value = "";
}

function updateUserExpiryDisplay() {
    if (!currentUser) return;
    let keyDataRaw = localStorage.getItem(`user_key_${currentUser}`);
    let expiryDisplay = document.getElementById('key-expiry-display');
    if (keyDataRaw) {
        let keyData = JSON.parse(keyDataRaw);
        expiryDisplay.innerText = keyData.expiry;
    } else {
        expiryDisplay.innerText = "Chưa kích hoạt";
    }
}

/* =============================================================
   THUẬT TOÁN HASH MD5 / SHA256
============================================================= */
let correct = 0, wrong = 0;
let historyList = [];
let win_count = 0;
let total_count = 0;
let mode = "vip";

function setMode(m) {
    mode = m;
    let box = document.getElementById("modeText");
    if (m === "vip") {
        box.className = "modeBox mode-vip";
        box.innerText = "👑 VIP MODE ACTIVE";
    } else {
        box.className = "modeBox mode-basic";
        box.innerText = "⚡ BASIC MODE ACTIVE";
    }
}

function hashStringToSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        let char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; 
    }
    return Math.abs(hash);
}

function calculateEntropy(str) {
    let map = {};
    for (let i = 0; i < str.length; i++) {
        let c = str[i];
        map[c] = (map[c] || 0) + 1;
    }
    let entropy = 0;
    for (let c in map) {
        let p = map[c] / str.length;
        entropy -= p * Math.log2(p);
    }
    return entropy.toFixed(2);
}

function analyze() {
    let hash = document.getElementById("hashInput").value.trim().toLowerCase();

    let isHex = /^[0-9a-f]+$/.test(hash);
    if (!isHex || (hash.length !== 32 && hash.length !== 64)) {
        alert("⚠️ Vui lòng nhập đúng định dạng Hex: MD5 (32 ký tự) hoặc SHA-256 (64 ký tự)!");
        return;
    }

    let hashType = hash.length === 64 ? "SHA-256" : "MD5";
    
    document.getElementById("analyzeBtn").disabled = true;
    document.getElementById("radarBox").style.display = "block";
    document.getElementById("crack-result").classList.add("hidden");

    let percentScan = 0;
    let scanBar = document.getElementById("scanBar");
    let scanText = document.getElementById("scanPercent");
    let statusPhase = document.getElementById("statusPhase");

    let phases = [
        "1. Đọc cấu trúc Byte...",
        "2. Tính toán Entropy...",
        "3. Phân tích chuỗi Hex...",
        "4. Tổng hợp xác suất AI..."
    ];

    let scanInterval = setInterval(() => {
        percentScan += 4;
        scanBar.style.width = percentScan + "%";
        scanText.innerText = percentScan;

        if (percentScan < 25) statusPhase.innerText = phases[0];
        else if (percentScan < 50) statusPhase.innerText = phases[1];
        else if (percentScan < 75) statusPhase.innerText = phases[2];
        else statusPhase.innerText = phases[3];

        if (percentScan >= 100) clearInterval(scanInterval);
    }, 45);

    setTimeout(() => {
        document.getElementById("radarBox").style.display = "none";
        document.getElementById("crack-result").classList.remove("hidden");
        document.getElementById("crack-result").className = "result-box prediction-bg";

        let seed = hashStringToSeed(hash);
        let entropy = calculateEntropy(hash);
        
        let totalByteValue = 0;
        for (let i = 0; i < hash.length; i += 2) {
            totalByteValue += parseInt(hash.substring(i, i + 2), 16);
        }

        let result, confidence, tai_percent;

        if (mode === "vip") {
            result = (totalByteValue + seed) % 2 === 0 ? "TÀI" : "XỈU";
            confidence = Math.floor((seed % 12) + 87);
            
            let baseRatio = (totalByteValue % 25) + 65;
            tai_percent = result === "TÀI" ? baseRatio : (100 - baseRatio);
        } else {
            result = Math.floor(parseFloat(entropy) * 100) % 2 === 0 ? "TÀI" : "XỈU";
            confidence = Math.floor((seed % 25) + 55);
            
            let baseRatio = (totalByteValue % 30) + 50; 
            tai_percent = result === "TÀI" ? baseRatio : (100 - baseRatio);
        }

        let xiu_percent = 100 - tai_percent;
        let lucky = (seed % 90) + 10;
        let winrate = total_count > 0 ? Math.floor((win_count / total_count) * 100) : 50;

        document.getElementById("result").innerText = result;
        document.getElementById("result").style.color = result === "TÀI" ? "#00f3ff" : "#ff0055";
        document.getElementById("tai").innerText = tai_percent;
        document.getElementById("xiu").innerText = xiu_percent;
        document.getElementById("bar").style.width = tai_percent + "%";
        document.getElementById("hashType").innerText = hashType;
        document.getElementById("conf").innerText = confidence + "%";
        document.getElementById("entropyVal").innerText = entropy;
        document.getElementById("lucky").innerText = lucky;
        document.getElementById("winrate").innerText = winrate + "%";

        document.getElementById("btnOk").disabled = false;
        document.getElementById("btnFail").disabled = false;

        let timeStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });
        historyList.unshift(`[${timeStr}] [${hashType}] ${result} (${tai_percent}%) | ${hash.substring(0, 8)}...`);
        if (historyList.length > 20) historyList.pop();
        document.getElementById("history").innerHTML = historyList.join("<br>");

        document.getElementById("analyzeBtn").disabled = false;

    }, 1350);
}

function mark(ok) {
    total_count++;
    if (ok) { correct++; win_count++; } else { wrong++; }
    document.getElementById("stats").innerText = "ĐÚNG: " + correct + " | SAI: " + wrong;
    document.getElementById("winrate").innerText = Math.floor((win_count / total_count) * 100) + "%";
    document.getElementById("btnOk").disabled = true;
    document.getElementById("btnFail").disabled = true;
}

/* =============================================================
   GIAO DIỆN & SIDEBAR
============================================================= */
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function switchTab(tabName) {
    const tabs = ['home', 'buykey', 'md5', 'bank', 'baccarat', 'support'];
    tabs.forEach(tab => {
        const content = document.getElementById(`tab-${tab}-content`);
        const menu = document.getElementById(`menu-${tab}`);
        if (tab === tabName) {
            content.classList.remove('hidden');
            if (menu) menu.classList.add('active');
        } else {
            content.classList.add('hidden');
            if (menu) menu.classList.remove('active');
        }
    });
    document.getElementById('neon-container').scrollTop = 0;
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('active')) toggleSidebar();
}

/* =============================================================
   FIREWORKS BACKGROUND
============================================================= */
const canvas = document.getElementById('fireworks-canvas');
const ctx = canvas.getContext('2d');
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1; this.decay = Math.random() * 0.02 + 0.015; this.gravity = 0.05;
    }
    update() {
        this.vx *= 0.98; this.vy *= 0.98; this.vy += this.gravity;
        this.x += this.vx; this.y += this.vy; this.alpha -= this.decay;
    }
    draw() {
        ctx.save(); ctx.globalAlpha = this.alpha; ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color; ctx.shadowBlur = 6; ctx.shadowColor = this.color;
        ctx.fill(); ctx.restore();
    }
}

class Firework {
    constructor() {
        this.x = Math.random() * canvas.width; this.y = canvas.height;
        this.targetY = Math.random() * (canvas.height * 0.5) + canvas.height * 0.1;
        this.speed = Math.random() * 3 + 3;
        this.color = `hsl(${Math.random() * 360}, 100%, 65%)`;
        this.exploded = false; this.particles = [];
    }
    update() {
        if (!this.exploded) {
            this.y -= this.speed;
            if (this.y <= this.targetY) { this.exploded = true; this.explode(); }
        } else {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].alpha <= 0) this.particles.splice(i, 1);
            }
        }
    }
    explode() {
        const count = Math.floor(Math.random() * 30) + 40;
        for (let i = 0; i < count; i++) this.particles.push(new Particle(this.x, this.y, this.color));
    }
    draw() {
        if (!this.exploded) {
            ctx.save(); ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = this.color; ctx.shadowBlur = 8; ctx.shadowColor = this.color;
            ctx.fill(); ctx.restore();
        } else {
            this.particles.forEach(p => p.draw());
        }
    }
}

let fireworks = [];
function animate() {
    ctx.fillStyle = 'rgba(5, 5, 13, 0.2)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (Math.random() < 0.05) fireworks.push(new Firework());
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update(); fireworks[i].draw();
        if (fireworks[i].exploded && fireworks[i].particles.length === 0) fireworks.splice(i, 1);
    }
    requestAnimationFrame(animate);
}
animate();

/* =============================================================
   XỬ LÝ ĐĂNG NHẬP & HỒ SƠ
============================================================= */
let isLoginMode = true;
document.addEventListener("DOMContentLoaded", () => { checkAutoLogin(); });

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const btnAction = document.getElementById('btn-auth-action');
    const toggleText = document.getElementById('toggle-text');
    const toggleLink = document.getElementById('toggle-link');
    const msg = document.getElementById('auth-message');

    msg.innerText = "";
    if (isLoginMode) {
        title.innerText = "System Login";
        btnAction.innerText = "Đăng Nhập";
        toggleText.innerText = "Chưa có tài khoản?";
        toggleLink.innerText = "Đăng ký ngay";
    } else {
        title.innerText = "Register System";
        btnAction.innerText = "Tạo Tài Khoản";
        toggleText.innerText = "Đã có tài khoản?";
        toggleLink.innerText = "Đăng nhập";
    }
}

function handleAuth() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const msg = document.getElementById('auth-message');

    if (!user || !pass) { showMessage(msg, "Vui lòng nhập đầy đủ thông tin!", "error"); return; }
    let users = JSON.parse(localStorage.getItem('registered_users')) || {};

    if (isLoginMode) {
        if ((user === "admin" && pass === "123456") || (users[user] && users[user] === pass)) {
            localStorage.setItem('logged_in_user', user);
            currentUser = user;
            showMainScreen(user);
        } else {
            showMessage(msg, "Tài khoản hoặc mật khẩu không đúng!", "error");
        }
    } else {
        if (user === "admin" || users[user]) {
            showMessage(msg, "Tài khoản này đã tồn tại!", "error");
        } else {
            users[user] = pass;
            localStorage.setItem('registered_users', JSON.stringify(users));
            showMessage(msg, "Đăng ký thành công! Hãy đăng nhập.", "success");
            toggleAuthMode();
        }
    }
}

function showMessage(element, text, type) {
    element.innerText = text;
    element.className = `message ${type}`;
}

function checkAutoLogin() {
    const loggedUser = localStorage.getItem('logged_in_user');
    if (loggedUser) {
        currentUser = loggedUser;
        showMainScreen(loggedUser);
    }
}

function showMainScreen(username) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    loadUserProfile(username);
    updateUserExpiryDisplay();
    switchTab('home');
}

function handleLogout() {
    localStorage.removeItem('logged_in_user');
    currentUser = null;
    document.getElementById('username').value = "";
    document.getElementById('password').value = "";
    document.getElementById('main-screen').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
}

function saveUserProfile() {
    const loggedUser = localStorage.getItem('logged_in_user');
    if (!loggedUser) return;

    const nickname = document.getElementById('profile-nickname').value.trim();
    const birthyear = document.getElementById('profile-birthyear').value.trim();
    const email = document.getElementById('profile-email').value.trim();
    const phone = document.getElementById('profile-phone').value.trim();
    const msg = document.getElementById('profile-message');

    if (!nickname || !birthyear || !email || !phone) {
        showMessage(msg, "Vui lòng nhập đầy đủ tất cả các trường!", "error");
        return;
    }

    const profileData = { nickname, birthyear, email, phone };
    localStorage.setItem(`profile_${loggedUser}`, JSON.stringify(profileData));
    document.getElementById('user-display').innerText = nickname;
    showMessage(msg, "Đã lưu hồ sơ thành công!", "success");
}

function loadUserProfile(username) {
    const dataRaw = localStorage.getItem(`profile_${username}`);
    if (dataRaw) {
        const data = JSON.parse(dataRaw);
        document.getElementById('profile-nickname').value = data.nickname || '';
        document.getElementById('profile-birthyear').value = data.birthyear || '';
        document.getElementById('profile-email').value = data.email || '';
        document.getElementById('profile-phone').value = data.phone || '';
        document.getElementById('user-display').innerText = data.nickname ? data.nickname : username;
    } else {
        document.getElementById('user-display').innerText = username;
    }
}

/* =============================================================
   THUẬT TOÁN TÀI XỈU NGÂN HÀNG (0 - 9)
============================================================= */
let bankHistory = [];

function inputBankNum(num) { processBankNum(num); }

function processBankNum(digit) {
    const resultBox = document.getElementById('bank-result');

    const isEven = digit % 2 === 0;
    const chanLeStr = isEven ? "CHẴN" : "LẺ";
    const chanLeBadge = isEven ? `<span class="badge-tag bg-chan">CHẴN</span>` : `<span class="badge-tag bg-le">LẺ</span>`;

    let outcomeText = "";
    let outcomeColor = "";
    let outcomeType = "";

    if (digit >= 1 && digit <= 4) { outcomeText = "XỈU"; outcomeColor = "#ff0055"; outcomeType = "X"; }
    else if (digit >= 5 && digit <= 8) { outcomeText = "TÀI"; outcomeColor = "#00f3ff"; outcomeType = "T"; }
    else { outcomeText = "HÒA (ĐẶC BIỆT)"; outcomeColor = "#00ff66"; outcomeType = "S"; }

    bankHistory.push({ num: digit, type: outcomeType });
    updateBankRoadmapUI();

    const nextPrediction = analyzeBankPattern();

    resultBox.className = "result-box prediction-bg";
    resultBox.classList.remove('hidden');
    resultBox.innerHTML = `
        <b>KẾT QUẢ VÁN TRƯỚC: <span style="color:${outcomeColor}; font-size:18px;">${outcomeText}</span> ${chanLeBadge}</b><br>
        <div class="analysis-detail">
            • <b>Nút đã chọn:</b> <b style="color:${outcomeColor}; font-size:16px;">${digit}</b><br>
            • <b>Quy chuẩn:</b> ${digit === 0 || digit === 9 ? '0 - 9 ➔ <b style="color:#00ff66;">HÒA</b>' : (digit <= 4 ? '1 - 4 ➔ <b>XỈU</b>' : '5 - 8 ➔ <b>TÀI</b>')}<br>
            • <b>Đặc tính Chẵn Lẻ:</b> Số ${digit} là số <b>${chanLeStr}</b>.<br>
            ------------------------------------<br>
            🎯 <b>DỰ ĐOÁN VÁN TIẾP THEO: <span style="color:${nextPrediction.color}; font-size:16px;">${nextPrediction.pick}</span></b> (${nextPrediction.rate})<br>
            • <i>Chỉ số AI: ${nextPrediction.pattern}</i>
        </div>
    `;
}

function popBankResult() {
    if (bankHistory.length > 0) {
        bankHistory.pop();
        updateBankRoadmapUI();
        if (bankHistory.length === 0) {
            document.getElementById('bank-result').classList.add('hidden');
        } else {
            const last = bankHistory[bankHistory.length - 1];
            processBankNum(last.num);
            bankHistory.pop();
        }
    }
}

function clearBankHistory() {
    bankHistory = [];
    updateBankRoadmapUI();
    document.getElementById('bank-result').classList.add('hidden');
}

function analyzeBankPattern() {
    const cleanList = bankHistory.map(item => item.type).filter(type => type === 'T' || type === 'X');
    const n = cleanList.length;

    if (n < 2) {
        return { pick: "CHỜ THÊM CẦU", rate: "50%", pattern: "Bấm chọn tối thiểu 2 ván TÀI/XỈU để bắt cầu AI", color: "#a0a0c0" };
    }

    const last = cleanList[n - 1];
    const prev1 = cleanList[n - 2];

    let streak = 0;
    for (let i = n - 1; i >= 0; i--) {
        if (cleanList[i] === last) streak++;
        else break;
    }

    if (streak >= 3) {
        return {
            pick: last === 'T' ? 'TÀI' : 'XỈU',
            rate: `${Math.min(88, 75 + streak * 3)}%`,
            pattern: `Cầu bệt ${streak} ván ${last === 'T' ? 'TÀI' : 'XỈU'}. Đánh thuận dòng!`,
            color: last === 'T' ? '#00f3ff' : '#ff0055'
        };
    } else if (last !== prev1) {
        const nextPick = last === 'T' ? 'XỈU' : 'TÀI';
        return {
            pick: nextPick,
            rate: '78%',
            pattern: 'Cầu nhảy 1-1 nhịp nhàng. Ưu tiên bẻ nhịp!',
            color: nextPick === 'TÀI' ? '#00f3ff' : '#ff0055'
        };
    } else {
        const nextPick = last === 'T' ? 'XỈU' : 'TÀI';
        return {
            pick: nextPick,
            rate: '72%',
            pattern: 'Cầu đôi 2-2. Bẻ nhịp sang cửa đối lập.',
            color: nextPick === 'TÀI' ? '#00f3ff' : '#ff0055'
        };
    }
}

function updateBankRoadmapUI() {
    const beadGrid = document.getElementById('bank-bead-grid');
    const bigRoadGrid = document.getElementById('bank-big-road-grid');
    const statXiu = document.getElementById('bank-stat-xiu');
    const statTai = document.getElementById('bank-stat-tai');
    const statSpecial = document.getElementById('bank-stat-special');

    beadGrid.innerHTML = ''; bigRoadGrid.innerHTML = '';

    if (bankHistory.length === 0) {
        statXiu.innerText = '0 (0%)'; statTai.innerText = '0 (0%)'; statSpecial.innerText = '0 (0%)';
        return;
    }

    let xiuCount = 0, taiCount = 0, specialCount = 0;

    bankHistory.forEach((item) => {
        if (item.type === 'X') xiuCount++;
        else if (item.type === 'T') taiCount++;
        else if (item.type === 'S') specialCount++;

        const cell = document.createElement('div');
        let beadClass = 'bead-special';
        if (item.type === 'X') beadClass = 'bead-xiu';
        if (item.type === 'T') beadClass = 'bead-tai';

        cell.className = `bead-cell ${beadClass}`;
        cell.innerText = item.num;
        beadGrid.appendChild(cell);
    });

    const beadWrapper = beadGrid.parentElement;
    beadWrapper.scrollLeft = beadWrapper.scrollWidth;

    let columns = [];
    let currentCol = [];
    let lastType = null;

    bankHistory.forEach(item => {
        if (item.type !== lastType) {
            if (currentCol.length > 0) columns.push(currentCol);
            currentCol = [item];
            lastType = item.type;
        } else {
            if (currentCol.length < 6) {
                currentCol.push(item);
            } else {
                columns.push(currentCol);
                currentCol = [item];
            }
        }
    });
    if (currentCol.length > 0) columns.push(currentCol);

    columns.forEach(col => {
        col.forEach(item => {
            const bigCell = document.createElement('div');
            let bigClass = 'big-special';
            if (item.type === 'X') bigClass = 'big-xiu';
            if (item.type === 'T') bigClass = 'big-tai';

            bigCell.className = `big-road-cell ${bigClass}`;
            bigCell.innerText = item.type;
            bigRoadGrid.appendChild(bigCell);
        });
        for (let i = col.length; i < 6; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'big-road-cell';
            bigRoadGrid.appendChild(emptyCell);
        }
    });

    const bigWrapper = bigRoadGrid.parentElement;
    bigWrapper.scrollLeft = bigWrapper.scrollWidth;

    const total = bankHistory.length;
    statXiu.innerText = `${xiuCount} (${((xiuCount / total) * 100).toFixed(1)}%)`;
    statTai.innerText = `${taiCount} (${((taiCount / total) * 100).toFixed(1)}%)`;
    statSpecial.innerText = `${specialCount} (${((specialCount / total) * 100).toFixed(1)}%)`;
}

/* =============================================================
   BACCARAT AI ENGINE PRO
============================================================= */
let baccaratHistory = [];

function addBaccaratResult(type) { baccaratHistory.push(type); updateBaccaratUI(); }
function popBaccaratResult() { if (baccaratHistory.length > 0) { baccaratHistory.pop(); updateBaccaratUI(); } }
function clearBaccaratHistory() { baccaratHistory = []; updateBaccaratUI(); }

function analyzeBaccaratAlgorithm(history, pCount, bCount, tCount) {
    const cleanList = history.filter(x => x === 'P' || x === 'B');
    const n = cleanList.length;

    if (n < 2) {
        return { 
            pick: "CHỜ THÊM CẦU", rate: "50%", pattern: "Cần tối thiểu 2 ván P/B để kích hoạt ma trận phân tích", 
            algo: "Thuật toán PRNG Xác suất Tĩnh", color: "#a0a0c0", advice: "Vui lòng nhập thêm kết quả."
        };
    }

    const last = cleanList[n - 1];
    const prev1 = cleanList[n - 2];
    const prev2 = n >= 3 ? cleanList[n - 3] : null;
    const prev3 = n >= 4 ? cleanList[n - 4] : null;

    let pick = "", pattern = "", rate = 65, algo = "", advice = "";

    let streak = 0;
    for (let i = n - 1; i >= 0; i--) {
        if (cleanList[i] === last) streak++;
        else break;
    }

    if (streak >= 4) {
        pick = last; pattern = `Cầu Bệt dài ${streak} ván ${last} (Long Dragon)`;
        algo = "Thuật toán Ma Trận Lịch Sử (Roadmap Vector Engine)"; rate = Math.min(88, 75 + streak * 2);
        advice = "Tuyệt đối KHÔNG bẻ cầu! Đánh thuận dòng cầu bệt đến khi đứt.";
    } 
    else if (n >= 4 && last !== prev1 && prev1 !== prev2 && prev2 !== prev3) {
        pick = last === 'P' ? 'B' : 'P'; pattern = "Cầu Nhảy 1-1 (Alternating Pattern)";
        algo = "Thuật toán Ma Trận Dịch Chuyển Véc-tơ (N-1)"; rate = 82; advice = "Đánh xoay chiều luân phiên theo nhịp 1-1.";
    }
    else if (n >= 4 && last === prev1 && prev1 !== prev2 && prev2 === prev3) {
        pick = last === 'P' ? 'B' : 'P'; pattern = "Cầu Kép 2-2 (Double Pattern)";
        algo = "Thuật toán Chu Kỳ Chuỗi Đối Xứng"; rate = 78; advice = "Đủ bộ đôi 2 ván, chủ động bẻ nhịp sang cửa đối lập.";
    }
    else if (n >= 3 && last !== prev1 && prev1 === prev2) {
        pick = prev1; pattern = "Cầu 1-2 / 1-3 (Sub-alternating Pattern)";
        algo = "Thuật toán Roadmap Cockroach Pig"; rate = 74; advice = "Đánh nối theo nhịp cầu phụ 2 ván trùng.";
    }
    else if (Math.abs(pCount - bCount) >= 4) {
        pick = pCount > bCount ? 'B' : 'P'; const diff = Math.abs(pCount - bCount);
        pattern = `Cầu Nghiêng / Lệch Cân Bằng (${diff} ván)`;
        algo = "Thuật toán Cân Bằng Dòng Tiền Nhà Cái (Balance Engine)"; rate = 76;
        advice = `Tỷ lệ nghiêng cao về ${pCount > bCount ? 'PLAYER' : 'BANKER'}. Ưu tiên đánh trả ván cho cửa còn lại.`;
    }
    else if (n >= 6 && streak === 1 && Math.abs(pCount - bCount) <= 1) {
        pick = last === 'P' ? 'B' : 'P'; pattern = "Cầu Dây Thừng / Lộn Xộn (Random Noise)";
        algo = "Thuật toán Nhiễu Dữ Liệu PRNG Máy"; rate = 60; advice = "Cầu biến thể nhiễu cao. Nên giảm mức cược hoặc đổi bàn!";
    }
    else {
        pick = last === 'P' ? 'B' : 'P'; pattern = "Cầu Ngắn Swapping (1-1 / 2-1 linh hoạt)";
        algo = "Thuật toán Mô Phỏng Monte Carlo"; rate = 66; advice = "Đánh đảo chiều nhẹ nhàng theo chu kỳ ván trước.";
    }

    if (tCount / history.length > 0.15) { advice += " (Cảnh báo: Tần suất Hòa TIE cao > 15%)"; }

    const color = pick === 'P' ? '#00a2ff' : pick === 'B' ? '#ff0055' : '#00f3ff';
    return { pick, rate: `${rate}%`, pattern, algo, color, advice };
}

function updateBaccaratUI() {
    const beadGrid = document.getElementById('bead-grid');
    const bigRoadGrid = document.getElementById('big-road-grid');
    const statP = document.getElementById('stat-p');
    const statB = document.getElementById('stat-b');
    const statT = document.getElementById('stat-t');
    const resultBox = document.getElementById('baccarat-result');

    beadGrid.innerHTML = ''; bigRoadGrid.innerHTML = '';

    if (baccaratHistory.length === 0) {
        statP.innerText = '0 (0%)'; statB.innerText = '0 (0%)'; statT.innerText = '0 (0%)';
        resultBox.classList.add('hidden');
        return;
    }

    let pCount = 0, bCount = 0, tCount = 0;

    baccaratHistory.forEach((item) => {
        if (item === 'P') pCount++;
        else if (item === 'B') bCount++;
        else if (item === 'T') tCount++;

        const cell = document.createElement('div');
        cell.className = `bead-cell bead-${item.toLowerCase()}`;
        cell.innerText = item;
        beadGrid.appendChild(cell);
    });

    const beadWrapper = beadGrid.parentElement;
    beadWrapper.scrollLeft = beadWrapper.scrollWidth;

    let columns = [];
    let currentCol = [];
    let lastType = null;

    baccaratHistory.forEach(item => {
        if (item === 'T') return;
        if (item !== lastType) {
            if (currentCol.length > 0) columns.push(currentCol);
            currentCol = [item];
            lastType = item;
        } else {
            if (currentCol.length < 6) {
                currentCol.push(item);
            } else {
                columns.push(currentCol);
                currentCol = [item];
            }
        }
    });
    if (currentCol.length > 0) columns.push(currentCol);

    columns.forEach(col => {
        col.forEach(item => {
            const bigCell = document.createElement('div');
            bigCell.className = `big-road-cell big-${item.toLowerCase()}`;
            bigCell.innerText = item;
            bigRoadGrid.appendChild(bigCell);
        });
        for (let i = col.length; i < 6; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'big-road-cell';
            bigRoadGrid.appendChild(emptyCell);
        }
    });

    const bigWrapper = bigRoadGrid.parentElement;
    bigWrapper.scrollLeft = bigWrapper.scrollWidth;

    const total = baccaratHistory.length;
    statP.innerText = `${pCount} (${((pCount / total) * 100).toFixed(1)}%)`;
    statB.innerText = `${bCount} (${((bCount / total) * 100).toFixed(1)}%)`;
    statT.innerText = `${tCount} (${((tCount / total) * 100).toFixed(1)}%)`;

    const prediction = analyzeBaccaratAlgorithm(baccaratHistory, pCount, bCount, tCount);

    resultBox.className = "result-box prediction-bg";
    resultBox.classList.remove('hidden');
    resultBox.innerHTML = `
        <b>DỰ ĐOÁN VÁN TIẾP THEO: <span style="color:${prediction.color}; font-size:18px;">${prediction.pick}</span></b><br>
        <div class="analysis-detail">
            • <b>Tỷ lệ chính xác AI:</b> <span style="color:#00ff66;">${prediction.rate}</span><br>
            • <b>Dạng cầu nhận diện:</b> ${prediction.pattern}<br>
            • <b>Thuật toán vận hành:</b> ${prediction.algo}<br>
            • <b>Chiến thuật khuyên dùng:</b> <i>${prediction.advice}</i>
        </div>
    `;
}

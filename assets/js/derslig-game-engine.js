/**
 * Derslig Game Engine - Yuvarlama Pisti
 * 1-4 Oyuncu Desteği
 * 
 * Modlar: 'tek', 'multi-2', 'multi-3', 'multi-4'
 */
const YuvarlamaEngine = {
    settings: {
        basamakSayisi: 2,
        yuvarlamaTipi: 'onluk',
        sure: 60,
        maarifModel: false,
        // Yeni karma seçim sistemi
        seciliTipler: null  // [{tip:'onluk', basamaklar:[2,3,4,5]}, ...]
    },

    _createPlayerState: function() {
        return {
            puan: 0,
            dogruSerisi: 0,
            yanlisSerisi: 0,
            totalDogru: 0,
            totalYanlis: 0,
            isLocked: false
        };
    },

    state: {
        mod: 'tek',
        playerCount: 1,
        timerInterval: null,
        kalanSure: 60,
        isFinished: false,
        players: []  // Tüm oyuncuların state'i
    },

    container: null,
    _onMatchComplete: null,       // Turnuva callback
    _tournamentPlayerNames: null,  // Turnuva oyuncu isimleri

    // ==================== ANA BAŞLATICI ====================
    start: function(containerId, mod, ayarlar) {
        this.container = document.getElementById(containerId);
        this.state.mod = mod;
        this.state.isFinished = false;
        this.settings.sure = ayarlar.sure || 60;
        this.state.kalanSure = this.settings.sure;

        // Yeni seciliTipler formatını destekle + geriye uyumluluk
        if (ayarlar.seciliTipler && ayarlar.seciliTipler.length > 0) {
            this.settings.seciliTipler = ayarlar.seciliTipler;
            this.settings.yuvarlamaTipi = 'karma';
            this.settings.basamakSayisi = ayarlar.seciliTipler[0].basamaklar[0];
        } else {
            // Eski format: tek tip + tek basamak
            this.settings.basamakSayisi = ayarlar.basamakSayisi || 2;
            this.settings.yuvarlamaTipi = ayarlar.yuvarlamaTipi || 'onluk';
            // Eski formatı da seciliTipler'e dönüştür
            if (this.settings.yuvarlamaTipi === 'rastgele') {
                this.settings.seciliTipler = [
                    { tip: 'onluk', basamaklar: [2,3,4,5] },
                    { tip: 'yuzluk', basamaklar: [3,4,5] },
                    { tip: 'ondalik', basamaklar: [1,2,3] }
                ];
            } else {
                this.settings.seciliTipler = [
                    { tip: this.settings.yuvarlamaTipi, basamaklar: [this.settings.basamakSayisi] }
                ];
            }
        }

        // Maarif Model ayarını al
        this.settings.maarifModel = ayarlar.maarifModel || false;

        // Oyuncu sayısını belirle
        if(mod === 'tek') {
            this.state.playerCount = 1;
        } else if(mod === 'multi-2') {
            this.state.playerCount = 2;
        } else if(mod === 'multi-3') {
            this.state.playerCount = 3;
        } else if(mod === 'multi-4') {
            this.state.playerCount = 4;
        }

        // Oyuncu state'lerini oluştur
        this.state.players = [];
        for(let i = 0; i < this.state.playerCount; i++) {
            this.state.players.push(this._createPlayerState());
        }

        Derslig.init({
            oyunAdi: "Yuvarlama Pisti",
            soruSayisi: 10,
            maxPuan: 20
        });

        Derslig.baslangicSesi();

        if(mod === 'tek') {
            this._renderSolo();
        } else {
            this._renderMulti();
        }

        this._startTimer();
    },

    // ==================== HAVUZDAN RASTGELE SEÇİCİ ====================
    _resolveFromPool: function() {
        const pool = this.settings.seciliTipler;
        if (!pool || pool.length === 0) {
            // Fallback: tüm tipler
            return { tip: 'onluk', basamak: 2 };
        }
        // Rastgele bir tip seç
        const picked = pool[Math.floor(Math.random() * pool.length)];
        // O tipin basamaklarından rastgele birini seç
        const basamak = picked.basamaklar[Math.floor(Math.random() * picked.basamaklar.length)];
        return { tip: picked.tip, basamak: basamak };
    },

    // Eski _resolveRandom geriye uyumluluk için korunuyor
    _resolveRandom: function() {
        return this._resolveFromPool();
    },

    // ==================== SAYI ÜRETİCİ ====================
    _generateNumber: function(resolvedTip, resolvedBasamak) {
        const tip = resolvedTip || this.settings.yuvarlamaTipi;
        const basamak = resolvedBasamak || this.settings.basamakSayisi;
        let num;

        if (tip === 'onluk' || tip === 'yuzluk') {
            const min = Math.pow(10, basamak - 1);
            const max = Math.pow(10, basamak) - 1;
            num = Math.floor(Math.random() * (max - min + 1)) + min;
            
            if (tip === 'onluk') {
                while(num % 10 === 0) num++;
            } else if (tip === 'yuzluk') {
                while(num % 100 === 0) num++;
            }
        } else if (tip === 'ondalik') {
            const decimalLength = basamak + 1;
            const factor = Math.pow(10, decimalLength);
            const intPart = Math.floor(Math.random() * 99) + 1;
            const fracPart = Math.floor(Math.random() * factor);
            num = intPart + fracPart / factor;
            
            while(Math.round(num * Math.pow(10, basamak)) / Math.pow(10, basamak) === num) {
                num += 1 / factor;
            }
            num = parseFloat(num.toFixed(decimalLength));
        } else {
            // Tanınmayan tip gelirse (rastgele dahil) güvenlik ağı
            const r = this._resolveRandom();
            return this._generateNumber(r.tip, r.basamak);
        }
        return num;
    },

    _getCorrectAnswer: function(num, resolvedTip, resolvedBasamak) {
        const tip = resolvedTip || this.settings.yuvarlamaTipi;
        const basamak = resolvedBasamak || this.settings.basamakSayisi;

        if (tip === 'onluk') {
            const remainder = num % 10;
            if (this.settings.maarifModel && remainder === 5) {
                // Maarif Modeli: 5 olduğu gibi kalır
                return num;
            }
            return Math.round(num / 10) * 10;
        }
        if (tip === 'yuzluk') {
            const remainder = Math.floor((num % 100) / 10);
            // Yüzlük yuvarlama: onlar basamağı 5 ise olduğu gibi kal
            if (this.settings.maarifModel && (num % 100) >= 50 && (num % 100) < 60) {
                // 50-59 arası: "50" olarak kalır → birler sıfırlanır ama yüzlüğe yuvarlanmaz
                return Math.floor(num / 100) * 100 + 50;
            }
            return Math.round(num / 100) * 100;
        }
        if (tip === 'ondalik') {
            // Ondalık yuvarlama için Maarif kuralı:
            // Yuvarlanacak basamağın hemen sağındaki rakam 5 ise olduğu gibi kalır
            const factor = Math.pow(10, basamak);
            const shifted = parseFloat((num * factor).toFixed(4));
            const nextDigit = Math.floor(shifted) % 10;
            const decimal = shifted - Math.floor(shifted);

            // Hemen sağındaki tam rakamı bul
            const factorNext = Math.pow(10, basamak + 1);
            const shiftedNext = parseFloat((num * factorNext).toFixed(4));
            const digitAfter = Math.floor(shiftedNext) % 10;

            if (this.settings.maarifModel && digitAfter === 5) {
                // 5 ise kesilir (aşağı yuvarlama gibi davranır, olduğu gibi kalır)
                return Math.floor(shifted) / factor;
            }
            return Number(Math.round(parseFloat(num + 'e' + basamak)) + 'e-' + basamak);
        }
        // Güvenlik ağı
        return Math.round(num / 10) * 10;
    },

    // ==================== ÇELDİRİCİ ÜRETİCİ ====================
    _generateDistractors: function(num, correct, resolvedTip, resolvedBasamak) {
        const tip = resolvedTip || this.settings.yuvarlamaTipi;
        const basamak = resolvedBasamak || this.settings.basamakSayisi;
        let step = 10;
        
        if (tip === 'onluk') step = 10;
        else if (tip === 'yuzluk') step = 100;
        else if (tip === 'ondalik') step = 1 / Math.pow(10, basamak);

        const d1 = (tip === 'ondalik') ? parseFloat((correct - step).toFixed(basamak)) : correct - step;
        const d2 = (tip === 'ondalik') ? parseFloat((correct + step).toFixed(basamak)) : correct + step;

        const values = new Set([correct, d1 >= 0 ? d1 : correct + step * 2, d2]);
        while(values.size < 3) {
            const extra = (tip === 'ondalik') 
                ? parseFloat((correct + step * values.size).toFixed(basamak)) 
                : correct + step * values.size;
            values.add(extra);
        }
        return Array.from(values);
    },

    // ==================== SAYI FORMATLAYICI ====================
    _formatOption: function(val, tip, basamak) {
        if (tip === 'ondalik') {
            return val.toLocaleString('tr-TR', {
                minimumFractionDigits: basamak,
                maximumFractionDigits: basamak
            });
        }
        return val.toLocaleString('tr-TR');
    },

    _createQuestion: function() {
        // Her soru için havuzdan rastgele tip+basamak çöz
        const resolved = this._resolveFromPool();
        const tip = resolved.tip;
        const basamak = resolved.basamak;

        const num = this._generateNumber(tip, basamak);
        const correct = this._getCorrectAnswer(num, tip, basamak);
        const rawOptions = this._generateDistractors(num, correct, tip, basamak);
        
        // Seçenekleri {value, display} olarak formatla
        const options = rawOptions.map(val => ({
            value: val,
            display: this._formatOption(val, tip, basamak)
        }));
        options.sort(() => Math.random() - 0.5);

        let label = 'Onluğa Yuvarla';
        if (tip === 'onluk') label = 'Onluğa Yuvarla';
        else if (tip === 'yuzluk') label = 'Yüzlüğe Yuvarla';
        else if (tip === 'ondalik') {
            if (basamak === 1) label = 'Onda Birliğe Yuvarla';
            else if (basamak === 2) label = 'Yüzde Birliğe Yuvarla';
            else if (basamak === 3) label = 'Binde Birliğe Yuvarla';
        }

        if (this.settings.maarifModel) {
            label += ' (Maarif)';
        }

        const display = (tip === 'ondalik') 
            ? num.toLocaleString('tr-TR', {minimumFractionDigits: basamak + 1, maximumFractionDigits: basamak + 1}) 
            : num.toLocaleString('tr-TR');

        return { num, correct, options, label, display };
    },

    // ==================== TEPKİ SİSTEMİ (COMBO PUAN) ====================
    _getCorrectFeedback: function(playerState) {
        const seri = playerState.dogruSerisi; // henüz artırılmadan önceki değer
        // Combo sistemi: ardışık doğru yaptıkça puan katlanır
        if(seri >= 4) {
            return { text: 'EFSANE!', points: 50 };
        } else if(seri === 3) {
            return { text: 'Süpersin', points: 40 };
        } else if(seri === 2) {
            return { text: 'Harikasın', points: 30 };
        } else if(seri === 1) {
            return { text: 'Bravo', points: 20 };
        } else {
            return { text: 'Tebrikler', points: 10 };
        }
    },

    _showFeedbackToast: function(container, text, points, isCorrect) {
        const old = container.querySelector('.dl-feedback-toast');
        if(old) old.remove();
        const toast = document.createElement('div');
        toast.className = `dl-feedback-toast ${isCorrect ? '' : 'wrong-feedback'}`;
        toast.innerHTML = `
            <div class="feedback-text">${text}</div>
            ${points !== null ? `<div class="feedback-points">${isCorrect ? '+' : ''}${points}</div>` : ''}
        `;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'opacity 0.3s';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 800);
    },

    // ==================== SAKİN OL EKRANI ====================
    _showCalmDown: function(panelElement, playerState, callback) {
        playerState.isLocked = true;
        const overlay = document.createElement('div');
        overlay.className = 'dl-calmdown-overlay';
        overlay.innerHTML = `
            <div class="dl-calmdown-text">Sakin ol</div>
            <div class="dl-calmdown-countdown">5</div>
        `;
        panelElement.appendChild(overlay);
        let count = 5;
        const countdownEl = overlay.querySelector('.dl-calmdown-countdown');
        const interval = setInterval(() => {
            count--;
            if(count > 0) {
                countdownEl.textContent = count;
            } else {
                clearInterval(interval);
                countdownEl.style.display = 'none';
                const resumeMsg = document.createElement('div');
                resumeMsg.className = 'dl-calmdown-resume';
                resumeMsg.textContent = 'Çözmeye devam edebilirsin';
                overlay.appendChild(resumeMsg);
                setTimeout(() => {
                    overlay.style.transition = 'opacity 0.4s';
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.remove();
                        playerState.isLocked = false;
                        playerState.yanlisSerisi = 0;
                        if(callback) callback();
                    }, 400);
                }, 1200);
            }
        }, 1000);
    },

    // ==================== CEVAP KONTROLÜ ====================
    _handleAnswer: function(selectedValue, btnNode, correct, playerState, panelElement, nextQuestionFn) {
        if(playerState.isLocked || this.state.isFinished) return;

        if(selectedValue === correct) {
            const feedback = this._getCorrectFeedback(playerState);
            playerState.puan += feedback.points;
            playerState.dogruSerisi++;
            playerState.yanlisSerisi = 0;
            playerState.totalDogru++;
            Derslig.dogruCevap();
            this._showFeedbackToast(panelElement, feedback.text, feedback.points, true);
            this._updateScoreDisplay();
            nextQuestionFn();
        } else {
            playerState.dogruSerisi = 0;
            playerState.yanlisSerisi++;
            playerState.totalYanlis++;
            Derslig.yanlisCevap();

            if(playerState.yanlisSerisi >= 3) {
                playerState.isLocked = true;
                this._showCalmDown(panelElement, playerState, () => {
                    nextQuestionFn();
                });
            } else {
                this._showFeedbackToast(panelElement, 'Hata yaptın', null, false);
                nextQuestionFn();
            }
        }
    },

    // ==================== ZAMANLAYICI ====================
    _startTimer: function() {
        const self = this;
        this.state.timerInterval = setInterval(() => {
            self.state.kalanSure--;
            self._updateTimerDisplay();
            if(self.state.kalanSure <= 0) {
                clearInterval(self.state.timerInterval);
                self._gameOver();
            }
        }, 1000);
    },

    _updateTimerDisplay: function() {
        const el = document.getElementById('dl-timer-value');
        if(el) el.textContent = this.state.kalanSure;
        const fill = document.getElementById('dl-progress-fill');
        if(fill) {
            const pct = (this.state.kalanSure / this.settings.sure) * 100;
            fill.style.width = pct + '%';
        }
        if(this.state.kalanSure <= 10) {
            if(el) el.style.color = '#FF5252';
            if(this.state.kalanSure > 0) Derslig.sureSesi();
        }
    },

    _updateScoreDisplay: function() {
        for(let i = 0; i < this.state.players.length; i++) {
            const el = document.getElementById('dl-score-p' + (i+1));
            if(el) el.textContent = this.state.players[i].puan;
        }
    },

    // ==================== ORTAK KONTROL BUTONLARI ====================
    _bindGameControls: function() {
        const self = this;
        const backBtn = document.getElementById('dl-back-btn');
        if(backBtn) {
            backBtn.addEventListener('click', function() {
                clearInterval(self.state.timerInterval);
                self.state.isFinished = true;
                location.reload();
            });
        }
        const volBtn = document.getElementById('dl-vol-btn');
        if(volBtn) {
            volBtn.addEventListener('click', function() {
                const muted = Derslig.toggleMute();
                this.style.opacity = muted ? '0.3' : '0.5';
            });
        }
        const fsBtn = document.getElementById('dl-fs-btn');
        if(fsBtn) {
            fsBtn.addEventListener('click', function() {
                const el = document.documentElement;
                if(!document.fullscreenElement && !document.webkitFullscreenElement) {
                    if(el.requestFullscreen) el.requestFullscreen();
                    else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen();
                    else if(el.msRequestFullscreen) el.msRequestFullscreen();
                } else {
                    if(document.exitFullscreen) document.exitFullscreen();
                    else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
                    else if(document.msExitFullscreen) document.msExitFullscreen();
                }
            });
        }
    },

    _getControlsHTML: function() {
        return `
            <div class="dl-game-controls">
                <button class="dl-game-control-btn" id="dl-back-btn">
                    <svg viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
                </button>
                <button class="dl-game-control-btn" id="dl-vol-btn">
                    <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                </button>
                <button class="dl-game-control-btn" id="dl-fs-btn">
                    <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                </button>
            </div>
        `;
    },

    // ==================== TEK OYUNCU RENDER ====================
    _renderSolo: function() {
        this.container.innerHTML = `
            <div class="dl-top-bar">
                <div class="dl-progress-bar">
                    <div class="dl-progress-fill" id="dl-progress-fill" style="width: 100%"></div>
                </div>
                <div class="dl-score-row">
                    <div class="dl-puan-label"><span id="dl-score-p1">0</span> Puan</div>
                    <div class="dl-sure-label" id="dl-timer-value">${this.state.kalanSure}</div>
                    <div class="dl-rekor-area">
                        <div class="dl-rekor-title">Lider (İlk 5)</div>
                        <div class="dl-rekor-value" id="dl-rekor-value" style="font-size:16px;">Yükleniyor...</div>
                    </div>
                </div>
            </div>
            <div class="dl-question-area" id="dl-solo-area">
                <div class="dl-bg-pattern"></div>
            </div>
            <div class="dl-options-area" id="dl-solo-options"></div>
            ${this._getControlsHTML()}
        `;

        // Lideri asenkron getir ve yaz
        if (Derslig.getLeaderboard) {
            Derslig.getLeaderboard("yuvarlama_pisti_global").then(list => {
                const rekorStr = list.length > 0 ? `${list[0].score} Puan (${list[0].name})` : "Tüm Zamanlar";
                const rekorEl = document.getElementById('dl-rekor-value');
                if (rekorEl) rekorEl.textContent = rekorStr;
            });
        }

        this._bindGameControls();
        this._loadSoloQuestion();
    },

    _loadSoloQuestion: function() {
        if(this.state.isFinished) return;
        const self = this;
        const area = document.getElementById('dl-solo-area');
        if(!area) return;

        const q = this._createQuestion();

        // Eski elementleri kaldır (bg-pattern kalsın)
        ['dl-round-label','dl-target-number','dl-approx-symbol','dl-options-row','dl-feedback-toast'].forEach(cls => {
            const el = area.querySelector('.' + cls);
            if(el) el.remove();
        });

        // Yeni elementler
        const labelDiv = document.createElement('div');
        labelDiv.className = 'dl-round-label';
        labelDiv.textContent = q.label;
        area.appendChild(labelDiv);

        const numDiv = document.createElement('div');
        numDiv.className = 'dl-target-number';
        numDiv.textContent = q.display || q.num;
        area.appendChild(numDiv);

        const approxDiv = document.createElement('div');
        approxDiv.className = 'dl-approx-symbol';
        approxDiv.textContent = '=';
        area.appendChild(approxDiv);

        const optsRow = document.createElement('div');
        optsRow.className = 'dl-options-row';
        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'dl-option-btn';
            btn.dataset.val = opt.value;
            btn.textContent = opt.display;
            const eventHandler = function(e) {
                if (e.type === 'touchstart' && e.cancelable) e.preventDefault();
                if (btn.dataset.locked === 'true') return;
                btn.dataset.locked = 'true';
                setTimeout(() => { btn.dataset.locked = 'false'; }, 400);
                const v = parseFloat(btn.dataset.val);
                self._handleAnswer(v, btn, q.correct, self.state.players[0], area, () => self._loadSoloQuestion());
            };
            btn.addEventListener('touchstart', eventHandler, {passive: false});
            btn.addEventListener('click', eventHandler);
            optsRow.appendChild(btn);
        });
        area.appendChild(optsRow);
    },

    // ==================== ÇOK OYUNCU RENDER (2/3/4) ====================
    _renderMulti: function() {
        const count = this.state.playerCount;
        
        // Header
        let headerHTML = `
            <div class="dl-top-bar">
                <div class="dl-progress-bar">
                    <div class="dl-progress-fill" id="dl-progress-fill" style="width: 100%"></div>
                </div>
                <div class="dl-score-row">
                    <div class="dl-puan-label">⏱️ <span id="dl-timer-value">${this.state.kalanSure}</span></div>
                    <div></div>
                    <div></div>
                </div>
            </div>
        `;

        // Panel HTML'leri
        let panelsHTML = '';
        for(let i = 0; i < count; i++) {
            const pName = (this._tournamentPlayerNames && this._tournamentPlayerNames[i]) ? this._tournamentPlayerNames[i] : 'Oyuncu ' + (i+1);
            panelsHTML += `
                <div class="dl-player-panel" id="dl-panel-p${i+1}">
                    <div class="dl-player-score">👤 ${pName}: <span id="dl-score-p${i+1}">0</span> Puan</div>
                </div>
            `;
        }

        this.container.innerHTML = `
            ${headerHTML}
            <div class="dl-multi-container players-${count}">
                <div class="dl-bg-pattern"></div>
                ${panelsHTML}
            </div>
            ${this._getControlsHTML()}
        `;

        this._bindGameControls();

        // Her oyuncu için soru yükle
        for(let i = 0; i < count; i++) {
            this._loadMultiQuestion(i);
        }
    },

    _loadMultiQuestion: function(playerIndex) {
        if(this.state.isFinished) return;
        const self = this;
        const panel = document.getElementById('dl-panel-p' + (playerIndex + 1));
        if(!panel) return;

        const playerState = this.state.players[playerIndex];
        const q = this._createQuestion();

        // Eski elementleri kaldır (score kalsın)
        ['dl-round-label','dl-target-number','dl-approx-symbol','dl-options-row','dl-feedback-toast'].forEach(cls => {
            const el = panel.querySelector('.' + cls);
            if(el) el.remove();
        });

        const rlabel = document.createElement('div');
        rlabel.className = 'dl-round-label';
        rlabel.textContent = q.label;
        panel.appendChild(rlabel);

        const tnum = document.createElement('div');
        tnum.className = 'dl-target-number';
        tnum.textContent = q.display || q.num;
        panel.appendChild(tnum);

        const approx = document.createElement('div');
        approx.className = 'dl-approx-symbol';
        approx.textContent = '=';
        panel.appendChild(approx);

        const optRow = document.createElement('div');
        optRow.className = 'dl-options-row';
        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'dl-option-btn';
            btn.dataset.val = opt.value;
            btn.textContent = opt.display;
            const eventHandler = function(e) {
                if (e.type === 'touchstart' && e.cancelable) e.preventDefault();
                if (btn.dataset.locked === 'true') return;
                btn.dataset.locked = 'true';
                setTimeout(() => { btn.dataset.locked = 'false'; }, 400);
                const v = parseFloat(btn.dataset.val);
                self._handleAnswer(v, btn, q.correct, playerState, panel, () => self._loadMultiQuestion(playerIndex));
            };
            btn.addEventListener('touchstart', eventHandler, {passive: false});
            btn.addEventListener('click', eventHandler);
            optRow.appendChild(btn);
        });
        panel.appendChild(optRow);
    },

    // ==================== OYUN BİTİŞİ ====================
    _gameOver: function() {
        if(this.state.isFinished) return;
        this.state.isFinished = true;
        clearInterval(this.state.timerInterval);
        Derslig.bitir(() => {});

        // Turnuva modu → callback ile sonuçları aktar
        if(this._onMatchComplete) {
            const cb = this._onMatchComplete;
            this._onMatchComplete = null;
            this._tournamentPlayerNames = null;
            cb(this.state.players);
            return;
        }

        if(this.state.mod === 'tek') {
            this._showSoloResult();
        } else {
            this._showMultiResult();
        }
    },

    _showSoloResult: async function() {
        const score = this.state.players[0].puan;
        
        let isEligible = false;
        if(Derslig.isEligibleForTop5) {
            isEligible = await Derslig.isEligibleForTop5(score, "yuvarlama_pisti_global");
        }

        const overlay = document.createElement('div');
        overlay.className = 'dl-result-overlay';
        
        let contentHtml = `
            <div class="dl-result-score">${score}</div>
            <div class="dl-result-label">Puan</div>
        `;

        if(isEligible && score > 0) {
            contentHtml += `
                <div class="dl-lb-input-area" style="margin-top:20px; max-width:400px;">
                    <div class="dl-lb-input-msg">Tebrikler! İlk 5 sıralamasına girdin.</div>
                    <input type="text" id="dl-lb-name-input" class="dl-lb-input" placeholder="Sıralama İçin Adını Yaz..." maxlength="25" autocomplete="off">
                    <button class="dl-lb-btn" id="dl-lb-save-btn">Sıralamaya Kaydet</button>
                    <button class="dl-lb-btn close" id="dl-lb-skip-btn" style="margin-top:10px;">Kaydetmeden Geç</button>
                </div>
            `;
        } else {
            contentHtml += `
                <div class="dl-result-buttons" style="margin-top:30px; display:flex; flex-direction:column; gap:10px;">
                    <button class="dl-result-btn primary" id="result-retry" style="width:100%;">Tekrar Oyna</button>
                    <button class="dl-lb-btn close" id="result-show-lb" style="width:100%;">Liderlik Tablosunu Gör</button>
                    <button class="dl-result-btn secondary" id="result-exit" style="width:100%; border:none;">Ana Menü</button>
                </div>
            `;
        }

        overlay.innerHTML = contentHtml;
        this.container.appendChild(overlay);

        if(isEligible && score > 0) {
            const saveBtn = document.getElementById('dl-lb-save-btn');
            const skipBtn = document.getElementById('dl-lb-skip-btn');
            const nameInput = document.getElementById('dl-lb-name-input');
            
            saveBtn.addEventListener('click', async () => {
                const name = nameInput.value.trim() || 'Oyuncu';
                Derslig?.tiklamaSesi?.();
                if(Derslig.saveToLeaderboard) {
                    await Derslig.saveToLeaderboard(name, score, "yuvarlama_pisti_global");
                }
                overlay.remove();
                this._showLeaderboardView(name);
            });

            skipBtn.addEventListener('click', () => {
                Derslig?.tiklamaSesi?.();
                overlay.remove();
                this._showLeaderboardView(null);
            });
        } else {
            document.getElementById('result-retry').addEventListener('click', () => { Derslig?.tiklamaSesi?.(); location.reload(); });
            document.getElementById('result-exit').addEventListener('click', () => { Derslig?.cikis?.(); });
            document.getElementById('result-show-lb').addEventListener('click', () => {
                Derslig?.tiklamaSesi?.();
                this._showLeaderboardView(null);
            });
        }
    },

    _showLeaderboardView: async function(highlightName = null) {
        let list = [];
        if(Derslig.getLeaderboard) {
            list = await Derslig.getLeaderboard("yuvarlama_pisti_global");
        }

        const modalDiv = document.createElement('div');
        modalDiv.className = 'dl-lb-modal';
        
        let listHtml = '';
        if(list.length === 0) {
            listHtml = '<div style="color:#aaa; text-align:center; padding:20px;">Henüz listeye giren kimse yok. İlk sen ol!</div>';
        } else {
            list.forEach((item, index) => {
                const isMe = highlightName && item.name === highlightName;
                listHtml += `
                    <div class="dl-lb-item ${isMe ? 'highlight' : ''}">
                        <div class="dl-lb-rank">${index + 1}</div>
                        <div class="dl-lb-name">${item.name}</div>
                        <div class="dl-lb-score">${item.score}</div>
                    </div>
                `;
            });
        }

        modalDiv.innerHTML = `
            <div class="dl-lb-wrapper">
                <div class="dl-lb-header">
                    <div class="dl-lb-title">İLK 5 SIRALAMASI</div>
                    <div class="dl-lb-subtitle">Yuvarlama Kazan! - Genel Puan Durumu</div>
                </div>
                <div class="dl-lb-list">
                    ${listHtml}
                </div>
                <div style="display:flex; gap:10px; width:100%;">
                    <button class="dl-lb-btn" id="dl-lb-final-retry" style="flex:1;">Tekrar Oyna</button>
                    <button class="dl-lb-btn close" id="dl-lb-final-exit" style="flex:1;">Ana Menü</button>
                </div>
            </div>
        `;
        
        this.container.appendChild(modalDiv);
        
        document.getElementById('dl-lb-final-retry').addEventListener('click', () => {
            Derslig?.tiklamaSesi?.();
            location.reload();
        });
        document.getElementById('dl-lb-final-exit').addEventListener('click', () => {
            Derslig?.tiklamaSesi?.();
            Derslig?.cikis?.();
        });
    },

    _showMultiResult: function() {
        const players = this.state.players;
        
        // Kazananı bul
        let maxScore = -1;
        let winnerId = -1;
        let tie = false;
        players.forEach((p, i) => {
            if(p.puan > maxScore) {
                maxScore = p.puan;
                winnerId = i;
                tie = false;
            } else if(p.puan === maxScore) {
                tie = true;
            }
        });

        const winnerText = tie ? 'Berabere!' : `Oyuncu ${winnerId + 1} Kazandı!`;

        // Skor kartları
        let scoresHTML = '<div style="display:flex; gap:30px; margin-top:20px; flex-wrap:wrap; justify-content:center;">';
        players.forEach((p, i) => {
            const isWinner = !tie && i === winnerId;
            scoresHTML += `
                <div style="text-align:center; ${isWinner ? 'transform:scale(1.1);' : ''}">
                    <div style="color:${isWinner ? '#e50069' : '#888'}; font-size:16px; font-weight:700;">
                        ${isWinner ? '👑 ' : ''}Oyuncu ${i+1}
                    </div>
                    <div class="dl-result-score" style="font-size:52px; ${isWinner ? 'color:#e50069;' : ''}">${p.puan}</div>
                    <div style="color:#aaa; font-size:13px;">D:${p.totalDogru} Y:${p.totalYanlis}</div>
                </div>
            `;
        });
        scoresHTML += '</div>';

        const overlay = document.createElement('div');
        overlay.className = 'dl-result-overlay';
        overlay.innerHTML = `
            <div class="dl-result-label" style="font-size:32px; color:#222; font-weight:900;">${winnerText}</div>
            ${scoresHTML}
            <div class="dl-result-buttons">
                <button class="dl-result-btn primary" id="result-retry">Tekrar Oyna</button>
                <button class="dl-result-btn secondary" id="result-exit">Çıkış</button>
            </div>
        `;
        this.container.appendChild(overlay);
        document.getElementById('result-retry').addEventListener('click', () => location.reload());
        document.getElementById('result-exit').addEventListener('click', () => Derslig.cikis());
    }
};

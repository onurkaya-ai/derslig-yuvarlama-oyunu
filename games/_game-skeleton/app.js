/**
 * ===========================================================
 * DERSLİG OYUN MOTORU İSKELETİ
 * ===========================================================
 * 
 * Bu dosya yeni bir Derslig oyunu geliştirirken temel yapıyı
 * sağlar. Kendi oyun mantığınızı bu iskeletin üzerine inşa edin.
 * 
 * Kullanıcının yapması gerekenler:
 * 1. ObjeName'i kendi oyun adıyla değiştirin (ör: CarpmaEngine)
 * 2. _createQuestion() fonksiyonunu kendi soru mantığınızla doldurun
 * 3. Gerekirse _handleAnswer() fonksiyonunu özelleştirin
 * 4. index.html'deki onStart callback'ini bu motora bağlayın
 * ===========================================================
 */
const GameEngine = {
    settings: {
        // Oyuna özel ayarlar (Lobby'den gelir)
        sure: 60
    },

    state: {
        mod: 'tek',
        playerCount: 1,
        timerInterval: null,
        kalanSure: 60,
        isFinished: false,
        players: []
    },

    container: null,
    _onMatchComplete: null,        // Turnuva callback
    _tournamentPlayerNames: null,  // Turnuva oyuncu isimleri

    // Oyuncu state fabrikası
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

    // ==================== ANA BAŞLATICI ====================
    start: function(containerId, mod, ayarlar) {
        this.container = document.getElementById(containerId);
        if(!this.container) return;

        this.state.mod = mod;
        this.state.isFinished = false;
        this.settings.sure = ayarlar.sure || 60;
        this.state.kalanSure = this.settings.sure;

        // Ayarlarınızı burada parse edin
        // this.settings.ozelAyar = ayarlar.ozelAyar || varsayilan;

        // Oyuncu sayısını belirle
        if(mod === 'tek') this.state.playerCount = 1;
        else if(mod === 'multi-2') this.state.playerCount = 2;
        else if(mod === 'multi-3') this.state.playerCount = 3;
        else if(mod === 'multi-4') this.state.playerCount = 4;

        // Oyuncu state'lerini oluştur
        this.state.players = [];
        for(let i = 0; i < this.state.playerCount; i++) {
            this.state.players.push(this._createPlayerState());
        }

        Derslig?.init?.({
            oyunAdi: "Oyun Adı",
            soruSayisi: 10,
            maxPuan: 20
        });
        Derslig?.baslangicSesi?.();

        if(mod === 'tek') {
            this._renderSolo();
        } else {
            this._renderMulti();
        }

        this._startTimer();
    },

    // ==================== SORU ÜRETİCİ (BURAYA YAZIN) ====================
    _createQuestion: function() {
        /**
         * Bu fonksiyon bir soru objesi döndürmelidir:
         * {
         *   display: '...' ,     // Ekranda gösterilecek soru/sayı
         *   label: '...',        // Alt etiket (ör: "Çarpımı bul")
         *   correct: <değer>,    // Doğru cevap
         *   options: [<değer>, <değer>, <değer>]  // Seçenekler (karıştırılmış)
         * }
         */
        
        // ÖRNEK: Basit toplama sorusu
        const a = Math.floor(Math.random() * 50) + 1;
        const b = Math.floor(Math.random() * 50) + 1;
        const correct = a + b;
        const options = [correct, correct + 5, correct - 3].sort(() => Math.random() - 0.5);
        
        return {
            display: `${a} + ${b}`,
            label: 'Toplamı Bul',
            correct: correct,
            options: options
        };
    },

    // ==================== TEK OYUNCU RENDER ====================
    _renderSolo: function() {
        const rekor = parseInt(localStorage.getItem('oyun_adi_rekor') || '0');
        
        this.container.innerHTML = `
            <div class="dl-top-bar">
                <div class="dl-progress-bar">
                    <div class="dl-progress-fill" id="dl-progress-fill" style="width: 100%"></div>
                </div>
                <div class="dl-score-row">
                    <div class="dl-puan-label"><span id="dl-score-p1">0</span> Puan</div>
                    <div class="dl-sure-label" id="dl-timer-value">${this.state.kalanSure}</div>
                    <div class="dl-rekor-area">
                        <div class="dl-rekor-title">Rekor</div>
                        <div class="dl-rekor-value" id="dl-rekor-value">${rekor} Puan</div>
                    </div>
                </div>
            </div>
            <div class="dl-question-area" id="dl-solo-area">
                <div class="dl-bg-pattern"></div>
            </div>
            ${this._getControlsHTML()}
        `;

        this._bindGameControls();
        this._loadSoloQuestion();
    },

    _loadSoloQuestion: function() {
        if(this.state.isFinished) return;
        const self = this;
        const area = document.getElementById('dl-solo-area');
        if(!area) return;

        const q = this._createQuestion();

        // Eski elementleri temizle (bg-pattern kalsın)
        ['dl-round-label','dl-target-number','dl-approx-symbol','dl-options-row','dl-feedback-toast'].forEach(cls => {
            const el = area.querySelector('.' + cls);
            if(el) el.remove();
        });

        const labelDiv = document.createElement('div');
        labelDiv.className = 'dl-round-label';
        labelDiv.textContent = q.label;
        area.appendChild(labelDiv);

        const numDiv = document.createElement('div');
        numDiv.className = 'dl-target-number';
        numDiv.textContent = q.display;
        area.appendChild(numDiv);

        const approxDiv = document.createElement('div');
        approxDiv.className = 'dl-approx-symbol';
        approxDiv.textContent = '=';
        area.appendChild(approxDiv);

        const optsRow = document.createElement('div');
        optsRow.className = 'dl-options-row';
        q.options.forEach(val => {
            const btn = document.createElement('button');
            btn.className = 'dl-option-btn';
            btn.dataset.val = val;
            btn.textContent = val;
            btn.addEventListener('click', function() {
                self._handleAnswer(parseInt(this.dataset.val), this, q.correct, self.state.players[0], area, () => self._loadSoloQuestion());
            });
            optsRow.appendChild(btn);
        });
        area.appendChild(optsRow);
    },

    // ==================== ÇOK OYUNCU RENDER ====================
    _renderMulti: function() {
        const count = this.state.playerCount;
        
        let headerHTML = `
            <div class="dl-top-bar">
                <div class="dl-progress-bar">
                    <div class="dl-progress-fill" id="dl-progress-fill" style="width: 100%"></div>
                </div>
                <div class="dl-score-row">
                    <div class="dl-puan-label"><span id="dl-timer-value">${this.state.kalanSure}</span> sn</div>
                    <div></div><div></div>
                </div>
            </div>
        `;

        let panelsHTML = '';
        for(let i = 0; i < count; i++) {
            const pName = (this._tournamentPlayerNames && this._tournamentPlayerNames[i]) ? this._tournamentPlayerNames[i] : 'Oyuncu ' + (i+1);
            panelsHTML += `
                <div class="dl-player-panel" id="dl-panel-p${i+1}">
                    <div class="dl-player-score">${pName}: <span id="dl-score-p${i+1}">0</span> Puan</div>
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
        tnum.textContent = q.display;
        panel.appendChild(tnum);

        const approx = document.createElement('div');
        approx.className = 'dl-approx-symbol';
        approx.textContent = '=';
        panel.appendChild(approx);

        const optRow = document.createElement('div');
        optRow.className = 'dl-options-row';
        q.options.forEach(val => {
            const btn = document.createElement('button');
            btn.className = 'dl-option-btn';
            btn.dataset.val = val;
            btn.textContent = val;
            btn.addEventListener('click', function() {
                self._handleAnswer(parseInt(this.dataset.val), this, q.correct, playerState, panel, () => self._loadMultiQuestion(playerIndex));
            });
            optRow.appendChild(btn);
        });
        panel.appendChild(optRow);
    },

    // ==================== TEPKİ & CEVAP ====================
    _getCorrectFeedback: function(playerState) {
        const position = playerState.dogruSerisi % 4;
        const feedbacks = [
            { text: 'Tebrikler', points: 10 },
            { text: 'Bravo', points: 10 },
            { text: 'Harikasın', points: 10 },
            { text: 'Süpersin', points: 30 }
        ];
        return feedbacks[position];
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

    _handleAnswer: function(selectedValue, btnNode, correct, playerState, panelElement, nextQuestionFn) {
        if(playerState.isLocked || this.state.isFinished) return;

        if(selectedValue === correct) {
            const feedback = this._getCorrectFeedback(playerState);
            playerState.puan += feedback.points;
            playerState.dogruSerisi++;
            playerState.yanlisSerisi = 0;
            playerState.totalDogru++;
            Derslig?.dogruCevap?.();
            this._showFeedbackToast(panelElement, feedback.text, feedback.points, true);
            this._updateScoreDisplay();
            nextQuestionFn();
        } else {
            playerState.dogruSerisi = 0;
            playerState.yanlisSerisi++;
            playerState.totalYanlis++;
            Derslig?.yanlisCevap?.();

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
            if(this.state.kalanSure > 0) Derslig?.sureSesi?.();
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
                const muted = Derslig?.toggleMute?.();
                if(muted !== undefined) this.style.opacity = muted ? '0.3' : '1';
            });
        }
        const fsBtn = document.getElementById('dl-fs-btn');
        if(fsBtn) {
            fsBtn.addEventListener('click', function() {
                const el = document.documentElement;
                if(!document.fullscreenElement && !document.webkitFullscreenElement) {
                    if(el.requestFullscreen) el.requestFullscreen();
                    else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen();
                } else {
                    if(document.exitFullscreen) document.exitFullscreen();
                    else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
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

    // ==================== OYUN BİTİŞİ ====================
    _gameOver: function() {
        if(this.state.isFinished) return;
        this.state.isFinished = true;
        clearInterval(this.state.timerInterval);
        Derslig?.bitir?.(() => {});

        // Turnuva modu → callback
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

    _showSoloResult: function() {
        const score = this.state.players[0].puan;
        const storageKey = 'oyun_adi_rekor'; // Oyununuza göre değiştirin
        const prevRekor = parseInt(localStorage.getItem(storageKey) || '0');
        const isNewRecord = score >= 10 && score > prevRekor;
        if(score > prevRekor) localStorage.setItem(storageKey, score.toString());

        const overlay = document.createElement('div');
        overlay.className = 'dl-result-overlay';
        overlay.innerHTML = `
            <div class="dl-result-score">${score}</div>
            <div class="dl-result-label">Puan</div>
            ${isNewRecord ? '<div class="dl-result-record">Tebrikler yeni bir rekora sahipsin</div>' : ''}
            <div class="dl-result-buttons">
                <button class="dl-result-btn primary" id="result-retry">Tekrar Oyna</button>
                <button class="dl-result-btn secondary" id="result-exit">Çıkış</button>
            </div>
        `;
        this.container.appendChild(overlay);
        document.getElementById('result-retry').addEventListener('click', () => location.reload());
        document.getElementById('result-exit').addEventListener('click', () => Derslig?.cikis?.());
    },

    _showMultiResult: function() {
        const players = this.state.players;
        let maxScore = -1, winnerId = -1, tie = false;
        
        players.forEach((p, i) => {
            if(p.puan > maxScore) { maxScore = p.puan; winnerId = i; tie = false; }
            else if(p.puan === maxScore) tie = true;
        });

        const winnerText = tie ? 'Berabere!' : `Oyuncu ${winnerId + 1} Kazandı!`;

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
        document.getElementById('result-exit').addEventListener('click', () => Derslig?.cikis?.());
    }
};

/**
 * Derslig Turnuva Motoru - Yuvarlama Pisti
 * Sınıf bazlı eleme turnuvası sistemi
 * 
 * Akış: Kurulum → Bracket → Hazırlık → Geri Sayım → Maç → Kazanan → Sonraki Tur → Şampiyon
 * 
 * Özellikler:
 *  - localStorage ile turnuva durumu kalıcılığı (yenilenme koruması)
 *  - Adil beraberlik çözüm sistemi (en az yanlış kazanır)
 *  - Optional chaining ile güvenli dış bağımlılık çağrıları
 *  - Temiz DOM geçişleri
 */
const TurnuvaEngine = {
    _STORAGE_KEY: 'derslig_active_tournament',

    state: {
        players: [],        // [{name, id}]
        groupSize: 2,       // 2, 3 veya 4
        rounds: [],         // [{matches: [{players:[], winnerId:null, isBye:bool}]}]
        currentRound: 0,
        currentMatch: 0,
        settings: {},
        isActive: false
    },

    // ==================== STATE PERSISTENCE ====================
    _saveState: function() {
        try {
            localStorage.setItem(this._STORAGE_KEY, JSON.stringify(this.state));
        } catch(e) { /* quota aşılmışsa sessizce geç */ }
    },

    _loadState: function() {
        try {
            const data = localStorage.getItem(this._STORAGE_KEY);
            if(data) return JSON.parse(data);
        } catch(e) { /* bozuk veri */ }
        return null;
    },

    _clearState: function() {
        localStorage.removeItem(this._STORAGE_KEY);
    },

    // ==================== KURULUM EKRANI ====================
    showSetup: function(gameSettings) {
        this.state.settings = { ...gameSettings };
        const container = document.getElementById('derslig-app');
        if(!container) return;

        // Devam eden turnuva var mı kontrol et
        const saved = this._loadState();
        if(saved && saved.isActive) {
            const resume = confirm('Devam eden bir turnuva var. Devam etmek ister misiniz?\n\n"İptal" → Yeni turnuva başlat');
            if(resume) {
                this.state = saved;
                this._showBracket();
                return;
            } else {
                this._clearState();
            }
        }

        let savedClasses = JSON.parse(localStorage.getItem('derslig_saved_classes') || '[]');

        const overlay = document.createElement('div');
        overlay.className = 'dl-settings-overlay active';
        overlay.id = 'dl-turnuva-setup';

        overlay.innerHTML = `
            <div class="dl-settings-panel" style="max-width:560px;">
                <div class="dl-settings-title" style="margin-bottom:10px;">Turnuva Kurulumu</div>
                
                <div style="padding:0 20px;">
                    <!-- Giriş Yöntemi -->
                    <div class="dl-setup-section" style="margin-bottom:15px;">
                        <div class="dl-setup-tabs">
                            <button class="dl-setup-tab active" data-tab="saved">Kayıtlı Sınıflar</button>
                            <button class="dl-setup-tab" data-tab="new">Yeni Sınıf</button>
                            <button class="dl-setup-tab" data-tab="count">Hızlı (Mevcut)</button>
                        </div>
                        
                        <!-- TAB 1: Kayıtlı Sınıflar -->
                        <div class="dl-setup-tab-content" id="tab-saved">
                            ${savedClasses.length > 0 ? `
                                <select id="turnuva-class-select" class="dl-setup-input" style="margin-bottom:5px;">
                                    ${savedClasses.map((c,i) => `<option value="${i}">${c.name} (${c.students.length} Öğrenci)</option>`).join('')}
                                </select>
                                <div style="color:#aaa; font-size:13px; text-align:center;">Seçili sınıfla turnuva başlatılacak.</div>
                            ` : `
                                <div style="text-align:center; padding:15px; color:#ccc;">Kayıtlı sınıf yok. 'Yeni Sınıf' ekleyebilirsiniz.</div>
                            `}
                        </div>
                        
                        <!-- TAB 2: Yeni Sınıf -->
                        <div class="dl-setup-tab-content dl-hidden" id="tab-new">
                            <input type="text" id="new-class-name" class="dl-setup-input" placeholder="Sınıf Adı (Örn: 6/A)" style="margin-bottom:8px;">
                            <textarea id="turnuva-names" class="dl-setup-textarea" placeholder="Her satıra bir isim yazın&#10;Ahmet&#10;Ayşe..." rows="4"></textarea>
                            <button class="dl-settings-btn primary" id="btn-save-class" style="width:100%; margin-top:8px; padding:12px; font-size:15px;">Sınıfı Kaydet</button>
                        </div>

                        <!-- TAB 3: Sınıf Mevcudu -->
                        <div class="dl-setup-tab-content dl-hidden" id="tab-count">
                            <input type="number" id="turnuva-count" class="dl-setup-input" placeholder="Mevcut girin (ör: 24)" min="4" max="50" value="16">
                        </div>
                    </div>

                    <!-- Grup Boyutu -->
                    <div class="dl-setup-section" style="margin-bottom:10px;">
                        <h3 style="color:#fff; margin-bottom:8px; font-size:14px; text-align:center;">TURNUVA MAÇLARI</h3>
                        <div class="dl-setup-group-options">
                            <button class="dl-setup-group-btn active" data-size="2">2'li Gruplar</button>
                            <button class="dl-setup-group-btn" data-size="3">3'lü Gruplar</button>
                            <button class="dl-setup-group-btn" data-size="4">4'lü Gruplar</button>
                        </div>
                    </div>
                </div>

                <div class="dl-settings-buttons" style="margin-top:15px;">
                    <button class="dl-settings-btn secondary" id="turnuva-cancel">İptal</button>
                    <button class="dl-settings-btn primary" id="turnuva-start" style="background:#f7c948; color:#333; font-weight:900;">Turnuvayı Başlat</button>
                </div>
            </div>
        `;

        container.appendChild(overlay);

        // Tab switching
        overlay.querySelectorAll('.dl-setup-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                Derslig?.tiklamaSesi?.();
                overlay.querySelectorAll('.dl-setup-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                document.getElementById('tab-saved').classList.toggle('dl-hidden', this.dataset.tab !== 'saved');
                document.getElementById('tab-new').classList.toggle('dl-hidden', this.dataset.tab !== 'new');
                document.getElementById('tab-count').classList.toggle('dl-hidden', this.dataset.tab !== 'count');
            });
        });

        // Group size
        overlay.querySelectorAll('.dl-setup-group-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                Derslig?.tiklamaSesi?.();
                overlay.querySelectorAll('.dl-setup-group-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Sınıf Kaydetme
        const saveClassBtn = document.getElementById('btn-save-class');
        if(saveClassBtn) {
            saveClassBtn.addEventListener('click', function() {
                const className = document.getElementById('new-class-name').value.trim();
                const text = document.getElementById('turnuva-names').value.trim();
                const lines = text.split('\n').filter(l => l.trim().length > 0);
                
                if(!className) return alert("Lütfen sınıf adı giriniz!");
                if(lines.length < 4) return alert("En az 4 isim girmelisiniz!");

                Derslig?.tiklamaSesi?.();
                savedClasses.push({ name: className, students: lines });
                localStorage.setItem('derslig_saved_classes', JSON.stringify(savedClasses));
                alert("Sınıf başarıyla kaydedildi!");
                
                overlay.remove();
                TurnuvaEngine.showSetup(gameSettings);
            });
        }

        // Cancel
        document.getElementById('turnuva-cancel').addEventListener('click', function() {
            Derslig?.tiklamaSesi?.();
            overlay.remove();
        });

        // Start
        const self = this;
        document.getElementById('turnuva-start').addEventListener('click', function() {
            Derslig?.tiklamaSesi?.();
            
            const groupSize = parseInt(overlay.querySelector('.dl-setup-group-btn.active').dataset.size);
            const activeTab = overlay.querySelector('.dl-setup-tab.active').dataset.tab;
            
            let players = [];
            
            if(activeTab === 'saved') {
                if(savedClasses.length === 0) return alert("Kayıtlı sınıf yok! Yeni sınıf sekmesinden ekleyin.");
                const idx = parseInt(document.getElementById('turnuva-class-select').value);
                savedClasses[idx].students.forEach((name, i) => {
                    players.push({ name: name.trim(), id: i + 1 });
                });
            } else if(activeTab === 'count') {
                const count = parseInt(document.getElementById('turnuva-count').value) || 16;
                for(let i = 1; i <= count; i++) {
                    players.push({ name: 'Oyuncu ' + i, id: i });
                }
            } else {
                const text = document.getElementById('turnuva-names').value.trim();
                const lines = text.split('\n').filter(l => l.trim().length > 0);
                if(lines.length < 4) return alert('En az 4 öğrenci girilmelidir!');
                lines.forEach((name, i) => {
                    players.push({ name: name.trim(), id: i + 1 });
                });
            }

            overlay.remove();
            self._initTournament(players, groupSize);
        });
    },

    // ==================== TURNUVA BAŞLAT ====================
    _initTournament: function(players, groupSize) {
        // Shuffle players (Fisher-Yates)
        for(let i = players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [players[i], players[j]] = [players[j], players[i]];
        }

        this.state.players = players;
        this.state.groupSize = groupSize;
        this.state.currentRound = 0;
        this.state.currentMatch = 0;
        this.state.isActive = true;

        // İlk turu oluştur
        this.state.rounds = [];
        this._generateRound(players.map(p => p.id));
        this._saveState();
        
        // Bracket göster
        this._showBracket();
    },

    // ==================== TUR OLUŞTUR ====================
    _generateRound: function(playerIds) {
        const gs = this.state.groupSize;
        const matches = [];
        let remaining = [...playerIds];

        let i = 0;
        while(i < remaining.length) {
            const groupPlayers = remaining.slice(i, i + gs);
            
            if(groupPlayers.length === 1) {
                // Tek kişi → bay geçer (otomatik kazanan)
                matches.push({
                    players: groupPlayers,
                    winnerId: groupPlayers[0],
                    isBye: true
                });
            } else {
                matches.push({
                    players: groupPlayers,
                    winnerId: null,
                    isBye: false
                });
            }
            i += gs;
        }

        this.state.rounds.push({ matches });
    },

    // ==================== BRACKET GÖSTERİM ====================
    _showBracket: function() {
        // Lobby'yi gizle
        const lobby = document.getElementById('dl-lobby-screen');
        if(lobby) lobby.style.display = 'none';

        const gameLayer = document.getElementById('dl-game-layer');
        if(!gameLayer) return;
        gameLayer.innerHTML = ''; // DOM temizliği
        gameLayer.style.display = 'flex';
        
        const round = this.state.rounds[this.state.currentRound];
        if(!round) return;
        const totalRounds = this._estimateTotalRounds();
        
        // Oynanacak ilk maçı bul
        let nextMatchIdx = -1;
        for(let i = 0; i < round.matches.length; i++) {
            if(!round.matches[i].winnerId && !round.matches[i].isBye) {
                nextMatchIdx = i;
                break;
            }
        }

        const isFinal = this.state.currentRound + 1 >= totalRounds;

        gameLayer.innerHTML = `
            <div class="dl-turnuva-bracket">
                <div class="dl-turnuva-header">
                    <div class="dl-turnuva-round-label">Tur ${this.state.currentRound + 1}${isFinal ? ' — FİNAL' : ''}</div>
                    <div class="dl-turnuva-info">${this.state.players.length} öğrenci · ${this.state.groupSize}'li gruplar</div>
                </div>
                <div class="dl-turnuva-matches" id="dl-bracket-matches">
                    ${round.matches.map((m, idx) => this._renderMatchCard(m, idx, nextMatchIdx)).join('')}
                </div>
                <div class="dl-turnuva-actions">
                    ${nextMatchIdx >= 0 ? `
                        <button class="dl-turnuva-play-btn" id="dl-play-match">
                            Maç ${nextMatchIdx + 1}'i Başlat
                        </button>
                    ` : `
                        <button class="dl-turnuva-play-btn" id="dl-next-round">
                            Sonraki Tur →
                        </button>
                    `}
                    <button class="dl-turnuva-exit-btn" id="dl-turnuva-exit">Turnuvadan Çık</button>
                </div>
            </div>
        `;

        // Event binding
        const self = this;
        
        const playBtn = document.getElementById('dl-play-match');
        if(playBtn) {
            playBtn.addEventListener('click', function() {
                Derslig?.tiklamaSesi?.();
                self.state.currentMatch = nextMatchIdx;
                self._playMatch(nextMatchIdx);
            });
        }

        const nextBtn = document.getElementById('dl-next-round');
        if(nextBtn) {
            nextBtn.addEventListener('click', function() {
                Derslig?.tiklamaSesi?.();
                self._advanceToNextRound();
            });
        }

        document.getElementById('dl-turnuva-exit').addEventListener('click', function() {
            Derslig?.tiklamaSesi?.();
            if(confirm('Turnuvadan çıkmak istediğinize emin misiniz?')) {
                self.state.isActive = false;
                self._clearState();
                location.reload();
            }
        });
    },

    _renderMatchCard: function(match, idx, nextMatchIdx) {
        const isNext = (idx === nextMatchIdx);
        const isDone = !!match.winnerId;
        const isBye = match.isBye;

        let statusClass = '';
        if(isDone) statusClass = 'done';
        else if(isNext) statusClass = 'next';

        const playerNames = match.players.map(pid => {
            const p = this.state.players.find(x => x.id === pid);
            const isWinner = match.winnerId === pid;
            return `<div class="dl-match-player ${isWinner ? 'winner' : ''} ${isDone && !isWinner ? 'loser' : ''}">${p ? p.name : '?'}</div>`;
        }).join('');

        return `
            <div class="dl-match-card ${statusClass}">
                <div class="dl-match-number">${isBye ? 'BAY' : 'Maç ' + (idx + 1)}</div>
                <div class="dl-match-players">${playerNames}</div>
                ${isDone ? `<div class="dl-match-result">✓ ${this._getPlayerName(match.winnerId)} kazandı</div>` : ''}
                ${isNext ? '<div class="dl-match-status">Sıradaki</div>' : ''}
            </div>
        `;
    },

    _getPlayerName: function(playerId) {
        const p = this.state.players.find(x => x.id === playerId);
        return p ? p.name : '?';
    },

    _estimateTotalRounds: function() {
        let count = this.state.players.length;
        let rounds = 0;
        while(count > 1) {
            count = Math.ceil(count / this.state.groupSize);
            rounds++;
        }
        return rounds;
    },

    // ==================== MAÇ OYNA (HAZIRLIK EKRANI) ====================
    _playMatch: function(matchIdx) {
        const round = this.state.rounds[this.state.currentRound];
        const match = round.matches[matchIdx];
        const self = this;

        const matchPlayerNames = match.players.map(pid => this._getPlayerName(pid));
        const count = match.players.length;

        const gameLayer = document.getElementById('dl-game-layer');
        gameLayer.innerHTML = ''; // Temiz başlangıç
        
        let panelsHTML = '';
        for(let i = 0; i < count; i++) {
            panelsHTML += `
                <div class="dl-player-panel" style="justify-content:center; align-items:center;">
                    <div style="font-size:32px; font-weight:900; color:#fff; border-radius:10px; padding:10px 30px; background:rgba(0,0,0,0.2); margin-bottom:40px; text-transform:uppercase;">${matchPlayerNames[i]}</div>
                    <button class="dl-ready-btn" data-player="${i}" style="padding:20px 40px; font-size:24px; font-weight:800; background:var(--dl-btn-gold); border:6px solid #e5a800; border-radius:50px; cursor:pointer; color:#333; transition:transform 0.1s;">HAZIRIM</button>
                    <div class="dl-ready-check dl-hidden" id="check-p${i}" style="font-size:48px; color:var(--dl-correct-green); margin-top:20px; font-weight:900; text-shadow:0 0 20px rgba(0,255,0,0.5);">HAZIR</div>
                </div>
            `;
        }

        gameLayer.innerHTML = `
            <div class="dl-top-bar" style="justify-content:center; background:#43c4f7; padding:16px;">
                <div style="color:#fff; font-size:32px; font-weight:900; text-transform:uppercase;">Maç Başlıyor — Tahtaya Geçin!</div>
            </div>
            
            <div class="dl-multi-container players-${count}">
                <div class="dl-bg-pattern" style="opacity:0.3;"></div>
                ${panelsHTML}
            </div>

            <!-- Geri Sayım Overlay (Başlangıçta gizli) -->
            <div id="dl-countdown-overlay" class="dl-hidden" style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:100; display:flex; justify-content:center; align-items:center;">
                <div id="dl-countdown-text" style="font-size:200px; font-weight:900; color:#fff; text-shadow:0 0 50px rgba(255,255,255,0.5);"></div>
            </div>
        `;

        let readyCount = 0;
        const btns = gameLayer.querySelectorAll('.dl-ready-btn');
        
        btns.forEach(btn => {
            btn.addEventListener('click', function() {
                Derslig?.tiklamaSesi?.();
                this.classList.add('dl-hidden');
                document.getElementById('check-p' + this.dataset.player).classList.remove('dl-hidden');
                readyCount++;

                // Herkes hazırsa geri sayımı başlat
                if(readyCount === count) {
                    setTimeout(() => {
                        startCountdown();
                    }, 500);
                }
            });
        });

        function startCountdown() {
            const overlay = document.getElementById('dl-countdown-overlay');
            const text = document.getElementById('dl-countdown-text');
            if(!overlay || !text) return;
            overlay.classList.remove('dl-hidden');
            overlay.style.display = 'flex';
            
            let c = 3;
            text.textContent = c;
            Derslig?.sureSesi?.();
            
            const interval = setInterval(() => {
                c--;
                if(c > 0) {
                    text.textContent = c;
                    Derslig?.sureSesi?.();
                } else {
                    clearInterval(interval);
                    text.textContent = "BAŞLA!";
                    text.style.fontSize = '120px';
                    Derslig?.baslangicSesi?.();
                    
                    setTimeout(() => {
                        gameLayer.innerHTML = '';
                        
                        YuvarlamaEngine._onMatchComplete = function(results) {
                            self._onMatchEnd(matchIdx, match.players, results);
                        };
                        YuvarlamaEngine._tournamentPlayerNames = matchPlayerNames;
                        
                        const mod = 'multi-' + count;
                        YuvarlamaEngine.start('dl-game-layer', mod, self.state.settings);
                    }, 600);
                }
            }, 1000);
        }
    },

    // ==================== MAÇ BİTTİ (BERABERLİK ÇÖZÜMLÜ) ====================
    _onMatchEnd: function(matchIdx, playerIds, results) {
        // En yüksek puanı bul
        let maxPuan = -1;
        results.forEach(p => {
            if(p.puan > maxPuan) maxPuan = p.puan;
        });

        // En yüksek puana sahip oyuncuları topla
        const topPlayers = [];
        results.forEach((p, i) => {
            if(p.puan === maxPuan) topPlayers.push({ index: i, puan: p.puan, totalYanlis: p.totalYanlis || 0, totalDogru: p.totalDogru || 0 });
        });

        let winnerIdx;
        if(topPlayers.length === 1) {
            // Tek kazanan var
            winnerIdx = topPlayers[0].index;
        } else {
            // BERABERLİK! En az yanlış yapanı bul
            topPlayers.sort((a, b) => a.totalYanlis - b.totalYanlis);
            if(topPlayers[0].totalYanlis < topPlayers[1].totalYanlis) {
                winnerIdx = topPlayers[0].index;
            } else {
                // Yanlış da eşit → en çok doğruyu bul
                topPlayers.sort((a, b) => b.totalDogru - a.totalDogru);
                if(topPlayers[0].totalDogru > topPlayers[1].totalDogru) {
                    winnerIdx = topPlayers[0].index;
                } else {
                    // Her şey eşit → rastgele kura
                    const randomIdx = Math.floor(Math.random() * topPlayers.length);
                    winnerIdx = topPlayers[randomIdx].index;
                }
            }
        }

        const winnerId = playerIds[winnerIdx];
        const round = this.state.rounds[this.state.currentRound];
        round.matches[matchIdx].winnerId = winnerId;

        // Durumu kaydet
        this._saveState();

        // Bracket'a dön
        setTimeout(() => {
            this._showBracket();
        }, 500);
    },

    // ==================== SONRAKİ TUR ====================
    _advanceToNextRound: function() {
        const round = this.state.rounds[this.state.currentRound];
        
        // Tüm kazananları topla
        const winners = round.matches.map(m => m.winnerId).filter(id => id !== null);

        if(winners.length <= 1) {
            // ŞAMPİYON!
            this._showChampion(winners[0]);
            return;
        }

        // Yeni tur oluştur
        this.state.currentRound++;
        this._generateRound(winners);
        this._saveState();
        this._showBracket();
    },

    // ==================== ŞAMPİYON ====================
    // ==================== ŞAMPİYON ====================
    _showChampion: function(winnerId) {
        const winnerName = this._getPlayerName(winnerId);
        const gameLayer = document.getElementById('dl-game-layer');
        if(!gameLayer) return;
        gameLayer.innerHTML = ''; // Temiz başlangıç

        // Turnuvayı bitir ve temizle
        this.state.isActive = false;
        this._clearState();

        gameLayer.innerHTML = `
            <div class="dl-champion-screen">
                <div class="dl-champion-trophy" aria-hidden="true">🏆</div>
                <div class="dl-champion-title">ŞAMPİYON!</div>
                <div class="dl-champion-name">${winnerName}</div>
                <div class="dl-champion-stats">
                    ${this.state.players.length} öğrenci arasından şampiyon oldu
                </div>
                
                <div class="dl-champion-actions">
                    <button class="dl-cert-btn gold" id="champion-cert">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>
                        Sertifikamı Ver
                    </button>
                    <button class="dl-cert-btn blue" id="champion-restart">Yeni Turnuva</button>
                    <button class="dl-cert-btn outline" id="champion-exit">Ana Menü</button>
                </div>
            </div>
        `;

        Derslig?.baslangicSesi?.();

        document.getElementById('champion-restart').addEventListener('click', () => {
            Derslig?.tiklamaSesi?.();
            this.showSetup(this.state.settings);
        });

        document.getElementById('champion-exit').addEventListener('click', () => {
            Derslig?.tiklamaSesi?.();
            location.reload();
        });

        const self = this;
        document.getElementById('champion-cert').addEventListener('click', () => {
            Derslig?.tiklamaSesi?.();
            self._showCertificate(winnerName);
        });
    },

    _showCertificate: function(playerName) {
        const gameLayer = document.getElementById('dl-game-layer');
        if(!gameLayer) return;

        const totalRounds = this.state.currentRound + 1;
        const totalPlayers = this.state.players.length;

        const modalHtml = `
            <div class="dl-cert-modal" id="dl-cert-modal">
                <div class="dl-cert-wrapper">
                    <canvas id="dl-cert-canvas" width="800" height="565" class="dl-cert-canvas"></canvas>
                    <div class="dl-cert-actions">
                        <button class="dl-cert-btn magenta" id="dl-cert-share">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/></svg>
                            Paylaş
                        </button>
                        <button class="dl-cert-btn gold" id="dl-cert-download">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                            Sertifikayı İndir
                        </button>
                        <button class="dl-cert-btn outline" id="dl-cert-close">Kapat</button>
                    </div>
                </div>
            </div>
        `;
        
        gameLayer.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = document.getElementById('dl-cert-modal');
        const canvas = document.getElementById('dl-cert-canvas');
        const ctx = canvas.getContext('2d');
        
        document.getElementById('dl-cert-close').addEventListener('click', () => {
             Derslig?.tiklamaSesi?.();
             modal.remove();
        });

        // Sertifika Çizimi
        function drawCertificate() {
            // Arka plan
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, 800, 565);
            
            // Desen Simulasyonu (Hafif arka plan deseni)
            ctx.fillStyle = "#f3f5f8";
            for(let i=0; i<=800; i+=30) {
                for(let j=0; j<=565; j+=30) {
                   ctx.beginPath();
                   ctx.arc(i, j, 4, 0, Math.PI*2);
                   ctx.fill();
                }
            }

            // Dış Çerçeveler
            ctx.strokeStyle = "#e50069"; // Magenta ana hat
            ctx.lineWidth = 14;
            ctx.strokeRect(10, 10, 780, 545);

            ctx.strokeStyle = "#f7c948"; // İç sarı çerçeve
            ctx.lineWidth = 3;
            ctx.strokeRect(30, 30, 740, 505);

            // Köşe Süsleri
            ctx.fillStyle = "#e50069";
            ctx.beginPath(); ctx.arc(30, 30, 12, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(770, 30, 12, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(30, 535, 12, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(770, 535, 12, 0, Math.PI*2); ctx.fill();

            // Derslig Logo Text
            ctx.fillStyle = "#e50069";
            ctx.font = "800 52px 'Nunito', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("derslig", 400, 100);

            // Başlık
            ctx.fillStyle = "#00a896";
            ctx.font = "bold 38px 'Georgia', serif";
            ctx.fillText("BAŞARI SERTİFİKASI", 400, 160);

            // Kurumsal Metinler - Teal Renkli
            ctx.fillStyle = "#00a896";
            ctx.font = "bold 18px 'Nunito', sans-serif";
            ctx.textAlign = "left";
            ctx.fillText("Sevgili Öğrencimiz", 180, 230);
            
            // İsmin Altındaki Çizgili Kısım
            ctx.strokeStyle = "#00a896";
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(350, 230); ctx.lineTo(620, 230); ctx.stroke();
            ctx.setLineDash([]); // Reset

            // Oyuncu Adı
            ctx.fillStyle = "#e50069"; // Özel Vurgu
            ctx.font = "800 28px 'Nunito', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(playerName.toUpperCase(), 485, 222);

            // Gövde Metinleri
            ctx.fillStyle = "#00a896";
            ctx.font = "bold 16px 'Nunito', sans-serif";
            
            const d = new Date();
            const y = d.getFullYear();
            const m = d.toLocaleString('tr-TR', { month: 'long' });
            ctx.fillText(`${y} - ${y+1} Eğitim-Öğretim Yılı ${m} Ayında`, 400, 275);
            
            ctx.fillText("Matematik becerilerini konuşturan Yuvarlama Kazan! Turnuvası'nda,", 400, 315);
            ctx.fillText("rakiplerini eleyerek gösterdiğin üstün performans ve", 400, 340);
            ctx.fillText("şampiyonluk başarısından dolayı seni yürekten tebrik ederiz.", 400, 365);

            ctx.font = "italic bold 16px 'Nunito', sans-serif";
            ctx.fillText("Akıl yürütme gücünün sana daima rehberlik etmesini", 400, 400);
            ctx.fillText("ve başarılarının katlanarak artmasını dileriz.", 400, 425);

            // Madalya Çizimi
            const medY = 480;
            ctx.fillStyle = "#e50069"; // Kurdeleler
            ctx.beginPath(); ctx.moveTo(370, medY); ctx.lineTo(340, medY+60); ctx.lineTo(380, medY+40); ctx.lineTo(390, medY); ctx.fill();
            ctx.beginPath(); ctx.moveTo(430, medY); ctx.lineTo(460, medY+60); ctx.lineTo(420, medY+40); ctx.lineTo(410, medY); ctx.fill();

            ctx.fillStyle = "#00a896"; // Madalya dış halka
            ctx.beginPath(); ctx.arc(400, medY, 35, 0, Math.PI*2); ctx.fill();

            ctx.fillStyle = "#f7c948"; // Madalya iç sarı
            ctx.beginPath(); ctx.arc(400, medY, 25, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = "#00a896";
            ctx.font = "bold 20px Arial";
            ctx.fillText("🏆", 400, medY + 7);
            
            // Alt Site Adresi
            ctx.fillStyle = "#e50069";
            ctx.font = "900 18px 'Nunito', sans-serif";
            ctx.fillText("derslig.com", 400, 545);
        }

        drawCertificate();

        // Share Feature
        const shareBtn = document.getElementById('dl-cert-share');
        if (shareBtn) {
            shareBtn.addEventListener('click', async () => {
                Derslig?.tiklamaSesi?.();
                try {
                    const dataUrl = canvas.toDataURL('image/png');
                    const blob = await (await fetch(dataUrl)).blob();
                    const file = new File([blob], `Sertifika-${playerName}.png`, { type: 'image/png' });
                    
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            title: 'Derslig Turnuva Şampiyonu!',
                            text: `${playerName} öğrencimizi Yuvarlama Kazan Turnuvasındaki başarısından dolayı tebrik ederiz!`
                        });
                    } else {
                        alert('Paylaşma özelliği bu tarayıcıda/cihazda desteklenmiyor. Lütfen "Sertifikayı İndir" seçeneğini kullanın.');
                    }
                } catch(e) {
                    console.log('Paylaşım hatası:', e);
                }
            });
        }

        // İndirme
        document.getElementById('dl-cert-download').addEventListener('click', () => {
            Derslig?.tiklamaSesi?.();
            const link = document.createElement('a');
            link.download = `Sertifika-${playerName}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
};

/**
 * Derslig Lobby Factory - Yuvarlama Pisti
 * Tek Oyuncu / Çoklu Oyuncu (2-3-4) / Turnuva / Ayarlar
 */
const DersligLobby = {
    _config: null,
    _settings: {
        basamakSayisi: 2,
        yuvarlamaTipi: 'karma',
        sure: 60,
        seciliTipler: [
            { tip: 'onluk', basamaklar: [2,3,4,5] },
            { tip: 'yuzluk', basamaklar: [3,4,5] },
            { tip: 'ondalik', basamaklar: [1,2,3] }
        ]
    },

    create: function(containerId, config) {
        const container = document.getElementById(containerId);
        if (!container) return;
        this._config = config;

        if(config.defaultSettings) {
            if(config.defaultSettings.sure) this._settings.sure = config.defaultSettings.sure;
            if(config.defaultSettings.basamakSayisi) this._settings.basamakSayisi = config.defaultSettings.basamakSayisi;
            if(config.defaultSettings.yuvarlamaTipi) this._settings.yuvarlamaTipi = config.defaultSettings.yuvarlamaTipi;
        }

        const userSvg = `<svg viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
        const usersSvg = `<svg viewBox="0 0 24 24" fill="white"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`;
        const trophySvg = `<svg viewBox="0 0 24 24" fill="white"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>`;
        const gearSvg = `<svg viewBox="0 0 24 24" fill="white"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.44.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.611 3.611 0 0112 15.6z"/></svg>`;

        container.innerHTML = `
            <div class="dl-lobby-screen" id="dl-lobby-screen">
                <div class="dl-header-banner">
                    <div class="dl-race-visual">
                        <svg class="dl-banner-logo-svg" viewBox="0 0 900 200" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="grad-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style="stop-color:#ffd700"/>
                                    <stop offset="100%" style="stop-color:#f7c948"/>
                                </linearGradient>
                                <linearGradient id="grad-pink" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style="stop-color:#ff6b9d"/>
                                    <stop offset="100%" style="stop-color:#e50069"/>
                                </linearGradient>
                                <filter id="shadow">
                                    <feDropShadow dx="3" dy="3" stdDeviation="2" flood-color="#000" flood-opacity="0.3"/>
                                </filter>
                            </defs>
                            <text x="450" y="95" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="100" fill="white" stroke="#2980b9" stroke-width="3" filter="url(#shadow)" letter-spacing="8">YUVARLA</text>
                            <text x="380" y="178" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="95" fill="url(#grad-yellow)" stroke="#b8860b" stroke-width="2.5" filter="url(#shadow)" letter-spacing="6">KAZAN</text>
                            <text x="610" y="178" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="105" fill="url(#grad-pink)" stroke="#8b0045" stroke-width="2" filter="url(#shadow)">!</text>
                        </svg>
                    </div>
                </div>

                <div class="dl-lobby-body">
                    <div class="dl-bg-pattern"></div>

                    <div class="dl-action-area" id="dl-main-menu">
                        <a class="dl-btn" id="btn-1p">
                            <div class="dl-btn-icon">${userSvg}</div>
                            <span class="dl-btn-text">Tek Oyuncu</span>
                        </a>
                        <a class="dl-btn" id="btn-multi">
                            <div class="dl-btn-icon">${usersSvg}</div>
                            <span class="dl-btn-text">Çoklu Oyuncu</span>
                        </a>
                        <a class="dl-btn" id="btn-turnuva">
                            <div class="dl-btn-icon">${trophySvg}</div>
                            <span class="dl-btn-text">Turnuva Modu</span>
                        </a>
                        <a class="dl-btn" id="btn-ayarlar">
                            <div class="dl-btn-icon">${gearSvg}</div>
                            <span class="dl-btn-text">Ayarlar</span>
                        </a>
                    </div>

                    <!-- Çoklu Oyuncu Alt Menü (gizli) -->
                    <div class="dl-action-area dl-hidden" id="dl-multi-menu">
                        <a class="dl-btn" id="btn-2p">
                            <div class="dl-btn-icon">${usersSvg}</div>
                            <span class="dl-btn-text">2 Oyuncu</span>
                        </a>
                        <a class="dl-btn" id="btn-3p">
                            <div class="dl-btn-icon">${usersSvg}</div>
                            <span class="dl-btn-text">3 Oyuncu</span>
                        </a>
                        <a class="dl-btn" id="btn-4p">
                            <div class="dl-btn-icon">${usersSvg}</div>
                            <span class="dl-btn-text">4 Oyuncu</span>
                        </a>
                        <a class="dl-btn dl-btn-back" id="btn-multi-back">
                            <div class="dl-btn-icon" style="background:#e74c3c;">${'<svg viewBox="0 0 24 24" fill="white"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'}</div>
                            <span class="dl-btn-text">Geri</span>
                        </a>
                    </div>

                    <div class="dl-bottom-controls">
                        <button class="dl-control-btn" id="dl-volume-btn">
                            <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                        </button>
                        <button class="dl-control-btn" id="dl-fullscreen-btn">
                            <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                        </button>
                    </div>
                </div>
            </div>
            
            <div id="dl-game-layer" class="dl-game-ui"></div>
        `;

        this._bindEvents(config);
    },

    _startGame: function(mod, config) {
        Derslig?.tiklamaSesi?.();
        document.getElementById('dl-lobby-screen').style.display = 'none';
        const gameLayer = document.getElementById('dl-game-layer');
        gameLayer.style.display = 'flex';
        if(config.onStart) config.onStart(mod, { ...this._settings });
    },

    _bindEvents: function(config) {
        const self = this;

        // Tek Oyuncu
        document.getElementById('btn-1p').addEventListener('click', function() {
            self._startGame('tek', config);
        });

        // Çoklu Oyuncu → alt menü göster
        document.getElementById('btn-multi').addEventListener('click', function() {
            Derslig?.tiklamaSesi?.();
            const main = document.getElementById('dl-main-menu');
            const multi = document.getElementById('dl-multi-menu');
            main.style.transition = 'opacity 0.2s';
            main.style.opacity = '0';
            setTimeout(() => {
                main.classList.add('dl-hidden');
                multi.classList.remove('dl-hidden');
                multi.style.opacity = '0';
                multi.style.transition = 'opacity 0.2s';
                setTimeout(() => multi.style.opacity = '1', 10);
            }, 200);
        });

        // Alt menü geri
        document.getElementById('btn-multi-back').addEventListener('click', function() {
            Derslig?.tiklamaSesi?.();
            const main = document.getElementById('dl-main-menu');
            const multi = document.getElementById('dl-multi-menu');
            multi.style.opacity = '0';
            setTimeout(() => {
                multi.classList.add('dl-hidden');
                main.classList.remove('dl-hidden');
                setTimeout(() => main.style.opacity = '1', 10);
            }, 200);
        });

        // 2/3/4 oyuncu
        document.getElementById('btn-2p').addEventListener('click', function() {
            self._startGame('multi-2', config);
        });
        document.getElementById('btn-3p').addEventListener('click', function() {
            self._startGame('multi-3', config);
        });
        document.getElementById('btn-4p').addEventListener('click', function() {
            self._startGame('multi-4', config);
        });

        // Turnuva Modu
        document.getElementById('btn-turnuva').addEventListener('click', function() {
            Derslig?.tiklamaSesi?.();
            if(typeof TurnuvaEngine !== 'undefined' && TurnuvaEngine && TurnuvaEngine.showSetup) {
                TurnuvaEngine.showSetup(self._settings);
            } else {
                alert("Turnuva modülü yüklenemedi. Sayfayı yenileyip tekrar deneyin.");
                console.error("TurnuvaEngine bulunamadı! derslig-tournament.js yüklü mü?");
            }
        });

        // Ayarlar
        document.getElementById('btn-ayarlar').addEventListener('click', function() {
            Derslig?.tiklamaSesi?.();
            self._showSettings();
        });

        // Ses
        document.getElementById('dl-volume-btn').addEventListener('click', function() {
            const muted = Derslig?.toggleMute?.();
            if(muted !== undefined) {
                this.style.opacity = muted ? '0.3' : '1';
            }
        });

        // Fullscreen
        document.getElementById('dl-fullscreen-btn').addEventListener('click', function() {
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
    },

    _showSettings: function() {
        const self = this;
        const container = document.getElementById('derslig-app') || document.body;
        
        // Mevcut ayarlardan seciliTipler'i çöz
        let currentPool = [];
        if (this._settings.seciliTipler && this._settings.seciliTipler.length > 0) {
            currentPool = JSON.parse(JSON.stringify(this._settings.seciliTipler));
        } else {
            // Varsayılan: hepsi
            currentPool = [
                { tip: 'onluk', basamaklar: [2,3,4,5] },
                { tip: 'yuzluk', basamaklar: [3,4,5] },
                { tip: 'ondalik', basamaklar: [1,2,3] }
            ];
        }
        let tempSure = this._settings.sure || 60;

        // Yardımcı: tip havuzda var mı
        function hasTip(tip) { return currentPool.some(t => t.tip === tip); }
        function getBasamaklar(tip) {
            const found = currentPool.find(t => t.tip === tip);
            return found ? found.basamaklar : [];
        }
        function hasBasamak(tip, b) { return getBasamaklar(tip).includes(b); }

        // Tip ekle/çıkar
        function toggleTip(tip, allBasamaklar) {
            if (hasTip(tip)) {
                currentPool = currentPool.filter(t => t.tip !== tip);
            } else {
                currentPool.push({ tip: tip, basamaklar: [...allBasamaklar] });
            }
        }
        // Basamak ekle/çıkar
        function toggleBasamak(tip, b, allBasamaklar) {
            let entry = currentPool.find(t => t.tip === tip);
            if (!entry) {
                // Tip yoksa ekle (sadece bu basamakla)
                currentPool.push({ tip: tip, basamaklar: [b] });
                return;
            }
            if (entry.basamaklar.includes(b)) {
                entry.basamaklar = entry.basamaklar.filter(x => x !== b);
                if (entry.basamaklar.length === 0) {
                    currentPool = currentPool.filter(t => t.tip !== tip);
                }
            } else {
                entry.basamaklar.push(b);
                entry.basamaklar.sort((a,c) => a - c);
            }
        }

        const tipDefinitions = [
            { tip: 'onluk', label: "10'luğa Yuvarla", basamaklar: [2,3,4,5], basamakLabels: {2:'2 Basamak', 3:'3 Basamak', 4:'4 Basamak', 5:'5 Basamak'} },
            { tip: 'yuzluk', label: "100'lüğe Yuvarla", basamaklar: [3,4,5], basamakLabels: {3:'3 Basamak', 4:'4 Basamak', 5:'5 Basamak'} },
            { tip: 'ondalik', label: "Ondalık Kesir", basamaklar: [1,2,3], basamakLabels: {1:'Onda Birlik', 2:'Yüzde Birlik', 3:'Binde Birlik'} }
        ];

        const overlay = document.createElement('div');
        overlay.className = 'dl-settings-overlay active';

        function renderSettings() {
            const isAllTips = tipDefinitions.every(td => {
                const entry = currentPool.find(t => t.tip === td.tip);
                return entry && td.basamaklar.every(b => entry.basamaklar.includes(b));
            });

            let tipHTML = `
                <div class="dl-setting-option ${isAllTips ? 'selected' : ''}" id="btn-hepsi-tip" style="justify-content:center; background:#4CAF50; border-color:${isAllTips ? '#fff' : 'transparent'};">
                    <span style="color:#fff;">✅ Hepsi</span>
                </div>
            `;
            tipDefinitions.forEach(td => {
                const active = hasTip(td.tip);
                tipHTML += `
                    <div class="dl-setting-option dl-tip-toggle ${active ? 'selected' : ''}" data-tip="${td.tip}" style="justify-content:center;">
                        <span>${td.label}</span>
                    </div>
                `;
            });

            // Sağ sütun: seçili tiplerin basamak seçenekleri
            let basamakHTML = '';
            const activeTips = tipDefinitions.filter(td => hasTip(td.tip));
            
            if (activeTips.length === 0) {
                basamakHTML = '<div style="text-align:center; padding:20px; color:#aaa; font-size:14px;">Önce sol taraftan en az bir tür seçin.</div>';
            } else {
                activeTips.forEach(td => {
                    const entry = currentPool.find(t => t.tip === td.tip);
                    const allSelected = entry && td.basamaklar.every(b => entry.basamaklar.includes(b));
                    
                    basamakHTML += `
                        <div style="margin-bottom:10px;">
                            <div style="color:#fff; font-size:13px; font-weight:700; margin-bottom:5px; text-align:center; opacity:0.8;">${td.label}</div>
                            <div class="dl-setting-option dl-basamak-hepsi ${allSelected ? 'selected' : ''}" data-tip="${td.tip}" style="justify-content:center; padding:6px 10px; margin-bottom:4px; background:rgba(76,175,80,0.6); border-color:${allSelected ? '#fff' : 'transparent'};">
                                <span style="font-size:13px;">Hepsi</span>
                            </div>
                    `;
                    td.basamaklar.forEach(b => {
                        const active = hasBasamak(td.tip, b);
                        basamakHTML += `
                            <div class="dl-setting-option dl-basamak-toggle ${active ? 'selected' : ''}" data-tip="${td.tip}" data-basamak="${b}" style="justify-content:center; padding:6px 10px; margin-bottom:3px;">
                                <span style="font-size:13px;">${td.basamakLabels[b]}</span>
                            </div>
                        `;
                    });
                    basamakHTML += '</div>';
                });
            }

            // Süre
            let sureHTML = '';
            [30,40,50,60,70,80,90,120].forEach(s => {
                sureHTML += `
                    <div class="dl-setting-option dl-sure-opt ${tempSure === s ? 'selected' : ''}" data-sure="${s}" style="width:calc(50% - 3px); justify-content:center; margin-bottom:0; padding:10px 5px;">
                        <span>${s} sn</span>
                    </div>
                `;
            });

            overlay.innerHTML = `
                <div class="dl-settings-panel" style="max-width:95vw; width:1100px;">
                    <div class="dl-settings-title" style="margin-bottom:20px;">Oyun Ayarları</div>
                    <div class="dl-settings-grid" style="display:flex; gap:25px;">
                        
                        <!-- Yuvarlama Türü (Multi-select) -->
                        <div class="dl-settings-column" style="flex:1;">
                            <h3 style="text-align:center; color:#555; margin-bottom:10px;">Yuvarlama Türü</h3>
                            <div style="display:flex; flex-direction:column; gap:8px;" id="tip-container">
                                ${tipHTML}
                            </div>
                        </div>

                        <!-- Basamak (Multi-select, Dinamik) -->
                        <div class="dl-settings-column" style="flex:1.5;">
                            <h3 style="text-align:center; color:#555; margin-bottom:10px;">Basamak Seçimi</h3>
                            <div id="basamak-container" style="max-height:400px; overflow-y:auto; padding-right:5px; display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                ${basamakHTML}
                            </div>
                        </div>

                        <!-- Süre -->
                        <div class="dl-settings-column" style="flex:1;">
                            <h3 style="text-align:center; color:#555; margin-bottom:10px;">Süre Seçimi</h3>
                            <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">
                                ${sureHTML}
                            </div>
                        </div>

                    </div>
                    <div class="dl-settings-buttons" style="margin-top:30px; border-top:1px solid #eee; padding-top:20px;">
                        <button class="dl-settings-btn secondary" id="settings-cancel">İptal</button>
                        <button class="dl-settings-btn primary" id="settings-save" ${currentPool.length === 0 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>Kaydet</button>
                    </div>
                </div>
            `;

            // Event binding
            bindSettingsEvents();
        }

        function bindSettingsEvents() {
            // Hepsi butonu (tüm tipler)
            const hepsiBtn = overlay.querySelector('#btn-hepsi-tip');
            if (hepsiBtn) {
                hepsiBtn.addEventListener('click', function() {
                    Derslig?.tiklamaSesi?.();
                    const isAllNow = tipDefinitions.every(td => {
                        const entry = currentPool.find(t => t.tip === td.tip);
                        return entry && td.basamaklar.every(b => entry.basamaklar.includes(b));
                    });
                    if (isAllNow) {
                        currentPool = [];
                    } else {
                        currentPool = tipDefinitions.map(td => ({ tip: td.tip, basamaklar: [...td.basamaklar] }));
                    }
                    renderSettings();
                });
            }

            // Tip toggle
            overlay.querySelectorAll('.dl-tip-toggle').forEach(el => {
                el.addEventListener('click', function() {
                    Derslig?.tiklamaSesi?.();
                    const tip = this.dataset.tip;
                    const td = tipDefinitions.find(t => t.tip === tip);
                    toggleTip(tip, td.basamaklar);
                    renderSettings();
                });
            });

            // Basamak hepsi
            overlay.querySelectorAll('.dl-basamak-hepsi').forEach(el => {
                el.addEventListener('click', function() {
                    Derslig?.tiklamaSesi?.();
                    const tip = this.dataset.tip;
                    const td = tipDefinitions.find(t => t.tip === tip);
                    const entry = currentPool.find(t => t.tip === tip);
                    if (entry && td.basamaklar.every(b => entry.basamaklar.includes(b))) {
                        // Tümü seçili → hepsini kaldır (tip'i kaldır)
                        currentPool = currentPool.filter(t => t.tip !== tip);
                    } else {
                        // Eksik var → hepsini seç
                        if (entry) {
                            entry.basamaklar = [...td.basamaklar];
                        } else {
                            currentPool.push({ tip: tip, basamaklar: [...td.basamaklar] });
                        }
                    }
                    renderSettings();
                });
            });

            // Basamak toggle
            overlay.querySelectorAll('.dl-basamak-toggle').forEach(el => {
                el.addEventListener('click', function() {
                    Derslig?.tiklamaSesi?.();
                    const tip = this.dataset.tip;
                    const b = parseInt(this.dataset.basamak);
                    const td = tipDefinitions.find(t => t.tip === tip);
                    toggleBasamak(tip, b, td.basamaklar);
                    renderSettings();
                });
            });

            // Süre
            overlay.querySelectorAll('.dl-sure-opt').forEach(el => {
                el.addEventListener('click', function() {
                    Derslig?.tiklamaSesi?.();
                    tempSure = parseInt(this.dataset.sure);
                    renderSettings();
                });
            });

            // İptal
            overlay.querySelector('#settings-cancel')?.addEventListener('click', function() {
                Derslig?.tiklamaSesi?.();
                overlay.remove();
            });

            // Kaydet
            overlay.querySelector('#settings-save')?.addEventListener('click', function() {
                if (currentPool.length === 0) return;
                Derslig?.tiklamaSesi?.();
                self._settings.seciliTipler = currentPool;
                self._settings.sure = tempSure;
                // Eski alan uyumu
                if (currentPool.length === 1 && currentPool[0].basamaklar.length === 1) {
                    self._settings.yuvarlamaTipi = currentPool[0].tip;
                    self._settings.basamakSayisi = currentPool[0].basamaklar[0];
                } else {
                    self._settings.yuvarlamaTipi = 'karma';
                    self._settings.basamakSayisi = currentPool[0].basamaklar[0];
                }
                overlay.remove();
            });
        }

        container.appendChild(overlay);
        renderSettings();
    }


};

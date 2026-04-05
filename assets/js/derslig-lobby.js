/**
 * Derslig Lobby Factory - Yuvarlama Pisti
 * Tek Oyuncu / Çoklu Oyuncu (2-3-4) / Turnuva / Ayarlar
 */
const DersligLobby = {
    _config: null,
    _settings: {
        basamakSayisi: 2,
        yuvarlamaTipi: 'onluk',
        sure: 60
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
                        <img src="../../assets/img/yuvarlama-cover.png" class="dl-banner-bg-img" alt="Yuvarla Kazan kapak görseli">
                        <div class="dl-banner-overlay"></div>
                        <div class="dl-race-title-overlay">
                            <img src="../../assets/img/yuvarla-kazan-logo.svg" class="dl-logo-svg" alt="Yuvarla Kazan! Logo">
                        </div>
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
        
        // Geçici ayar kopyası oluştur
        const tempSettings = { ...this._settings };
        
        const overlay = document.createElement('div');
        overlay.className = 'dl-settings-overlay active';

        // Eski karışık ayarları temizle
        if(!['onluk', 'yuzluk', 'ondalik'].includes(tempSettings.yuvarlamaTipi)) {
            tempSettings.yuvarlamaTipi = 'onluk';
            tempSettings.basamakSayisi = 2;
        }

        overlay.innerHTML = `
            <div class="dl-settings-panel" style="max-width:850px;">
                <div class="dl-settings-title">Oyun Ayarları</div>
                <div class="dl-settings-grid" style="grid-template-columns: 1fr 1fr 1fr;">
                    
                    <!-- Yuvarlama Türü -->
                    <div class="dl-settings-column">
                        <h3 style="text-align:center;">Yuvarlanacak Basamak</h3>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <div class="dl-setting-option" data-key="yuvarlamaTipi" data-value="onluk" style="justify-content:center;"><span>10'luğa Yuvarla</span></div>
                            <div class="dl-setting-option" data-key="yuvarlamaTipi" data-value="yuzluk" style="justify-content:center;"><span>100'lüğe Yuvarla</span></div>
                            <div class="dl-setting-option" data-key="yuvarlamaTipi" data-value="ondalik" style="justify-content:center;"><span>Ondalık Kesir</span></div>
                        </div>
                    </div>

                    <!-- Basamak Sayısı (Dinamik) -->
                    <div class="dl-settings-column">
                        <h3 id="basamak-title" style="text-align:center;">Basamak Sayısı</h3>
                        <div id="basamak-options-container" style="display:flex; flex-direction:column; gap:8px; width:100%;">
                            <!-- JS ile doldurulacak -->
                        </div>
                    </div>

                    <!-- Süre Ayarı -->
                    <div class="dl-settings-column">
                        <h3 style="text-align:center;">Süre</h3>
                        <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:center;">
                            ${[30,40,50,60,70,80,90,120].map(s => `
                                <div class="dl-setting-option ${tempSettings.sure === s ? 'selected' : ''}" data-key="sure" data-value="${s}" style="width:calc(50% - 3px); justify-content:center; margin-bottom:0; padding:10px 5px;"><span>${s} sn</span></div>
                            `).join('')}
                        </div>
                    </div>

                </div>
                <div class="dl-settings-buttons" style="margin-top:25px;">
                    <button class="dl-settings-btn secondary" id="settings-cancel">İptal</button>
                    <button class="dl-settings-btn primary" id="settings-save">Kaydet</button>
                </div>
            </div>
        `;

        container.appendChild(overlay);

        const renderBasamakOptions = () => {
            const bContainer = overlay.querySelector('#basamak-options-container');
            const title = overlay.querySelector('#basamak-title');
            bContainer.innerHTML = '';
            
            const tip = tempSettings.yuvarlamaTipi;
            
            overlay.querySelectorAll('[data-key="yuvarlamaTipi"]').forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.value === tip);
            });

            if (tip === 'onluk') {
                title.textContent = "Sayı Kaç Basamaklı Olsun?";
                [2, 3, 4, 5].forEach(val => {
                    const div = document.createElement('div');
                    div.className = `dl-setting-option ${tempSettings.basamakSayisi === val ? 'selected' : ''}`;
                    div.dataset.value = val;
                    div.style.justifyContent = 'center';
                    div.innerHTML = `<span>${val} Basamaklı</span>`;
                    bContainer.appendChild(div);
                });
            } else if (tip === 'yuzluk') {
                title.textContent = "Sayı Kaç Basamaklı Olsun?";
                [3, 4, 5].forEach(val => {
                    const div = document.createElement('div');
                    div.className = `dl-setting-option ${tempSettings.basamakSayisi === val ? 'selected' : ''}`;
                    div.dataset.value = val;
                    div.style.justifyContent = 'center';
                    div.innerHTML = `<span>${val} Basamaklı</span>`;
                    bContainer.appendChild(div);
                });
            } else if (tip === 'ondalik') {
                title.textContent = "Soru Tipi";
                [1, 2, 3].forEach(val => {
                    const labels = {1: 'Onda Birliğe (1 Basamak)', 2: 'Yüzde Birliğe (2 Basamak)', 3: 'Binde Birliğe (3 Basamak)'};
                    const div = document.createElement('div');
                    div.className = `dl-setting-option ${tempSettings.basamakSayisi === val ? 'selected' : ''}`;
                    div.dataset.value = val;
                    div.style.justifyContent = 'center';
                    div.innerHTML = `<span>${labels[val]}</span>`;
                    bContainer.appendChild(div);
                });
            }
            
            bContainer.querySelectorAll('.dl-setting-option').forEach(opt => {
                opt.addEventListener('click', function() {
                    Derslig?.tiklamaSesi?.();
                    bContainer.querySelectorAll('.dl-setting-option').forEach(o => o.classList.remove('selected'));
                    this.classList.add('selected');
                    tempSettings.basamakSayisi = parseInt(this.dataset.value);
                });
            });
        };

        overlay.querySelectorAll('[data-key="yuvarlamaTipi"]').forEach(opt => {
            opt.addEventListener('click', function() {
                Derslig?.tiklamaSesi?.();
                tempSettings.yuvarlamaTipi = this.dataset.value;
                if(tempSettings.yuvarlamaTipi === 'onluk') tempSettings.basamakSayisi = 2;
                else if(tempSettings.yuvarlamaTipi === 'yuzluk') tempSettings.basamakSayisi = 3;
                else if(tempSettings.yuvarlamaTipi === 'ondalik') tempSettings.basamakSayisi = 1;
                renderBasamakOptions();
            });
        });

        overlay.querySelectorAll('[data-key="sure"]').forEach(opt => {
            opt.addEventListener('click', function() {
                Derslig?.tiklamaSesi?.();
                overlay.querySelectorAll('[data-key="sure"]').forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                tempSettings.sure = parseInt(this.dataset.value);
            });
        });

        document.getElementById('settings-cancel').addEventListener('click', function() {
            Derslig?.tiklamaSesi?.(); 
            overlay.remove();
        });
        document.getElementById('settings-save').addEventListener('click', function() {
            Derslig?.tiklamaSesi?.(); 
            Object.assign(self._settings, tempSettings);
            overlay.remove();
        });

        renderBasamakOptions();
    }


};

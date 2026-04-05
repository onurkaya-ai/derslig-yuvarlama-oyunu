/**
 * Derslig Core SDK
 * SCORM iletişimi, Ses Yönetimi ve genel akış yönetimi
 * Ses: Önce CDN, başarısız olursa local fallback
 */
const Derslig = (function() {
    const state = {
        oyunAdi: "",
        maxPuan: 20,
        soruSayisi: 10,
        pointsPerQuestion: 2,
        currentScore: 0,
        isCompleted: false,
        isMuted: false
    };

    // Ses URL'leri - CDN + local fallback
    const CDN_BASE = 'https://files.derslig.com/img/games/multiply/sounds/';
    const LOCAL_BASE = '../../assets/sounds/';
    const sounds = {};
    let soundsReady = false;

    function preloadSounds() {
        const names = ['true', 'false', 'select', 'start', 'time'];
        let loaded = 0;

        names.forEach(name => {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.volume = 0.6;
            
            // Önce CDN'den dene
            audio.src = CDN_BASE + name + '.mp3';
            
            audio.addEventListener('canplaythrough', () => {
                sounds[name] = audio;
                loaded++;
                if(loaded >= names.length) soundsReady = true;
            }, { once: true });

            audio.addEventListener('error', () => {
                // CDN başarısız → local fallback dene
                console.warn('CDN ses yüklenemedi, local deneniyor:', name);
                const localAudio = new Audio();
                localAudio.preload = 'auto';
                localAudio.volume = 0.6;
                localAudio.src = LOCAL_BASE + name + '.mp3';
                localAudio.addEventListener('canplaythrough', () => {
                    sounds[name] = localAudio;
                    loaded++;
                    if(loaded >= names.length) soundsReady = true;
                }, { once: true });
                localAudio.addEventListener('error', () => {
                    console.warn('Local ses de yüklenemedi:', name);
                    loaded++;
                    if(loaded >= names.length) soundsReady = true;
                }, { once: true });
                localAudio.load();
            }, { once: true });

            audio.load();
        });
    }

    function playSound(name) {
        if(state.isMuted) return;
        try {
            const s = sounds[name];
            if(s) {
                s.currentTime = 0;
                const playPromise = s.play();
                if(playPromise) {
                    playPromise.catch(() => {
                        // Autoplay engellendi - kullanıcı etkileşiminde tekrar dene
                    });
                }
            }
        } catch(e) { /* sessizce geç */ }
    }

    // Kullanıcı ilk tıklamasında sesleri unlock et (autoplay policy)
    function unlockAudio() {
        Object.values(sounds).forEach(s => {
            if(s && s.paused) {
                s.play().then(() => { s.pause(); s.currentTime = 0; }).catch(() => {});
            }
        });
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
    }
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });

    // Sesleri sayfa yüklendiğinde hemen başlat (lobi sesleri için)
    preloadSounds();

    // SCORM API Bulucu
    function getScormAPI() {
        var findAPITries = 0;
        function findAPI(win) {
            while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
                findAPITries++;
                if (findAPITries > 7) return null;
                win = win.parent;
            }
            return win.API;
        }
        var api = findAPI(window);
        if (api == null && window.opener != null && typeof(window.opener) != "undefined") {
            api = findAPI(window.opener);
        }
        return api;
    }

    function updateSCORM() {
        const api = getScormAPI();
        if (api) {
            const ratio = state.currentScore / state.maxPuan;
            const status = ratio >= 0.5 ? "passed" : "failed";
            api.LMSSetValue("cmi.core.score.raw", state.currentScore);
            api.LMSSetValue("cmi.core.lesson_status", status);
            api.LMSCommit("");
        }
    }

    return {
        init: function(config) {
            state.oyunAdi = config.oyunAdi || "Oyun";
            state.soruSayisi = config.soruSayisi || 10;
            state.maxPuan = config.maxPuan || 20;
            state.pointsPerQuestion = state.maxPuan / state.soruSayisi;
            
            if(!soundsReady) preloadSounds();
            
            const api = getScormAPI();
            if(api) { api.LMSInitialize(""); }
            console.log(`Derslig SDK: ${state.oyunAdi} Başlatıldı.`);
        },

        dogruCevap: function() {
            if(state.isCompleted) return;
            state.currentScore = Math.min(state.maxPuan, state.currentScore + state.pointsPerQuestion);
            playSound('true');
            updateSCORM();
        },

        yanlisCevap: function() {
            if(state.isCompleted) return;
            playSound('false');
        },

        tiklamaSesi: function() {
            playSound('select');
        },

        baslangicSesi: function() {
            playSound('start');
        },

        sureSesi: function() {
            playSound('time');
        },

        bitir: function(finalCallback) {
            if(state.isCompleted) return;
            state.isCompleted = true;
            playSound('true');
            updateSCORM();
            if(typeof finalCallback === 'function') {
                finalCallback(state.currentScore);
            }
        },

        cikis: function() {
            playSound('select');
            const api = getScormAPI();
            if (api) {
                try {
                    if (api.LMSFinish) api.LMSFinish("");
                    else if (api.Terminate) api.Terminate("");
                } catch (e) { }
            }
            const exitUrl = "https://www.derslig.com/";
            try { window.top.location.href = exitUrl; } 
            catch (e) { window.location.href = exitUrl; }
        },

        toggleMute: function() {
            state.isMuted = !state.isMuted;
            return state.isMuted;
        },

        getDurum: () => ({ ...state })
    };
})();

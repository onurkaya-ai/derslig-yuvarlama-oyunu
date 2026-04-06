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

    // Web Audio API Yedek Sistemi (Akıllı tahtalarda MP3 çökme/kesilme sorununu çözer)
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioCtx = AudioContextClass ? new AudioContextClass() : null;

    function playOscillator(type) {
        if (!audioCtx || state.isMuted) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        try {
            const t = audioCtx.currentTime;
            if (type === 'true') {
                const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
                notes.forEach((freq, i) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.connect(gain); gain.connect(audioCtx.destination);
                    osc.type = 'sine';
                    const start = t + i * 0.1;
                    osc.frequency.setValueAtTime(freq, start);
                    gain.gain.setValueAtTime(0, start);
                    gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
                    osc.start(start); osc.stop(start + 0.25);
                });
            } else if (type === 'false') {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain); gain.connect(audioCtx.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, t);
                osc.frequency.exponentialRampToValueAtTime(50, t + 0.3);
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                osc.start(t); osc.stop(t + 0.3);
            } else if (type === 'select') {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain); gain.connect(audioCtx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, t);
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                osc.start(t); osc.stop(t + 0.1);
            } else if (type === 'start') {
                const notes = [440, 554.37, 659.25, 880];
                notes.forEach((freq, i) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.connect(gain); gain.connect(audioCtx.destination);
                    osc.type = 'sine';
                    const start = t + i * 0.15;
                    osc.frequency.setValueAtTime(freq, start);
                    gain.gain.setValueAtTime(0, start);
                    gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
                    osc.start(start); osc.stop(start + 0.4);
                });
            } else if (type === 'time') {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain); gain.connect(audioCtx.destination);
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, t);
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.05, t + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                osc.start(t); osc.stop(t + 0.05);
            }
        } catch(e) {}
    }

    function playSound(name) {
        if(state.isMuted) return;
        try {
            const s = sounds[name];
            if(s) {
                // cloneNode kullanılarak aynı anda çakışan seslerin pipeline'ı tıkaması engellenir
                const throwawaySound = s.cloneNode();
                throwawaySound.volume = s.volume;
                const playPromise = throwawaySound.play();
                if(playPromise) {
                    playPromise.catch(() => {
                        // Eğer MP3 başarısız olursa (örn autoplay/decode hatası), Web Audio API üret
                        playOscillator(name);
                    });
                }
            } else {
                playOscillator(name);
            }
        } catch(e) {
            playOscillator(name);
        }
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
            state.currentScore = 0;
            state.isCompleted = false;
            
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

        getDurum: () => ({ ...state }),

        // ==================== LİDERLİK TABLOSU (LEADERBOARD) API ====================
        // Derslig sunucusuna aktarıldığında bu içeriğe backend API (fetch) istekleri eklenecektir.
        
        getLeaderboard: async function(gameId = "yuvarlama_pisti_global") {
            // Backend'e geçerken: fetch('/api/leaderboard?game=' + gameId) vb. yazılmalıdır.
            try {
                const raw = localStorage.getItem('derslig_lb_' + gameId);
                let list = raw ? JSON.parse(raw) : [];
                return list.sort((a,b) => b.score - a.score).slice(0, 5);
            } catch(e) { return []; }
        },

        saveToLeaderboard: async function(name, score, gameId = "yuvarlama_pisti_global") {
            // Backend'e geçerken: ağ isteği ile db'ye gönder (+ güvenlik tokennları)
            try {
                const key = 'derslig_lb_' + gameId;
                let list = await this.getLeaderboard(gameId);
                list.push({ name: name, score: score, date: new Date().toISOString() });
                list.sort((a,b) => b.score - a.score);
                list = list.slice(0, 5);
                localStorage.setItem(key, JSON.stringify(list));
                return list;
            } catch(e) { return []; }
        },

        isEligibleForTop5: async function(score, gameId = "yuvarlama_pisti_global") {
            if (score <= 0) return false;
            const list = await this.getLeaderboard(gameId);
            if (list.length < 5) return true;
            return score > list[list.length - 1].score;
        }
    };
})();

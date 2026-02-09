// ===== DOM =====
const player = document.getElementById('player');
const video = document.getElementById('video');
const playPauseBtn = document.getElementById('playPauseBtn');
const rewardBtn = document.getElementById('rewardBtn');
const forwardBtn = document.getElementById('forwardBtn');
const volumeBtn = document.getElementById('volumeBtn');
const volSlider = document.getElementById('volSlider');
const progressWrap = document.getElementById('progressWrap');
const progressTrack = document.getElementById('progressTrack');
const progressFill = document.getElementById('progressFill');
const progressBuffer = document.getElementById('progressBuffer');
const progressThumb = document.getElementById('progressThumb');
const progressPreview = document.getElementById('progressPreview');
const progressPreviewCanvas = document.getElementById('progressPreviewCanvas');
const progressPreviewTime = document.getElementById('progressPreviewTime');
const liveBtn = document.getElementById('liveBtn');
const liveBtnText = document.getElementById('liveBtnText');
const liveBtnDot = document.getElementById('liveBtnDot');
const fsBtn = document.getElementById('fsBtn');
const pipBtn = document.getElementById('pipBtn');
const centerPlay = document.getElementById('centerPlay');
const centerFeedback = document.getElementById('centerFeedback');
const centerFeedbackIcon = document.getElementById('centerFeedbackIcon');
const hint = document.getElementById('hint');

let isPlaying = false, isMuted = false, prevVol = 0.8;
let dragging = false, hintTimer;
let isLiveMode = true;
const LIVE_THRESHOLD = 2;

// ===== HELPERS =====
function fmt(s) {
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = Math.floor(s % 60);
    return h > 0
        ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
        : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function updProgress() {
    if (!video.duration) return;
    const p = isLiveMode ? 100 : (video.currentTime / video.duration) * 100;
    progressFill.style.width = p + '%';
    progressThumb.style.left = p + '%';
}
function updateLiveBtnUI() {
    if (isLiveMode) {
        liveBtnText.textContent = 'مباشر';
        liveBtn.classList.remove('back-to-live');
    } else {
        liveBtnText.textContent = 'عودة للمباشر';
        liveBtn.classList.add('back-to-live');
    }
}

function showHint(t) {
    if (hint) { hint.textContent = t; hint.classList.add('show'); }
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => { if (hint) hint.classList.remove('show'); }, 800);
}

// ===== SIDE HINTS =====
const hintLeft = document.getElementById('hintLeft');
const hintRight = document.getElementById('hintRight');

function triggerSideHint(side) {
    const el = side === 'right' ? hintRight : hintLeft;
    el.classList.add('show');
    clearTimeout(el.timer);
    el.timer = setTimeout(() => {
        el.classList.remove('show');
    }, 500);
}

rewardBtn.addEventListener('click', () => {
    video.currentTime = Math.max(0, video.currentTime - 15);
    isLiveMode = false;
    updateLiveBtnUI();
    triggerSideHint('left');
});

forwardBtn.addEventListener('click', () => {
    const newTime = Math.min(video.duration || 0, video.currentTime + 15);
    video.currentTime = newTime;
    if (video.duration && video.duration - newTime <= LIVE_THRESHOLD) {
        isLiveMode = true;
        updateLiveBtnUI();
    }
    triggerSideHint('right');
});

// ===== PLAY / PAUSE =====
function showFeedback(isPause) {
    centerFeedbackIcon.innerHTML = isPause 
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M18 6.5C18.8284 6.5 19.5 7.17157 19.5 8V40C19.5 40.8284 18.8284 41.5 18 41.5C17.1716 41.5 16.5 40.8284 16.5 40V8C16.5 7.17157 17.1716 6.5 18 6.5Z" fill="white"/><path d="M30 6.5C30.8284 6.5 31.5 7.17157 31.5 8V40C31.5 40.8284 30.8284 41.5 30 41.5C29.1716 41.5 28.5 40.8284 28.5 40V8C28.5 7.17157 29.1716 6.5 30 6.5Z" fill="white"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M16.6276 8.73766L36.3703 21.0311C36.9154 21.3714 37.364 21.8459 37.6732 22.4091C37.9825 22.9724 38.142 23.6056 38.1365 24.2481C38.131 24.8907 37.9607 25.5211 37.6419 26.079C37.3231 26.6369 36.8665 27.1036 36.3157 27.4345L16.5757 39.2938C16.0057 39.6362 15.355 39.821 14.6902 39.8295C14.0254 39.838 13.3702 39.6698 12.7917 39.342C12.2132 39.0143 11.7321 38.5389 11.3975 37.9643C11.063 37.3897 10.8871 36.7365 10.8877 36.0716V11.9216C10.8882 11.2521 11.0678 10.5949 11.4077 10.0182C11.7476 9.44139 12.2356 8.966 12.8211 8.64124C13.4065 8.31648 14.0682 8.15417 14.7374 8.17113C15.4067 8.18808 16.0593 8.38368 16.6276 8.73766Z" fill="white"/></svg>';
    centerFeedbackIcon.classList.add('show');
    setTimeout(() => {
        centerFeedbackIcon.classList.remove('show');
    }, 800);
}

function togglePlay() {
    if (video.paused) {
        video.play().catch(() => {});
        showFeedback(true);
    } else {
        video.pause();
        showFeedback(false);
    }
}
playPauseBtn.addEventListener('click', togglePlay);

let clickCount = 0, clickTimer = null;
document.querySelector('.video-layer').addEventListener('click', () => {
    clickCount++;
    if (clickCount === 1) {
        clickTimer = setTimeout(() => { togglePlay(); showControls(); clickCount = 0; }, 250);
    } else if (clickCount === 2) {
        clearTimeout(clickTimer); clickCount = 0; toggleFS();
    }
});

// ===== LIVE BUTTON =====
liveBtn.addEventListener('click', () => {
    if (!isLiveMode && video.duration) {
        video.currentTime = video.duration;
        isLiveMode = true;
        updateLiveBtnUI();
        updProgress();
    }
});

// ===== VOLUME =====
function updateVolBg() {
    const v = volSlider.value * 100;
    volSlider.style.background = `linear-gradient(to right, #fff ${v}%, rgba(255,255,255,0.2) ${v}%)`;
}

function toggleMute() {
    isMuted = !isMuted;
    const on = volumeBtn.querySelector('.icon-vol-on'), off = volumeBtn.querySelector('.icon-vol-off');
    if (isMuted) { prevVol = parseFloat(volSlider.value); volSlider.value = 0; video.muted = true; on.style.display = 'none'; off.style.display = ''; }
    else { volSlider.value = prevVol; video.muted = false; on.style.display = ''; off.style.display = 'none'; }
    updateVolBg();
}

volumeBtn.addEventListener('click', toggleMute);
volSlider.addEventListener('input', () => {
    const v = parseFloat(volSlider.value); video.volume = v;
    const on = volumeBtn.querySelector('.icon-vol-on'), off = volumeBtn.querySelector('.icon-vol-off');
    if (v === 0) { on.style.display = 'none'; off.style.display = ''; isMuted = true; }
    else { on.style.display = ''; off.style.display = 'none'; isMuted = false; }
    updateVolBg();
});
updateVolBg();

// ===== PROGRESS + THUMBNAIL PREVIEW =====
const thumbVideo = document.createElement('video');
thumbVideo.crossOrigin = 'anonymous';
thumbVideo.preload = 'auto';
thumbVideo.muted = true;
thumbVideo.playsInline = true;
thumbVideo.style.cssText = 'position:absolute;width:0;height:0;opacity:0;pointer-events:none';
document.body.appendChild(thumbVideo);
if (video.src) {
    thumbVideo.src = video.src;
}
video.addEventListener('loadedmetadata', () => { if (video.src) thumbVideo.src = video.src; });

const thumbCtx = progressPreviewCanvas.getContext('2d');
const thumbW = 160;
const thumbH = 90;
progressPreviewCanvas.width = thumbW;
progressPreviewCanvas.height = thumbH;

let thumbSeekTarget = 0;

function captureThumbFrame() {
    if (!thumbVideo.readyState || thumbVideo.readyState < 2) return;
    const vw = thumbVideo.videoWidth, vh = thumbVideo.videoHeight;
    if (!vw || !vh) return;
    try {
        const scale = Math.max(thumbW / vw, thumbH / vh);
        const sx = (vw - thumbW / scale) / 2;
        const sy = (vh - thumbH / scale) / 2;
        thumbCtx.drawImage(thumbVideo, sx, sy, thumbW / scale, thumbH / scale, 0, 0, thumbW, thumbH);
    } catch (e) { /* CORS may block */ }
}

thumbVideo.addEventListener('seeked', () => {
    if (Math.abs(thumbVideo.currentTime - thumbSeekTarget) < 0.1) captureThumbFrame();
});

function updateProgressPreview(e) {
    const r = progressTrack.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const targetTime = p * (video.duration || 0);
    progressPreview.style.left = (p * 100) + '%';
    progressPreviewTime.textContent = fmt(targetTime);
    if (video.duration && thumbVideo.src) {
        thumbSeekTarget = targetTime;
        thumbVideo.currentTime = targetTime;
    }
}

progressWrap.addEventListener('mousemove', e => {
    updateProgressPreview(e);
});
progressWrap.addEventListener('mousedown', e => { dragging = true; progressWrap.classList.add('dragging'); seekTo(e); });
document.addEventListener('mousemove', e => {
    if (dragging) {
        seekTo(e);
        updateProgressPreview(e);
    }
});
document.addEventListener('mouseup', () => { if (dragging) { dragging = false; progressWrap.classList.remove('dragging'); } });

function seekTo(e) {
    const r = progressTrack.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const seekTime = p * (video.duration || 0);
    video.currentTime = seekTime;
    if (video.duration && seekTime < video.duration - LIVE_THRESHOLD) {
        isLiveMode = false;
        updateLiveBtnUI();
    }
    updProgress();
}
// ===== FULLSCREEN =====
function toggleFS() {
    if (!document.fullscreenElement) player.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
}
fsBtn.addEventListener('click', toggleFS);
document.addEventListener('fullscreenchange', () => {
    const en = fsBtn.querySelector('.icon-fs-enter'), ex = fsBtn.querySelector('.icon-fs-exit');
    if (document.fullscreenElement) { en.style.display = 'none'; ex.style.display = ''; }
    else { en.style.display = ''; ex.style.display = 'none'; }
});

// ===== PIP =====
pipBtn.addEventListener('click', async () => {
    try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else await video.requestPictureInPicture();
    } catch { showHint('غير مدعوم'); }
});

// ===== POPOVER LOGIC =====
const qualityPopover = document.getElementById('qualityPopover');
//const audioPopover = document.getElementById('audioPopover');
const qualityAnchor = document.getElementById('qualityAnchor');
//const audioAnchor = document.getElementById('audioAnchor');
let qualityHideTimer = null;
let audioHideTimer = null;

// تحديث وظائف القوائم للتحكم في ظهور شريط التقدم
function showPopover(popover) {
   
    popover.classList.add('show');
    
    // إضافة الكلاس الذي يخفي شريط التقدم
    player.classList.add('popover-open');
}

function closePopover(popover, timer) {
    clearTimeout(timer);
    popover.classList.remove('show');
    
    // إذا أغلقت كل القوائم، نعيد شريط التقدم
    if (!qualityPopover.classList.contains('show')) {
        player.classList.remove('popover-open');
    }
}

// تعديل اختيار الجودة ليكون متوافقاً مع المحاذاة الجديدة
function selectQuality(el) {
    document.querySelectorAll('#qualityPopover .popover-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    // اختياري: إغلاق القائمة بعد الاختيار
    // closePopover(qualityPopover, qualityHideTimer);
}
// Quality popover hover
qualityAnchor.addEventListener('mouseenter', () => { clearTimeout(qualityHideTimer); showPopover(qualityPopover); });
qualityAnchor.addEventListener('mouseleave', () => { qualityHideTimer = setTimeout(() => closePopover(qualityPopover, qualityHideTimer), 200); });
qualityPopover.addEventListener('mouseenter', () => { clearTimeout(qualityHideTimer); });
qualityPopover.addEventListener('mouseleave', () => { qualityHideTimer = setTimeout(() => closePopover(qualityPopover, qualityHideTimer), 200); });

// Audio popover hover
// audioAnchor.addEventListener('mouseenter', () => { clearTimeout(audioHideTimer); showPopover(audioPopover); });
// audioAnchor.addEventListener('mouseleave', () => { audioHideTimer = setTimeout(() => closePopover(audioPopover, audioHideTimer), 200); });
// audioPopover.addEventListener('mouseenter', () => { clearTimeout(audioHideTimer); });
// audioPopover.addEventListener('mouseleave', () => { audioHideTimer = setTimeout(() => closePopover(audioPopover, audioHideTimer), 200); });

// Selection functions
function selectQuality(el) {
    document.querySelectorAll('#qualityPopover .popover-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}

function selectAudio(el) {
    document.querySelectorAll('#audioPopover .popover-body .popover-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}

// Close popovers on outside click
document.addEventListener('click', (e) => {
    if (!qualityAnchor.contains(e.target)) {
        closePopover(qualityPopover, qualityHideTimer);
    }
});

// ===== CONTROLS VISIBILITY =====
let hideTimer;

function showControls() {
    player.classList.remove('controls-hidden');
    if (!qualityPopover.classList.contains('show')) {
        player.classList.remove('hide-cursor');
    }
    clearTimeout(hideTimer);
    if (!video.paused) {
        hideTimer = setTimeout(() => {
            if (qualityPopover.classList.contains('show')) return;
            player.classList.add('controls-hidden', 'hide-cursor');
        }, 3000);
    }
}

player.addEventListener('mousemove', showControls);
player.addEventListener('mousedown', showControls);
video.addEventListener('play', showControls);

video.addEventListener('pause', () => {
    clearTimeout(hideTimer);
    player.classList.remove('controls-hidden', 'hide-cursor');
});

player.addEventListener('mouseleave', () => { if (isPlaying) hideTimer = setTimeout(() => { player.classList.add('controls-hidden', 'hide-cursor'); }, 1000); });
document.getElementById('bottomControls').addEventListener('mouseenter', () => clearTimeout(hideTimer));
document.getElementById('topBar').addEventListener('mouseenter', () => clearTimeout(hideTimer));

// ===== KEYBOARD =====
document.addEventListener('keydown', e => {
    switch (e.key.toLowerCase()) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); showControls(); break;
        case 'arrowright': e.preventDefault(); forwardBtn.click(); showControls(); break;
        case 'arrowleft': e.preventDefault(); rewardBtn.click(); showControls(); break;
        case 'arrowup': e.preventDefault(); volSlider.value = Math.min(1, parseFloat(volSlider.value) + 0.05); volSlider.dispatchEvent(new Event('input')); showControls(); showHint(`الصوت ${Math.round(volSlider.value * 100)}%`); break;
        case 'arrowdown': e.preventDefault(); volSlider.value = Math.max(0, parseFloat(volSlider.value) - 0.05); volSlider.dispatchEvent(new Event('input')); showControls(); showHint(`الصوت ${Math.round(volSlider.value * 100)}%`); break;
        case 'f': e.preventDefault(); toggleFS(); break;
        case 'm': e.preventDefault(); toggleMute(); showControls(); showHint(isMuted ? 'كتم الصوت' : 'تشغيل الصوت'); break;
        case 'p': e.preventDefault(); pipBtn.click(); break;
    }
});

// ===== VIDEO EVENTS =====
video.addEventListener('loadedmetadata', () => { updateLiveBtnUI(); });
video.addEventListener('timeupdate', () => { if (!dragging) updProgress(); });
video.addEventListener('progress', () => {
    if (video.buffered.length > 0 && video.duration)
        progressBuffer.style.width = (video.buffered.end(video.buffered.length - 1) / video.duration) * 100 + '%';
});
video.addEventListener('waiting', () => document.getElementById('loader').classList.add('show'));
video.addEventListener('canplay', () => document.getElementById('loader').classList.remove('show'));
video.addEventListener('play', () => {
    isPlaying = true;
    playPauseBtn.querySelector('.icon-pause').style.display = '';
    playPauseBtn.querySelector('.icon-play').style.display = 'none';
    centerPlay.classList.remove('show');
});
video.addEventListener('pause', () => {
    isPlaying = false;
    playPauseBtn.querySelector('.icon-pause').style.display = 'none';
    playPauseBtn.querySelector('.icon-play').style.display = '';
});
video.addEventListener('ended', () => { showControls(); });

// ===== INIT =====
// Remove any track elements (subtitles)
const tracks = video.querySelectorAll('track');
tracks.forEach(track => track.remove());

if (video.paused) {
    centerPlay.classList.add('show');
}
playPauseBtn.querySelector('.icon-pause').style.display = 'none';
playPauseBtn.querySelector('.icon-play').style.display = '';

document.getElementById('closeBtn').addEventListener('click', () => showHint('إغلاق'));
document.getElementById('moreBtn').addEventListener('click', () => showHint('المزيد'));
document.getElementById('titleLink').addEventListener('click', () => showHint('صفحة الفيديو'));

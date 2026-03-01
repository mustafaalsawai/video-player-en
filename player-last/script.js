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
const moreBtn = document.getElementById('moreBtn');
const morePanel = document.getElementById('morePanel');
const moreBtnLive = document.getElementById('moreBtnLive');
const moreBtnRelated = document.getElementById('moreBtnRelated');
const moreActions = document.getElementById('moreActions');
const moreSideBySide = document.getElementById('moreSideBySide');
const moreReplace = document.getElementById('moreReplace');
const multiView = document.getElementById('multiView');
const primaryView = document.getElementById('primaryView');
const secondaryView = document.getElementById('secondaryView');
const secondaryVideo = document.getElementById('secondaryVideo');
const secondaryOverlay = document.getElementById('secondaryOverlay');
const closeSecondaryBtn = document.getElementById('closeSecondaryBtn');
const tertiaryView = document.getElementById('tertiaryView');
const tertiaryVideo = document.getElementById('tertiaryVideo');
const closeTertiaryBtn = document.getElementById('closeTertiaryBtn');
const quaternaryView = document.getElementById('quaternaryView');
const quaternaryVideo = document.getElementById('quaternaryVideo');
const closeQuaternaryBtn = document.getElementById('closeQuaternaryBtn');
const closePrimaryBtn = document.getElementById('closePrimaryBtn');
const fsBtn = document.getElementById('fsBtn');
const pipBtn = document.getElementById('pipBtn');
const centerPlay = document.getElementById('centerPlay');
const centerFeedback = document.getElementById('centerFeedback');
const centerFeedbackIcon = document.getElementById('centerFeedbackIcon');
const titleIcon = document.getElementById('titleIcon');
const hint = document.getElementById('hint');

let isPlaying = false, isMuted = false, prevVol = 0.8;
let dragging = false, hintTimer;
let isLiveMode = true;
const LIVE_THRESHOLD = 2;
let selectedMoreCard = null;
let selectedMoreVideo = '';
let isMultiView = false;
/** عدد الفيديوهات المعروضة: 2 أو 3 أو 4 */
let multiViewCount = 0;
const primaryDefaultSrc = video?.dataset?.defaultSrc || '';
const secondaryDefaultSrc = secondaryVideo?.dataset?.defaultSrc || '';

const multiViewVideos = [video, secondaryVideo, tertiaryVideo, quaternaryVideo];
const multiViewContainers = [primaryView, secondaryView, tertiaryView, quaternaryView];

function getActiveVideo() {
    if (!isMultiView || !primaryView) return video;
    for (let i = 0; i < multiViewCount && i < multiViewContainers.length; i++) {
        if (multiViewContainers[i] && multiViewContainers[i].classList.contains('active'))
            return multiViewVideos[i];
    }
    return video;
}

function syncUIFromVideo(v) {
    if (!v) return;
    if (v.duration && !Number.isNaN(v.duration)) {
        const p = isLiveMode ? 100 : (v.currentTime / v.duration) * 100;
        progressFill.style.width = p + '%';
        progressThumb.style.left = p + '%';
    }
    if (isMultiView) {
        /* في المتعدد: مستوى الصوت الحالي يبقى ويُطبَّق على الأكتف */
        v.volume = parseFloat(volSlider.value);
        v.muted = isMuted;
    } else {
        volSlider.value = v.volume;
        isMuted = v.muted;
        prevVol = v.muted ? prevVol : v.volume;
    }
    updateVolBg();
    updateVolumeIcon();
    if (v.paused) {
        playPauseBtn.querySelector('.icon-pause').style.display = 'none';
        playPauseBtn.querySelector('.icon-play').style.display = '';
    } else {
        playPauseBtn.querySelector('.icon-pause').style.display = '';
        playPauseBtn.querySelector('.icon-play').style.display = 'none';
    }
    if (v.buffered.length > 0 && v.duration)
        progressBuffer.style.width = (v.buffered.end(v.buffered.length - 1) / v.duration) * 100 + '%';
    if (v.src || v.currentSrc) thumbVideo.src = v.src || v.currentSrc;
    applyActiveAudio();
}

function setActiveView(viewEl) {
    multiViewContainers.forEach(el => {
        if (el) el.classList.toggle('active', el === viewEl);
    });
    const idx = multiViewContainers.indexOf(viewEl);
    const v = multiViewVideos[idx];
    if (v) syncUIFromVideo(v);
}

/** في المشاهدة المتعددة: الصوت يكون للأكتف فقط، والباقي كتم */
function applyActiveAudio() {
    if (!isMultiView) return;
    const active = getActiveVideo();
    const val = parseFloat(volSlider.value);
    for (let i = 0; i < multiViewCount && i < multiViewVideos.length; i++) {
        const v = multiViewVideos[i];
        if (!v) continue;
        if (v === active) {
            v.volume = val;
            v.muted = isMuted;
        } else {
            v.muted = true;
        }
    }
}

// ===== HELPERS =====
function fmt(s) {
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = Math.floor(s % 60);
    return h > 0
        ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
        : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function updProgress() {
    const v = getActiveVideo();
    if (!v || !v.duration) return;
    const p = isLiveMode ? 100 : (v.currentTime / v.duration) * 100;
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
    const v = getActiveVideo();
    v.currentTime = Math.max(0, v.currentTime - 15);
    isLiveMode = false;
    updateLiveBtnUI();
    triggerSideHint('left');
});

forwardBtn.addEventListener('click', () => {
    const v = getActiveVideo();
    const newTime = Math.min(v.duration || 0, v.currentTime + 15);
    v.currentTime = newTime;
    if (v.duration && v.duration - newTime <= LIVE_THRESHOLD) {
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
    const v = getActiveVideo();
    if (v.paused) {
        v.play().catch(() => { });
        showFeedback(true);
    } else {
        v.pause();
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
    const v = getActiveVideo();
    if (!isLiveMode && v.duration) {
        v.currentTime = v.duration;
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

function updateVolumeIcon() {
    const v = parseFloat(volSlider.value);
    volumeBtn.classList.remove('vol-state-high', 'vol-state-low', 'vol-state-muted');
    if (isMuted || v === 0) volumeBtn.classList.add('vol-state-muted');
    else if (v <= 0.5) volumeBtn.classList.add('vol-state-low');
    else volumeBtn.classList.add('vol-state-high');
}

function toggleMute() {
    const v = getActiveVideo();
    isMuted = !isMuted;
    if (isMuted) { prevVol = parseFloat(volSlider.value); volSlider.value = 0; v.muted = true; }
    else { volSlider.value = prevVol; v.volume = prevVol; v.muted = false; }
    updateVolBg();
    updateVolumeIcon();
    applyActiveAudio();
}

volumeBtn.addEventListener('click', toggleMute);
volSlider.addEventListener('input', () => {
    const v = getActiveVideo();
    const val = parseFloat(volSlider.value);
    v.volume = val;
    if (val === 0) isMuted = true;
    else isMuted = false;
    updateVolBg();
    updateVolumeIcon();
    applyActiveAudio();
});
updateVolBg();
updateVolumeIcon();

// ===== PROGRESS + THUMBNAIL PREVIEW =====
// المعاينة تحتاج تشغيل الصفحة من سيرفر (http) وليس file:// وإلا الـ canvas يبقى أسود (قيد أمان المتصفح)
const thumbVideo = document.createElement('video');
const isLocalFile = !video.src || video.src.startsWith('file:');
if (!isLocalFile) thumbVideo.crossOrigin = 'anonymous';
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
    const v = getActiveVideo();
    const r = progressTrack.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const targetTime = p * (v.duration || 0);
    progressPreview.style.left = (p * 100) + '%';
    progressPreviewTime.textContent = fmt(targetTime);
    if (v.duration && thumbVideo.src === (v.src || v.currentSrc)) {
        thumbSeekTarget = targetTime;
        thumbVideo.currentTime = targetTime;
    }
}

progressWrap.addEventListener('mouseenter', e => updateProgressPreview(e));
progressWrap.addEventListener('mousemove', e => updateProgressPreview(e));
progressWrap.addEventListener('mousedown', e => { dragging = true; progressWrap.classList.add('dragging'); seekTo(e); });
document.addEventListener('mousemove', e => {
    if (dragging) {
        seekTo(e);
        updateProgressPreview(e);
    }
});
document.addEventListener('mouseup', () => { if (dragging) { dragging = false; progressWrap.classList.remove('dragging'); } });

function seekTo(e) {
    const v = getActiveVideo();
    const r = progressTrack.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const seekTime = p * (v.duration || 0);
    v.currentTime = seekTime;
    if (v.duration && seekTime < v.duration - LIVE_THRESHOLD) {
        isLiveMode = false;
        updateLiveBtnUI();
    }
    updProgress();
}
// ===== FULLSCREEN =====
function toggleFS() {
    if (!document.fullscreenElement) player.requestFullscreen().catch(() => { });
    else document.exitFullscreen().catch(() => { });
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
        const v = getActiveVideo();
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else await v.requestPictureInPicture();
    } catch { showHint('غير مدعوم'); }
});

// ===== POPOVER LOGIC =====
const qualityPopover = document.getElementById('qualityPopover');
const commentatorPopover = document.getElementById('commentatorPopover');
const qualityAnchor = document.getElementById('qualityAnchor');
const commentatorAnchor = document.getElementById('commentatorAnchor');
let qualityHideTimer = null;
let commentatorHideTimer = null;

// تحديث وظائف القوائم للتحكم في ظهور شريط التقدم
function showPopover(popover) {
    if (morePanel.classList.contains('show')) {
        closeMorePanel();
    }
    popover.classList.add('show');

    // إضافة الكلاس الذي يخفي شريط التقدم
    player.classList.add('popover-open');
}

function closePopover(popover, timer) {
    clearTimeout(timer);
    popover.classList.remove('show');

    // إذا أغلقت كل القوائم، نعيد شريط التقدم
    if (!qualityPopover.classList.contains('show') && !commentatorPopover.classList.contains('show') && !morePanel.classList.contains('show')) {
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
qualityAnchor.addEventListener('mouseenter', () => {
    clearTimeout(qualityHideTimer);
    clearTimeout(commentatorHideTimer);
    closePopover(commentatorPopover, commentatorHideTimer);
    showPopover(qualityPopover);
});
qualityAnchor.addEventListener('mouseleave', () => {
    qualityHideTimer = setTimeout(() => closePopover(qualityPopover, qualityHideTimer), 200);
});
qualityPopover.addEventListener('mouseenter', () => { clearTimeout(qualityHideTimer); });
qualityPopover.addEventListener('mouseleave', () => {
    qualityHideTimer = setTimeout(() => closePopover(qualityPopover, qualityHideTimer), 200);
});

// Commentator popover hover
commentatorAnchor.addEventListener('mouseenter', () => {
    clearTimeout(commentatorHideTimer);
    clearTimeout(qualityHideTimer);
    closePopover(qualityPopover, qualityHideTimer);
    showPopover(commentatorPopover);
});
commentatorAnchor.addEventListener('mouseleave', () => {
    commentatorHideTimer = setTimeout(() => closePopover(commentatorPopover, commentatorHideTimer), 200);
});
commentatorPopover.addEventListener('mouseenter', () => { clearTimeout(commentatorHideTimer); });
commentatorPopover.addEventListener('mouseleave', () => {
    commentatorHideTimer = setTimeout(() => closePopover(commentatorPopover, commentatorHideTimer), 200);
});

function selectCommentator(el) {
    document.querySelectorAll('#commentatorPopover .popover-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}

// ===== MORE PANEL =====
function showMorePanel() {
    morePanel.classList.add('show');
    morePanel.setAttribute('aria-hidden', 'false');
    player.classList.add('popover-open', 'more-open');
    player.classList.remove('controls-hidden', 'hide-cursor');
    clearTimeout(hideTimer);
}

function closeMorePanel() {
    morePanel.classList.remove('show');
    morePanel.setAttribute('aria-hidden', 'true');
    player.classList.remove('more-open');
    if (!qualityPopover.classList.contains('show') && !commentatorPopover.classList.contains('show')) {
        player.classList.remove('popover-open');
    }
    clearMoreSelection();
}

function toggleMorePanel() {
    if (morePanel.classList.contains('show')) closeMorePanel();
    else showMorePanel();
}

function getCardVideo(card) {
    return (
        card.getAttribute('data-video') ||
        card.getAttribute('data-live-video') ||
        card.getAttribute('data-video-src') ||
        card.dataset.video ||
        video.currentSrc ||
        video.src
    );
}

function setMoreActionsVisible(visible) {
    if (!moreActions) return;
    moreActions.classList.toggle('show', visible);
    moreActions.setAttribute('aria-hidden', visible ? 'false' : 'true');
    morePanel.classList.toggle('card-selected', visible);
    morePanel.style.height = '';
}

function clearMoreSelection() {
    if (selectedMoreCard) selectedMoreCard.classList.remove('is-selected');
    selectedMoreCard = null;
    selectedMoreVideo = '';
    setMoreActionsVisible(false);
}

function selectMoreCard(card) {
    if (selectedMoreCard && selectedMoreCard !== card) {
        selectedMoreCard.classList.remove('is-selected');
    }
    selectedMoreCard = card;
    selectedMoreVideo = getCardVideo(card);
    card.classList.add('is-selected');
    setMoreActionsVisible(true);
}

function setMoreMode(mode) {
    const isLive = mode === 'live';
    morePanel.dataset.mode = mode;

    if (moreBtnLive && moreBtnRelated) {
        moreBtnLive.classList.toggle('more-btn-primary', isLive);
        moreBtnLive.classList.toggle('more-btn-secondary', !isLive);
        moreBtnRelated.classList.toggle('more-btn-primary', !isLive);
        moreBtnRelated.classList.toggle('more-btn-secondary', isLive);
    }

    document.querySelectorAll('.more-card').forEach(card => {
        const img = card.getAttribute(isLive ? 'data-live-img' : 'data-related-img');
        const imgEl = card.querySelector('.more-card-image');
        if (imgEl && img) {
            imgEl.style.setProperty('--card-img', `url('${img}')`);
        }
    });

    if (!isLive) {
        clearMoreSelection();
    } else if (selectedMoreCard) {
        setMoreActionsVisible(true);
    }
}

function getFileName(src) {
    if (!src) return '';
    try {
        return new URL(src, window.location.href).pathname.split('/').pop() || '';
    } catch {
        return src.split('/').pop() || '';
    }
}

function sameSrc(a, b) {
    if (!a || !b) return false;
    try {
        const pathA = new URL(a, window.location.href).pathname;
        const pathB = new URL(b, window.location.href).pathname;
        return pathA === pathB || pathA.endsWith(pathB) || pathB.endsWith(pathA);
    } catch {
        return a === b;
    }
}

function getCardVideoAttr(card) {
    return (
        card.getAttribute('data-video') ||
        card.getAttribute('data-live-video') ||
        card.getAttribute('data-video-src') ||
        card.dataset.video ||
        ''
    );
}

function updateCardsMultiviewState() {
    const sources = [];
    if (isMultiView) {
        for (let i = 0; i < multiViewCount && i < multiViewVideos.length; i++) {
            const v = multiViewVideos[i];
            if (v && v.src) sources.push(v.currentSrc || v.src || '');
        }
    }

    const srcCount = {};
    sources.forEach(s => {
        const key = getFileName(s);
        if (key) srcCount[key] = (srcCount[key] || 0) + 1;
    });

    const usedCount = {};
    document.querySelectorAll('.more-card').forEach(card => {
        const cardSrc = getCardVideoAttr(card);
        if (!cardSrc) {
            card.classList.remove('in-multiview');
            return;
        }
        const key = getFileName(cardSrc);
        const total = srcCount[key] || 0;
        const used = usedCount[key] || 0;
        if (used < total) {
            card.classList.add('in-multiview');
            usedCount[key] = used + 1;
        } else {
            card.classList.remove('in-multiview');
        }
    });

    const moreCardsEl = document.querySelector('.more-cards');
    if (moreCardsEl) {
        moreCardsEl.classList.toggle('multiview-full', isMultiView && multiViewCount >= 4);
    }
}

function getSideBySideSrc() {
    const currentSrc = video.currentSrc || video.src || '';
    const currentName = getFileName(currentSrc);
    const secondaryName = getFileName(secondaryDefaultSrc);

    if (secondaryDefaultSrc && currentName === secondaryName) {
        return primaryDefaultSrc || selectedMoreVideo || currentSrc;
    }

    return secondaryDefaultSrc || selectedMoreVideo || currentSrc;
}

function enterMultiView(src) {
    const cardSrc = src || video.currentSrc || video.src;
    if (!cardSrc) return;

    if (!isMultiView) {
        /* دخول أول مرة: فيديو واحد → اثنين */
        if (!secondaryView || !secondaryVideo) return;
        const oldPrimarySrc = video.currentSrc || video.src;
        const oldPrimaryTime = video.currentTime;
        const oldPrimaryPaused = video.paused;

        secondaryView.setAttribute('aria-hidden', 'false');
        video.src = cardSrc;
        video.load();
        video.currentTime = 0;
        video.play().catch(() => { });
        secondaryVideo.src = oldPrimarySrc || '';
        secondaryVideo.load();
        secondaryVideo.currentTime = oldPrimaryTime;
        secondaryVideo.muted = true;
        if (!oldPrimaryPaused) secondaryVideo.play().catch(() => { });

        secondaryView.classList.remove('selected');
        if (primaryView) primaryView.classList.add('active');
        if (secondaryView) secondaryView.classList.remove('active');
        player.classList.add('multi-view-active');
        player.classList.remove('multi-view-3', 'multi-view-4');
        isMultiView = true;
        multiViewCount = 2;
        if (thumbVideo) thumbVideo.src = cardSrc;
        syncUIFromVideo(video);
        updateCardsMultiviewState();
        return;
    }

    if (multiViewCount === 2 && tertiaryView && tertiaryVideo) {
        /* إضافة فيديو ثالث: فيديو كبير + فيديوين متساويين */
        tertiaryVideo.src = cardSrc;
        tertiaryVideo.load();
        tertiaryVideo.currentTime = 0;
        tertiaryVideo.muted = true;
        tertiaryVideo.play().catch(() => { });
        tertiaryView.setAttribute('aria-hidden', 'false');
        tertiaryView.classList.remove('active');
        player.classList.add('multi-view-3');
        player.classList.remove('multi-view-4');
        multiViewCount = 3;
        if (!primaryView.classList.contains('active')) {
            primaryView.classList.add('active');
            secondaryView.classList.remove('active');
            syncUIFromVideo(video);
        }
        applyActiveAudio();
        updateCardsMultiviewState();
        return;
    }

    if (multiViewCount === 3 && quaternaryView && quaternaryVideo) {
        /* إضافة فيديو رابع: أربعة متساوية 2×2 */
        quaternaryVideo.src = cardSrc;
        quaternaryVideo.load();
        quaternaryVideo.currentTime = 0;
        quaternaryVideo.muted = true;
        quaternaryVideo.play().catch(() => { });
        quaternaryView.setAttribute('aria-hidden', 'false');
        quaternaryView.classList.remove('active');
        player.classList.remove('multi-view-3');
        player.classList.add('multi-view-4');
        multiViewCount = 4;
        if (!primaryView.classList.contains('active')) {
            primaryView.classList.add('active');
            secondaryView.classList.remove('active');
            if (tertiaryView) tertiaryView.classList.remove('active');
            syncUIFromVideo(video);
        }
        applyActiveAudio();
        updateCardsMultiviewState();
    }
}

function exitMultiView() {
    const active = getActiveVideo();
    const activeSrc = active ? (active.currentSrc || active.src) : '';
    const activeTime = active ? active.currentTime : 0;
    const activePaused = active ? active.paused : true;

    if (secondaryView) {
        secondaryView.setAttribute('aria-hidden', 'true');
        secondaryView.classList.remove('selected', 'active');
    }
    if (secondaryVideo) {
        secondaryVideo.pause();
        secondaryVideo.removeAttribute('src');
        secondaryVideo.load();
    }
    if (tertiaryView) {
        tertiaryView.setAttribute('aria-hidden', 'true');
        tertiaryView.classList.remove('active');
    }
    if (tertiaryVideo) {
        tertiaryVideo.pause();
        tertiaryVideo.removeAttribute('src');
        tertiaryVideo.load();
    }
    if (quaternaryView) {
        quaternaryView.setAttribute('aria-hidden', 'true');
        quaternaryView.classList.remove('active');
    }
    if (quaternaryVideo) {
        quaternaryVideo.pause();
        quaternaryVideo.removeAttribute('src');
        quaternaryVideo.load();
    }

    if (primaryView) primaryView.classList.remove('active');
    player.classList.remove('multi-view-active', 'multi-view-3', 'multi-view-4');
    isMultiView = false;
    multiViewCount = 0;

    if (active && active !== video && activeSrc) {
        video.src = activeSrc;
        video.load();
        video.currentTime = activeTime;
        if (!activePaused) video.play().catch(() => { });
    }
    if (thumbVideo && video.src) thumbVideo.src = video.src;
    syncUIFromVideo(video);
    updateCardsMultiviewState();
}

/** يزيل فيديو البطاقة من المشاهدة المتعددة (نقر على أيقونة المينس) */
function removeFromMultiView(cardSrc) {
    if (!isMultiView) return;
    const primarySrc = video.currentSrc || video.src || '';
    const secondarySrc = secondaryVideo && secondaryVideo.src ? (secondaryVideo.currentSrc || secondaryVideo.src) : '';
    const tertiarySrc = tertiaryVideo && tertiaryVideo.src ? (tertiaryVideo.currentSrc || tertiaryVideo.src) : '';
    const quaternarySrc = quaternaryVideo && quaternaryVideo.src ? (quaternaryVideo.currentSrc || quaternaryVideo.src) : '';

    if (sameSrc(cardSrc, quaternarySrc) && multiViewCount === 4) {
        quaternaryVideo.pause();
        quaternaryVideo.removeAttribute('src');
        quaternaryVideo.load();
        quaternaryView.setAttribute('aria-hidden', 'true');
        quaternaryView.classList.remove('active');
        player.classList.remove('multi-view-4');
        player.classList.add('multi-view-3');
        multiViewCount = 3;
        updateCardsMultiviewState();
        return;
    }
    if (sameSrc(cardSrc, tertiarySrc) && multiViewCount >= 3) {
        tertiaryVideo.pause();
        tertiaryVideo.removeAttribute('src');
        tertiaryVideo.load();
        tertiaryView.setAttribute('aria-hidden', 'true');
        tertiaryView.classList.remove('active');
        if (multiViewCount === 3) {
            player.classList.remove('multi-view-3');
            multiViewCount = 2;
        } else {
            /* 4 → 3: نقل الرابع إلى الثالث */
            const qSrc = quaternaryVideo.currentSrc || quaternaryVideo.src;
            const qTime = quaternaryVideo.currentTime;
            const qPaused = quaternaryVideo.paused;
            quaternaryVideo.pause();
            quaternaryVideo.removeAttribute('src');
            quaternaryVideo.load();
            quaternaryView.setAttribute('aria-hidden', 'true');
            quaternaryView.classList.remove('active');
            tertiaryVideo.src = qSrc;
            tertiaryVideo.load();
            tertiaryVideo.currentTime = qTime;
            tertiaryVideo.muted = true;
            if (!qPaused) tertiaryVideo.play().catch(() => {});
            tertiaryView.setAttribute('aria-hidden', 'false');
            player.classList.remove('multi-view-4');
            player.classList.add('multi-view-3');
            multiViewCount = 3;
        }
        updateCardsMultiviewState();
        return;
    }
    if (sameSrc(cardSrc, secondarySrc)) {
        if (multiViewCount === 2) {
            secondaryVideo.pause();
            secondaryVideo.removeAttribute('src');
            secondaryVideo.load();
            secondaryView.setAttribute('aria-hidden', 'true');
            secondaryView.classList.remove('active');
            player.classList.remove('multi-view-active', 'multi-view-3', 'multi-view-4');
            isMultiView = false;
            multiViewCount = 0;
            if (primaryView) primaryView.classList.remove('active');
            syncUIFromVideo(video);
            updateCardsMultiviewState();
            return;
        }
        /* 3 أو 4: إزالة الثانوي ونقل الثالث (والرابع إن وجد) */
        secondaryVideo.pause();
        secondaryVideo.removeAttribute('src');
        secondaryVideo.load();
        secondaryView.setAttribute('aria-hidden', 'true');
        secondaryView.classList.remove('active');
        if (multiViewCount === 3) {
            secondaryVideo.src = tertiaryVideo.currentSrc || tertiaryVideo.src;
            secondaryVideo.load();
            secondaryVideo.currentTime = tertiaryVideo.currentTime;
            secondaryVideo.muted = true;
            if (!tertiaryVideo.paused) secondaryVideo.play().catch(() => {});
            tertiaryVideo.removeAttribute('src');
            tertiaryVideo.load();
            tertiaryView.setAttribute('aria-hidden', 'true');
            player.classList.remove('multi-view-3');
            multiViewCount = 2;
        } else {
            secondaryVideo.src = tertiaryVideo.currentSrc || tertiaryVideo.src;
            secondaryVideo.load();
            secondaryVideo.currentTime = tertiaryVideo.currentTime;
            secondaryVideo.muted = true;
            if (!tertiaryVideo.paused) secondaryVideo.play().catch(() => {});
            tertiaryVideo.removeAttribute('src');
            tertiaryVideo.load();
            tertiaryVideo.src = quaternaryVideo.currentSrc || quaternaryVideo.src;
            tertiaryVideo.load();
            tertiaryVideo.currentTime = quaternaryVideo.currentTime;
            if (!quaternaryVideo.paused) tertiaryVideo.play().catch(() => {});
            quaternaryVideo.removeAttribute('src');
            quaternaryVideo.load();
            quaternaryView.setAttribute('aria-hidden', 'true');
            tertiaryView.setAttribute('aria-hidden', 'false');
            player.classList.remove('multi-view-4');
            player.classList.add('multi-view-3');
            multiViewCount = 3;
        }
        secondaryView.setAttribute('aria-hidden', 'false');
        updateCardsMultiviewState();
        return;
    }
    if (sameSrc(cardSrc, primarySrc)) {
        const secSrc = secondaryVideo.currentSrc || secondaryVideo.src;
        const secTime = secondaryVideo.currentTime;
        const secPaused = secondaryVideo.paused;
        secondaryView.setAttribute('aria-hidden', 'true');
        secondaryView.classList.remove('selected', 'active');
        if (primaryView) primaryView.classList.remove('active');
        secondaryVideo.pause();
        secondaryVideo.removeAttribute('src');
        secondaryVideo.load();
        if (tertiaryVideo && tertiaryVideo.src) {
            tertiaryVideo.pause();
            tertiaryVideo.removeAttribute('src');
            tertiaryVideo.load();
        }
        if (tertiaryView) tertiaryView.setAttribute('aria-hidden', 'true');
        if (quaternaryVideo && quaternaryVideo.src) {
            quaternaryVideo.pause();
            quaternaryVideo.removeAttribute('src');
            quaternaryVideo.load();
        }
        if (quaternaryView) quaternaryView.setAttribute('aria-hidden', 'true');
        player.classList.remove('multi-view-active', 'multi-view-3', 'multi-view-4');
        isMultiView = false;
        multiViewCount = 0;
        video.src = secSrc;
        video.load();
        video.currentTime = secTime;
        if (!secPaused) video.play().catch(() => {});
        syncUIFromVideo(video);
        if (thumbVideo) thumbVideo.src = video.src;
        updateCardsMultiviewState();
    }
}

function swapPrimarySecondary() {
    if (!secondaryVideo || !secondaryVideo.src) return;
    player.classList.add('swapping');
    const primaryState = {
        src: video.currentSrc || video.src,
        time: video.currentTime,
        paused: video.paused
    };
    const secondaryState = {
        src: secondaryVideo.currentSrc || secondaryVideo.src,
        time: secondaryVideo.currentTime
    };
    if (!secondaryState.src) return;

    video.src = secondaryState.src;
    video.load();
    secondaryVideo.src = primaryState.src;
    secondaryVideo.load();

    const restorePrimary = () => {
        video.removeEventListener('loadedmetadata', restorePrimary);
        if (!Number.isNaN(secondaryState.time)) {
            video.currentTime = Math.min(secondaryState.time, video.duration || secondaryState.time);
        }
        if (!primaryState.paused) video.play().catch(() => { });
    };

    const restoreSecondary = () => {
        secondaryVideo.removeEventListener('loadedmetadata', restoreSecondary);
        if (!Number.isNaN(primaryState.time)) {
            secondaryVideo.currentTime = Math.min(primaryState.time, secondaryVideo.duration || primaryState.time);
        }
        secondaryVideo.play().catch(() => { });
    };

    video.addEventListener('loadedmetadata', restorePrimary);
    secondaryVideo.addEventListener('loadedmetadata', restoreSecondary);
    if (thumbVideo) {
        thumbVideo.src = video.src;
    }

    const clearSwap = () => player.classList.remove('swapping');
    setTimeout(clearSwap, 350);
}

// Audio popover hover
// audioAnchor.addEventListener('mouseenter', () => { clearTimeout(audioHideTimer); showPopover(audioPopover); });
// audioAnchor.addEventListener('mouseleave', () => { audioHideTimer = setTimeout(() => closePopover(audioPopover, audioHideTimer), 200); });
// audioPopover.addEventListener('mouseenter', () => { clearTimeout(audioHideTimer); });
// audioPopover.addEventListener('mouseleave', () => { audioHideTimer = setTimeout(() => closePopover(audioPopover, audioHideTimer), 200); });

// Selection functions
// (Logic moved to inline onclick or specific selection functions above)

// Close popovers on outside click
document.addEventListener('click', (e) => {
    if (!qualityAnchor.contains(e.target)) {
        closePopover(qualityPopover, qualityHideTimer);
    }
    if (!commentatorAnchor.contains(e.target)) {
        closePopover(commentatorPopover, commentatorHideTimer);
    }
    if (!morePanel.contains(e.target) && !moreBtn.contains(e.target)) {
        closeMorePanel();
    } else if (morePanel.classList.contains('show') && morePanel.contains(e.target)) {
        if (!e.target.closest('.more-btn, .more-card, a')) {
            closeMorePanel();
        }
    }
    if (secondaryView && secondaryView.classList.contains('selected') && !secondaryView.contains(e.target)) {
        secondaryView.classList.remove('selected');
    }
});

// ===== CONTROLS VISIBILITY =====
let hideTimer;

function showControls() {
    player.classList.remove('controls-hidden');
    if (!qualityPopover.classList.contains('show') && !commentatorPopover.classList.contains('show') && !morePanel.classList.contains('show')) {
        player.classList.remove('hide-cursor');
    }
    clearTimeout(hideTimer);
    const v = getActiveVideo();
    if (v && !v.paused) {
        hideTimer = setTimeout(() => {
            if (qualityPopover.classList.contains('show') || commentatorPopover.classList.contains('show') || morePanel.classList.contains('show')) return;
            player.classList.add('controls-hidden', 'hide-cursor');
        }, 3000);
    }
}

player.addEventListener('mousemove', showControls);
player.addEventListener('mousedown', showControls);
video.addEventListener('play', showControls);
if (secondaryVideo) secondaryVideo.addEventListener('play', showControls);
if (tertiaryVideo) tertiaryVideo.addEventListener('play', showControls);
if (quaternaryVideo) quaternaryVideo.addEventListener('play', showControls);

video.addEventListener('pause', () => {
    clearTimeout(hideTimer);
    player.classList.remove('controls-hidden', 'hide-cursor');
});

player.addEventListener('mouseleave', () => {
    if (isPlaying) {
        hideTimer = setTimeout(() => {
            if (morePanel.classList.contains('show')) return;
            player.classList.add('controls-hidden', 'hide-cursor');
        }, 1000);
    }
});
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
function onTimeupdate(e) {
    if (e.target !== getActiveVideo()) return;
    if (!dragging) updProgress();
}
function onProgress(e) {
    if (e.target !== getActiveVideo()) return;
    const v = e.target;
    if (v.buffered.length > 0 && v.duration)
        progressBuffer.style.width = (v.buffered.end(v.buffered.length - 1) / v.duration) * 100 + '%';
}
function onPlay(e) {
    if (e.target !== getActiveVideo()) return;
    isPlaying = true;
    playPauseBtn.querySelector('.icon-pause').style.display = '';
    playPauseBtn.querySelector('.icon-play').style.display = 'none';
    centerPlay.classList.remove('show');
}
function onPause(e) {
    if (e.target !== getActiveVideo()) return;
    isPlaying = false;
    playPauseBtn.querySelector('.icon-pause').style.display = 'none';
    playPauseBtn.querySelector('.icon-play').style.display = '';
}

video.addEventListener('loadedmetadata', () => { if (video === getActiveVideo()) updateLiveBtnUI(); });
video.addEventListener('timeupdate', onTimeupdate);
video.addEventListener('progress', onProgress);
video.addEventListener('waiting', function(e) { if (e.target === getActiveVideo()) document.getElementById('loader').classList.add('show'); });
video.addEventListener('canplay', function(e) { if (e.target === getActiveVideo()) document.getElementById('loader').classList.remove('show'); });
video.addEventListener('play', onPlay);
video.addEventListener('pause', onPause);
video.addEventListener('ended', function(e) { if (e.target === getActiveVideo()) showControls(); });

if (secondaryVideo) {
    secondaryVideo.addEventListener('timeupdate', onTimeupdate);
    secondaryVideo.addEventListener('progress', onProgress);
    secondaryVideo.addEventListener('play', onPlay);
    secondaryVideo.addEventListener('pause', onPause);
    secondaryVideo.addEventListener('waiting', function(e) { if (e.target === getActiveVideo()) document.getElementById('loader').classList.add('show'); });
    secondaryVideo.addEventListener('canplay', function(e) { if (e.target === getActiveVideo()) document.getElementById('loader').classList.remove('show'); });
    secondaryVideo.addEventListener('ended', function(e) { if (e.target === getActiveVideo()) showControls(); });
}

[tertiaryVideo, quaternaryVideo].filter(Boolean).forEach(v => {
    v.addEventListener('timeupdate', onTimeupdate);
    v.addEventListener('progress', onProgress);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('waiting', function(e) { if (e.target === getActiveVideo()) document.getElementById('loader').classList.add('show'); });
    v.addEventListener('canplay', function(e) { if (e.target === getActiveVideo()) document.getElementById('loader').classList.remove('show'); });
    v.addEventListener('ended', function(e) { if (e.target === getActiveVideo()) showControls(); });
});

// ===== INIT =====
// Remove any track elements (subtitles)
const tracks = video.querySelectorAll('track');
tracks.forEach(track => track.remove());

if (video.paused) {
    centerPlay.classList.add('show');
}
playPauseBtn.querySelector('.icon-pause').style.display = 'none';
playPauseBtn.querySelector('.icon-play').style.display = '';

// Ensure playback on load (autoplay + muted)
video.muted = true;
video.autoplay = true;
video.playsInline = true;
video.play().catch(() => { });

document.getElementById('closeBtn').addEventListener('click', () => showHint('إغلاق'));

let morePanelHoverCloseTimer = null;
let morePanelOpenedByHover = false;

function scheduleMorePanelClose() {
    if (morePanelHoverCloseTimer) clearTimeout(morePanelHoverCloseTimer);
    morePanelHoverCloseTimer = setTimeout(() => {
        closeMorePanel();
        morePanelOpenedByHover = false;
    }, 350);
}
function cancelMorePanelClose() {
    if (morePanelHoverCloseTimer) clearTimeout(morePanelHoverCloseTimer);
    morePanelHoverCloseTimer = null;
}

moreBtn.addEventListener('mouseenter', () => {
    cancelMorePanelClose();
    morePanelOpenedByHover = true;
    showMorePanel();
});

// Track mouse movement - only close panel when mouse leaves ABOVE the panel
document.addEventListener('mousemove', (e) => {
    if (!morePanel.classList.contains('show') || !morePanelOpenedByHover) return;
    
    const panelRect = morePanel.getBoundingClientRect();
    const controlsEl = document.getElementById('bottomControls');
    const controlsRect = controlsEl.getBoundingClientRect();
    
    // Mouse is inside the panel area - keep open
    if (e.clientX >= panelRect.left && e.clientX <= panelRect.right && 
        e.clientY >= panelRect.top && e.clientY <= panelRect.bottom) {
        cancelMorePanelClose();
        return;
    }
    
    // Mouse is in the bottom controls area - keep open
    if (e.clientX >= controlsRect.left && e.clientX <= controlsRect.right && 
        e.clientY >= controlsRect.top && e.clientY <= controlsRect.bottom) {
        cancelMorePanelClose();
        return;
    }
    
    // Mouse went above the panel (into video area) - close
    if (e.clientY < panelRect.top) {
        scheduleMorePanelClose();
    }
});

moreBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMorePanel(); });
morePanel.addEventListener('click', (e) => {
    if (e.target === morePanel || (e.target.closest('.more-panel-inner') && !e.target.closest('.more-btn, .more-card, a'))) {
        closeMorePanel();
    }
});
document.getElementById('titleLink').addEventListener('click', () => showHint('صفحة الفيديو'));
if (titleIcon) {
    titleIcon.addEventListener('click', () => showHint('صفحة الفيديو'));
}

if (moreBtnLive && moreBtnRelated) {
    moreBtnLive.addEventListener('click', (e) => { e.stopPropagation(); setMoreMode('live'); });
    moreBtnRelated.addEventListener('click', (e) => { e.stopPropagation(); setMoreMode('related'); });
}

document.querySelectorAll('.more-card').forEach(card => {
    card.addEventListener('click', (e) => {
        if (morePanel.dataset.mode !== 'live') return;
        e.stopPropagation();
        const cardSrc = getCardVideoAttr(card);
        const clickedMinus = e.target.closest('.more-card-plus') && card.classList.contains('in-multiview');
        if (clickedMinus && cardSrc) {
            removeFromMultiView(cardSrc);
            closeMorePanel();
            return;
        }
        if (multiViewCount >= 4) return;
        const src = getCardVideo(card);
        if (!src) return;
        enterMultiView(src);
        closeMorePanel();
    });
});

if (moreSideBySide) {
    moreSideBySide.addEventListener('click', (e) => {
        e.stopPropagation();
        const sideSrc = getSideBySideSrc();
        if (!sideSrc) return;
        enterMultiView(sideSrc);
        closeMorePanel();
    });
}

if (moreReplace) {
    moreReplace.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!selectedMoreVideo) return;
        exitMultiView();
        video.src = selectedMoreVideo;
        video.load();
        video.play().catch(() => { });
        isLiveMode = true;
        updateLiveBtnUI();
        if (thumbVideo) {
            thumbVideo.src = video.src;
        }
        closeMorePanel();
    });
}

if (primaryView) {
    primaryView.addEventListener('click', (e) => {
        if (!player.classList.contains('multi-view-active')) return;
        if (e.target.closest('#closePrimaryBtn')) return;
        e.stopPropagation();
        setActiveView(primaryView);
    });
}

if (closePrimaryBtn) {
    closePrimaryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromMultiView(video.currentSrc || video.src);
    });
}

if (secondaryView) {
    secondaryView.addEventListener('click', (e) => {
        if (!player.classList.contains('multi-view-active')) return;
        e.stopPropagation();
        if (e.target.closest('#closeSecondaryBtn')) return;
        setActiveView(secondaryView);
    });
}

if (closeSecondaryBtn) {
    closeSecondaryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromMultiView(secondaryVideo.currentSrc || secondaryVideo.src);
    });
}

if (tertiaryView) {
    tertiaryView.addEventListener('click', (e) => {
        if (!player.classList.contains('multi-view-active') || multiViewCount < 3) return;
        e.stopPropagation();
        if (e.target.closest('#closeTertiaryBtn')) return;
        setActiveView(tertiaryView);
    });
}

if (closeTertiaryBtn) {
    closeTertiaryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (tertiaryVideo && tertiaryVideo.src) removeFromMultiView(tertiaryVideo.currentSrc || tertiaryVideo.src);
    });
}

if (quaternaryView) {
    quaternaryView.addEventListener('click', (e) => {
        if (!player.classList.contains('multi-view-active') || multiViewCount < 4) return;
        e.stopPropagation();
        if (e.target.closest('#closeQuaternaryBtn')) return;
        setActiveView(quaternaryView);
    });
}

if (closeQuaternaryBtn) {
    closeQuaternaryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (quaternaryVideo && quaternaryVideo.src) removeFromMultiView(quaternaryVideo.currentSrc || quaternaryVideo.src);
    });
}

setMoreMode('live');

const controlsLeft = document.querySelector('.controls-left');
controlsLeft.addEventListener('mouseenter', () => {
    closeMorePanel();
});

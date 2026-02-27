// ==========================================
// Magic Camera App
// ==========================================

(function () {
  'use strict';

  // --- State ---
  let secretWord = '';
  let currentStream = null;
  let facingMode = 'environment'; // 'environment' = back, 'user' = front
  let capturedImage = null; // HTMLImageElement of the captured photo
  let capturedImageData = null; // ImageData of the captured photo

  // Card mode state
  let cardMode = false;
  let cardSuit = '';  // 'spades', 'hearts', 'clubs', 'diamonds'
  let cardValue = ''; // 'A','2'-'10','J','Q','K'
  let cachedCardGrid = null;

  // X-Ray mode state
  let xrayMode = false;

  // X-Ray overlay images (loaded from base64 in xray-images.js)
  const skullImg = new Image();
  skullImg.src = typeof SKULL_B64 !== 'undefined' ? SKULL_B64 : '';
  const brainImg = new Image();
  brainImg.src = typeof BRAIN_B64 !== 'undefined' ? BRAIN_B64 : '';

  // Inject state
  let injectEnabled = false;
  let injectId = '';
  let injectPollTimer = null;
  let injectLastCount = 0;

  // Zoom state for viewer
  let viewerZoom = 1;
  let viewerPanX = 0;
  let viewerPanY = 0;
  let viewerMaxZoom = 800;
  let viewerMinZoom = 1;

  // Touch tracking
  let lastTouchDist = 0;
  let lastTouchX = 0;
  let lastTouchY = 0;
  let isPinching = false;
  let isDragging = false;
  let touchStartTime = 0;

  // Zoom indicator timer
  let zoomIndicatorTimer = null;

  // Face detection
  let faceDetector = null;
  let wordEmbedPosition = null; // {x, y} in image coords, null = center

  // Auto-zoom animation
  let autoZoomAnimFrame = null;
  let isAutoZooming = false;

  // Melt animation
  let isMelting = false;
  let meltData = null;
  let meltAnimFrame = null;

  // Double-tap detection for melt trigger
  let lastViewerTapTime = 0;
  let viewerTouchStartPos = null;
  let viewerTouchMoved = false;

  // Secret reveal config
  const SECRET_REVEAL_THRESHOLD = 3;
  const SECRET_FULL_OPACITY_ZOOM = 15;

  // Pixel reveal config
  const PIXEL_FONT = {
    'A': [
      [0,1,1,0],
      [1,0,0,1],
      [1,1,1,1],
      [1,0,0,1],
      [1,0,0,1]
    ],
    'B': [
      [1,1,1,0],
      [1,0,0,1],
      [1,1,1,0],
      [1,0,0,1],
      [1,1,1,0]
    ],
    'C': [
      [0,1,1,1],
      [1,0,0,0],
      [1,0,0,0],
      [1,0,0,0],
      [0,1,1,1]
    ],
    'D': [
      [1,1,1,0],
      [1,0,0,1],
      [1,0,0,1],
      [1,0,0,1],
      [1,1,1,0]
    ],
    'E': [
      [1,1,1,1],
      [1,0,0,0],
      [1,1,1,0],
      [1,0,0,0],
      [1,1,1,1]
    ],
    'F': [
      [1,1,1,1],
      [1,0,0,0],
      [1,1,1,0],
      [1,0,0,0],
      [1,0,0,0]
    ],
    'G': [
      [0,1,1,1],
      [1,0,0,0],
      [1,0,1,1],
      [1,0,0,1],
      [0,1,1,1]
    ],
    'H': [
      [1,0,0,1],
      [1,0,0,1],
      [1,1,1,1],
      [1,0,0,1],
      [1,0,0,1]
    ],
    'I': [
      [1,1,1],
      [0,1,0],
      [0,1,0],
      [0,1,0],
      [1,1,1]
    ],
    'J': [
      [0,0,1,1],
      [0,0,0,1],
      [0,0,0,1],
      [1,0,0,1],
      [0,1,1,0]
    ],
    'K': [
      [1,0,0,1],
      [1,0,1,0],
      [1,1,0,0],
      [1,0,1,0],
      [1,0,0,1]
    ],
    'L': [
      [1,0,0,0],
      [1,0,0,0],
      [1,0,0,0],
      [1,0,0,0],
      [1,1,1,1]
    ],
    'M': [
      [1,0,0,0,1],
      [1,1,0,1,1],
      [1,0,1,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1]
    ],
    'N': [
      [1,0,0,1],
      [1,1,0,1],
      [1,0,1,1],
      [1,0,0,1],
      [1,0,0,1]
    ],
    'O': [
      [0,1,1,0],
      [1,0,0,1],
      [1,0,0,1],
      [1,0,0,1],
      [0,1,1,0]
    ],
    'P': [
      [1,1,1,0],
      [1,0,0,1],
      [1,1,1,0],
      [1,0,0,0],
      [1,0,0,0]
    ],
    'Q': [
      [0,1,1,0],
      [1,0,0,1],
      [1,0,0,1],
      [1,0,1,0],
      [0,1,0,1]
    ],
    'R': [
      [1,1,1,0],
      [1,0,0,1],
      [1,1,1,0],
      [1,0,1,0],
      [1,0,0,1]
    ],
    'S': [
      [0,1,1,1],
      [1,0,0,0],
      [0,1,1,0],
      [0,0,0,1],
      [1,1,1,0]
    ],
    'T': [
      [1,1,1,1,1],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0]
    ],
    'U': [
      [1,0,0,1],
      [1,0,0,1],
      [1,0,0,1],
      [1,0,0,1],
      [0,1,1,0]
    ],
    'V': [
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,0,1,0],
      [0,1,0,1,0],
      [0,0,1,0,0]
    ],
    'W': [
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,1,0,1],
      [1,1,0,1,1],
      [1,0,0,0,1]
    ],
    'X': [
      [1,0,0,1],
      [0,1,1,0],
      [0,1,1,0],
      [0,1,1,0],
      [1,0,0,1]
    ],
    'Y': [
      [1,0,0,0,1],
      [0,1,0,1,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0]
    ],
    'Z': [
      [1,1,1,1],
      [0,0,1,0],
      [0,1,0,0],
      [1,0,0,0],
      [1,1,1,1]
    ],
    ' ': [
      [0,0],
      [0,0],
      [0,0],
      [0,0],
      [0,0]
    ],
    '0': [
      [0,1,1,0],
      [1,0,0,1],
      [1,0,0,1],
      [1,0,0,1],
      [0,1,1,0]
    ],
    '1': [
      [0,1,0],
      [1,1,0],
      [0,1,0],
      [0,1,0],
      [1,1,1]
    ],
    '2': [
      [0,1,1,0],
      [1,0,0,1],
      [0,0,1,0],
      [0,1,0,0],
      [1,1,1,1]
    ],
    '3': [
      [1,1,1,0],
      [0,0,0,1],
      [0,1,1,0],
      [0,0,0,1],
      [1,1,1,0]
    ],
    '4': [
      [1,0,0,1],
      [1,0,0,1],
      [1,1,1,1],
      [0,0,0,1],
      [0,0,0,1]
    ],
    '5': [
      [1,1,1,1],
      [1,0,0,0],
      [1,1,1,0],
      [0,0,0,1],
      [1,1,1,0]
    ],
    '6': [
      [0,1,1,0],
      [1,0,0,0],
      [1,1,1,0],
      [1,0,0,1],
      [0,1,1,0]
    ],
    '7': [
      [1,1,1,1],
      [0,0,0,1],
      [0,0,1,0],
      [0,1,0,0],
      [0,1,0,0]
    ],
    '8': [
      [0,1,1,0],
      [1,0,0,1],
      [0,1,1,0],
      [1,0,0,1],
      [0,1,1,0]
    ],
    '9': [
      [0,1,1,0],
      [1,0,0,1],
      [0,1,1,1],
      [0,0,0,1],
      [0,1,1,0]
    ],
    '!': [
      [1],
      [1],
      [1],
      [0],
      [1]
    ],
    '?': [
      [0,1,1,0],
      [1,0,0,1],
      [0,0,1,0],
      [0,0,0,0],
      [0,0,1,0]
    ],
    '.': [
      [0],
      [0],
      [0],
      [0],
      [1]
    ],
    '-': [
      [0,0,0],
      [0,0,0],
      [1,1,1],
      [0,0,0],
      [0,0,0]
    ],
    '\'': [
      [1],
      [1],
      [0],
      [0],
      [0]
    ],
    ',': [
      [0],
      [0],
      [0],
      [1],
      [1]
    ]
  };

  // --- DOM Elements ---
  const secretScreen = document.getElementById('secret-screen');
  const secretInput = document.getElementById('secret-input');
  const secretSubmit = document.getElementById('secret-submit');
  const cameraScreen = document.getElementById('camera-screen');
  const cameraPreview = document.getElementById('camera-preview');
  const shutterBtn = document.getElementById('shutter-btn');
  const flipBtn = document.getElementById('flip-btn');
  const flashBtn = document.getElementById('flash-btn');
  const thumbnailPreview = document.getElementById('thumbnail-preview');
  const viewerScreen = document.getElementById('viewer-screen');
  const zoomCanvas = document.getElementById('zoom-canvas');
  const zoomCtx = zoomCanvas.getContext('2d');
  const captureCanvas = document.getElementById('capture-canvas');
  const captureCtx = captureCanvas.getContext('2d');
  const backBtn = document.getElementById('back-btn');
  const zoomIndicator = document.getElementById('zoom-indicator');
  const zoomBtns = document.querySelectorAll('.zoom-btn');
  const injectToggle = document.getElementById('inject-toggle');
  const injectIdInput = document.getElementById('inject-id-input');
  const injectStatus = document.getElementById('inject-status');

  // X-Ray mode DOM
  const xrayModeBtn = document.getElementById('xray-mode-btn');
  const faceGuideCircle = document.getElementById('face-guide-circle');

  // Card mode DOM
  const cardModeBtn = document.getElementById('card-mode-btn');
  const cardSuitScreen = document.getElementById('card-suit-screen');
  const cardValueScreen = document.getElementById('card-value-screen');
  const cardValuePrompt = document.getElementById('card-value-prompt');
  const suitBtns = document.querySelectorAll('.suit-btn');
  const valueBtns = document.querySelectorAll('.value-btn');
  const cardBackToMain = document.getElementById('card-back-to-main');
  const cardBackToSuit = document.getElementById('card-back-to-suit');

  // --- Screen Management ---
  function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
  }

  // --- Secret Word Entry ---
  secretSubmit.addEventListener('click', () => {
    xrayMode = false;
    faceGuideCircle.classList.add('hidden');
    if (injectEnabled) {
      // Inject mode: need ID and a word must have been received
      const id = injectIdInput.value.trim();
      if (!id || !secretWord) return;
      showScreen(cameraScreen);
      startCamera();
    } else {
      const word = secretInput.value.trim();
      if (word.length === 0) return;
      secretWord = word.toUpperCase();
      showScreen(cameraScreen);
      startCamera();
    }
  });

  secretInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      secretSubmit.click();
    }
  });

  // --- Inject Integration ---

  // Restore saved inject state from localStorage
  (function restoreInjectState() {
    const savedEnabled = localStorage.getItem('injectEnabled');
    const savedId = localStorage.getItem('injectId');
    if (savedEnabled === 'true') {
      injectEnabled = true;
      injectToggle.classList.add('active');
      injectIdInput.classList.remove('hidden');
      injectStatus.classList.remove('hidden');
      secretInput.classList.add('hidden');
      if (savedId) {
        injectIdInput.value = savedId;
        startInjectPolling(savedId);
      }
    }
  })();

  injectToggle.addEventListener('click', () => {
    injectEnabled = !injectEnabled;
    injectToggle.classList.toggle('active', injectEnabled);
    localStorage.setItem('injectEnabled', injectEnabled);

    if (injectEnabled) {
      // Show ID input, hide manual word input
      injectIdInput.classList.remove('hidden');
      injectStatus.classList.remove('hidden');
      secretInput.classList.add('hidden');
      injectStatus.textContent = '';
      injectStatus.classList.remove('connected');

      // Start polling if ID already entered
      const id = injectIdInput.value.trim();
      if (id) startInjectPolling(id);
    } else {
      // Show manual word input, hide Inject UI
      injectIdInput.classList.add('hidden');
      injectStatus.classList.add('hidden');
      secretInput.classList.remove('hidden');
      stopInjectPolling();
      secretWord = '';
      localStorage.removeItem('injectId');
    }
  });

  injectIdInput.addEventListener('input', () => {
    const id = injectIdInput.value.trim();
    localStorage.setItem('injectId', id);
    if (injectEnabled && id) {
      startInjectPolling(id);
    } else {
      stopInjectPolling();
      injectStatus.textContent = '';
      injectStatus.classList.remove('connected');
    }
  });

  function startInjectPolling(id) {
    stopInjectPolling();
    injectId = id;
    injectLastCount = 0;
    pollInject(); // first poll immediately
    injectPollTimer = setInterval(pollInject, 1000);
  }

  function stopInjectPolling() {
    if (injectPollTimer) {
      clearInterval(injectPollTimer);
      injectPollTimer = null;
    }
  }

  async function pollInject() {
    try {
      const resp = await fetch('https://11z.co/_w/' + injectId + '/selection');
      if (!resp.ok) {
        injectStatus.textContent = 'Connection error';
        injectStatus.classList.remove('connected');
        return;
      }
      const data = await resp.json();
      if (data.value && data.count !== injectLastCount) {
        injectLastCount = data.count;
        secretWord = String(data.value).toUpperCase();
        secretInput.value = secretWord;

        cachedWordGrid = null;
        cachedEdgeGrid = null;
        injectStatus.textContent = 'Word: ' + secretWord;
        injectStatus.classList.add('connected');
      } else if (!data.value) {
        injectStatus.textContent = 'Waiting for word...';
        injectStatus.classList.remove('connected');
      }
    } catch (err) {
      injectStatus.textContent = 'Connection error';
      injectStatus.classList.remove('connected');
    }
  }

  // --- Card Mode ---
  const SUIT_SYMBOLS = { spades: '\u2660', hearts: '\u2665', clubs: '\u2663', diamonds: '\u2666' };

  cardModeBtn.addEventListener('click', () => {
    cardMode = true;
    xrayMode = false;
    faceGuideCircle.classList.add('hidden');
    showScreen(cardSuitScreen);
  });

  suitBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      cardSuit = btn.dataset.suit;
      cardValuePrompt.textContent = SUIT_SYMBOLS[cardSuit] + ' Select Value';
      showScreen(cardValueScreen);
    });
  });

  valueBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      cardValue = btn.dataset.value;
      secretWord = cardValue + SUIT_SYMBOLS[cardSuit];
      cachedWordGrid = null;
      cachedEdgeGrid = null;
      cachedCardGrid = null;

      showScreen(cameraScreen);
      startCamera();
    });
  });

  cardBackToMain.addEventListener('click', () => {
    cardMode = false;
    cardSuit = '';
    cardValue = '';
    showScreen(secretScreen);
  });

  cardBackToSuit.addEventListener('click', () => {
    cardValue = '';
    showScreen(cardSuitScreen);
  });

  // --- X-Ray Mode ---
  xrayModeBtn.addEventListener('click', () => {
    const word = secretInput.value.trim();
    if (injectEnabled) {
      if (!secretWord) return;
    } else {
      if (word.length === 0) return;
      secretWord = word.toUpperCase();
    }
    xrayMode = true;
    cardMode = false;
    cachedWordGrid = null;
    cachedEdgeGrid = null;

    // Switch to front camera for face shots
    facingMode = 'user';

    // Show face guide circle
    faceGuideCircle.classList.remove('hidden');

    showScreen(cameraScreen);
    startCamera();
  });

  // --- Camera ---
  async function startCamera() {
    if (currentStream) {
      currentStream.getTracks().forEach(t => t.stop());
      currentStream = null;
      // Give the hardware a moment to release before re-acquiring
      await new Promise(r => setTimeout(r, 300));
    }
    try {
      const isFront = facingMode === 'user';
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: isFront ? 1920 : 4032 },
          height: { ideal: isFront ? 1080 : 3024 }
        },
        audio: false
      };
      currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraPreview.srcObject = currentStream;

      // Mirror front camera preview
      if (isFront) {
        cameraPreview.classList.add('mirrored');
      } else {
        cameraPreview.classList.remove('mirrored');
      }
    } catch (err) {
      console.error('Camera error:', err);
      alert('Camera access is required for this app. Please allow camera access and reload.');
    }
  }

  // Flip camera with smooth transition
  flipBtn.addEventListener('click', async () => {
    flipBtn.disabled = true;
    const previousFacingMode = facingMode;
    try {
      cameraPreview.style.opacity = '0';
      await new Promise(r => setTimeout(r, 200));

      facingMode = facingMode === 'environment' ? 'user' : 'environment';
      await startCamera();

      // If startCamera failed to obtain a stream, revert to previous camera
      if (!currentStream) {
        facingMode = previousFacingMode;
        await startCamera();
      }

      // Wait for new stream to produce a frame before fading in
      await new Promise(resolve => {
        cameraPreview.onplaying = () => {
          cameraPreview.onplaying = null;
          resolve();
        };
        // Fallback in case onplaying doesn't fire
        setTimeout(resolve, 500);
      });
    } catch (err) {
      console.error('Flip camera error:', err);
      // Revert to previous camera on failure
      facingMode = previousFacingMode;
      try { await startCamera(); } catch (_) { /* best effort */ }
    } finally {
      cameraPreview.style.opacity = '1';
      flipBtn.disabled = false;
    }
  });

  // Flash (visual toggle only for the look)
  let flashState = 'off';
  flashBtn.addEventListener('click', () => {
    flashState = flashState === 'off' ? 'on' : 'off';
    flashBtn.style.color = flashState === 'on' ? '#fc0' : '#fff';
  });

  // Zoom buttons (visual only — camera digital zoom is limited in browsers)
  zoomBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      zoomBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const zoomVal = parseFloat(btn.dataset.zoom);
      applyCameraZoom(zoomVal);
    });
  });

  function applyCameraZoom(zoomVal) {
    if (!currentStream) return;
    const track = currentStream.getVideoTracks()[0];
    const capabilities = track.getCapabilities ? track.getCapabilities() : {};
    if (capabilities.zoom) {
      const max = capabilities.zoom.max;
      const min = capabilities.zoom.min;
      const clampedZoom = Math.min(Math.max(zoomVal, min), max);
      track.applyConstraints({ advanced: [{ zoom: clampedZoom }] });
    }
  }

  // --- Photo Capture ---
  shutterBtn.addEventListener('click', capturePhoto);

  function capturePhoto() {
    if (!currentStream) return;

    // Hide face guide circle on capture (like the center dot)
    faceGuideCircle.classList.add('hidden');

    // Shutter flash animation
    const flash = document.createElement('div');
    flash.className = 'shutter-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 250);

    // Capture from video
    const video = cameraPreview;
    const w = video.videoWidth;
    const h = video.videoHeight;
    captureCanvas.width = w;
    captureCanvas.height = h;

    // Mirror capture for front camera so saved image matches the preview
    if (facingMode === 'user') {
      captureCtx.translate(w, 0);
      captureCtx.scale(-1, 1);
    }
    captureCtx.drawImage(video, 0, 0, w, h);
    captureCtx.setTransform(1, 0, 0, 1, 0, 0); // reset transform

    // Create image from canvas
    const dataURL = captureCanvas.toDataURL('image/jpeg', 0.95);
    capturedImage = new Image();
    capturedImage.onload = async () => {
      capturedImageData = captureCtx.getImageData(0, 0, w, h);
      await detectFaceAndSetPosition();
      thumbnailPreview.style.backgroundImage = `url(${dataURL})`;
      thumbnailPreview.classList.add('has-photo');
      cachedWordGrid = null;
      cachedEdgeGrid = null;
      cachedCardGrid = null;

    };
    capturedImage.src = dataURL;
  }

  // --- Embed Secret Word Into Image Pixels ---
  function embedSecretWord(imgW, imgH) {
    // Build the pixel grid for the secret word
    const wordGrid = buildWordGrid(secretWord);
    if (!wordGrid || wordGrid.length === 0) return;

    const gridH = wordGrid.length;
    const gridW = wordGrid[0].length;

    // Place the word grid at detected eye position or center of image
    const centerX = wordEmbedPosition ? wordEmbedPosition.x : Math.floor(imgW / 2);
    const centerY = wordEmbedPosition ? wordEmbedPosition.y : Math.floor(imgH / 2);
    const startX = centerX - Math.floor(gridW / 2);
    const startY = centerY - Math.floor(gridH / 2);

    // Get image data to modify
    const imageData = captureCtx.getImageData(0, 0, imgW, imgH);
    const data = imageData.data;

    // Per-pixel adaptive embedding: each text pixel samples its 3x3 neighbors
    // and shifts slightly to blend with surroundings
    const EMBED_SHIFT = 65;

    // Write the word grid into the image with per-pixel neighbor blending
    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        const px = startX + gx;
        const py = startY + gy;
        if (px >= 0 && px < imgW && py >= 0 && py < imgH) {
          if (wordGrid[gy][gx] === 1) {
            // Average the 3x3 neighborhood around this pixel
            let rSum = 0, gSum = 0, bSum = 0, count = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const nx = px + dx;
                const ny = py + dy;
                if (nx >= 0 && nx < imgW && ny >= 0 && ny < imgH) {
                  const nIdx = (ny * imgW + nx) * 4;
                  rSum += data[nIdx];
                  gSum += data[nIdx + 1];
                  bSum += data[nIdx + 2];
                  count++;
                }
              }
            }
            const avgR = Math.round(rSum / count);
            const avgG = Math.round(gSum / count);
            const avgB = Math.round(bSum / count);
            const brightness = (avgR + avgG + avgB) / 3;

            const idx = (py * imgW + px) * 4;
            if (brightness > 128) {
              data[idx] = Math.max(0, avgR - EMBED_SHIFT);
              data[idx + 1] = Math.max(0, avgG - EMBED_SHIFT);
              data[idx + 2] = Math.max(0, avgB - EMBED_SHIFT);
            } else {
              data[idx] = Math.min(255, avgR + EMBED_SHIFT);
              data[idx + 1] = Math.min(255, avgG + EMBED_SHIFT);
              data[idx + 2] = Math.min(255, avgB + EMBED_SHIFT);
            }
          }
          // "off" pixels keep their original color
        }
      }
    }

    captureCtx.putImageData(imageData, 0, 0);
  }

  function buildWordGrid(word) {
    const letters = word.split('');
    const letterGrids = [];
    for (const ch of letters) {
      const grid = PIXEL_FONT[ch] || PIXEL_FONT['?'];
      letterGrids.push(grid);
    }

    // Combine letter grids with 1-column spacing
    const height = 5;
    let totalWidth = 0;
    for (const g of letterGrids) {
      totalWidth += g[0].length + 1; // +1 for spacing
    }
    totalWidth -= 1; // No trailing space

    const combined = [];
    for (let row = 0; row < height; row++) {
      combined[row] = [];
      let col = 0;
      for (let li = 0; li < letterGrids.length; li++) {
        const g = letterGrids[li];
        for (let c = 0; c < g[row].length; c++) {
          combined[row][col] = g[row][c];
          col++;
        }
        if (li < letterGrids.length - 1) {
          combined[row][col] = 0; // spacing
          col++;
        }
      }
    }

    return combined;
  }

  // --- Face Detection ---
  async function detectFaceAndSetPosition() {
    if (!faceDetector || !capturedImage) {
      wordEmbedPosition = null;
      return;
    }
    try {
      const faces = await faceDetector.detect(capturedImage);
      if (faces.length > 0) {
        const face = faces[0];
        let eyeX, eyeY;
        if (face.landmarks && face.landmarks.length > 0) {
          const eyes = face.landmarks.filter(l => l.type === 'eye');
          if (eyes.length >= 2) {
            eyeX = (eyes[0].locations[0].x + eyes[1].locations[0].x) / 2;
            eyeY = (eyes[0].locations[0].y + eyes[1].locations[0].y) / 2;
          }
        }
        if (eyeX === undefined) {
          const box = face.boundingBox;
          eyeX = box.x + box.width / 2;
          eyeY = box.y + box.height * 0.35;
        }
        wordEmbedPosition = { x: Math.round(eyeX), y: Math.round(eyeY) };
      } else {
        wordEmbedPosition = null;
      }
    } catch (e) {
      wordEmbedPosition = null;
    }
  }

  // --- Viewer / Zoom ---
  function resizeViewerCanvas() {
    // Use actual rendered size — avoids iOS dynamic toolbar mismatch
    const rect = zoomCanvas.getBoundingClientRect();
    zoomCanvas.width = rect.width * window.devicePixelRatio;
    zoomCanvas.height = rect.height * window.devicePixelRatio;
  }

  function renderViewer() {
    if (!capturedImage) return;

    const cw = zoomCanvas.width;
    const ch = zoomCanvas.height;
    const iw = capturedImage.width;
    const ih = capturedImage.height;

    zoomCtx.fillStyle = '#000';
    zoomCtx.fillRect(0, 0, cw, ch);

    // Calculate base scale to fit image on screen
    const scaleX = cw / iw;
    const scaleY = ch / ih;
    const baseScale = Math.max(scaleX, scaleY); // cover

    const scale = baseScale * viewerZoom;

    // Clamp pan so image edges never come into view
    const drawW = iw * scale;
    const drawH = ih * scale;
    const maxPanX = Math.max(0, (drawW - cw) / 2);
    const maxPanY = Math.max(0, (drawH - ch) / 2);
    viewerPanX = Math.max(-maxPanX, Math.min(maxPanX, viewerPanX));
    viewerPanY = Math.max(-maxPanY, Math.min(maxPanY, viewerPanY));

    const cx = cw / 2 + viewerPanX;
    const cy = ch / 2 + viewerPanY;
    const drawX = cx - drawW / 2;
    const drawY = cy - drawH / 2;

    // Determine if we should render pixel grid or normal image
    const pixelSize = scale; // Size of one image pixel on screen

    if (pixelSize > 8) {
      // Render as pixel grid — this is the "zoomed in" look
      renderPixelGrid(drawX, drawY, scale, cw, ch);
    } else {
      // Normal image rendering
      zoomCtx.imageSmoothingEnabled = pixelSize < 1;
      zoomCtx.drawImage(capturedImage, drawX, drawY, drawW, drawH);
    }

    // Overlay reveal — fades in gradually
    if (xrayMode) {
      renderXrayEffect(drawX, drawY, scale, cw, ch);
    } else if (viewerZoom >= SECRET_REVEAL_THRESHOLD) {
      const opacity = Math.min(1, (viewerZoom - SECRET_REVEAL_THRESHOLD) / (SECRET_FULL_OPACITY_ZOOM - SECRET_REVEAL_THRESHOLD));
      if (cardMode) {
        renderCardOverlay(drawX, drawY, scale, cw, ch, opacity);
      } else {
        renderSecretOverlay(drawX, drawY, scale, cw, ch, opacity);
      }
    }

    // Update zoom indicator
    updateZoomIndicator();
  }

  function renderPixelGrid(drawX, drawY, scale, cw, ch) {
    if (!capturedImageData) return;

    const iw = capturedImageData.width;
    const ih = capturedImageData.height;
    const data = capturedImageData.data;

    // Calculate visible pixel range
    const startPxX = Math.max(0, Math.floor(-drawX / scale));
    const startPxY = Math.max(0, Math.floor(-drawY / scale));
    const endPxX = Math.min(iw, Math.ceil((cw - drawX) / scale));
    const endPxY = Math.min(ih, Math.ceil((ch - drawY) / scale));

    const gap = scale > 20 ? 1 : 0;

    for (let py = startPxY; py < endPxY; py++) {
      for (let px = startPxX; px < endPxX; px++) {
        const idx = (py * iw + px) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        zoomCtx.fillStyle = `rgb(${r},${g},${b})`;
        zoomCtx.fillRect(
          drawX + px * scale + gap,
          drawY + py * scale + gap,
          scale - gap * 2,
          scale - gap * 2
        );
      }
    }
  }

  let cachedWordGrid = null;
  let cachedEdgeGrid = null;

  function renderSecretOverlay(drawX, drawY, scale, cw, ch, opacity) {
    if (!secretWord || !capturedImageData) return;

    const iw = capturedImageData.width;
    const ih = capturedImageData.height;

    // Build word grid and edge-softness map once and cache
    if (!cachedWordGrid) {
      cachedWordGrid = buildWordGrid(secretWord);
      if (cachedWordGrid && cachedWordGrid.length > 0) {
        const gh = cachedWordGrid.length;
        const gw = cachedWordGrid[0].length;
        cachedEdgeGrid = [];

        // Compute Euclidean distance to nearest non-letter cell (including out-of-bounds)
        for (let y = 0; y < gh; y++) {
          cachedEdgeGrid[y] = [];
          for (let x = 0; x < gw; x++) {
            if (cachedWordGrid[y][x] !== 1) {
              cachedEdgeGrid[y][x] = 0;
              continue;
            }
            let minDist = Infinity;
            for (let dy = -3; dy <= 3; dy++) {
              for (let dx = -3; dx <= 3; dx++) {
                if (dy === 0 && dx === 0) continue;
                const ny = y + dy;
                const nx = x + dx;
                const isLetter = (ny >= 0 && ny < gh && nx >= 0 && nx < gw) ? cachedWordGrid[ny][nx] === 1 : false;
                if (!isLetter) {
                  const dist = Math.sqrt(dy * dy + dx * dx);
                  if (dist < minDist) minDist = dist;
                }
              }
            }
            cachedEdgeGrid[y][x] = minDist === Infinity ? 1 : minDist;
          }
        }

        // Find max distance for normalization
        let maxDist = 0;
        for (let y = 0; y < gh; y++) {
          for (let x = 0; x < gw; x++) {
            if (cachedEdgeGrid[y][x] > maxDist) maxDist = cachedEdgeGrid[y][x];
          }
        }

        // Normalize with squared curve: edges nearly invisible, only deep interior gets full shift
        if (maxDist > 0) {
          for (let y = 0; y < gh; y++) {
            for (let x = 0; x < gw; x++) {
              if (cachedWordGrid[y][x] === 1) {
                const t = cachedEdgeGrid[y][x] / maxDist;
                cachedEdgeGrid[y][x] = 0.02 + 0.98 * (t * t);
              }
            }
          }
        }
      }
    }
    if (!cachedWordGrid || cachedWordGrid.length === 0) return;

    const gridH = cachedWordGrid.length;
    const gridW = cachedWordGrid[0].length;

    // Place word at detected eye position or center of image
    const imgCenterX = wordEmbedPosition ? wordEmbedPosition.x : Math.floor(iw / 2);
    const imgCenterY = wordEmbedPosition ? wordEmbedPosition.y : Math.floor(ih / 2);

    const startX = imgCenterX - Math.floor(gridW / 2);
    const startY = imgCenterY - Math.floor(gridH / 2);

    const data = capturedImageData.data;
    const SHIFT = 18; // subtle base shift
    const BLEND = 0.50; // 50/50 shifted vs original
    const DITHER = 0.95; // 95% of letter pixels get shifted
    const gap = scale > 20 ? 1 : 0;

    // Seeded random for consistent dither pattern per pixel
    function seededRand(x, y) {
      let h = (x * 374761393 + y * 668265263 + 1274126177) | 0;
      h = ((h ^ (h >> 13)) * 1103515245) | 0;
      return ((h & 0x7fffffff) / 0x7fffffff);
    }

    zoomCtx.globalAlpha = opacity;

    // Draw letter pixels: dithered, noise-varied, alpha-blended with original
    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        if (cachedWordGrid[gy][gx] === 1) {
          const px = startX + gx;
          const py = startY + gy;
          if (px >= 0 && px < iw && py >= 0 && py < ih) {
            // Dithering: skip a random subset of letter pixels entirely
            const rand = seededRand(px, py);
            const ef = cachedEdgeGrid[gy][gx];
            if (rand > DITHER * ef) continue; // edges skip even more

            const idx = (py * iw + px) * 4;
            const origR = data[idx];
            const origG = data[idx + 1];
            const origB = data[idx + 2];
            const brightness = (origR + origG + origB) / 3;

            // Per-pixel noise: randomize shift amount ±20%
            const noise = 0.8 + seededRand(px + 999, py + 777) * 0.4;
            const shift = Math.round(SHIFT * ef * noise);

            let sr, sg, sb;
            if (brightness > 128) {
              sr = Math.max(0, origR - shift);
              sg = Math.max(0, origG - shift);
              sb = Math.max(0, origB - shift);
            } else {
              sr = Math.min(255, origR + shift);
              sg = Math.min(255, origG + shift);
              sb = Math.min(255, origB + shift);
            }

            // Alpha blend: mix shifted color with original
            const nr = Math.round(origR + (sr - origR) * BLEND);
            const ng = Math.round(origG + (sg - origG) * BLEND);
            const nb = Math.round(origB + (sb - origB) * BLEND);

            zoomCtx.fillStyle = `rgb(${nr},${ng},${nb})`;
            zoomCtx.fillRect(
              drawX + px * scale + gap,
              drawY + py * scale + gap,
              scale - gap * 2,
              scale - gap * 2
            );
          }
        }
      }
    }

    zoomCtx.globalAlpha = 1;
  }

  // --- Card Pixel Art ---
  // Simple value + suit grid (same format as word grid: 0/1, 5 rows tall)

  // 5x5 suit symbols matching PIXEL_FONT height
  const SUIT_PIPS = {
    spades: [
      [0,0,1,0,0],
      [0,1,1,1,0],
      [1,1,1,1,1],
      [0,0,1,0,0],
      [0,1,0,1,0]
    ],
    hearts: [
      [0,1,0,1,0],
      [1,1,1,1,1],
      [1,1,1,1,1],
      [0,1,1,1,0],
      [0,0,1,0,0]
    ],
    clubs: [
      [0,0,1,0,0],
      [0,1,1,1,0],
      [1,1,0,1,1],
      [0,1,1,1,0],
      [0,0,1,0,0]
    ],
    diamonds: [
      [0,0,1,0,0],
      [0,1,1,1,0],
      [1,1,1,1,1],
      [0,1,1,1,0],
      [0,0,1,0,0]
    ]
  };

  function buildCardGrid(suit, value) {
    // Build value glyphs from PIXEL_FONT (same font as secret words)
    const chars = value.split('');
    const glyphs = chars.map(ch => PIXEL_FONT[ch] || PIXEL_FONT['?']);
    const suitGlyph = SUIT_PIPS[suit];
    const height = 5;

    // Total width: value chars with 1px spacing + 1px gap + suit (5px)
    let totalWidth = 0;
    for (const g of glyphs) {
      totalWidth += g[0].length + 1;
    }
    totalWidth += suitGlyph[0].length; // suit symbol after the gap

    const grid = [];
    for (let row = 0; row < height; row++) {
      grid[row] = [];
      let col = 0;
      // Value characters
      for (let i = 0; i < glyphs.length; i++) {
        const g = glyphs[i];
        for (let c = 0; c < g[row].length; c++) {
          grid[row][col] = g[row][c];
          col++;
        }
        // 1px spacing after each char (including last, becomes gap before suit)
        grid[row][col] = 0;
        col++;
      }
      // Suit symbol
      for (let c = 0; c < suitGlyph[row].length; c++) {
        grid[row][col] = suitGlyph[row][c];
        col++;
      }
    }

    return grid;
  }

  function renderCardOverlay(drawX, drawY, scale, cw, ch, opacity) {
    if (!cardMode || !cardSuit || !cardValue || !capturedImageData) return;

    const iw = capturedImageData.width;
    const ih = capturedImageData.height;

    if (!cachedCardGrid) {
      cachedCardGrid = buildCardGrid(cardSuit, cardValue);
    }
    if (!cachedCardGrid || cachedCardGrid.length === 0) return;

    const gridH = cachedCardGrid.length;
    const gridW = cachedCardGrid[0].length;

    const imgCenterX = wordEmbedPosition ? wordEmbedPosition.x : Math.floor(iw / 2);
    const imgCenterY = wordEmbedPosition ? wordEmbedPosition.y : Math.floor(ih / 2);

    const startX = imgCenterX - Math.floor(gridW / 2);
    const startY = imgCenterY - Math.floor(gridH / 2);

    const data = capturedImageData.data;
    const SHIFT = 30;
    const gap = scale > 20 ? 1 : 0;

    function seededRand(x, y) {
      let h = (x * 374761393 + y * 668265263 + 1274126177) | 0;
      h = ((h ^ (h >> 13)) * 1103515245) | 0;
      return ((h & 0x7fffffff) / 0x7fffffff);
    }

    zoomCtx.globalAlpha = opacity;

    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        if (cachedCardGrid[gy][gx] === 1) {
          const px = startX + gx;
          const py = startY + gy;
          if (px >= 0 && px < iw && py >= 0 && py < ih) {
            const idx = (py * iw + px) * 4;
            const origR = data[idx];
            const origG = data[idx + 1];
            const origB = data[idx + 2];
            const brightness = (origR + origG + origB) / 3;

            const noise = 0.9 + seededRand(px, py) * 0.2;
            const shift = Math.round(SHIFT * noise);

            let nr, ng, nb;
            if (brightness > 128) {
              nr = Math.max(0, origR - shift);
              ng = Math.max(0, origG - shift);
              nb = Math.max(0, origB - shift);
            } else {
              nr = Math.min(255, origR + shift);
              ng = Math.min(255, origG + shift);
              nb = Math.min(255, origB + shift);
            }

            zoomCtx.fillStyle = `rgb(${nr},${ng},${nb})`;
            zoomCtx.fillRect(
              drawX + px * scale + gap,
              drawY + py * scale + gap,
              scale - gap * 2,
              scale - gap * 2
            );
          }
        }
      }
    }

    zoomCtx.globalAlpha = 1;
  }

  // --- X-Ray Effect Rendering (5-Layer System) ---
  // Layer boundaries — fast transition, all layers within 1x-5x zoom
  const XRAY_L1_START = 1.0;  // Layer 1 starts: skin desaturation
  const XRAY_L1_END = 1.5;    // Layer 1 peaks
  const XRAY_L2_START = 1.2;  // Layer 2 starts: tissue
  const XRAY_L2_END = 1.7;    // Layer 2 peaks
  const XRAY_L3_START = 1.4;  // Layer 3 starts: skull
  const XRAY_L3_END = 2.5;    // Layer 3 peaks (skull visible by 1.7x)
  const XRAY_L4_START = 1.8;  // Layer 4 starts: brain cavity
  const XRAY_L4_END = 3.0;    // Layer 4 peaks (brain visible by ~2.1x)
  const XRAY_L5_START = 35.0; // Layer 5 starts: word reveal begins
  const XRAY_L5_END = 50.0;   // Layer 5 fully visible (every letter clear by 50x)

  // Grain texture canvas (generated once, reused)
  let grainCanvas = null;
  let grainSeed = 0;

  function getGrainCanvas(w, h) {
    if (!grainCanvas || grainCanvas.width !== w || grainCanvas.height !== h) {
      grainCanvas = document.createElement('canvas');
      grainCanvas.width = w;
      grainCanvas.height = h;
    }
    // Regenerate grain pattern periodically for subtle animation
    const now = Date.now();
    if (now - grainSeed > 100) {
      grainSeed = now;
      const ctx = grainCanvas.getContext('2d');
      const imgData = ctx.createImageData(w, h);
      const d = imgData.data;
      // Sparse grain: only set ~8% of pixels for performance
      const step = 4; // check every 4th pixel
      for (let i = 0; i < d.length; i += 4 * step) {
        const v = Math.random() * 255;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
        d[i + 3] = Math.random() < 0.08 ? Math.floor(Math.random() * 80) : 0;
      }
      ctx.putImageData(imgData, 0, 0);
    }
    return grainCanvas;
  }

  function layerProgress(zoom, start, end) {
    if (zoom <= start) return 0;
    if (zoom >= end) return 1;
    return (zoom - start) / (end - start);
  }

  // --- Draw skull overlay (image-based, face-tracked) ---
  function drawSkullOverlay(ctx, cx, cy, skullW, skullH, alpha) {
    if (!skullImg.complete || !skullImg.naturalWidth) return;
    ctx.save();
    // Ghost-like transparency
    ctx.globalAlpha = alpha * 0.25;
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(skullImg, cx - skullW / 2, cy - skullH / 2, skullW, skullH);
    ctx.restore();
  }

  // --- Draw brain overlay (image-based, face-tracked) ---
  function drawBrainOverlay(ctx, cx, cy, brainW, brainH, alpha) {
    if (!brainImg.complete || !brainImg.naturalWidth) return;
    ctx.save();
    // Ghost-like transparency
    ctx.globalAlpha = alpha * 0.2;
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(brainImg, cx - brainW / 2, cy - brainH / 2, brainW, brainH);
    // Pulsing highlight (subtle animated glow)
    var pulseT = Date.now() * 0.002;
    var pulseAlpha = (Math.sin(pulseT) * 0.5 + 0.5) * alpha * 0.05;
    var pulseGrad = ctx.createRadialGradient(cx, cy - brainH * 0.1, 0, cx, cy - brainH * 0.1, brainW * 0.5);
    pulseGrad.addColorStop(0, 'rgba(0, 255, 255, ' + pulseAlpha + ')');
    pulseGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = pulseGrad;
    ctx.fillRect(cx - brainW, cy - brainH, brainW * 2, brainH * 2);
    ctx.restore();
  }

  // --- Scan lines overlay ---
  function drawScanLines(ctx, cw, ch, alpha) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha * 0.12;
    ctx.strokeStyle = 'rgba(200, 220, 240, 0.3)';
    ctx.lineWidth = 1;
    const spacing = 4;
    for (let y = 0; y < ch; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function renderXrayEffect(drawX, drawY, scale, cw, ch) {
    if (!secretWord || !capturedImage) return;

    const supportsFilter = typeof zoomCtx.filter === 'string';
    const iw = capturedImage.width;
    const ih = capturedImage.height;
    const drawW = iw * scale;
    const drawH = ih * scale;

    // Face position in screen coords
    const facePosX = wordEmbedPosition ? wordEmbedPosition.x : iw / 2;
    const facePosY = wordEmbedPosition ? wordEmbedPosition.y : ih / 2;
    const faceScreenX = drawX + facePosX * scale;
    const faceScreenY = drawY + facePosY * scale;

    // Skull/brain size scales with zoom (sized to fill the face guide circle)
    const faceSize = Math.min(iw, ih) * 0.5 * scale;
    const skullW = faceSize * 1.3;
    const skullH = faceSize * 1.35;
    const brainW = faceSize * 0.9;
    const brainH = faceSize * 0.7;

    // Layer progress values (0-1 each)
    const p1 = layerProgress(viewerZoom, XRAY_L1_START, XRAY_L1_END); // skin desat
    const p2 = layerProgress(viewerZoom, XRAY_L2_START, XRAY_L2_END); // tissue
    const p3 = layerProgress(viewerZoom, XRAY_L3_START, XRAY_L3_END); // skull
    const p4 = layerProgress(viewerZoom, XRAY_L4_START, XRAY_L4_END); // brain cavity
    const p5 = layerProgress(viewerZoom, XRAY_L5_START, XRAY_L5_END); // word reveal

    // If no effect yet, bail
    if (p1 <= 0 && p2 <= 0) return;

    // Overall x-ray intensity (for global effects)
    const xrayIntensity = Math.max(p1, p2, p3, p4, p5);

    // ========================================
    // X-RAY FADE-IN: Blue/cyan tint (like an x-ray machine powering on)
    // ========================================
    if (xrayIntensity > 0) {
      // Subtle blue-cyan tint that grows with x-ray intensity
      zoomCtx.save();
      const blueAlpha = Math.min(xrayIntensity * 0.08, 0.08);
      zoomCtx.globalCompositeOperation = 'multiply';
      zoomCtx.globalAlpha = blueAlpha;
      zoomCtx.fillStyle = '#6090d0';
      zoomCtx.fillRect(0, 0, cw, ch);
      zoomCtx.restore();

      // X-ray power-on flicker (subtle random brightness pulses at low zoom)
      if (p1 > 0 && p3 < 0.5) {
        const flickerPhase = Math.sin(Date.now() * 0.008) * 0.5 + Math.sin(Date.now() * 0.013) * 0.3;
        const flickerAlpha = Math.max(0, flickerPhase * 0.06 * (1 - p3));
        if (flickerAlpha > 0.005) {
          zoomCtx.save();
          zoomCtx.globalAlpha = flickerAlpha;
          zoomCtx.fillStyle = '#aaccff';
          zoomCtx.fillRect(0, 0, cw, ch);
          zoomCtx.restore();
        }
      }

      // Radial vignette centered on face (dark edges, bright center)
      const vignetteAlpha = Math.min(xrayIntensity * 0.12, 0.12);
      if (vignetteAlpha > 0.02) {
        const vigRadius = Math.max(cw, ch) * 0.7;
        const grad = zoomCtx.createRadialGradient(
          faceScreenX, faceScreenY, vigRadius * 0.3,
          faceScreenX, faceScreenY, vigRadius
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.7, 'rgba(0,0,10,' + (vignetteAlpha * 0.2) + ')');
        grad.addColorStop(1, 'rgba(0,0,10,' + vignetteAlpha + ')');
        zoomCtx.save();
        zoomCtx.fillStyle = grad;
        zoomCtx.fillRect(0, 0, cw, ch);
        zoomCtx.restore();
      }
    }

    // ========================================
    // LAYER 1: Skin desaturation (1x - 1.3x)
    // Photo goes from color -> desaturated gray
    // ========================================
    if (p1 > 0 && supportsFilter) {
      zoomCtx.save();
      const desat = Math.round(100 - p1 * 40); // 100% -> 60% (very gentle desaturation)
      const darkAmount = p1 * 0.05;
      zoomCtx.globalAlpha = p1 * 0.4;
      zoomCtx.filter = 'saturate(' + desat + '%) brightness(' + Math.round(100 - darkAmount * 100) + '%)';
      zoomCtx.drawImage(capturedImage, drawX, drawY, drawW, drawH);
      zoomCtx.filter = 'none';
      zoomCtx.restore();
    }

    // ========================================
    // LAYER 2: Tissue (1.1x - 1.8x)
    // Dark desaturated gray, contrast boost, "under the skin"
    // ========================================
    if (p2 > 0) {
      // Darken overlay (very subtle)
      zoomCtx.save();
      zoomCtx.globalAlpha = p2 * 0.15;
      zoomCtx.fillStyle = '#060610';
      zoomCtx.fillRect(0, 0, cw, ch);
      zoomCtx.restore();

      // Re-draw photo inverted and desaturated for tissue look
      if (supportsFilter) {
        zoomCtx.save();
        const invertAmt = Math.round(p2 * 40);
        const satAmt = Math.round(100 - p2 * 50);
        const contrastAmt = Math.round(100 + p2 * 30);
        zoomCtx.globalAlpha = p2 * 0.3;
        zoomCtx.filter = 'invert(' + invertAmt + '%) saturate(' + satAmt + '%) contrast(' + contrastAmt + '%) brightness(' + Math.round(100 + p2 * 20) + '%)';
        zoomCtx.drawImage(capturedImage, drawX, drawY, drawW, drawH);
        zoomCtx.filter = 'none';
        zoomCtx.restore();
      }

    }

    // ========================================
    // LAYER 3: Skull (1.5x - 3x)
    // Inverted high-contrast face + drawn skull overlay
    // ========================================
    if (p3 > 0) {
      // X-ray inversion of the photo (subtle, face stays visible)
      if (supportsFilter) {
        zoomCtx.save();
        zoomCtx.globalAlpha = p3 * 0.3;
        zoomCtx.filter = 'invert(50%) saturate(15%) contrast(130%) brightness(120%)';
        zoomCtx.drawImage(capturedImage, drawX, drawY, drawW, drawH);
        zoomCtx.filter = 'none';
        zoomCtx.restore();
      }

      // Darken non-skull areas (very subtle)
      zoomCtx.save();
      zoomCtx.globalAlpha = p3 * 0.12;
      zoomCtx.fillStyle = '#000008';
      zoomCtx.fillRect(0, 0, cw, ch);
      zoomCtx.restore();

      // Drawn skull overlay - face tracked
      drawSkullOverlay(zoomCtx, faceScreenX, faceScreenY, skullW, skullH, p3);

      // Scan lines during skull phase
      drawScanLines(zoomCtx, cw, ch, p3);

    }

    // ========================================
    // LAYER 4: Brain cavity (2.5x - 4x)
    // Skull fades, dark void, brain shape appears
    // ========================================
    if (p4 > 0) {
      // Darkening for brain cavity (subtle)
      zoomCtx.save();
      zoomCtx.globalAlpha = p4 * 0.2;
      zoomCtx.fillStyle = '#010108';
      zoomCtx.fillRect(0, 0, cw, ch);
      zoomCtx.restore();

      // Fading skull (becomes more transparent as brain appears)
      if (p3 > 0) {
        const fadingSkull = Math.max(0, 1 - p4);
        if (fadingSkull > 0) {
          drawSkullOverlay(zoomCtx, faceScreenX, faceScreenY, skullW, skullH, fadingSkull * 0.5);
        }
      }

      // Brain shape appears
      // Position brain slightly above and deeper than face center
      const brainY = faceScreenY - skullH * 0.15;
      drawBrainOverlay(zoomCtx, faceScreenX, brainY, brainW, brainH, p4);

      // Light scan lines
      drawScanLines(zoomCtx, cw, ch, p4 * 0.5);

      // Residual x-ray glow of the face (very faint)
      if (supportsFilter) {
        zoomCtx.save();
        zoomCtx.globalAlpha = (1 - p4) * 0.1;
        zoomCtx.filter = 'invert(90%) saturate(0%) contrast(180%) brightness(80%)';
        zoomCtx.drawImage(capturedImage, drawX, drawY, drawW, drawH);
        zoomCtx.filter = 'none';
        zoomCtx.restore();
      }
    }

    // ========================================
    // LAYER 5: Word reveal (3.5x - 5x)
    // Brain fades, word appears in bone-white with halo glow
    // ========================================
    if (p5 > 0) {
      // Dark backdrop behind word so it stands out clearly
      zoomCtx.save();
      zoomCtx.globalAlpha = p5 * 0.85;
      zoomCtx.fillStyle = '#000';
      zoomCtx.fillRect(0, 0, cw, ch);
      zoomCtx.restore();

      // Fading brain
      if (p4 > 0) {
        const fadingBrain = Math.max(0, 1 - p5);
        if (fadingBrain > 0) {
          const brainY = faceScreenY - skullH * 0.15;
          drawBrainOverlay(zoomCtx, faceScreenX, brainY, brainW, brainH, fadingBrain * p4);
        }
      }

      // Word reveal - crisp canvas text, high contrast
      if (secretWord) {
        const wordCenterX = faceScreenX;
        const wordCenterY = faceScreenY + skullH * 0.05;

        // Font size based on screen width so the whole word always fits in frame
        // Use canvas width and word length to ensure it never overflows
        const maxWidth = cw * 0.7; // word should fit within 70% of screen width
        const fontSize = Math.min(cw * 0.12, maxWidth / (secretWord.length * 0.65));

        // Pass 1: strong glow halo behind text
        zoomCtx.save();
        zoomCtx.globalAlpha = p5 * 0.8;
        zoomCtx.font = 'bold ' + Math.round(fontSize) + 'px Arial, Helvetica, sans-serif';
        zoomCtx.textAlign = 'center';
        zoomCtx.textBaseline = 'middle';
        zoomCtx.shadowColor = '#ffffff';
        zoomCtx.shadowBlur = 40;
        zoomCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        zoomCtx.fillText(secretWord.toUpperCase(), wordCenterX, wordCenterY);
        zoomCtx.fillText(secretWord.toUpperCase(), wordCenterX, wordCenterY);
        zoomCtx.restore();

        // Pass 2: solid white text, full opacity
        zoomCtx.save();
        zoomCtx.globalAlpha = p5;
        zoomCtx.font = 'bold ' + Math.round(fontSize) + 'px Arial, Helvetica, sans-serif';
        zoomCtx.textAlign = 'center';
        zoomCtx.textBaseline = 'middle';
        zoomCtx.fillStyle = '#ffffff';
        zoomCtx.shadowColor = '#ffffff';
        zoomCtx.shadowBlur = 10;
        zoomCtx.fillText(secretWord.toUpperCase(), wordCenterX, wordCenterY);
        zoomCtx.restore();

        // Pass 3: black outline for extra contrast/legibility
        zoomCtx.save();
        zoomCtx.globalAlpha = p5 * 0.9;
        zoomCtx.font = 'bold ' + Math.round(fontSize) + 'px Arial, Helvetica, sans-serif';
        zoomCtx.textAlign = 'center';
        zoomCtx.textBaseline = 'middle';
        zoomCtx.strokeStyle = '#000000';
        zoomCtx.lineWidth = Math.max(1, fontSize * 0.06);
        zoomCtx.strokeText(secretWord.toUpperCase(), wordCenterX, wordCenterY);
        zoomCtx.restore();
      }
    }

    // ========================================
    // Film grain + scan lines overlay (present from the start)
    // ========================================
    const grainIntensity = Math.max(p1 * 0.5, p2, p3, p4) * 0.7;
    if (grainIntensity > 0.01) {
      // Use a smaller grain canvas for performance, tile it
      const grainW = Math.min(cw, 512);
      const grainH = Math.min(ch, 512);
      const grain = getGrainCanvas(grainW, grainH);
      zoomCtx.save();
      zoomCtx.globalAlpha = grainIntensity;
      // Tile grain across canvas
      for (let gx = 0; gx < cw; gx += grainW) {
        for (let gy = 0; gy < ch; gy += grainH) {
          zoomCtx.drawImage(grain, gx, gy);
        }
      }
      zoomCtx.restore();
    }

    // Global scan lines from the start (x-ray film look)
    if (p1 > 0.3) {
      drawScanLines(zoomCtx, cw, ch, Math.min(p1, 0.6));
    }
  }

  function updateZoomIndicator() {
    const displayZoom = viewerZoom.toFixed(1);
    zoomIndicator.textContent = displayZoom + 'x';
    zoomIndicator.classList.add('visible');
    clearTimeout(zoomIndicatorTimer);
    zoomIndicatorTimer = setTimeout(() => {
      zoomIndicator.classList.remove('visible');
    }, 1200);
  }

  // --- Auto-Zoom Animation ---
  function startAutoZoom() {
    if (isAutoZooming) cancelAnimationFrame(autoZoomAnimFrame);
    isAutoZooming = true;

    const cw = zoomCanvas.width;
    const ch = zoomCanvas.height;
    const iw = capturedImage.width;
    const ih = capturedImage.height;
    const baseScale = Math.max(cw / iw, ch / ih);

    const targetPos = wordEmbedPosition || { x: iw / 2, y: ih / 2 };
    const targetZoom = 25;
    const zoomInDuration = 3000;
    const pauseDuration = 1500;
    const zoomOutDuration = 2000;
    const totalDuration = zoomInDuration + pauseDuration + zoomOutDuration;
    const startTime = performance.now();

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function animate(now) {
      if (!isAutoZooming) return;
      const elapsed = now - startTime;
      let currentZoom, blendFactor;

      if (elapsed < zoomInDuration) {
        const p = easeInOutCubic(elapsed / zoomInDuration);
        currentZoom = 1 + (targetZoom - 1) * p;
        blendFactor = p;
      } else if (elapsed < zoomInDuration + pauseDuration) {
        currentZoom = targetZoom;
        blendFactor = 1;
      } else if (elapsed < totalDuration) {
        const p = easeInOutCubic((elapsed - zoomInDuration - pauseDuration) / zoomOutDuration);
        currentZoom = targetZoom - (targetZoom - 1) * p;
        blendFactor = 1 - p;
      } else {
        viewerZoom = 1;
        viewerPanX = 0;
        viewerPanY = 0;
        renderViewer();
        isAutoZooming = false;
        return;
      }

      viewerZoom = currentZoom;
      const currentScale = baseScale * currentZoom;
      viewerPanX = currentScale * (iw / 2 - targetPos.x) * blendFactor;
      viewerPanY = currentScale * (ih / 2 - targetPos.y) * blendFactor;
      renderViewer();
      autoZoomAnimFrame = requestAnimationFrame(animate);
    }

    autoZoomAnimFrame = requestAnimationFrame(animate);
  }

  // --- Touch Handling for Viewer ---
  zoomCanvas.addEventListener('touchstart', onViewerTouchStart, { passive: false });
  zoomCanvas.addEventListener('touchmove', onViewerTouchMove, { passive: false });
  zoomCanvas.addEventListener('touchend', onViewerTouchEnd, { passive: false });

  function onViewerTouchStart(e) {
    e.preventDefault();
    if (isMelting) return;

    // Stop auto-zoom if user touches screen
    if (isAutoZooming) {
      isAutoZooming = false;
      cancelAnimationFrame(autoZoomAnimFrame);
    }

    // Track touch start for tap detection
    if (e.touches.length === 1) {
      viewerTouchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      viewerTouchMoved = false;
    }

    if (e.touches.length === 2) {
      isPinching = true;
      isDragging = false;
      lastTouchDist = getTouchDist(e.touches);
      const mid = getTouchMidpoint(e.touches);
      lastTouchX = mid.x;
      lastTouchY = mid.y;
    } else if (e.touches.length === 1) {
      isDragging = true;
      isPinching = false;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
    }
  }

  function onViewerTouchMove(e) {
    e.preventDefault();
    if (isMelting) return;
    viewerTouchMoved = true;
    const dpr = window.devicePixelRatio || 1;

    if (isPinching && e.touches.length === 2) {
      const dist = getTouchDist(e.touches);
      const mid = getTouchMidpoint(e.touches);

      // Zoom
      const zoomDelta = dist / lastTouchDist;
      const newZoom = Math.max(viewerMinZoom, Math.min(viewerMaxZoom, viewerZoom * zoomDelta));
      viewerZoom = newZoom;

      // Pan while pinching (clamped in renderViewer)
      viewerPanX += (mid.x - lastTouchX) * dpr;
      viewerPanY += (mid.y - lastTouchY) * dpr;

      lastTouchDist = dist;
      lastTouchX = mid.x;
      lastTouchY = mid.y;

      renderViewer();
    } else if (isDragging && e.touches.length === 1) {
      // Single-finger pan (clamped in renderViewer)
      viewerPanX += (e.touches[0].clientX - lastTouchX) * dpr;
      viewerPanY += (e.touches[0].clientY - lastTouchY) * dpr;

      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;

      renderViewer();
    }
  }

  function onViewerTouchEnd(e) {
    if (isMelting) return;

    // Double-tap detection for melt trigger (bottom 40% of screen)
    if (e.touches.length === 0 && !viewerTouchMoved && viewerTouchStartPos) {
      const screenHeight = window.innerHeight;
      if (viewerTouchStartPos.y > screenHeight * 0.6 && viewerZoom < 1.5 && !isAutoZooming) {
        const now = Date.now();
        if (now - lastViewerTapTime < 400) {
          lastViewerTapTime = 0;
          viewerTouchStartPos = null;
          startMeltAnimation();
          return;
        }
        lastViewerTapTime = now;
      }
    }
    viewerTouchStartPos = null;

    if (e.touches.length === 0) {
      isPinching = false;
      isDragging = false;
    } else if (e.touches.length === 1) {
      isPinching = false;
      isDragging = true;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
    }
  }

  function getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getTouchMidpoint(touches) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  }

  // --- Thumbnail opens viewer ---
  thumbnailPreview.addEventListener('click', () => {
    if (!capturedImage || !thumbnailPreview.classList.contains('has-photo')) return;

    viewerZoom = 1;
    viewerPanX = 0;
    viewerPanY = 0;
    isMelting = false;
    meltData = null;
    if (meltAnimFrame) cancelAnimationFrame(meltAnimFrame);

    showScreen(viewerScreen);
    resizeViewerCanvas();
    renderViewer();
  });

  // --- Back Button ---
  backBtn.addEventListener('click', () => {
    isMelting = false;
    meltData = null;
    if (meltAnimFrame) cancelAnimationFrame(meltAnimFrame);
    isAutoZooming = false;
    if (autoZoomAnimFrame) cancelAnimationFrame(autoZoomAnimFrame);
    showScreen(cameraScreen);
  });

  // --- Window Resize ---
  window.addEventListener('resize', () => {
    if (viewerScreen.classList.contains('active')) {
      resizeViewerCanvas();
      renderViewer();
    }
  });

  // --- 5-Tap Rapid Reset ---
  let tapTimestamps = [];
  const TAP_RESET_COUNT = 5;
  const TAP_RESET_WINDOW = 1500; // 5 taps within 1.5 seconds

  document.addEventListener('touchend', (e) => {
    // Only count single-finger taps (not pinch ends)
    if (e.touches.length > 0) return;

    const now = Date.now();
    tapTimestamps.push(now);

    // Keep only recent taps
    tapTimestamps = tapTimestamps.filter(t => now - t < TAP_RESET_WINDOW);

    if (tapTimestamps.length >= TAP_RESET_COUNT) {
      tapTimestamps = [];

      // Stop camera
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
        currentStream = null;
      }

      // Reset state
      secretWord = '';
      capturedImage = null;
      capturedImageData = null;
      cachedWordGrid = null;
      cachedEdgeGrid = null;
      cachedCardGrid = null;

      cardMode = false;
      cardSuit = '';
      cardValue = '';
      xrayMode = false;
      faceGuideCircle.classList.add('hidden');
      viewerZoom = 1;
      viewerPanX = 0;
      viewerPanY = 0;
      wordEmbedPosition = null;
      isMelting = false;
      meltData = null;
      if (meltAnimFrame) cancelAnimationFrame(meltAnimFrame);
      isAutoZooming = false;
      if (autoZoomAnimFrame) cancelAnimationFrame(autoZoomAnimFrame);
      thumbnailPreview.style.backgroundImage = '';
      thumbnailPreview.classList.remove('has-photo');
      secretInput.value = '';

      // Resume Inject polling if enabled
      if (injectEnabled && injectId) {
        startInjectPolling(injectId);
      }

      // Go back to secret word screen
      showScreen(secretScreen);
    }
  });

  // --- Melt Animation ---
  function startMeltAnimation() {
    isMelting = true;
    isAutoZooming = false;

    const cw = zoomCanvas.width;
    const ch = zoomCanvas.height;

    // Ensure at zoom 1 for the melt source
    viewerZoom = 1;
    viewerPanX = 0;
    viewerPanY = 0;
    renderViewer();

    // Capture current canvas content
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = cw;
    sourceCanvas.height = ch;
    const sourceCtx = sourceCanvas.getContext('2d');
    sourceCtx.drawImage(zoomCanvas, 0, 0);

    // Build mask and word layer
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = cw;
    maskCanvas.height = ch;
    const maskCtx = maskCanvas.getContext('2d');

    const wordCanvas = document.createElement('canvas');
    wordCanvas.width = cw;
    wordCanvas.height = ch;
    const wordCtx = wordCanvas.getContext('2d');

    if (cardMode && cardSuit && cardValue) {
      // Card mode: render value+suit as pixel art scaled up, same mask approach as word
      const cardGrid = cachedCardGrid || buildCardGrid(cardSuit, cardValue);
      const gridH = cardGrid.length;
      const gridW = cardGrid[0].length;
      const cardScale = Math.floor(Math.min(cw * 0.8 / gridW, ch * 0.4 / gridH));
      const pxW = gridW * cardScale;
      const pxH = gridH * cardScale;
      const offX = Math.floor((cw - pxW) / 2);
      const offY = Math.floor((ch - pxH) / 2);

      // Build mask from pixel grid
      maskCtx.fillStyle = '#fff';
      for (let gy = 0; gy < gridH; gy++) {
        for (let gx = 0; gx < gridW; gx++) {
          if (cardGrid[gy][gx] === 1) {
            maskCtx.fillRect(offX + gx * cardScale, offY + gy * cardScale, cardScale, cardScale);
          }
        }
      }

      // Word portion: photo pixels masked to card shape
      wordCtx.drawImage(maskCanvas, 0, 0);
      wordCtx.globalCompositeOperation = 'source-in';
      wordCtx.drawImage(sourceCanvas, 0, 0);
      wordCtx.globalCompositeOperation = 'source-over';
    } else {
      // Word mode: text mask
      let fontSize = Math.min(cw * 0.12, ch * 0.15);
      maskCtx.font = '900 ' + fontSize + 'px -apple-system, BlinkMacSystemFont, sans-serif';
      let metrics = maskCtx.measureText(secretWord);
      if (metrics.width > cw * 0.85) {
        fontSize *= (cw * 0.85) / metrics.width;
        maskCtx.font = '900 ' + fontSize + 'px -apple-system, BlinkMacSystemFont, sans-serif';
      }
      maskCtx.textAlign = 'center';
      maskCtx.textBaseline = 'middle';
      maskCtx.fillStyle = '#fff';
      maskCtx.fillText(secretWord, cw / 2, ch / 2);

      // Word portion: photo pixels masked to word shape
      wordCtx.drawImage(maskCanvas, 0, 0);
      wordCtx.globalCompositeOperation = 'source-in';
      wordCtx.drawImage(sourceCanvas, 0, 0);
      wordCtx.globalCompositeOperation = 'source-over';
    }

    // Melt portion: photo with reveal area cut out
    const meltSourceCanvas = document.createElement('canvas');
    meltSourceCanvas.width = cw;
    meltSourceCanvas.height = ch;
    const meltSourceCtx = meltSourceCanvas.getContext('2d');
    meltSourceCtx.drawImage(sourceCanvas, 0, 0);
    meltSourceCtx.globalCompositeOperation = 'destination-out';
    meltSourceCtx.drawImage(maskCanvas, 0, 0);
    meltSourceCtx.globalCompositeOperation = 'source-over';

    // Initialize drip columns
    const colWidth = 3;
    const numCols = Math.ceil(cw / colWidth);
    const columns = [];
    for (let i = 0; i < numCols; i++) {
      const distFromCenter = Math.abs(i - numCols / 2) / (numCols / 2);
      columns.push({
        offset: 0,
        velocity: 0,
        delay: (1 - distFromCenter) * 800 + Math.random() * 600,
        gravity: 0.08 + Math.random() * 0.06,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleFreq: 2 + Math.random() * 3,
        wobbleAmp: 2 + Math.random() * 4
      });
    }

    // Trippy particles
    const particles = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * cw,
        y: Math.random() * ch * 0.3 + ch * 0.35,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 3 + 1,
        size: Math.random() * 4 + 1,
        hue: Math.random() * 360,
        life: 1,
        delay: Math.random() * 2500
      });
    }

    meltData = {
      sourceCanvas: sourceCanvas,
      wordCanvas: wordCanvas,
      meltSourceCanvas: meltSourceCanvas,
      columns: columns,
      colWidth: colWidth,
      particles: particles,
      cw: cw,
      ch: ch,
      startTime: performance.now()
    };

    meltAnimFrame = requestAnimationFrame(renderMeltFrame);
  }

  function renderMeltFrame(timestamp) {
    if (!isMelting || !meltData) return;

    const { wordCanvas, meltSourceCanvas, columns, colWidth, particles, cw, ch, startTime } = meltData;
    const elapsed = timestamp - startTime;

    // Clear to black
    zoomCtx.fillStyle = '#000';
    zoomCtx.fillRect(0, 0, cw, ch);

    // Draw melting columns
    let allFallen = true;
    for (let i = 0; i < columns.length; i++) {
      const c = columns[i];
      const x = i * colWidth;

      if (elapsed > c.delay) {
        c.velocity += c.gravity;
        c.offset += c.velocity;

        if (c.offset < ch * 1.5) allFallen = false;

        const t = (elapsed - c.delay) / 1000;
        const wobble = Math.sin(c.wobblePhase + t * c.wobbleFreq) * c.wobbleAmp * Math.min(1, t * 0.5);
        const stretch = 1 + Math.min(c.velocity * 0.008, 0.4);

        // Draw column with stretch and wobble
        zoomCtx.drawImage(
          meltSourceCanvas,
          x, 0, colWidth, ch,
          x + wobble, c.offset, colWidth, ch * stretch
        );
      } else {
        allFallen = false;
        // Column still in place
        zoomCtx.drawImage(meltSourceCanvas, x, 0, colWidth, ch, x, 0, colWidth, ch);
      }
    }

    // Settle phase: once all columns fall, fade effects over 1s to clean word on black
    if (allFallen && !meltData.settleStart) {
      meltData.settleStart = timestamp;
    }

    let fx = 1; // effect intensity: 1 = full trippy, 0 = clean
    if (meltData.settleStart) {
      fx = Math.max(0, 1 - (timestamp - meltData.settleStart) / 1000);
    }

    // Word layer
    const hue = (elapsed * 0.06) % 360;
    const pulse = 0.85 + Math.sin(elapsed * 0.003) * 0.15;
    const breathe = 1 + Math.sin(elapsed * 0.002) * (0.015 * fx);
    const supportsFilter = typeof zoomCtx.filter === 'string';

    // Glow layers (fade out during settle)
    if (fx > 0.01) {
      zoomCtx.save();
      zoomCtx.globalAlpha = (0.15 + Math.sin(elapsed * 0.002) * 0.1) * fx;
      if (supportsFilter) zoomCtx.filter = 'blur(30px) hue-rotate(' + hue + 'deg)';
      zoomCtx.drawImage(wordCanvas, 0, 0);
      zoomCtx.restore();

      zoomCtx.save();
      zoomCtx.globalAlpha = (0.2 + Math.sin(elapsed * 0.004 + 1) * 0.15) * fx;
      if (supportsFilter) zoomCtx.filter = 'blur(12px) hue-rotate(' + (hue + 120) + 'deg) brightness(150%)';
      zoomCtx.drawImage(wordCanvas, 0, 0);
      zoomCtx.restore();
    }

    // Main word layer (effects fade, clean word remains)
    zoomCtx.save();
    if (fx > 0.01 && supportsFilter) {
      zoomCtx.filter = 'hue-rotate(' + (hue * fx) + 'deg) saturate(' + Math.round(100 + 60 * fx) + '%) brightness(' + Math.round(100 + (pulse * 10) * fx) + '%)';
    }
    zoomCtx.translate(cw / 2, ch / 2);
    zoomCtx.scale(breathe, breathe);
    zoomCtx.translate(-cw / 2, -ch / 2);
    zoomCtx.drawImage(wordCanvas, 0, 0);
    zoomCtx.restore();

    // Trippy particles (fade out during settle)
    if (fx > 0.01) {
      for (const p of particles) {
        if (elapsed < p.delay) continue;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life -= 0.002;
        p.hue = (p.hue + 1.5) % 360;

        if (p.life > 0 && p.y < ch + 20) {
          zoomCtx.beginPath();
          zoomCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          zoomCtx.fillStyle = 'hsla(' + p.hue + ', 100%, 65%, ' + (p.life * 0.5 * fx) + ')';
          zoomCtx.fill();
        } else {
          p.x = cw * 0.15 + Math.random() * cw * 0.7;
          p.y = ch * 0.3 + Math.random() * ch * 0.4;
          p.vy = Math.random() * 2 + 0.5;
          p.vx = (Math.random() - 0.5) * 1.5;
          p.life = 0.7 + Math.random() * 0.3;
          p.size = Math.random() * 3 + 1;
        }
      }
    }

    // Keep animating until fully settled
    const settled = meltData.settleStart && (timestamp - meltData.settleStart >= 1200);
    if (!settled) {
      meltAnimFrame = requestAnimationFrame(renderMeltFrame);
    }
  }

  // --- Face Detection Init ---
  if ('FaceDetector' in window) {
    try {
      faceDetector = new FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
    } catch (e) { /* not available */ }
  }

  // --- Service Worker Registration ---
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

})();

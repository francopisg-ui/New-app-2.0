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

  // --- Screen Management ---
  function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
  }

  // --- Secret Word Entry ---
  secretSubmit.addEventListener('click', () => {
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
  injectToggle.addEventListener('click', () => {
    injectEnabled = !injectEnabled;
    injectToggle.classList.toggle('active', injectEnabled);

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
    }
  });

  injectIdInput.addEventListener('input', () => {
    const id = injectIdInput.value.trim();
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

  // --- Camera ---
  async function startCamera() {
    if (currentStream) {
      currentStream.getTracks().forEach(t => t.stop());
    }
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 4032 },
          height: { ideal: 3024 }
        },
        audio: false
      };
      currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraPreview.srcObject = currentStream;

      // Mirror front camera preview
      if (facingMode === 'user') {
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
    cameraPreview.style.opacity = '0';
    await new Promise(r => setTimeout(r, 200));

    facingMode = facingMode === 'environment' ? 'user' : 'environment';
    await startCamera();

    // Wait for new stream to produce a frame before fading in
    await new Promise(resolve => {
      cameraPreview.onplaying = () => {
        cameraPreview.onplaying = null;
        resolve();
      };
      // Fallback in case onplaying doesn't fire
      setTimeout(resolve, 500);
    });

    cameraPreview.style.opacity = '1';
    flipBtn.disabled = false;
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
    capturedImage.onload = () => {
      // Store image data for pixel sampling
      capturedImageData = captureCtx.getImageData(0, 0, w, h);

      // Update thumbnail in bottom-left — stay on camera
      thumbnailPreview.style.backgroundImage = `url(${dataURL})`;
      thumbnailPreview.classList.add('has-photo');
      // Clear overlay caches for new photo
      cachedWordGrid = null;
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

    // Place the word grid at the center of the image
    const centerX = Math.floor(imgW / 2);
    const centerY = Math.floor(imgH / 2);
    const startX = centerX - Math.floor(gridW / 2);
    const startY = centerY - Math.floor(gridH / 2);

    // Get image data to modify
    const imageData = captureCtx.getImageData(0, 0, imgW, imgH);
    const data = imageData.data;

    // Sample colors from the surrounding area for the "on" pixels
    // We'll use contrasting but photo-realistic colors
    // Sample the average color of the center region
    const sampleRadius = 30;
    let avgR = 0, avgG = 0, avgB = 0, count = 0;
    for (let sy = centerY - sampleRadius; sy < centerY + sampleRadius; sy++) {
      for (let sx = centerX - sampleRadius; sx < centerX + sampleRadius; sx++) {
        if (sx >= 0 && sx < imgW && sy >= 0 && sy < imgH) {
          const idx = (sy * imgW + sx) * 4;
          avgR += data[idx];
          avgG += data[idx + 1];
          avgB += data[idx + 2];
          count++;
        }
      }
    }
    avgR = Math.floor(avgR / count);
    avgG = Math.floor(avgG / count);
    avgB = Math.floor(avgB / count);

    // Create contrasting "letter" color — shift enough to be visible when zoomed
    const brightness = (avgR + avgG + avgB) / 3;
    let letterR, letterG, letterB;
    if (brightness > 128) {
      letterR = Math.max(0, avgR - 90);
      letterG = Math.max(0, avgG - 85);
      letterB = Math.max(0, avgB - 80);
    } else {
      letterR = Math.min(255, avgR + 90);
      letterG = Math.min(255, avgG + 85);
      letterB = Math.min(255, avgB + 80);
    }

    // Write the word grid into the image
    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        const px = startX + gx;
        const py = startY + gy;
        if (px >= 0 && px < imgW && py >= 0 && py < imgH) {
          const idx = (py * imgW + px) * 4;
          if (wordGrid[gy][gx] === 1) {
            data[idx] = letterR;
            data[idx + 1] = letterG;
            data[idx + 2] = letterB;
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

    // Overlay secret word — fades in gradually, always at viewport center
    if (viewerZoom >= SECRET_REVEAL_THRESHOLD) {
      const opacity = Math.min(1, (viewerZoom - SECRET_REVEAL_THRESHOLD) / (SECRET_FULL_OPACITY_ZOOM - SECRET_REVEAL_THRESHOLD));
      renderSecretOverlay(drawX, drawY, scale, cw, ch, opacity);
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

  function renderSecretOverlay(drawX, drawY, scale, cw, ch, opacity) {
    if (!secretWord || !capturedImageData) return;

    const iw = capturedImageData.width;
    const ih = capturedImageData.height;

    // Build word grid once and cache
    if (!cachedWordGrid) {
      cachedWordGrid = buildWordGrid(secretWord);
    }
    if (!cachedWordGrid || cachedWordGrid.length === 0) return;

    const gridH = cachedWordGrid.length;
    const gridW = cachedWordGrid[0].length;

    // Place word at the center of the image (matches embedded pixels)
    const imgCenterX = Math.floor(iw / 2);
    const imgCenterY = Math.floor(ih / 2);

    const startX = imgCenterX - Math.floor(gridW / 2);
    const startY = imgCenterY - Math.floor(gridH / 2);

    const data = capturedImageData.data;
    const SHIFT = 160; // strong contrast for legibility
    const gap = scale > 20 ? 1 : 0;
    const outlineSize = Math.max(1, Math.round(scale * 0.25));

    zoomCtx.globalAlpha = opacity;

    // Pass 1: draw dark outline behind each letter pixel for contrast
    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        if (cachedWordGrid[gy][gx] === 1) {
          const px = startX + gx;
          const py = startY + gy;
          if (px >= 0 && px < iw && py >= 0 && py < ih) {
            zoomCtx.fillStyle = 'rgba(0,0,0,0.45)';
            zoomCtx.fillRect(
              drawX + px * scale - outlineSize,
              drawY + py * scale - outlineSize,
              scale + outlineSize * 2,
              scale + outlineSize * 2
            );
          }
        }
      }
    }

    // Pass 2: draw the colored letter pixels on top
    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        if (cachedWordGrid[gy][gx] === 1) {
          const px = startX + gx;
          const py = startY + gy;
          if (px >= 0 && px < iw && py >= 0 && py < ih) {
            const idx = (py * iw + px) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const brightness = (r + g + b) / 3;

            let nr, ng, nb;
            if (brightness > 100) {
              // Darken on light/mid backgrounds — push toward white letters on dark outline
              nr = 255;
              ng = 255;
              nb = 255;
            } else {
              // Lighten on dark backgrounds
              nr = Math.min(255, r + SHIFT);
              ng = Math.min(255, g + SHIFT);
              nb = Math.min(255, b + SHIFT);
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

  function updateZoomIndicator() {
    const displayZoom = viewerZoom.toFixed(1);
    zoomIndicator.textContent = displayZoom + 'x';
    zoomIndicator.classList.add('visible');
    clearTimeout(zoomIndicatorTimer);
    zoomIndicatorTimer = setTimeout(() => {
      zoomIndicator.classList.remove('visible');
    }, 1200);
  }

  // --- Touch Handling for Viewer ---
  zoomCanvas.addEventListener('touchstart', onViewerTouchStart, { passive: false });
  zoomCanvas.addEventListener('touchmove', onViewerTouchMove, { passive: false });
  zoomCanvas.addEventListener('touchend', onViewerTouchEnd, { passive: false });

  function onViewerTouchStart(e) {
    e.preventDefault();

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
    if (e.touches.length === 0) {
      isPinching = false;
      isDragging = false;
    } else if (e.touches.length === 1) {
      // Transition from pinch to single-finger drag
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

    // Reset zoom state
    viewerZoom = 1;
    viewerPanX = 0;
    viewerPanY = 0;

    showScreen(viewerScreen);
    resizeViewerCanvas();
    renderViewer();
  });

  // --- Back Button ---
  backBtn.addEventListener('click', () => {
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
      viewerZoom = 1;
      viewerPanX = 0;
      viewerPanY = 0;
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

  // --- Service Worker Registration ---
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

})();

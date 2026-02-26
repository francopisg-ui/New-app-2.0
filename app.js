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

    // Place word at detected eye position or center of image
    const imgCenterX = wordEmbedPosition ? wordEmbedPosition.x : Math.floor(iw / 2);
    const imgCenterY = wordEmbedPosition ? wordEmbedPosition.y : Math.floor(ih / 2);

    const startX = imgCenterX - Math.floor(gridW / 2);
    const startY = imgCenterY - Math.floor(gridH / 2);

    const data = capturedImageData.data;
    const SHIFT = 65; // moderate shift for blend-in legibility
    const gap = scale > 20 ? 1 : 0;
    const outlineSize = Math.max(1, Math.round(scale * 0.25));

    zoomCtx.globalAlpha = opacity;

    // Helper: average a 3x3 neighborhood around (cx, cy) in the original image
    function avg3x3(cx, cy) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx >= 0 && nx < iw && ny >= 0 && ny < ih) {
            const idx = (ny * iw + nx) * 4;
            rSum += data[idx];
            gSum += data[idx + 1];
            bSum += data[idx + 2];
            count++;
          }
        }
      }
      return {
        r: Math.round(rSum / count),
        g: Math.round(gSum / count),
        b: Math.round(bSum / count)
      };
    }

    // Pass 1: very faint outline behind each letter pixel (subtle hint)
    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        if (cachedWordGrid[gy][gx] === 1) {
          const px = startX + gx;
          const py = startY + gy;
          if (px >= 0 && px < iw && py >= 0 && py < ih) {
            zoomCtx.fillStyle = 'rgba(0,0,0,0.08)';
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

    // Pass 2: draw letter pixels using adaptive shade from 3x3 neighbors
    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        if (cachedWordGrid[gy][gx] === 1) {
          const px = startX + gx;
          const py = startY + gy;
          if (px >= 0 && px < iw && py >= 0 && py < ih) {
            const avg = avg3x3(px, py);
            const brightness = (avg.r + avg.g + avg.b) / 3;

            let nr, ng, nb;
            if (brightness > 128) {
              // Light area — shift slightly darker
              nr = Math.max(0, avg.r - SHIFT);
              ng = Math.max(0, avg.g - SHIFT);
              nb = Math.max(0, avg.b - SHIFT);
            } else {
              // Dark area — shift slightly lighter
              nr = Math.min(255, avg.r + SHIFT);
              ng = Math.min(255, avg.g + SHIFT);
              nb = Math.min(255, avg.b + SHIFT);
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
    startAutoZoom();
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

    // Build word mask using canvas text
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = cw;
    maskCanvas.height = ch;
    const maskCtx = maskCanvas.getContext('2d');
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
    const wordCanvas = document.createElement('canvas');
    wordCanvas.width = cw;
    wordCanvas.height = ch;
    const wordCtx = wordCanvas.getContext('2d');
    wordCtx.drawImage(maskCanvas, 0, 0);
    wordCtx.globalCompositeOperation = 'source-in';
    wordCtx.drawImage(sourceCanvas, 0, 0);
    wordCtx.globalCompositeOperation = 'source-over';

    // Melt portion: photo with word area cut out
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

    // Word layer: trippy effects
    const hue = (elapsed * 0.06) % 360;
    const pulse = 0.85 + Math.sin(elapsed * 0.003) * 0.15;
    const breathe = 1 + Math.sin(elapsed * 0.002) * 0.015;
    const supportsFilter = typeof zoomCtx.filter === 'string';

    // Outer glow layer 1
    zoomCtx.save();
    zoomCtx.globalAlpha = 0.15 + Math.sin(elapsed * 0.002) * 0.1;
    if (supportsFilter) zoomCtx.filter = 'blur(30px) hue-rotate(' + hue + 'deg)';
    zoomCtx.drawImage(wordCanvas, 0, 0);
    zoomCtx.restore();

    // Outer glow layer 2
    zoomCtx.save();
    zoomCtx.globalAlpha = 0.2 + Math.sin(elapsed * 0.004 + 1) * 0.15;
    if (supportsFilter) zoomCtx.filter = 'blur(12px) hue-rotate(' + (hue + 120) + 'deg) brightness(150%)';
    zoomCtx.drawImage(wordCanvas, 0, 0);
    zoomCtx.restore();

    // Main word layer with hue shift and breathing
    zoomCtx.save();
    if (supportsFilter) zoomCtx.filter = 'hue-rotate(' + hue + 'deg) saturate(160%) brightness(' + Math.round(pulse * 110) + '%)';
    zoomCtx.translate(cw / 2, ch / 2);
    zoomCtx.scale(breathe, breathe);
    zoomCtx.translate(-cw / 2, -ch / 2);
    zoomCtx.drawImage(wordCanvas, 0, 0);
    zoomCtx.restore();

    // Trippy particles
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
        zoomCtx.fillStyle = 'hsla(' + p.hue + ', 100%, 65%, ' + (p.life * 0.5) + ')';
        zoomCtx.fill();
      } else {
        // Respawn particle from word area
        p.x = cw * 0.15 + Math.random() * cw * 0.7;
        p.y = ch * 0.3 + Math.random() * ch * 0.4;
        p.vy = Math.random() * 2 + 0.5;
        p.vx = (Math.random() - 0.5) * 1.5;
        p.life = 0.7 + Math.random() * 0.3;
        p.size = Math.random() * 3 + 1;
      }
    }

    if (!allFallen || elapsed < 8000) {
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

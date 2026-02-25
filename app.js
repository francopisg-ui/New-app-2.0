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

  // Secret overlay position lock
  let secretLocked = false;
  let secretLockImgX = 0;
  let secretLockImgY = 0;
  const SECRET_REVEAL_THRESHOLD = 8;
  const SECRET_FULL_OPACITY_ZOOM = 300; // very slow fade from 8x to 300x

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

  // --- Screen Management ---
  function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
  }

  // --- Secret Word Entry ---
  secretSubmit.addEventListener('click', () => {
    const word = secretInput.value.trim();
    if (word.length === 0) return;
    secretWord = word.toUpperCase();
    showScreen(cameraScreen);
    startCamera();
  });

  secretInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      secretSubmit.click();
    }
  });

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
    } catch (err) {
      console.error('Camera error:', err);
      alert('Camera access is required for this app. Please allow camera access and reload.');
    }
  }

  // Flip camera
  flipBtn.addEventListener('click', () => {
    facingMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera();
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
    captureCtx.drawImage(video, 0, 0, w, h);

    // Create image from canvas
    const dataURL = captureCanvas.toDataURL('image/jpeg', 0.95);
    capturedImage = new Image();
    capturedImage.onload = () => {
      // Store image data for pixel sampling
      capturedImageData = captureCtx.getImageData(0, 0, w, h);

      // Update thumbnail in bottom-left — stay on camera
      thumbnailPreview.style.backgroundImage = `url(${dataURL})`;
      thumbnailPreview.classList.add('has-photo');
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

    // Create contrasting "letter" color — shift the hue
    // Make letter pixels slightly different but still look natural
    const brightness = (avgR + avgG + avgB) / 3;
    let letterR, letterG, letterB;
    if (brightness > 128) {
      // Dark region for letters on light background
      letterR = Math.max(0, avgR - 60);
      letterG = Math.max(0, avgG - 55);
      letterB = Math.max(0, avgB - 50);
    } else {
      // Light region for letters on dark background
      letterR = Math.min(255, avgR + 60);
      letterG = Math.min(255, avgG + 55);
      letterB = Math.min(255, avgB + 50);
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
    zoomCanvas.width = window.innerWidth * window.devicePixelRatio;
    zoomCanvas.height = window.innerHeight * window.devicePixelRatio;
    zoomCanvas.style.width = window.innerWidth + 'px';
    zoomCanvas.style.height = window.innerHeight + 'px';
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

    // Center of the image in canvas coords
    const cx = cw / 2 + viewerPanX * window.devicePixelRatio;
    const cy = ch / 2 + viewerPanY * window.devicePixelRatio;

    const drawW = iw * scale;
    const drawH = ih * scale;
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

    // Overlay secret word — fades in gradually past threshold, locks position
    if (viewerZoom >= SECRET_REVEAL_THRESHOLD) {
      // Lock position on first crossing
      if (!secretLocked) {
        secretLocked = true;
        secretLockImgX = Math.floor((cw / 2 - drawX) / scale);
        secretLockImgY = Math.floor((ch / 2 - drawY) / scale);
      }
      // Gradual fade: 0 at threshold, 1 at full opacity zoom
      const opacity = Math.min(1, (viewerZoom - SECRET_REVEAL_THRESHOLD) / (SECRET_FULL_OPACITY_ZOOM - SECRET_REVEAL_THRESHOLD));
      renderSecretOverlay(drawX, drawY, scale, cw, ch, opacity);
    } else {
      // Unlock when zoomed back out
      secretLocked = false;
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

  function renderSecretOverlay(drawX, drawY, scale, cw, ch, opacity) {
    if (!secretWord || !capturedImageData) return;

    const iw = capturedImageData.width;
    const ih = capturedImageData.height;
    const data = capturedImageData.data;

    const wordGrid = buildWordGrid(secretWord);
    if (!wordGrid || wordGrid.length === 0) return;

    const gridH = wordGrid.length;
    const gridW = wordGrid[0].length;

    // Use the locked position (fixed in image space)
    const imgCenterX = secretLockImgX;
    const imgCenterY = secretLockImgY;

    // Position word grid centered on the locked point
    const startX = imgCenterX - Math.floor(gridW / 2);
    const startY = imgCenterY - Math.floor(gridH / 2);

    // Sample colors from the area around the word to pick a contrasting color
    const sampleRadius = 15;
    let avgR = 0, avgG = 0, avgB = 0, count = 0;
    for (let sy = imgCenterY - sampleRadius; sy < imgCenterY + sampleRadius; sy++) {
      for (let sx = imgCenterX - sampleRadius; sx < imgCenterX + sampleRadius; sx++) {
        if (sx >= 0 && sx < iw && sy >= 0 && sy < ih) {
          const idx = (sy * iw + sx) * 4;
          avgR += data[idx];
          avgG += data[idx + 1];
          avgB += data[idx + 2];
          count++;
        }
      }
    }
    if (count === 0) return;
    avgR = Math.floor(avgR / count);
    avgG = Math.floor(avgG / count);
    avgB = Math.floor(avgB / count);

    const brightness = (avgR + avgG + avgB) / 3;
    let letterR, letterG, letterB;
    if (brightness > 128) {
      letterR = Math.max(0, avgR - 105);
      letterG = Math.max(0, avgG - 100);
      letterB = Math.max(0, avgB - 95);
    } else {
      letterR = Math.min(255, avgR + 105);
      letterG = Math.min(255, avgG + 100);
      letterB = Math.min(255, avgB + 95);
    }

    const gap = scale > 20 ? 1 : 0;

    // Apply gradual fade-in
    zoomCtx.globalAlpha = opacity;

    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        if (wordGrid[gy][gx] === 1) {
          const px = startX + gx;
          const py = startY + gy;
          if (px >= 0 && px < iw && py >= 0 && py < ih) {
            zoomCtx.fillStyle = `rgb(${letterR},${letterG},${letterB})`;
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

    // Restore full opacity for other rendering
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
    touchStartTime = Date.now();

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

    if (isPinching && e.touches.length === 2) {
      const dist = getTouchDist(e.touches);
      const mid = getTouchMidpoint(e.touches);

      // Zoom
      const zoomDelta = dist / lastTouchDist;
      const newZoom = viewerZoom * zoomDelta;
      viewerZoom = Math.max(viewerMinZoom, Math.min(viewerMaxZoom, newZoom));

      // Pan while pinching
      viewerPanX += mid.x - lastTouchX;
      viewerPanY += mid.y - lastTouchY;

      lastTouchDist = dist;
      lastTouchX = mid.x;
      lastTouchY = mid.y;

      renderViewer();
    } else if (isDragging && e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastTouchX;
      const dy = e.touches[0].clientY - lastTouchY;

      viewerPanX += dx;
      viewerPanY += dy;

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

    // Reset zoom and overlay state
    viewerZoom = 1;
    viewerPanX = 0;
    viewerPanY = 0;
    secretLocked = false;

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
      viewerZoom = 1;
      viewerPanX = 0;
      viewerPanY = 0;
      thumbnailPreview.style.backgroundImage = '';
      thumbnailPreview.classList.remove('has-photo');
      secretInput.value = '';

      // Go back to secret word screen
      showScreen(secretScreen);
    }
  });

  // --- Service Worker Registration ---
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

})();

const API_URL = 'http://localhost:5000/api';

// State
let currentUser = null;
let videoData = null;

// DOM Elements
const notLoggedIn = document.getElementById('not-logged-in');
const mainContent = document.getElementById('main-content');
const loginBtn = document.getElementById('login-btn');
const captureBtn = document.getElementById('capture-btn');
const creditsValue = document.getElementById('credits-value');
const detectionStatus = document.getElementById('detection-status');
const videoFound = document.getElementById('video-found');
const noVideo = document.getElementById('no-video');
const statusContainer = document.getElementById('status-container');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  await detectVideo();
});

// Check Authentication
async function checkAuth() {
  try {
    const response = await fetch(`${API_URL}/auth/verify`, {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      showMainContent();
      updateCredits(currentUser.credits);
    } else {
      showNotLoggedIn();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    showNotLoggedIn();
  }
}

// Detect Video on Current Tab
async function detectVideo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { action: 'detectVideo' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        showNoVideo();
        return;
      }

      if (response && response.hasVideo) {
        videoData = response;
        showVideoFound(response);
      } else {
        showNoVideo();
      }
    });
  } catch (error) {
    console.error('Video detection failed:', error);
    showNoVideo();
  }
}

// Capture Frame
captureBtn.addEventListener('click', async () => {
  if (!currentUser) {
    showStatus('Please login first', 'error');
    return;
  }

  const model = document.querySelector('input[name="model"]:checked').value;
  const requiredCredits = model === 'premium' ? 10 : 5;

  if (currentUser.credits < requiredCredits) {
    showStatus(`Insufficient credits. Need ${requiredCredits} credits.`, 'error');
    return;
  }

  try {
    captureBtn.disabled = true;
    captureBtn.innerHTML = `
      <div class="spinner-small"></div>
      Capturing...
    `;

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Capture the visible tab
    const screenshot = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    });

    // Send to backend
    const response = await fetch(`${API_URL}/thumbnail/upload-frame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        frameData: screenshot,
        videoUrl: videoData.url,
        videoTitle: videoData.title,
        model: model,
        autoEnhance: document.getElementById('auto-enhance').checked
      })
    });

    const data = await response.json();

    if (response.ok) {
      showStatus('✅ Thumbnail created successfully!', 'success');
      updateCredits(data.creditsRemaining);
      
      // Open thumbnail in new tab
      setTimeout(() => {
        window.open(`http://localhost:5173/community`, '_blank');
      }, 1500);
    } else {
      throw new Error(data.error || 'Failed to create thumbnail');
    }

  } catch (error) {
    console.error('Capture failed:', error);
    showStatus(`❌ ${error.message}`, 'error');
  } finally {
    captureBtn.disabled = false;
    captureBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      Capture Frame
    `;
  }
});

// Login Button
loginBtn.addEventListener('click', () => {
  window.open('http://localhost:5173/login', '_blank');
});

// UI Functions
function showNotLoggedIn() {
  notLoggedIn.classList.remove('hidden');
  mainContent.classList.add('hidden');
}

function showMainContent() {
  notLoggedIn.classList.add('hidden');
  mainContent.classList.remove('hidden');
}

function showVideoFound(data) {
  detectionStatus.classList.add('hidden');
  videoFound.classList.remove('hidden');
  noVideo.classList.add('hidden');

  document.getElementById('video-title').textContent = data.title || 'Video detected';
  document.getElementById('video-url').textContent = new URL(data.url).hostname;

  // Show preview if available
  if (data.thumbnail) {
    document.getElementById('video-preview').innerHTML = `
      <img src="${data.thumbnail}" alt="Video preview">
    `;
  }
}

function showNoVideo() {
  detectionStatus.classList.add('hidden');
  videoFound.classList.add('hidden');
  noVideo.classList.remove('hidden');
}

function updateCredits(credits) {
  creditsValue.textContent = credits;
}

function showStatus(message, type = 'info') {
  const status = document.createElement('div');
  status.className = `status-message status-${type}`;
  status.textContent = message;
  
  statusContainer.innerHTML = '';
  statusContainer.appendChild(status);

  setTimeout(() => {
    status.remove();
  }, 5000);
}
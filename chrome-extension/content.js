// Detect video on page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'detectVideo') {
    const videoData = detectVideoOnPage();
    sendResponse(videoData);
  }
  return true;
});

function detectVideoOnPage() {
  // Check for video elements
  const videoElement = document.querySelector('video');
  
  if (videoElement) {
    const videoData = {
      hasVideo: true,
      url: window.location.href,
      title: document.title,
      thumbnail: null,
      videoElement: true
    };

    // YouTube specific
    if (window.location.hostname.includes('youtube.com')) {
      const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer') || 
                          document.querySelector('h1.title');
      if (titleElement) {
        videoData.title = titleElement.textContent.trim();
      }

      // Get YouTube thumbnail
      const videoId = new URLSearchParams(window.location.search).get('v');
      if (videoId) {
        videoData.thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }

    // Vimeo specific
    if (window.location.hostname.includes('vimeo.com')) {
      const titleElement = document.querySelector('.player-title');
      if (titleElement) {
        videoData.title = titleElement.textContent.trim();
      }
    }

    return videoData;
  }

  return { hasVideo: false };
}

// Add visual indicator when extension is active
function addIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'thumblify-indicator';
  indicator.innerHTML = `
    <div style="
      position: fixed;
      top: 10px;
      right: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      z-index: 999999;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 8px;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      Thumblify Active
    </div>
  `;
  document.body.appendChild(indicator);

  // Remove after 3 seconds
  setTimeout(() => {
    indicator.remove();
  }, 5173);
}

// Show indicator when video is detected
if (detectVideoOnPage().hasVideo) {
  addIndicator();
}
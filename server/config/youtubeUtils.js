import axios from 'axios';

/**
 * Extract video ID from YouTube URL
 * Added .trim() and updated regex to handle whitespace and extra params
 */
export function extractVideoId(url) {
  if (!url) return null;
  
  // Clean the URL of trailing spaces or hidden characters
  const cleanUrl = url.trim();

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#\s]+)/,
    /^[a-zA-Z0-9_-]{11}$/
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      // If it's the second pattern (direct ID), return match[0], else match[1]
      const id = match[1] || match[0];
      if (id.length === 11) return id;
    }
  }
  
  return null;
}

/**
 * Updated to return the highest quality URL by default
 */
export function getYouTubeThumbnail(videoId) {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/**
 * Download thumbnail as base64 with FALLBACK logic
 * This prevents the 404 error by trying lower resolutions if HD is missing
 */
export async function downloadThumbnailAsBase64(videoId) {
  // Ordered list of quality levels: Max Res -> Standard -> High Qual -> Medium Qual
  const qualities = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault'];
  
  for (const quality of qualities) {
    const url = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 5000 // 5 second timeout
      });

      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      const mimeType = response.headers['content-type'] || 'image/jpeg';
      
      console.log(`✅ Successfully downloaded thumbnail: ${quality}`);
      return `data:${mimeType};base64,${base64}`;
      
    } catch (error) {
      // If 404, just log and continue to the next quality in the array
      console.warn(`⚠️ ${quality} not found for ${videoId}, trying next...`);
      continue;
    }
  }

  throw new Error('Failed to download any YouTube thumbnail version');
}

/**
 * Get video metadata using YouTube oEmbed API
 */
export async function getVideoMetadata(videoId) {
  try {
    const response = await axios.get(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    
    return {
      title: response.data.title,
      author: response.data.author_name,
      thumbnailUrl: response.data.thumbnail_url
    };
  } catch (error) {
    console.error('Error fetching metadata:', error.message);
    // If oEmbed fails, return generic info so the app doesn't crash
    return {
      title: 'YouTube Video',
      author: 'Unknown Creator',
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    };
  }
}
import Replicate from 'replicate';
import dotenv from 'dotenv';

dotenv.config();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Analyze YouTube thumbnail using Replicate's Gemini 2.5 Flash Image
 */
export async function analyzeThumbnail(thumbnailUrl, videoTitle) {
  try {
    console.log('🔍 Analyzing thumbnail with Gemini...');

    const input = {
      image: thumbnailUrl, // Can be URL or base64
      prompt: `You are a YouTube thumbnail expert. Analyze this thumbnail image and provide:

1. **Current Elements**: What's in the thumbnail (colors, text, subjects, composition)
2. **Strengths**: What works well
3. **Weaknesses**: What could be improved
4. **Improvement Suggestions**: Specific changes to make it more clickable
5. **AI Generation Prompt**: A detailed, creative prompt to recreate an IMPROVED version of this thumbnail that will get MORE CLICKS

Video Title: "${videoTitle}"

Focus on making it more eye-catching, professional, and click-worthy while maintaining the core concept.

Respond ONLY in valid JSON format with no markdown:
{
  "analysis": "detailed analysis here",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "improvedPrompt": "detailed creative prompt for AI image generation"
} Add Youtube logo at corner and like ,share,subscribe button graphics.`,
      max_tokens: 2048
    };

    const output = await replicate.run(
      "google/gemini-2.5-flash-image",
      { input }
    );

    console.log('✅ Analysis complete');
    console.log('Raw output:', output);

    // Output is a string, parse it
    let responseText = '';
    
    if (typeof output === 'string') {
      responseText = output;
    } else if (Array.isArray(output)) {
      responseText = output.join('');
    } else if (output.text) {
      responseText = output.text;
    }

    // Clean up response - remove markdown code blocks if present
    responseText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Parse JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }

    // If parsing fails, return a basic structure
    return {
      analysis: responseText,
      strengths: ["Analysis completed"],
      weaknesses: ["Unable to parse detailed analysis"],
      suggestions: ["Review the full analysis"],
      improvedPrompt: `Create an improved version of this thumbnail: ${videoTitle}, make it more eye-catching, vibrant colors, professional quality`
    };

  } catch (error) {
    console.error('Thumbnail analysis error:', error);
    
    // Return fallback analysis
    return {
      analysis: "Analysis unavailable",
      strengths: ["Original thumbnail concept"],
      weaknesses: ["Unable to analyze automatically"],
      suggestions: ["Add bold text", "Use vibrant colors", "Improve composition"],
      improvedPrompt: `YouTube thumbnail: ${videoTitle}, professional, vibrant colors, eye-catching, high quality, bold text`
    };
  }
}

/**
 * Generate improved prompt based on analysis
 */
export function generateImprovedPrompt(analysis, videoTitle, userCustomizations = {}) {
  const {
    style = "Bold & Graphic",
    colorScheme = "vibrant",
    additionalDetails = ""
  } = userCustomizations;

  let prompt = analysis.improvedPrompt || 
    `YouTube thumbnail: ${videoTitle}, professional quality, eye-catching`;

  // Add style
  prompt += `, ${style} style`;

  // Add color scheme
  if (colorScheme) {
    prompt += `, ${colorScheme} color scheme`;
  }

  // Add user's additional details
  if (additionalDetails) {
    prompt += `, ${additionalDetails}`;
  }

  // Always add quality modifiers
  prompt += ', high resolution, 4k quality, professional photography';
  prompt += ', Add YouTube logo at corner and like, share, subscribe and bell icon button graphics';

  return prompt;
}
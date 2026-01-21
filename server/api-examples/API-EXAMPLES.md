# Thumbnail Generation API Examples

## Endpoint: `POST /api/thumbnail/generate`

### Headers
```
Content-Type: application/json
Cookie: connect.sid=<your-session-cookie>
```

**Note:** This endpoint requires authentication. Make sure you have an active session (logged in).

---

## Request Body Schema

```json
{
  "title": "string (required)",
  "prompt": "string (optional)",
  "color_scheme": "string (optional)",
  "aspectRatio": "string (optional)",
  "style": "string (optional)",
  "text_overlay": "boolean (optional)",
  "additionalDetails": "string (optional)"
}
```

---

## Field Options

### `color_scheme` (optional)
Available values:
- `"vibrant"`
- `"sunset"`
- `"forest"`
- `"neon"`
- `"purple"`
- `"monochrome"`
- `"ocean"`
- `"pastel"`

**Default:** `"vibrant"`

### `aspectRatio` (optional)
Available values:
- `"16:9"` - Wide (perfect for videos)
- `"1:1"` - Square (perfect for social media)
- `"9:16"` - Tall (perfect for Instagram reels)

**Default:** `"16:9"`

### `style` (optional)
Available values:
- `"Bold & Graphic"`
- `"Tech/Futuristic"`
- `"Minimalist"`
- `"Photorealistic"`
- `"Illustrated"`

**Default:** `"Bold & Graphic"`

### `text_overlay` (optional)
- `true` - Text overlay enabled
- `false` - Text overlay disabled

**Default:** `false`

---

## Example 1: Minimal Request (Only Required Field)

```json
{
  "title": "My Amazing Video Title"
}
```

---

## Example 2: Full Request (All Fields)

```json
{
  "title": "Amazing Tech Review - iPhone 15 Pro",
  "prompt": "A person holding the new iPhone with excitement, modern tech background with glowing effects",
  "color_scheme": "neon",
  "aspectRatio": "16:9",
  "style": "Tech/Futuristic",
  "text_overlay": true,
  "additionalDetails": "Include the product prominently in center, use cyberpunk aesthetic with neon lights"
}
```

---

## Example 3: Bold & Graphic Style

```json
{
  "title": "5 Ways to Master Coding",
  "prompt": "Excited developer at computer, code on screen, dramatic lighting",
  "color_scheme": "vibrant",
  "aspectRatio": "16:9",
  "style": "Bold & Graphic",
  "text_overlay": true,
  "additionalDetails": "Make it eye-catching with bold typography"
}
```

---

## Example 4: Minimalist Style

```json
{
  "title": "Simple Living Guide",
  "prompt": "Clean minimalist design, simple shapes, plenty of white space",
  "color_scheme": "pastel",
  "aspectRatio": "1:1",
  "style": "Minimalist",
  "text_overlay": false,
  "additionalDetails": "Keep it simple and elegant"
}
```

---

## Example 5: Instagram Reel (Vertical)

```json
{
  "title": "Quick Recipe: 30 Second Pasta",
  "prompt": "Delicious pasta dish, food photography, appetizing",
  "color_scheme": "sunset",
  "aspectRatio": "9:16",
  "style": "Photorealistic",
  "text_overlay": true,
  "additionalDetails": "Make food look delicious and appetizing"
}
```

---

## Response Examples

### Success Response (201 - Created)
```json
{
  "message": "Thumbnail created successfully",
  "thumbnail": {
    "_id": "65f1234567890abcdef12345",
    "userId": "65f1234567890abcdef12344",
    "title": "Amazing Tech Review - iPhone 15 Pro",
    "style": "Tech/Futuristic",
    "aspect_ratio": "16:9",
    "color_scheme": "neon",
    "text_overlay": true,
    "isGenerating": true,
    "image_url": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Success Response (200 - Generated)
```json
{
  "message": "Thumbnail generated successfully",
  "thumbnail": {
    "_id": "65f1234567890abcdef12345",
    "userId": "65f1234567890abcdef12344",
    "title": "Amazing Tech Review - iPhone 15 Pro",
    "image_url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/thumbnails/final_thumbnail_1234567890.png",
    "isGenerating": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:31:05.000Z"
  }
}
```

### Error Response (401 - Unauthorized)
```json
{
  "message": "Unauthorized"
}
```

### Error Response (400 - Bad Request)
```json
{
  "message": "Failed to generate thumbnail"
}
```

### Error Response (500 - Server Error)
```json
{
  "message": "Internal server error",
  "error": "Error details here"
}
```

---

## cURL Examples

### Example 1: Basic Request
```bash
curl -X POST http://localhost:5000/api/thumbnail/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your-session-cookie" \
  -d '{
    "title": "My Amazing Video"
  }'
```

### Example 2: Full Request
```bash
curl -X POST http://localhost:5000/api/thumbnail/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your-session-cookie" \
  -d '{
    "title": "Tech Review - iPhone 15",
    "prompt": "Modern tech aesthetic with glowing effects",
    "color_scheme": "neon",
    "aspectRatio": "16:9",
    "style": "Tech/Futuristic",
    "text_overlay": true,
    "additionalDetails": "Make it eye-catching"
  }'
```

---

## Testing with Postman

1. **Method:** POST
2. **URL:** `http://localhost:5000/api/thumbnail/generate`
3. **Headers:**
   - `Content-Type: application/json`
   - `Cookie: connect.sid=<your-session-cookie>`
4. **Body (raw JSON):**
   ```json
   {
     "title": "Test Thumbnail",
     "prompt": "Amazing thumbnail design",
     "color_scheme": "vibrant",
     "aspectRatio": "16:9",
     "style": "Bold & Graphic",
     "text_overlay": true
   }
   ```

---

## Notes

- The API requires an active user session (you must be logged in)
- `userId` is automatically retrieved from the session, no need to include it in the request
- The endpoint first creates a thumbnail record, then generates the image asynchronously
- Generated images are uploaded to Cloudinary and the URL is stored in `image_url`
- Local files are automatically cleaned up after upload

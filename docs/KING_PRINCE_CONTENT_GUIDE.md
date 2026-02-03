# King & Prince Campaign Site - Content Configuration Guide

This guide specifies exactly what values you need to provide in each section to recreate the King & Prince reference site.

## Site Configuration

### General Settings
- **Display Name**: `King & Prince と打ち上げ花火 2025`
- **Internal Name**: `king-and-prince-2025`
- **Slug**: `king-and-prince-2025`
- **Template**: `collectible-campaign`
- **Status**: `published` (when ready)

---

## Section 1: Hero Section

**Section**: `hero`  
**Content Type**: `hero`

### Required Fields:

```json
{
  "title": "King & Prince と打ち上げ花火 2025",
  "subtitle": "King & Princeの音楽と花火がシンクロしたダイナミックエンターテインメント「King & Princeとうちあげ花火2025」。今年はさらにスケールアップし、デビューシングル「シンデレラガール」から8月にリリースされた17thシングル「What We Got ～奇跡は君と～ / I Know」までのKing & Princeのヒット曲に合わせて夜空を埋め尽くす壮大な花火、そして昨年よりもさらに充実のKing & Princeのライブパフォーマンスなど、これまで以上に豪華なエンターテイメントイベントとなっています！",
  "backgroundVideo": "https://your-cdn-url.com/videos/king-prince-fireworks.mp4",
  "backgroundImage": null,
  "ctaText": "チケット購入",
  "ctaLink": "https://ticket-link.com"
}
```

**Notes:**
- `backgroundVideo` OR `backgroundImage` - use video if available, otherwise image
- Video should be MP4 format, optimized for web
- If using image, provide full URL to hosted image
- CTA (Call-to-Action) button is optional but recommended

---

## Section 2: Description Content

**Section**: `description`  
**Content Type**: `richText` (or `text` for simple text)

### Option A: Rich Text (HTML)

```json
{
  "html": "<p>King & Princeとうちあげ花火2025は、音楽と花火が融合した特別なエンターテインメントイベントです。</p><p>詳細な情報や追加の説明文をここに追加できます。</p>"
}
```

### Option B: Plain Text

```json
{
  "text": "King & Princeとうちあげ花火2025は、音楽と花火が融合した特別なエンターテインメントイベントです。詳細な情報や追加の説明文をここに追加できます。"
}
```

**Notes:**
- You can add multiple description content items (they'll be stacked)
- Use `richText` for formatted content with HTML
- Use `text` for simple paragraphs
- Order matters - lower order numbers appear first

---

## Section 3: 3D Collectible Card

**Section**: `cards`  
**Content Type**: `cardManifest`

### Card Image URL

```json
{
  "cardImageUrl": "https://your-cdn-url.com/images/king-prince-card.jpg"
}
```

**Notes:**
- This is the preview/static image of the card
- Should be a high-quality image (recommended: 800x1200px or similar)
- The card will appear on the right side (desktop) or top (mobile)
- Card has a subtle rotation effect and hover animation

### Full Card Manifest (if using 3D card functionality)

If you want the full 3D card experience with LaxxView, you'll need a complete card manifest. This would be stored in the `cardManifests` table separately. The card image URL above is what's used in the generated page.

---

## Section 4: Email Signup Form

**Section**: `signup`  
**Content Type**: `signup`

```json
{
  "enabled": true,
  "placeholder": "メールアドレスを入力",
  "buttonText": "登録"
}
```

**Notes:**
- Set `enabled: false` to hide the signup form
- Placeholder text appears in the email input field
- Button text appears on the submit button
- Form styling matches the site theme (blue button, dark input)

---

## Complete Content Structure Summary

Here's the complete structure you need to create:

### 1. Hero Content (1 item)
- Section: `hero`
- Content Type: `hero`
- Content: `{ title, subtitle, backgroundVideo, ctaText, ctaLink }`
- Order: `0`

### 2. Description Content (1+ items)
- Section: `description`
- Content Type: `richText` or `text`
- Content: `{ html }` or `{ text }`
- Order: `0`, `1`, `2`, etc. (multiple allowed)

### 3. Card Content (1 item)
- Section: `cards`
- Content Type: `cardManifest`
- Content: `{ cardImageUrl }`
- Order: `0`

### 4. Signup Content (1 item)
- Section: `signup`
- Content Type: `signup`
- Content: `{ enabled, placeholder, buttonText }`
- Order: `0`

---

## Assets You'll Need

### Required Assets:
1. **Background Video** (or Image)
   - Format: MP4 (H.264)
   - Recommended: 1920x1080, optimized for web
   - Duration: Loop-friendly (10-30 seconds)
   - File size: Under 10MB if possible

2. **Card Image**
   - Format: JPG or PNG
   - Recommended: 800x1200px (portrait orientation)
   - High quality, suitable for display

### Optional Assets:
- Additional images for description sections
- Logo or branding images

---

## Visual Layout Reference

Based on the King & Prince reference site:

```
┌─────────────────────────────────────────┐
│  Background Video/Image (full screen)   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Content Container              │   │
│  │                                 │   │
│  │  ┌──────────┐  ┌────────────┐  │   │
│  │  │          │  │ Title      │  │   │
│  │  │  Card    │  │ Subtitle   │  │   │
│  │  │  Image   │  │ Description│  │   │
│  │  │          │  │ CTA Button │  │   │
│  │  │          │  │ Email Form │  │   │
│  │  └──────────┘  └────────────┘  │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Desktop**: Card on right, text on left  
**Mobile**: Card on top, text below

---

## Step-by-Step Setup

1. **Create the Site**
   - Go to `/sites/new`
   - Fill in Display Name, Internal Name, Slug
   - Select `collectible-campaign` template
   - Save

2. **Add Hero Content**
   - Go to Content tab
   - Click "Add Content" → Select "Hero" section
   - Fill in title, subtitle, background video/image URL
   - Add CTA button text and link (optional)
   - Save

3. **Add Description**
   - Click "Add Content" → Select "Description" section
   - Choose Rich Text or Text
   - Enter your description content
   - Save

4. **Add Card**
   - Click "Add Content" → Select "Cards" section
   - Enter card image URL
   - Save

5. **Add Signup Form**
   - Click "Add Content" → Select "Signup" section
   - Enable the form
   - Set placeholder and button text
   - Save

6. **Upload Assets** (if needed)
   - Go to Assets tab
   - Upload background video/image
   - Upload card image
   - Copy URLs and use in content sections

7. **Deploy**
   - Go to Deploy tab
   - Click "Deploy to Vercel"
   - Wait for deployment to complete

---

## Example JSON for API/Testing

If you're creating content via API, here's the complete structure:

```json
{
  "siteId": "your-site-id",
  "content": [
    {
      "section": "hero",
      "contentType": "hero",
      "content": {
        "title": "King & Prince と打ち上げ花火 2025",
        "subtitle": "King & Princeの音楽と花火がシンクロした...",
        "backgroundVideo": "https://cdn.example.com/video.mp4",
        "ctaText": "チケット購入",
        "ctaLink": "https://tickets.example.com"
      },
      "order": 0,
      "isVisible": true
    },
    {
      "section": "description",
      "contentType": "richText",
      "content": {
        "html": "<p>Your description here...</p>"
      },
      "order": 0,
      "isVisible": true
    },
    {
      "section": "cards",
      "contentType": "cardManifest",
      "content": {
        "cardImageUrl": "https://cdn.example.com/card.jpg"
      },
      "order": 0,
      "isVisible": true
    },
    {
      "section": "signup",
      "contentType": "signup",
      "content": {
        "enabled": true,
        "placeholder": "メールアドレスを入力",
        "buttonText": "登録"
      },
      "order": 0,
      "isVisible": true
    }
  ]
}
```

---

## Tips

1. **Video Background**: Use a looping video for best effect. Keep file size reasonable for fast loading.

2. **Card Image**: Use a high-quality image. The card will have a subtle rotation effect.

3. **Responsive Design**: The layout automatically adapts:
   - Desktop: Side-by-side (card right, text left)
   - Mobile: Stacked (card top, text bottom)

4. **Content Order**: Use the `order` field to control display order within each section.

5. **Visibility**: Set `isVisible: false` to hide content without deleting it.

---

## Troubleshooting

**Card not showing?**
- Check that `cardImageUrl` is a valid, accessible URL
- Verify the image loads in a browser

**Video not playing?**
- Ensure video is MP4 format
- Check URL is accessible (CORS if on different domain)
- Verify video file isn't too large

**Layout looks wrong?**
- Check that content sections are in correct order
- Verify template is set to `collectible-campaign`
- Check browser console for errors

/**
 * Returns a data URL for a test image (SVG rendered as base64).
 * Used for the image print test since we can't bundle binary files easily.
 *
 * The image contains colorful stripes + "Easy Print Test Image" text —
 * enough to verify image printing and color rendering.
 */
export function getTestImageDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <!-- Background -->
  <rect width="800" height="600" fill="#ffffff"/>

  <!-- Color stripes -->
  <rect x="0"   y="0" width="800" height="100" fill="#E53E3E"/>
  <rect x="0" y="100" width="800" height="100" fill="#DD6B20"/>
  <rect x="0" y="200" width="800" height="100" fill="#ECC94B"/>
  <rect x="0" y="300" width="800" height="100" fill="#38A169"/>
  <rect x="0" y="400" width="800" height="100" fill="#3182CE"/>
  <rect x="0" y="500" width="800" height="100" fill="#805AD5"/>

  <!-- White overlay panel -->
  <rect x="100" y="150" width="600" height="300" rx="16" fill="white" opacity="0.92"/>

  <!-- Title -->
  <text x="400" y="250" font-family="-apple-system, sans-serif" font-size="36"
        font-weight="900" fill="#1a202c" text-anchor="middle" letter-spacing="-1">
    Easy Print
  </text>
  <text x="400" y="300" font-family="-apple-system, sans-serif" font-size="20"
        font-weight="600" fill="#4a5568" text-anchor="middle">
    Test Image
  </text>
  <text x="400" y="345" font-family="-apple-system, sans-serif" font-size="13"
        fill="#718096" text-anchor="middle">
    If you see this image clearly, image printing is working correctly.
  </text>
  <text x="400" y="375" font-family="-apple-system, sans-serif" font-size="13"
        fill="#718096" text-anchor="middle">
    Check that the color stripes above are rendered in the correct colors.
  </text>

  <!-- Color label row -->
  ${[
    { x: 70, color: '#E53E3E', label: 'Red' },
    { x: 195, color: '#DD6B20', label: 'Orange' },
    { x: 320, color: '#ECC94B', label: 'Yellow' },
    { x: 445, color: '#38A169', label: 'Green' },
    { x: 570, color: '#3182CE', label: 'Blue' },
    { x: 695, color: '#805AD5', label: 'Purple' },
  ]
    .map(
      ({ x, color, label }) =>
        `<rect x="${x - 30}" y="420" width="60" height="16" rx="4" fill="${color}"/>
   <text x="${x}" y="452" font-family="sans-serif" font-size="11" fill="${color}" text-anchor="middle" font-weight="700">${label}</text>`
    )
    .join('\n  ')}
</svg>`;

  const encoded = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${encoded}`;
}

/**
 * Generates a print-ready HTML page that displays the test image.
 */
export function imageTestHtml(): string {
  const dataUrl = getTestImageDataUrl();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Easy Print — Image Test</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #ffffff;
      padding: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }
    h1 {
      font-size: 20px;
      font-weight: 800;
      color: #1a202c;
    }
    p {
      font-size: 13px;
      color: #718096;
    }
    img {
      max-width: 100%;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }
    .footer {
      font-size: 11px;
      color: #a0aec0;
    }
  </style>
</head>
<body>
  <h1>Easy Print — Image Print Test</h1>
  <p>Printed at ${new Date().toLocaleString()} · Verify color stripes and text are clear.</p>
  <img src="${dataUrl}" alt="Easy Print Test Image" width="700" />
  <p class="footer">Easy Print Companion App · Image Accuracy Test</p>
</body>
</html>`;
}

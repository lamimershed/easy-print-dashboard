/**
 * Generates a print-ready HTML page with "Hello" displayed in 5 distinct colors.
 * Used to verify that color printing is working correctly in the companion app.
 */
export function colorTestHtml(): string {
  const colors = [
    { name: 'Red', hex: '#E53E3E', bg: '#FFF5F5' },
    { name: 'Blue', hex: '#3182CE', bg: '#EBF8FF' },
    { name: 'Green', hex: '#38A169', bg: '#F0FFF4' },
    { name: 'Orange', hex: '#DD6B20', bg: '#FFFAF0' },
    { name: 'Purple', hex: '#805AD5', bg: '#FAF5FF' },
  ];

  const colorBlocks = colors
    .map(
      (c) => `
    <div class="color-block" style="background:${c.bg}; border-left: 8px solid ${c.hex};">
      <span class="hello-text" style="color:${c.hex};">Hello</span>
      <span class="color-label" style="color:${c.hex};">${c.name}</span>
    </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Easy Print — Color Test</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #ffffff;
      padding: 32px;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 800;
      color: #1a202c;
      letter-spacing: -0.5px;
    }
    .header p {
      font-size: 13px;
      color: #718096;
      margin-top: 4px;
    }
    .color-block {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 24px 32px;
      border-radius: 12px;
      margin-bottom: 16px;
    }
    .hello-text {
      font-size: 72px;
      font-weight: 900;
      line-height: 1;
      letter-spacing: -2px;
    }
    .color-label {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .footer {
      margin-top: 32px;
      text-align: center;
      font-size: 11px;
      color: #a0aec0;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Easy Print — Color Test Page</h1>
    <p>Printed at ${new Date().toLocaleString()} · If colors appear correctly, color printing is working.</p>
  </div>
  ${colorBlocks}
  <div class="footer">
    Easy Print Companion App · Color Accuracy Test
  </div>
</body>
</html>`;
}

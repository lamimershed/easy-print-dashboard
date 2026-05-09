/**
 * Generates a 5-page print-ready HTML document.
 * Each page shows "Hello N" with a distinct color band.
 * Used to verify multi-page printing works correctly.
 */
export function multipageTestHtml(): string {
  const pages = [
    { label: 'Hello 1', accent: '#E53E3E', bg: '#FFF5F5', desc: 'Page 1 of 5' },
    { label: 'Hello 2', accent: '#3182CE', bg: '#EBF8FF', desc: 'Page 2 of 5' },
    { label: 'Hello 3', accent: '#38A169', bg: '#F0FFF4', desc: 'Page 3 of 5' },
    { label: 'Hello 4', accent: '#DD6B20', bg: '#FFFAF0', desc: 'Page 4 of 5' },
    { label: 'Hello 5', accent: '#805AD5', bg: '#FAF5FF', desc: 'Page 5 of 5' },
  ];

  const pageBlocks = pages
    .map(
      (p, i) => `
  <div class="page" style="background:${p.bg};">
    <div class="page-band" style="background:${p.accent};"></div>
    <div class="page-content">
      <div class="page-number" style="color:${p.accent};">${p.desc}</div>
      <div class="hello-label" style="color:${p.accent};">${p.label}</div>
      <p class="page-hint">Multi-page print test · Easy Print Companion App</p>
    </div>
    ${i < pages.length - 1 ? '<div class="break"></div>' : ''}
  </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Easy Print — Multi-Page Test</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #ffffff;
    }
    .page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .page-band {
      height: 24px;
      width: 100%;
    }
    .page-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }
    .page-number {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 24px;
      opacity: 0.7;
    }
    .hello-label {
      font-size: 120px;
      font-weight: 900;
      line-height: 1;
      letter-spacing: -4px;
    }
    .page-hint {
      margin-top: 32px;
      font-size: 12px;
      color: #a0aec0;
      letter-spacing: 1px;
    }
    .break {
      page-break-after: always;
    }
    @media print {
      .page { min-height: 100vh; }
    }
  </style>
</head>
<body>
  ${pageBlocks}
</body>
</html>`;
}

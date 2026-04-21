/**
 * Utilities for printing inside the Electron companion app.
 * When running in a browser the functions gracefully fall back to
 * the standard browser print dialog.
 */

/** Returns true only when the page is loaded inside the Electron companion app. */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron === true;
}

/**
 * Print an HTML string.
 *
 * - **Electron**: sends the HTML to the main process via IPC for silent
 *   printing to the default (or specified) printer — no dialog shown.
 * - **Browser**: opens a hidden window, writes the HTML, and triggers
 *   the browser's native print dialog as a fallback.
 *
 * @returns `true` on success, `false` on failure.
 */
export async function printHtml(html: string, printerName?: string): Promise<boolean> {
  if (isElectron()) {
    const result = await window.electronAPI!.print({ html, printerName });
    return result.success;
  }

  // Browser fallback — opens a transient window and triggers the print dialog
  const win = window.open('', '_blank', 'width=800,height=600');
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  // Close after a short delay so the dialog has time to open
  setTimeout(() => win.close(), 500);
  return true;
}

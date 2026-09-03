/**
 * Backend base URL.
 *
 * When `VITE_API_BASE_URL` is unset, it is derived from the host the page was
 * served from. A dev machine's LAN address changes with every network it joins,
 * and pinning it in an env file means the app breaks on every WiFi change —
 * deriving it also means a phone loading the page over WiFi reaches the same
 * backend the laptop does, with no extra configuration.
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:${
    import.meta.env.VITE_API_PORT || '8080'
  }`;

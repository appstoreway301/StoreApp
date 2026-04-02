const isTunnel = window.location.hostname.includes('trycloudflare.com');
const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

export function resolveImageUrl(url) {
  if (!url) return url;
  // If it's already an absolute URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // If on tunnel and URL starts with /uploads, prepend backend URL
  if (isTunnel && backendUrl && url.startsWith('/uploads')) {
    return `${backendUrl}${url}`;
  }
  return url;
}

/**
 * Utility to resolve absolute URL when the frontend is running on another domain (e.g., Vercel)
 * but the backend runs in our Cloud Run container workspace.
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const hostname = window.location.hostname;
  
  // If we are not running on localhost and not running on the Cloud Run domain (which contains run.app),
  // we route the API calls back to our active Cloud Run container backend!
  if (hostname && !hostname.includes("localhost") && !hostname.includes("run.app") && !hostname.includes("127.0.0.1")) {
    return `https://ais-dev-2gepmxq22cnalsiqanziyb-284879658295.asia-southeast1.run.app${cleanPath}`;
  }
  
  return cleanPath;
}

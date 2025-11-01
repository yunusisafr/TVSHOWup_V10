export interface FingerprintData {
  fingerprint: string;
  components: {
    userAgent: string;
    language: string;
    colorDepth: number;
    deviceMemory: number;
    hardwareConcurrency: number;
    screenResolution: string;
    timezone: string;
    platform: string;
    vendor: string;
    touchSupport: boolean;
    cookieEnabled: boolean;
  };
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = 200;
    canvas.height = 50;

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Browser Fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Browser Fingerprint', 4, 17);

    return canvas.toDataURL();
  } catch {
    return '';
  }
}

function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';

    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return '';

    const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    return `${vendor}~${renderer}`;
  } catch {
    return '';
  }
}

export async function generateBrowserFingerprint(): Promise<FingerprintData> {
  const components = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    colorDepth: screen.colorDepth,
    deviceMemory: (navigator as any).deviceMemory || 0,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    screenResolution: `${screen.width}x${screen.height}x${screen.pixelRatio || 1}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    platform: navigator.platform,
    vendor: navigator.vendor,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    cookieEnabled: navigator.cookieEnabled,
  };

  const canvasFingerprint = getCanvasFingerprint();
  const webglFingerprint = getWebGLFingerprint();

  const fingerprintString = JSON.stringify({
    ...components,
    canvas: canvasFingerprint,
    webgl: webglFingerprint,
  });

  const fingerprint = await hashString(fingerprintString);

  return {
    fingerprint,
    components,
  };
}

let cachedFingerprint: string | null = null;

export async function getBrowserFingerprint(): Promise<string> {
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  const storedFingerprint = localStorage.getItem('browserFingerprint');
  if (storedFingerprint) {
    cachedFingerprint = storedFingerprint;
    return storedFingerprint;
  }

  const { fingerprint } = await generateBrowserFingerprint();
  localStorage.setItem('browserFingerprint', fingerprint);
  cachedFingerprint = fingerprint;

  console.log('🔐 Generated browser fingerprint:', fingerprint.substring(0, 16) + '...');
  return fingerprint;
}

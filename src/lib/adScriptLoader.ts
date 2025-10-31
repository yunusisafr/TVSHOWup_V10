import { isAuthPage, isAdminRoute } from './utils';

let scriptsLoaded = false;

export const loadGoogleAdScripts = (): void => {
  if (scriptsLoaded) return;
  if (isAuthPage() || isAdminRoute()) return;

  const adsenseScript = document.createElement('script');
  adsenseScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7987903277073573';
  adsenseScript.async = true;
  adsenseScript.crossOrigin = 'anonymous';
  document.head.appendChild(adsenseScript);

  const gptScript = document.createElement('script');
  gptScript.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
  gptScript.async = true;
  document.head.appendChild(gptScript);

  const metaTag = document.createElement('meta');
  metaTag.name = 'google-adsense-account';
  metaTag.content = 'ca-pub-7987903277073573';
  document.head.appendChild(metaTag);

  scriptsLoaded = true;
  console.log('✅ Google Ad scripts loaded');
};

export const shouldLoadAds = (): boolean => {
  return !isAuthPage() && !isAdminRoute();
};

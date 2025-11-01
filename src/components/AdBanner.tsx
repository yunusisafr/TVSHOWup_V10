import React, { useEffect, useState, useRef } from 'react';
import { getAdsByPosition, loadAdUnits } from '../lib/ads';

interface AdBannerProps {
  position: string;
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ position, className = '' }) => {
  const [adUnits, setAdUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRenderedAds, setHasRenderedAds] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAds = async () => {
      await loadAdUnits();
      const ads = getAdsByPosition(position);
      console.log(`📢 AdBanner for position "${position}":`, ads.length > 0 ? `Found ${ads.length} ad(s)` : 'No ads found');
      if (ads.length > 0) {
        console.log('Ad unit details:', ads);
      }
      setAdUnits(ads);
      setIsLoading(false);
    };

    loadAds();
  }, [position]);

  useEffect(() => {
    if (adUnits.length > 0 && !isLoading && containerRef.current) {
      adUnits.forEach((ad) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(ad.ad_code, 'text/html');

        const insElements = doc.querySelectorAll('ins.adsbygoogle');
        insElements.forEach((ins) => {
          const adDiv = document.createElement('div');
          adDiv.className = 'ad-unit my-4';
          adDiv.appendChild(ins.cloneNode(true));
          containerRef.current?.appendChild(adDiv);
        });
      });

      setTimeout(() => {
        try {
          if (window.adsbygoogle) {
            const insElements = containerRef.current?.querySelectorAll('ins.adsbygoogle');
            insElements?.forEach(() => {
              (window.adsbygoogle as any[]).push({});
            });
            console.log(`✅ Initialized ${insElements?.length} AdSense ad(s) for position "${position}"`);
            setHasRenderedAds(true);
          }
        } catch (error) {
          console.error('Error initializing ads:', error);
        }
      }, 100);

      setTimeout(() => {
        if (containerRef.current) {
          const adElements = containerRef.current.querySelectorAll('ins.adsbygoogle');
          let hasContent = false;

          adElements.forEach((adEl) => {
            if (adEl.innerHTML.trim() !== '' || (adEl as HTMLElement).offsetHeight > 0) {
              hasContent = true;
            }
          });

          if (!hasContent) {
            console.log(`⚠️ No ad content rendered for position "${position}", hiding container`);
            setHasRenderedAds(false);
          }
        }
      }, 2000);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [adUnits, isLoading, position]);

  if (isLoading) {
    return null;
  }

  if (adUnits.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`ad-banner-container ${className}`}
      style={{ display: hasRenderedAds ? 'block' : 'none' }}
    />
  );
};

export default AdBanner;

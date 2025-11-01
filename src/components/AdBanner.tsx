import React, { useEffect, useState, useRef } from 'react';
import { getAdsByPosition, loadAdUnits } from '../lib/ads';

interface AdBannerProps {
  position: string;
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ position, className = '' }) => {
  const [adUnits, setAdUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAds = async () => {
      await loadAdUnits();
      const ads = getAdsByPosition(position);
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
          containerRef.current?.appendChild(ins.cloneNode(true));
        });
      });

      setTimeout(() => {
        try {
          if (window.adsbygoogle) {
            const insElements = containerRef.current?.querySelectorAll('ins.adsbygoogle');
            insElements?.forEach(() => {
              (window.adsbygoogle as any[]).push({});
            });
          }
        } catch (error) {
          console.error('Error initializing ads:', error);
        }
      }, 100);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [adUnits, isLoading, position]);

  if (isLoading || adUnits.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={className}
    />
  );
};

export default AdBanner;

import React, { useEffect, useState } from 'react';
import { getAdsByPosition, loadAdUnits } from '../lib/ads';

interface AdBannerProps {
  position: string;
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ position, className = '' }) => {
  const [adUnits, setAdUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    if (adUnits.length > 0 && !isLoading) {
      try {
        if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
          adUnits.forEach(() => {
            (window.adsbygoogle as any[]).push({});
          });
        }
      } catch (error) {
        console.error('Error initializing ads:', error);
      }
    }
  }, [adUnits, isLoading]);

  if (isLoading) {
    console.log(`⏳ AdBanner loading for position "${position}"...`);
    return null;
  }

  if (adUnits.length === 0) {
    console.log(`❌ AdBanner: No ads to display for position "${position}"`);
    return null;
  }

  console.log(`✅ Rendering ${adUnits.length} ad(s) for position "${position}"`);

  return (
    <div className={`ad-banner-container ${className}`}>
      {adUnits.map((ad) => (
        <div
          key={ad.id}
          className="ad-unit my-4"
          dangerouslySetInnerHTML={{ __html: ad.ad_code }}
        />
      ))}
    </div>
  );
};

export default AdBanner;

import { useState, useEffect } from 'react';

/**
 * Custom hook to detect device screen size and capabilities dynamically.
 * Standard breakpoints:
 * - Mobile: < 768px
 * - Tablet: 768px - 1023px
 * - Laptop / Desktop: >= 1024px
 */
export function useDeviceType() {
  const [dimensions, setDimensions] = useState(() => {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
    return { width: 1200, height: 800 };
  });

  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsTouch(
      'ontouchstart' in window ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
    );

    let timeoutId = null;
    const handleResize = () => {
      // Debounce slightly for smooth performance during rapid window resizing
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 60);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const isMobile = dimensions.width < 768;
  const isTablet = dimensions.width >= 768 && dimensions.width < 1024;
  const isLaptop = dimensions.width >= 1024;
  const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'laptop';

  return {
    width: dimensions.width,
    height: dimensions.height,
    isMobile,
    isTablet,
    isLaptop,
    isTouch,
    deviceType,
  };
}

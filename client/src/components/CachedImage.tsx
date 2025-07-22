import React, { useState, useEffect } from 'react';
import { imageCache } from '../utils/imageCache';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallback?: string;
}

const CachedImage: React.FC<CachedImageProps> = ({ src, fallback, ...props }) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);

        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Image load timeout')), 10000);
        });

        const loadPromise = imageCache.getCachedImage(src);
        const cachedUrl = (await Promise.race([loadPromise, timeoutPromise])) as string;

        if (isMounted) {
          clearTimeout(timeoutId);
          setImageSrc(cachedUrl);
        }
      } catch (err) {
        console.error('Failed to load cached image:', err);
        if (isMounted) {
          setError(true);
          setImageSrc(fallback || src);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [src, fallback]);
  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    if (fallback && imageSrc !== fallback) {
      setImageSrc(fallback);
    }
  };

  return (
    <img
      {...props}
      src={imageSrc}
      onLoad={handleLoad}
      onError={handleError}
      style={{
        ...props.style,
        opacity: loading ? 0.7 : 1,
        transition: 'opacity 0.2s ease-in-out',
      }}
    />
  );
};

export default CachedImage;

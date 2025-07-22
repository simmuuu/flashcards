const CACHE_KEY_PREFIX = 'image_cache_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 1 day in milliseconds
const MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB limit per image

class ImageCache {
  private memoryCache = new Map<string, string>();

  private getCacheKey(url: string): string {
    return `${CACHE_KEY_PREFIX}${btoa(url)}`;
  }

  private async storeInIndexedDB(url: string, blob: Blob): Promise<void> {
    try {
      // Check if blob is too large to cache
      if (blob.size > MAX_CACHE_SIZE) {
        console.warn(`Image too large to cache (${blob.size} bytes):`, url);
        return;
      }

      // Convert blob to base64 more efficiently
      const base64 = await this.blobToBase64(blob);

      const cacheData = {
        data: base64,
        type: blob.type,
        timestamp: Date.now(),
        url,
        size: blob.size,
      };

      const dataString = JSON.stringify(cacheData);

      // Check if the data string would exceed localStorage limits (~10MB)
      if (dataString.length > 10 * 1024 * 1024) {
        console.warn('Cache data too large for localStorage:', url);
        return;
      }

      localStorage.setItem(this.getCacheKey(url), dataString);
    } catch (error) {
      console.warn('Failed to cache image in localStorage:', error);
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Remove the data:image/...;base64, prefix
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async getFromIndexedDB(url: string): Promise<string | null> {
    try {
      const cacheKey = this.getCacheKey(url);
      const cached = localStorage.getItem(cacheKey);

      if (!cached) return null;

      const parsedCache = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is expired
      if (now - parsedCache.timestamp > CACHE_TTL) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      // Convert base64 back to blob more efficiently
      const blob = this.base64ToBlob(parsedCache.data, parsedCache.type);
      const objectUrl = URL.createObjectURL(blob);

      // Store in memory cache for quick access
      this.memoryCache.set(url, objectUrl);

      return objectUrl;
    } catch (error) {
      console.warn('Failed to retrieve cached image:', error);
      // Clean up corrupted cache entry
      try {
        localStorage.removeItem(this.getCacheKey(url));
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      return null;
    }
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  async getCachedImage(url: string): Promise<string> {
    try {
      // Check memory cache first
      if (this.memoryCache.has(url)) {
        return this.memoryCache.get(url)!;
      }

      // Check persistent cache
      const cachedUrl = await this.getFromIndexedDB(url);
      if (cachedUrl) {
        return cachedUrl;
      }

      // Fetch and cache the image
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Validate that it's actually an image
      if (!blob.type.startsWith('image/')) {
        console.warn('Fetched resource is not an image:', url, blob.type);
        return url; // Return original URL as fallback
      }

      const objectUrl = URL.createObjectURL(blob);

      // Store in memory cache immediately
      this.memoryCache.set(url, objectUrl);

      // Store in persistent cache (don't await to avoid blocking)
      this.storeInIndexedDB(url, blob).catch(error => {
        console.warn('Failed to store image in persistent cache:', error);
      });

      return objectUrl;
    } catch (error) {
      console.error('Failed to fetch image:', error);
      // Return original URL as fallback
      return url;
    }
  }

  clearCache(): void {
    // Clear memory cache and revoke object URLs
    this.memoryCache.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.memoryCache.clear();

    // Clear persistent cache
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Failed to remove cache key:', key, error);
      }
    });
  }

  getCacheStats(): { memoryEntries: number; persistentEntries: number; estimatedSize: number } {
    let persistentEntries = 0;
    let estimatedSize = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        persistentEntries++;
        try {
          const value = localStorage.getItem(key);
          if (value) {
            estimatedSize += value.length;
          }
        } catch (error) {
          // Ignore individual key errors
        }
      }
    }

    return {
      memoryEntries: this.memoryCache.size,
      persistentEntries,
      estimatedSize,
    };
  }
}

export const imageCache = new ImageCache();

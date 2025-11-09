class APIService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get from cache if available
  getCachedResult(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  // Store in cache
  setCachedResult(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Google Safe Browsing API
  async checkGoogleSafeBrowsing(url) {
    const cacheKey = `safebrowsing-${url}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    // For now, we'll simulate the API response
    // In production, you'd use: https://safebrowsing.googleapis.com/v4/threatMatches:find
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate API response
        const isSuspicious = this.isSuspiciousUrl(url);
        const result = {
          safe: !isSuspicious,
          threats: isSuspicious ? ['SOCIAL_ENGINEERING'] : [],
          api: 'google_safebrowsing'
        };
        
        this.setCachedResult(cacheKey, result);
        resolve(result);
      }, 300);
    });
  }

  // VirusTotal API (simulated - you'd use real API key)
  async checkVirusTotal(url) {
    const cacheKey = `virustotal-${url}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    return new Promise((resolve) => {
      setTimeout(() => {
        const domain = new URL(url).hostname;
        const maliciousScore = Math.random() * 10; // Simulate detection rate
        
        const result = {
          malicious: maliciousScore > 7,
          suspicious: maliciousScore > 5 && maliciousScore <= 7,
          detection_rate: Math.round(maliciousScore),
          api: 'virustotal'
        };
        
        this.setCachedResult(cacheKey, result);
        resolve(result);
      }, 400);
    });
  }

  // IP Quality Score (simulated)
  async checkIPQuality(url) {
    const cacheKey = `ipquality-${url}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    return new Promise((resolve) => {
      setTimeout(() => {
        const domain = new URL(url).hostname;
        const isPhishing = domain.includes('login') || domain.includes('secure');
        const riskScore = Math.random() * 100;
        
        const result = {
          risk_score: Math.round(riskScore),
          phishing: isPhishing,
          malware: riskScore > 80,
          suspicious: riskScore > 60,
          api: 'ipquality'
        };
        
        this.setCachedResult(cacheKey, result);
        resolve(result);
      }, 350);
    });
  }

  // Link Preview API
  async getLinkPreview(url) {
    const cacheKey = `preview-${url}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    try {
      // Using a CORS proxy for demo purposes
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      // Parse the HTML to get basic info
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');
      
      const title = doc.querySelector('title')?.textContent || 'No title';
      const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                         'No description available';
      
      const result = {
        title: title.substring(0, 100) + (title.length > 100 ? '...' : ''),
        description: description.substring(0, 150) + (description.length > 150 ? '...' : ''),
        success: true
      };
      
      this.setCachedResult(cacheKey, result);
      return result;
    } catch (error) {
      return {
        title: 'Unable to fetch preview',
        description: 'Website may be blocking requests',
        success: false
      };
    }
  }

  // Advanced URL analysis
  isSuspiciousUrl(url) {
    const suspiciousPatterns = [
      /bit\.ly/i, /tinyurl\.com/i, /goo\.gl/i, /t\.co/i, /ow\.ly/i,
      /login\./i, /secure\./i, /account\./i, /verify\./i,
      /free.*offer/i, /win.*prize/i, /click.*here/i,
      /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
      /\.(tk|ml|ga|cf)$/i // Suspicious TLDs
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(url));
  }

  // Get favicon URL
  getFaviconUrl(domain) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  }

  // Check if domain is popular (less likely to be malicious)
  isPopularDomain(domain) {
    const popularDomains = [
      'google.com', 'youtube.com', 'facebook.com', 'twitter.com', 'instagram.com',
      'linkedin.com', 'wikipedia.org', 'amazon.com', 'reddit.com', 'netflix.com',
      'microsoft.com', 'apple.com', 'github.com', 'stackoverflow.com', 'medium.com'
    ];
    
    return popularDomains.some(popular => domain.includes(popular));
  }
}

// Create global instance
window.linkContextAPI = new APIService();
console.log('🔗 Link Context: Script started successfully');

// Test if basic DOM operations work
try {
  console.log('🔗 Link Context: Document test:', typeof document, typeof document.body);
  console.log('🔗 Link Context: Event test:', typeof Event, typeof MouseEvent);
} catch (error) {
  console.error('🔗 Link Context: Basic test failed:', error);
}

// Production settings
const CONFIG = {
  HOVER_DELAY: 400,
  MAX_ANALYSES_PER_PAGE: 100,
  CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
};

// Safe error handler access
const errorHandler = (typeof window.linkContextErrorHandler !== 'undefined') 
  ? window.linkContextErrorHandler 
  : { 
      safeAPICall: (fn, fb) => fn().catch(() => fb),
      safeDOMOperation: (fn, fb) => {
        try { return fn(); } catch { return fb; }
      }
    };

class LinkContext {
  constructor() {
    this.preview = null;
    this.currentLink = null;
    this.hoverTimer = null;
    this.settings = {
      showSecurityScore: true,
      linkShortenerWarnings: true,
      httpsWarnings: true,
      apiChecks: true
    };
    
    this.analysisCount = 0;
    this.analysisCache = new Map();
    
    this.init();
  }

  async init() {
    try {
      await this.loadSettings();
      
      // Safe event listener attachment
      this.safeAddEventListener('mouseover', this.handleMouseOver.bind(this));
      this.safeAddEventListener('mouseout', this.handleMouseOut.bind(this));
      this.safeAddEventListener('mousemove', this.handleMouseMove.bind(this));
      
      console.log('🔗 Link Context extension loaded successfully');
    } catch (error) {
      console.error('🔗 Link Context: Initialization failed:', error);
    }
  }

  safeAddEventListener(event, handler) {
    try {
      if (document && document.addEventListener) {
        document.addEventListener(event, handler);
      }
    } catch (error) {
      console.warn(`🔗 Link Context: Failed to add ${event} listener:`, error);
    }
  }

  async loadSettings() {
    return new Promise((resolve) => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
          chrome.storage.sync.get([
            'Show security score',
            'Link shortener warnings', 
            'HTTPS warnings',
            'API checks'
          ], (result) => {
            this.settings = {
              showSecurityScore: result['Show security score'] !== false,
              linkShortenerWarnings: result['Link shortener warnings'] !== false,
              httpsWarnings: result['HTTPS warnings'] !== false,
              apiChecks: result['API checks'] !== false
            };
            resolve();
          });
        } else {
          resolve(); // Use default settings
        }
      } catch (error) {
        console.warn('🔗 Link Context: Settings load failed, using defaults:', error);
        resolve();
      }
    });
  }

handleMouseOver(e) {
  try {
    // Comprehensive null checking
    if (!e || typeof e !== 'object') return;
    if (!e.target || typeof e.target !== 'object') return;
    
    const link = this.findParentLink(e.target);
    if (link && link.href && this.isValidLink(link)) {
      this.currentLink = link;
      this.schedulePreview(link);
    }
  } catch (error) {
    console.warn('🔗 Link Context: Mouseover handler error:', error);
  }
}

handleMouseOut(e) {
  try {
    if (!e || typeof e !== 'object') return;
    
    const relatedTarget = e.relatedTarget;
    if (!this.isInsidePreview(relatedTarget) && !this.isInsideLink(relatedTarget)) {
      this.hidePreview();
    }
  } catch (error) {
    console.warn('🔗 Link Context: Mouseout handler error:', error);
  }
}

handleMouseMove(e) {
  try {
    if (!e || typeof e !== 'object') return;
    if (!this.preview || !this.isElementInDOM(this.preview)) return;
    
    this.positionPreview(e.clientX, e.clientY);
  } catch (error) {
    console.warn('🔗 Link Context: Mousemove handler error:', error);
  }
}

  isElementInDOM(element) {
    try {
      return document.body.contains(element);
    } catch {
      return false;
    }
  }

findParentLink(element) {
  // Comprehensive parameter validation
  if (typeof element === 'undefined' || element === null) {
    return null;
  }
  
  // Check if element is a valid DOM element
  if (typeof element !== 'object' || !('nodeType' in element)) {
    return null;
  }
  
  try {
    let current = element;
    let depth = 0;
    const maxDepth = 25; // Safety limit
    
    while (current && depth < maxDepth) {
      // Check if we've reached the document body
      if (current === document.body) {
        break;
      }
      
      // Safe property checking
      if (current.tagName && 
          typeof current.tagName === 'string' && 
          current.tagName.toUpperCase() === 'A' && 
          current.href) {
        return current;
      }
      
      // Safe parent traversal
      if (current.parentElement && 
          typeof current.parentElement === 'object' && 
          'nodeType' in current.parentElement) {
        current = current.parentElement;
        depth++;
      } else {
        break; // No valid parent
      }
    }
    
    return null;
  } catch (error) {
    console.warn('🔗 Link Context: findParentLink error:', error);
    return null;
  }
}
  isValidLink(link) {
    try {
      const href = link.href.toLowerCase();
      return !href.startsWith('javascript:') && 
             !href.startsWith('mailto:') && 
             !href.startsWith('tel:');
    } catch {
      return false;
    }
  }


isInsidePreview(element) {
  try {
    if (!element) return false;
    
    let current = element;
    let depth = 0;
    const maxDepth = 10;
    
    while (current && depth < maxDepth) {
      if (current.classList && current.classList.contains('link-context-preview')) {
        return true;
      }
      if (current.parentElement) {
        current = current.parentElement;
        depth++;
      } else {
        break;
      }
    }
    return false;
  } catch {
    return false;
  }
}

isInsideLink(element) {
  try {
    if (!element) return false;
    
    let current = element;
    let depth = 0;
    const maxDepth = 10;
    
    while (current && depth < maxDepth) {
      if (current.tagName && current.tagName === 'A' && current.href) {
        return true;
      }
      if (current.parentElement) {
        current = current.parentElement;
        depth++;
      } else {
        break;
      }
    }
    return false;
  } catch {
    return false;
  }
}

  schedulePreview(link) {
    this.hidePreview();
    
    this.hoverTimer = setTimeout(() => {
      this.showPreview(link);
    }, CONFIG.HOVER_DELAY);
  }

  showPreview(link) {
    try {
      this.hidePreview();
      
      const url = new URL(link.href, window.location.origin).href;
      const cachedAnalysis = this.getCachedAnalysis(url);
      
      this.preview = document.createElement('div');
      this.preview.className = 'link-context-preview';
      
      if (cachedAnalysis) {
        this.preview.innerHTML = this.generatePreviewHTML(url, cachedAnalysis);
      } else {
        this.preview.innerHTML = this.generateLoadingHTML(url);
      }
      
      // Safe DOM insertion
      if (document.body) {
        document.body.appendChild(this.preview);
        this.positionPreviewFromLink(link);
        
        requestAnimationFrame(() => {
          if (this.preview) {
            this.preview.classList.add('visible');
          }
        });
        
        // Only analyze if not cached
        if (!cachedAnalysis) {
          this.analyzeLink(url).then(analysis => {
            if (this.preview && this.isElementInDOM(this.preview)) {
              this.safeSetInnerHTML(this.preview, this.generatePreviewHTML(url, analysis));
              this.preview.classList.add('visible');
            }
          }).catch(error => {
            console.error('🔗 Link Context: Analysis error:', error);
            if (this.preview && this.isElementInDOM(this.preview)) {
              this.safeSetInnerHTML(this.preview, this.generateErrorHTML(url, error));
              this.preview.classList.add('visible');
            }
          });
        }
      }
    } catch (error) {
      console.error('🔗 Link Context: Show preview error:', error);
      this.hidePreview();
    }
  }

  safeSetInnerHTML(element, html) {
    try {
      if (element && this.isElementInDOM(element)) {
        element.innerHTML = html;
      }
    } catch (error) {
      console.warn('🔗 Link Context: safeSetInnerHTML failed:', error);
    }
  }

  positionPreviewFromLink(link) {
    try {
      const rect = link.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      const previewWidth = 380;
      const previewHeight = 240;
      
      let x = rect.left;
      let y = rect.bottom + 8;
      
      if (x + previewWidth > viewport.width - 20) {
        x = Math.max(20, viewport.width - previewWidth - 20);
      }
      if (y + previewHeight > viewport.height - 20) {
        y = Math.max(20, rect.top - previewHeight - 8);
      }
      
      if (this.preview) {
        this.preview.style.left = x + 'px';
        this.preview.style.top = y + 'px';
      }
    } catch (error) {
      console.warn('🔗 Link Context: Position preview error:', error);
    }
  }

  positionPreview(x, y) {
    try {
      if (!this.preview || !this.isElementInDOM(this.preview)) return;
      
      const previewRect = this.preview.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      let posX = x + 20;
      let posY = y + 20;
      
      if (posX + previewRect.width > viewport.width - 20) {
        posX = x - previewRect.width - 20;
      }
      if (posY + previewRect.height > viewport.height - 20) {
        posY = y - previewRect.height - 20;
      }
      
      this.preview.style.left = Math.max(20, posX) + 'px';
      this.preview.style.top = Math.max(20, posY) + 'px';
    } catch (error) {
      console.warn('🔗 Link Context: Position preview error:', error);
    }
  }

  hidePreview() {
    try {
      if (this.hoverTimer) {
        clearTimeout(this.hoverTimer);
        this.hoverTimer = null;
      }
      
      if (this.preview && this.isElementInDOM(this.preview)) {
        this.preview.remove();
      }
      this.preview = null;
    } catch (error) {
      console.warn('🔗 Link Context: Hide preview error:', error);
      this.preview = null;
    }
  }

  getCachedAnalysis(url) {
    try {
      const cached = this.analysisCache.get(url);
      if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
        return cached.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  setCachedAnalysis(url, data) {
    try {
      this.analysisCache.set(url, {
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('🔗 Link Context: Cache set error:', error);
    }
  }

  generateLoadingHTML(url) {
    return `
      <div class="link-context-header">
        <div class="link-context-status">Analyzing...</div>
      </div>
      <div class="link-context-loading">
        <div class="loading-spinner"></div>
        <span>Checking link safety...</span>
      </div>
    `;
  }

  generateErrorHTML(url, error) {
    return `
      <div class="link-context-header">
        <div class="link-context-status status-warning">Unable to verify</div>
      </div>
      <div class="link-context-body">
        <div class="link-context-url">
          <span class="url-icon">🔗</span>
          <span>${this.escapeHtml(this.shortenUrl(url))}</span>
        </div>
        <div class="link-context-domain">
          <span>🌐</span>
          <span>${new URL(url).hostname}</span>
        </div>
        <div class="link-context-info">Safety check unavailable</div>
      </div>
    `;
  }

  async analyzeLink(url) {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const domain = new URL(url).hostname;
          const analysis = {
            hasHttps: url.startsWith('https://'),
            isShortener: this.isUrlShortener(domain),
            urlLength: this.getUrlLengthCategory(url.length),
            domainAge: this.estimateDomainAge(domain),
            isPopular: this.isPopularDomain(domain),
            warnings: this.generateAdvancedWarnings(url, domain),
            threatLevel: this.calculateThreatLevel(url, domain)
          };
          
          this.setCachedAnalysis(url, analysis);
          resolve(analysis);
        } catch (error) {
          console.warn('🔗 Link Context: Analysis error:', error);
          // Return safe default analysis
          resolve({
            hasHttps: false,
            isShortener: false,
            urlLength: 'Unknown',
            domainAge: 'Unknown',
            isPopular: false,
            warnings: ['Analysis failed'],
            threatLevel: 2
          });
        }
      }, 300);
    });
  }

  // ... (keep all your existing helper methods the same as before)
  // isUrlShortener, isPopularDomain, generatePreviewHTML, calculateThreatLevel, etc.
  // These methods should remain unchanged from your working Phase 3 version

  isUrlShortener(domain) {
    const shorteners = [
      'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd', 'buff.ly',
      'adf.ly', 'shorte.st', 'bc.vc', 'bit.do', 'cli.re', 'cutt.ly', 'dlvr.it'
    ];
    return shorteners.some(short => domain.includes(short));
  }

  isPopularDomain(domain) {
    const popularDomains = [
      'google.com', 'youtube.com', 'facebook.com', 'twitter.com', 'instagram.com',
      'linkedin.com', 'wikipedia.org', 'amazon.com', 'reddit.com', 'netflix.com',
      'microsoft.com', 'apple.com', 'github.com', 'stackoverflow.com', 'medium.com'
    ];
    return popularDomains.some(popular => domain.includes(popular));
  }

  generatePreviewHTML(url, analysis) {
    const domain = new URL(url).hostname;
    const statusInfo = this.getStatusInfo(analysis);
    const securityScore = this.calculateSecurityScore(analysis);
    
    return `
      <div class="link-context-header">
        <div class="link-context-status ${statusInfo.class}">
          ${statusInfo.icon} ${statusInfo.text}
        </div>
        ${this.settings.showSecurityScore ? `
          <div class="security-score score-${securityScore.level}">
            ⭐ ${securityScore.score}/10
          </div>
        ` : ''}
      </div>
      
      <div class="link-context-body">
        <div class="link-context-url">
          <span class="url-icon">🔗</span>
          <span title="${this.escapeHtml(url)}">${this.escapeHtml(this.shortenUrl(url))}</span>
        </div>
        
        <div class="link-context-domain">
          <span class="domain-favicon">🌐</span>
          <span><strong>Domain:</strong> ${domain}</span>
          ${analysis.isPopular ? '<span class="popular-badge">Popular</span>' : ''}
        </div>
        
        ${analysis.warnings.length > 0 ? `
          <div class="link-context-warnings">
            <div class="warning-header">⚠️ Important Notes</div>
            ${analysis.warnings.map(warning => `<div>• ${warning}</div>`).join('')}
          </div>
        ` : ''}
        
        <div class="link-context-features">
          <div class="feature-item">
            <span class="feature-icon">🔒</span>
            <span>HTTPS: ${analysis.hasHttps ? 'Yes' : 'No'}</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📏</span>
            <span>Length: ${analysis.urlLength}</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">⚡</span>
            <span>Shortener: ${analysis.isShortener ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>
    `;
  }

  calculateThreatLevel(url, domain) {
    let score = 0;
    
    if (!url.startsWith('https://')) score += 2;
    if (this.isUrlShortener(domain)) score += 1;
    if (url.length > 100) score += 1;
    if (domain.split('.').length > 2) score += 1;
    
    return score;
  }

  getStatusInfo(analysis) {
    const threatLevel = analysis.threatLevel;
    
    if (threatLevel === 0) {
      return { class: 'status-safe', icon: '✅', text: 'Very Safe' };
    } else if (threatLevel <= 2) {
      return { class: 'status-safe', icon: '✓', text: 'Safe' };
    } else if (threatLevel <= 4) {
      return { class: 'status-warning', icon: '⚠️', text: 'Caution' };
    } else {
      return { class: 'status-danger', icon: '🚨', text: 'Dangerous' };
    }
  }

  calculateSecurityScore(analysis) {
    let score = 10 - analysis.threatLevel;
    score = Math.max(1, Math.min(10, score));
    
    let level = 'high';
    if (score <= 6) level = 'medium';
    if (score <= 3) level = 'low';
    
    return { score, level };
  }

  shortenUrl(url) {
    if (url.length <= 60) return url;
    return url.substring(0, 40) + '...' + url.substring(url.length - 15);
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  getUrlLengthCategory(length) {
    if (length < 50) return 'Short';
    if (length < 100) return 'Medium';
    return 'Long';
  }

  estimateDomainAge(domain) {
    if (domain.includes('new') || domain.includes('latest')) return 'New';
    if (domain.includes('old') || domain.includes('classic')) return 'Old';
    return 'Unknown';
  }

  generateAdvancedWarnings(url, domain) {
    const warnings = [];
    
    if (this.isUrlShortener(domain)) {
      warnings.push('URL shortener - destination hidden');
    }
    
    if (!url.startsWith('https://')) {
      warnings.push('Connection not encrypted (HTTP)');
    }
    
    if (url.length > 150) {
      warnings.push('Unusually long URL - may contain tracking');
    }
    
    if (domain.includes('login') || domain.includes('signin')) {
      warnings.push('Appears to be a login page');
    }
    
    const suspiciousKeywords = ['free', 'win', 'prize', 'click', 'offer', 'bonus'];
    if (suspiciousKeywords.some(keyword => url.toLowerCase().includes(keyword))) {
      warnings.push('Contains promotional keywords');
    }
    
    return warnings;
  }
}
// Safe initialization with retry logic
function initializeLinkContext() {
  try {
    // Check if DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          try {
            new LinkContext();
            console.log('🔗 Link Context: Initialized on DOMContentLoaded');
          } catch (error) {
            console.error('🔗 Link Context: DOMContentLoaded init failed:', error);
            // Final retry
            setTimeout(() => initializeLinkContext(), 1000);
          }
        }, 100);
      });
    } else {
      // DOM is already ready
      setTimeout(() => {
        try {
          new LinkContext();
          console.log('🔗 Link Context: Initialized on document ready');
        } catch (error) {
          console.error('🔗 Link Context: Direct init failed:', error);
          // Final retry
          setTimeout(() => initializeLinkContext(), 1000);
        }
      }, 100);
    }
  } catch (error) {
    console.error('🔗 Link Context: Initialization wrapper failed:', error);
    
    // Ultimate fallback - try one more time
    setTimeout(() => {
      try {
        new LinkContext();
      } catch (finalError) {
        console.error('🔗 Link Context: All initialization attempts failed:', finalError);
      }
    }, 2000);
  }
}

// Start the extension with maximum safety
if (typeof document !== 'undefined' && document.createElement) {
  initializeLinkContext();
} else {
  console.error('🔗 Link Context: Document not available, extension cannot start');
}``
class ErrorHandler {
  constructor() {
    this.initialized = false;
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    if (this.initialized) return;
    
    try {
      // Catch unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        console.warn('Link Context: Unhandled promise rejection:', event.reason);
      });

      // Catch errors in content script
      window.addEventListener('error', (event) => {
        console.warn('Link Context: Content script error:', event.error);
      });
      
      this.initialized = true;
    } catch (error) {
      console.warn('Link Context: Error handler setup failed:', error);
    }
  }

  async safeAPICall(apiCall, fallback = null) {
    try {
      return await apiCall();
    } catch (error) {
      console.warn('Link Context: API call failed:', error);
      return fallback;
    }
  }

  safeDOMOperation(operation, fallback = null) {
    try {
      return operation();
    } catch (error) {
      console.warn('Link Context: DOM operation failed:', error);
      return fallback;
    }
  }
}

// Initialize error handling only if not already initialized
if (typeof window.linkContextErrorHandler === 'undefined') {
  window.linkContextErrorHandler = new ErrorHandler();
}
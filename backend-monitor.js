/**
 * Backend Health Monitor
 * Keeps backend alive and monitors health status
 * Provides automatic keepalive pings for serverless functions
 */

const BackendMonitor = {
  config: {
    healthCheckUrl: 'https://shooter-app-one.vercel.app/api/health',
    pingInterval: 5 * 60 * 1000, // 5 minutes
    retryInterval: 30 * 1000, // 30 seconds on failure
    maxRetries: 3
  },

  state: {
    isHealthy: true,
    lastCheck: null,
    lastError: null,
    consecutiveFailures: 0,
    intervalId: null
  },

  /**
   * Initialize the monitor and start periodic health checks
   */
  initialize() {
    console.log('🏥 Backend Monitor: Initializing...');
    
    // Do immediate health check
    this.checkHealth();
    
    // Start periodic checks
    this.startMonitoring();
    
    // Also check when page becomes visible again
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkHealth();
      }
    });

    return this;
  },

  /**
   * Start periodic health monitoring
   */
  startMonitoring() {
    if (this.state.intervalId) {
      clearInterval(this.state.intervalId);
    }

    const interval = this.state.isHealthy 
      ? this.config.pingInterval 
      : this.config.retryInterval;

    this.state.intervalId = setInterval(() => {
      this.checkHealth();
    }, interval);

    console.log(`🏥 Backend Monitor: Checking every ${interval / 1000}s`);
  },

  /**
   * Perform a health check
   */
  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(this.config.healthCheckUrl, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        this.handleHealthyResponse(data);
      } else {
        this.handleUnhealthyResponse(`HTTP ${response.status}`);
      }
    } catch (error) {
      this.handleError(error);
    }
  },

  /**
   * Handle successful health check
   */
  handleHealthyResponse(data) {
    const wasUnhealthy = !this.state.isHealthy;
    
    this.state.isHealthy = data.status === 'healthy';
    this.state.lastCheck = Date.now();
    this.state.lastError = null;
    this.state.consecutiveFailures = 0;

    if (wasUnhealthy) {
      console.log('✅ Backend Monitor: Backend recovered!');
      this.startMonitoring(); // Switch back to normal interval
    }

    console.log('🏥 Backend Monitor: Healthy', {
      status: data.status,
      storage: data.services?.storage,
      timestamp: new Date(data.timestamp).toISOString()
    });

    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('backend-health', {
      detail: { healthy: this.state.isHealthy, data }
    }));
  },

  /**
   * Handle unhealthy response
   */
  handleUnhealthyResponse(reason) {
    this.state.consecutiveFailures++;
    this.state.lastError = reason;

    if (this.state.consecutiveFailures >= this.config.maxRetries) {
      this.state.isHealthy = false;
      console.warn('⚠️ Backend Monitor: Backend unhealthy -', reason);
      this.startMonitoring(); // Switch to retry interval
    }

    window.dispatchEvent(new CustomEvent('backend-health', {
      detail: { healthy: this.state.isHealthy, error: reason }
    }));
  },

  /**
   * Handle error during health check
   */
  handleError(error) {
    this.state.consecutiveFailures++;
    this.state.lastError = error.message;

    if (this.state.consecutiveFailures >= this.config.maxRetries) {
      this.state.isHealthy = false;
      console.error('❌ Backend Monitor: Health check failed -', error.message);
      this.startMonitoring(); // Switch to retry interval
    }

    window.dispatchEvent(new CustomEvent('backend-health', {
      detail: { healthy: this.state.isHealthy, error: error.message }
    }));
  },

  /**
   * Stop monitoring
   */
  stop() {
    if (this.state.intervalId) {
      clearInterval(this.state.intervalId);
      this.state.intervalId = null;
      console.log('🏥 Backend Monitor: Stopped');
    }
  },

  /**
   * Get current health status
   */
  getStatus() {
    return {
      isHealthy: this.state.isHealthy,
      lastCheck: this.state.lastCheck,
      lastError: this.state.lastError,
      consecutiveFailures: this.state.consecutiveFailures
    };
  },

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    if (this.state.intervalId) {
      this.startMonitoring(); // Restart with new config
    }
  }
};

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Initialize after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      BackendMonitor.initialize();
    });
  } else {
    BackendMonitor.initialize();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackendMonitor;
}

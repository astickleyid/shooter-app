/**
 * WebGL Detection and Capabilities
 * Utilities for checking WebGL support and device capabilities
 */

/**
 * Check if WebGL is supported by the browser
 * @returns {boolean} True if WebGL is supported
 */
export function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!(gl && gl instanceof WebGLRenderingContext);
  } catch (e) {
    return false;
  }
}

/**
 * Check if WebGL2 is supported by the browser
 * @returns {boolean} True if WebGL2 is supported
 */
export function supportsWebGL2() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return !!(gl && gl instanceof WebGL2RenderingContext);
  } catch (e) {
    return false;
  }
}

/**
 * Get WebGL capabilities and device information
 * @returns {object} Device capabilities
 */
export function getWebGLCapabilities() {
  if (!supportsWebGL()) {
    return null;
  }

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) return null;

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  
  return {
    version: gl.getParameter(gl.VERSION),
    vendor: gl.getParameter(gl.VENDOR),
    renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
    maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
    maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
    maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
    webgl2: supportsWebGL2()
  };
}

/**
 * Detect device performance tier based on capabilities
 * @returns {string} 'high', 'medium', or 'low'
 */
export function detectPerformanceTier() {
  // Check if running on mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Check WebGL capabilities
  const caps = getWebGLCapabilities();
  if (!caps) return 'low';

  // GPU-based detection (simplified)
  const renderer = caps.renderer.toLowerCase();
  const isHighEndGPU = 
    renderer.includes('nvidia') || 
    renderer.includes('amd') || 
    renderer.includes('radeon') ||
    renderer.includes('geforce');
  
  const isLowEndGPU = 
    renderer.includes('intel') && 
    (renderer.includes('hd') || renderer.includes('uhd'));

  // Memory estimation (very rough)
  const memory = performance?.memory?.jsHeapSizeLimit || 0;
  const hasHighMemory = memory > 1024 * 1024 * 1024; // > 1GB

  // Decision logic
  if (isMobile) {
    // Mobile devices
    if (renderer.includes('apple') && !renderer.includes('a8')) {
      return 'medium'; // Newer iOS devices (A9+)
    }
    return 'low'; // Conservative for mobile
  } else {
    // Desktop devices
    if (isHighEndGPU && hasHighMemory) {
      return 'high';
    } else if (isLowEndGPU) {
      return 'low';
    }
    return 'medium';
  }
}

/**
 * Get recommended quality settings based on device capabilities
 * @returns {object} Quality settings
 */
export function getRecommendedQualitySettings() {
  const tier = detectPerformanceTier();
  
  const settings = {
    high: {
      pixelRatio: Math.min(2, window.devicePixelRatio || 1),
      shadows: true,
      postProcessing: true,
      particleMultiplier: 1.0,
      maxLights: 10,
      antialias: true,
      geometryDetail: 'high'
    },
    medium: {
      pixelRatio: Math.min(1.5, window.devicePixelRatio || 1),
      shadows: false,
      postProcessing: true,
      particleMultiplier: 0.7,
      maxLights: 6,
      antialias: true,
      geometryDetail: 'medium'
    },
    low: {
      pixelRatio: 1,
      shadows: false,
      postProcessing: false,
      particleMultiplier: 0.4,
      maxLights: 3,
      antialias: false,
      geometryDetail: 'low'
    }
  };

  return settings[tier];
}

/**
 * Check if device supports all required WebGL extensions
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {Array<string>} extensions - Required extensions
 * @returns {boolean} True if all extensions are supported
 */
export function checkExtensions(gl, extensions) {
  if (!gl) return false;
  
  return extensions.every(ext => {
    const supported = gl.getExtension(ext);
    if (!supported) {
      console.warn(`WebGL extension not supported: ${ext}`);
    }
    return supported;
  });
}

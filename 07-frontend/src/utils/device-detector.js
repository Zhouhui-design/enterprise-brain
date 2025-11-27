/**
 * 设备检测器工具
 * 提供设备类型、浏览器信息、操作系统、屏幕信息等检测功能
 */
class DeviceDetector {
  constructor() {
    // 初始化时收集基本信息
    this.userAgent = navigator.userAgent;
    this.platform = navigator.platform;
    this.language = navigator.language || navigator.userLanguage;
    this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    this._cache = {};
  }

  /**
   * 获取设备信息摘要
   * @returns {Object} 设备信息摘要
   */
  getDeviceInfo() {
    return {
      device: this.getDeviceType(),
      browser: this.getBrowserInfo(),
      os: this.getOSInfo(),
      screen: this.getScreenInfo(),
      network: this.getNetworkInfo(),
      language: this.getLanguage(),
      userAgent: this.userAgent,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 检测设备类型
   * @returns {string} 设备类型: 'mobile', 'tablet', 'desktop', 'tv', 'unknown'
   */
  getDeviceType() {
    if (this._cache.deviceType) return this._cache.deviceType;

    const ua = this.userAgent.toLowerCase();
    
    // 检测移动设备
    const isMobile = /iphone|android|ipod|blackberry|windows phone|opera mini|iemobile|mobile/.test(ua) && 
                    !this._isTablet();
    
    // 检测平板设备
    const isTablet = this._isTablet();
    
    // 检测电视设备
    const isTV = /smart-tv|smarttv|tv|tizen|webos|netcast|viera|smartplatform/.test(ua);
    
    let deviceType = 'unknown';
    if (isMobile) deviceType = 'mobile';
    else if (isTablet) deviceType = 'tablet';
    else if (isTV) deviceType = 'tv';
    else deviceType = 'desktop';
    
    this._cache.deviceType = deviceType;
    return deviceType;
  }

  /**
   * 获取浏览器信息
   * @returns {Object} 浏览器信息
   */
  getBrowserInfo() {
    if (this._cache.browserInfo) return this._cache.browserInfo;

    const ua = this.userAgent;
    let browser = 'unknown';
    let version = 'unknown';
    let engine = 'unknown';
    
    // 检测浏览器
    if (/msie|trident/i.test(ua)) {
      // IE
      browser = 'internet explorer';
      version = (ua.match(/(msie|rv):([0-9.]+)/i) || [])[2] || 'unknown';
      engine = 'trident';
    } else if (/edge/i.test(ua)) {
      // Edge
      browser = 'edge';
      version = (ua.match(/edge\/([0-9.]+)/i) || [])[1] || 'unknown';
      engine = 'edgehtml';
    } else if (/edg/i.test(ua) && !/edge/i.test(ua)) {
      // Edge Chromium
      browser = 'edge chromium';
      version = (ua.match(/edg\/([0-9.]+)/i) || [])[1] || 'unknown';
      engine = 'blink';
    } else if (/chrome/i.test(ua) && /google inc/.test(ua)) {
      // Chrome
      browser = 'chrome';
      version = (ua.match(/chrome\/([0-9.]+)/i) || [])[1] || 'unknown';
      engine = 'blink';
    } else if (/firefox/i.test(ua)) {
      // Firefox
      browser = 'firefox';
      version = (ua.match(/firefox\/([0-9.]+)/i) || [])[1] || 'unknown';
      engine = 'gecko';
    } else if (/safari/i.test(ua) && !/chrome/i.test(ua) && !/opera/i.test(ua)) {
      // Safari
      browser = 'safari';
      version = (ua.match(/version\/([0-9.]+)/i) || [])[1] || 'unknown';
      engine = 'webkit';
    } else if (/opera|opr/i.test(ua)) {
      // Opera
      browser = 'opera';
      version = (ua.match(/(opera|opr)\/([0-9.]+)/i) || [])[2] || 'unknown';
      engine = 'blink';
    }
    
    const browserInfo = {
      name: browser,
      version,
      engine,
      isChromium: browser === 'chrome' || browser === 'edge chromium' || browser === 'opera',
      isWebKit: engine === 'webkit',
      isGecko: engine === 'gecko',
      isTrident: engine === 'trident'
    };
    
    this._cache.browserInfo = browserInfo;
    return browserInfo;
  }

  /**
   * 获取操作系统信息
   * @returns {Object} 操作系统信息
   */
  getOSInfo() {
    if (this._cache.osInfo) return this._cache.osInfo;

    const ua = this.userAgent;
    const platform = this.platform;
    let os = 'unknown';
    let version = 'unknown';
    
    // 检测操作系统
    if (/windows|win32|win64/i.test(platform)) {
      os = 'windows';
      if (ua.includes('Windows NT 10')) version = '10/11';
      else if (ua.includes('Windows NT 6.3')) version = '8.1';
      else if (ua.includes('Windows NT 6.2')) version = '8';
      else if (ua.includes('Windows NT 6.1')) version = '7';
      else if (ua.includes('Windows NT 6.0')) version = 'Vista';
      else if (ua.includes('Windows NT 5.1')) version = 'XP';
    } else if (/macintosh|mac os x/i.test(platform)) {
      os = 'macos';
      const match = ua.match(/mac os x ([0-9_]+)/i);
      if (match) {
        version = match[1].replace(/_/g, '.');
      }
    } else if (/android/i.test(ua)) {
      os = 'android';
      const match = ua.match(/android ([0-9.]+)/i);
      if (match) {
        version = match[1];
      }
    } else if (/iphone|ipad|ipod/i.test(platform)) {
      os = 'ios';
      const match = ua.match(/os ([0-9_]+)/i);
      if (match) {
        version = match[1].replace(/_/g, '.');
      }
    } else if (/linux/i.test(platform)) {
      os = 'linux';
      // 尝试检测Linux发行版
      if (ua.includes('Ubuntu')) os = 'ubuntu';
      else if (ua.includes('Fedora')) os = 'fedora';
      else if (ua.includes('Debian')) os = 'debian';
    } else if (/cros/i.test(ua)) {
      os = 'chromeos';
    }
    
    const osInfo = {
      name: os,
      version,
      isMobile: os === 'android' || os === 'ios',
      isDesktop: os === 'windows' || os === 'macos' || os === 'linux' || os === 'chromeos'
    };
    
    this._cache.osInfo = osInfo;
    return osInfo;
  }

  /**
   * 获取屏幕信息
   * @returns {Object} 屏幕信息
   */
  getScreenInfo() {
    if (this._cache.screenInfo) return this._cache.screenInfo;

    const screenInfo = {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      orientation: this._getScreenOrientation(),
      dpr: window.devicePixelRatio || 1,
      isRetina: (window.devicePixelRatio || 1) > 1
    };
    
    // 计算视口信息
    const viewport = this._getViewportSize();
    screenInfo.viewport = viewport;
    
    // 计算响应式断点
    screenInfo.breakpoint = this._getResponsiveBreakpoint(viewport.width);
    
    this._cache.screenInfo = screenInfo;
    return screenInfo;
  }

  /**
   * 获取网络信息
   * @returns {Object} 网络信息
   */
  getNetworkInfo() {
    if (this._cache.networkInfo) return this._cache.networkInfo;

    let networkInfo = {
      online: navigator.onLine,
      connectionType: 'unknown',
      effectiveType: 'unknown',
      downlink: null,
      rtt: null,
      saveData: false
    };
    
    // 使用Network Information API（如果可用）
    if (this.connection) {
      networkInfo.connectionType = this.connection.type || 'unknown';
      networkInfo.effectiveType = this.connection.effectiveType || 'unknown';
      networkInfo.downlink = this.connection.downlink || null;
      networkInfo.rtt = this.connection.rtt || null;
      networkInfo.saveData = this.connection.saveData || false;
    }
    
    this._cache.networkInfo = networkInfo;
    return networkInfo;
  }

  /**
   * 获取语言信息
   * @returns {Object} 语言信息
   */
  getLanguage() {
    return {
      primary: this.language,
      language: this.language.split('-')[0],
      region: this.language.split('-')[1] || 'unknown',
      availableLanguages: navigator.languages || [this.language]
    };
  }

  /**
   * 检测是否是移动设备
   * @returns {boolean} 是否是移动设备
   */
  isMobile() {
    return this.getDeviceType() === 'mobile';
  }

  /**
   * 检测是否是平板设备
   * @returns {boolean} 是否是平板设备
   */
  isTablet() {
    return this.getDeviceType() === 'tablet';
  }

  /**
   * 检测是否是桌面设备
   * @returns {boolean} 是否是桌面设备
   */
  isDesktop() {
    return this.getDeviceType() === 'desktop';
  }

  /**
   * 检测是否是触摸屏
   * @returns {boolean} 是否是触摸屏
   */
  isTouchDevice() {
    if (this._cache.isTouchDevice !== undefined) return this._cache.isTouchDevice;
    
    const isTouch = 'ontouchstart' in window || 
                    navigator.maxTouchPoints > 0 || 
                    navigator.msMaxTouchPoints > 0;
    
    this._cache.isTouchDevice = isTouch;
    return isTouch;
  }

  /**
   * 检测是否支持特定功能
   * @param {string} feature - 功能名称
   * @returns {boolean} 是否支持
   */
  supports(feature) {
    const featureMap = {
      'geolocation': 'geolocation' in navigator,
      'webanimations': 'Animation' in window,
      'webgl': this._supportsWebGL(),
      'webp': this._supportsWebP(),
      'serviceWorker': 'serviceWorker' in navigator,
      'pushNotifications': 'Notification' in window,
      'localStorage': this._supportsLocalStorage(),
      'sessionStorage': this._supportsSessionStorage(),
      'indexedDB': this._supportsIndexedDB(),
      'webAssembly': typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function',
      'webRTC': 'RTCPeerConnection' in window,
      'webSpeech': 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      'ambientLight': 'AmbientLightSensor' in window,
      'battery': 'getBattery' in navigator,
      'clipboard': 'clipboard' in navigator,
      'paymentRequest': 'PaymentRequest' in window,
      'vibration': 'vibrate' in navigator
    };
    
    return featureMap[feature] || false;
  }

  /**
   * 获取浏览器特性支持情况
   * @returns {Object} 特性支持情况
   */
  getFeatureSupport() {
    const features = [
      'geolocation', 'webanimations', 'webgl', 'webp', 'serviceWorker',
      'pushNotifications', 'localStorage', 'sessionStorage', 'indexedDB',
      'webAssembly', 'webRTC', 'webSpeech', 'ambientLight', 'battery',
      'clipboard', 'paymentRequest', 'vibration'
    ];
    
    const support = {};
    features.forEach(feature => {
      support[feature] = this.supports(feature);
    });
    
    return support;
  }

  /**
   * 检测是否在特定环境中运行
   * @param {string} environment - 环境名称: 'browser', 'node', 'webworker', 'electron', 'cordova', 'reactnative'
   * @returns {boolean} 是否在指定环境
   */
  isEnvironment(environment) {
    const ua = this.userAgent;
    
    switch (environment) {
      case 'browser':
        return typeof window !== 'undefined' && typeof document !== 'undefined';
      case 'node':
        return typeof process !== 'undefined' && process.versions && process.versions.node;
      case 'webworker':
        return typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
      case 'electron':
        return /electron/i.test(ua) || (typeof process !== 'undefined' && process.versions && process.versions.electron);
      case 'cordova':
        return /cordova|phonegap/i.test(ua) || (window.cordova !== undefined);
      case 'reactnative':
        return /reactnative|react native/i.test(ua) || (typeof navigator !== 'undefined' && navigator.product === 'ReactNative');
      default:
        return false;
    }
  }

  /**
   * 获取用户代理详情
   * @returns {Object} 用户代理详情
   */
  getUserAgentDetails() {
    return {
      full: this.userAgent,
      platform: this.platform,
      appVersion: navigator.appVersion,
      vendor: navigator.vendor
    };
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this._cache = {};
  }

  /**
   * 生成设备指纹（简化版）
   * @returns {string} 设备指纹
   */
  generateFingerprint() {
    const info = this.getDeviceInfo();
    const fingerprintData = [
      info.browser.name,
      info.browser.version,
      info.os.name,
      info.os.version,
      info.screen.width,
      info.screen.height,
      info.screen.colorDepth,
      info.language.primary,
      navigator.vendor,
      this.isTouchDevice() ? 'touch' : 'no-touch'
    ];
    
    // 简单的哈希函数
    const fingerprint = this._simpleHash(fingerprintData.join('|'));
    return fingerprint;
  }

  /**
   * 监听设备变化
   * @param {Function} callback - 变化时的回调函数
   * @returns {Function} 取消监听的函数
   */
  listenForChanges(callback) {
    // 监听网络状态变化
    window.addEventListener('online', () => {
      this.clearCache();
      callback({ type: 'network', info: this.getNetworkInfo() });
    });
    
    window.addEventListener('offline', () => {
      this.clearCache();
      callback({ type: 'network', info: this.getNetworkInfo() });
    });
    
    // 监听屏幕方向变化
    window.addEventListener('orientationchange', () => {
      this.clearCache();
      callback({ type: 'orientation', info: this.getScreenInfo().orientation });
    });
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      this.clearCache();
      callback({ type: 'screen', info: this.getScreenInfo() });
    });
    
    // 返回取消监听的函数
    return () => {
      window.removeEventListener('online', null);
      window.removeEventListener('offline', null);
      window.removeEventListener('orientationchange', null);
      window.removeEventListener('resize', null);
    };
  }

  // 私有辅助方法
  
  /**
   * 检测是否是平板（内部方法）
   * @private
   */
  _isTablet() {
    const ua = this.userAgent.toLowerCase();
    const tabletRegex = /ipad|android(?!.*mobile)|tablet|playbook|silk/i;
    const isTabletPattern = tabletRegex.test(ua);
    
    // 结合屏幕尺寸判断
    const screenWidth = screen.width;
    const screenHeight = screen.height;
    const minTabletSize = 600;
    
    const isLargeScreen = Math.min(screenWidth, screenHeight) >= minTabletSize;
    
    return isTabletPattern || (this.isTouchDevice() && isLargeScreen && !/mobile/.test(ua));
  }

  /**
   * 获取屏幕方向（内部方法）
   * @private
   */
  _getScreenOrientation() {
    if (window.screen.orientation && window.screen.orientation.type) {
      return window.screen.orientation.type;
    }
    
    // 回退方案
    const orientation = window.orientation;
    if (orientation === 0 || orientation === 180) {
      return 'portrait-primary';
    } else if (orientation === 90 || orientation === -90) {
      return 'landscape-primary';
    }
    
    // 根据宽高比判断
    const isPortrait = screen.height > screen.width;
    return isPortrait ? 'portrait-primary' : 'landscape-primary';
  }

  /**
   * 获取视口尺寸（内部方法）
   * @private
   */
  _getViewportSize() {
    return {
      width: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
      height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
    };
  }

  /**
   * 获取响应式断点（内部方法）
   * @private
   */
  _getResponsiveBreakpoint(width) {
    if (width < 576) return 'xs';
    if (width >= 576 && width < 768) return 'sm';
    if (width >= 768 && width < 992) return 'md';
    if (width >= 992 && width < 1200) return 'lg';
    if (width >= 1200 && width < 1400) return 'xl';
    return 'xxl';
  }

  /**
   * 检测WebGL支持（内部方法）
   * @private
   */
  _supportsWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
               (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  /**
   * 检测WebP支持（内部方法）
   * @private
   */
  _supportsWebP() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
    } catch (e) {
      return false;
    }
  }

  /**
   * 检测localStorage支持（内部方法）
   * @private
   */
  _supportsLocalStorage() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 检测sessionStorage支持（内部方法）
   * @private
   */
  _supportsSessionStorage() {
    try {
      const test = '__storage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 检测IndexedDB支持（内部方法）
   * @private
   */
  _supportsIndexedDB() {
    return 'indexedDB' in window;
  }

  /**
   * 简单哈希函数（内部方法）
   * @private
   */
  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 导出设备信息为JSON
   * @returns {string} JSON字符串
   */
  exportAsJSON() {
    const info = this.getDeviceInfo();
    return JSON.stringify(info, null, 2);
  }

  /**
   * 检测是否是搜索引擎爬虫
   * @returns {boolean} 是否是爬虫
   */
  isBot() {
    const botPatterns = [
      'bot', 'crawler', 'spider', 'slurp', 'robot', 'crawling',
      'baidu', 'bingbot', 'googlebot', 'yandex', 'duckduckbot',
      'mediapartners-google', 'adsbot', 'facebookexternalhit'
    ];
    
    const ua = this.userAgent.toLowerCase();
    return botPatterns.some(pattern => ua.includes(pattern));
  }

  /**
   * 检测是否是PWA环境
   * @returns {boolean} 是否是PWA
   */
  isPWA() {
    // 检测是否是独立安装的应用
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator.standalone === true);
  }
}

// 导出单例实例
const deviceDetector = new DeviceDetector();
export default deviceDetector;
export { DeviceDetector };
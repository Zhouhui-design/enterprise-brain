/**
 * 文件工具类
 * 提供文件操作、路径处理、类型检查等功能
 */
class FileUtils {
  constructor() {
    this.imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'];
    this.audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'wma'];
    this.videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    this.documentExtensions = ['doc', 'docx', 'pdf', 'txt', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'];
  }

  /**
   * 获取文件扩展名
   * @param {string} filename - 文件名
   * @returns {string} 扩展名（不含点号）
   */
  getFileExtension(filename) {
    if (!filename || typeof filename !== 'string') {
      return '';
    }
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex === -1 ? '' : filename.slice(lastDotIndex + 1).toLowerCase();
  }

  /**
   * 获取文件名（不含扩展名）
   * @param {string} filename - 文件名
   * @returns {string} 文件名（不含扩展名）
   */
  getFileNameWithoutExtension(filename) {
    if (!filename || typeof filename !== 'string') {
      return '';
    }
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex === -1 ? filename : filename.slice(0, lastDotIndex);
  }

  /**
   * 检查文件是否为图片
   * @param {string|File} file - 文件名或文件对象
   * @returns {boolean} 是否为图片
   */
  isImage(file) {
    const extension = this._getFileExtensionFromInput(file);
    return this.imageExtensions.includes(extension);
  }

  /**
   * 检查文件是否为音频
   * @param {string|File} file - 文件名或文件对象
   * @returns {boolean} 是否为音频
   */
  isAudio(file) {
    const extension = this._getFileExtensionFromInput(file);
    return this.audioExtensions.includes(extension);
  }

  /**
   * 检查文件是否为视频
   * @param {string|File} file - 文件名或文件对象
   * @returns {boolean} 是否为视频
   */
  isVideo(file) {
    const extension = this._getFileExtensionFromInput(file);
    return this.videoExtensions.includes(extension);
  }

  /**
   * 检查文件是否为文档
   * @param {string|File} file - 文件名或文件对象
   * @returns {boolean} 是否为文档
   */
  isDocument(file) {
    const extension = this._getFileExtensionFromInput(file);
    return this.documentExtensions.includes(extension);
  }

  /**
   * 获取文件类型
   * @param {string|File} file - 文件名或文件对象
   * @returns {string} 文件类型
   */
  getFileType(file) {
    if (this.isImage(file)) return 'image';
    if (this.isAudio(file)) return 'audio';
    if (this.isVideo(file)) return 'video';
    if (this.isDocument(file)) return 'document';
    return 'other';
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    if (isNaN(bytes) || bytes < 0) return '无效大小';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 验证文件大小
   * @param {File} file - 文件对象
   * @param {number} maxSize - 最大大小（字节）
   * @returns {boolean} 是否有效
   */
  isValidFileSize(file, maxSize) {
    if (!(file instanceof File)) {
      return false;
    }
    return file.size <= maxSize;
  }

  /**
   * 验证文件类型
   * @param {File} file - 文件对象
   * @param {Array} allowedTypes - 允许的类型数组
   * @returns {boolean} 是否有效
   */
  isValidFileType(file, allowedTypes) {
    if (!(file instanceof File)) {
      return false;
    }
    
    const extension = this.getFileExtension(file.name).toLowerCase();
    const mimeType = file.type.toLowerCase();
    
    return allowedTypes.some(type => {
      type = type.toLowerCase();
      // 检查扩展名或MIME类型
      return type.startsWith('.') 
        ? extension === type.slice(1)
        : mimeType === type || mimeType.startsWith(type + '/');
    });
  }

  /**
   * 生成唯一文件名
   * @param {string} originalName - 原始文件名
   * @returns {string} 唯一文件名
   */
  generateUniqueFileName(originalName) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const extension = this.getFileExtension(originalName);
    const baseName = this.getFileNameWithoutExtension(originalName);
    
    return `${baseName}_${timestamp}_${random}${extension ? '.' + extension : ''}`;
  }

  /**
   * 创建文件对象
   * @param {string|Blob} content - 文件内容
   * @param {string} filename - 文件名
   * @param {string} mimeType - MIME类型
   * @returns {File} 文件对象
   */
  createFile(content, filename, mimeType = 'application/octet-stream') {
    const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
    return new File([blob], filename, { type: mimeType });
  }

  /**
   * 读取文件为DataURL
   * @param {File} file - 文件对象
   * @returns {Promise<string>} DataURL
   */
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      if (!(file instanceof File)) {
        return reject(new Error('无效的文件对象'));
      }
      
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * 读取文件为ArrayBuffer
   * @param {File} file - 文件对象
   * @returns {Promise<ArrayBuffer>} ArrayBuffer
   */
  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      if (!(file instanceof File)) {
        return reject(new Error('无效的文件对象'));
      }
      
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 创建图片预览
   * @param {File} file - 图片文件
   * @returns {Promise<string>} 预览URL
   */
  createImagePreview(file) {
    return new Promise((resolve, reject) => {
      if (!this.isImage(file)) {
        return reject(new Error('文件不是有效的图片'));
      }
      
      this.readFileAsDataURL(file)
        .then(dataUrl => {
          const img = new Image();
          img.onload = () => resolve(dataUrl);
          img.onerror = () => reject(new Error('图片加载失败'));
          img.src = dataUrl;
        })
        .catch(reject);
    });
  }

  /**
   * 获取图片尺寸
   * @param {File|string} image - 图片文件或DataURL
   * @returns {Promise<Object>} 尺寸对象 {width, height}
   */
  getImageDimensions(image) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => reject(new Error('图片加载失败'));
      
      if (image instanceof File) {
        this.readFileAsDataURL(image).then(url => {
          img.src = url;
        }).catch(reject);
      } else {
        img.src = image;
      }
    });
  }

  /**
   * 分割文件路径
   * @param {string} path - 文件路径
   * @returns {Object} 路径对象 {directory, filename, extension}
   */
  parseFilePath(path) {
    if (!path || typeof path !== 'string') {
      return { directory: '', filename: '', extension: '' };
    }
    
    // 统一路径分隔符
    const normalizedPath = path.replace(/\\/g, '/');
    const lastSlashIndex = normalizedPath.lastIndexOf('/');
    
    let directory = '';
    let filename = normalizedPath;
    
    if (lastSlashIndex !== -1) {
      directory = normalizedPath.slice(0, lastSlashIndex);
      filename = normalizedPath.slice(lastSlashIndex + 1);
    }
    
    const extension = this.getFileExtension(filename);
    
    return { directory, filename, extension };
  }

  /**
   * 构建文件路径
   * @param {string} directory - 目录
   * @param {string} filename - 文件名
   * @returns {string} 完整路径
   */
  buildFilePath(directory, filename) {
    if (!directory) return filename;
    if (!filename) return directory;
    
    // 确保目录以分隔符结尾
    const separator = directory.includes('/') ? '/' : '\\';
    const normalizedDirectory = directory.endsWith(separator) ? directory : directory + separator;
    
    return normalizedDirectory + filename;
  }

  /**
   * 清理文件名（移除特殊字符）
   * @param {string} filename - 原始文件名
   * @returns {string} 清理后的文件名
   */
  sanitizeFileName(filename) {
    if (!filename || typeof filename !== 'string') {
      return '';
    }
    
    // 移除或替换特殊字符，保留字母、数字、下划线、连字符和点号
    return filename.replace(/[<>"/\\|?*]/g, '_');
  }

  /**
   * 批量重命名文件
   * @param {Array} files - 文件数组
   * @param {Function} renameCallback - 重命名回调函数
   * @returns {Array} 重命名后的文件数组
   */
  batchRenameFiles(files, renameCallback) {
    if (!Array.isArray(files) || typeof renameCallback !== 'function') {
      return [];
    }
    
    return files.map((file, index) => {
      const newName = renameCallback(file.name, index, file);
      return new File([file], newName, { type: file.type, lastModified: file.lastModified });
    });
  }

  /**
   * 获取文件MIME类型
   * @param {string} extension - 文件扩展名
   * @returns {string} MIME类型
   */
  getMimeTypeFromExtension(extension) {
    const mimeTypeMap = {
      // 图片
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
      // 音频
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      'aac': 'audio/aac',
      'wma': 'audio/x-ms-wma',
      // 视频
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      'webm': 'video/webm',
      'mkv': 'video/x-matroska',
      // 文档
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'rtf': 'application/rtf',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'csv': 'text/csv',
      // 其他
      'json': 'application/json',
      'xml': 'text/xml',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'text/javascript',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed'
    };
    
    return mimeTypeMap[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * 私有方法：从输入获取文件扩展名
   * @private
   * @param {string|File} input - 文件名或文件对象
   * @returns {string} 扩展名
   */
  _getFileExtensionFromInput(input) {
    if (input instanceof File) {
      return this.getFileExtension(input.name);
    }
    return this.getFileExtension(String(input));
  }

  /**
   * 检查文件是否存在（前端模拟，实际需要后端验证）
   * @param {string} url - 文件URL
   * @returns {Promise<boolean>} 是否存在
   */
  checkFileExists(url) {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('HEAD', url, true);
      xhr.onload = () => resolve(xhr.status === 200);
      xhr.onerror = () => resolve(false);
      xhr.send();
    });
  }

  /**
   * 创建文件下载链接
   * @param {Blob|File|string} data - 文件数据
   * @param {string} filename - 文件名
   * @param {string} mimeType - MIME类型
   * @returns {HTMLAnchorElement} 下载链接
   */
  createDownloadLink(data, filename, mimeType = 'application/octet-stream') {
    const blob = typeof data === 'string' 
      ? new Blob([data], { type: mimeType })
      : data instanceof Blob ? data : new Blob([data], { type: mimeType });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    return link;
  }
}

// 导出单例实例
const fileUtils = new FileUtils();
export default fileUtils;
export { FileUtils };
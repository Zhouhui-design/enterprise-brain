/**
 * 文件处理器工具
 * 提供文件上传、下载、解析、转换和验证功能
 */
class FileProcessor {
  constructor() {
    this.supportedFormats = {
      images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
      documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'json'],
      archives: ['zip', 'rar', '7z', 'tar', 'gz'],
      audio: ['mp3', 'wav', 'ogg', 'flac', 'aac'],
      video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv']
    };
    
    this.sizeLimits = {
      default: 10 * 1024 * 1024, // 10MB
      images: 5 * 1024 * 1024,    // 5MB
      documents: 20 * 1024 * 1024, // 20MB
      archives: 50 * 1024 * 1024,  // 50MB
      audio: 15 * 1024 * 1024,    // 15MB
      video: 100 * 1024 * 1024    // 100MB
    };
    
    this.uploadConfig = {
      chunkSize: 5 * 1024 * 1024, // 5MB
      concurrentChunks: 3,
      retryAttempts: 3,
      retryDelay: 1000
    };
    
    this.maxParallelProcesses = 3;
    this.activeProcesses = 0;
    this.queue = [];
    
    this.listeners = new Map();
  }

  /**
   * 配置文件处理器
   * @param {Object} config - 配置对象
   * @returns {FileProcessor} 当前实例，支持链式调用
   */
  configure(config) {
    if (config.supportedFormats) {
      this.supportedFormats = { ...this.supportedFormats, ...config.supportedFormats };
    }
    
    if (config.sizeLimits) {
      this.sizeLimits = { ...this.sizeLimits, ...config.sizeLimits };
    }
    
    if (config.uploadConfig) {
      this.uploadConfig = { ...this.uploadConfig, ...config.uploadConfig };
    }
    
    if (config.maxParallelProcesses) {
      this.maxParallelProcesses = config.maxParallelProcesses;
    }
    
    return this;
  }

  /**
   * 验证文件
   * @param {File} file - 文件对象
   * @param {Object} options - 验证选项
   * @returns {Object} 验证结果
   */
  validateFile(file, options = {}) {
    const { 
      allowedTypes = null, 
      maxSize = null,
      requiredExtension = null,
      minSize = 0
    } = options;
    
    // 验证文件存在
    if (!file || !(file instanceof File)) {
      return { valid: false, error: '无效的文件对象' };
    }
    
    // 获取文件扩展名和类型
    const extension = this._getExtension(file.name).toLowerCase();
    const fileType = file.type;
    
    // 验证文件大小
    if (file.size < minSize) {
      return { valid: false, error: `文件太小，最小需要 ${this._formatFileSize(minSize)}` };
    }
    
    // 获取大小限制
    const typeCategory = this._getFileTypeCategory(extension);
    const sizeLimit = maxSize || this.sizeLimits[typeCategory] || this.sizeLimits.default;
    
    if (file.size > sizeLimit) {
      return { 
        valid: false, 
        error: `文件太大，最大允许 ${this._formatFileSize(sizeLimit)}` 
      };
    }
    
    // 验证文件类型
    if (allowedTypes) {
      const allowed = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
      
      // 检查扩展名是否在允许列表中
      const allowedExtensions = allowed.map(type => 
        type.toLowerCase().replace(/^\./, '')
      );
      
      if (!allowedExtensions.includes(extension)) {
        return { 
          valid: false, 
          error: `不支持的文件类型，允许的类型: ${allowed.join(', ')}` 
        };
      }
    }
    
    // 验证必需的扩展名
    if (requiredExtension) {
      const required = Array.isArray(requiredExtension) 
        ? requiredExtension 
        : [requiredExtension];
      
      const requiredExts = required.map(ext => ext.toLowerCase().replace(/^\./, ''));
      
      if (!requiredExts.includes(extension)) {
        return { 
          valid: false, 
          error: `文件必须是以下类型之一: ${required.join(', ')}` 
        };
      }
    }
    
    // 验证文件是否为空
    if (file.size === 0) {
      return { valid: false, error: '文件为空' };
    }
    
    return {
      valid: true,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: fileType,
        extension,
        category: typeCategory,
        lastModified: file.lastModified
      }
    };
  }

  /**
   * 验证多个文件
   * @param {FileList|Array} files - 文件列表
   * @param {Object} options - 验证选项
   * @returns {Array} 验证结果数组
   */
  validateFiles(files, options = {}) {
    const fileArray = Array.isArray(files) ? files : Array.from(files);
    return fileArray.map(file => this.validateFile(file, options));
  }

  /**
   * 上传单个文件
   * @param {File} file - 文件对象
   * @param {Object} options - 上传选项
   * @returns {Promise<Object>} 上传结果
   */
  async uploadFile(file, options = {}) {
    const { 
      url, 
      method = 'POST',
      headers = {},
      formDataName = 'file',
      additionalData = {},
      useChunkedUpload = false,
      onProgress = null
    } = options;
    
    // 验证文件
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // 检查URL
    if (!url) {
      throw new Error('上传URL不能为空');
    }
    
    // 选择上传方法
    if (useChunkedUpload || file.size > this.uploadConfig.chunkSize) {
      return this._uploadFileInChunks(file, options);
    } else {
      return this._uploadFileDirectly(file, options);
    }
  }

  /**
   * 批量上传文件
   * @param {FileList|Array} files - 文件列表
   * @param {Object} options - 上传选项
   * @returns {Promise<Array>} 上传结果数组
   */
  async uploadFiles(files, options = {}) {
    const fileArray = Array.isArray(files) ? files : Array.from(files);
    const results = [];
    
    // 并发上传（控制最大并行数）
    const uploadPromises = [];
    
    for (const file of fileArray) {
      // 如果达到最大并行数，等待有进程完成
      if (this.activeProcesses >= this.maxParallelProcesses) {
        await new Promise(resolve => this.queue.push(resolve));
      }
      
      this.activeProcesses++;
      
      const uploadPromise = this.uploadFile(file, options)
        .finally(() => {
          this.activeProcesses--;
          // 释放队列中的下一个进程
          if (this.queue.length > 0) {
            const next = this.queue.shift();
            next();
          }
        });
      
      uploadPromises.push(uploadPromise);
    }
    
    // 等待所有上传完成
    const uploadResults = await Promise.allSettled(uploadPromises);
    
    // 处理结果
    uploadResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push({
          file: fileArray[index],
          success: true,
          data: result.value
        });
      } else {
        results.push({
          file: fileArray[index],
          success: false,
          error: result.reason.message
        });
      }
    });
    
    return results;
  }

  /**
   * 下载文件
   * @param {string} url - 文件URL
   * @param {Object} options - 下载选项
   * @returns {Promise<Blob>} 文件Blob对象
   */
  async downloadFile(url, options = {}) {
    const {
      fileName = null,
      method = 'GET',
      headers = {},
      onProgress = null,
      responseType = 'blob'
    } = options;
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // 设置进度监听
      if (onProgress && typeof onProgress === 'function') {
        xhr.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress({
              loaded: event.loaded,
              total: event.total,
              progress
            });
          }
        });
      }
      
      // 设置事件监听
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const blob = new Blob([xhr.response], { type: xhr.getResponseHeader('content-type') });
          
          // 如果需要自动保存
          if (fileName) {
            this._saveBlobToFile(blob, fileName);
          }
          
          resolve(blob);
        } else {
          reject(new Error(`下载失败，状态码: ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('网络错误，下载失败'));
      });
      
      xhr.addEventListener('timeout', () => {
        reject(new Error('下载超时'));
      });
      
      // 配置请求
      xhr.open(method, url);
      xhr.responseType = responseType;
      
      // 设置请求头
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      
      // 发送请求
      xhr.send();
    });
  }

  /**
   * 解析CSV文件
   * @param {File|Blob} file - 文件对象
   * @param {Object} options - 解析选项
   * @returns {Promise<Array>} 解析后的数据数组
   */
  async parseCSV(file, options = {}) {
    const {
      delimiter = ',',
      headers = true,
      skipEmptyLines = true,
      encoding = 'utf-8'
    } = options;
    
    // 读取文件内容
    const content = await this._readFileAsText(file, encoding);
    
    // 按行分割
    const lines = content.split(/\r?\n/);
    const result = [];
    let headersArray = [];
    
    // 处理第一行作为表头
    if (headers && lines.length > 0) {
      headersArray = lines[0].split(delimiter).map(header => 
        header.trim().replace(/^"|"$/g, '') // 移除引号
      );
    }
    
    // 处理数据行
    const startIndex = headers ? 1 : 0;
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (skipEmptyLines && !line) {
        continue;
      }
      
      // 简单的CSV解析（实际应用中可能需要更复杂的解析）
      const values = this._parseCSVLine(line, delimiter);
      
      if (headers && headersArray.length > 0) {
        // 转换为对象
        const rowObject = {};
        values.forEach((value, index) => {
          const header = headersArray[index] || `column_${index}`;
          rowObject[header] = value;
        });
        result.push(rowObject);
      } else {
        // 保持为数组
        result.push(values);
      }
    }
    
    return result;
  }

  /**
   * 解析JSON文件
   * @param {File|Blob} file - 文件对象
   * @param {Object} options - 解析选项
   * @returns {Promise<any>} 解析后的数据
   */
  async parseJSON(file, options = {}) {
    const { encoding = 'utf-8' } = options;
    
    const content = await this._readFileAsText(file, encoding);
    
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error('JSON解析错误: ' + error.message);
    }
  }

  /**
   * 生成文件预览
   * @param {File} file - 文件对象
   * @param {Object} options - 预览选项
   * @returns {Promise<string|null>} 预览URL或null
   */
  async generatePreview(file, options = {}) {
    const { type = 'auto', maxWidth = null, maxHeight = null } = options;
    
    // 根据文件类型生成预览
    const extension = this._getExtension(file.name).toLowerCase();
    
    if (this.supportedFormats.images.includes(extension)) {
      return this._generateImagePreview(file, { maxWidth, maxHeight });
    } else if (extension === 'pdf') {
      return this._generatePDFPreview(file);
    } else if (extension === 'json' || extension === 'txt' || extension === 'csv') {
      return this._generateTextPreview(file);
    } else {
      console.log('不支持预览的文件类型');
      return null;
    }
  }

  /**
   * 压缩图片
   * @param {File} file - 图片文件
   * @param {Object} options - 压缩选项
   * @returns {Promise<Blob>} 压缩后的图片Blob
   */
  async compressImage(file, options = {}) {
    const {
      quality = 0.8,
      maxWidth = null,
      maxHeight = null,
      outputFormat = 'auto'
    } = options;
    
    // 检查是否是图片
    const extension = this._getExtension(file.name).toLowerCase();
    if (!this.supportedFormats.images.includes(extension)) {
      throw new Error('不是有效的图片文件');
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const img = new Image();
        
        img.onload = () => {
          // 计算新的尺寸
          let newWidth = img.width;
          let newHeight = img.height;
          
          if (maxWidth && newWidth > maxWidth) {
            const ratio = maxWidth / newWidth;
            newWidth = maxWidth;
            newHeight = newHeight * ratio;
          }
          
          if (maxHeight && newHeight > maxHeight) {
            const ratio = maxHeight / newHeight;
            newHeight = maxHeight;
            newWidth = newWidth * ratio;
          }
          
          // 创建canvas并绘制图片
          const canvas = document.createElement('canvas');
          canvas.width = newWidth;
          canvas.height = newHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          
          // 确定输出格式
          let format = outputFormat === 'auto' ? 'image/jpeg' : outputFormat;
          if (extension === 'png') {
            format = 'image/png';
          } else if (extension === 'webp') {
            format = 'image/webp';
          }
          
          // 转换为Blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('图片压缩失败'));
              }
            },
            format,
            quality
          );
        };
        
        img.onerror = () => {
          reject(new Error('图片加载失败'));
        };
        
        img.src = event.target.result;
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * 合并文件
   * @param {Array<Blob|File>} files - 要合并的文件数组
   * @param {Object} options - 合并选项
   * @returns {Promise<Blob>} 合并后的Blob
   */
  async mergeFiles(files, options = {}) {
    const { type = 'application/octet-stream' } = options;
    
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('请提供有效的文件数组');
    }
    
    const chunks = [];
    
    for (const file of files) {
      const arrayBuffer = await this._readFileAsArrayBuffer(file);
      chunks.push(arrayBuffer);
    }
    
    // 合并ArrayBuffer
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const resultBuffer = new Uint8Array(totalLength);
    
    let offset = 0;
    chunks.forEach(chunk => {
      resultBuffer.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    });
    
    return new Blob([resultBuffer], { type });
  }

  /**
   * 分割文件
   * @param {File|Blob} file - 要分割的文件
   * @param {Object} options - 分割选项
   * @returns {Promise<Array<Blob>>} 分割后的Blob数组
   */
  async splitFile(file, options = {}) {
    const { chunkSize = 1024 * 1024 } = options; // 默认1MB
    
    const arrayBuffer = await this._readFileAsArrayBuffer(file);
    const chunks = [];
    
    for (let i = 0; i < arrayBuffer.byteLength; i += chunkSize) {
      const end = Math.min(i + chunkSize, arrayBuffer.byteLength);
      const chunk = arrayBuffer.slice(i, end);
      chunks.push(new Blob([chunk], { type: file.type }));
    }
    
    return chunks;
  }

  /**
   * 转换文件格式
   * @param {File} file - 源文件
   * @param {Object} options - 转换选项
   * @returns {Promise<Blob>} 转换后的文件Blob
   */
  async convertFile(file, options = {}) {
    const { targetFormat } = options;
    
    if (!targetFormat) {
      throw new Error('必须指定目标格式');
    }
    
    const sourceExtension = this._getExtension(file.name).toLowerCase();
    const targetExtension = targetFormat.toLowerCase().replace(/^\./, '');
    
    // 图片格式转换
    if (this.supportedFormats.images.includes(sourceExtension) && 
        this.supportedFormats.images.includes(targetExtension)) {
      return this._convertImageFormat(file, targetExtension);
    }
    
    // 其他类型的转换可能需要服务器端支持
    throw new Error(`不支持从 ${sourceExtension} 转换到 ${targetExtension}`);
  }

  /**
   * 添加事件监听器
   * @param {string} event - 事件名称
   * @param {Function} listener - 监听器函数
   */
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(listener);
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} listener - 监听器函数
   */
  off(event, listener) {
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   * @private
   */
  _triggerEvent(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('事件监听器错误:', error);
        }
      });
    }
  }

  /**
   * 直接上传文件（内部方法）
   * @private
   */
  async _uploadFileDirectly(file, options) {
    const { 
      url, 
      method = 'POST',
      headers = {},
      formDataName = 'file',
      additionalData = {},
      onProgress = null
    } = options;
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      
      // 添加文件
      formData.append(formDataName, file);
      
      // 添加额外数据
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // 设置进度监听
      if (onProgress && typeof onProgress === 'function') {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress({
              loaded: event.loaded,
              total: event.total,
              progress,
              file
            });
          }
        });
      }
      
      // 设置事件监听
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          let responseData;
          try {
            responseData = JSON.parse(xhr.responseText);
          } catch {
            responseData = xhr.responseText;
          }
          resolve({
            status: 'success',
            statusCode: xhr.status,
            data: responseData
          });
        } else {
          reject(new Error(`上传失败，状态码: ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('网络错误，上传失败'));
      });
      
      xhr.addEventListener('timeout', () => {
        reject(new Error('上传超时'));
      });
      
      // 配置请求
      xhr.open(method, url);
      
      // 设置请求头（不包括Content-Type，让浏览器自动设置）
      Object.entries(headers).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'content-type') {
          xhr.setRequestHeader(key, value);
        }
      });
      
      // 发送请求
      xhr.send(formData);
    });
  }

  /**
   * 分块上传文件（内部方法）
   * @private
   */
  async _uploadFileInChunks(file, options) {
    const { 
      url, 
      method = 'POST',
      headers = {},
      onProgress = null
    } = options;
    
    const chunkSize = this.uploadConfig.chunkSize;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileId = this._generateFileId(file);
    let uploadedChunks = 0;
    let totalProgress = 0;
    
    const uploadChunk = async (chunkIndex, chunkData) => {
      const formData = new FormData();
      formData.append('file', chunkData);
      formData.append('fileId', fileId);
      formData.append('chunkIndex', chunkIndex);
      formData.append('totalChunks', totalChunks);
      formData.append('fileName', file.name);
      formData.append('fileSize', file.size);
      
      // 实现分块上传逻辑（需要服务器端支持）
      // 这里返回模拟的成功结果
      await new Promise(resolve => setTimeout(resolve, 100));
      
      uploadedChunks++;
      const chunkProgress = (uploadedChunks / totalChunks) * 100;
      
      if (onProgress && typeof onProgress === 'function') {
        onProgress({
          loaded: uploadedChunks * chunkSize,
          total: file.size,
          progress: chunkProgress,
          file,
          chunkIndex,
          totalChunks
        });
      }
      
      return { success: true };
    };
    
    // 分块上传
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      let retries = 0;
      let success = false;
      
      // 带重试的上传
      while (retries <= this.uploadConfig.retryAttempts && !success) {
        try {
          await uploadChunk(i, chunk);
          success = true;
        } catch (error) {
          retries++;
          if (retries > this.uploadConfig.retryAttempts) {
            throw new Error(`分块 ${i} 上传失败，已达到最大重试次数`);
          }
          // 等待重试延迟
          await new Promise(resolve => 
            setTimeout(resolve, this.uploadConfig.retryDelay * retries)
          );
        }
      }
    }
    
    return {
      status: 'success',
      fileId,
      fileName: file.name,
      fileSize: file.size,
      chunks: totalChunks
    };
  }

  /**
   * 读取文件为文本（内部方法）
   * @private
   */
  _readFileAsText(file, encoding = 'utf-8') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file, encoding);
    });
  }

  /**
   * 读取文件为ArrayBuffer（内部方法）
   * @private
   */
  _readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 解析CSV行（内部方法）
   * @private
   */
  _parseCSVLine(line, delimiter) {
    // 简单的CSV解析，处理引号
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * 生成图片预览（内部方法）
   * @private
   */
  _generateImagePreview(file, options) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('生成预览失败'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * 生成PDF预览（内部方法）
   * @private
   */
  _generatePDFPreview(file) {
    // PDF预览通常需要使用PDF.js库或其他第三方库
    // 这里简单返回DataURL
    return this._generateImagePreview(file);
  }

  /**
   * 生成文本预览（内部方法）
   * @private
   */
  async _generateTextPreview(file) {
    const text = await this._readFileAsText(file);
    // 限制预览文本长度
    const previewText = text.length > 1000 ? text.substring(0, 1000) + '...' : text;
    return `data:text/plain;charset=utf-8,${encodeURIComponent(previewText)}`;
  }

  /**
   * 转换图片格式（内部方法）
   * @private
   */
  async _convertImageFormat(file, targetExtension) {
    // 使用canvas进行格式转换
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    const dataUrl = await this._generateImagePreview(file, {});
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const mimeType = `image/${targetExtension}`;
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('图片格式转换失败'));
            }
          },
          mimeType
        );
      };
      
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = dataUrl;
    });
  }

  /**
   * 保存Blob到文件（内部方法）
   * @private
   */
  _saveBlobToFile(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 获取文件扩展名（内部方法）
   * @private
   */
  _getExtension(fileName) {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex > -1 ? fileName.substring(lastDotIndex + 1) : '';
  }

  /**
   * 获取文件类型类别（内部方法）
   * @private
   */
  _getFileTypeCategory(extension) {
    for (const [category, extensions] of Object.entries(this.supportedFormats)) {
      if (extensions.includes(extension.toLowerCase())) {
        return category;
      }
    }
    return 'default';
  }

  /**
   * 格式化文件大小（内部方法）
   * @private
   */
  _formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 生成文件ID（内部方法）
   * @private
   */
  _generateFileId(file) {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 创建临时文件URL
   * @param {Blob|File} file - 文件对象
   * @returns {string} 临时URL
   */
  createObjectURL(file) {
    return URL.createObjectURL(file);
  }

  /**
   * 释放临时文件URL
   * @param {string} url - 临时URL
   */
  revokeObjectURL(url) {
    URL.revokeObjectURL(url);
  }

  /**
   * 检查浏览器支持
   * @returns {Object} 浏览器支持信息
   */
  checkBrowserSupport() {
    return {
      fileAPI: !!window.File && !!window.FileReader && !!window.FileList && !!window.Blob,
      xhr2: 'XMLHttpRequest' in window && 'upload' in new XMLHttpRequest(),
      formData: 'FormData' in window,
      blobURL: 'URL' in window && 'createObjectURL' in URL
    };
  }
}

// 导出单例实例
const fileProcessor = new FileProcessor();
export default fileProcessor;
export { FileProcessor };
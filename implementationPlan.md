# 實現將小巴靜態數據下載到本地存儲的計劃

## 目標
修改現有的緩存機制，使小巴的靜態數據（如路線號碼、起點和終點）能夠持久化存儲到 localStorage 中，從而在應用重啟後仍可使用這些數據。

## 修改內容

### 1. 修改 `services/cacheManager.ts`

#### 1.1 添加 localStorage 支持
- 添加 localStorage 前綴常量：
  ```typescript
  const LOCAL_STORAGE_PREFIX = 'hk_transit_hub_cache_';
  ```

- 添加輔助函數來生成 localStorage 鍵：
  ```typescript
  const getLocalStorageKey = (key: string) => `${LOCAL_STORAGE_PREFIX}${key}`;
  ```

#### 1.2 修改 `CacheManager` 類

- 在構造函數中添加從 localStorage 加載數據的功能：
  ```typescript
  class CacheManager {
    private cache = new Map<string, CacheItem<any>>();
    private defaultConfig: CacheConfig = {
      maxAge: 5 * 60 * 1000, // 5 minutes
      maxSize: 100
    };

    constructor() {
      this.loadFromLocalStorage();
    }

    private loadFromLocalStorage() {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(LOCAL_STORAGE_PREFIX)) {
            const itemStr = localStorage.getItem(key);
            if (itemStr) {
              const item: CacheItem<any> = JSON.parse(itemStr);
              // 檢查數據是否過期
              if (Date.now() <= item.expiresAt) {
                // 移除前綴以獲取原始鍵
                const originalKey = key.substring(LOCAL_STORAGE_PREFIX.length);
                this.cache.set(originalKey, item);
              } else {
                // 如果數據已過期，從 localStorage 中移除
                localStorage.removeItem(key);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to load cache from localStorage:', error);
      }
    }
  }
  ```

- 修改 `set` 方法以同時保存到 localStorage：
  ```typescript
  set<T>(key: string, data: T, config?: Partial<CacheConfig>): void {
    const finalConfig = { ...this.defaultConfig, ...config };
    const now = Date.now();
    
    // Remove expired items and enforce size limit
    this.cleanup();
    
    if (this.cache.size >= finalConfig.maxSize) {
      // Remove oldest item
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      // 同時從 localStorage 中移除
      localStorage.removeItem(getLocalStorageKey(oldestKey));
    }

    const cacheItem: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + finalConfig.maxAge
    };

    this.cache.set(key, cacheItem);
    
    // 保存到 localStorage
    try {
      localStorage.setItem(getLocalStorageKey(key), JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Failed to save cache to localStorage:', error);
    }
  }
  ```

- 修改 `delete` 方法以同時從 localStorage 中移除：
  ```typescript
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    // 同時從 localStorage 中移除
    localStorage.removeItem(getLocalStorageKey(key));
    return result;
  }
  ```

- 修改 `clear` 方法以同時清除 localStorage：
  ```typescript
  clear(): void {
    this.cache.clear();
    // 清除所有相關的 localStorage 項目
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  }
  ```

### 2. 修改 `services/minibusApi.ts`

#### 2.1 調整緩存配置
- 修改小巴路線數據的緩存時間，延長到 7 天：
  ```typescript
  // 在 CACHE_CONFIGS 中添加或修改
  MINIBUS_ROUTES: { maxAge: 7 * 24 * 60 * 60 * 1000, maxSize: 100 }, // 7天
  ```

#### 2.2 優化數據加載
- 在 `getMinibusRoutes` 函數中添加一個選項來強制刷新數據：
  ```typescript
  export const getMinibusRoutes = async (forceRefresh = false): Promise<MinibusRoute[]> => {
    // 如果不是強制刷新，先嘗試從緩存獲取
    if (!forceRefresh) {
      const cached = cacheManager.get<MinibusRoute[]>(MINIBUS_CACHE_KEYS.ROUTES);
      if (cached) return cached;
    }
    
    // 其餘代碼保持不變...
  }
  ```

### 3. 添加數據同步機制

#### 3.1 在應用啟動時預加載數據
- 修改 `preloadMinibusData` 函數以更好地處理錯誤：
  ```typescript
  export const preloadMinibusData = async () => {
    // 預加載關鍵小巴數據
    try {
      console.log('Preloading minibus data...');
      await getMinibusRoutes();
      console.log('Minibus data preloaded successfully');
    } catch (error) {
      console.error('Failed to preload minibus data:', error);
    }
  };
  ```

#### 3.2 添加手動刷新功能
- 添加一個新的函數來手動刷新小巴數據：
  ```typescript
  export const refreshMinibusData = async () => {
    try {
      console.log('Refreshing minibus data...');
      // 清除現有的緩存
      cacheManager.delete(MINIBUS_CACHE_KEYS.ROUTES);
      // 重新加載數據
      await getMinibusRoutes(true); // 強制刷新
      console.log('Minibus data refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh minibus data:', error);
    }
  };
  ```

## 數據新鮮度處理

### 1. 緩存過期時間
- 小巴路線數據：7天（從24小時延長）
- 小巴站點數據：1小時
- 小巴到站時間：30秒

### 2. 數據驗證
- 在從 localStorage 讀取數據時，檢查數據是否過期
- 如果數據過期，從 localStorage 中移除並返回 null

## 測試計劃

### 1. 單元測試
- 測試 localStorage 讀寫功能
- 測試數據過期處理
- 測試內存和 localStorage 數據一致性

### 2. 集成測試
- 測試應用重啟後數據是否正確加載
- 測試緩存更新機制
- 測試錯誤處理

### 3. 用戶體驗測試
- 驗證首次加載時間是否改善
- 驗證數據準確性
- 驗證離線使用體驗

## 部署計劃

### 1. 分階段部署
- 首先在測試環境部署
- 收集用戶反饋
- 根據反饋進行調整

### 2. 監控指標
- 緩存命中率
- 數據加載時間
- localStorage 使用量
- 錯誤率

### 3. 回滾計劃
- 如果出現問題，可以通過清除 localStorage 來回滾到原始狀態
- 提供手動清除緩存的選項

## 風險和緩解措施

### 1. localStorage 空間限制
- 風險：localStorage 有存儲限制（通常為 5-10MB）
- 緩解：實現智能清理機制，優先保留重要的小巴路線數據

### 2. 數據不一致
- 風險：內存緩存和 localStorage 數據可能不一致
- 緩解：在應用啟動時進行數據同步，確保一致性

### 3. 瀏覽器兼容性
- 風險：某些老舊瀏覽器可能不支持 localStorage
- 緩解：添加降級機制，如果 localStorage 不可用則回退到原始內存緩存

## 後續改進

### 1. 智能預加載
- 根據用戶使用習慣預加載常用路線的數據

### 2. 壓縮存儲
- 對存儲的數據進行壓縮以節省空間

### 3. 增量更新
- 實現增量更新機制，只更新變更的數據
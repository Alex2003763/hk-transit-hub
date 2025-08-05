# 巴士快取清除計畫

本計畫旨在實現應用程式啟動時自動清除巴士（九巴及小巴）快取的功能。

## 執行步驟

1.  **在 `services/cacheManager.ts` 中建立快取清除函式**
    *   新增一個名為 `clearBusCaches` 的 `export` 函式。
    *   此函式將負責從 `localStorage` 中移除所有與巴士相關的快取項目。
    *   預計要移除的快取鍵值 (keys) 包括：
        *   `kmb-routes`
        *   `minibus-routes`
        *   其他可能的相關快取...

2.  **在 `App.tsx` 中呼叫快取清除函式**
    *   在 `App` 元件中，使用 `useEffect` hook。
    *   在 `useEffect` 中呼叫從 `services/cacheManager.ts` 匯入的 `clearBusCaches` 函式。
    *   確保 `useEffect` 的依賴陣列 (dependency array) 為空 (`[]`)，這樣它只會在應用程式首次載入時執行一次。

## 程式碼範例

**services/cacheManager.ts**
```typescript
export const clearBusCaches = () => {
  // 清除九巴快取
  localStorage.removeItem('kmb-routes'); 
  // 清除小巴快取
  localStorage.removeItem('minibus-routes');
  console.log('巴士快取已清除');
};
```

**App.tsx**
```typescript
import React, { useEffect } from 'react';
import { clearBusCaches } from './services/cacheManager';
// ... 其他 import

function App() {
  useEffect(() => {
    clearBusCaches();
  }, []);

  // ... 其他元件邏輯
  return (
    // ... JSX
  );
}

export default App;
```

## 下一步

1.  審核此計畫。

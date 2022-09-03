# 學習如何使用 ESBuild 開發插件

## html-import-plugin
ESBuild 原生不支持通過 HTTP 從 CDN 拉取依賴，該插件對使用 CDN 引入的依賴套件進行路徑處理，使 ESBuild 能夠進行加載打包

- 實現方法
透過攔截 https/http 的路徑，先做 fetch 得到程式碼資源後，再給 ESBuild 做處理。  
另外間接路徑也需要過路徑處理。  

## html-plugin
ESBuild 將 js/css 打包後，我們還需要一個入口 HTML 文件載入 js/css 資源，雖然可以手寫一個 HTML ， 但產物名稱帶哈希值時，每次打包完都要更換路徑， 所以新增該插件來自動生成 HTML 檔
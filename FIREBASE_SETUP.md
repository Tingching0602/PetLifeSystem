# Firebase 設置指南

## 步驟 1：創建 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「新增專案」
3. 輸入專案名稱（例如：PetLife）
4. 選擇是否啟用 Google Analytics（建議啟用）
5. 完成專案創建

## 步驟 2：註冊應用程式

1. 在 Firebase 專案中，點擊「新增應用程式」
2. 選擇「網頁」圖示 (</>)
3. 輸入應用程式暱稱（例如：PetLife Web）
4. 勾選「設定 Firebase Hosting」（可選）
5. 點擊「註冊應用程式」
6. **複製 Firebase 配置代碼**，並貼到 `src/firebase.js` 中

範例配置：
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
}
```

## 步驟 3：啟用 Authentication

1. 在 Firebase Console 左側選單，點擊「Authentication」
2. 點擊「開始使用」
3. 在「Sign-in method」標籤頁中啟用以下登入方式：

### 3.1 啟用 Google 登入
1. 點擊「Google」
2. 點擊「啟用」開關
3. 選擇專案支援電子郵件
4. 點擊「儲存」

### 3.2 啟用 Facebook 登入
1. 前往 [Facebook for Developers](https://developers.facebook.com/)
2. 創建新應用程式
3. 在應用程式設定中，複製「應用程式編號」和「應用程式密鑰」
4. 回到 Firebase Console
5. 點擊「Facebook」
6. 點擊「啟用」開關
7. 貼上「應用程式編號」和「應用程式密鑰」
8. 複製「OAuth 重新導向 URI」
9. 回到 Facebook 開發者控制台
10. 在「Facebook 登入」→「設定」中，將 OAuth 重新導向 URI 加入「有效的 OAuth 重新導向 URI」
11. 儲存變更

### 3.3 啟用 Apple 登入
1. 前往 [Apple Developer](https://developer.apple.com/)
2. 登入並前往「Certificates, Identifiers & Profiles」
3. 創建新的 Service ID
4. 配置 Sign in with Apple
5. 回到 Firebase Console
6. 點擊「Apple」
7. 點擊「啟用」開關
8. 依照指示完成設定
9. 點擊「儲存」

**注意：** Apple 登入需要有付費的 Apple Developer 帳號

## 步驟 4：配置授權網域

1. 在 Firebase Authentication 設定中，點擊「Settings」標籤
2. 在「授權網域」區段，確認已添加：
   - `localhost`（開發環境）
   - 您的生產網域（部署後）

## 步驟 5：更新 App.vue

修改 `src/App.vue` 以整合登入功能：

```vue
<script setup>
import { ref } from 'vue'
import LoginPage from './components/LoginPage.vue'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
// ... 其他 imports

const isLoggedIn = ref(false)
const currentUser = ref(null)

onAuthStateChanged(auth, (user) => {
  isLoggedIn.value = !!user
  currentUser.value = user
})

const handleUserLoggedIn = (user) => {
  isLoggedIn.value = true
  currentUser.value = user
}

const handleUserLoggedOut = () => {
  isLoggedIn.value = false
  currentUser.value = null
}
</script>

<template>
  <div id="app">
    <LoginPage 
      v-if="!isLoggedIn" 
      @user-logged-in="handleUserLoggedIn"
    />
    <div v-else>
      <!-- 原有的應用程式內容 -->
      <header class="app-header">
        <!-- ... -->
      </header>
      <!-- ... -->
    </div>
  </div>
</template>
```

## 步驟 6：測試登入功能

1. 啟動開發伺服器：`npm run dev`
2. 打開瀏覽器
3. 測試各個登入方式

## 安全性建議

1. **設定安全規則**：在 Firebase Console 中設定適當的安全規則
2. **使用環境變數**：在生產環境中，將 Firebase 配置放在環境變數中
3. **啟用應用程式檢查**：防止未授權的應用程式存取您的 Firebase 資源
4. **監控使用情況**：定期檢查 Firebase Console 的使用情況和異常活動

## 常見問題

### Q: 登入時出現「popup-blocked」錯誤
**A:** 確保瀏覽器允許彈出視窗，或在手機上會自動使用 redirect 方式

### Q: Facebook 登入失敗
**A:** 確認已在 Facebook 開發者控制台正確設定 OAuth 重新導向 URI

### Q: Apple 登入不可用
**A:** Apple 登入需要 HTTPS 環境和付費的 Apple Developer 帳號

## 進階功能

如需實作以下功能，可參考 Firebase 文檔：
- 電子郵件/密碼登入
- 電話號碼登入
- 匿名登入
- 多重身份驗證 (MFA)
- 自訂身份驗證後端

## 參考資源

- [Firebase Authentication 文檔](https://firebase.google.com/docs/auth)
- [Firebase Web SDK 參考](https://firebase.google.com/docs/reference/js/auth)
- [Google 登入設定](https://firebase.google.com/docs/auth/web/google-signin)
- [Facebook 登入設定](https://firebase.google.com/docs/auth/web/facebook-login)
- [Apple 登入設定](https://firebase.google.com/docs/auth/web/apple)

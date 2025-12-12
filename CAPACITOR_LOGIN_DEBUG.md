# Capacitor 登入除錯指南

## ✅ 已完成的檢查項目

### 1. 移除所有 Email Link 程式碼
- ✅ 全域搜尋確認：專案中**沒有**任何 `sendSignInLinkToEmail`、`isSignInWithEmailLink`、`signInWithEmailLink` 相關程式碼
- ✅ firebase.js 配置檔案乾淨，只包含 OAuth 提供者
- ✅ LoginPage.vue 中沒有任何 Email 登入邏輯

### 2. 強化 Capacitor 登入錯誤處理
- ✅ 原生登入函式已加強日誌輸出
- ✅ catch 區塊中**只處理錯誤顯示**，不執行任何登入動作
- ✅ 詳細的錯誤日誌包含：錯誤碼、錯誤訊息、Provider、平台類型

### 3. 平台檢測
- ✅ 使用 `Capacitor.isNativePlatform()` 檢測是否在原生環境
- ✅ 原生平台只執行 `FirebaseAuthentication.signIn()`
- ✅ Web 平台只執行 `signInWithPopup()`

## 🔍 除錯步驟

### 步驟 1: 確認運行在 Capacitor 環境
在 Android Studio 或 Xcode 中打開專案並運行：

```bash
# Android
npx cap open android

# iOS
npx cap open ios
```

**重要**：必須通過 Android Studio 或實機安裝 APK 測試，不要使用瀏覽器或 PWA。

### 步驟 2: 查看 Console 日誌
點擊登入按鈕後，檢查 Console 輸出：

**預期輸出（原生環境）：**
```
開始原生 Google 登入...
確認運行在 Capacitor 原生環境
Capacitor 原生登入成功
登入成功，使用者 UID: xxx
=== Firebase 登入資訊 (Native) ===
```

**如果出現錯誤：**
```
========== 登入錯誤詳情 ==========
錯誤碼: xxx
錯誤訊息: xxx
是否為原生平台: true/false
================================
```

### 步驟 3: 檢查 Firebase Console 設定

1. **Authentication 設定**
   - 前往 [Firebase Console](https://console.firebase.google.com/)
   - 選擇專案 `petlife-3cedc`
   - Authentication → Sign-in method
   - 確認 Google、Facebook、Apple 登入已啟用

2. **Android 應用程式設定**
   - 前往 Project settings → Your apps
   - 確認已註冊 Android 應用程式
   - 下載最新的 `google-services.json`
   - 放置到 `android/app/` 目錄

3. **SHA-1 Fingerprint（Google 登入必需）**
   ```bash
   # 取得除錯簽章
   cd android
   ./gradlew signingReport
   
   # 複製 SHA-1 fingerprint
   # 在 Firebase Console → Project settings → Your apps → Android app
   # 新增 SHA certificate fingerprints
   ```

### 步驟 4: Google Cloud Console 檢查

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. API 與服務 → 憑證
3. 檢查 OAuth 2.0 客戶端 ID：

**應該有的客戶端：**
- ✅ Web 應用程式（用於 Web 環境）
- ✅ Android（用於 Android App）
- ✅ iOS（如果支援 iOS）

**不應該有的設定：**
- ❌ Web 應用程式的授權重新導向 URI 中不應包含 `__browser_redirect` 或 Android package name

## 🚨 常見問題排除

### 問題 1: 點擊登入後開啟信箱
**可能原因：**
- App 不是在 Capacitor 原生環境中運行
- `Capacitor.isNativePlatform()` 返回 false

**解決方法：**
1. 確認是通過 Android Studio 運行，不是瀏覽器
2. 檢查 `capacitor.config.json` 配置正確
3. 執行 `npx cap sync android` 同步插件

### 問題 2: 登入失敗，錯誤碼 10
**原因：** Google Play Services 配置問題

**解決方法：**
1. 確認 `google-services.json` 已正確放置
2. 檢查 SHA-1 fingerprint 已加入 Firebase Console
3. 重新建置 App

### 問題 3: 使用者取消登入（錯誤碼 cancelled）
**原因：** 正常行為，使用者點擊取消

**處理：** 已在程式碼中處理，顯示 3 秒提示訊息

## 📋 檢查清單

在測試前確認：
- [ ] 已執行 `npm install @capacitor-firebase/authentication --legacy-peer-deps`
- [ ] 已執行 `npx cap sync android`
- [ ] `google-services.json` 在 `android/app/` 目錄
- [ ] Firebase Console 中 Google 登入已啟用
- [ ] SHA-1 fingerprint 已加入 Firebase
- [ ] 通過 Android Studio 或 APK 安裝測試（不是瀏覽器）

## 🔧 重新建置步驟

如果修改了程式碼，重新建置：

```bash
# 1. 建置 Web 資源
npm run build

# 2. 同步到 Android
npx cap sync android

# 3. 開啟 Android Studio
npx cap open android

# 4. 在 Android Studio 中 Run App
```

## 📝 當前程式碼狀態

- ✅ 沒有任何 Email Link 相關程式碼
- ✅ 原生環境使用 `FirebaseAuthentication.signIn({ providerId })`
- ✅ Web 環境使用 `signInWithPopup()`
- ✅ 完整的錯誤日誌輸出
- ✅ catch 區塊不會執行意外的登入邏輯

<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>🐾 PetLife</h1>
        <p class="subtitle">寵物生活管理系統</p>
      </div>

      <div v-if="!user" class="login-content">
        <h2>歡迎回來</h2>
        <p class="login-description">請選擇登入方式</p>

        <!-- Email 登入/註冊表單 -->
        <div class="email-auth-section">
          <div class="tab-buttons">
            <button 
              :class="['tab-btn', { active: authMode === 'login' }]"
              @click="authMode = 'login'"
            >
              登入
            </button>
            <button 
              :class="['tab-btn', { active: authMode === 'register' }]"
              @click="authMode = 'register'"
            >
              註冊
            </button>
          </div>

          <form @submit.prevent="authMode === 'login' ? handleEmailLogin() : handleEmailRegister()" class="email-form">
            <div v-if="authMode === 'register'" class="form-group">
              <label>姓名</label>
              <input 
                v-model="registerForm.name" 
                type="text" 
                placeholder="請輸入您的姓名" 
                required
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Email</label>
              <input 
                v-if="authMode === 'login'"
                v-model="loginForm.email" 
                type="email" 
                placeholder="請輸入您的 Email" 
                required
                class="form-input"
              />
              <input 
                v-else
                v-model="registerForm.email" 
                type="email" 
                placeholder="請輸入您的 Email" 
                required
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>密碼</label>
              <input 
                v-if="authMode === 'login'"
                v-model="loginForm.password" 
                type="password" 
                placeholder="請輸入密碼" 
                required
                minlength="6"
                class="form-input"
              />
              <input 
                v-else
                v-model="registerForm.password" 
                type="password" 
                placeholder="請輸入密碼（至少6個字元）" 
                required
                minlength="6"
                class="form-input"
              />
            </div>

            <button type="submit" class="submit-btn">
              {{ authMode === 'login' ? '登入' : '註冊' }}
            </button>
          </form>

          <div class="divider">
            <span>或使用第三方登入</span>
          </div>
        </div>

        <div class="login-buttons">
          <button @click="signInWithGoogle" class="login-btn google-btn">
            <svg class="btn-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            使用 Google 登入
          </button>

          <button @click="signInWithFacebook" class="login-btn facebook-btn">
            <svg class="btn-icon" viewBox="0 0 24 24">
              <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            使用 Facebook 登入
          </button>

          <button @click="signInWithApple" class="login-btn apple-btn">
            <svg class="btn-icon" viewBox="0 0 24 24">
              <path fill="#000000" d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            使用 Apple 登入
          </button>
        </div>

        <p class="login-footer">
          登入即表示您同意我們的服務條款和隱私政策
        </p>
      </div>

      <div v-else class="user-info">
        <div class="user-avatar">
          <img v-if="user.photoURL" :src="user.photoURL" :alt="user.displayName" />
          <span v-else class="avatar-placeholder">{{ user.displayName?.charAt(0) || '👤' }}</span>
        </div>
        <h3>歡迎，{{ user.displayName || user.email }}</h3>
        <p class="user-email">{{ user.email }}</p>
        
        <!-- 顯示登入方式 -->
        <div class="user-provider">
          <span class="provider-label">登入方式：</span>
          <span class="provider-value">{{ getProviderName() }}</span>
        </div>

        <!-- 顯示除錯資訊 -->
        <div style="font-size: 12px; color: #999; margin-bottom: 15px;">
          Provider ID: {{ user.providerData?.[0]?.providerId || 'unknown' }}
        </div>

        <!-- 修改密碼區域 - 暫時移除條件以測試 -->
        <div class="password-section">
          <p style="font-size: 12px; color: #666; margin-bottom: 10px;">
            isEmailPasswordAccount: {{ isEmailPasswordAccount() }}
          </p>
          
          <button 
            v-if="!showPasswordChange" 
            @click="showPasswordChange = true" 
            class="change-password-btn"
          >
            修改密碼
          </button>

          <div v-else class="password-change-form">
            <h4>修改密碼</h4>
            <div class="form-group">
              <label>目前密碼</label>
              <input 
                v-model="passwordChange.currentPassword" 
                type="password" 
                placeholder="請輸入目前密碼" 
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>新密碼</label>
              <input 
                v-model="passwordChange.newPassword" 
                type="password" 
                placeholder="請輸入新密碼（至少6個字元）" 
                minlength="6"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>確認新密碼</label>
              <input 
                v-model="passwordChange.confirmPassword" 
                type="password" 
                placeholder="請再次輸入新密碼" 
                minlength="6"
                class="form-input"
              />
            </div>
            <div class="password-actions">
              <button @click="handlePasswordChange" class="save-password-btn">
                儲存
              </button>
              <button @click="cancelPasswordChange" class="cancel-btn">
                取消
              </button>
            </div>
          </div>
        </div>

        <button @click="signOut" class="logout-btn">登出</button>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { auth } from '../firebase'
import { 
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  fetchSignInMethodsForEmail
} from 'firebase/auth'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { Capacitor } from '@capacitor/core'

export default {
  name: 'LoginPage',
  setup(props, { emit }) {
    const user = ref(null)
    const error = ref('')
    const authMode = ref('login') // 'login' or 'register'
    
    const loginForm = ref({
      email: '',
      password: ''
    })
    
    const registerForm = ref({
      name: '',
      email: '',
      password: ''
    })

    const showPasswordChange = ref(false)
    const passwordChange = ref({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    // 監聽登入狀態
    onMounted(() => {
      onAuthStateChanged(auth, (currentUser) => {
        user.value = currentUser
        if (currentUser) {
          emit('user-logged-in', currentUser)
        }
      })
    })

    const isNativePlatform = () => {
      return Capacitor.isNativePlatform()
    }

    const handleError = (err) => {
      console.error('登入錯誤：', err)
      
      // 處理 Capacitor 插件的錯誤碼
      if (err.code === 'cancelled') {
        error.value = '使用者取消了登入'
        setTimeout(() => { error.value = '' }, 3000)
        return
      }
      
      switch (err.code) {
        case 'auth/popup-closed-by-user':
          error.value = '登入已取消'
          break
        case 'auth/popup-blocked':
          error.value = '彈出視窗被阻擋，請允許彈出視窗'
          break
        case 'auth/account-exists-with-different-credential':
          error.value = '此電子郵件已使用其他方式註冊，請使用相同的登入方式'
          break
        case 'auth/cancelled-popup-request':
          error.value = '登入請求已取消'
          break
        default:
          error.value = `登入失敗：${err.message}`
      }
      
      setTimeout(() => {
        error.value = ''
      }, 5000)
    }

    const signInWithProvider = async (providerName) => {
      try {
        error.value = ''
        const firebaseAuth = getAuth()
        
        // 在原生平台使用 Capacitor Firebase Authentication
        if (isNativePlatform()) {
          console.log(`開始原生 ${providerName} 登入...`)
          console.log('確認運行在 Capacitor 原生環境')
          
          let providerId
          if (providerName === 'Google') {
            providerId = GoogleAuthProvider.PROVIDER_ID
          } else if (providerName === 'Facebook') {
            providerId = FacebookAuthProvider.PROVIDER_ID
          } else if (providerName === 'Apple') {
            providerId = new OAuthProvider('apple.com').providerId
          }
          
          // 只執行原生登入，不執行任何 Web 或 Email 邏輯
          const result = await FirebaseAuthentication.signIn({
            providerId: providerId,
          })
          
          console.log('Capacitor 原生登入成功')
          
          // 登入成功後，結果物件包含 user (Firebase User)
          if (result && result.user) {
            console.log('登入成功，使用者 UID:', result.user.uid)
            console.log('=== Firebase 登入資訊 (Native) ===')
            console.log('Provider:', providerName)
            console.log('User ID:', result.user.uid)
            console.log('Email:', result.user.email)
            console.log('Display Name:', result.user.displayName)
            
            // 取得 ID Token
            const currentUser = firebaseAuth.currentUser
            if (currentUser) {
              const token = await currentUser.getIdToken()
              console.log('ID Token:', token)
              user.value = currentUser
              emit('user-logged-in', currentUser)
            }
            console.log('==================================')
          }
        } else {
          // Web 環境使用 Firebase Web SDK
          console.log(`開始 Web ${providerName} 登入...`)
          const { signInWithPopup } = await import('firebase/auth')
          const { googleProvider, facebookProvider, appleProvider } = await import('../firebase')
          
          let selectedProvider
          if (providerName === 'Google') selectedProvider = googleProvider
          else if (providerName === 'Facebook') selectedProvider = facebookProvider
          else if (providerName === 'Apple') selectedProvider = appleProvider
          
          const result = await signInWithPopup(firebaseAuth, selectedProvider)
          user.value = result.user
          
          const token = await result.user.getIdToken()
          console.log('=== Firebase 登入資訊 (Web) ===')
          console.log('Provider:', providerName)
          console.log('User ID:', result.user.uid)
          console.log('Email:', result.user.email)
          console.log('Display Name:', result.user.displayName)
          console.log('ID Token:', token)
          console.log('===============================')
          
          emit('user-logged-in', result.user)
        }
      } catch (err) {
        console.error('========== 登入錯誤詳情 ==========')
        console.error('錯誤碼:', err.code)
        console.error('錯誤訊息:', err.message)
        console.error('完整錯誤:', err)
        console.error('Provider:', providerName)
        console.error('是否為原生平台:', isNativePlatform())
        console.error('================================')
        
        // 確保這裡沒有任何呼叫 Web 或 Email Link 的程式碼
        // 只處理錯誤顯示，不執行任何登入動作
        handleError(err)
      }
    }

    const signInWithGoogle = () => signInWithProvider('Google')
    const signInWithFacebook = () => signInWithProvider('Facebook')
    const signInWithApple = () => signInWithProvider('Apple')

    // Email 註冊
    const handleEmailRegister = async () => {
      try {
        error.value = ''
        const firebaseAuth = getAuth()
        
        console.log('開始 Email 註冊...')
        
        // 建立帳號
        const userCredential = await createUserWithEmailAndPassword(
          firebaseAuth,
          registerForm.value.email,
          registerForm.value.password
        )
        
        // 更新使用者名稱
        await updateProfile(userCredential.user, {
          displayName: registerForm.value.name
        })
        
        console.log('註冊成功！')
        console.log('使用者 UID:', userCredential.user.uid)
        console.log('使用者名稱:', registerForm.value.name)
        console.log('Email:', userCredential.user.email)
        
        user.value = userCredential.user
        emit('user-logged-in', userCredential.user)
        
        // 清空表單
        registerForm.value = { name: '', email: '', password: '' }
        
      } catch (err) {
        console.error('註冊錯誤：', err)
        
        switch (err.code) {
          case 'auth/operation-not-allowed':
            error.value = '請先到 Firebase Console 啟用 Email/Password 登入方式'
            console.error('請前往 Firebase Console → Authentication → Sign-in method → Email/Password，啟用此登入方式')
            break
          case 'auth/email-already-in-use':
            // 檢查該 Email 使用哪種登入方式
            try {
              const signInMethods = await fetchSignInMethodsForEmail(firebaseAuth, registerForm.value.email)
              console.log('此 Email 的登入方式:', signInMethods)
              
              if (signInMethods.length > 0) {
                const method = signInMethods[0]
                let providerName = ''
                
                // fetchSignInMethodsForEmail 回傳的格式：
                // 'password' - Email/密碼
                // 'google.com' - Google
                // 'facebook.com' - Facebook
                // 'apple.com' - Apple
                if (method === 'password') {
                  providerName = 'Email/密碼'
                } else if (method === 'google.com') {
                  providerName = 'Google'
                } else if (method === 'facebook.com') {
                  providerName = 'Facebook'
                } else if (method === 'apple.com' || method.includes('apple')) {
                  providerName = 'Apple'
                } else {
                  providerName = method
                }
                
                error.value = `此 Email 已被註冊過，請使用 ${providerName} 登入`
              } else {
                error.value = '此 Email 已被註冊'
              }
            } catch (fetchErr) {
              console.error('無法取得登入方式:', fetchErr)
              error.value = '此 Email 已被註冊'
            }
            break
          case 'auth/invalid-email':
            error.value = 'Email 格式不正確'
            break
          case 'auth/weak-password':
            error.value = '密碼強度不足，至少需要6個字元'
            break
          default:
            error.value = `註冊失敗：${err.message}`
        }
        
        setTimeout(() => { error.value = '' }, 5000)
      }
    }

    // Email 登入
    const handleEmailLogin = async () => {
      try {
        error.value = ''
        const firebaseAuth = getAuth()
        
        console.log('開始 Email 登入...')
        
        const userCredential = await signInWithEmailAndPassword(
          firebaseAuth,
          loginForm.value.email,
          loginForm.value.password
        )
        
        console.log('登入成功！')
        console.log('使用者 UID:', userCredential.user.uid)
        console.log('使用者名稱:', userCredential.user.displayName)
        console.log('Email:', userCredential.user.email)
        
        user.value = userCredential.user
        emit('user-logged-in', userCredential.user)
        
        // 清空表單
        loginForm.value = { email: '', password: '' }
        
      } catch (err) {
        console.error('登入錯誤：', err)
        
        switch (err.code) {
          case 'auth/user-not-found':
            error.value = '找不到此帳號，請先註冊'
            break
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            // 檢查該 Email 使用哪種登入方式
            try {
              const signInMethods = await fetchSignInMethodsForEmail(firebaseAuth, loginForm.value.email)
              console.log('此 Email 的登入方式:', signInMethods)
              
              if (signInMethods.length > 0) {
                const method = signInMethods[0]
                let providerName = ''
                
                // fetchSignInMethodsForEmail 回傳的格式：
                // 'password' - Email/密碼
                // 'google.com' - Google
                // 'facebook.com' - Facebook
                // 'apple.com' - Apple
                if (method === 'password') {
                  providerName = 'Email/密碼'
                } else if (method === 'google.com') {
                  providerName = 'Google'
                } else if (method === 'facebook.com') {
                  providerName = 'Facebook'
                } else if (method === 'apple.com' || method.includes('apple')) {
                  providerName = 'Apple'
                } else {
                  providerName = method
                }
                
                if (method === 'password') {
                  error.value = '密碼錯誤'
                } else {
                  error.value = `此帳號是使用 ${providerName} 註冊的，請使用 ${providerName} 登入`
                }
              } else {
                error.value = 'Email 或密碼錯誤'
              }
            } catch (fetchErr) {
              console.error('無法取得登入方式:', fetchErr)
              error.value = 'Email 或密碼錯誤'
            }
            break
          case 'auth/invalid-email':
            error.value = 'Email 格式不正確'
            break
          default:
            error.value = `登入失敗：${err.message}`
        }
        
        setTimeout(() => { error.value = '' }, 5000)
      }
    }

    const signOut = async () => {
      try {
        await firebaseSignOut(auth)
        user.value = null
        emit('user-logged-out')
      } catch (err) {
        console.error('登出錯誤：', err)
        error.value = '登出失敗，請重試'
      }
    }

    // 取得登入方式名稱
    const getProviderName = () => {
      if (!user.value) return '未知'
      
      const providerData = user.value.providerData
      if (providerData && providerData.length > 0) {
        const providerId = providerData[0].providerId
        
        switch (providerId) {
          case 'google.com':
            return 'Google'
          case 'facebook.com':
            return 'Facebook'
          case 'apple.com':
            return 'Apple'
          case 'password':
            return 'Email/密碼'
          default:
            return providerId
        }
      }
      return 'Email/密碼'
    }

    // 檢查是否為 Email/Password 帳號
    const isEmailPasswordAccount = () => {
      if (!user.value) return false
      
      const providerData = user.value.providerData
      if (providerData && providerData.length > 0) {
        return providerData[0].providerId === 'password'
      }
      return false
    }

    // 修改密碼
    const handlePasswordChange = async () => {
      try {
        error.value = ''
        
        // 驗證輸入
        if (!passwordChange.value.currentPassword) {
          error.value = '請輸入目前密碼'
          return
        }
        if (!passwordChange.value.newPassword) {
          error.value = '請輸入新密碼'
          return
        }
        if (passwordChange.value.newPassword.length < 6) {
          error.value = '新密碼至少需要6個字元'
          return
        }
        if (passwordChange.value.newPassword !== passwordChange.value.confirmPassword) {
          error.value = '新密碼與確認密碼不符'
          return
        }
        if (passwordChange.value.currentPassword === passwordChange.value.newPassword) {
          error.value = '新密碼不能與目前密碼相同'
          return
        }

        const currentUser = auth.currentUser
        if (!currentUser || !currentUser.email) {
          error.value = '無法取得使用者資訊'
          return
        }

        console.log('開始修改密碼...')

        // 重新驗證使用者（修改密碼前必須重新驗證）
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          passwordChange.value.currentPassword
        )
        
        await reauthenticateWithCredential(currentUser, credential)
        console.log('重新驗證成功')

        // 更新密碼
        await updatePassword(currentUser, passwordChange.value.newPassword)
        console.log('密碼更新成功')

        // 清空表單並關閉修改密碼介面
        passwordChange.value = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
        showPasswordChange.value = false

        // 顯示成功訊息
        alert('密碼修改成功！')

      } catch (err) {
        console.error('修改密碼錯誤：', err)
        
        switch (err.code) {
          case 'auth/wrong-password':
            error.value = '目前密碼錯誤'
            break
          case 'auth/weak-password':
            error.value = '新密碼強度不足，至少需要6個字元'
            break
          case 'auth/requires-recent-login':
            error.value = '請先登出後重新登入，再修改密碼'
            break
          case 'auth/invalid-credential':
            error.value = '目前密碼錯誤'
            break
          default:
            error.value = `修改密碼失敗：${err.message}`
        }
        
        setTimeout(() => { error.value = '' }, 5000)
      }
    }

    // 取消修改密碼
    const cancelPasswordChange = () => {
      passwordChange.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
      showPasswordChange.value = false
      error.value = ''
    }

    return {
      user,
      error,
      authMode,
      loginForm,
      registerForm,
      showPasswordChange,
      passwordChange,
      handleEmailLogin,
      handleEmailRegister,
      signInWithGoogle,
      signInWithFacebook,
      signInWithApple,
      getProviderName,
      isEmailPasswordAccount,
      handlePasswordChange,
      cancelPasswordChange,
      signOut
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 450px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  margin: 0;
  font-size: 2.5em;
  color: #2c3e50;
  font-weight: 700;
}

.subtitle {
  margin: 10px 0 0 0;
  color: #666;
  font-size: 1.1em;
}

.login-content h2 {
  text-align: center;
  color: #2c3e50;
  margin: 0 0 10px 0;
  font-size: 1.8em;
}

.login-description {
  text-align: center;
  color: #666;
  margin: 0 0 30px 0;
  font-size: 0.95em;
}

.email-auth-section {
  margin-bottom: 20px;
}

.tab-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  border: 2px solid #ddd;
  background: white;
  color: #666;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.tab-btn:hover:not(.active) {
  border-color: #667eea;
  color: #667eea;
}

.email-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.form-input {
  padding: 12px 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.submit-btn {
  padding: 14px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 5px;
}

.submit-btn:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.submit-btn:active {
  transform: translateY(0);
}

.divider {
  position: relative;
  text-align: center;
  margin: 25px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #ddd;
}

.divider span {
  position: relative;
  background: white;
  padding: 0 15px;
  color: #999;
  font-size: 14px;
}

.login-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 24px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.login-btn:active {
  transform: translateY(0);
}

.btn-icon {
  width: 24px;
  height: 24px;
}

.google-btn {
  background: white;
  color: #333;
  border: 2px solid #ddd;
}

.google-btn:hover {
  border-color: #4285F4;
  background: #f8f9fa;
}

.facebook-btn {
  background: #1877F2;
  color: white;
}

.facebook-btn:hover {
  background: #1664d6;
}

.apple-btn {
  background: #000000;
  color: white;
}

.apple-btn:hover {
  background: #333333;
}

.login-footer {
  text-align: center;
  font-size: 0.85em;
  color: #999;
  margin: 20px 0 0 0;
  line-height: 1.5;
}

.user-info {
  text-align: center;
}

.user-avatar {
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #42b983;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 48px;
}

.user-info h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 1.5em;
}

.user-email {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 0.95em;
}

.user-provider {
  margin: 0 0 20px 0;
  padding: 10px 15px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.provider-label {
  color: #666;
  font-size: 0.9em;
}

.provider-value {
  color: #2c3e50;
  font-weight: 600;
  font-size: 0.9em;
}

.password-section {
  margin-bottom: 20px;
  width: 100%;
}

.change-password-btn {
  background: #667eea;
  color: white;
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 15px;
}

.change-password-btn:hover {
  background: #5568d3;
  transform: translateY(-2px);
}

.password-change-form {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 15px;
}

.password-change-form h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 1.1em;
  text-align: center;
}

.password-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.save-password-btn {
  flex: 1;
  background: #42b983;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.save-password-btn:hover {
  background: #38a372;
  transform: translateY(-2px);
}

.cancel-btn {
  flex: 1;
  background: #ccc;
  color: #666;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-btn:hover {
  background: #bbb;
  transform: translateY(-2px);
}

.logout-btn {
  background: #f44336;
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: #d32f2f;
  transform: translateY(-2px);
}

.error-message {
  margin-top: 20px;
  padding: 12px;
  background: #ffebee;
  color: #d32f2f;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  border: 1px solid #ffcdd2;
}

@media (max-width: 480px) {
  .login-container {
    padding: 30px 20px;
  }

  .login-header h1 {
    font-size: 2em;
  }

  .login-content h2 {
    font-size: 1.5em;
  }

  .login-btn {
    padding: 12px 20px;
    font-size: 15px;
  }
}
</style>

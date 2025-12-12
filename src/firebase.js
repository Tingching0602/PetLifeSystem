import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from 'firebase/auth'

// Firebase 配置
// 請到 Firebase Console (https://console.firebase.google.com/) 創建專案並獲取配置
const firebaseConfig = {
  apiKey: "AIzaSyBSKkMOk1-2BlXwhuCZ6j9KZPhyDt_Inmg",
  authDomain: "petlife-3cedc.firebaseapp.com",
  projectId: "petlife-3cedc",
  storageBucket: "petlife-3cedc.firebasestorage.app",
  messagingSenderId: "494612863366",
  appId: "1:494612863366:web:fb2fb503e7b9e0ae3e3407",
  measurementId: "G-LJBYE5XFHW"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig)

// 初始化 Firebase Authentication
const auth = getAuth(app)

// 配置第三方登入提供者
const googleProvider = new GoogleAuthProvider()
const facebookProvider = new FacebookAuthProvider()
const appleProvider = new OAuthProvider('apple.com')

// 可選：設置提供者的額外參數
googleProvider.setCustomParameters({
  prompt: 'select_account'
})

export { auth, googleProvider, facebookProvider, appleProvider }

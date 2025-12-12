<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import LoginPage from './components/LoginPage.vue'
import FeedingRecord from './components/FeedingRecord.vue'
import HealthRecord from './components/HealthRecord.vue'
import MedicalRecord from './components/MedicalRecord.vue'
import InventoryManagement from './components/InventoryManagement.vue'
import PetDiary from './components/PetDiary.vue'
import ExpenseChart from './components/ExpenseChart.vue'
import { auth } from './firebase'
import { PetsAPI } from './services/api.js'
import { getImageUrl, revokeImageUrl } from './utils/imageService'
import { 
  onAuthStateChanged, 
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth'

const isLoggedIn = ref(false)
const currentUser = ref(null)
const showUserMenu = ref(false)
const showPasswordChange = ref(false)
const passwordChange = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordError = ref('')

const activeTab = ref('feeding')
const currentPetId = ref(null)
const pets = ref([])
const petAvatarUrls = ref({}) // 儲存轉換後的寵物頭貼 URLs
const showPetModal = ref(false)
const newPetName = ref('')
const newPetSpecies = ref('狗') // Species
const newPetBreed = ref('')
const customPetType = ref('')
const showCustomType = ref(false)
const newPetBirthDate = ref('') // BirthDate
const newPetAdoptDate = ref('') // AdoptDate
const newPetGender = ref('未知')
const newPetWeightKg = ref('') // WeightKg
const newPetNeutered = ref(false) // Neutered (boolean)
const newPetMicrochipNumber = ref('') // MicrochipNumber
const newPetColor = ref('') // Color
const newPetAvatarUrl = ref('') // AvatarUrl
const newPetNotes = ref('') // Notes
const showPetInfo = ref(false)
const selectedPetInfo = ref(null)
const isEditingPet = ref(false)
const editPetData = ref({
  name: '',
  species: '',
  breed: '',
  gender: '',
  birthDate: '',
  adoptDate: '',
  weightKg: '',
  neutered: false,
  microchipNumber: '',
  color: '',
  avatarUrl: '',
  notes: ''
})
const editCustomType = ref('')
const showEditCustomType = ref(false)

// 監聽 Firebase 登入狀態
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    isLoggedIn.value = !!user
    currentUser.value = user
    
    // 如果用戶已登入，載入寵物列表
    if (user) {
      loadPetsData()
    }
  })
})

const handleUserLoggedIn = (user) => {
  isLoggedIn.value = true
  currentUser.value = user
  loadPetsData()
}

const handleUserLoggedOut = () => {
  isLoggedIn.value = false
  currentUser.value = null
  pets.value = []
  currentPetId.value = null
}

// 登出功能
const handleSignOut = async () => {
  if (confirm('確定要登出嗎？')) {
    try {
      await signOut(auth)
      handleUserLoggedOut()
    } catch (err) {
      console.error('登出錯誤：', err)
      alert('登出失敗，請重試')
    }
  }
}

// 切換使用者選單
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

// 點擊外部關閉選單
const closeUserMenu = () => {
  showUserMenu.value = false
  showPasswordChange.value = false
  passwordError.value = ''
}

// 取得登入方式名稱
const getProviderName = () => {
  if (!currentUser.value) return '未知'
  
  const providerData = currentUser.value.providerData
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
  if (!currentUser.value) return false
  
  const providerData = currentUser.value.providerData
  if (providerData && providerData.length > 0) {
    return providerData[0].providerId === 'password'
  }
  return false
}

// 顯示修改密碼表單
const openPasswordChange = () => {
  showPasswordChange.value = true
  passwordError.value = ''
}

// 取消修改密碼
const cancelPasswordChange = () => {
  showPasswordChange.value = false
  passwordChange.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  passwordError.value = ''
}

// 修改密碼
const handlePasswordChange = async () => {
  try {
    passwordError.value = ''
    
    // 驗證輸入
    if (!passwordChange.value.currentPassword) {
      passwordError.value = '請輸入目前密碼'
      return
    }
    if (!passwordChange.value.newPassword) {
      passwordError.value = '請輸入新密碼'
      return
    }
    if (passwordChange.value.newPassword.length < 6) {
      passwordError.value = '新密碼至少需要6個字元'
      return
    }
    if (passwordChange.value.newPassword !== passwordChange.value.confirmPassword) {
      passwordError.value = '新密碼與確認密碼不符'
      return
    }
    if (passwordChange.value.currentPassword === passwordChange.value.newPassword) {
      passwordError.value = '新密碼不能與目前密碼相同'
      return
    }

    if (!currentUser.value || !currentUser.value.email) {
      passwordError.value = '無法取得使用者資訊'
      return
    }

    console.log('開始修改密碼...')

    // 重新驗證使用者（修改密碼前必須重新驗證）
    const credential = EmailAuthProvider.credential(
      currentUser.value.email,
      passwordChange.value.currentPassword
    )
    
    await reauthenticateWithCredential(currentUser.value, credential)
    console.log('重新驗證成功')

    // 更新密碼
    await updatePassword(currentUser.value, passwordChange.value.newPassword)
    console.log('密碼更新成功')

    // 清空表單並關閉修改密碼介面
    passwordChange.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    showPasswordChange.value = false
    showUserMenu.value = false

    // 顯示成功訊息
    alert('密碼修改成功！')

  } catch (err) {
    console.error('修改密碼錯誤：', err)
    
    switch (err.code) {
      case 'auth/wrong-password':
        passwordError.value = '目前密碼錯誤'
        break
      case 'auth/weak-password':
        passwordError.value = '新密碼強度不足，至少需要6個字元'
        break
      case 'auth/requires-recent-login':
        passwordError.value = '請先登出後重新登入，再修改密碼'
        break
      case 'auth/invalid-credential':
        passwordError.value = '目前密碼錯誤'
        break
      default:
        passwordError.value = `修改密碼失敗：${err.message}`
    }
  }
}

const loadPetsData = async () => {
  try {
    // 從 API 載入寵物資料
    const apiPets = await PetsAPI.getAll()
    pets.value = apiPets
    
    // 載入所有寵物的頭貼圖片
    await loadPetAvatars()
    
    if (pets.value.length > 0) {
      const lastPetId = localStorage.getItem('lastSelectedPetId')
      currentPetId.value = lastPetId ? parseInt(lastPetId) : pets.value[0].id
    }
  } catch (error) {
    console.error('載入寵物資料失敗：', error)
    // 如果 API 失敗，嘗試從 localStorage 載入（離線備援）
    const savedPets = localStorage.getItem('petsList')
    if (savedPets) {
      pets.value = JSON.parse(savedPets)
      // 載入所有寵物的頭貼圖片
      await loadPetAvatars()
      if (pets.value.length > 0) {
        const lastPetId = localStorage.getItem('lastSelectedPetId')
        currentPetId.value = lastPetId ? parseInt(lastPetId) : pets.value[0].id
      }
    }
  }
}

// 載入寵物頭貼圖片
const loadPetAvatars = async () => {
  const urls = {}
  for (const pet of pets.value) {
    if (pet.avatarUrl) {
      urls[pet.id] = await getImageUrl(pet.avatarUrl)
    }
  }
  petAvatarUrls.value = urls
}

// 當前寵物資訊
const currentPet = computed(() => {
  return pets.value.find(pet => pet.id === currentPetId.value)
})

// 切換寵物時更新 localStorage 標記
watch(currentPetId, (newId) => {
  if (newId) {
    localStorage.setItem('lastSelectedPetId', newId.toString())
  }
})

// 新增寵物
const addPet = async () => {
  if (!newPetName.value.trim()) {
    alert('請輸入寵物名字')
    return
  }
  
  // 如果選擇自訂種類，使用自訂輸入的值
  let petSpecies = newPetSpecies.value
  if (showCustomType.value) {
    if (!customPetType.value.trim()) {
      alert('請輸入自訂寵物種類')
      return
    }
    petSpecies = customPetType.value.trim()
  }
  
  const newPet = {
    name: newPetName.value.trim(),
    species: petSpecies,
    breed: newPetBreed.value.trim() || null,
    gender: newPetGender.value !== '未知' ? newPetGender.value : null,
    birthDate: newPetBirthDate.value || null,
    adoptDate: newPetAdoptDate.value || null,
    weightKg: newPetWeightKg.value ? parseFloat(newPetWeightKg.value) : null,
    neutered: newPetNeutered.value,
    microchipNumber: newPetMicrochipNumber.value.trim() || null,
    color: newPetColor.value.trim() || null,
    avatarUrl: newPetAvatarUrl.value || null,
    notes: newPetNotes.value.trim() || null
  }
  
  try {
    // 呼叫 API 新增寵物
    const createdPet = await PetsAPI.create(newPet)
    
    // 使用 push 添加到列表，觸發響應式更新
    pets.value.push(createdPet)
    
    // 同步到 localStorage 作為備援
    localStorage.setItem('petsList', JSON.stringify(pets.value))
    
    // 設定為當前寵物
    currentPetId.value = createdPet.id
    localStorage.setItem('lastSelectedPetId', createdPet.id.toString())
    
    showPetModal.value = false
    
    // 重置表單
    newPetName.value = ''
    newPetSpecies.value = '狗'
    newPetBreed.value = ''
    customPetType.value = ''
    showCustomType.value = false
    newPetBirthDate.value = ''
    newPetAdoptDate.value = ''
    newPetGender.value = '未知'
    newPetWeightKg.value = ''
    newPetNeutered.value = false
    newPetMicrochipNumber.value = ''
    newPetColor.value = ''
    newPetAvatarUrl.value = ''
    newPetNotes.value = ''
  } catch (error) {
    console.error('新增寵物失敗：', error)
    alert('新增寵物失敗：' + error.message)
  }
}

// 取得寵物圖示
const getPetIcon = (species) => {
  const icons = {
    '狗': '🐶',
    '貓': '🐱',
    '兔子': '🐰',
    '鳥': '🐦',
    '倉鼠': '🐹',
    '天竺鼠': '🐹',
    '魚': '🐟',
    '烏龜': '🐢',
    '蘭蝕': '🦎',
    '其他': '🐾'
  }
  return icons[species] || '🐾'
}

// 計算年齡
const calculateAge = (birthDate) => {
  if (!birthDate) return '未知'
  
  const birth = new Date(birthDate)
  const today = new Date()
  
  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  let days = today.getDate() - birth.getDate()
  
  if (days < 0) {
    months--
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    days += lastMonth.getDate()
  }
  
  if (months < 0) {
    years--
    months += 12
  }
  
  if (years > 0) {
    return `${years} 歲 ${months} 個月`
  } else if (months > 0) {
    return `${months} 個月 ${days} 天`
  } else {
    return `${days} 天`
  }
}

// 顯示寵物詳細資訊
const showPetDetail = (pet) => {
  selectedPetInfo.value = pet
  showPetInfo.value = true
}

// 關閉寵物詳細資訊
const closePetInfo = () => {
  showPetInfo.value = false
  selectedPetInfo.value = null
  isEditingPet.value = false
}

// 進入編輯模式
const startEditPet = () => {
  if (!selectedPetInfo.value) return
  
  editPetData.value = {
    name: selectedPetInfo.value.name,
    species: selectedPetInfo.value.species,
    breed: selectedPetInfo.value.breed || '',
    gender: selectedPetInfo.value.gender || '未知',
    birthDate: selectedPetInfo.value.birthDate || '',
    adoptDate: selectedPetInfo.value.adoptDate || '',
    weightKg: selectedPetInfo.value.weightKg || '',
    neutered: selectedPetInfo.value.neutered || false,
    microchipNumber: selectedPetInfo.value.microchipNumber || '',
    color: selectedPetInfo.value.color || '',
    avatarUrl: selectedPetInfo.value.avatarUrl || '',
    notes: selectedPetInfo.value.notes || ''
  }
  
  // 檢查是否為自訂種類
  const standardTypes = ['狗', '貓', '兔子', '鳥', '倉鼠', '天竺鼠', '其他']
  if (!standardTypes.includes(selectedPetInfo.value.species)) {
    showEditCustomType.value = true
    editCustomType.value = selectedPetInfo.value.species
    editPetData.value.species = '自訂'
  } else {
    showEditCustomType.value = false
    editCustomType.value = ''
  }
  
  isEditingPet.value = true
}

// 取消編輯
const cancelEditPet = () => {
  isEditingPet.value = false
  editCustomType.value = ''
  showEditCustomType.value = false
}

// 儲存編輯
const saveEditPet = async () => {
  if (!selectedPetInfo.value || !editPetData.value.name.trim()) {
    alert('請輸入寵物名字')
    return
  }
  
  // 處理自訂種類
  let petSpecies = editPetData.value.species
  if (showEditCustomType.value) {
    if (!editCustomType.value.trim()) {
      alert('請輸入自訂寵物種類')
      return
    }
    petSpecies = editCustomType.value.trim()
  }
  
  // 準備更新資料 - 保留所有原始資料，只更新有修改的欄位
  const updatedData = {
    ...selectedPetInfo.value, // 保留所有原始資料
    name: editPetData.value.name.trim(),
    species: petSpecies,
    breed: editPetData.value.breed.trim() || null,
    gender: editPetData.value.gender !== '未知' ? editPetData.value.gender : null,
    birthDate: editPetData.value.birthDate || null,
    adoptDate: editPetData.value.adoptDate || null,
    weightKg: editPetData.value.weightKg ? parseFloat(editPetData.value.weightKg) : null,
    neutered: editPetData.value.neutered,
    microchipNumber: editPetData.value.microchipNumber.trim() || null,
    color: editPetData.value.color.trim() || null,
    notes: editPetData.value.notes.trim() || null
  }
  
  try {
    // 呼叫 API 更新寵物
    await PetsAPI.update(selectedPetInfo.value.id, updatedData)
    
    // 更新完成後，重新從 API 取得最新的完整資料
    const latestPet = await PetsAPI.getById(selectedPetInfo.value.id)
    
    console.log('從資料庫取得的最新資料：', latestPet)
    
    // 更新 pets 列表中的資料
    const petIndex = pets.value.findIndex(p => p.id === selectedPetInfo.value.id)
    if (petIndex !== -1) {
      pets.value[petIndex] = latestPet
      // 強制觸發響應式更新
      pets.value = [...pets.value]
      // 同步到 localStorage 作為備援
      localStorage.setItem('petsList', JSON.stringify(pets.value))
    }
    
    // 更新 selectedPetInfo 為最新資料
    selectedPetInfo.value = latestPet
    
    isEditingPet.value = false
    editCustomType.value = ''
    showEditCustomType.value = false
    
    alert('寵物資料已更新')
  } catch (error) {
    console.error('更新寵物資料失敗：', error)
    alert('更新寵物資料失敗：' + error.message)
  }
}

// 處理寵物照片上傳
const handlePetPhotoUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    // 檢查檔案大小（限制為 5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('檔案大小不能超過 5MB')
      event.target.value = ''
      return
    }
    
    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      alert('請上傳圖片檔案')
      event.target.value = ''
      return
    }
    
    // 將圖片轉換為 Base64
    const reader = new FileReader()
    reader.onload = (e) => {
      newPetAvatarUrl.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// 移除寵物照片
const removePetPhoto = () => {
  newPetAvatarUrl.value = ''
  const fileInput = document.querySelector('.pet-photo-input')
  if (fileInput) {
    fileInput.value = ''
  }
}

// 更新寵物照片（在詳細資訊視窗中）
const updatePetPhoto = async (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert('檔案大小不能超過 5MB')
      event.target.value = ''
      return
    }
    
    if (!file.type.startsWith('image/')) {
      alert('請上傳圖片檔案')
      event.target.value = ''
      return
    }
    
    try {
      // 呼叫上傳寵物頭像 API
      await PetsAPI.uploadAvatar(selectedPetInfo.value.id, file)
      
      console.log('照片上傳成功')
      
      // 上傳完成後，重新從 API 取得最新的完整資料
      const latestPet = await PetsAPI.getById(selectedPetInfo.value.id)
      
      console.log('照片更新後從資料庫取得的最新資料：', latestPet)
      
      // 更新 pets 列表中的資料
      const petIndex = pets.value.findIndex(p => p.id === selectedPetInfo.value.id)
      if (petIndex !== -1) {
        pets.value[petIndex] = latestPet
        // 強制觸發響應式更新
        pets.value = [...pets.value]
        // 同步到 localStorage 作為備援
        localStorage.setItem('petsList', JSON.stringify(pets.value))
      }
      
      // 重新載入該寵物的頭貼圖片
      if (latestPet.avatarUrl) {
        petAvatarUrls.value[latestPet.id] = await getImageUrl(latestPet.avatarUrl)
      }
      
      // 更新 selectedPetInfo 為最新資料
      selectedPetInfo.value = latestPet
      
      // 清空 input
      event.target.value = ''
    } catch (error) {
      console.error('更新寵物照片失敗：', error)
      alert('更新寵物照片失敗：' + error.message)
      event.target.value = ''
    }
  }
}

// 刪除寵物
const deletePet = async (petId) => {
  if (!confirm('確定要刪除這隻寵物的所有記錄嗎？此操作無法復原！')) {
    return
  }
  
  try {
    // 呼叫 API 刪除寵物
    await PetsAPI.delete(petId)
    
    // 刪除該寵物的所有本地記錄
    localStorage.removeItem(`feedingRecords_${petId}`)
    localStorage.removeItem(`healthRecords_${petId}`)
    localStorage.removeItem(`medicalRecords_${petId}`)
    localStorage.removeItem(`inventoryItems_${petId}`)
    localStorage.removeItem(`petDiary_${petId}`)
    
    // 從列表中移除（使用 filter 創建新陣列觸發響應式）
    const petIndex = pets.value.findIndex(p => p.id === petId)
    if (petIndex !== -1) {
      pets.value.splice(petIndex, 1)
    }
    
    // 同步到 localStorage
    localStorage.setItem('petsList', JSON.stringify(pets.value))
    
    // 關閉彈窗
    showPetInfo.value = false
    selectedPetInfo.value = null
    
    // 切換到第一隻寵物或清空
    if (pets.value.length > 0) {
      currentPetId.value = pets.value[0].id
      localStorage.setItem('lastSelectedPetId', pets.value[0].id.toString())
    } else {
      currentPetId.value = null
      localStorage.removeItem('lastSelectedPetId')
    }
  } catch (error) {
    console.error('刪除寵物失敗：', error)
    alert('刪除寵物失敗：' + error.message)
  }
}

// 備註：API 沒有 status 欄位，改為在 notes 中記錄或移除此功能
// 如需保留此功能，可在 notes 中加入特殊標記

</script>

<template>
  <div id="app">
    <!-- 登入頁面 -->
    <LoginPage 
      v-if="!isLoggedIn" 
      @user-logged-in="handleUserLoggedIn"
      @user-logged-out="handleUserLoggedOut"
    />
    
    <!-- 主應用程式（登入後） -->
    <div v-else @click="closeUserMenu">
    <header class="app-header">
      <div class="header-content">
        <div class="header-left">
          <h1>🐾 PetLife - 寵物生活管理系統</h1>
          <p class="subtitle">用心記錄，陪伴每一刻</p>
        </div>
        <div class="header-right">
          <div class="user-info-compact" @click.stop="toggleUserMenu">
            <div class="user-avatar-small">
              <img v-if="currentUser?.photoURL" :src="currentUser.photoURL" :alt="currentUser.displayName" />
              <span v-else class="avatar-text">{{ currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || '👤' }}</span>
            </div>
            <span class="user-name-small">{{ currentUser?.displayName || currentUser?.email }}</span>
            <svg class="dropdown-icon" :class="{ open: showUserMenu }" viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M7 10l5 5 5-5z"/>
            </svg>
          </div>
          
          <!-- 下拉選單 -->
          <div v-if="showUserMenu" class="user-dropdown" @click.stop>
            <div class="dropdown-header">
              <div class="user-avatar-large">
                <img v-if="currentUser?.photoURL" :src="currentUser.photoURL" :alt="currentUser.displayName" />
                <span v-else class="avatar-text-large">{{ currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || '👤' }}</span>
              </div>
              <div class="user-details">
                <p class="user-full-name">{{ currentUser?.displayName || '使用者' }}</p>
                <p class="user-email-small">{{ currentUser?.email }}</p>
              </div>
            </div>
            
            <!-- 登入方式 -->
            <div class="dropdown-section">
              <div class="provider-info">
                <span class="provider-label">登入方式：</span>
                <span class="provider-value">{{ getProviderName() }}</span>
              </div>
            </div>
            
            <!-- 修改密碼區域（只顯示給 Email/Password 帳號）-->
            <div v-if="isEmailPasswordAccount()" class="dropdown-section password-section">
              <button 
                v-if="!showPasswordChange" 
                @click="openPasswordChange" 
                class="dropdown-action-btn"
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm9.002 13H13v-2.278c.595-.347 1-.985 1-1.722 0-1.103-.897-2-2-2s-2 .897-2 2c0 .736.405 1.375 1 1.722V20H5.998v-8H18l.002 8z"/>
                </svg>
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
                <div v-if="passwordError" class="password-error">
                  {{ passwordError }}
                </div>
                <div class="password-actions">
                  <button @click="handlePasswordChange" class="btn-save-password">
                    儲存
                  </button>
                  <button @click="cancelPasswordChange" class="btn-cancel-password">
                    取消
                  </button>
                </div>
              </div>
            </div>
            
            <div class="dropdown-divider"></div>
            <button @click="handleSignOut" class="dropdown-logout-btn">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
              登出
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 寵物選擇區 -->
    <div class="pet-selector">
      <div class="pet-selector-content">
        <div class="pet-list">
          <button 
            v-for="pet in pets" 
            :key="pet.id"
            :class="['pet-btn', { active: currentPetId === pet.id }]"
          >
            <span class="pet-icon" @click.stop="showPetDetail(pet)">
              <img v-if="petAvatarUrls[pet.id]" :src="petAvatarUrls[pet.id]" class="pet-avatar" :alt="pet.name" />
              <span v-else>{{ getPetIcon(pet.species) }}</span>
            </span>
            <span class="pet-name" @click.stop="currentPetId = pet.id">{{ pet.name }}</span>
          </button>
        </div>
        <button @click="showPetModal = true" class="add-pet-btn">
          ➕ 新增寵物
        </button>
      </div>
      <div v-if="!currentPet && pets.length === 0" class="no-pet-message">
        請先新增一隻寵物開始記錄 😊
      </div>
    </div>

    <!-- 新增寵物彈窗 -->
    <div v-if="showPetModal" class="modal-overlay" @click.self="showPetModal = false">
      <div class="modal-content">
        <h3>新增寵物</h3>
        <div class="modal-form">
          <div class="form-group">
            <label>寵物名字 *</label>
            <input type="text" v-model="newPetName" placeholder="例如：小白" />
          </div>
          <div class="form-group">
            <label>寵物種類 *</label>
            <select v-model="newPetSpecies" @change="showCustomType = (newPetSpecies === '自訂')">
              <option value="狗">狗 🐕</option>
              <option value="貓">貓 🐈</option>
              <option value="兔子">兔子 🐰</option>
              <option value="鳥">鳥 🐦</option>
              <option value="倉鼠">倉鼠 🐹</option>
              <option value="天竺鼠">天竺鼠 🐹</option>
              <option value="其他">其他 🐾</option>
              <option value="自訂">➕ 自訂種類</option>
            </select>
          </div>
          <div class="form-group" v-if="showCustomType">
            <label>自訂種類名稱 *</label>
            <input type="text" v-model="customPetType" placeholder="例如：烏龜、蜥蜴、魚" />
          </div>
          <div class="form-group">
            <label>性別</label>
            <select v-model="newPetGender">
              <option value="未知">未知</option>
              <option value="公">公 ♂</option>
              <option value="母">母 ♀</option>
            </select>
          </div>
          <div class="form-group">
            <label>生日（選填）</label>
            <input type="date" v-model="newPetBirthDate" />
          </div>
          <div class="form-group">
            <label>接回家日期（選填）</label>
            <input type="date" v-model="newPetAdoptDate" />
          </div>
          <div class="form-group full-width">
            <label>寵物照片（選填）</label>
            <input type="file" @change="handlePetPhotoUpload" accept="image/*" class="pet-photo-input" />
            <div v-if="newPetAvatarUrl" class="photo-preview-container">
              <img :src="newPetAvatarUrl" alt="寵物照片預覽" class="pet-photo-preview" />
              <button @click="removePetPhoto" type="button" class="btn-remove-photo-small">移除照片</button>
            </div>
          </div>
          <div class="form-group">
            <label>品種（選填）</label>
            <input type="text" v-model="newPetBreed" placeholder="例如：柴犬、波斯貓" />
          </div>
          <div class="form-group">
            <label>是否結紮</label>
            <select v-model="newPetNeutered">
              <option :value="false">未結紮</option>
              <option :value="true">已結紮</option>
            </select>
          </div>
          <div class="form-group">
            <label>晶片號（選填）</label>
            <input type="text" v-model="newPetMicrochipNumber" placeholder="例如：900123456789012" />
          </div>
          <div class="form-group">
            <label>體重 (kg)（選填）</label>
            <input type="number" step="0.01" v-model="newPetWeightKg" placeholder="例如：5.5" />
          </div>
          <div class="form-group">
            <label>毛色（選填）</label>
            <input type="text" v-model="newPetColor" placeholder="例如：黑色、白色" />
          </div>
          <div class="form-group full-width">
            <label>備註（選填）</label>
            <textarea v-model="newPetNotes" placeholder="記錄任何特殊註意事項" rows="3"></textarea>
          </div>
          <div class="modal-actions">
            <button @click="showPetModal = false" class="btn-cancel">取消</button>
            <button @click="addPet" class="btn-confirm">確定</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 寵物詳細資訊彈窗 -->
    <div v-if="showPetInfo && selectedPetInfo" class="modal-overlay" @click.self="closePetInfo">
      <div class="modal-content pet-info-modal">
        <button @click="closePetInfo" class="close-btn">×</button>
        <div class="pet-info-header">
          <div class="pet-photo-section">
            <div class="pet-photo-wrapper">
              <img v-if="petAvatarUrls[selectedPetInfo.id]" :src="petAvatarUrls[selectedPetInfo.id]" class="pet-info-photo" :alt="selectedPetInfo.name" />
              <span v-else class="pet-info-icon">{{ getPetIcon(selectedPetInfo.species) }}</span>
            </div>
            <label class="upload-photo-btn" v-if="!isEditingPet">
              <input type="file" @change="updatePetPhoto" accept="image/*" style="display: none;" />
              📷 {{ selectedPetInfo.avatarUrl ? '更換照片' : '上傳照片' }}
            </label>
          </div>
          <h3 v-if="!isEditingPet">{{ selectedPetInfo.name }}</h3>
        </div>
        
        <!-- 編輯模式 -->
        <div v-if="isEditingPet" class="edit-form">
          <div class="form-group">
            <label>寵物名字 *</label>
            <input type="text" v-model="editPetData.name" placeholder="例如：小白" />
          </div>
          <div class="form-group">
            <label>寵物種類 *</label>
            <select v-model="editPetData.species" @change="showEditCustomType = (editPetData.species === '自訂')">
              <option value="狗">狗 🐕</option>
              <option value="貓">貓 🐈</option>
              <option value="兔子">兔子 🐰</option>
              <option value="鳥">鳥 🐦</option>
              <option value="倉鼠">倉鼠 🐹</option>
              <option value="天竺鼠">天竺鼠 🐹</option>
              <option value="其他">其他 🐾</option>
              <option value="自訂">➕ 自訂種類</option>
            </select>
          </div>
          <div class="form-group" v-if="showEditCustomType">
            <label>自訂種類名稱 *</label>
            <input type="text" v-model="editCustomType" placeholder="例如：烏龜、蜥蜴、魚" />
          </div>
          <div class="form-group">
            <label>品種（選填）</label>
            <input type="text" v-model="editPetData.breed" placeholder="例如：柴犬、波斯貓" />
          </div>
          <div class="form-group">
            <label>性別</label>
            <select v-model="editPetData.gender">
              <option value="未知">未知</option>
              <option value="公">公 ♂</option>
              <option value="母">母 ♀</option>
            </select>
          </div>
          <div class="form-group">
            <label>生日（選填）</label>
            <input type="date" v-model="editPetData.birthDate" />
          </div>
          <div class="form-group">
            <label>接回家日期（選填）</label>
            <input type="date" v-model="editPetData.adoptDate" />
          </div>
          <div class="form-group">
            <label>是否結紮</label>
            <select v-model="editPetData.neutered">
              <option :value="false">未結紮</option>
              <option :value="true">已結紮</option>
            </select>
          </div>
          <div class="form-group">
            <label>晶片號（選填）</label>
            <input type="text" v-model="editPetData.microchipNumber" placeholder="例如：900123456789012" />
          </div>
          <div class="form-group">
            <label>體重 (kg)（選填）</label>
            <input type="number" step="0.01" v-model="editPetData.weightKg" placeholder="例如：5.5" />
          </div>
          <div class="form-group">
            <label>毛色（選填）</label>
            <input type="text" v-model="editPetData.color" placeholder="例如：黑色、白色" />
          </div>
          <div class="form-group full-width">
            <label>備註（選填）</label>
            <textarea v-model="editPetData.notes" placeholder="記錄任何特殊註意事項" rows="3"></textarea>
          </div>
          <div class="edit-actions">
            <button @click="cancelEditPet" class="btn-cancel">取消</button>
            <button @click="saveEditPet" class="btn-confirm">儲存</button>
          </div>
        </div>
        
        <!-- 檢視模式 -->
        <div v-else class="pet-info-body">
          <div class="info-row">
            <span class="info-label">種類：</span>
            <span class="info-value">{{ selectedPetInfo.species }}</span>
          </div>
          <div class="info-row" v-if="selectedPetInfo.breed">
            <span class="info-label">品種：</span>
            <span class="info-value">{{ selectedPetInfo.breed }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">性別：</span>
            <span class="info-value">{{ selectedPetInfo.gender === '公' ? '公 ♂' : selectedPetInfo.gender === '母' ? '母 ♀' : '未知' }}</span>
          </div>
          <div class="info-row" v-if="selectedPetInfo.birthDate">
            <span class="info-label">生日：</span>
            <span class="info-value">{{ selectedPetInfo.birthDate }}</span>
          </div>
          <div class="info-row" v-if="selectedPetInfo.birthDate">
            <span class="info-label">年齡：</span>
            <span class="info-value age-highlight">{{ calculateAge(selectedPetInfo.birthDate) }}</span>
          </div>
          <div class="info-row" v-if="selectedPetInfo.adoptDate">
            <span class="info-label">接回家日期：</span>
            <span class="info-value">{{ selectedPetInfo.adoptDate }}</span>
          </div>
          <div class="info-row" v-if="selectedPetInfo.adoptDate">
            <span class="info-label">相處時間：</span>
            <span class="info-value age-highlight">{{ calculateAge(selectedPetInfo.adoptDate) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">是否結紮：</span>
            <span class="info-value">{{ selectedPetInfo.neutered ? '已結紮' : '未結紮' }}</span>
          </div>
          <div class="info-row" v-if="selectedPetInfo.microchipNumber">
            <span class="info-label">晶片號：</span>
            <span class="info-value">{{ selectedPetInfo.microchipNumber }}</span>
          </div>
          <div class="info-row" v-if="selectedPetInfo.weightKg">
            <span class="info-label">體重：</span>
            <span class="info-value">{{ selectedPetInfo.weightKg }} kg</span>
          </div>
          <div class="info-row" v-if="selectedPetInfo.color">
            <span class="info-label">毛色：</span>
            <span class="info-value">{{ selectedPetInfo.color }}</span>
          </div>
          <div class="info-row" v-if="selectedPetInfo.notes">
            <span class="info-label">備註：</span>
            <span class="info-value">{{ selectedPetInfo.notes }}</span>
          </div>
        </div>
        <div class="pet-info-actions" v-if="!isEditingPet">
          <button @click="startEditPet" class="btn-action btn-edit">
            ✏️ 編輯資料
          </button>
          <button @click="deletePet(selectedPetInfo.id)" class="btn-action btn-delete">
            🗑️ 刪除寵物資料
          </button>
        </div>
      </div>
    </div>

    <nav class="nav-tabs" v-if="currentPet">
      <button 
        @click="activeTab = 'feeding'"
        :class="['nav-btn', { active: activeTab === 'feeding' }]"
      >
        🍽️ 飲食記錄
      </button>
      <button 
        @click="activeTab = 'health'"
        :class="['nav-btn', { active: activeTab === 'health' }]"
      >
        🏥 健康記錄
      </button>
      <button 
        @click="activeTab = 'medical'"
        :class="['nav-btn', { active: activeTab === 'medical' }]"
      >
        💊 醫療記錄
      </button>
      <button 
        @click="activeTab = 'inventory'"
        :class="['nav-btn', { active: activeTab === 'inventory' }]"
      >
        📦 庫存管理
      </button>
      <button 
        @click="activeTab = 'diary'"
        :class="['nav-btn', { active: activeTab === 'diary' }]"
      >
        📝 寵物日記
      </button>
      <button 
        @click="activeTab = 'chart'"
        :class="['nav-btn', { active: activeTab === 'chart' }]"
      >
        📊 花費圖表
      </button>
    </nav>

    <main class="main-content" v-if="currentPet">
      <FeedingRecord v-if="activeTab === 'feeding'" :petId="currentPetId" :key="`feeding-${currentPetId}`" />
      <HealthRecord v-if="activeTab === 'health'" :petId="currentPetId" :key="`health-${currentPetId}`" />
      <MedicalRecord v-if="activeTab === 'medical'" :petId="currentPetId" :key="`medical-${currentPetId}`" />
      <InventoryManagement v-if="activeTab === 'inventory'" :petId="currentPetId" :key="`inventory-${currentPetId}`" />
      <PetDiary v-if="activeTab === 'diary'" :petId="currentPetId" :key="`diary-${currentPetId}`" />
      <ExpenseChart v-if="activeTab === 'chart'" :petId="currentPetId" :key="`chart-${currentPetId}`" />
    </main>

    <footer class="app-footer">
      <p>© 2025 PetLife - 讓愛更有溫度</p>
    </footer>
    </div>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #42b983 0%, #35a372 100%);
  color: white;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.header-left {
  flex: 1;
}

.app-header h1 {
  margin: 0;
  font-size: 2.5em;
  font-weight: 700;
}

.subtitle {
  margin: 10px 0 0 0;
  font-size: 1.1em;
  opacity: 0.95;
}

.header-right {
  position: relative;
}

.user-info-compact {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.user-info-compact:hover {
  background: rgba(255, 255, 255, 0.3);
}

.user-avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid white;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  color: #42b983;
  font-weight: 700;
  font-size: 16px;
}

.user-name-small {
  font-weight: 600;
  font-size: 15px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  transition: transform 0.3s;
}

.dropdown-icon.open {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 280px;
  z-index: 1000;
  overflow: hidden;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-header {
  padding: 20px;
  display: flex;
  gap: 15px;
  align-items: center;
  background: #f8f9fa;
}

.user-avatar-large {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #42b983;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text-large {
  color: #42b983;
  font-weight: 700;
  font-size: 28px;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-full-name {
  margin: 0;
  font-weight: 700;
  color: #2c3e50;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-email-small {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-divider {
  height: 1px;
  background: #e0e0e0;
}

.dropdown-section {
  padding: 15px 20px;
}

.provider-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.provider-label {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.provider-value {
  color: #2c3e50;
  font-weight: 700;
  font-size: 14px;
}

.password-section {
  padding-top: 10px;
  padding-bottom: 10px;
}

.dropdown-action-btn {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: #667eea;
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.dropdown-action-btn:hover {
  background: #5568d3;
  transform: translateY(-1px);
}

.password-change-form {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 10px;
}

.password-change-form h4 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 15px;
  text-align: center;
}

.password-change-form .form-group {
  margin-bottom: 10px;
}

.password-change-form .form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 5px;
}

.password-change-form .form-input {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.3s;
  box-sizing: border-box;
}

.password-change-form .form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.password-error {
  background: #ffebee;
  color: #d32f2f;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  margin-bottom: 10px;
  text-align: center;
  border: 1px solid #ffcdd2;
}

.password-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.btn-save-password,
.btn-cancel-password {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-save-password {
  background: #42b983;
  color: white;
}

.btn-save-password:hover {
  background: #38a372;
  transform: translateY(-1px);
}

.btn-cancel-password {
  background: #ccc;
  color: #666;
}

.btn-cancel-password:hover {
  background: #bbb;
  transform: translateY(-1px);
}

.dropdown-logout-btn {
  width: 100%;
  padding: 14px 20px;
  border: none;
  background: white;
  color: #f44336;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-start;
}

.dropdown-logout-btn:hover {
  background: #ffebee;
}

.nav-tabs {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 2px solid #e0e0e0;
}

.nav-btn {
  padding: 12px 24px;
  border: 2px solid #42b983;
  background: white;
  color: #42b983;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  background: #e8f5e9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(66, 185, 131, 0.2);
}

.nav-btn.active {
  background: #42b983;
  color: white;
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);
}

.main-content {
  flex: 1;
  padding: 20px;
  background: #ffffff;
}

.app-footer {
  background: #2c3e50;
  color: white;
  text-align: center;
  padding: 20px;
  margin-top: 40px;
}

.app-footer p {
  margin: 0;
  font-size: 14px;
}

.pet-selector {
  background: #fff;
  border-bottom: 2px solid #e0e0e0;
  padding: 15px 20px;
}

.pet-selector-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.pet-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  flex: 1;
}

.pet-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 2px solid #42b983;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.pet-btn:hover {
  background: #e8f5e9;
  transform: translateY(-2px);
}

.pet-btn.active {
  background: #42b983;
  color: white;
}

.pet-icon {
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  position: relative;
}

.pet-icon:hover {
  transform: scale(1.2);
}

.pet-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #42b983;
}

.pet-btn.active .pet-avatar {
  border-color: white;
}

.pet-name {
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
}

.add-pet-btn {
  padding: 10px 20px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s;
  white-space: nowrap;
}

.add-pet-btn:hover {
  background: #359268;
  transform: translateY(-2px);
}

.no-pet-message {
  text-align: center;
  color: #999;
  font-size: 16px;
  padding: 10px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  position: relative;
}

.modal-content h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 22px;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 13px;
  margin-bottom: 2px;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
  min-height: 60px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 5px;
  grid-column: 1 / -1;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-cancel {
  background: #f0f0f0;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-confirm {
  background: #42b983;
  color: white;
}

.btn-confirm:hover {
  background: #359268;
}

.pet-info-modal {
  max-width: 450px;
}

.photo-preview-container {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.pet-photo-preview {
  max-width: 100%;
  max-height: 150px;
  border-radius: 12px;
  object-fit: contain;
  border: 2px solid #e0e0e0;
}

.btn-remove-photo-small {
  background: #f44336;
  color: white;
  padding: 5px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.3s;
}

.btn-remove-photo-small:hover {
  background: #d32f2f;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: #f0f0f0;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #e0e0e0;
  transform: rotate(90deg);
}

.pet-info-header {
  text-align: center;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.pet-photo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.pet-photo-wrapper {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #42b983;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
}

.pet-info-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pet-info-icon {
  font-size: 60px;
  display: block;
}

.upload-photo-btn {
  background: #42b983;
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s;
}

.upload-photo-btn:hover {
  background: #359268;
  transform: translateY(-2px);
}

.pet-info-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 24px;
}

.pet-info-body {
  padding-top: 15px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #666;
  font-size: 15px;
}

.info-value {
  color: #2c3e50;
  font-size: 15px;
}

.age-highlight {
  color: #42b983;
  font-weight: 600;
  font-size: 16px;
}

.pet-info-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid #f5f5f5;
}

.btn-action {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.btn-delete {
  background: #f44336;
  color: white;
}

.btn-delete:hover {
  background: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
}

.btn-edit {
  background: #2196F3;
  color: white;
}

.btn-edit:hover {
  background: #1976D2;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
}

.edit-form {
  padding-top: 15px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.edit-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.edit-form .form-group:nth-child(1),
.edit-form .form-group:nth-child(3) {
  grid-column: 1 / -1;
}

.edit-form label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 13px;
}

.edit-form input,
.edit-form select {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.edit-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 10px;
  margin-top: 5px;
}

@media (max-width: 768px) {
  .app-header h1 {
    font-size: 1.5em;
  }
  
  .subtitle {
    font-size: 0.85em;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .header-left {
    width: 100%;
  }
  
  .header-right {
    width: 100%;
  }
  
  .user-info-compact {
    width: 100%;
    justify-content: space-between;
  }
  
  .user-name-small {
    flex: 1;
    max-width: none;
  }
  
  .user-dropdown {
    left: 0;
    right: 0;
    min-width: auto;
  }
  
  .pet-selector {
    padding: 10px;
  }
  
  .pet-selector-content {
    gap: 10px;
  }
  
  .pet-list {
    gap: 8px;
  }
  
  .pet-btn {
    padding: 8px 12px;
    padding-right: 30px;
    font-size: 14px;
  }
  
  .pet-icon {
    font-size: 18px;
    width: 28px;
    height: 28px;
  }
  
  .pet-avatar {
    width: 28px;
    height: 28px;
  }
  
  .inactive-badge {
    font-size: 7px;
    padding: 1px 3px;
    bottom: -6px;
    right: -6px;
  }
  
  .pet-name {
    font-size: 14px;
  }
  
  .add-pet-btn {
    padding: 8px 16px;
    font-size: 14px;
    width: 100%;
  }
  
  .nav-tabs {
    padding: 15px 10px;
    overflow-x: auto;
    flex-wrap: nowrap;
    justify-content: flex-start;
    -webkit-overflow-scrolling: touch;
  }
  
  .nav-btn {
    padding: 10px 16px;
    font-size: 14px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  
  .main-content {
    padding: 15px 10px;
  }
  
  .modal-content {
    width: 95%;
    padding: 20px;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal-content h3 {
    font-size: 20px;
  }
  
  .modal-form {
    grid-template-columns: 1fr;
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    font-size: 16px;
  }
  
  .pet-info-modal {
    max-width: 95%;
  }
  
  .pet-photo-wrapper {
    width: 100px;
    height: 100px;
  }
  
  .pet-info-header h3 {
    font-size: 22px;
  }
  
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .info-label,
  .info-value {
    font-size: 14px;
  }
  
  .pet-info-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .btn-action {
    padding: 10px 16px;
    font-size: 14px;
  }
  
  .edit-form {
    grid-template-columns: 1fr;
  }
  
  .edit-form .form-group:nth-child(1),
  .edit-form .form-group:nth-child(3) {
    grid-column: 1;
  }
}

@media (max-width: 480px) {
  .app-header h1 {
    font-size: 1.5em;
  }
  
  .subtitle {
    font-size: 0.85em;
  }
  
  .pet-btn {
    padding: 6px 10px;
    font-size: 13px;
  }
  
  .pet-icon {
    font-size: 16px;
    width: 24px;
    height: 24px;
  }
  
  .pet-avatar {
    width: 24px;
    height: 24px;
  }
  
  .inactive-badge {
    font-size: 6px;
    padding: 1px 2px;
  }
  
  .nav-btn {
    padding: 8px 12px;
    font-size: 13px;
  }
  
  .modal-content h3 {
    font-size: 18px;
  }
  
  .btn-cancel,
  .btn-confirm {
    padding: 10px 16px;
    font-size: 14px;
  }
  
  .btn-action {
    padding: 10px 12px;
    font-size: 13px;
  }
}
</style>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import FeedingRecord from './components/FeedingRecord.vue'
import HealthRecord from './components/HealthRecord.vue'
import MedicalRecord from './components/MedicalRecord.vue'
import InventoryManagement from './components/InventoryManagement.vue'
import PetDiary from './components/PetDiary.vue'
import ExpenseChart from './components/ExpenseChart.vue'

const activeTab = ref('feeding')
const currentPetId = ref(null)
const pets = ref([])
const showPetModal = ref(false)
const newPetName = ref('')
const newPetType = ref('狗')
const newPetBreed = ref('')
const customPetType = ref('')
const showCustomType = ref(false)
const newPetBirthday = ref('')
const newPetAdoptDate = ref('')
const newPetGender = ref('未知')
const showPetInfo = ref(false)
const selectedPetInfo = ref(null)
const newPetPhoto = ref('')
const newPetStatus = ref('active') // active, inactive

// 載入寵物列表
onMounted(() => {
  const savedPets = localStorage.getItem('petsList')
  if (savedPets) {
    pets.value = JSON.parse(savedPets)
    if (pets.value.length > 0) {
      const lastPetId = localStorage.getItem('lastSelectedPetId')
      currentPetId.value = lastPetId ? parseInt(lastPetId) : pets.value[0].id
    }
  }
})

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
const addPet = () => {
  if (!newPetName.value.trim()) {
    alert('請輸入寵物名字')
    return
  }
  
  // 如果選擇自訂種類，使用自訂輸入的值
  let petType = newPetType.value
  if (showCustomType.value) {
    if (!customPetType.value.trim()) {
      alert('請輸入自訂寵物種類')
      return
    }
    petType = customPetType.value.trim()
  }
  
  const newPet = {
    id: Date.now(),
    name: newPetName.value.trim(),
    type: petType,
    breed: newPetBreed.value.trim(),
    birthday: newPetBirthday.value,
    adoptDate: newPetAdoptDate.value,
    gender: newPetGender.value,
    photo: newPetPhoto.value,
    status: 'active', // active 或 inactive
    createdAt: new Date().toISOString()
  }
  
  pets.value.push(newPet)
  localStorage.setItem('petsList', JSON.stringify(pets.value))
  
  currentPetId.value = newPet.id
  showPetModal.value = false
  
  // 重置表單
  newPetName.value = ''
  newPetType.value = '狗'
  newPetBreed.value = ''
  customPetType.value = ''
  showCustomType.value = false
  newPetBirthday.value = ''
  newPetAdoptDate.value = ''
  newPetGender.value = '未知'
  newPetPhoto.value = ''
}

// 取得寵物圖示
const getPetIcon = (type) => {
  const icons = {
    '狗': '🐕',
    '貓': '🐈',
    '兔子': '🐰',
    '鳥': '🐦',
    '倉鼠': '🐹',
    '天竺鼠': '🐹',
    '其他': '🐾'
  }
  return icons[type] || '🐾'
}

// 計算年齡
const calculateAge = (birthday) => {
  if (!birthday) return '未知'
  
  const birth = new Date(birthday)
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
      newPetPhoto.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// 移除寵物照片
const removePetPhoto = () => {
  newPetPhoto.value = ''
  const fileInput = document.querySelector('.pet-photo-input')
  if (fileInput) {
    fileInput.value = ''
  }
}

// 更新寵物照片（在詳細資訊視窗中）
const updatePetPhoto = (event) => {
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
    
    const reader = new FileReader()
    reader.onload = (e) => {
      selectedPetInfo.value.photo = e.target.result
      // 更新到 pets 列表
      const petIndex = pets.value.findIndex(p => p.id === selectedPetInfo.value.id)
      if (petIndex !== -1) {
        pets.value[petIndex].photo = e.target.result
        localStorage.setItem('petsList', JSON.stringify(pets.value))
      }
    }
    reader.readAsDataURL(file)
  }
}

// 刪除寵物
const deletePet = (petId) => {
  if (!confirm('確定要刪除這隻寵物的所有記錄嗎？此操作無法復原！')) {
    return
  }
  
  // 刪除該寵物的所有記錄
  localStorage.removeItem(`feedingRecords_${petId}`)
  localStorage.removeItem(`healthRecords_${petId}`)
  localStorage.removeItem(`medicalRecords_${petId}`)
  localStorage.removeItem(`inventoryItems_${petId}`)
  localStorage.removeItem(`petDiary_${petId}`)
  
  // 從列表中移除
  pets.value = pets.value.filter(pet => pet.id !== petId)
  localStorage.setItem('petsList', JSON.stringify(pets.value))
  
  // 關閉彈窗
  showPetInfo.value = false
  selectedPetInfo.value = null
  
  // 切換到第一隻寵物或清空
  if (pets.value.length > 0) {
    currentPetId.value = pets.value[0].id
  } else {
    currentPetId.value = null
  }
}

// 停止更新寵物（標記為不活躍）
const togglePetStatus = (petId) => {
  const pet = pets.value.find(p => p.id === petId)
  if (!pet) return
  
  const newStatus = pet.status === 'active' ? 'inactive' : 'active'
  const message = newStatus === 'inactive' 
    ? '確定要停止更新此寵物的記錄嗎？（可以隨時恢復更新）'
    : '確定要恢復更新此寵物的記錄嗎？'
  
  if (!confirm(message)) {
    return
  }
  
  pet.status = newStatus
  
  // 更新 selectedPetInfo
  if (selectedPetInfo.value && selectedPetInfo.value.id === petId) {
    selectedPetInfo.value.status = newStatus
  }
  
  localStorage.setItem('petsList', JSON.stringify(pets.value))
}

</script>

<template>
  <div id="app">
    <header class="app-header">
      <h1>🐾 PetLife - 寵物生活管理系統</h1>
      <p class="subtitle">用心記錄，陪伴每一刻</p>
    </header>

    <!-- 寵物選擇區 -->
    <div class="pet-selector">
      <div class="pet-selector-content">
        <div class="pet-list">
          <button 
            v-for="pet in pets" 
            :key="pet.id"
            :class="['pet-btn', { active: currentPetId === pet.id, inactive: pet.status === 'inactive' }]"
          >
            <span class="pet-icon" @click.stop="showPetDetail(pet)">
              <img v-if="pet.photo" :src="pet.photo" class="pet-avatar" :alt="pet.name" />
              <span v-else>{{ getPetIcon(pet.type) }}</span>
              <span v-if="pet.status === 'inactive'" class="inactive-badge">停止更新</span>
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
            <select v-model="newPetType" @change="showCustomType = (newPetType === '自訂')">
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
            <input type="date" v-model="newPetBirthday" />
          </div>
          <div class="form-group">
            <label>接回家日期（選填）</label>
            <input type="date" v-model="newPetAdoptDate" />
          </div>
          <div class="form-group full-width">
            <label>寵物照片（選填）</label>
            <input type="file" @change="handlePetPhotoUpload" accept="image/*" class="pet-photo-input" />
            <div v-if="newPetPhoto" class="photo-preview-container">
              <img :src="newPetPhoto" alt="寵物照片預覽" class="pet-photo-preview" />
              <button @click="removePetPhoto" type="button" class="btn-remove-photo-small">移除照片</button>
            </div>
          </div>
          <div class="form-group">
            <label>品種（選填）</label>
            <input type="text" v-model="newPetBreed" placeholder="例如：柴犬、波斯貓" />
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
              <img v-if="selectedPetInfo.photo" :src="selectedPetInfo.photo" class="pet-info-photo" :alt="selectedPetInfo.name" />
              <span v-else class="pet-info-icon">{{ getPetIcon(selectedPetInfo.type) }}</span>
            </div>
            <label class="upload-photo-btn">
              <input type="file" @change="updatePetPhoto" accept="image/*" style="display: none;" />
              📷 {{ selectedPetInfo.photo ? '更換照片' : '上傳照片' }}
            </label>
          </div>
          <h3>{{ selectedPetInfo.name }}</h3>
        </div>
        <div class="pet-info-body">
          <div class="info-row">
            <span class="info-label">種類：</span>
            <span class="info-value">{{ selectedPetInfo.type }}</span>
          </div>
          <div class="info-row" v-if="selectedPetInfo.breed">
            <span class="info-label">品種：</span>
            <span class="info-value">{{ selectedPetInfo.breed }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">性別：</span>
            <span class="info-value">{{ selectedPetInfo.gender === '公' ? '公 ♂' : selectedPetInfo.gender === '母' ? '母 ♀' : '未知' }}</span>
          </div>
          <div class="info-row" v-if="selectedPetInfo.birthday">
            <span class="info-label">生日：</span>
            <span class="info-value">{{ selectedPetInfo.birthday }}</span>
          </div>
          <div class="info-row" v-if="selectedPetInfo.birthday">
            <span class="info-label">年齡：</span>
            <span class="info-value age-highlight">{{ calculateAge(selectedPetInfo.birthday) }}</span>
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
            <span class="info-label">狀態：</span>
            <span :class="['info-value', 'status-badge', selectedPetInfo.status === 'active' ? 'status-active' : 'status-inactive']">
              {{ selectedPetInfo.status === 'active' ? '✅ 持續更新中' : '⏸️ 已停止更新' }}
            </span>
          </div>
        </div>
        <div class="pet-info-actions">
          <button 
            @click="togglePetStatus(selectedPetInfo.id)" 
            :class="['btn-action', selectedPetInfo.status === 'active' ? 'btn-pause' : 'btn-resume']"
          >
            {{ selectedPetInfo.status === 'active' ? '⏸️ 停止更新' : '▶️ 恢復更新' }}
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
  text-align: center;
  padding: 30px 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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

.pet-btn.inactive {
  opacity: 0.6;
  border-color: #999;
}

.pet-btn.inactive:not(.active) {
  background: #f5f5f5;
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

.pet-btn.inactive .pet-avatar {
  filter: grayscale(50%);
}

.inactive-badge {
  position: absolute;
  bottom: -8px;
  right: -8px;
  background: #ff9800;
  color: white;
  font-size: 8px;
  padding: 2px 4px;
  border-radius: 4px;
  white-space: nowrap;
  font-weight: 600;
  pointer-events: none;
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
.form-group select {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
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

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
}

.status-active {
  background: #e8f5e9;
  color: #42b983;
}

.status-inactive {
  background: #fff3e0;
  color: #ff9800;
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

.btn-pause {
  background: #ff9800;
  color: white;
}

.btn-pause:hover {
  background: #f57c00;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 152, 0, 0.3);
}

.btn-resume {
  background: #42b983;
  color: white;
}

.btn-resume:hover {
  background: #359268;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(66, 185, 131, 0.3);
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

@media (max-width: 768px) {
  .app-header h1 {
    font-size: 1.8em;
  }
  
  .subtitle {
    font-size: 0.9em;
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
  .form-group select {
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

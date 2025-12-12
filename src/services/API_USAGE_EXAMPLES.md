# API 使用範例

## 基本配置
API 基礎網址：`http://localhost:5173/api`

## 在 Vue 元件中使用

### 1. 匯入 API 服務

```javascript
import API from '@/services/api'
// 或個別匯入
import { PetsAPI, MedicalRecordsAPI, FeedingRecordsAPI, PetStatusRecordsAPI } from '@/services/api'
```

---

## Pets API 使用範例

### 取得全部寵物
```javascript
async function loadAllPets() {
  try {
    const pets = await API.Pets.getAll()
    console.log('所有寵物:', pets)
    return pets
  } catch (error) {
    console.error('取得寵物失敗:', error)
    alert('無法載入寵物列表')
  }
}
```

### 取得指定寵物
```javascript
async function loadPet(petId) {
  try {
    const pet = await API.Pets.getById(petId)
    console.log('寵物資料:', pet)
    return pet
  } catch (error) {
    console.error('取得寵物失敗:', error)
  }
}
```

### 新增寵物
```javascript
async function createNewPet() {
  const newPetData = {
    name: '小白',
    type: '狗',
    breed: '柴犬',
    gender: '公',
    birthday: '2023-01-15',
    adoptDate: '2023-03-20',
    neutered: '已結紮',
    chipNumber: '900123456789012',
    photo: 'base64_image_string',
    status: 'active'
  }

  try {
    const createdPet = await API.Pets.create(newPetData)
    console.log('新增成功:', createdPet)
    alert('寵物新增成功！')
    return createdPet
  } catch (error) {
    console.error('新增寵物失敗:', error)
    alert('新增失敗，請重試')
  }
}
```

### 更新寵物
```javascript
async function updatePet(petId) {
  const updateData = {
    name: '小白',
    breed: '柴犬混血',
    neutered: '已結紮',
    // ... 其他要更新的欄位
  }

  try {
    const updatedPet = await API.Pets.update(petId, updateData)
    console.log('更新成功:', updatedPet)
    alert('寵物資料已更新！')
    return updatedPet
  } catch (error) {
    console.error('更新寵物失敗:', error)
    alert('更新失敗，請重試')
  }
}
```

### 刪除寵物
```javascript
async function deletePet(petId) {
  if (!confirm('確定要刪除這隻寵物嗎？')) return

  try {
    await API.Pets.delete(petId)
    console.log('刪除成功')
    alert('寵物已刪除')
  } catch (error) {
    console.error('刪除寵物失敗:', error)
    alert('刪除失敗，請重試')
  }
}
```

---

## MedicalRecords API 使用範例

### 取得全部就醫紀錄
```javascript
async function loadMedicalRecords() {
  try {
    const records = await API.MedicalRecords.getAll()
    console.log('就醫紀錄:', records)
    return records
  } catch (error) {
    console.error('取得就醫紀錄失敗:', error)
  }
}
```

### 新增就醫紀錄
```javascript
async function addMedicalRecord() {
  const recordData = {
    petId: 123,
    date: '2024-11-30',
    clinic: '愛心動物醫院',
    doctor: '王醫師',
    diagnosis: '例行健康檢查',
    treatment: '施打疫苗',
    medication: '無',
    cost: 1500,
    nextVisit: '2025-11-30',
    notes: '健康狀況良好'
  }

  try {
    const created = await API.MedicalRecords.create(recordData)
    console.log('新增就醫紀錄成功:', created)
    return created
  } catch (error) {
    console.error('新增就醫紀錄失敗:', error)
  }
}
```

### 更新就醫紀錄
```javascript
async function updateMedicalRecord(recordId) {
  const updateData = {
    notes: '追蹤觀察中',
    cost: 1800
  }

  try {
    const updated = await API.MedicalRecords.update(recordId, updateData)
    console.log('更新成功:', updated)
    return updated
  } catch (error) {
    console.error('更新失敗:', error)
  }
}
```

### 刪除就醫紀錄
```javascript
async function deleteMedicalRecord(recordId) {
  try {
    await API.MedicalRecords.delete(recordId)
    console.log('刪除成功')
  } catch (error) {
    console.error('刪除失敗:', error)
  }
}
```

---

## FeedingRecords API 使用範例

### 取得全部餵食紀錄
```javascript
async function loadFeedingRecords() {
  try {
    const records = await API.FeedingRecords.getAll()
    console.log('餵食紀錄:', records)
    return records
  } catch (error) {
    console.error('取得餵食紀錄失敗:', error)
  }
}
```

### 新增餵食紀錄
```javascript
async function addFeedingRecord() {
  const recordData = {
    petId: 123,
    date: '2024-11-30',
    time: '08:00',
    foodType: '乾糧',
    brand: '皇家',
    amount: 100,
    unit: '克',
    notes: '食慾正常'
  }

  try {
    const created = await API.FeedingRecords.create(recordData)
    console.log('新增餵食紀錄成功:', created)
    return created
  } catch (error) {
    console.error('新增餵食紀錄失敗:', error)
  }
}
```

---

## PetStatusRecords API 使用範例

### 取得全部狀態紀錄
```javascript
async function loadStatusRecords() {
  try {
    const records = await API.PetStatusRecords.getAll()
    console.log('狀態紀錄:', records)
    return records
  } catch (error) {
    console.error('取得狀態紀錄失敗:', error)
  }
}
```

### 新增狀態紀錄
```javascript
async function addStatusRecord() {
  const recordData = {
    petId: 123,
    date: '2024-11-30',
    weight: 5.2,
    temperature: 38.5,
    mood: '活潑',
    appetite: '正常',
    energy: '充沛',
    notes: '今天特別活潑'
  }

  try {
    const created = await API.PetStatusRecords.create(recordData)
    console.log('新增狀態紀錄成功:', created)
    return created
  } catch (error) {
    console.error('新增狀態紀錄失敗:', error)
  }
}
```

---

## 在 Vue 元件中的完整範例

```vue
<script setup>
import { ref, onMounted } from 'vue'
import API from '@/services/api'

const pets = ref([])
const loading = ref(false)
const error = ref('')

// 載入寵物列表
const loadPets = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const data = await API.Pets.getAll()
    pets.value = data
  } catch (err) {
    error.value = '載入失敗：' + err.message
    console.error(err)
  } finally {
    loading.value = false
  }
}

// 新增寵物
const addPet = async (petData) => {
  try {
    const newPet = await API.Pets.create(petData)
    pets.value.push(newPet)
    alert('新增成功！')
  } catch (err) {
    alert('新增失敗：' + err.message)
  }
}

// 刪除寵物
const deletePet = async (petId) => {
  if (!confirm('確定要刪除嗎？')) return
  
  try {
    await API.Pets.delete(petId)
    pets.value = pets.value.filter(p => p.id !== petId)
    alert('刪除成功！')
  } catch (err) {
    alert('刪除失敗：' + err.message)
  }
}

// 元件掛載時載入資料
onMounted(() => {
  loadPets()
})
</script>

<template>
  <div>
    <div v-if="loading">載入中...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>
      <div v-for="pet in pets" :key="pet.id">
        {{ pet.name }}
        <button @click="deletePet(pet.id)">刪除</button>
      </div>
    </div>
  </div>
</template>
```

---

## 錯誤處理建議

```javascript
async function safeApiCall(apiFunction, errorMessage = '操作失敗') {
  try {
    return await apiFunction()
  } catch (error) {
    console.error(errorMessage, error)
    
    // 根據錯誤類型顯示不同訊息
    if (error.message.includes('404')) {
      alert('找不到資料')
    } else if (error.message.includes('500')) {
      alert('伺服器錯誤，請稍後再試')
    } else {
      alert(errorMessage + '：' + error.message)
    }
    
    throw error
  }
}

// 使用範例
await safeApiCall(
  () => API.Pets.create(petData),
  '新增寵物失敗'
)
```

---

## 注意事項

1. **API 基礎網址**：目前設定為 `http://localhost:5173/api`，實際部署時請修改 `src/services/api.js` 中的 `API_BASE_URL`

2. **認證 Token**：如果 API 需要認證，請在 `apiRequest` 函式的 headers 中加入：
   ```javascript
   headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${token}`,
   }
   ```

3. **CORS 設定**：如果遇到跨域問題，需要在後端設定 CORS

4. **錯誤處理**：建議在每次 API 呼叫時都加上 try-catch 錯誤處理

5. **Loading 狀態**：在呼叫 API 時建議顯示 loading 狀態，提升使用者體驗

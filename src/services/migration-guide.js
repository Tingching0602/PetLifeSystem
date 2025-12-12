/**
 * 整合 API 到現有專案的遷移指南
 * 
 * 這個檔案展示如何將現有的 localStorage 儲存方式遷移到後端 API
 */

import API from './api'

/**
 * ============================
 * 範例 1: App.vue 中的寵物管理
 * ============================
 */

// ❌ 舊方式（使用 localStorage）
const loadPetsData_OLD = () => {
  const savedPets = localStorage.getItem('petsList')
  if (savedPets) {
    pets.value = JSON.parse(savedPets)
  }
}

// ✅ 新方式（使用 API）
const loadPetsData = async () => {
  try {
    const data = await API.Pets.getAll()
    pets.value = data
    
    // 可選：同時儲存到 localStorage 作為快取
    localStorage.setItem('petsList', JSON.stringify(data))
  } catch (error) {
    console.error('載入寵物列表失敗:', error)
    
    // 發生錯誤時，從 localStorage 載入快取資料
    const cached = localStorage.getItem('petsList')
    if (cached) {
      pets.value = JSON.parse(cached)
      alert('使用離線資料，部分功能可能受限')
    }
  }
}

// ❌ 舊方式（新增寵物到 localStorage）
const addPet_OLD = () => {
  const newPet = {
    id: Date.now(),
    name: newPetName.value.trim(),
    // ... 其他欄位
  }
  
  pets.value.push(newPet)
  localStorage.setItem('petsList', JSON.stringify(pets.value))
}

// ✅ 新方式（透過 API 新增寵物）
const addPet = async () => {
  if (!newPetName.value.trim()) {
    alert('請輸入寵物名字')
    return
  }
  
  const newPetData = {
    name: newPetName.value.trim(),
    type: showCustomType.value ? customPetType.value.trim() : newPetType.value,
    breed: newPetBreed.value.trim(),
    birthday: newPetBirthday.value,
    adoptDate: newPetAdoptDate.value,
    gender: newPetGender.value,
    photo: newPetPhoto.value,
    neutered: newPetNeutered.value,
    chipNumber: newPetChipNumber.value.trim(),
    status: 'active',
  }
  
  try {
    // 呼叫 API 新增寵物
    const createdPet = await API.Pets.create(newPetData)
    
    // 將新增的寵物加入本地列表
    pets.value.push(createdPet)
    
    // 更新 localStorage 快取
    localStorage.setItem('petsList', JSON.stringify(pets.value))
    
    // 設定為當前寵物
    currentPetId.value = createdPet.id
    
    // 關閉對話框並重置表單
    showPetModal.value = false
    resetPetForm()
    
    alert('寵物新增成功！')
  } catch (error) {
    console.error('新增寵物失敗:', error)
    alert('新增失敗：' + error.message)
  }
}

// ❌ 舊方式（更新寵物）
const saveEditPet_OLD = () => {
  selectedPetInfo.value.name = editPetData.value.name.trim()
  // ... 更新其他欄位
  
  const petIndex = pets.value.findIndex(p => p.id === selectedPetInfo.value.id)
  if (petIndex !== -1) {
    pets.value[petIndex] = { ...selectedPetInfo.value }
    localStorage.setItem('petsList', JSON.stringify(pets.value))
  }
}

// ✅ 新方式（透過 API 更新寵物）
const saveEditPet = async () => {
  if (!selectedPetInfo.value || !editPetData.value.name.trim()) {
    alert('請輸入寵物名字')
    return
  }
  
  const petType = showEditCustomType.value 
    ? editCustomType.value.trim() 
    : editPetData.value.type
  
  const updateData = {
    name: editPetData.value.name.trim(),
    type: petType,
    breed: editPetData.value.breed.trim(),
    gender: editPetData.value.gender,
    birthday: editPetData.value.birthday,
    adoptDate: editPetData.value.adoptDate,
    neutered: editPetData.value.neutered,
    chipNumber: editPetData.value.chipNumber.trim(),
  }
  
  try {
    // 呼叫 API 更新寵物
    const updatedPet = await API.Pets.update(selectedPetInfo.value.id, updateData)
    
    // 更新本地資料
    Object.assign(selectedPetInfo.value, updatedPet)
    
    const petIndex = pets.value.findIndex(p => p.id === selectedPetInfo.value.id)
    if (petIndex !== -1) {
      pets.value[petIndex] = { ...updatedPet }
      localStorage.setItem('petsList', JSON.stringify(pets.value))
    }
    
    isEditingPet.value = false
    alert('寵物資料已更新')
  } catch (error) {
    console.error('更新寵物失敗:', error)
    alert('更新失敗：' + error.message)
  }
}

// ❌ 舊方式（刪除寵物）
const deletePet_OLD = (petId) => {
  if (!confirm('確定要刪除這隻寵物的所有記錄嗎？')) return
  
  // 刪除相關記錄
  localStorage.removeItem(`feedingRecords_${petId}`)
  localStorage.removeItem(`healthRecords_${petId}`)
  // ...
  
  pets.value = pets.value.filter(pet => pet.id !== petId)
  localStorage.setItem('petsList', JSON.stringify(pets.value))
}

// ✅ 新方式（透過 API 刪除寵物）
const deletePet = async (petId) => {
  if (!confirm('確定要刪除這隻寵物的所有記錄嗎？此操作無法復原！')) {
    return
  }
  
  try {
    // 呼叫 API 刪除寵物（後端應該會級聯刪除相關記錄）
    await API.Pets.delete(petId)
    
    // 從本地列表移除
    pets.value = pets.value.filter(pet => pet.id !== petId)
    
    // 更新 localStorage
    localStorage.setItem('petsList', JSON.stringify(pets.value))
    
    // 也清除相關的 localStorage 記錄
    localStorage.removeItem(`feedingRecords_${petId}`)
    localStorage.removeItem(`healthRecords_${petId}`)
    localStorage.removeItem(`medicalRecords_${petId}`)
    localStorage.removeItem(`inventoryItems_${petId}`)
    localStorage.removeItem(`petDiary_${petId}`)
    
    // 關閉彈窗
    showPetInfo.value = false
    selectedPetInfo.value = null
    
    // 切換到第一隻寵物或清空
    if (pets.value.length > 0) {
      currentPetId.value = pets.value[0].id
    } else {
      currentPetId.value = null
    }
    
    alert('寵物已刪除')
  } catch (error) {
    console.error('刪除寵物失敗:', error)
    alert('刪除失敗：' + error.message)
  }
}

/**
 * ============================
 * 範例 2: 醫療記錄管理
 * ============================
 */

// ✅ 載入醫療記錄（MedicalRecord.vue）
const loadMedicalRecords = async (petId) => {
  try {
    // 取得所有醫療記錄，然後過濾該寵物的記錄
    const allRecords = await API.MedicalRecords.getAll()
    const petRecords = allRecords.filter(record => record.petId === petId)
    
    medicalRecords.value = petRecords
    
    // 快取到 localStorage
    localStorage.setItem(`medicalRecords_${petId}`, JSON.stringify(petRecords))
  } catch (error) {
    console.error('載入醫療記錄失敗:', error)
    
    // 從快取載入
    const cached = localStorage.getItem(`medicalRecords_${petId}`)
    if (cached) {
      medicalRecords.value = JSON.parse(cached)
    }
  }
}

// ✅ 新增醫療記錄
const addMedicalRecord = async () => {
  const recordData = {
    petId: props.petId,
    date: newRecord.value.date,
    clinic: newRecord.value.clinic,
    doctor: newRecord.value.doctor,
    diagnosis: newRecord.value.diagnosis,
    treatment: newRecord.value.treatment,
    medication: newRecord.value.medication,
    cost: parseFloat(newRecord.value.cost) || 0,
    nextVisit: newRecord.value.nextVisit,
    notes: newRecord.value.notes,
  }
  
  try {
    const created = await API.MedicalRecords.create(recordData)
    medicalRecords.value.unshift(created)
    
    // 更新快取
    localStorage.setItem(
      `medicalRecords_${props.petId}`, 
      JSON.stringify(medicalRecords.value)
    )
    
    // 重置表單
    resetForm()
    showModal.value = false
    alert('醫療記錄新增成功！')
  } catch (error) {
    console.error('新增醫療記錄失敗:', error)
    alert('新增失敗：' + error.message)
  }
}

// ✅ 刪除醫療記錄
const deleteMedicalRecord = async (recordId) => {
  if (!confirm('確定要刪除這筆醫療記錄嗎？')) return
  
  try {
    await API.MedicalRecords.delete(recordId)
    
    medicalRecords.value = medicalRecords.value.filter(r => r.id !== recordId)
    
    // 更新快取
    localStorage.setItem(
      `medicalRecords_${props.petId}`, 
      JSON.stringify(medicalRecords.value)
    )
    
    alert('醫療記錄已刪除')
  } catch (error) {
    console.error('刪除醫療記錄失敗:', error)
    alert('刪除失敗：' + error.message)
  }
}

/**
 * ============================
 * 範例 3: 餵食記錄管理
 * ============================
 */

// ✅ 載入餵食記錄（FeedingRecord.vue）
const loadFeedingRecords = async (petId) => {
  try {
    const allRecords = await API.FeedingRecords.getAll()
    const petRecords = allRecords.filter(record => record.petId === petId)
    
    records.value = petRecords
    localStorage.setItem(`feedingRecords_${petId}`, JSON.stringify(petRecords))
  } catch (error) {
    console.error('載入餵食記錄失敗:', error)
    
    const cached = localStorage.getItem(`feedingRecords_${petId}`)
    if (cached) {
      records.value = JSON.parse(cached)
    }
  }
}

// ✅ 新增餵食記錄
const addFeedingRecord = async () => {
  const recordData = {
    petId: props.petId,
    date: newRecord.value.date,
    time: newRecord.value.time,
    foodType: newRecord.value.foodType,
    brand: newRecord.value.brand,
    amount: parseFloat(newRecord.value.amount),
    unit: newRecord.value.unit,
    notes: newRecord.value.notes,
  }
  
  try {
    const created = await API.FeedingRecords.create(recordData)
    records.value.unshift(created)
    
    localStorage.setItem(
      `feedingRecords_${props.petId}`, 
      JSON.stringify(records.value)
    )
    
    resetForm()
    showModal.value = false
  } catch (error) {
    console.error('新增餵食記錄失敗:', error)
    alert('新增失敗：' + error.message)
  }
}

/**
 * ============================
 * 範例 4: 狀態記錄管理
 * ============================
 */

// ✅ 載入狀態記錄（HealthRecord.vue）
const loadStatusRecords = async (petId) => {
  try {
    const allRecords = await API.PetStatusRecords.getAll()
    const petRecords = allRecords.filter(record => record.petId === petId)
    
    healthRecords.value = petRecords
    localStorage.setItem(`healthRecords_${petId}`, JSON.stringify(petRecords))
  } catch (error) {
    console.error('載入狀態記錄失敗:', error)
    
    const cached = localStorage.getItem(`healthRecords_${petId}`)
    if (cached) {
      healthRecords.value = JSON.parse(cached)
    }
  }
}

// ✅ 新增狀態記錄
const addStatusRecord = async () => {
  const recordData = {
    petId: props.petId,
    date: newRecord.value.date,
    weight: parseFloat(newRecord.value.weight),
    temperature: parseFloat(newRecord.value.temperature),
    mood: newRecord.value.mood,
    appetite: newRecord.value.appetite,
    energy: newRecord.value.energy,
    notes: newRecord.value.notes,
  }
  
  try {
    const created = await API.PetStatusRecords.create(recordData)
    healthRecords.value.unshift(created)
    
    localStorage.setItem(
      `healthRecords_${props.petId}`, 
      JSON.stringify(healthRecords.value)
    )
    
    resetForm()
    showModal.value = false
  } catch (error) {
    console.error('新增狀態記錄失敗:', error)
    alert('新增失敗：' + error.message)
  }
}

/**
 * ============================
 * 遷移步驟建議
 * ============================
 * 
 * 1. 保持雙軌運作：
 *    - 新增/更新時同時寫入 API 和 localStorage
 *    - 讀取時優先從 API，失敗時 fallback 到 localStorage
 * 
 * 2. 逐步遷移：
 *    - 先遷移寵物管理（Pets API）
 *    - 再遷移各種記錄（Records APIs）
 *    - 最後移除 localStorage 的寫入邏輯
 * 
 * 3. 錯誤處理：
 *    - 所有 API 呼叫都要包在 try-catch 中
 *    - 提供友善的錯誤訊息給使用者
 *    - 記錄錯誤到 console 方便除錯
 * 
 * 4. Loading 狀態：
 *    - 在呼叫 API 時顯示載入中
 *    - 避免使用者重複操作
 * 
 * 5. 離線支援（可選）：
 *    - 保留 localStorage 作為快取
 *    - 偵測網路狀態，離線時使用快取
 *    - 上線時同步資料到後端
 */

export {
  loadPetsData,
  addPet,
  saveEditPet,
  deletePet,
  loadMedicalRecords,
  addMedicalRecord,
  deleteMedicalRecord,
  loadFeedingRecords,
  addFeedingRecord,
  loadStatusRecords,
  addStatusRecord,
}

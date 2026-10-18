import { getAuth } from 'firebase/auth'

// API 基礎配置
// 請根據實際後端 API 位置修改此網址
// 常見設定：
// - .NET API: 'http://localhost:5000/api' 或 'http://localhost:5001/api'
// - Express: 'http://localhost:3000/api'
// - 同源: '/api'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7177/api'

// 取得 Firebase ID Token
async function getFirebaseToken() {
  try {
    const auth = getAuth()
    const currentUser = auth.currentUser
    
    if (currentUser) {
      const token = await currentUser.getIdToken()
      return token
    }
    
    return null
  } catch (error) {
    console.error('取得 Firebase Token 失敗:', error)
    return null
  }
}

// 通用 API 請求函式
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  // 取得 Firebase ID Token
  const token = await getFirebaseToken()
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  }
  
  // 如果有 token，加入 Authorization header
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`
  }

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    
    // 如果回應不是 OK，拋出錯誤
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.message || errorData.title || `HTTP Error: ${response.status}`
      
      console.error(`[API Error] ${config.method || 'GET'} ${url}`)
      console.error('[API Error] Status:', response.status)
      console.error('[API Error] Response:', errorData)
      
      const error = new Error(errorMessage)
      error.status = response.status
      error.response = errorData
      throw error
    }

    // 如果是 DELETE 請求且沒有內容，直接返回成功
    if (response.status === 204) {
      return { success: true }
    }

    return await response.json()
  } catch (error) {
    console.error('[API Request Error]:', error)
    throw error
  }
}

// ==================== Pets API ====================
export const PetsAPI = {
  // 取得全部寵物
  getAll: () => apiRequest('/Pets'),

  // 取得指定寵物
  getById: (id) => apiRequest(`/Pets/${id}`),

  // 新增寵物
  create: (petData) => apiRequest('/Pets', {
    method: 'POST',
    body: JSON.stringify(petData),
  }),

  // 更新寵物
  update: (id, petData) => apiRequest(`/Pets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(petData),
  }),

  // 刪除寵物
  delete: (id) => apiRequest(`/Pets/${id}`, {
    method: 'DELETE',
  }),
}

// ==================== MedicalRecords API ====================
export const MedicalRecordsAPI = {
  // 取得全部就醫紀錄
  getAll: () => apiRequest('/MedicalRecords'),

  // 取得指定就醫紀錄
  getById: (id) => apiRequest(`/MedicalRecords/${id}`),

  // 新增就醫紀錄
  create: (recordData) => apiRequest('/MedicalRecords', {
    method: 'POST',
    body: JSON.stringify(recordData),
  }),

  // 更新就醫紀錄
  update: (id, recordData) => apiRequest(`/MedicalRecords/${id}`, {
    method: 'PUT',
    body: JSON.stringify(recordData),
  }),

  // 刪除就醫紀錄
  delete: (id) => apiRequest(`/MedicalRecords/${id}`, {
    method: 'DELETE',
  }),

  // 取得醫療費用統計摘要
  // period 可為: 'one-week', 'one-month', 'three-months', 'six-months', 'one-year'
  getExpenseSummary: (period = 'one-month') => apiRequest(`/MedicalRecords/expense-summary?period=${period}`),

  // 取得各寵物醫療費用統計
  // period 可為: 'one-week', 'one-month', 'three-months', 'six-months', 'one-year'
  getExpenseByPet: (period = 'one-month') => apiRequest(`/MedicalRecords/expense-by-pet?period=${period}`),
}

// ==================== FeedingRecords API ====================
export const FeedingRecordsAPI = {
  // 取得全部餵食紀錄
  getAll: () => apiRequest('/FeedingRecords'),

  // 取得指定餵食紀錄
  getById: (id) => apiRequest(`/FeedingRecords/${id}`),

  // 新增餵食紀錄
  create: (recordData) => apiRequest('/FeedingRecords', {
    method: 'POST',
    body: JSON.stringify(recordData),
  }),

  // 更新餵食紀錄
  update: (id, recordData) => apiRequest(`/FeedingRecords/${id}`, {
    method: 'PUT',
    body: JSON.stringify(recordData),
  }),

  // 刪除餵食紀錄
  delete: (id) => apiRequest(`/FeedingRecords/${id}`, {
    method: 'DELETE',
  }),
}

// ==================== PetStatusRecords API ====================
export const PetStatusRecordsAPI = {
  // 取得全部狀態紀錄
  getAll: () => apiRequest('/PetStatusRecords'),

  // 取得指定狀態紀錄
  getById: (id) => apiRequest(`/PetStatusRecords/${id}`),

  // 新增狀態紀錄
  create: (recordData) => apiRequest('/PetStatusRecords', {
    method: 'POST',
    body: JSON.stringify(recordData),
  }),

  // 更新狀態紀錄
  update: (id, recordData) => apiRequest(`/PetStatusRecords/${id}`, {
    method: 'PUT',
    body: JSON.stringify(recordData),
  }),

  // 刪除狀態紀錄
  delete: (id) => apiRequest(`/PetStatusRecords/${id}`, {
    method: 'DELETE',
  }),
}

// ==================== HealthRecords API ====================
export const HealthRecordsAPI = {
  // 取得全部健康紀錄
  getAll: () => apiRequest('/HealthRecords'),

  // 取得指定健康紀錄
  getById: (id) => apiRequest(`/HealthRecords/${id}`),

  // 新增健康紀錄
  create: (recordData) => apiRequest('/HealthRecords', {
    method: 'POST',
    body: JSON.stringify(recordData),
  }),

  // 更新健康紀錄
  update: (id, recordData) => apiRequest(`/HealthRecords/${id}`, {
    method: 'PUT',
    body: JSON.stringify(recordData),
  }),

  // 刪除健康紀錄
  delete: (id) => apiRequest(`/HealthRecords/${id}`, {
    method: 'DELETE',
  }),
}

// ==================== InventoryItems API ====================
export const InventoryItemsAPI = {
  // 取得全部庫存項目
  getAll: () => apiRequest('/InventoryItems'),

  // 取得指定庫存項目
  getById: (id) => apiRequest(`/InventoryItems/${id}`),

  // 新增庫存項目
  create: (itemData) => apiRequest('/InventoryItems', {
    method: 'POST',
    body: JSON.stringify(itemData),
  }),

  // 更新庫存項目
  update: (id, itemData) => apiRequest(`/InventoryItems/${id}`, {
    method: 'PUT',
    body: JSON.stringify(itemData),
  }),

  // 刪除庫存項目
  delete: (id) => apiRequest(`/InventoryItems/${id}`, {
    method: 'DELETE',
  }),
}

// ==================== DiaryEntries API ====================
export const DiaryEntriesAPI = {
  // 取得全部日記
  getAll: () => apiRequest('/DiaryEntries'),

  // 取得指定日記
  getById: (id) => apiRequest(`/DiaryEntries/${id}`),

  // 新增日記
  create: (entryData) => apiRequest('/DiaryEntries', {
    method: 'POST',
    body: JSON.stringify(entryData),
  }),

  // 更新日記
  update: (id, entryData) => apiRequest(`/DiaryEntries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(entryData),
  }),

  // 刪除日記
  delete: (id) => apiRequest(`/DiaryEntries/${id}`, {
    method: 'DELETE',
  }),
}

// 統一匯出所有 API
export default {
  Pets: PetsAPI,
  MedicalRecords: MedicalRecordsAPI,
  FeedingRecords: FeedingRecordsAPI,
  PetStatusRecords: PetStatusRecordsAPI,
  HealthRecords: HealthRecordsAPI,
  InventoryItems: InventoryItemsAPI,
  DiaryEntries: DiaryEntriesAPI,
}

import axios from 'axios'

/**
 * 取得圖片 URL
 * @param {string} path - 圖片路徑
 * @returns {Promise<string>} - 回傳可用於 <img> 的圖片 URL
 */
export async function getImageUrl(path) {
  // 如果沒有提供路徑，直接回傳預設圖片
  if (!path) {
    return '/default.jpg'
  }

  try {
    // 取得當前使用者的 token（從 Firebase Auth）
    const { auth } = await import('../firebase')
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : null

    // 使用 axios 取得圖片，設定 responseType 為 blob
    const response = await axios.get('/api/Upload/image', {
      params: { path },
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })

    // 將 blob 轉換成可用的 URL
    const imageUrl = URL.createObjectURL(response.data)
    return imageUrl

  } catch (error) {
    console.error('載入圖片失敗:', error)
    // 若發生錯誤，回傳預設圖片
    return '/default.jpg'
  }
}

/**
 * 釋放圖片 URL（避免記憶體洩漏）
 * @param {string} url - 要釋放的 URL
 */
export function revokeImageUrl(url) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

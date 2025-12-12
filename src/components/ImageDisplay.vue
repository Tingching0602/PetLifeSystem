<template>
  <div class="image-display">
    <img :src="imageUrl" :alt="altText" @error="handleImageError" />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { getImageUrl, revokeImageUrl } from '../utils/imageService'

export default {
  name: 'ImageDisplay',
  props: {
    // 圖片路徑
    imagePath: {
      type: String,
      default: ''
    },
    // 替代文字
    altText: {
      type: String,
      default: '圖片'
    }
  },
  setup(props) {
    const imageUrl = ref('/default.jpg')

    // 載入圖片
    const loadImage = async () => {
      // 釋放舊的 URL
      revokeImageUrl(imageUrl.value)
      
      // 載入新圖片
      imageUrl.value = await getImageUrl(props.imagePath)
    }

    // 圖片載入失敗時的處理
    const handleImageError = () => {
      if (imageUrl.value !== '/default.jpg') {
        imageUrl.value = '/default.jpg'
      }
    }

    // 當圖片路徑改變時重新載入
    watch(() => props.imagePath, () => {
      loadImage()
    })

    // 元件掛載時載入圖片
    onMounted(() => {
      loadImage()
    })

    // 元件卸載時釋放 URL，避免記憶體洩漏
    onUnmounted(() => {
      revokeImageUrl(imageUrl.value)
    })

    return {
      imageUrl,
      handleImageError
    }
  }
}
</script>

<style scoped>
.image-display {
  width: 100%;
  height: 100%;
}

.image-display img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
</style>

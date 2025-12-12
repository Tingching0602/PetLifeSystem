<template>
  <div class="image-usage-examples">
    <h2>圖片服務使用範例</h2>

    <!-- 方法 1: 使用封裝的 ImageDisplay 元件 -->
    <section>
      <h3>方法 1: 使用 ImageDisplay 元件</h3>
      <ImageDisplay 
        :image-path="petImagePath" 
        alt-text="寵物照片" 
      />
    </section>

    <!-- 方法 2: 直接在元件中使用 -->
    <section>
      <h3>方法 2: 直接使用 getImageUrl</h3>
      <img :src="directImageUrl" alt="直接載入的圖片" />
    </section>

    <!-- 方法 3: 多張圖片列表 -->
    <section>
      <h3>方法 3: 圖片列表</h3>
      <div class="image-grid">
        <div v-for="(url, index) in imageUrls" :key="index" class="image-item">
          <img :src="url" :alt="`圖片 ${index + 1}`" />
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import ImageDisplay from '../components/ImageDisplay.vue'
import { getImageUrl, revokeImageUrl } from '../utils/imageService'

export default {
  name: 'ImageServiceUsage',
  components: {
    ImageDisplay
  },
  setup() {
    // 方法 1: 使用元件
    const petImagePath = ref('uploads/pets/pet_123.jpg')

    // 方法 2: 直接使用
    const directImageUrl = ref('/default.jpg')
    
    const loadDirectImage = async () => {
      directImageUrl.value = await getImageUrl('uploads/medical/record_456.jpg')
    }

    // 方法 3: 載入多張圖片
    const imagePaths = [
      'uploads/pets/pet_1.jpg',
      'uploads/pets/pet_2.jpg',
      'uploads/pets/pet_3.jpg'
    ]
    const imageUrls = ref([])

    const loadMultipleImages = async () => {
      const promises = imagePaths.map(path => getImageUrl(path))
      imageUrls.value = await Promise.all(promises)
    }

    onMounted(async () => {
      await loadDirectImage()
      await loadMultipleImages()
    })

    onUnmounted(() => {
      // 清理所有 blob URLs
      revokeImageUrl(directImageUrl.value)
      imageUrls.value.forEach(url => revokeImageUrl(url))
    })

    return {
      petImagePath,
      directImageUrl,
      imageUrls
    }
  }
}
</script>

<style scoped>
.image-usage-examples {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

section {
  margin-bottom: 40px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 10px;
}

h2 {
  color: #2c3e50;
  margin-bottom: 30px;
}

h3 {
  color: #42b983;
  margin-bottom: 15px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.image-item {
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

img {
  max-width: 300px;
  border-radius: 8px;
}
</style>

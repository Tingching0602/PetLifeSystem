<template>
  <div class="pet-diary">
    <h2>📝 寵物日記</h2>
    
    <div class="form-section">
      <div class="input-group">
        <label>日期</label>
        <input type="date" v-model="currentEntry.date" />
      </div>
      
      <div class="input-group">
        <label>標題</label>
        <input type="text" v-model="currentEntry.title" placeholder="今天發生了什麼呢？" />
      </div>
      
      <div class="input-group">
        <label>心情</label>
        <div class="mood-selector">
          <button 
            v-for="mood in moods" 
            :key="mood.emoji"
            @click="currentEntry.mood = mood.emoji"
            :class="['mood-btn', { active: currentEntry.mood === mood.emoji }]"
          >
            {{ mood.emoji }} {{ mood.label }}
          </button>
        </div>
      </div>
      
      <div class="input-group full-width">
        <label>日記內容</label>
        <textarea 
          v-model="currentEntry.content" 
          rows="8" 
          placeholder="記錄與寵物的美好時光，牠今天做了什麼可愛的事情呢？&#10;&#10;例如：&#10;- 今天帶毛孩去公園散步，牠看到其他狗狗超開心&#10;- 發現牠喜歡新買的玩具&#10;- 今天特別黏人，一直跟著我"
        ></textarea>
      </div>
      
      <div class="input-group">
        <label>照片上傳（選填）</label>
        <input type="file" @change="handleFileUpload" accept="image/*" class="file-input" />
        <div v-if="currentEntry.photoUrl" class="preview-container">
          <img :src="currentEntry.photoUrl" alt="預覽" class="photo-preview" />
          <button @click="removePhoto" class="btn-remove-photo">移除照片</button>
        </div>
      </div>
      
      <div class="input-group">
        <label>標籤</label>
        <div class="tag-input">
          <input 
            type="text" 
            v-model="tagInput" 
            @keyup.enter="addTag"
            placeholder="按 Enter 新增標籤"
          />
          <div class="tags-list">
            <span v-for="(tag, index) in currentEntry.tags" :key="index" class="tag">
              {{ tag }}
              <button @click="removeTag(index)">×</button>
            </span>
          </div>
        </div>
      </div>
      
      <button @click="addEntry" class="btn-primary">儲存日記</button>
    </div>

    <div class="filter-section">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="搜尋日記..." 
        class="search-input"
      />
      <select v-model="filterMood" class="mood-filter">
        <option value="">全部心情</option>
        <option v-for="mood in moods" :key="mood.emoji" :value="mood.emoji">
          {{ mood.emoji }} {{ mood.label }}
        </option>
      </select>
    </div>

    <div class="diary-list">
      <h3>日記列表 ({{ filteredEntries.length }})</h3>
      <div v-if="filteredEntries.length === 0" class="empty-state">
        暫無日記記錄
      </div>
      <div v-else class="diary-entry" v-for="(entry, index) in filteredEntries" :key="index">
        <div class="entry-header">
          <div>
            <h4>{{ entry.title }}</h4>
            <span class="entry-date">{{ entry.date }}</span>
          </div>
          <div class="entry-actions">
            <span class="entry-mood">{{ entry.mood }}</span>
            <button @click="deleteEntry(entry)" class="btn-delete">刪除</button>
          </div>
        </div>
        <div class="entry-content">
          <p>{{ entry.content }}</p>
          <img v-if="entry.photoUrl" :src="entry.photoUrl" alt="寵物照片" class="entry-photo" />
          <div v-if="entry.tags.length > 0" class="entry-tags">
            <span v-for="(tag, i) in entry.tags" :key="i" class="tag-readonly">
              #{{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PetDiary',
  props: {
    petId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      currentEntry: {
        date: new Date().toISOString().split('T')[0],
        title: '',
        mood: '😊',
        content: '',
        photoUrl: '',
        tags: []
      },
      entries: [],
      tagInput: '',
      searchQuery: '',
      filterMood: '',
      moods: [
        { emoji: '😊', label: '開心' },
        { emoji: '😍', label: '超愛' },
        { emoji: '😴', label: '放鬆' },
        { emoji: '🤔', label: '思考' },
        { emoji: '😢', label: '難過' },
        { emoji: '😤', label: '生氣' }
      ]
    }
  },
  computed: {
    filteredEntries() {
      let filtered = [...this.entries];
      
      // 依心情篩選
      if (this.filterMood) {
        filtered = filtered.filter(entry => entry.mood === this.filterMood);
      }
      
      // 依搜尋關鍵字篩選
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(entry => 
          entry.title.toLowerCase().includes(query) ||
          entry.content.toLowerCase().includes(query) ||
          entry.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      // 依日期排序（最新的在前）
      return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  },
  methods: {
    addEntry() {
      if (!this.currentEntry.title || !this.currentEntry.content) {
        alert('請填寫標題和內容');
        return;
      }
      
      this.entries.push({ ...this.currentEntry });
      this.saveToLocalStorage();
      
      // 重置表單
      this.currentEntry = {
        date: new Date().toISOString().split('T')[0],
        title: '',
        mood: '😊',
        content: '',
        photoUrl: '',
        tags: []
      };
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        // 檢查檔案大小（限制為 5MB）
        if (file.size > 5 * 1024 * 1024) {
          alert('檔案大小不能超過 5MB');
          event.target.value = '';
          return;
        }
        
        // 檢查檔案類型
        if (!file.type.startsWith('image/')) {
          alert('請上傳圖片檔案');
          event.target.value = '';
          return;
        }
        
        // 將圖片轉換為 Base64
        const reader = new FileReader();
        reader.onload = (e) => {
          this.currentEntry.photoUrl = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },
    removePhoto() {
      this.currentEntry.photoUrl = '';
      // 清除 file input
      const fileInput = document.querySelector('.file-input');
      if (fileInput) {
        fileInput.value = '';
      }
    },
    deleteEntry(entry) {
      const index = this.entries.indexOf(entry);
      if (index > -1 && confirm('確定要刪除這篇日記嗎？')) {
        this.entries.splice(index, 1);
        this.saveToLocalStorage();
      }
    },
    addTag() {
      if (this.tagInput.trim() && !this.currentEntry.tags.includes(this.tagInput.trim())) {
        this.currentEntry.tags.push(this.tagInput.trim());
        this.tagInput = '';
      }
    },
    removeTag(index) {
      this.currentEntry.tags.splice(index, 1);
    },
    saveToLocalStorage() {
      localStorage.setItem(`petDiary_${this.petId}`, JSON.stringify(this.entries));
    },
    loadFromLocalStorage() {
      const saved = localStorage.getItem(`petDiary_${this.petId}`);
      if (saved) {
        this.entries = JSON.parse(saved);
      }
    }
  },
  mounted() {
    this.loadFromLocalStorage();
  }
}
</script>

<style scoped>
.pet-diary {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  color: #2c3e50;
  margin-bottom: 20px;
}

h3 {
  color: #42b983;
  margin-bottom: 15px;
}

.form-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.input-group.full-width {
  grid-column: 1 / -1;
}

.input-group label {
  margin-bottom: 5px;
  font-weight: 600;
  color: #2c3e50;
}

.input-group input,
.input-group textarea {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.input-group textarea {
  resize: vertical;
}

.file-input {
  cursor: pointer;
}

.preview-container {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.photo-preview {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  object-fit: contain;
  border: 2px solid #e0e0e0;
}

.btn-remove-photo {
  background: #f44336;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
  align-self: flex-start;
}

.btn-remove-photo:hover {
  background: #d32f2f;
}

.mood-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mood-btn {
  padding: 8px 12px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.mood-btn:hover {
  border-color: #42b983;
}

.mood-btn.active {
  background: #42b983;
  color: white;
  border-color: #42b983;
}

.tag-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag {
  background: #42b983;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.tag button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  line-height: 1;
}

.btn-primary {
  grid-column: 1 / -1;
  background: #42b983;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: #359268;
}

.filter-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input,
.mood-filter {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-input {
  flex: 1;
}

.mood-filter {
  min-width: 150px;
}

.diary-list {
  margin-top: 30px;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 40px;
  background: #f8f9fa;
  border-radius: 8px;
}

.diary-entry {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
  transition: box-shadow 0.3s;
}

.diary-entry:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.entry-header h4 {
  margin: 0 0 5px 0;
  color: #2c3e50;
}

.entry-date {
  color: #999;
  font-size: 14px;
}

.entry-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.entry-mood {
  font-size: 24px;
}

.btn-delete {
  background: #f44336;
  color: white;
  padding: 5px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.3s;
}

.btn-delete:hover {
  background: #d32f2f;
}

.entry-content p {
  color: #2c3e50;
  line-height: 1.6;
  white-space: pre-wrap;
  margin-bottom: 15px;
}

.entry-photo {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin-bottom: 15px;
}

.entry-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag-readonly {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

@media (max-width: 768px) {
  .pet-diary {
    padding: 15px 10px;
  }

  h2 {
    font-size: 1.5em;
  }

  .form-section {
    padding: 15px;
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .input-group input,
  .input-group textarea {
    font-size: 16px;
  }

  .mood-selector {
    gap: 6px;
  }

  .mood-btn {
    padding: 6px 10px;
    font-size: 13px;
  }

  .filter-section {
    flex-direction: column;
    gap: 8px;
  }

  .search-input,
  .mood-filter {
    width: 100%;
    font-size: 16px;
  }

  .diary-entry {
    padding: 15px;
  }

  .entry-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .entry-actions {
    align-self: flex-end;
  }

  .entry-mood {
    font-size: 20px;
  }

  .entry-photo {
    max-height: 250px;
  }

  .photo-preview-container {
    margin-top: 8px;
  }

  .pet-photo-preview {
    max-height: 180px;
  }
}

@media (max-width: 480px) {
  h2 {
    font-size: 1.3em;
  }

  h3 {
    font-size: 1.1em;
  }

  .form-section {
    padding: 12px;
  }

  .mood-btn {
    padding: 5px 8px;
    font-size: 12px;
  }

  .btn-primary {
    padding: 10px 20px;
    font-size: 15px;
  }

  .diary-entry {
    padding: 12px;
  }

  .entry-header h4 {
    font-size: 16px;
  }

  .entry-content p {
    font-size: 14px;
  }
}
</style>

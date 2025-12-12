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
            type="button"
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
      
      <div class="input-group full-width">
        <label>照片上傳（最多 5 張）</label>
        <p class="photo-hint">💡 照片會自動壓縮以節省空間</p>
        <input 
          type="file" 
          @change="handleFileUpload" 
          accept="image/*" 
          multiple
          class="file-input" 
          ref="fileInput"
        />
        <div v-if="currentEntry.photos.length > 0" class="preview-container">
          <div v-for="(photo, index) in currentEntry.photos" :key="index" class="photo-item">
            <img :src="photo" alt="預覽" class="photo-preview" />
            <button @click="removePhoto(index)" class="btn-remove-photo">×</button>
          </div>
        </div>
        <p v-if="currentEntry.photos.length > 0" class="photo-count">
          已上傳 {{ currentEntry.photos.length }} / 5 張
        </p>
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
      
      <button type="button" @click="addEntry" class="btn-primary">儲存日記</button>
    </div>

    <div class="diary-list">
      <h3>日記列表</h3>
      
      <!-- 篩選區 -->
      <div v-if="entries.length > 0" class="filter-section">
        <div class="filter-group">
          <label>日期篩選</label>
          <div class="date-filter">
            <input type="date" v-model="filter.startDate" placeholder="開始日期" />
            <span class="date-separator">至</span>
            <input type="date" v-model="filter.endDate" placeholder="結束日期" />
          </div>
        </div>
        
        <div class="filter-group">
          <label>標題關鍵字搜尋</label>
          <input 
            type="text" 
            v-model="filter.keyword" 
            placeholder="搜尋日記標題..." 
            class="keyword-input"
          />
        </div>
        
        <div class="filter-group">
          <label>心情篩選</label>
          <div class="mood-filter-buttons">
            <button 
              type="button"
              @click="filter.mood = ''"
              :class="['filter-btn', { active: filter.mood === '' }]"
            >
              全部
            </button>
            <button 
              type="button"
              v-for="mood in moods" 
              :key="mood.emoji"
              @click="filter.mood = mood.emoji"
              :class="['filter-btn', 'mood-filter-btn', { active: filter.mood === mood.emoji }]"
            >
              {{ mood.emoji }} {{ mood.label }}
            </button>
          </div>
        </div>
        
        <button 
          v-if="filter.startDate || filter.endDate || filter.keyword || filter.mood"
          @click="clearFilters" 
          class="btn-clear-filter"
        >
          清除篩選
        </button>
      </div>
      
      <div class="results-info" v-if="entries.length > 0">
        <span>顯示 {{ filteredEntries.length }} / {{ entries.length }} 篇日記</span>
      </div>
      
      <div v-if="filteredEntries.length === 0" class="empty-state">
        {{ entries.length === 0 ? '暫無日記記錄' : '無符合條件的日記' }}
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
          <div v-if="entry.photos && entry.photos.length > 0" class="entry-photos">
            <img v-for="(photo, i) in entry.photos" :key="i" :src="photo" alt="寵物照片" class="entry-photo" />
          </div>
          <!-- 相容性：支援舊版單張照片 -->
          <img v-else-if="entry.photoUrl" :src="entry.photoUrl" alt="寵物照片" class="entry-photo-single" />
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
import { DiaryEntriesAPI } from '../services/api'

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
        photos: [],
        tags: []
      },
      entries: [],
      tagInput: '',
      filter: {
        startDate: '',
        endDate: '',
        keyword: '',
        mood: ''
      },
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
      
      // 日期篩選
      if (this.filter.startDate) {
        filtered = filtered.filter(entry => entry.date >= this.filter.startDate);
      }
      if (this.filter.endDate) {
        filtered = filtered.filter(entry => entry.date <= this.filter.endDate);
      }
      
      // 心情篩選
      if (this.filter.mood) {
        filtered = filtered.filter(entry => entry.mood === this.filter.mood);
      }
      
      // 關鍵字搜尋（僅標題）
      if (this.filter.keyword) {
        const query = this.filter.keyword.toLowerCase();
        filtered = filtered.filter(entry => 
          entry.title.toLowerCase().includes(query)
        );
      }
      
      // 依日期排序（最新的在前）
      return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  },
  methods: {
    clearFilters() {
      this.filter = {
        startDate: '',
        endDate: '',
        keyword: '',
        mood: ''
      };
    },
    async addEntry() {
      if (!this.currentEntry.title || !this.currentEntry.content) {
        alert('請填寫標題和內容');
        return;
      }
      
      console.log('[PetDiary] 準備新增日記');
      console.log('[PetDiary] this.petId:', this.petId);
      console.log('[PetDiary] petId type:', typeof this.petId);
      console.log('[PetDiary] currentEntry.tags:', this.currentEntry.tags);
      console.log('[PetDiary] tags.length:', this.currentEntry.tags.length);
      console.log('[PetDiary] tags joined:', this.currentEntry.tags.join(','));
      console.log('[PetDiary] currentEntry.photos:', this.currentEntry.photos);
      console.log('[PetDiary] photos.length:', this.currentEntry.photos.length);
      
      // 確保 petId 存在
      if (!this.petId) {
        alert('錯誤：找不到寵物 ID，請重新選擇寵物');
        console.error('[PetDiary] petId is null or undefined!');
        return;
      }
      
      try {
        // 準備 API 資料（後端格式）
        // 同時送出 camelCase 和 PascalCase 以確保相容性
        const petIdValue = Number(this.petId);
        const tagsString = (this.currentEntry.tags && this.currentEntry.tags.length > 0) ? this.currentEntry.tags.join(',') : null;
        
        console.log('[PetDiary] 準備的 tags 字串:', tagsString);
        
        const entryData = {
          petId: petIdValue,           // camelCase
          PetId: petIdValue,           // PascalCase
          date: this.currentEntry.date,
          Date: this.currentEntry.date,
          title: this.currentEntry.title.trim(),
          Title: this.currentEntry.title.trim(),
          mood: this.currentEntry.mood || '😊',
          Mood: this.currentEntry.mood || '😊',
          content: this.currentEntry.content.trim(),
          Content: this.currentEntry.content.trim(),
          photoUrl: (this.currentEntry.photos.length > 0 && this.currentEntry.photos[0]) ? this.currentEntry.photos[0] : null,
          PhotoUrl: (this.currentEntry.photos.length > 0 && this.currentEntry.photos[0]) ? this.currentEntry.photos[0] : null,
          tags: tagsString,
          Tags: tagsString
        };
        
        console.log('[PetDiary] 準備發送的資料:', entryData);
        console.log('[PetDiary] entryData.PetId:', entryData.PetId);
        console.log('[PetDiary] entryData.petId:', entryData.petId);
        console.log('[PetDiary] entryData.Tags:', entryData.Tags);
        console.log('[PetDiary] entryData.tags:', entryData.tags);
        console.log('[PetDiary] photoUrl 長度:', entryData.PhotoUrl ? entryData.PhotoUrl.length : 0);
        
        // 呼叫 API
        const createdEntry = await DiaryEntriesAPI.create(entryData);
        console.log('[PetDiary] API 回應:', createdEntry);
        console.log('[PetDiary] createdEntry 的所有 keys:', Object.keys(createdEntry));
        
        // 如果後端只返回 ID，則重新從 API 載入完整資料
        let fullEntry;
        if (typeof createdEntry === 'number' || createdEntry.id || createdEntry.Id) {
          const newId = typeof createdEntry === 'number' ? createdEntry : (createdEntry.id || createdEntry.Id);
          console.log('[PetDiary] 後端只返回 ID:', newId, '，重新載入完整資料');
          
          // 方法1: 重新載入所有日記（最簡單可靠）
          await this.loadFromLocalStorage();
          
          // 重置表單（包含 tagInput）
          this.currentEntry = {
            date: new Date().toISOString().split('T')[0],
            title: '',
            mood: '😊',
            content: '',
            photos: [],
            tags: []
          };
          this.tagInput = ''; // 清空標籤輸入框
          
          alert('日記已儲存');
          
          return; // 直接返回，不繼續執行下面的程式碼
        }
        
        // 如果後端返回完整物件（以下是備用邏輯）
        // 新增到前端列表（轉換格式）
        // 後端實際返回 camelCase
        const dateValue = createdEntry.date || createdEntry.Date || new Date().toISOString();
        const tagsValue = createdEntry.tags || createdEntry.Tags;
        
        const newEntry = {
          id: createdEntry.id || createdEntry.Id,
          date: dateValue.split('T')[0], // 從 DateTime 轉為日期
          title: createdEntry.title || createdEntry.Title,
          mood: createdEntry.mood || createdEntry.Mood,
          content: createdEntry.content || createdEntry.Content,
          photos: (createdEntry.photoUrl || createdEntry.PhotoUrl) ? [createdEntry.photoUrl || createdEntry.PhotoUrl] : [], // 轉為陣列
          tags: tagsValue ? tagsValue.split(',').map(t => t.trim()).filter(t => t) : [] // 從字串轉為陣列
        };
        
        console.log('[PetDiary] 準備加入列表的新日記:', newEntry);
        console.log('[PetDiary] 加入前的 entries 數量:', this.entries.length);
        
        // 使用 unshift 將新日記加到最前面（最新的在上方）
        this.entries.unshift(newEntry);
        
        console.log('[PetDiary] 加入後的 entries 數量:', this.entries.length);
        console.log('[PetDiary] entries 列表:', this.entries);
        
        // 強制觸發響應式更新（Vue 2 寫法，但 Vue 3 也相容）
        this.$forceUpdate();
        
        // 儲存到 localStorage 作為備份
        this.saveToLocalStorage();
        
        // 重置表單
        this.currentEntry = {
          date: new Date().toISOString().split('T')[0],
          title: '',
          mood: '😊',
          content: '',
          photos: [],
          tags: []
        };
        
        alert('日記已儲存');
      } catch (error) {
        console.error('[PetDiary] 新增日記失敗:', error);
        
        // 詳細錯誤訊息
        let errorMsg = '新增日記失敗';
        if (error.message) {
          errorMsg += ': ' + error.message;
        }
        if (error.status) {
          errorMsg += ' (狀態碼: ' + error.status + ')';
        }
        
        console.error('[PetDiary] 錯誤詳情:', errorMsg);
        alert(errorMsg);
      }
    },
    handleFileUpload(event) {
      const files = Array.from(event.target.files);
      
      // 檢查照片數量
      const remainingSlots = 5 - this.currentEntry.photos.length;
      if (files.length > remainingSlots) {
        alert(`最多只能上傳 5 張照片，您還可以上傳 ${remainingSlots} 張`);
        event.target.value = '';
        return;
      }
      
      // 處理每張照片（使用 Promise 避免重複添加）
      const promises = files.map(file => {
        return new Promise((resolve, reject) => {
          // 檢查檔案大小（限制為 5MB）
          if (file.size > 5 * 1024 * 1024) {
            alert(`${file.name} 檔案大小不能超過 5MB`);
            resolve(null);
            return;
          }
          
          // 檢查檔案類型
          if (!file.type.startsWith('image/')) {
            alert(`${file.name} 不是圖片檔案`);
            resolve(null);
            return;
          }
          
          // 壓縮圖片
          this.compressImage(file, (compressedDataUrl) => {
            resolve(compressedDataUrl);
          });
        });
      });
      
      // 等待所有照片處理完成後再添加
      Promise.all(promises).then(results => {
        results.forEach(dataUrl => {
          if (dataUrl && this.currentEntry.photos.length < 5) {
            this.currentEntry.photos.push(dataUrl);
          }
        });
      });
      
      // 清除 file input
      event.target.value = '';
    },
    compressImage(file, callback) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // 設定最大寬高為 800px，保持比例
          const maxSize = 800;
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // 壓縮品質設為 0.7（70%）
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          callback(compressedDataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    removePhoto(index) {
      this.currentEntry.photos.splice(index, 1);
    },
    async deleteEntry(entry) {
      if (!confirm('確定要刪除這篇日記嗎？')) {
        return;
      }
      
      try {
        // 呼叫 API 刪除
        if (entry.id) {
          await DiaryEntriesAPI.delete(entry.id);
        }
        
        // 從前端列表移除
        const index = this.entries.indexOf(entry);
        if (index > -1) {
          this.entries.splice(index, 1);
          this.saveToLocalStorage();
        }
      } catch (error) {
        console.error('刪除日記失敗:', error);
        alert('刪除日記失敗，請稍後再試');
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
      try {
        localStorage.setItem(`petDiary_${this.petId}`, JSON.stringify(this.entries));
      } catch (e) {
        if (e.name === 'QuotaExceededError') {
          alert('儲存空間已滿！請刪除一些舊的日記或減少照片數量。\n\n建議：每篇日記最多上傳 2-3 張照片以節省空間。');
        } else {
          alert('儲存失敗：' + e.message);
        }
        throw e;
      }
    },
    async loadFromLocalStorage() {
      console.log('[PetDiary] 開始載入日記，petId:', this.petId);
      
      try {
        // 優先從 API 載入
        console.log('[PetDiary] 呼叫 DiaryEntriesAPI.getAll()');
        const data = await DiaryEntriesAPI.getAll();
        console.log('[PetDiary] API 返回資料:', data);
        
        // 轉換後端資料格式為前端格式
        // 後端實際返回 camelCase，但也支援 PascalCase 以防萬一
        this.entries = data
          .filter(entry => {
            const entryPetId = entry.petId || entry.PetId; // 優先 camelCase
            console.log(`[PetDiary] 過濾檢查: entry.petId=${entryPetId}, this.petId=${this.petId}, 是否相等: ${entryPetId === this.petId}`);
            return entryPetId === this.petId;
          })
          .map(entry => {
            const dateValue = entry.date || entry.Date || new Date().toISOString();
            const tagsValue = entry.tags || entry.Tags;
            
            console.log(`[PetDiary] 處理日記 ID ${entry.id}: tags="${tagsValue}"`);
            
            return {
              id: entry.id || entry.Id,
              date: dateValue.split('T')[0], // 從 DateTime 轉為日期字串
              title: entry.title || entry.Title || '',
              mood: entry.mood || entry.Mood || '😊',
              content: entry.content || entry.Content || '',
              photos: (entry.photoUrl || entry.PhotoUrl) ? [entry.photoUrl || entry.PhotoUrl] : [], // 單張轉為陣列
              tags: tagsValue ? tagsValue.split(',').map(t => t.trim()).filter(t => t) : [] // 字串轉為陣列
            };
          });
        
        console.log('[PetDiary] 過濾後的日記數量:', this.entries.length);
        
        // 同步到 localStorage 作為備份
        this.saveToLocalStorage();
      } catch (error) {
        console.error('[PetDiary] 從 API 載入日記失敗，嘗試從本地載入:', error);
        
        // API 失敗時從 localStorage 載入
        const saved = localStorage.getItem(`petDiary_${this.petId}`);
        if (saved) {
          this.entries = JSON.parse(saved);
          console.log('[PetDiary] 從 localStorage 載入的日記數量:', this.entries.length);
        }
      }
    }
  },
  mounted() {
    console.log('[PetDiary] mounted 鉤子執行，petId:', this.petId);
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e0e0e0;
}

.photo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-remove-photo {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(244, 67, 54, 0.9);
  color: white;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.btn-remove-photo:hover {
  background: rgba(211, 47, 47, 1);
  transform: scale(1.1);
}

.photo-count {
  margin-top: 8px;
  color: #666;
  font-size: 13px;
  font-weight: 600;
}

.photo-hint {
  margin: 0 0 8px 0;
  color: #999;
  font-size: 12px;
  font-style: italic;
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

.diary-list {
  margin-top: 30px;
}

.filter-section {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-group {
  margin-bottom: 15px;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.date-filter input {
  flex: 1;
  min-width: 140px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.date-separator {
  color: #666;
  font-weight: 600;
}

.keyword-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.mood-filter-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid #ddd;
  background: white;
  color: #666;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.filter-btn:hover {
  border-color: #42b983;
  background: #f0f9f4;
}

.filter-btn.active {
  border-color: #42b983;
  background: #42b983;
  color: white;
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.3);
}

.filter-btn:active {
  transform: scale(0.98);
}

.btn-clear-filter {
  background: #ff9800;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.3s;
  margin-top: 10px;
  width: 100%;
}

.btn-clear-filter:hover {
  background: #f57c00;
}

.results-info {
  margin-bottom: 15px;
  color: #666;
  font-size: 14px;
  font-weight: 600;
  text-align: right;
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

.entry-photos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
}

.entry-photo {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s;
}

.entry-photo:hover {
  transform: scale(1.02);
}

.entry-photo-single {
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
    padding: 12px;
  }
  
  .date-filter {
    gap: 8px;
  }
  
  .date-filter input {
    font-size: 16px;
  }
  
  .date-separator {
    font-size: 14px;
  }
  
  .keyword-input {
    font-size: 16px;
  }
  
  .filter-btn {
    padding: 10px 14px;
    font-size: 14px;
  }
  
  .results-info {
    font-size: 13px;
    text-align: center;
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
  
  .preview-container {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
  
  .entry-photos {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .entry-photo {
    height: 150px;
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

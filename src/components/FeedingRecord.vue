<template>
  <div class="feeding-record">
    <h2>🍽️ 飲食記錄</h2>
    
    <div class="form-section">
      <div class="input-group">
        <label>日期</label>
        <input type="date" v-model="currentRecord.date" />
      </div>
      
      <div class="input-group">
        <label>時間</label>
        <input type="time" v-model="currentRecord.time" />
      </div>
      
      <div class="input-group">
        <label>飲食種類</label>
        <div class="food-type-selector">
          <button 
            type="button"
            v-for="type in foodTypes" 
            :key="type"
            @click="currentRecord.foodType = type"
            :class="['food-type-btn', { active: currentRecord.foodType === type }]"
          >
            {{ type }}
          </button>
          <button 
            type="button"
            @click="showCustomFoodType = true; currentRecord.foodType = '自訂'"
            :class="['food-type-btn', { active: currentRecord.foodType === '自訂' }]"
          >
            ➕ 自訂
          </button>
        </div>
        <input 
          v-if="showCustomFoodType && currentRecord.foodType === '自訂'"
          type="text" 
          v-model="customFoodType" 
          placeholder="輸入飲食種類名稱" 
          class="custom-food-input"
        />
      </div>
      
      <div class="input-group">
        <label>餵食次數</label>
        <input type="number" v-model="currentRecord.count" min="1" />
      </div>
      
      <div class="input-group">
        <label>備註</label>
        <textarea v-model="currentRecord.notes" rows="3" placeholder="例如：食物種類、份量等"></textarea>
      </div>
      
      <button @click="addRecord" class="btn-primary">新增記錄</button>
    </div>

    <div class="records-list">
      <h3>歷史記錄</h3>
      
      <!-- 篩選區 -->
      <div v-if="records.length > 0" class="filter-section">
        <div class="filter-group">
          <label>日期篩選</label>
          <div class="date-filter">
            <input type="date" v-model="filter.startDate" placeholder="開始日期" />
            <span class="date-separator">至</span>
            <input type="date" v-model="filter.endDate" placeholder="結束日期" />
          </div>
        </div>
        
        <div class="filter-group">
          <label>飲食種類</label>
          <div class="food-type-filter">
            <button 
              type="button"
              @click="filter.foodType = ''"
              :class="['filter-btn', { active: filter.foodType === '' }]"
            >
              全部
            </button>
            <button 
              type="button"
              v-for="type in allFoodTypes" 
              :key="type"
              @click="filter.foodType = type"
              :class="['filter-btn', { active: filter.foodType === type }]"
            >
              {{ type }}
            </button>
          </div>
        </div>
        
        <button 
          v-if="filter.startDate || filter.endDate || filter.foodType"
          @click="clearFilters" 
          class="btn-clear-filter"
        >
          清除篩選
        </button>
      </div>
      
      <div v-if="filteredRecords.length === 0" class="empty-state">
        {{ records.length === 0 ? '暫無記錄' : '無符合條件的記錄' }}
      </div>
      <div v-else class="record-item" v-for="(record, index) in filteredRecords" :key="index">
        <div class="record-header">
          <span class="record-date">{{ record.date }} {{ record.time }}</span>
          <button @click="deleteRecord(index)" class="btn-delete">刪除</button>
        </div>
        <div class="record-content">
          <p v-if="record.foodType"><strong>飲食種類:</strong> <span class="food-type-tag">{{ record.foodType }}</span></p>
          <p><strong>餵食次數:</strong> {{ record.count }} 次</p>
          <p v-if="record.notes"><strong>備註:</strong> {{ record.notes }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { FeedingRecordsAPI } from '../services/api'

export default {
  name: 'FeedingRecord',
  props: {
    petId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      currentRecord: {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        foodType: '乾糧',
        count: 1,
        notes: ''
      },
      records: [],
      foodTypes: ['乾糧', '濕食', '凍乾'],
      customFoodType: '',
      showCustomFoodType: false,
      customFoodTypes: [],
      filter: {
        startDate: '',
        endDate: '',
        foodType: ''
      }
    }
  },
  methods: {
    clearFilters() {
      this.filter = {
        startDate: '',
        endDate: '',
        foodType: ''
      };
    },
    async addRecord() {
      if (!this.currentRecord.date || !this.currentRecord.time) {
        alert('請填寫日期和時間');
        return;
      }
      
      // 處理自訂飲食種類
      let foodType = this.currentRecord.foodType;
      if (this.currentRecord.foodType === '自訂') {
        if (!this.customFoodType.trim()) {
          alert('請輸入自訂飲食種類名稱');
          return;
        }
        foodType = this.customFoodType.trim();
        
        // 將自訂種類加入選項（避免重複）
        if (!this.customFoodTypes.includes(foodType) && !this.foodTypes.includes(foodType)) {
          this.customFoodTypes.push(foodType);
          this.saveCustomFoodTypes();
        }
      }
      
      try {
        // 準備要送到 API 的資料
        const recordData = {
          petId: this.petId,
          recordTime: `${this.currentRecord.date}T${this.currentRecord.time}:00`,
          foodName: foodType,
          brand: '',
          amountGrams: 0,
          mealType: foodType,
          waterMl: 0,
          notes: this.currentRecord.notes || ''
        }
        
        // 呼叫 API 新增記錄
        await FeedingRecordsAPI.create(recordData)
        
        console.log('餵食記錄新增成功')
        
        // 重新載入記錄
        await this.loadRecords()
        
        // 重置表單
        this.currentRecord = {
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          foodType: '乾糧',
          count: 1,
          notes: ''
        };
        this.customFoodType = '';
        this.showCustomFoodType = false;
      } catch (error) {
        console.error('新增餵食記錄失敗：', error)
        alert('新增餵食記錄失敗：' + error.message)
      }
    },
    saveCustomFoodTypes() {
      localStorage.setItem(`customFoodTypes_${this.petId}`, JSON.stringify(this.customFoodTypes));
    },
    loadCustomFoodTypes() {
      const saved = localStorage.getItem(`customFoodTypes_${this.petId}`);
      if (saved) {
        this.customFoodTypes = JSON.parse(saved);
      }
    },
    async deleteRecord(index) {
      const actualRecord = this.filteredRecords[index];
      
      if (!confirm('確定要刪除這筆餵食記錄嗎？')) {
        return;
      }
      
      try {
        // 呼叫 API 刪除記錄
        await FeedingRecordsAPI.delete(actualRecord.id)
        
        console.log('餵食記錄刪除成功')
        
        // 重新載入記錄
        await this.loadRecords()
      } catch (error) {
        console.error('刪除餵食記錄失敗：', error)
        alert('刪除餵食記錄失敗：' + error.message)
      }
    },
    async loadRecords() {
      try {
        // 從 API 取得所有餵食記錄
        const allRecords = await FeedingRecordsAPI.getAll()
        
        // 篩選出該寵物的記錄並轉換格式
        this.records = allRecords
          .filter(record => record.petId === this.petId)
          .map(record => {
            const recordDateTime = new Date(record.recordTime)
            return {
              id: record.id,
              date: recordDateTime.toISOString().split('T')[0],
              time: recordDateTime.toTimeString().slice(0, 5),
              foodType: record.mealType || record.foodName,
              count: 1,
              notes: record.notes
            }
          })
        
        // 同步到 localStorage 作為備援
        localStorage.setItem(`feedingRecords_${this.petId}`, JSON.stringify(this.records))
      } catch (error) {
        console.error('載入餵食記錄失敗：', error)
        
        // 如果 API 失敗，從 localStorage 讀取
        const saved = localStorage.getItem(`feedingRecords_${this.petId}`)
        if (saved) {
          this.records = JSON.parse(saved)
        }
      }
    }
  },
  async mounted() {
    await this.loadRecords()
    this.loadCustomFoodTypes()
  },
  computed: {
    allFoodTypes() {
      return [...this.foodTypes, ...this.customFoodTypes];
    },
    sortedRecords() {
      return [...this.records].sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateB - dateA;
      });
    },
    filteredRecords() {
      let result = this.sortedRecords;
      
      // 日期篩選
      if (this.filter.startDate) {
        result = result.filter(record => record.date >= this.filter.startDate);
      }
      if (this.filter.endDate) {
        result = result.filter(record => record.date <= this.filter.endDate);
      }
      
      // 飲食種類篩選
      if (this.filter.foodType) {
        result = result.filter(record => record.foodType === this.filter.foodType);
      }
      
      return result;
    }
  }
}
</script>

<style scoped>
.feeding-record {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  color: #2c3e50;
  margin-bottom: 20px;
}

h3 {
  color: #42b983;
  margin-top: 30px;
  margin-bottom: 15px;
}

.form-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.input-group {
  margin-bottom: 15px;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #2c3e50;
}

.input-group input,
.input-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.input-group textarea {
  resize: vertical;
  font-family: inherit;
}

.food-type-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.food-type-btn {
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

.food-type-btn:hover {
  border-color: #42b983;
  background: #f0f9f4;
}

.food-type-btn.active {
  border-color: #42b983;
  background: #42b983;
  color: white;
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.3);
}

.food-type-btn:active {
  transform: scale(0.98);
}

.custom-food-input {
  margin-top: 8px;
}

.food-type-tag {
  display: inline-block;
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.btn-primary {
  background: #42b983;
  color: white;
  padding: 10px 24px;
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

.records-list {
  margin-top: 30px;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 40px;
  background: #f8f9fa;
  border-radius: 8px;
}

.record-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  transition: box-shadow 0.3s;
}

.record-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.record-date {
  font-weight: 600;
  color: #42b983;
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

.record-content p {
  margin: 5px 0;
  color: #2c3e50;
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

.food-type-filter {
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
  border-color: #1976d2;
  background: #e3f2fd;
}

.filter-btn.active {
  border-color: #1976d2;
  background: #1976d2;
  color: white;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
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
}

.btn-clear-filter:hover {
  background: #f57c00;
}

@media (max-width: 768px) {
  .feeding-record {
    padding: 15px 10px;
  }

  h2 {
    font-size: 1.5em;
    margin-bottom: 15px;
  }

  h3 {
    font-size: 1.2em;
  }

  .form-section {
    padding: 15px;
  }

  .input-group {
    margin-bottom: 12px;
  }

  .input-group input,
  .input-group textarea {
    font-size: 16px;
  }
  
  .food-type-selector {
    gap: 6px;
  }
  
  .food-type-btn {
    padding: 10px 14px;
    font-size: 14px;
    flex: 1;
    min-width: 70px;
  }

  .btn-primary {
    padding: 12px 20px;
    font-size: 15px;
  }

  .record-item {
    padding: 12px;
  }

  .record-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .record-date {
    font-size: 14px;
  }

  .btn-delete {
    align-self: flex-end;
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
  
  .filter-btn {
    padding: 10px 14px;
    font-size: 14px;
  }
  
  .btn-clear-filter {
    width: 100%;
    padding: 10px;
  }
}

@media (max-width: 480px) {
  h2 {
    font-size: 1.3em;
  }

  .form-section {
    padding: 12px;
  }

  .btn-primary {
    padding: 10px 16px;
    font-size: 14px;
  }

  .record-content p {
    font-size: 14px;
  }
}
</style>

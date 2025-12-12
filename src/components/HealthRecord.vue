<template>
  <div class="health-record">
    <h2>🏥 健康記錄</h2>
    
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
        <label>健康問題</label>
        <select v-model="currentRecord.issueType">
          <option value="">請選擇</option>
          <option value="皮膚問題">皮膚問題</option>
          <option value="消化問題">消化問題</option>
          <option value="呼吸問題">呼吸問題</option>
          <option value="行為異常">行為異常</option>
          <option value="其他">其他</option>
        </select>
      </div>
      
      <div class="input-group">
        <label>症狀描述</label>
        <textarea v-model="currentRecord.symptoms" rows="4" placeholder="詳細描述寵物的症狀"></textarea>
      </div>
      
      <div class="input-group">
        <label>嚴重程度</label>
        <div class="severity-selector">
          <button 
            type="button"
            v-for="level in severityLevels"
            :key="level.value"
            @click="currentRecord.severity = level.value"
            :class="['severity-btn', { active: currentRecord.severity === level.value }]"
          >
            {{ level.label }}
          </button>
        </div>
      </div>
      
      <button @click="addRecord" class="btn-primary">新增記錄</button>
    </div>

    <div class="records-list">
      <h3>健康歷史</h3>
      
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
          <label>健康問題種類</label>
          <div class="issue-type-filter">
            <button 
              type="button"
              @click="filter.issueType = ''"
              :class="['filter-btn', { active: filter.issueType === '' }]"
            >
              全部
            </button>
            <button 
              type="button"
              v-for="type in issueTypes" 
              :key="type"
              @click="filter.issueType = type"
              :class="['filter-btn', { active: filter.issueType === type }]"
            >
              {{ type }}
            </button>
          </div>
        </div>
        
        <div class="filter-group">
          <label>嚴重程度</label>
          <div class="severity-filter">
            <button 
              type="button"
              @click="filter.severity = ''"
              :class="['filter-btn', { active: filter.severity === '' }]"
            >
              全部
            </button>
            <button 
              type="button"
              v-for="level in severityLevels" 
              :key="level.value"
              @click="filter.severity = level.value.toString()"
              :class="['filter-btn', `severity-${level.value}`, { active: filter.severity === level.value.toString() }]"
            >
              {{ level.label }}
            </button>
          </div>
        </div>
        
        <button 
          v-if="filter.startDate || filter.endDate || filter.issueType || filter.severity"
          @click="clearFilters" 
          class="btn-clear-filter"
        >
          清除篩選
        </button>
      </div>
      
      <div v-if="filteredRecords.length === 0" class="empty-state">
        {{ records.length === 0 ? '暫無記錄' : '無符合條件的記錄' }}
      </div>
      <div v-else class="record-item" v-for="(record, index) in filteredRecords" :key="record.id || index">
        <div class="record-header">
          <span class="record-date">{{ record.date }} {{ record.time }}</span>
          <span :class="['severity-badge', `severity-${record.severity}`]">
            {{ getSeverityLabel(record.severity) }}
          </span>
          <button @click="deleteRecord(index)" class="btn-delete">刪除</button>
        </div>
        <div class="record-content">
          <p><strong>問題類型:</strong> {{ record.issueType }}</p>
          <p><strong>症狀:</strong> {{ record.symptoms }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { HealthRecordsAPI } from '../services/api'

export default {
  name: 'HealthRecord',
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
        issueType: '',
        symptoms: '',
        severity: 1
      },
      records: [],
      issueTypes: ['皮膚問題', '消化問題', '呼吸問題', '行為異常', '其他'],
      severityLevels: [
        { value: 1, label: '輕微' },
        { value: 2, label: '輕度' },
        { value: 3, label: '中等' },
        { value: 4, label: '嚴重' },
        { value: 5, label: '非常嚴重' }
      ],
      filter: {
        startDate: '',
        endDate: '',
        issueType: '',
        severity: ''
      }
    }
  },
  computed: {
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
      
      // 健康問題種類篩選
      if (this.filter.issueType) {
        result = result.filter(record => record.issueType === this.filter.issueType);
      }
      
      // 嚴重程度篩選
      if (this.filter.severity) {
        result = result.filter(record => record.severity === parseInt(this.filter.severity));
      }
      
      return result;
    }
  },
  methods: {
    getSeverityLabel(value) {
      const level = this.severityLevels.find(l => l.value === value)
      return level ? level.label : value
    },
    clearFilters() {
      this.filter = {
        startDate: '',
        endDate: '',
        issueType: '',
        severity: ''
      };
    },
    async addRecord() {
      if (!this.currentRecord.date || !this.currentRecord.time || !this.currentRecord.issueType || !this.currentRecord.symptoms) {
        alert('請填寫所有必填欄位');
        return;
      }
      
      try {
        // 準備要送到 API 的資料
        const recordData = {
          date: `${this.currentRecord.date}T00:00:00`,
          time: this.currentRecord.time + ':00',
          healthIssue: this.currentRecord.issueType,
          symptomDescription: this.currentRecord.symptoms,
          severity: parseInt(this.currentRecord.severity)
        }
        
        console.log('準備發送的健康記錄資料:', recordData)
        
        // 呼叫 API 新增記錄
        await HealthRecordsAPI.create(recordData)
        
        console.log('健康記錄新增成功')
        
        // 重置表單
        this.currentRecord = {
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          issueType: '',
          symptoms: '',
          severity: 1
        };
      } catch (error) {
        console.error('新增健康記錄失敗：', error)
        alert('新增健康記錄失敗：' + error.message)
      }
    },
    async deleteRecord(index) {
      const actualRecord = this.filteredRecords[index];
      
      if (!confirm('確定要刪除這筆健康記錄嗎？')) {
        return;
      }
      
      try {
        // 呼叫 API 刪除記錄
        await HealthRecordsAPI.delete(actualRecord.id)
        
        console.log('健康記錄刪除成功')
        
        // 重新載入記錄
        await this.loadRecords()
      } catch (error) {
        console.error('刪除健康記錄失敗：', error)
        alert('刪除健康記錄失敗：' + error.message)
      }
    },
    async loadRecords() {
      try {
        // 從 API 取得所有健康記錄
        const allRecords = await HealthRecordsAPI.getAll()
        
        // 轉換格式
        this.records = allRecords.map(record => {
          const date = new Date(record.date)
          // time 是 TimeSpan 格式，例如 "14:30:00"
          const timeStr = record.time.toString()
          
          return {
            id: record.id,
            date: date.toISOString().split('T')[0],
            time: timeStr.slice(0, 5), // 取 HH:mm
            issueType: record.healthIssue,
            symptoms: record.symptomDescription,
            severity: record.severity
          }
        })
        
        // 同步到 localStorage 作為備援
        localStorage.setItem(`healthRecords_${this.petId}`, JSON.stringify(this.records))
      } catch (error) {
        console.error('載入健康記錄失敗：', error)
        
        // 如果 API 失敗，從 localStorage 讀取
        const saved = localStorage.getItem(`healthRecords_${this.petId}`)
        if (saved) {
          this.records = JSON.parse(saved)
        }
      }
    }
  },
  async mounted() {
    await this.loadRecords()
  }
}
</script>

<style scoped>
.health-record {
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
.input-group select,
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

.severity-selector {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.severity-btn {
  flex: 1;
  min-width: 80px;
  padding: 10px 20px;
  border: 2px solid #ddd;
  background: white;
  color: #666;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.severity-btn:hover {
  border-color: #42b983;
  background: #f0f9f4;
}

.severity-btn.active {
  border-color: #42b983;
  background: #42b983;
  color: white;
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.3);
}

.severity-btn:active {
  transform: scale(0.98);
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
  gap: 10px;
}

.record-date {
  font-weight: 600;
  color: #42b983;
}

.severity-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.severity-輕微 {
  background: #e3f2fd;
  color: #1976d2;
}

.severity-中等 {
  background: #fff3e0;
  color: #f57c00;
}

.severity-嚴重 {
  background: #ffebee;
  color: #d32f2f;
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

.issue-type-filter,
.severity-filter {
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

.filter-btn.severity-輕微.active {
  border-color: #1976d2;
  background: #1976d2;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

.filter-btn.severity-中等.active {
  border-color: #f57c00;
  background: #f57c00;
  box-shadow: 0 2px 8px rgba(245, 124, 0, 0.3);
}

.filter-btn.severity-嚴重.active {
  border-color: #d32f2f;
  background: #d32f2f;
  box-shadow: 0 2px 8px rgba(211, 47, 47, 0.3);
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
  .health-record {
    padding: 15px 10px;
  }

  h2 {
    font-size: 1.5em;
  }

  .form-section {
    padding: 15px;
  }

  .input-group input,
  .input-group select,
  .input-group textarea {
    font-size: 16px;
  }

  .severity-selector {
    gap: 8px;
  }
  
  .severity-btn {
    min-width: 70px;
    padding: 12px 16px;
    font-size: 14px;
  }

  .record-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .severity-badge {
    font-size: 11px;
    padding: 3px 10px;
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
}
</style>

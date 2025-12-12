<template>
  <div class="medical-record">
    <h2>💊 醫療記錄</h2>
    
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
        <label>醫院名稱</label>
        <input type="text" v-model="currentRecord.hospital" placeholder="例如：XXX動物醫院" />
      </div>
      
      <div class="input-group">
        <label>獸醫師姓名</label>
        <input type="text" v-model="currentRecord.vetName" placeholder="例如：王醫師" />
      </div>
      
      <div class="input-group">
        <label>就診原因</label>
        <select v-model="currentRecord.treatmentType">
          <option value="">請選擇</option>
          <option value="定期檢查">定期檢查</option>
          <option value="疫苗接種">疫苗接種</option>
          <option value="手術">手術</option>
          <option value="緊急治療">緊急治療</option>
          <option value="牙科">牙科</option>
          <option value="其他">其他</option>
        </select>
      </div>
      
      <div class="input-group">
        <label>診斷結果</label>
        <textarea v-model="currentRecord.diagnosis" rows="2" placeholder="醫師診斷"></textarea>
      </div>
      
      <div class="input-group">
        <label>治療內容</label>
        <textarea v-model="currentRecord.treatment" rows="3" placeholder="詳細描述治療過程和醫生建議"></textarea>
      </div>
      
      <div class="input-group">
        <label>處方藥物</label>
        <textarea v-model="currentRecord.medications" rows="2" placeholder="藥物名稱、劑量、用法"></textarea>
      </div>
      
      <div class="input-row">
        <div class="input-group half">
          <label>體重（公斤）</label>
          <input type="number" v-model="currentRecord.weightKg" min="0" step="0.1" />
        </div>
        
        <div class="input-group half">
          <label>體溫（°C）</label>
          <input type="number" v-model="currentRecord.temperatureC" min="0" step="0.1" />
        </div>
      </div>
      
      <div class="input-group">
        <label>費用（元）</label>
        <input type="number" v-model="currentRecord.cost" min="0" step="0.01" />
      </div>
      
      <div class="input-group">
        <label>下次回診日期</label>
        <input type="date" v-model="currentRecord.nextVisit" />
      </div>
      
      <button @click="addRecord" class="btn-primary" type="button">新增記錄</button>
    </div>

    <div class="records-list">
      <h3>醫療歷史</h3>
      
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
          <label>醫院名稱</label>
          <div class="hospital-filter">
            <button 
              type="button"
              @click="filter.hospital = ''"
              :class="['filter-btn', { active: filter.hospital === '' }]"
            >
              全部
            </button>
            <button 
              type="button"
              v-for="hospital in uniqueHospitals" 
              :key="hospital"
              @click="filter.hospital = hospital"
              :class="['filter-btn', { active: filter.hospital === hospital }]"
            >
              {{ hospital }}
            </button>
          </div>
        </div>
        
        <div class="filter-group">
          <label>治療類型</label>
          <div class="treatment-type-filter">
            <button 
              type="button"
              @click="filter.treatmentType = ''"
              :class="['filter-btn', { active: filter.treatmentType === '' }]"
            >
              全部
            </button>
            <button 
              type="button"
              v-for="type in treatmentTypes" 
              :key="type"
              @click="filter.treatmentType = type"
              :class="['filter-btn', { active: filter.treatmentType === type }]"
            >
              {{ type }}
            </button>
          </div>
        </div>
        
        <button 
          v-if="filter.startDate || filter.endDate || filter.hospital || filter.treatmentType"
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
          <span class="treatment-type">{{ record.treatmentType }}</span>
          <button @click="deleteRecord(index)" class="btn-delete">刪除</button>
        </div>
        <div class="record-content">
          <p><strong>醫院:</strong> {{ record.hospital }}</p>
          <p v-if="record.vetName"><strong>獸醫師:</strong> {{ record.vetName }}</p>
          <p v-if="record.diagnosis"><strong>診斷:</strong> {{ record.diagnosis }}</p>
          <p><strong>治療內容:</strong> {{ record.treatment }}</p>
          <p v-if="record.medications"><strong>處方藥物:</strong> {{ record.medications }}</p>
          <p v-if="record.weightKg"><strong>體重:</strong> {{ record.weightKg }} kg</p>
          <p v-if="record.temperatureC"><strong>體溫:</strong> {{ record.temperatureC }} °C</p>
          <p><strong>費用:</strong> NT$ {{ record.cost }}</p>
          <p v-if="record.nextVisit"><strong>下次回診:</strong> {{ record.nextVisit }}</p>
        </div>
      </div>
      
      <div v-if="filteredRecords.length > 0" class="total-cost">
        <strong>{{ filter.startDate || filter.endDate || filter.hospital || filter.treatmentType ? '篩選結果' : '總' }}醫療費用:</strong> NT$ {{ filteredTotalCost.toFixed(2) }}
      </div>
    </div>
  </div>
</template>

<script>
import { MedicalRecordsAPI } from '../services/api'

export default {
  name: 'MedicalRecord',
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
        hospital: '',
        vetName: '',
        treatmentType: '',
        diagnosis: '',
        treatment: '',
        medications: '',
        weightKg: 0,
        temperatureC: 0,
        cost: 0,
        nextVisit: ''
      },
      records: [],
      treatmentTypes: ['定期檢查', '疫苗接種', '手術', '緊急治療', '牙科', '其他'],
      filter: {
        startDate: '',
        endDate: '',
        hospital: '',
        treatmentType: ''
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
    uniqueHospitals() {
      const hospitals = [...new Set(this.records.map(r => r.hospital).filter(h => h))];
      return hospitals.sort();
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
      
      // 醫院名稱篩選
      if (this.filter.hospital) {
        result = result.filter(record => record.hospital === this.filter.hospital);
      }
      
      // 治療類型篩選
      if (this.filter.treatmentType) {
        result = result.filter(record => record.treatmentType === this.filter.treatmentType);
      }
      
      return result;
    },
    totalCost() {
      return this.records.reduce((sum, record) => sum + parseFloat(record.cost || 0), 0);
    },
    filteredTotalCost() {
      return this.filteredRecords.reduce((sum, record) => sum + parseFloat(record.cost || 0), 0);
    }
  },
  methods: {
    clearFilters() {
      this.filter = {
        startDate: '',
        endDate: '',
        hospital: '',
        treatmentType: ''
      };
    },
    async addRecord() {
      console.log('addRecord 被呼叫了')
      
      if (!this.currentRecord.date || !this.currentRecord.time || !this.currentRecord.hospital || !this.currentRecord.treatmentType || !this.currentRecord.treatment) {
        alert('請填寫所有必填欄位');
        return;
      }
      
      console.log('驗證通過，準備呼叫 API')
      
      try {
        console.log('=== 新增醫療記錄 ===')
        console.log('currentRecord.cost 原始值:', this.currentRecord.cost)
        console.log('currentRecord.cost 型別:', typeof this.currentRecord.cost)
        
        // 準備要送到 API 的資料
        const recordData = {
          petId: this.petId,
          visitDate: `${this.currentRecord.date}T${this.currentRecord.time}:00`,
          clinicName: this.currentRecord.hospital,
          vetName: this.currentRecord.vetName || '',
          reason: this.currentRecord.treatmentType,
          diagnosis: this.currentRecord.diagnosis || '',
          treatment: this.currentRecord.treatment,
          medications: this.currentRecord.medications || '',
          weightKg: parseFloat(this.currentRecord.weightKg) || 0,
          temperatureC: parseFloat(this.currentRecord.temperatureC) || 0,
          cost: parseFloat(this.currentRecord.cost) || 0,
          nextVisitDate: this.currentRecord.nextVisit ? `${this.currentRecord.nextVisit}T00:00:00` : null,
          notes: ''
        }
        
        console.log('準備發送的資料:', recordData)
        console.log('recordData.cost 值:', recordData.cost)
        console.log('MedicalRecordsAPI:', MedicalRecordsAPI)
        
        // 呼叫 API 新增記錄
        const createdRecord = await MedicalRecordsAPI.create(recordData)
        console.log('API 回傳的新增記錄:', createdRecord)
        console.log('API 回傳的型別:', typeof createdRecord)
        console.log('API 回傳的 cost:', createdRecord?.cost)
        
        console.log('醫療記錄新增成功')
        
        // 重新載入記錄（確保從資料庫取得最新資料）
        await this.loadRecords()
        
        console.log('重新載入後的 records:', this.records.slice(0, 2))
        
        // 重置表單
        this.currentRecord = {
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          hospital: '',
          vetName: '',
          treatmentType: '',
          diagnosis: '',
          treatment: '',
          medications: '',
          weightKg: 0,
          temperatureC: 0,
          cost: 0,
          nextVisit: ''
        };
      } catch (error) {
        console.error('新增醫療記錄失敗：', error)
        alert('新增醫療記錄失敗：' + error.message)
      }
    },
    async deleteRecord(index) {
      const actualRecord = this.filteredRecords[index];
      
      if (!confirm('確定要刪除這筆醫療記錄嗎？')) {
        return;
      }
      
      try {
        // 呼叫 API 刪除記錄
        await MedicalRecordsAPI.delete(actualRecord.id)
        
        console.log('醫療記錄刪除成功')
        
        // 重新載入記錄
        await this.loadRecords()
      } catch (error) {
        console.error('刪除醫療記錄失敗：', error)
        alert('刪除醫療記錄失敗：' + error.message)
      }
    },
    async loadRecords() {
      console.log('=== 開始載入醫療記錄 ===')
      try {
        // 從 API 取得所有醫療記錄
        console.log('準備呼叫 MedicalRecordsAPI.getAll()')
        const allRecords = await MedicalRecordsAPI.getAll()
        console.log('API 返回的記錄數量:', allRecords?.length)
        console.log('API 返回的原始記錄 (前3筆):', allRecords?.slice(0, 3))
        
        // 篩選出該寵物的記錄並轉換格式
        this.records = allRecords
          .filter(record => record.petId === this.petId)
          .map(record => {
            console.log('處理記錄 ID:', record.id)
            console.log('  - record.cost 原始值:', record.cost)
            console.log('  - record.cost 型別:', typeof record.cost)
            console.log('  - parseFloat(record.cost):', parseFloat(record.cost))
            
            const visitDateTime = new Date(record.visitDate)
            const mappedRecord = {
              id: record.id,
              date: visitDateTime.toISOString().split('T')[0],
              time: visitDateTime.toTimeString().slice(0, 5),
              hospital: record.clinicName,
              vetName: record.vetName,
              treatmentType: record.reason,
              diagnosis: record.diagnosis,
              treatment: record.treatment,
              medications: record.medications,
              weightKg: record.weightKg,
              temperatureC: record.temperatureC,
              cost: parseFloat(record.cost) || 0,
              nextVisit: record.nextVisitDate ? new Date(record.nextVisitDate).toISOString().split('T')[0] : '',
              notes: record.notes
            }
            
            console.log('  - 轉換後的 cost:', mappedRecord.cost)
            return mappedRecord
          })
        
        console.log('最終的 records (前3筆):', this.records.slice(0, 3))
        
        // 同步到 localStorage 作為備援
        localStorage.setItem(`medicalRecords_${this.petId}`, JSON.stringify(this.records))
      } catch (error) {
        console.error('載入醫療記錄失敗：', error)
        
        // 如果 API 失敗，從 localStorage 讀取
        const saved = localStorage.getItem(`medicalRecords_${this.petId}`)
        if (saved) {
          this.records = JSON.parse(saved)
        }
      }
    }
  },
  async mounted() {
    console.log('=== MedicalRecord 組件已掛載 ===')
    console.log('petId:', this.petId)
    console.log('MedicalRecordsAPI:', MedicalRecordsAPI)
    console.log('MedicalRecordsAPI.create 存在嗎?', typeof MedicalRecordsAPI?.create)
    await this.loadRecords()
  }
}
</script>

<style scoped>
.medical-record {
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

.input-row {
  display: flex;
  gap: 15px;
}

.input-group.half {
  flex: 1;
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

.treatment-type {
  padding: 4px 12px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
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

.total-cost {
  margin-top: 20px;
  padding: 15px;
  background: #e8f5e9;
  border-radius: 8px;
  text-align: right;
  font-size: 18px;
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

.hospital-filter,
.treatment-type-filter {
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
  .medical-record {
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

  .record-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .treatment-type {
    font-size: 11px;
  }

  .total-cost {
    font-size: 16px;
    text-align: center;
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

  .record-content p {
    font-size: 14px;
  }
}
</style>

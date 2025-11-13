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
        <label>治療類型</label>
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
        <label>治療內容</label>
        <textarea v-model="currentRecord.treatment" rows="4" placeholder="詳細描述治療過程和醫生建議"></textarea>
      </div>
      
      <div class="input-group">
        <label>費用（元）</label>
        <input type="number" v-model="currentRecord.cost" min="0" step="0.01" />
      </div>
      
      <div class="input-group">
        <label>下次回診日期</label>
        <input type="date" v-model="currentRecord.nextVisit" />
      </div>
      
      <button @click="addRecord" class="btn-primary">新增記錄</button>
    </div>

    <div class="records-list">
      <h3>醫療歷史</h3>
      <div v-if="records.length === 0" class="empty-state">
        暫無記錄
      </div>
      <div v-else class="record-item" v-for="(record, index) in sortedRecords" :key="index">
        <div class="record-header">
          <span class="record-date">{{ record.date }} {{ record.time }}</span>
          <span class="treatment-type">{{ record.treatmentType }}</span>
          <button @click="deleteRecord(index)" class="btn-delete">刪除</button>
        </div>
        <div class="record-content">
          <p><strong>醫院:</strong> {{ record.hospital }}</p>
          <p><strong>治療內容:</strong> {{ record.treatment }}</p>
          <p><strong>費用:</strong> NT$ {{ record.cost }}</p>
          <p v-if="record.nextVisit"><strong>下次回診:</strong> {{ record.nextVisit }}</p>
        </div>
      </div>
      
      <div v-if="records.length > 0" class="total-cost">
        <strong>總醫療費用:</strong> NT$ {{ totalCost.toFixed(2) }}
      </div>
    </div>
  </div>
</template>

<script>
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
        treatmentType: '',
        treatment: '',
        cost: 0,
        nextVisit: ''
      },
      records: []
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
    totalCost() {
      return this.records.reduce((sum, record) => sum + parseFloat(record.cost || 0), 0);
    }
  },
  methods: {
    addRecord() {
      if (!this.currentRecord.date || !this.currentRecord.time || !this.currentRecord.hospital || !this.currentRecord.treatmentType || !this.currentRecord.treatment) {
        alert('請填寫所有必填欄位');
        return;
      }
      
      this.records.push({ ...this.currentRecord });
      this.saveToLocalStorage();
      
      // 重置表單
      this.currentRecord = {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        hospital: '',
        treatmentType: '',
        treatment: '',
        cost: 0,
        nextVisit: ''
      };
    },
    deleteRecord(index) {
      const sortedIndex = this.records.findIndex(r => r === this.sortedRecords[index]);
      this.records.splice(sortedIndex, 1);
      this.saveToLocalStorage();
    },
    saveToLocalStorage() {
      localStorage.setItem(`medicalRecords_${this.petId}`, JSON.stringify(this.records));
    },
    loadFromLocalStorage() {
      const saved = localStorage.getItem(`medicalRecords_${this.petId}`);
      if (saved) {
        this.records = JSON.parse(saved);
      }
    }
  },
  mounted() {
    this.loadFromLocalStorage();
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

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
          <label class="severity-option">
            <input type="radio" v-model="currentRecord.severity" value="輕微" />
            <span>輕微</span>
          </label>
          <label class="severity-option">
            <input type="radio" v-model="currentRecord.severity" value="中等" />
            <span>中等</span>
          </label>
          <label class="severity-option">
            <input type="radio" v-model="currentRecord.severity" value="嚴重" />
            <span>嚴重</span>
          </label>
        </div>
      </div>
      
      <button @click="addRecord" class="btn-primary">新增記錄</button>
    </div>

    <div class="records-list">
      <h3>健康歷史</h3>
      <div v-if="records.length === 0" class="empty-state">
        暫無記錄
      </div>
      <div v-else class="record-item" v-for="(record, index) in sortedRecords" :key="index">
        <div class="record-header">
          <span class="record-date">{{ record.date }} {{ record.time }}</span>
          <span :class="['severity-badge', `severity-${record.severity}`]">
            {{ record.severity }}
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
        severity: '輕微'
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
    }
  },
  methods: {
    addRecord() {
      if (!this.currentRecord.date || !this.currentRecord.time || !this.currentRecord.issueType || !this.currentRecord.symptoms) {
        alert('請填寫所有必填欄位');
        return;
      }
      
      this.records.push({ ...this.currentRecord });
      this.saveToLocalStorage();
      
      // 重置表單
      this.currentRecord = {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        issueType: '',
        symptoms: '',
        severity: '輕微'
      };
    },
    deleteRecord(index) {
      const sortedIndex = this.records.findIndex(r => r === this.sortedRecords[index]);
      this.records.splice(sortedIndex, 1);
      this.saveToLocalStorage();
    },
    saveToLocalStorage() {
      localStorage.setItem(`healthRecords_${this.petId}`, JSON.stringify(this.records));
    },
    loadFromLocalStorage() {
      const saved = localStorage.getItem(`healthRecords_${this.petId}`);
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
  gap: 15px;
}

.severity-option {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.severity-option input {
  width: auto;
  margin-right: 5px;
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
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .record-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .severity-badge {
    font-size: 11px;
    padding: 3px 10px;
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

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
      <div v-if="records.length === 0" class="empty-state">
        暫無記錄
      </div>
      <div v-else class="record-item" v-for="(record, index) in sortedRecords" :key="index">
        <div class="record-header">
          <span class="record-date">{{ record.date }} {{ record.time }}</span>
          <button @click="deleteRecord(index)" class="btn-delete">刪除</button>
        </div>
        <div class="record-content">
          <p><strong>餵食次數:</strong> {{ record.count }} 次</p>
          <p v-if="record.notes"><strong>備註:</strong> {{ record.notes }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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
        count: 1,
        notes: ''
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
      if (!this.currentRecord.date || !this.currentRecord.time) {
        alert('請填寫日期和時間');
        return;
      }
      
      this.records.push({ ...this.currentRecord });
      this.saveToLocalStorage();
      
      // 重置表單
      this.currentRecord = {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        count: 1,
        notes: ''
      };
    },
    deleteRecord(index) {
      const sortedIndex = this.records.findIndex(r => r === this.sortedRecords[index]);
      this.records.splice(sortedIndex, 1);
      this.saveToLocalStorage();
    },
    saveToLocalStorage() {
      localStorage.setItem(`feedingRecords_${this.petId}`, JSON.stringify(this.records));
    },
    loadFromLocalStorage() {
      const saved = localStorage.getItem(`feedingRecords_${this.petId}`);
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

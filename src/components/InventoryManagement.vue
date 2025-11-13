<template>
  <div class="inventory-management">
    <h2>📦 庫存管理</h2>
    
    <div class="form-section">
      <div class="input-group">
        <label>項目類型</label>
        <select v-model="currentItem.category" @change="showCustomCategory = (currentItem.category === '自訂')">
          <option value="">請選擇</option>
          <option value="糧食">糧食</option>
          <option value="保健品">保健品</option>
          <option value="零食">零食</option>
          <option value="自訂">➕ 自訂類型</option>
        </select>
      </div>
      
      <div class="input-group" v-if="showCustomCategory">
        <label>自訂類型名稱 *</label>
        <input type="text" v-model="customCategory" placeholder="例如：玩具、用品、藥品" />
      </div>
      
      <div class="input-group">
        <label>品名</label>
        <input type="text" v-model="currentItem.name" placeholder="例如：皇家貓糧" />
      </div>
      
      <div class="input-group">
        <label>數量</label>
        <input type="number" v-model="currentItem.quantity" min="0" step="0.1" />
      </div>
      
      <div class="input-group">
        <label>單位</label>
        <select v-model="currentItem.unit">
          <option value="kg">公斤 (kg)</option>
          <option value="g">公克 (g)</option>
          <option value="包">包</option>
          <option value="罐">罐</option>
          <option value="瓶">瓶</option>
          <option value="盒">盒</option>
          <option value="個">個</option>
        </select>
      </div>
      
      <div class="input-group">
        <label>總價（元）</label>
        <input type="number" v-model="currentItem.totalPrice" min="0" step="0.01" />
      </div>
      
      <div class="input-group">
        <label>購買日期</label>
        <input type="date" v-model="currentItem.purchaseDate" />
      </div>
      
      <div class="input-group">
        <label>有效期限</label>
        <input type="date" v-model="currentItem.expiryDate" />
      </div>
      
      <button @click="addItem" class="btn-primary">新增項目</button>
    </div>

    <div class="tabs">
      <button 
        v-for="cat in categories" 
        :key="cat"
        @click="activeCategory = cat"
        :class="['tab-btn', { active: activeCategory === cat }]"
      >
        {{ cat }}
      </button>
    </div>

    <div class="inventory-list">
      <div v-if="filteredItems.length === 0" class="empty-state">
        此分類暫無項目
      </div>
      <div v-else class="item-card" v-for="(item, index) in filteredItems" :key="index">
        <div class="item-header">
          <h4>{{ item.name }}</h4>
          <button @click="deleteItem(item)" class="btn-delete">刪除</button>
        </div>
        <div class="item-details">
          <p><strong>數量:</strong> {{ item.quantity }} {{ item.unit }}</p>
          <p><strong>花費:</strong> NT$ {{ parseFloat(item.totalPrice).toFixed(2) }}</p>
          <p><strong>購買日期:</strong> {{ item.purchaseDate }}</p>
          <p v-if="item.expiryDate">
            <strong>有效期限:</strong> 
            <span :class="{ 'expiring-soon': isExpiringSoon(item.expiryDate), 'expired': isExpired(item.expiryDate) }">
              {{ item.expiryDate }}
              {{ isExpired(item.expiryDate) ? '(已過期)' : isExpiringSoon(item.expiryDate) ? '(即將過期)' : '' }}
            </span>
          </p>
        </div>
      </div>
    </div>

    <div class="summary">
      <h3>支出統計</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-label">糧食</div>
          <div class="summary-value">NT$ {{ getCategoryTotal('糧食').toFixed(2) }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">保健品</div>
          <div class="summary-value">NT$ {{ getCategoryTotal('保健品').toFixed(2) }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">零食</div>
          <div class="summary-value">NT$ {{ getCategoryTotal('零食').toFixed(2) }}</div>
        </div>
        <div class="summary-item total">
          <div class="summary-label">總計</div>
          <div class="summary-value">NT$ {{ totalExpenses.toFixed(2) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InventoryManagement',
  props: {
    petId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      currentItem: {
        category: '',
        name: '',
        quantity: 0,
        unit: 'kg',
        totalPrice: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        expiryDate: ''
      },
      items: [],
      activeCategory: '全部',
      categories: ['全部', '糧食', '保健品', '零食'],
      showCustomCategory: false,
      customCategory: ''
    }
  },
  computed: {
    filteredItems() {
      if (this.activeCategory === '全部') {
        return this.items;
      }
      return this.items.filter(item => item.category === this.activeCategory);
    },
    totalExpenses() {
      return this.items.reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0);
    }
  },
  methods: {
    addItem() {
      // 如果選擇自訂類型，使用自訂輸入的值
      let category = this.currentItem.category
      if (this.showCustomCategory) {
        if (!this.customCategory.trim()) {
          alert('請輸入自訂項目類型')
          return
        }
        category = this.customCategory.trim()
        
        // 將新類型加入分類列表（如果還不存在）
        if (!this.categories.includes(category)) {
          this.categories.push(category)
        }
      }
      
      if (!category || !this.currentItem.name || !this.currentItem.quantity || !this.currentItem.totalPrice) {
        alert('請填寫所有必填欄位');
        return;
      }
      
      this.items.push({ 
        ...this.currentItem,
        category: category
      });
      this.saveToLocalStorage();
      
      // 重置表單
      this.currentItem = {
        category: '',
        name: '',
        quantity: 0,
        unit: 'kg',
        totalPrice: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        expiryDate: ''
      };
      this.customCategory = ''
      this.showCustomCategory = false
    },
    deleteItem(item) {
      const index = this.items.indexOf(item);
      if (index > -1) {
        this.items.splice(index, 1);
        this.saveToLocalStorage();
      }
    },
    getCategoryTotal(category) {
      return this.items
        .filter(item => item.category === category)
        .reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0);
    },
    isExpiringSoon(expiryDate) {
      if (!expiryDate) return false;
      const today = new Date();
      const expiry = new Date(expiryDate);
      const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    },
    isExpired(expiryDate) {
      if (!expiryDate) return false;
      const today = new Date();
      const expiry = new Date(expiryDate);
      return expiry < today;
    },
    saveToLocalStorage() {
      localStorage.setItem(`inventoryItems_${this.petId}`, JSON.stringify(this.items));
    },
    loadFromLocalStorage() {
      const saved = localStorage.getItem(`inventoryItems_${this.petId}`);
      if (saved) {
        this.items = JSON.parse(saved);
        
        // 從已有項目中提取所有獨特的分類
        const existingCategories = [...new Set(this.items.map(item => item.category))]
        existingCategories.forEach(cat => {
          if (!this.categories.includes(cat) && cat !== '全部') {
            this.categories.push(cat)
          }
        })
      }
    }
  },
  mounted() {
    this.loadFromLocalStorage();
  }
}
</script>

<style scoped>
.inventory-management {
  max-width: 1000px;
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
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.input-group label {
  margin-bottom: 5px;
  font-weight: 600;
  color: #2c3e50;
}

.input-group input,
.input-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.btn-primary {
  grid-column: 1 / -1;
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

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 8px 20px;
  border: 2px solid #42b983;
  background: white;
  color: #42b983;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.tab-btn:hover {
  background: #e8f5e9;
}

.tab-btn.active {
  background: #42b983;
  color: white;
}

.inventory-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  color: #999;
  padding: 40px;
  background: #f8f9fa;
  border-radius: 8px;
}

.item-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  transition: box-shadow 0.3s;
}

.item-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.item-header h4 {
  margin: 0;
  color: #2c3e50;
}

.item-details p {
  margin: 5px 0;
  color: #2c3e50;
  font-size: 14px;
}

.expiring-soon {
  color: #f57c00;
  font-weight: 600;
}

.expired {
  color: #d32f2f;
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

.summary {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.summary-item {
  background: white;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.summary-item.total {
  background: #42b983;
  color: white;
}

.summary-label {
  font-size: 14px;
  margin-bottom: 5px;
  opacity: 0.8;
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .inventory-management {
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
  .input-group select {
    font-size: 16px;
  }

  .tabs {
    gap: 8px;
  }

  .tab-btn {
    padding: 6px 16px;
    font-size: 14px;
  }

  .inventory-list {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .item-card {
    padding: 12px;
  }

  .item-header h4 {
    font-size: 16px;
  }

  .item-details p {
    font-size: 13px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .summary-item {
    padding: 12px;
  }

  .summary-label {
    font-size: 13px;
  }

  .summary-value {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  h2 {
    font-size: 1.3em;
  }

  .form-section {
    padding: 12px;
  }

  .tab-btn {
    padding: 5px 12px;
    font-size: 13px;
  }

  .btn-primary {
    padding: 10px 20px;
    font-size: 15px;
  }
}
</style>

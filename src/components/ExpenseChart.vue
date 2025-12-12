<template>
  <div class="expense-chart">
    <h2>📊 花費統計圖表</h2>
    
    <div class="chart-controls">
      <div class="period-selector">
        <button 
          v-for="period in periods" 
          :key="period.value"
          @click="selectedPeriod = period.value"
          :class="['period-btn', { active: selectedPeriod === period.value }]"
        >
          {{ period.label }}
        </button>
      </div>
      
      <div class="chart-type-selector">
        <button 
          @click="chartType = 'bar'"
          :class="['type-btn', { active: chartType === 'bar' }]"
        >
          📊 長條圖
        </button>
        <button 
          @click="chartType = 'line'"
          :class="['type-btn', { active: chartType === 'line' }]"
        >
          📈 線圖
        </button>
      </div>
    </div>

    <div class="charts-container">
      <!-- 總花費圖表 -->
      <div class="chart-card">
        <h3>總花費趨勢</h3>
        <canvas ref="totalChart"></canvas>
      </div>

      <!-- 醫療花費圖表 -->
      <div class="chart-card">
        <h3>醫療花費</h3>
        <canvas ref="medicalChart"></canvas>
      </div>

      <!-- 庫存花費圖表 -->
      <div class="chart-card">
        <h3>庫存花費（糧食、保健品、零食）</h3>
        <canvas ref="inventoryChart"></canvas>
      </div>

      <!-- 庫存分類圖表 -->
      <div class="chart-card">
        <h3>庫存分類花費</h3>
        <canvas ref="categoryChart"></canvas>
      </div>
    </div>

    <!-- 統計摘要 -->
    <div class="summary-cards">
      <div class="summary-card medical">
        <div class="summary-icon">💊</div>
        <div class="summary-info">
          <div class="summary-label">醫療總花費</div>
          <div class="summary-value">NT$ {{ totalMedical.toFixed(2) }}</div>
        </div>
      </div>
      <div class="summary-card inventory">
        <div class="summary-icon">📦</div>
        <div class="summary-info">
          <div class="summary-label">庫存總花費</div>
          <div class="summary-value">NT$ {{ totalInventory.toFixed(2) }}</div>
        </div>
      </div>
      <div class="summary-card total">
        <div class="summary-icon">💰</div>
        <div class="summary-info">
          <div class="summary-label">總計</div>
          <div class="summary-value">NT$ {{ (totalMedical + totalInventory).toFixed(2) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js'
import { MedicalRecordsAPI } from '../services/api'

Chart.register(...registerables)

export default {
  name: 'ExpenseChart',
  props: {
    petId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      selectedPeriod: 'one-month',
      chartType: 'bar',
      periods: [
        { label: '一週', value: 'one-week' },
        { label: '一個月', value: 'one-month' },
        { label: '三個月', value: 'three-months' },
        { label: '半年', value: 'six-months' },
        { label: '一年', value: 'one-year' }
      ],
      medicalRecords: [],
      inventoryItems: [],
      expenseSummary: [], // API 統計資料：依月份+分類
      expenseByPet: [],   // API 統計資料：依寵物
      charts: {
        total: null,
        medical: null,
        inventory: null,
        category: null
      }
    }
  },
  computed: {
    totalMedical() {
      // 優先使用 API 資料
      if (this.expenseSummary.length > 0) {
        return this.expenseSummary.reduce((sum, item) => sum + parseFloat(item.total || 0), 0)
      }
      // Fallback 到 localStorage
      return this.getFilteredMedical().reduce((sum, record) => sum + parseFloat(record.cost || 0), 0)
    },
    totalInventory() {
      return this.getFilteredInventory().reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0)
    }
  },
  watch: {
    selectedPeriod() {
      this.loadApiData() // 重新載入 API 資料
    },
    chartType() {
      this.updateAllCharts()
    }
  },
  methods: {
    async loadApiData() {
      try {
        console.log('[ExpenseChart] 載入 API 資料，period:', this.selectedPeriod)
        
        // 同時載入兩個 API
        const [summary, byPet] = await Promise.all([
          MedicalRecordsAPI.getExpenseSummary(this.selectedPeriod),
          MedicalRecordsAPI.getExpenseByPet(this.selectedPeriod)
        ])
        
        console.log('[ExpenseChart] expense-summary 回傳:', summary)
        console.log('[ExpenseChart] expense-by-pet 回傳:', byPet)
        
        this.expenseSummary = Array.isArray(summary) ? summary : []
        this.expenseByPet = Array.isArray(byPet) ? byPet : []
        
        console.log('[ExpenseChart] 已設定 expenseSummary:', this.expenseSummary.length, '筆')
        console.log('[ExpenseChart] 已設定 expenseByPet:', this.expenseByPet.length, '筆')
        
        // 更新圖表
        this.$nextTick(() => {
          this.updateAllCharts()
        })
      } catch (error) {
        console.error('[ExpenseChart] 載入 API 失敗:', error)
        console.error('[ExpenseChart] 錯誤詳情:', error.message)
        
        // 如果 API 失敗，使用 localStorage 資料
        this.expenseSummary = []
        this.expenseByPet = []
        this.$nextTick(() => {
          this.updateAllCharts()
        })
      }
    },
    loadData() {
      const medical = localStorage.getItem(`medicalRecords_${this.petId}`)
      const inventory = localStorage.getItem(`inventoryItems_${this.petId}`)
      
      this.medicalRecords = medical ? JSON.parse(medical) : []
      this.inventoryItems = inventory ? JSON.parse(inventory) : []
    },
    getPeriodDays() {
      const periodMap = {
        'one-week': 7,
        'one-month': 30,
        'three-months': 90,
        'six-months': 180,
        'one-year': 365
      }
      return periodMap[this.selectedPeriod] || 30
    },
    getFilteredMedical() {
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      const cutoffDate = new Date(today)
      const days = this.getPeriodDays()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      cutoffDate.setHours(0, 0, 0, 0)
      
      return this.medicalRecords.filter(record => {
        if (!record.date) return false
        const recordDate = new Date(record.date)
        return recordDate >= cutoffDate && recordDate <= today
      })
    },
    getFilteredInventory() {
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      const cutoffDate = new Date(today)
      const days = this.getPeriodDays()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      cutoffDate.setHours(0, 0, 0, 0)
      
      return this.inventoryItems.filter(item => {
        if (!item.purchaseDate) return false
        const itemDate = new Date(item.purchaseDate)
        return itemDate >= cutoffDate && itemDate <= today
      })
    },
    generateDateLabels() {
      const labels = []
      const dates = []
      const today = new Date()
      const days = this.getPeriodDays()
      
      // 根據期間決定標籤間隔
      let interval = 1
      if (days === 30) interval = 3
      else if (days === 90) interval = 7
      else if (days === 180) interval = 14
      else if (days === 365) interval = 30
      
      for (let i = days; i >= 0; i -= interval) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        dates.push(new Date(date.getFullYear(), date.getMonth(), date.getDate()))
        labels.push(date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }))
      }
      
      return { labels, dates }
    },
    aggregateDataByDate(records, dateField, valueField) {
      const { labels, dates } = this.generateDateLabels()
      const data = new Array(dates.length).fill(0)
      
      records.forEach(record => {
        if (!record[dateField]) return
        
        const recordDate = new Date(record[dateField])
        const recordDateOnly = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate())
        
        // 找到最接近的日期區間
        for (let i = 0; i < dates.length; i++) {
          const currentDate = dates[i]
          const nextDate = i < dates.length - 1 ? dates[i + 1] : new Date()
          
          if (recordDateOnly >= currentDate && recordDateOnly < nextDate) {
            data[i] += parseFloat(record[valueField] || 0)
            break
          } else if (i === dates.length - 1 && recordDateOnly >= currentDate) {
            // 最後一個區間
            data[i] += parseFloat(record[valueField] || 0)
          }
        }
      })
      
      return data
    },
    createChart(ref, label, data, color) {
      const ctx = this.$refs[ref]
      if (!ctx) return
      
      // 銷毀舊圖表
      if (this.charts[ref]) {
        this.charts[ref].destroy()
      }
      
      const { labels } = this.generateDateLabels()
      
      this.charts[ref] = new Chart(ctx, {
        type: this.chartType,
        data: {
          labels: labels,
          datasets: [{
            label: label,
            data: data,
            backgroundColor: color + '80',
            borderColor: color,
            borderWidth: 2,
            tension: 0.4,
            fill: this.chartType === 'line'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: window.innerWidth < 768 ? 1.2 : 2,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                padding: 15,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': NT$ ' + context.parsed.y.toFixed(2)
                }
              },
              padding: 12,
              titleFont: {
                size: 14
              },
              bodyFont: {
                size: 13
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return 'NT$ ' + value
                },
                font: {
                  size: 11
                }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              }
            },
            x: {
              ticks: {
                font: {
                  size: 10
                },
                maxRotation: 45,
                minRotation: 0
              },
              grid: {
                display: false
              }
            }
          }
        }
      })
    },
    updateAllCharts() {
      // 優先使用 API 資料，若無則使用本地資料
      if (this.expenseSummary.length > 0) {
        this.updateChartsWithApiData()
      } else {
        this.updateChartsWithLocalData()
      }
    },
    updateChartsWithApiData() {
      console.log('[updateChartsWithApiData] expenseSummary:', this.expenseSummary)
      
      // 處理醫療分類資料 (expense-summary)
      const categoryMap = new Map()
      const monthSet = new Set()
      
      this.expenseSummary.forEach(item => {
        const monthKey = `${item.year}-${String(item.month).padStart(2, '0')}`
        monthSet.add(monthKey)
        
        if (!categoryMap.has(item.category)) {
          categoryMap.set(item.category, new Map())
        }
        categoryMap.get(item.category).set(monthKey, item.total)
      })
      
      // 使用月份作為標籤
      const labels = Array.from(monthSet).sort()
      console.log('[updateChartsWithApiData] 月份標籤:', labels)
      
      // 創建醫療圖表 - 多分類數據集
      const datasets = Array.from(categoryMap.entries()).map(([category, monthData]) => {
        const categoryColors = {
          '預防接種': '#ff6384',
          '健康檢查': '#36a2eb',
          '手術': '#ffce56',
          '藥物治療': '#4bc0c0',
          '其他': '#9966ff'
        }
        const color = categoryColors[category] || '#ff9f40'
        
        return {
          label: category,
          data: labels.map(label => monthData.get(label) || 0),
          backgroundColor: color,
          borderColor: color,
          borderWidth: 2,
          tension: 0.3
        }
      })
      
      console.log('[updateChartsWithApiData] datasets:', datasets)
      
      if (datasets.length > 0) {
        this.createMultiDatasetChart('medicalChart', '醫療花費（依分類）', labels, datasets)
      } else {
        console.warn('[updateChartsWithApiData] 無醫療資料，使用本地資料')
        const filteredMedical = this.getFilteredMedical()
        const medicalData = this.aggregateDataByDate(filteredMedical, 'date', 'cost')
        const { labels: dateLabels } = this.generateDateLabels()
        this.createChart('medicalChart', '醫療花費', medicalData, '#f44336')
      }
      
      // 創建庫存花費圖表 (使用日期標籤)
      const filteredInventory = this.getFilteredInventory()
      const { labels: dateLabels } = this.generateDateLabels()
      const inventoryData = this.aggregateDataByDate(filteredInventory, 'purchaseDate', 'totalPrice')
      this.createChart('inventoryChart', '庫存花費', inventoryData, '#2196f3')
      
      // 計算總花費 (使用日期標籤)
      const medicalByDate = this.aggregateDataByDate(this.getFilteredMedical(), 'date', 'cost')
      const totalData = medicalByDate.map((val, idx) => val + inventoryData[idx])
      this.createChart('totalChart', '總花費', totalData, '#42b983')
      
      // 創建醫療分類圖表
      this.createMedicalCategoryChart()
      
      // 創建寵物分佈圖表
      if (this.expenseByPet.length > 0) {
        this.createPetExpenseChart()
      }
    },
    updateChartsWithLocalData() {
      const filteredMedical = this.getFilteredMedical()
      const filteredInventory = this.getFilteredInventory()
      
      console.log('醫療記錄:', filteredMedical)
      console.log('庫存記錄:', filteredInventory)
      
      // 醫療花費數據
      const medicalData = this.aggregateDataByDate(filteredMedical, 'date', 'cost')
      
      // 庫存花費數據
      const inventoryData = this.aggregateDataByDate(filteredInventory, 'purchaseDate', 'totalPrice')
      
      console.log('醫療數據:', medicalData)
      console.log('庫存數據:', inventoryData)
      
      // 總花費數據
      const totalData = medicalData.map((val, idx) => val + inventoryData[idx])
      
      // 創建圖表
      this.createChart('totalChart', '總花費', totalData, '#42b983')
      this.createChart('medicalChart', '醫療花費', medicalData, '#f44336')
      this.createChart('inventoryChart', '庫存花費', inventoryData, '#2196f3')
      
      // 庫存分類圖表
      this.createCategoryChart()
    },
    createMultiDatasetChart(ref, label, labels, datasets) {
      const ctx = this.$refs[ref]
      if (!ctx) return
      
      if (this.charts[ref]) {
        this.charts[ref].destroy()
      }
      
      this.charts[ref] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: window.innerWidth < 768 ? 1.2 : 2,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                font: {
                  size: 11
                },
                padding: 10
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': NT$ ' + context.parsed.y.toFixed(2)
                }
              },
              padding: 12,
              titleFont: {
                size: 14
              },
              bodyFont: {
                size: 13
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return 'NT$ ' + value
                },
                font: {
                  size: 11
                }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              }
            },
            x: {
              ticks: {
                font: {
                  size: 10
                },
                maxRotation: 45,
                minRotation: 0
              },
              grid: {
                display: false
              }
            }
          }
        }
      })
    },
    createMedicalCategoryChart() {
      const ctx = this.$refs.categoryChart
      if (!ctx) return
      
      if (this.charts.category) {
        this.charts.category.destroy()
      }
      
      // 使用 API 資料
      const categoryTotals = new Map()
      this.expenseSummary.forEach(item => {
        const current = categoryTotals.get(item.category) || 0
        categoryTotals.set(item.category, current + item.total)
      })
      
      const categories = Array.from(categoryTotals.keys())
      const data = Array.from(categoryTotals.values())
      
      const colors = ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40']
      
      this.charts.category = new Chart(ctx, {
        type: this.chartType,
        data: {
          labels: categories,
          datasets: [{
            label: '花費金額',
            data: data,
            backgroundColor: colors.slice(0, categories.length),
            borderColor: colors.slice(0, categories.length),
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: window.innerWidth < 768 ? 1.2 : 2,
          indexAxis: window.innerWidth < 480 && categories.length > 5 ? 'y' : 'x',
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.label + ': NT$ ' + context.parsed.y.toFixed(2)
                }
              },
              padding: 12,
              titleFont: {
                size: 14
              },
              bodyFont: {
                size: 13
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return 'NT$ ' + value
                },
                font: {
                  size: 11
                }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              }
            },
            x: {
              ticks: {
                font: {
                  size: 10
                },
                maxRotation: 45,
                minRotation: 0
              },
              grid: {
                display: false
              }
            }
          }
        }
      })
    },
    createPetExpenseChart() {
      // 這個方法為寵物分佈圖表預留
      // 可以在 UI 上新增一個 canvas 來顯示
      console.log('寵物花費分佈:', this.expenseByPet)
    },
    createCategoryChart() {
      const ctx = this.$refs.categoryChart
      if (!ctx) return
      
      if (this.charts.category) {
        this.charts.category.destroy()
      }
      
      const filteredInventory = this.getFilteredInventory()
      
      // 獲取所有獨特的分類
      const allCategories = [...new Set(filteredInventory.map(item => item.category))]
      
      // 使用預設分類加上自訂分類
      const categories = allCategories.length > 0 ? allCategories : ['糧食', '保健品', '零食']
      
      const categoryData = categories.map(cat => {
        return filteredInventory
          .filter(item => item.category === cat)
          .reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0)
      })
      
      // 生成顏色（為自訂分類生成隨機顏色）
      const colors = categories.map((cat, idx) => {
        const defaultColors = ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40']
        return defaultColors[idx % defaultColors.length]
      })
      
      const { labels } = this.generateDateLabels()
      
      this.charts.category = new Chart(ctx, {
        type: this.chartType,
        data: {
          labels: categories,
          datasets: [{
            label: '花費金額',
            data: categoryData,
            backgroundColor: colors,
            borderColor: colors,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: window.innerWidth < 768 ? 1.2 : 2,
          indexAxis: window.innerWidth < 480 && categories.length > 5 ? 'y' : 'x',
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.label + ': NT$ ' + context.parsed.y.toFixed(2)
                }
              },
              padding: 12,
              titleFont: {
                size: 14
              },
              bodyFont: {
                size: 13
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return 'NT$ ' + value
                },
                font: {
                  size: 11
                }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              }
            },
            x: {
              ticks: {
                font: {
                  size: 10
                },
                maxRotation: 45,
                minRotation: 0
              },
              grid: {
                display: false
              }
            }
          }
        }
      })
    }
  },
  mounted() {
    console.log('[ExpenseChart] mounted, petId:', this.petId)
    this.loadData()
    this.loadApiData() // 載入 API 資料並自動更新圖表
  },
  beforeUnmount() {
    // 清理圖表
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy()
    })
  }
}
</script>

<style scoped>
.expense-chart {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  text-align: center;
}

h3 {
  color: #42b983;
  margin-bottom: 15px;
  font-size: 18px;
}

.chart-controls {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.period-selector,
.chart-type-selector {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.period-btn,
.type-btn {
  padding: 10px 20px;
  border: 2px solid #42b983;
  background: white;
  color: #42b983;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.period-btn:hover,
.type-btn:hover {
  background: #e8f5e9;
  transform: translateY(-2px);
}

.period-btn.active,
.type-btn.active {
  background: #42b983;
  color: white;
  box-shadow: 0 4px 8px rgba(66, 185, 131, 0.3);
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.chart-card {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.chart-card h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.chart-card canvas {
  width: 100% !important;
  height: auto !important;
  max-height: 400px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.summary-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s;
}

.summary-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.summary-card.medical {
  border-left: 4px solid #f44336;
}

.summary-card.inventory {
  border-left: 4px solid #2196f3;
}

.summary-card.total {
  border-left: 4px solid #42b983;
}

.summary-icon {
  font-size: 40px;
}

.summary-info {
  flex: 1;
}

.summary-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 5px;
}

.summary-value {
  color: #2c3e50;
  font-size: 24px;
  font-weight: 700;
}

@media (max-width: 768px) {
  .expense-chart {
    padding: 15px 10px;
  }

  h2 {
    font-size: 1.5em;
  }

  .chart-controls {
    padding: 15px;
  }

  .period-selector,
  .chart-type-selector {
    justify-content: center;
  }

  .period-btn,
  .type-btn {
    padding: 8px 16px;
    font-size: 13px;
  }

  .charts-container {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .chart-card {
    padding: 20px;
  }

  .chart-card h3 {
    font-size: 16px;
    margin-bottom: 15px;
  }

  .chart-card canvas {
    max-height: 320px;
  }

  .summary-cards {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .summary-card {
    padding: 15px;
  }

  .summary-icon {
    font-size: 35px;
  }

  .summary-label {
    font-size: 13px;
  }

  .summary-value {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  h2 {
    font-size: 1.3em;
  }

  .chart-controls {
    padding: 12px;
  }

  .period-btn,
  .type-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .chart-card {
    padding: 15px;
  }

  .chart-card h3 {
    font-size: 15px;
  }

  .chart-card canvas {
    max-height: 280px;
  }

  .summary-icon {
    font-size: 30px;
  }

  .summary-label {
    font-size: 12px;
  }

  .summary-value {
    font-size: 18px;
  }
}
</style>

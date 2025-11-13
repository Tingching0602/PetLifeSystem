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
      selectedPeriod: 7,
      chartType: 'bar',
      periods: [
        { label: '一週', value: 7 },
        { label: '一個月', value: 30 },
        { label: '三個月', value: 90 },
        { label: '半年', value: 180 },
        { label: '一年', value: 365 }
      ],
      medicalRecords: [],
      inventoryItems: [],
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
      return this.getFilteredMedical().reduce((sum, record) => sum + parseFloat(record.cost || 0), 0)
    },
    totalInventory() {
      return this.getFilteredInventory().reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0)
    }
  },
  watch: {
    selectedPeriod() {
      this.updateAllCharts()
    },
    chartType() {
      this.updateAllCharts()
    }
  },
  methods: {
    loadData() {
      const medical = localStorage.getItem(`medicalRecords_${this.petId}`)
      const inventory = localStorage.getItem(`inventoryItems_${this.petId}`)
      
      this.medicalRecords = medical ? JSON.parse(medical) : []
      this.inventoryItems = inventory ? JSON.parse(inventory) : []
    },
    getFilteredMedical() {
      const today = new Date()
      today.setHours(23, 59, 59, 999) // 設定為今天結束時間
      const cutoffDate = new Date(today)
      cutoffDate.setDate(cutoffDate.getDate() - this.selectedPeriod)
      cutoffDate.setHours(0, 0, 0, 0) // 設定為開始時間
      
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
      cutoffDate.setDate(cutoffDate.getDate() - this.selectedPeriod)
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
      
      // 根據期間決定標籤間隔
      let interval = 1
      if (this.selectedPeriod === 30) interval = 3
      else if (this.selectedPeriod === 90) interval = 7
      else if (this.selectedPeriod === 180) interval = 14
      else if (this.selectedPeriod === 365) interval = 30
      
      for (let i = this.selectedPeriod; i >= 0; i -= interval) {
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
    this.loadData()
    this.$nextTick(() => {
      this.updateAllCharts()
    })
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

<template>
  <div class="home-container">
    <div class="banner">
      <h1>Seckill Mall</h1>
      <p>企业级高并发秒杀商城实战</p>
    </div>

    <div class="goods-section">
      <h2>🔥 热门商品</h2>
      
      <div v-if="loading" class="loading-box">加载中...</div>

      <div v-else class="goods-grid">
        <el-card 
          v-for="item in goodsList" 
          :key="item.id" 
          class="goods-card"
          @click="goToDetail(item.id)" 
          shadow="hover"
        >
          <div class="image-placeholder">
            <span class="tag">热销</span>
          </div>
          
          <div class="goods-info">
            <h3 class="goods-title">{{ item.spuName }}</h3>
            <p class="goods-desc">{{ item.spuDescription }}</p>
            <div class="bottom">
              <span class="price">点击查看详情</span> 
              <el-button type="primary" size="small" icon="ShoppingCart">购买</el-button>
            </div>
          </div>
        </el-card>
      </div>

      <el-empty v-if="!loading && goodsList.length === 0" description="暂无商品" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getGoodsList } from '../api/goods'
import { ElMessage } from 'element-plus'

const router = useRouter()
const goodsList = ref([])
const loading = ref(false)

// 分页参数 (目前先只查第一页)
const queryParams = ref({
  page: 1,
  size: 20
})

onMounted(() => {
  loadGoods()
})

const loadGoods = async () => {
  loading.value = true
  try {
    const res = await getGoodsList(queryParams.value)
    if (res.code === 200) {
      // MyBatis Plus 返回的结构是 res.data.records
      goodsList.value = res.data.records
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('加载商品失败')
  } finally {
    loading.value = false
  }
}

const goToDetail = (id) => {
  router.push(`/goods/${id}`)
}
</script>

<style scoped>
/* 保持你原有的 CSS 风格，或者稍作调整 */
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  border-radius: 12px;
  margin-bottom: 30px;
  text-align: center;
}
.goods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); /* 响应式布局 */
  gap: 20px;
}
.goods-card {
  cursor: pointer;
  transition: transform 0.2s;
}
.goods-card:hover {
  transform: translateY(-5px);
}
.image-placeholder {
  height: 180px;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  position: relative;
}
.goods-info {
  padding: 14px;
}
.goods-title {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.goods-desc {
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
  height: 36px; /* 限制两行高度 */
  overflow: hidden;
}
.bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.price {
  color: #f56c6c;
  font-weight: bold;
}
</style>
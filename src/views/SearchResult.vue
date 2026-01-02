<template>
  <div class="search-page">
    <el-card class="filter-panel">
      <div class="filter-row" v-if="brands.length > 0">
        <span class="label">品牌：</span>
        <div class="options">
          <span 
            v-for="b in brands" :key="b" 
            :class="{ active: searchParam.brandName === b }"
            @click="toggleFilter('brandName', b)"
          >{{ b }}</span>
        </div>
      </div>
      
      <div class="sort-bar">
        <span :class="{ active: !searchParam.sort }" @click="changeSort('')">综合</span>
        <span :class="{ active: searchParam.sort === 'sale_desc' }" @click="changeSort('sale_desc')">销量 ↓</span>
        <span :class="{ active: searchParam.sort === 'price_asc' }" @click="changeSort('price_asc')">价格 ↑</span>
        <span :class="{ active: searchParam.sort === 'price_desc' }" @click="changeSort('price_desc')">价格 ↓</span>
      </div>
    </el-card>

    <div class="goods-list" v-loading="loading">
      <el-empty v-if="productList.length === 0" description="暂无相关商品" />
      
      <div 
        v-else 
        class="goods-item" 
        v-for="item in productList" 
        :key="item.id"
        @click="router.push(`/goods/${item.id}`)"
      >
        <div class="img-box">
          <img :src="item.img" alt="" />
        </div>
        <div class="info">
          <div class="price">¥ {{ item.price }}</div>
          <div class="title" v-html="item.title"></div>
          <div class="sales">销量 {{ item.saleCount }}</div>
          <div class="shop">{{ item.brandName }}旗舰店</div>
        </div>
      </div>
    </div>

    <div class="pagination">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="searchParam.pageSize"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchGoods } from '../api/search'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const productList = ref([])
const brands = ref([]) // 聚合品牌列表
const total = ref(0)

// 搜索参数
const searchParam = reactive({
  keyword: '',
  brandId: null, // 这里简化处理，直接传名字可能需要后端配合，或者前端维护名字到ID的映射。
                 // 架构师注：为了演示方便，这里暂不传 ID，实际项目应传 ID。
                 // 如果后端只聚合了名字，可以先不做点击筛选，或者修改后端聚合 ID。
  sort: '',
  pageNum: 1,
  pageSize: 20
})

// 执行搜索
const doSearch = async () => {
  loading.value = true
  try {
    const res = await searchGoods(searchParam)
    if (res.code === 200) {
      productList.value = res.data.productList
      total.value = res.data.total
      // 处理聚合结果 (假设后端返回了 brandList String列表)
      brands.value = res.data.brandList || []
    }
  } finally {
    loading.value = false
  }
}

// 切换排序
const changeSort = (val) => {
  searchParam.sort = val
  searchParam.pageNum = 1
  doSearch()
}

// 翻页
const handlePageChange = (page) => {
  searchParam.pageNum = page
  doSearch()
}

// 监听路由参数变化 (比如在搜索页再次搜索其他词)
watch(
  () => route.query.keyword,
  (newVal) => {
    if (newVal) {
      searchParam.keyword = newVal
      searchParam.pageNum = 1
      doSearch()
    }
  },
  { immediate: true } // 初始化时立即执行
)
</script>

<style scoped>
.search-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
.filter-panel {
  margin-bottom: 20px;
}
.filter-row {
  display: flex;
  margin-bottom: 15px;
  font-size: 14px;
}
.filter-row .label {
  color: #999;
  width: 60px;
}
.filter-row .options span {
  margin-right: 20px;
  cursor: pointer;
}
.filter-row .options span:hover, .filter-row .options span.active {
  color: #e4393c;
}

.sort-bar {
  border-top: 1px solid #eee;
  padding-top: 10px;
  font-size: 14px;
}
.sort-bar span {
  padding: 5px 10px;
  border: 1px solid #ddd;
  margin-right: -1px;
  cursor: pointer;
  background: #fff;
}
.sort-bar span.active {
  background: #e4393c;
  color: #fff;
  border-color: #e4393c;
}

.goods-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.goods-item {
  width: 220px;
  background: #fff;
  padding: 10px;
  border: 1px solid #eee;
  transition: all 0.3s;
  cursor: pointer;
}
.goods-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}
.img-box {
  width: 100%;
  height: 200px;
  overflow: hidden;
  margin-bottom: 10px;
}
.img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.info .price {
  color: #e4393c;
  font-size: 18px;
  font-weight: bold;
}
.info .title {
  font-size: 13px;
  color: #666;
  line-height: 20px;
  height: 40px;
  overflow: hidden;
  margin: 5px 0;
  /* 支持 v-html 内部样式 */
  :deep(span) {
    color: #e4393c; /* 强制高亮颜色 */
    font-weight: bold;
  }
}
.info .sales, .info .shop {
  font-size: 12px;
  color: #999;
}
.pagination {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}
</style>
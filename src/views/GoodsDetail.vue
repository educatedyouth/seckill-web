<template>
  <div class="goods-detail-container">
    <el-card class="box-card">
      <div class="header">
        <h1 class="title">{{ spuInfo.spuName }}</h1>
        <p class="subtitle">{{ spuInfo.spuDescription }}</p>
      </div>

      <div class="main-content">
        <div class="image-section">
          <div class="main-image-box">
            <img :src="displayImg || 'https://via.placeholder.com/400?text=No+Image'" alt="商品主图" />
          </div>
          
          <div class="sku-gallery" v-if="currentSkuImages && currentSkuImages.length > 0">
            <div 
              v-for="(imgObj, index) in currentSkuImages" 
              :key="imgObj.id"
              class="thumb-item"
              :class="{ 'active': displayImg === imgObj.imgUrl }"
              @click="setDisplayImg(imgObj.imgUrl)"
            >
              <img :src="imgObj.imgUrl" alt="缩略图" />
            </div>
          </div>
        </div>

        <div class="sku-box">
          <div class="price-row">
            <span class="currency">¥</span>
            <span class="price">{{ currentSku ? currentSku.price : '---' }}</span>
          </div>

          <div v-for="(group, index) in specGroups" :key="index" class="spec-row">
            <div class="spec-name">{{ group.name }}</div>
            <div class="spec-values">
              <el-button
                v-for="val in group.values"
                :key="val"
                :type="isSelected(group.name, val) ? 'primary' : ''"
                @click="selectSpec(group.name, val)"
                size="small"
              >
                {{ val }}
              </el-button>
            </div>
          </div>

          <div class="stock-row">
            库存: {{ currentSku ? currentSku.stock : '---' }} 件
            <span v-if="currentSku" class="sku-id-tag">SKU ID: {{ currentSku.skuId }}</span>
          </div>

          <div class="action-btn">
            <el-button type="danger" size="large" :disabled="!currentSku || currentSku.stock <= 0">
              {{ currentSku ? (currentSku.stock > 0 ? '立即购买' : '缺货') : '请选择规格' }}
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <el-card class="debug-card" style="margin-top: 20px;">
      <template #header>调试面板</template>
      <p>当前选中的规格: {{ selectedSpecs }}</p>
      <p>当前匹配的 SKU: {{ currentSku ? currentSku.skuName : 'None' }}</p>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getGoodsDetail } from '../api/goods'
import { ElMessage } from 'element-plus'

const route = useRoute()
const spuInfo = ref({})
const skuList = ref([])

// 页面当前展示的主图 URL
const displayImg = ref('')
// 当前展示的缩略图列表
const currentSkuImages = ref([])

const selectedSpecs = ref({})
const specGroups = ref([])

onMounted(async () => {
  const spuId = route.params.id
  if (!spuId) {
    ElMessage.error('参数错误')
    return
  }
  loadData(spuId)
})

const loadData = async (id) => {
  try {
    const res = await getGoodsDetail(id)
    if (res.code === 200) {
      spuInfo.value = res.data.spuInfo
      skuList.value = res.data.skuList || []
      
      // 默认图片策略：如果SPU有图显示SPU图，否则显示列表第一个SKU的图作为兜底
      if (spuInfo.value.spuImg) {
        displayImg.value = spuInfo.value.spuImg
      } else if (skuList.value.length > 0) {
        displayImg.value = skuList.value[0].skuDefaultImg
      }

      extractSpecs(skuList.value)
    } else {
      ElMessage.error(res.message || '加载失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('网络错误')
  }
}

// === 核心算法：规格提取 ===
const extractSpecs = (list) => {
  const groups = new Map()
  list.forEach(sku => {
    if (sku.saleAttrValues) {
      sku.saleAttrValues.forEach(attr => {
        if (!groups.has(attr.attrName)) {
          groups.set(attr.attrName, new Set())
        }
        groups.get(attr.attrName).add(attr.attrValue)
      })
    }
  })
  const result = []
  groups.forEach((valueSet, key) => {
    result.push({
      name: key,
      values: Array.from(valueSet)
    })
  })
  specGroups.value = result
}

// === 交互逻辑 ===
const selectSpec = (name, value) => {
  if (selectedSpecs.value[name] === value) {
    delete selectedSpecs.value[name]
  } else {
    selectedSpecs.value[name] = value
  }
}

const isSelected = (name, value) => {
  return selectedSpecs.value[name] === value
}

// 计算当前匹配的 SKU
const currentSku = computed(() => {
  if (Object.keys(selectedSpecs.value).length < specGroups.value.length) {
    return null
  }
  return skuList.value.find(sku => {
    return sku.saleAttrValues.every(attr => {
      return selectedSpecs.value[attr.attrName] === attr.attrValue
    })
  })
})

// === 关键：监听 SKU 变化，切换图片 ===
watch(currentSku, (newSku) => {
  if (newSku) {
    // 1. 切换主图为该 SKU 的默认图
    if (newSku.skuDefaultImg) {
      displayImg.value = newSku.skuDefaultImg
    }
    // 2. 更新相册列表
    currentSkuImages.value = newSku.images || []
  } else {
    // 如果用户取消了某个规格导致匹配失效，这里可以选择重置，或者保持最后一张图
    // currentSkuImages.value = []
  }
})

// 手动点击缩略图切换主图
const setDisplayImg = (url) => {
  displayImg.value = url
}

</script>

<style scoped>
.goods-detail-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}
.header {
  margin-bottom: 20px;
}
.title {
  font-size: 24px;
  font-weight: bold;
}
.subtitle {
  color: #999;
}

.main-content {
  display: flex;
  gap: 30px;
}

/* 左侧图片区布局 */
.image-section {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.main-image-box {
  width: 400px;
  height: 400px;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.main-image-box img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 保证图片填满且不变形 */
}

/* 缩略图画廊 */
.sku-gallery {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 5px;
}
.thumb-item {
  width: 60px;
  height: 60px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
}
.thumb-item.active {
  border: 2px solid #409EFF; /* 选中高亮 */
}
.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 右侧SKU区 */
.sku-box {
  flex: 1;
}
.price-row {
  color: #f56c6c;
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 20px;
}
.currency {
  font-size: 18px;
  margin-right: 4px;
}
.spec-row {
  margin-bottom: 15px;
}
.spec-name {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}
.spec-values {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.stock-row {
  margin-top: 20px;
  color: #999;
  font-size: 14px;
}
.sku-id-tag {
  margin-left: 10px;
  padding: 2px 6px;
  background: #f0f2f5;
  border-radius: 4px;
  font-size: 12px;
}
.action-btn {
  margin-top: 30px;
}
</style>
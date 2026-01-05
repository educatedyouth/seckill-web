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
                :disabled="isSpecDisabled(group.name, val)"
                @click="selectSpec(group.name, val)"
                size="small"
              >
                {{ val }}
              </el-button>
            </div>
          </div>

          <div class="stock-row">
            <div class="count-box">
              <span class="label">数量：</span>
              <el-input-number 
                v-model="buyCount" 
                :min="1" 
                :max="currentSku ? currentSku.stock : 1" 
                size="small"
                :disabled="!currentSku || currentSku.stock <= 0"
              />
              <span class="stock-text" v-if="currentSku">（库存: {{ currentSku.stock }} 件）</span>
            </div>
            <div v-if="currentSku" class="sku-id-tag">SKU ID: {{ currentSku.skuId }}</div>
          </div>

          <div class="action-btn">
            <el-button 
              type="warning" 
              size="large" 
              icon="ShoppingCart"
              @click="handleAddToCart"
              :disabled="!currentSku || currentSku.stock <= 0"
            >
              加入购物车
            </el-button>
            
            <el-button 
              type="danger" 
              size="large" 
              @click="handleBuyNow"
              :disabled="!currentSku || currentSku.stock <= 0"
            >
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
import { useRoute, useRouter } from 'vue-router'
import { getGoodsDetail } from '../api/goods'
import { useCartStore } from '../store/cart'
import { ElMessage } from 'element-plus'
import { ShoppingCart } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const spuInfo = ref({})
const skuList = ref([])

const displayImg = ref('')
const currentSkuImages = ref([])

const selectedSpecs = ref({})
const specGroups = ref([])
const buyCount = ref(1)

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
      const originSkuList = res.data.skuList || []
      
      // === 【修复点 1】数据清洗 ===
      skuList.value = originSkuList.map(sku => {
        // 1. 强制空值处理：如果 saleAttrValues 为 null，给个空数组
        if (!sku.saleAttrValues) {
          sku.saleAttrValues = []
        }

        // 2. 生成规格 Map
        const map = {}
        sku.saleAttrValues.forEach(attr => {
          map[attr.attrName] = attr.attrValue
        })
        
        return {
          ...sku,
          _specMap: map
        }
      })

      // 图片初始化
      if (spuInfo.value.spuImg) {
        displayImg.value = spuInfo.value.spuImg
      } else if (skuList.value.length > 0) {
        displayImg.value = skuList.value[0].skuDefaultImg
      }

      extractSpecs(skuList.value)
      
      // === 【新增】如果是单品（无规格），默认初始化第一个 SKU 的图片和相册
      if (specGroups.value.length === 0 && skuList.value.length > 0) {
          const defaultSku = skuList.value[0]
          if (defaultSku.skuDefaultImg) displayImg.value = defaultSku.skuDefaultImg
          currentSkuImages.value = defaultSku.images || []
      }

    } else {
      ElMessage.error(res.message || '加载失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('网络错误')
  }
}

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

const isSpecDisabled = (specName, specValue) => {
  if (selectedSpecs.value[specName] === specValue) return false
  const tempSpecs = { ...selectedSpecs.value }
  tempSpecs[specName] = specValue
  const hasValidSku = skuList.value.some(sku => {
    const match = Object.entries(tempSpecs).every(([key, val]) => {
      return sku._specMap[key] === val
    })
    return match && sku.stock > 0
  })
  return !hasValidSku
}

// === 【修复点 2】修复 currentSku 计算逻辑 ===
const currentSku = computed(() => {
  // 情况 A：如果没有规格（单品），直接返回列表里的第一个 SKU
  if (specGroups.value.length === 0) {
    return skuList.value.length > 0 ? skuList.value[0] : null
  }

  // 情况 B：有规格，但还没选完
  if (Object.keys(selectedSpecs.value).length < specGroups.value.length) {
    return null
  }

  // 情况 C：有规格且已选完，进行匹配
  return skuList.value.find(sku => {
    // 这里因为我们在 loadData 做过清洗，sku.saleAttrValues 必定是数组，不会报错
    return sku.saleAttrValues.every(attr => {
      return selectedSpecs.value[attr.attrName] === attr.attrValue
    })
  })
})

watch(currentSku, (newSku) => {
  if (newSku) {
    buyCount.value = 1
    if (newSku.skuDefaultImg) {
      displayImg.value = newSku.skuDefaultImg
    }
    currentSkuImages.value = newSku.images || []
  }
})

const setDisplayImg = (url) => {
  displayImg.value = url
}

const handleAddToCart = async () => {
  if (!currentSku.value) {
    ElMessage.warning('请选择完整的商品规格')
    return
  }
  if (currentSku.value.stock <= 0) {
    ElMessage.warning('该商品暂时缺货')
    return
  }
  await cartStore.addToCart(currentSku.value.skuId, buyCount.value)
}

const handleBuyNow = () => {
  if (!currentSku.value) {
    ElMessage.warning('请选择完整的商品规格')
    return
  }
  ElMessage.info('正在跳转结算页...')
  cartStore.addToCart(currentSku.value.skuId, buyCount.value).then(() => {
    router.push('/order/confirm')
  })
}
</script>

<style scoped>
.goods-detail-container { padding: 20px; max-width: 1000px; margin: 0 auto; }
.header { margin-bottom: 20px; }
.title { font-size: 24px; font-weight: bold; }
.subtitle { color: #999; }
.main-content { display: flex; gap: 30px; }
.image-section { width: 400px; display: flex; flex-direction: column; gap: 10px; }
.main-image-box { width: 400px; height: 400px; border: 1px solid #eee; border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.main-image-box img { width: 100%; height: 100%; object-fit: cover; }
.sku-gallery { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; }
.thumb-item { width: 60px; height: 60px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; flex-shrink: 0; }
.thumb-item.active { border: 2px solid #409EFF; }
.thumb-item img { width: 100%; height: 100%; object-fit: cover; }
.sku-box { flex: 1; display: flex; flex-direction: column; } /* 修改为 column 布局 */
.price-row { color: #f56c6c; font-size: 28px; font-weight: bold; margin-bottom: 20px; }
.currency { font-size: 18px; margin-right: 4px; }
.spec-row { margin-bottom: 15px; }
.spec-name { font-size: 14px; color: #666; margin-bottom: 8px; }
.spec-values { display: flex; gap: 10px; flex-wrap: wrap; }
.stock-row { margin-top: 20px; color: #666; font-size: 14px; display: flex; align-items: center; gap: 10px; }
.count-box { display: flex; align-items: center; }
.label { margin-right: 8px; }
.stock-text { margin-left: 8px; color: #999; font-size: 12px; }
.sku-id-tag { padding: 2px 6px; background: #f0f2f5; border-radius: 4px; font-size: 12px; color: #999; }
.action-btn { margin-top: 30px; display: flex; gap: 15px; } /* 增加 gap */
</style>
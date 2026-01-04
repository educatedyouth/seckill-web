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
// 1. 引入 Store 和 Element组件
import { useCartStore } from '../store/cart'
import { ElMessage } from 'element-plus'
import { ShoppingCart } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore() // 初始化 Store

const spuInfo = ref({})
const skuList = ref([])

const displayImg = ref('')
const currentSkuImages = ref([])

const selectedSpecs = ref({})
const specGroups = ref([])

// 【新增】购买数量
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
      
      skuList.value = originSkuList.map(sku => {
        const map = {}
        if (sku.saleAttrValues) {
          sku.saleAttrValues.forEach(attr => {
            map[attr.attrName] = attr.attrValue
          })
        }
        return {
          ...sku,
          _specMap: map
        }
      })
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

// 监听 SKU 变化，重置数量
watch(currentSku, (newSku) => {
  if (newSku) {
    buyCount.value = 1 // 切换规格时重置数量
    if (newSku.skuDefaultImg) {
      displayImg.value = newSku.skuDefaultImg
    }
    currentSkuImages.value = newSku.images || []
  }
})

const setDisplayImg = (url) => {
  displayImg.value = url
}

// === 【新增】加入购物车逻辑 ===
const handleAddToCart = async () => {
  if (!currentSku.value) {
    ElMessage.warning('请选择完整的商品规格')
    return
  }
  if (currentSku.value.stock <= 0) {
    ElMessage.warning('该商品暂时缺货')
    return
  }
  
  // 调用 Store Action (会自动更新右上角小红点)
  // Store 内部已经处理了 try-catch 和 成功提示
  await cartStore.addToCart(currentSku.value.skuId, buyCount.value)
}

// === 【新增】立即购买逻辑 (预留) ===
const handleBuyNow = () => {
  if (!currentSku.value) {
    ElMessage.warning('请选择完整的商品规格')
    return
  }
  // 立即购买的逻辑通常是：先加购物车，然后直接跳转到结算页
  // 或者跳转到确认订单页带上 skuId
  ElMessage.info('正在跳转结算页...')
  // 简单实现：先加购再跳转
  cartStore.addToCart(currentSku.value.skuId, buyCount.value).then(() => {
    router.push('/order/confirm') // 这里需要后续实现确认订单页
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
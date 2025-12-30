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

const displayImg = ref('')
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
      // 【修复点】这里必须先定义 originSkuList
      const originSkuList = res.data.skuList || []
      
      // === 【优化开始】预处理 SKU 数据 ===
      // 我们不仅保存原始数据，还给每个 SKU 加一个 "外挂" map
      // 以后查属性不用遍历数组，直接 sku._specMap['颜色'] 就能拿到 '红色'
      skuList.value = originSkuList.map(sku => {
        const map = {}
        if (sku.saleAttrValues) {
          sku.saleAttrValues.forEach(attr => {
            map[attr.attrName] = attr.attrValue
          })
        }
        return {
          ...sku,
          _specMap: map // 挂载这个 map，前缀 _ 表示这是前端生成的辅助字段
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

// === 【修改点 2】核心判读逻辑 ===
// 判断某个选项是否应该被禁用（即：选了它之后，是否会导致无货或无组合）
const isSpecDisabled = (specName, specValue) => {
  // 1. 如果该选项已经被选中，那肯定不禁用
  if (selectedSpecs.value[specName] === specValue) return false

  // 2. 构造一个“假设选中”的规格对象
  // 也就是说：保持其他行的选中状态不变，把当前行（specName）的值换成 specValue
  const tempSpecs = { ...selectedSpecs.value }
  tempSpecs[specName] = specValue

  // 3. 去 skuList 里搜寻，是否存在满足 tempSpecs 所有条件的 SKU
  // 并且该 SKU 的库存必须 > 0
  const hasValidSku = skuList.value.some(sku => {
    // 检查此 SKU 是否包含 tempSpecs 里所有的键值对
    const match = Object.entries(tempSpecs).every(([key, val]) => {
      // 直接 O(1) 读取！性能提升明显
      return sku._specMap[key] === val
    })
    
    // 只有匹配且有库存才算“有效路径”
    return match && sku.stock > 0
  })

  // 如果找不到有效路径，就禁用
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

watch(currentSku, (newSku) => {
  if (newSku) {
    if (newSku.skuDefaultImg) {
      displayImg.value = newSku.skuDefaultImg
    }
    currentSkuImages.value = newSku.images || []
  }
})

const setDisplayImg = (url) => {
  displayImg.value = url
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
.sku-box { flex: 1; }
.price-row { color: #f56c6c; font-size: 28px; font-weight: bold; margin-bottom: 20px; }
.currency { font-size: 18px; margin-right: 4px; }
.spec-row { margin-bottom: 15px; }
.spec-name { font-size: 14px; color: #666; margin-bottom: 8px; }
.spec-values { display: flex; gap: 10px; flex-wrap: wrap; }
.stock-row { margin-top: 20px; color: #999; font-size: 14px; }
.sku-id-tag { margin-left: 10px; padding: 2px 6px; background: #f0f2f5; border-radius: 4px; font-size: 12px; }
.action-btn { margin-top: 30px; }
</style>
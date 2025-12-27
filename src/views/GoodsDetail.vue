<template>
  <div class="goods-detail-container">
    <el-card class="box-card">
      <div class="header">
        <h1 class="title">{{ spuInfo.spuName }}</h1>
        <p class="subtitle">{{ spuInfo.spuDescription }}</p>
      </div>

      <div class="main-content">
        <div class="image-box">
          <img src="https://via.placeholder.com/400" alt="商品主图" />
        </div>

        <div class="sku-box">
          <div class="price-row">
            <span class="currency">¥</span>
            <span class="price">{{ currentSku ? currentSku.price : '请选择' }}</span>
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
      <template #header>后端返回的原始 SKU 列表 (Debug)</template>
      <el-table :data="skuList" border style="width: 100%">
        <el-table-column prop="skuId" label="SKU ID" width="180" />
        <el-table-column prop="skuName" label="名称" />
        <el-table-column prop="price" label="价格" width="100" />
        <el-table-column prop="stock" label="库存" width="100" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getGoodsDetail } from '../api/goods'
import { ElMessage } from 'element-plus'

const route = useRoute()
const spuInfo = ref({})
const skuList = ref([])

// 用户当前选中的规格状态，Map结构: {"颜色": "雅川青", "版本": "512GB"}
const selectedSpecs = ref({})

// 1. 初始化加载
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
      skuList.value = res.data.skuList
      // 初始化规格提取算法
      extractSpecs(res.data.skuList)
    } else {
      ElMessage.error(res.message || '加载失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('网络错误')
  }
}

// === 核心算法区域 ===

// 规格组，格式：[ {name: "颜色", values: ["红","蓝"]}, {name: "内存", values: ["64G"]} ]
const specGroups = ref([])

// 算法：从扁平的 SKU 列表中提取出有哪些规格名和规格值
const extractSpecs = (list) => {
  const groups = new Map() // 使用 Map 暂存: "颜色" -> Set("红", "蓝")
  
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

  // 转成数组格式供 template 渲染
  const result = []
  groups.forEach((valueSet, key) => {
    result.push({
      name: key,
      values: Array.from(valueSet)
    })
  })
  specGroups.value = result
}

// 用户点击规格按钮
const selectSpec = (name, value) => {
  // 如果点击已选中的，则取消选中
  if (selectedSpecs.value[name] === value) {
    delete selectedSpecs.value[name]
  } else {
    selectedSpecs.value[name] = value
  }
}

// 判断按钮是否高亮
const isSelected = (name, value) => {
  return selectedSpecs.value[name] === value
}

// 计算属性：根据当前选中的规格，查找对应的 SKU
const currentSku = computed(() => {
  // 必须所有规格都选了才开始匹配
  if (Object.keys(selectedSpecs.value).length < specGroups.value.length) {
    return null
  }

  // 遍历所有 SKU，看谁的属性完全匹配当前 selectedSpecs
  return skuList.value.find(sku => {
    // 检查这个 SKU 的每个属性是否都在 selectedSpecs 里匹配
    // 这里做了一个简化假设：SKU的属性数量和规格组数量一致
    return sku.saleAttrValues.every(attr => {
      return selectedSpecs.value[attr.attrName] === attr.attrValue
    })
  })
})

</script>

<style scoped>
.goods-detail-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}
.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}
.subtitle {
  color: #999;
  margin-bottom: 20px;
}
.main-content {
  display: flex;
  gap: 30px;
}
.image-box img {
  width: 300px;
  height: 300px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #eee;
}
.sku-box {
  flex: 1;
}
.price-row {
  color: #f56c6c;
  font-size: 24px;
  margin-bottom: 20px;
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
}
.stock-row {
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}
.sku-id-tag {
  margin-left: 10px;
  font-size: 12px;
  color: #ccc;
}
.action-btn {
  margin-top: 30px;
}
</style>
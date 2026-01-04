<template>
  <div class="publish-page">
    <header class="simple-header">
      <div class="header-inner">
        <div class="logo" @click="$router.push('/')">
          <span>⚡</span> Seckill Merchant
        </div>
        <el-button link @click="$router.push('/')">返回商城首页</el-button>
      </div>
    </header>

    <div class="publish-container">
      <div class="form-card">
        <div class="card-header">
          <h2>{{ isEditMode ? '🛠️ 编辑商品' : '🔥 商品发布中心' }}</h2>
          <span class="subtitle">支持动态规格配置的企业级发布台</span>
        </div>

        <el-form :model="form" ref="formRef" label-width="100px" class="goods-form">
          
          <h3 class="section-title">1. SPU 基础信息</h3>
          <el-row :gutter="40">
            <el-col :span="16">
              <el-form-item label="商品名称" required>
                <el-input v-model="form.spuName" placeholder="例如：Nike Air Force 1 / 华为 Mate 60" />
              </el-form-item>
              <el-form-item label="商品描述">
                <el-input v-model="form.spuDescription" type="textarea" :rows="3" placeholder="请输入商品详细卖点..." />
              </el-form-item>
              <el-form-item label="所属分类" required>
                <el-cascader
                  v-model="selectedCategory"
                  :options="categoryOptions"
                  :props="{ label: 'name', value: 'id', children: 'children' }"
                  placeholder="请选择三级分类"
                  @change="handleCategoryChange"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="SPU封面" required label-width="80px">
                <el-upload
                  class="spu-uploader"
                  action="#"
                  :http-request="handleSpuUpload" 
                  :show-file-list="false"
                  :before-upload="beforeAvatarUpload"
                >
                  <img v-if="form.spuImg" :src="form.spuImg" class="spu-img"/>
                  <div v-else class="upload-placeholder">
                    <el-icon><Plus /></el-icon>
                    <span>点击上传</span>
                  </div>
                </el-upload>
                <div class="tip">商品列表页展示图</div>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="商品品牌" required>
                <el-select 
                  v-model="form.brandId" 
                  placeholder="输入关键词搜索或直接回车创建" 
                  style="width: 100%" 
                  filterable
                  remote
                  :remote-method="remoteMethod"
                  :loading="brandLoading"
                  allow-create
                  default-first-option
                  @change="handleBrandChange"
                >
                  <el-option 
                    v-for="b in brandOptions" 
                    :key="b.id" 
                    :label="b.name" 
                    :value="b.id" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="重量(kg)">
                <el-input-number v-model="form.weight" :precision="2" :step="0.1" style="width: 100%"/>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="上架状态">
                <el-switch v-model="form.publishStatus" :active-value="1" :inactive-value="0" />
              </el-form-item>
            </el-col>
          </el-row>

          <h3 class="section-title">
            2. SKU 规格配置
            <div class="subtitle-tip">（输入规格名如“颜色”、“尺寸”后回车，即可为表格添加新列）</div>
          </h3>
          
          <div class="spec-setting-area">
            <el-tag
              v-for="(tag, index) in dynamicSpecs"
              :key="tag"
              closable
              :disable-transitions="false"
              @close="handleCloseSpec(index)"
              size="large"
              effect="dark"
              style="margin-right: 10px"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="inputVisible"
              ref="InputRef"
              v-model="inputValue"
              class="input-new-tag"
              size="small"
              @keyup.enter="handleInputConfirm"
              @blur="handleInputConfirm"
              placeholder="输入规格名回车"
            />
            <el-button v-else class="button-new-tag" size="small" @click="showInput">
              + 新增规格维度
            </el-button>
          </div>

          <div class="sku-section">
            <div class="sku-actions">
              <el-button type="primary" size="small" @click="addSkuRow" plain>+ 添加一行 SKU</el-button>
            </div>

            <el-table :data="form.skus" border style="width: 100%">
              <el-table-column label="组合名称" width="180">
                <template #default="scope">
                  <el-input v-model="scope.row.skuName" placeholder="如: 红色 XL" size="small"/>
                </template>
              </el-table-column>
              
              <el-table-column label="价格 (元)" width="120">
                <template #default="scope">
                  <el-input v-model="scope.row.price" type="number" size="small"/>
                </template>
              </el-table-column>
              
              <el-table-column label="库存" width="100">
                <template #default="scope">
                  <el-input v-model="scope.row.stock" type="number" size="small"/>
                </template>
              </el-table-column>

              <el-table-column 
                v-for="(specName, index) in dynamicSpecs" 
                :key="index" 
                :label="specName"
              >
                <template #default="scope">
                  <el-input 
                    v-model="scope.row.tempAttrs[specName]" 
                    :placeholder="'输入'+specName" 
                    size="small"
                  />
                </template>
              </el-table-column>

              <el-table-column label="SKU 图片 (首张为默认)" min-width="200">
                <template #default="scope">
                  <el-upload
                    v-model:file-list="scope.row.fileList"
                    action="#" 
                    list-type="picture-card"
                    :http-request="(options) => handleSkuUpload(options, scope.$index)"
                    :before-upload="beforeAvatarUpload"
                    :on-remove="(file) => handleRemove(file, scope.$index)"
                    class="mini-uploader"
                  >
                    <el-icon><Plus /></el-icon>
                  </el-upload>
                </template>
              </el-table-column>

              <el-table-column label="操作" width="80" fixed="right">
                <template #default="scope">
                  <el-button type="danger" link @click="removeSkuRow(scope.$index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="form-footer">
            <el-button size="large" @click="$router.push('/')">取消</el-button>
            <el-button type="primary" size="large" @click="submitForm" :loading="submitting">
              {{ isEditMode ? '💾 保存修改' : '🚀 立即发布' }}
            </el-button>
          </div>

        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
// 【修正】引入 searchBrand 和 addBrand
import { getCategoryTree, saveGoods, getGoodsDetail, updateGoods, getBrandList, searchBrand, addBrand,getBrand } from '../api/goods'
import { uploadFile } from '../api/oss'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const submitting = ref(false)
const categoryOptions = ref([])
const brandOptions = ref([]) 
const selectedCategory = ref([])

// 【关键修复】定义 brandLoading 变量
const brandLoading = ref(false)

const isEditMode = ref(false)
const editId = ref(null)

const dynamicSpecs = ref(['颜色', '版本']) 
const inputVisible = ref(false)
const inputValue = ref('')
const InputRef = ref()

const form = reactive({
  spuName: '',
  spuImg: '', 
  spuDescription: '',
  categoryId: null,
  brandId: null, 
  weight: 0,
  publishStatus: 1,
  skus: [
    { 
      skuName: '', price: '', stock: '', 
      fileList: [], 
      tempAttrs: { '颜色': '', '版本': '' } 
    }
  ]
})

onMounted(async () => {
  const catRes = await getCategoryTree()
  if (catRes.code === 200) categoryOptions.value = catRes.data
  
  // 页面加载时不自动全量拉取品牌，由用户搜索触发
  // 或者是预加载一部分热门品牌
  const brandRes = await searchBrand('') // 查默认前20条
  if (brandRes.code === 200) brandOptions.value = brandRes.data

  if (route.query.id) {
    isEditMode.value = true
    editId.value = route.query.id
    loadGoodsDetail(route.query.id)
  }
})

// === 品牌远程搜索与自动创建逻辑 ===
const remoteMethod = async (query) => {
  if (query) {
    brandLoading.value = true
    try {
      const res = await searchBrand(query)
      if (res.code === 200) {
        brandOptions.value = res.data
      }
    } finally {
      brandLoading.value = false
    }
  } else {
    brandOptions.value = []
  }
}

const handleBrandChange = async (val) => {
  // 1. 【核心修复】先判断 val 是否等于某个现有选项的 ID
  // 使用 == 而不是 ===，是为了兼容 ID 可能是数字 1 也可能是字符串 "1" 的情况
  const existingItem = brandOptions.value.find(item => item.id == val)

  if (existingItem) {
    // A. 如果在列表里找到了，说明用户是“选中”了现有品牌
    // 此时什么都不用做，v-model 已经绑定了 ID
    // console.log('选中了现有品牌:', existingItem.name)
    return
  }

  // B. 如果列表里没找到，说明用户输入了“新词”，此时 val 就是用户输入的品牌名
  // 此时触发创建逻辑
  if (val) {
    brandLoading.value = true
    try {
      const res = await addBrand(val)
      if (res.code === 200) {
        const newBrand = res.data
        // 1. 把新品牌加到选项列表里，否则下拉框会显示不出来
        brandOptions.value.push(newBrand)
        // 2. 将表单绑定的值更新为新品牌的 ID
        form.brandId = newBrand.id 
        ElMessage.success(`已自动创建新品牌：${newBrand.name}`)
      } else {
        ElMessage.error(res.message || '创建失败')
        form.brandId = null // 创建失败，清空选择
      }
    } catch (e) {
      console.error(e)
      ElMessage.error('创建品牌网络异常')
      form.brandId = null
    } finally {
      brandLoading.value = false
    }
  }
}

// === 动态规格逻辑 ===
const handleCloseSpec = (index) => {
  const specName = dynamicSpecs.value[index]
  dynamicSpecs.value.splice(index, 1)
  form.skus.forEach(sku => {
    if (sku.tempAttrs && sku.tempAttrs[specName]) {
      delete sku.tempAttrs[specName]
    }
  })
}

const showInput = () => {
  inputVisible.value = true
  nextTick(() => { InputRef.value.focus() })
}

const handleInputConfirm = () => {
  if (inputValue.value) {
    if (!dynamicSpecs.value.includes(inputValue.value)) {
      dynamicSpecs.value.push(inputValue.value)
      form.skus.forEach(sku => {
        if (!sku.tempAttrs) sku.tempAttrs = {}
        sku.tempAttrs[inputValue.value] = ''
      })
    } else {
      ElMessage.warning('该规格名已存在')
    }
  }
  inputVisible.value = false
  inputValue.value = ''
}

const addSkuRow = () => {
  const newAttrs = {}
  dynamicSpecs.value.forEach(key => newAttrs[key] = '')
  form.skus.push({ 
    skuName: '', price: '', stock: '', 
    fileList: [], 
    tempAttrs: newAttrs
  })
}

const removeSkuRow = (index) => {
  form.skus.splice(index, 1)
}

const beforeAvatarUpload = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error('仅支持 JPG/PNG 格式!')
    return false
  }
  if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

const handleSpuUpload = async (options) => {
  try {
    const res = await uploadFile(options.file)
    if (res.code === 200) {
      form.spuImg = res.data
      ElMessage.success('主图上传成功')
    }
  } catch (err) { ElMessage.error('上传出错') }
}

const handleSkuUpload = async (options, index) => {
  try {
    const res = await uploadFile(options.file)
    if (res.code === 200) {
      const fileItem = form.skus[index].fileList.find(f => f.uid === options.file.uid)
      if (fileItem) {
        fileItem.url = res.data
        fileItem.status = 'success'
      }
    }
  } catch (err) { ElMessage.error('上传出错') }
}

const handleRemove = (uploadFile, index) => {
  console.log('Remove file from sku index:', index)
}

const handleCategoryChange = (val) => {
  if (val && val.length > 0) form.categoryId = val[val.length - 1]
}

const loadGoodsDetail = async (id) => {
  try {
    const res = await getGoodsDetail(id)
    if (res.code === 200) {
      const spu = res.data.spuInfo
      const skus = res.data.skuList

      form.spuName = spu.spuName
      form.spuDescription = spu.spuDescription
      form.categoryId = spu.categoryId
      form.brandId = spu.brandId
      form.weight = spu.weight
      form.publishStatus = spu.publishStatus
      form.spuImg = spu.spuImg
      if (spu.categoryId) { selectedCategory.value = [spu.categoryId] }

      if (spu.brandId) {
         // 先调用接口查出这个品牌的名字
        try {
          const brandRes = await getBrand(spu.brandId)
          if (brandRes.code === 200 && brandRes.data) {
            // 将查到的品牌放入选项列表，这样 el-select 就能匹配出名字了
            brandOptions.value = [brandRes.data]
            // 然后再赋值 ID
            form.brandId = spu.brandId
          }
        } catch (e) {
          console.error('品牌回显失败', e)
        }
      }

      const allSpecNames = new Set()
      skus.forEach(sku => {
        if (sku.saleAttrValues) {
          sku.saleAttrValues.forEach(attr => allSpecNames.add(attr.attrName))
        }
      })
      if (allSpecNames.size > 0) {
        dynamicSpecs.value = Array.from(allSpecNames)
      }

      if (skus && skus.length > 0) {
        form.skus = skus.map(sku => {
          const tempAttrs = {}
          sku.saleAttrValues?.forEach(attr => {
            tempAttrs[attr.attrName] = attr.attrValue
          })
          dynamicSpecs.value.forEach(spec => {
            if (!tempAttrs[spec]) tempAttrs[spec] = ''
          })

          const fileList = (sku.images || []).map((img, i) => ({
            name: `img-${i}`,
            url: img.imgUrl,
            status: 'success'
          }))

          return {
            skuId: sku.skuId,
            skuName: sku.skuName,
            price: sku.price,
            stock: sku.stock,
            fileList: fileList,
            tempAttrs: tempAttrs
          }
        })
      }
    } else {
      ElMessage.error('获取商品详情失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('网络错误，无法加载商品数据')
  }
}

const submitForm = async () => {
  if (!form.spuName || !form.categoryId) return ElMessage.warning('请填写SPU基本信息')

  submitting.value = true
  try {
    const finalSkus = form.skus.map(sku => {
      const saleAttrs = []
      for (const [key, value] of Object.entries(sku.tempAttrs)) {
        if (value) {
          saleAttrs.push({ attrName: key, attrValue: value })
        }
      }

      const images = sku.fileList
        .filter(f => f.url)
        .map(f => f.url)

      return {
        skuId: sku.skuId,
        skuName: sku.skuName,
        price: sku.price,
        stock: sku.stock,
        images: images,
        saleAttrs: saleAttrs,
        defaultImg: images.length > 0 ? images[0] : ''
      }
    })

    const postData = { ...form, skus: finalSkus }

    let res
    if (isEditMode.value) {
      postData.id = editId.value
      res = await updateGoods(postData)
    } else {
      res = await saveGoods(postData)
    }
    
    if (res.code === 200) {
      ElMessage.success(isEditMode.value ? '修改成功！' : '发布成功！')
      setTimeout(() => router.push('/'), 500)
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('网络错误')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.publish-page { background: #f5f7fa; min-height: 100vh; }
.simple-header { height: 60px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.05); margin-bottom: 20px; }
.header-inner { max-width: 1200px; margin: 0 auto; height: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; }
.logo { font-size: 20px; font-weight: bold; color: #333; cursor: pointer; }
.publish-container { max-width: 1200px; margin: 0 auto; padding-bottom: 50px; }
.form-card { background: #fff; border-radius: 8px; padding: 30px 40px; box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05); }
.card-header h2 { margin: 0; font-size: 22px; color: #303133; }
.subtitle { color: #909399; font-size: 13px; margin-top: 5px; display: block; }
.section-title { border-left: 4px solid #409EFF; padding-left: 12px; font-size: 16px; margin: 30px 0 20px; display: flex; align-items: center; }
.subtitle-tip { font-size: 12px; color: #999; font-weight: normal; margin-left: 10px; }
.spu-uploader { border: 1px dashed #d9d9d9; border-radius: 6px; cursor: pointer; position: relative; overflow: hidden; width: 120px; height: 120px; display: flex; justify-content: center; align-items: center; transition: border-color 0.3s; }
.spu-uploader:hover { border-color: #409EFF; }
.spu-img { width: 100%; height: 100%; object-fit: cover; }
.upload-placeholder { display: flex; flex-direction: column; align-items: center; color: #8c939d; font-size: 12px; }
.tip { font-size: 12px; color: #999; margin-top: 5px; }
.spec-setting-area { margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 4px; }
.input-new-tag { width: 120px; margin-right: 10px; vertical-align: bottom; }
.button-new-tag { margin-right: 10px; }
.sku-actions { margin-bottom: 10px; }
.mini-uploader :deep(.el-upload--picture-card) { width: 60px; height: 60px; line-height: 60px; }
.mini-uploader :deep(.el-upload-list--picture-card .el-upload-list__item) { width: 60px; height: 60px; }
.form-footer { text-align: center; margin-top: 50px; border-top: 1px solid #ebeef5; padding-top: 30px; }
</style>
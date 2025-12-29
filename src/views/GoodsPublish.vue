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
          <span class="subtitle">SPU/SKU 统一录入管理</span>
        </div>

        <el-form :model="form" ref="formRef" label-width="100px" class="goods-form">
          <h3 class="section-title">1. SPU 基础信息</h3>
          
          <el-row :gutter="40">
            <el-col :span="16">
              <el-form-item label="商品名称" required>
                <el-input v-model="form.spuName" placeholder="例如：华为 Mate 60 Pro" />
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
              <el-form-item label="品牌ID">
                 <el-input-number v-model="form.brandId" :min="1" style="width: 100%"/>
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

          <div class="sku-section">
            <h3 class="section-title">
              2. SKU 规格列表 (支持多图)
              <el-button type="primary" size="small" @click="addSkuRow" class="add-btn">+ 添加 SKU</el-button>
            </h3>

            <div v-for="(sku, index) in form.skus" :key="index" class="sku-card">
              <div class="sku-header">
                <span class="tag">SKU #{{ index + 1 }}</span>
                <el-button type="danger" link @click="removeSkuRow(index)" v-if="form.skus.length > 1">删除此规格</el-button>
              </div>
              
              <el-row :gutter="15">
                <el-col :span="8">
                  <el-input v-model="sku.skuName" placeholder="组合名称 (如: 雅川青 512G)">
                    <template #prepend>名称</template>
                  </el-input>
                </el-col>
                <el-col :span="8">
                  <el-input v-model="sku.price" type="number" placeholder="0.00">
                    <template #prepend>价格</template>
                  </el-input>
                </el-col>
                <el-col :span="8">
                  <el-input v-model="sku.stock" type="number" placeholder="0">
                    <template #prepend>库存</template>
                  </el-input>
                </el-col>
              </el-row>

              <div class="attr-row">
                 <div class="label">销售属性：</div>
                 <el-input v-model="sku.color" placeholder="颜色 (如: 雅川青)" size="small" style="width: 140px; margin-right: 10px"/>
                 <el-input v-model="sku.memory" placeholder="版本 (如: 512GB)" size="small" style="width: 140px; margin-right: 10px"/>
              </div>

              <div class="image-row">
                <div class="label">SKU 相册：</div>
                <el-upload
                  v-model:file-list="sku.fileList"
                  action="#" 
                  list-type="picture-card"
                  :http-request="(options) => handleSkuUpload(options, index)"
                  :before-upload="beforeAvatarUpload"
                  :on-remove="(file) => handleRemove(file, index)"
                >
                  <el-icon><Plus /></el-icon>
                </el-upload>
              </div>
            </div>
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
import { ref, reactive, onMounted } from 'vue'
// 【重要】确保你的 api/goods.js 中导出了 getGoodsDetail 和 updateGoods
import { getCategoryTree, saveGoods, getGoodsDetail, updateGoods } from '../api/goods'
import { uploadFile } from '../api/oss'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const submitting = ref(false)
const categoryOptions = ref([])
const selectedCategory = ref([])

// 编辑模式状态
const isEditMode = ref(false)
const editId = ref(null)

const form = reactive({
  spuName: '',
  spuImg: '', 
  spuDescription: '',
  categoryId: null,
  brandId: 1,
  weight: 0,
  publishStatus: 1,
  skus: [
    { 
      skuName: '', price: '', stock: '', 
      color: '', memory: '', 
      fileList: [], 
      saleAttrs: [] 
    }
  ]
})

onMounted(async () => {
  // 1. 加载分类树
  const res = await getCategoryTree()
  if (res.code === 200) categoryOptions.value = res.data

  // 2. 检查路由参数，判断是否为编辑模式
  if (route.query.id) {
    isEditMode.value = true
    editId.value = route.query.id
    loadGoodsDetail(route.query.id)
  }
})

// === 数据回显核心逻辑 ===
const loadGoodsDetail = async (id) => {
  try {
    const res = await getGoodsDetail(id)
    if (res.code === 200) {
      const spu = res.data.spuInfo
      const skus = res.data.skuList

      // 1. 回显 SPU 信息
      form.spuName = spu.spuName
      form.spuDescription = spu.spuDescription
      form.categoryId = spu.categoryId
      form.brandId = spu.brandId
      form.weight = spu.weight
      form.publishStatus = spu.publishStatus
      form.spuImg = spu.spuImg

      // 级联选择器回显 (简化处理：直接赋 ID，如果分类树数据完整，ElementPlus 会自动匹配)
      if (spu.categoryId) {
        selectedCategory.value = [spu.categoryId] 
      }

      // 2. 回显 SKU 列表 (最复杂的部分)
      if (skus && skus.length > 0) {
        form.skus = skus.map(sku => {
          // 提取属性：从 saleAttrValues 中找到 "颜色" 和 "版本"
          const colorAttr = sku.saleAttrValues?.find(a => a.attrName === '颜色')
          const memoryAttr = sku.saleAttrValues?.find(a => a.attrName === '版本' || a.attrName === '内存')

          // 提取图片：将后端对象转为 ElementPlus 需要的 fileList 格式
          const fileList = (sku.images || []).map((img, i) => ({
            name: `img-${i}`,
            url: img.imgUrl,
            status: 'success'
          }))

          return {
            skuId: sku.skuId, // 【关键】必须保留 ID，后端靠这个判断是更新还是新增
            skuName: sku.skuName,
            price: sku.price,
            stock: sku.stock,
            color: colorAttr ? colorAttr.attrValue : '',
            memory: memoryAttr ? memoryAttr.attrValue : '',
            fileList: fileList,
            saleAttrs: [] // 提交时会重新生成
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
  console.log('Remove:', uploadFile, index)
}

const handleCategoryChange = (val) => {
  if (val && val.length > 0) form.categoryId = val[val.length - 1]
}

const addSkuRow = () => {
  form.skus.push({ 
    skuName: '', price: '', stock: '', 
    color: '', memory: '', 
    fileList: [], 
    saleAttrs: [] 
  })
}

const removeSkuRow = (index) => {
  form.skus.splice(index, 1)
}

const submitForm = async () => {
  if (!form.spuName || !form.categoryId) return ElMessage.warning('请填写SPU基本信息')

  submitting.value = true
  try {
    const finalSkus = form.skus.map(sku => {
      // 1. 提取 URL
      const images = sku.fileList
        .filter(f => f.url)
        .map(f => f.url)

      // 2. 组装属性
      const attrs = []
      if(sku.color) attrs.push({ attrName: '颜色', attrValue: sku.color })
      if(sku.memory) attrs.push({ attrName: '版本', attrValue: sku.memory })
      
      return {
        skuId: sku.skuId, // 【关键】如果是新加的行，这里是 undefined，后端会识别为 Insert
        skuName: sku.skuName,
        price: sku.price,
        stock: sku.stock,
        images: images,
        saleAttrs: attrs,
        defaultImg: images.length > 0 ? images[0] : ''
      }
    })

    const postData = { ...form, skus: finalSkus }

    let res
    if (isEditMode.value) {
      // === 编辑模式 ===
      postData.id = editId.value // 必须传 SPU ID
      res = await updateGoods(postData)
    } else {
      // === 新增模式 ===
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
.publish-page {
  background: #f5f7fa;
  min-height: 100vh;
}
.simple-header {
  height: 60px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}
.logo {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  cursor: pointer;
}
.publish-container {
  max-width: 1000px;
  margin: 0 auto;
  padding-bottom: 50px;
}
.form-card {
  background: #fff;
  border-radius: 8px;
  padding: 30px 40px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}
.card-header h2 { margin: 0; font-size: 22px; color: #303133; }
.subtitle { color: #909399; font-size: 13px; margin-top: 5px; display: block; }

.section-title {
  border-left: 4px solid #409EFF;
  padding-left: 12px;
  font-size: 16px;
  margin: 30px 0 20px;
  display: flex;
  justify-content: space-between;
}

/* SPU 样式 */
.spu-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 120px;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: border-color 0.3s;
}
.spu-uploader:hover { border-color: #409EFF; }
.spu-img { width: 100%; height: 100%; object-fit: cover; }
.upload-placeholder { display: flex; flex-direction: column; align-items: center; color: #8c939d; font-size: 12px; }
.tip { font-size: 12px; color: #999; margin-top: 5px; }

/* SKU 卡片样式 */
.sku-card {
  background: #fafafa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 20px;
  transition: all 0.3s;
}
.sku-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.05); border-color: #c0c4cc; }
.sku-header { display: flex; justify-content: space-between; margin-bottom: 15px; }
.tag { font-weight: bold; color: #606266; }

.attr-row, .image-row { margin-top: 15px; display: flex; align-items: flex-start; }
.label { width: 80px; font-size: 14px; color: #606266; padding-top: 6px; }

.form-footer { text-align: center; margin-top: 50px; border-top: 1px solid #ebeef5; padding-top: 30px; }
</style>
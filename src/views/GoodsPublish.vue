<template>
  <div class="publish-container">
    <div class="form-card">
      <div class="card-header">
        <h2>🔥 商品发布中心</h2>
        <span class="subtitle">SPU/SKU 统一录入管理</span>
      </div>

      <el-form :model="form" ref="formRef" label-width="100px" class="goods-form">
        <h3 class="section-title">1. SPU 基础信息</h3>
        
        <el-form-item label="商品名称" required>
          <el-input v-model="form.spuName" placeholder="例如：iPhone 15 Pro Max" />
        </el-form-item>

        <el-form-item label="商品主图" required>
          <el-upload
            class="avatar-uploader"
            action="#"
            :http-request="handleSpuUpload" 
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="form.spuImg" :src="form.spuImg" class="sku-img" style="width: 100px; height: 100px;"/>
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div style="font-size: 12px; color: #999; margin-left: 10px;">这将作为列表页展示的封面图</div>
        </el-form-item>

        <el-form-item label="商品描述">
          <el-input v-model="form.spuDescription" type="textarea" placeholder="请输入商品详细描述..." />
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
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="品牌ID">
               <el-input-number v-model="form.brandId" :min="1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="重量(kg)">
              <el-input-number v-model="form.weight" :precision="2" :step="0.1" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="上架状态">
          <el-switch v-model="form.publishStatus" :active-value="1" :inactive-value="0" />
        </el-form-item>

        <div class="sku-section">
          <h3 class="section-title">
            2. SKU 规格列表
            <el-button type="primary" size="small" @click="addSkuRow" class="add-btn">+ 添加 SKU</el-button>
          </h3>

          <div v-for="(sku, index) in form.skus" :key="index" class="sku-card">
            <div class="sku-header">
              <span>SKU #{{ index + 1 }}</span>
              <el-button type="danger" link @click="removeSkuRow(index)" v-if="form.skus.length > 1">删除</el-button>
            </div>
            
            <el-row :gutter="10">
              <el-col :span="8">
                <el-input v-model="sku.skuName" placeholder="SKU名称 (如: 红色 128G)" />
              </el-col>
              <el-col :span="5">
                <el-input v-model="sku.price" placeholder="价格 (元)" type="number" />
              </el-col>
              <el-col :span="5">
                <el-input v-model="sku.stock" placeholder="库存 (件)" type="number" />
              </el-col>
            </el-row>

            <div class="attr-row">
               <el-tag type="info">规格参数：</el-tag>
               <el-input v-model="sku.color" placeholder="颜色 (如: 红色)" size="small" style="width: 120px; margin: 0 5px"/>
               <el-input v-model="sku.memory" placeholder="内存 (如: 128G)" size="small" style="width: 120px; margin: 0 5px"/>
               <el-upload
                class="avatar-uploader"
                action="#" 
                :http-request="(options) => handleUpload(options, index)"
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
              >
                <img v-if="sku.images[0]" :src="sku.images[0]" class="sku-img" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </div>
          </div>
        </div>

        <div class="form-footer">
          <el-button size="large" @click="$router.push('/')">取消</el-button>
          <el-button type="primary" size="large" @click="submitForm" :loading="submitting">立即发布</el-button>
        </div>

      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getCategoryTree, saveGoods } from '../api/goods'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { Upload, Plus } from '@element-plus/icons-vue' // 引入图标
import { uploadFile } from '../api/oss' // 引入刚才写的 API
const router = useRouter()
const submitting = ref(false)
const categoryOptions = ref([])
const selectedCategory = ref([]) // 级联选择绑定的数组

// 表单数据模型 (对应后端 SpuSaveDTO)
const form = reactive({
  spuName: '',
  spuImg: '', 
  spuDescription: '',
  categoryId: null,
  brandId: 1,
  weight: 0,
  publishStatus: 1,
  spuImages: [],
  skus: [
    // 默认给一行空数据
    { 
      skuName: '', price: '', stock: '', 
      color: '', memory: '', // 临时绑定的辅助字段
      images: [''], 
      saleAttrs: [] 
    }
  ]
})

onMounted(async () => {
  // 加载分类树
  const res = await getCategoryTree()
  if (res.code === 200) {
    categoryOptions.value = res.data
  }
})
// 【新增】专门处理 SPU 主图上传的方法
const handleSpuUpload = async (options) => {
  const file = options.file
  try {
    const res = await uploadFile(file)
    if (res.code === 200) {
      // 核心：把返回的 URL 赋值给 form.spuImg
      form.spuImg = res.data
      ElMessage.success('主图上传成功')
    } else {
      ElMessage.error('上传失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('上传出错')
  }
}
// 自定义上传逻辑
const handleUpload = async (options, skuIndex) => {
  const file = options.file
  try {
    const res = await uploadFile(file)
    if (res.code === 200) {
      // 上传成功，回显图片 URL 到对应的 SKU 数据中
      // 注意：后端返回的是 res.data (字符串URL)
      form.skus[skuIndex].images[0] = res.data
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error('上传失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('上传出错')
  }
}

// 上传前校验 (可选：限制大小和格式)
const beforeAvatarUpload = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error('图片必须是 JPG 或 PNG 格式!')
    return false
  } else if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}
// 分类选择回调
const handleCategoryChange = (val) => {
  if (val && val.length > 0) {
    // 取最后一级作为 categoryId
    form.categoryId = val[val.length - 1]
  }
}

// 添加 SKU 行
const addSkuRow = () => {
  form.skus.push({ 
    skuName: '', price: '', stock: '', 
    color: '', memory: '', 
    images: [''], 
    saleAttrs: [] 
  })
}

// 删除 SKU 行
const removeSkuRow = (index) => {
  form.skus.splice(index, 1)
}

// 提交
const submitForm = async () => {
  if (!form.spuName || !form.categoryId) {
    return ElMessage.warning('请填写完整的SPU名称和分类')
  }

  submitting.value = true
  try {
    // 1. 数据清洗：把 color/memory 转成 saleAttrs 列表
    // 后端需要的是: saleAttrs: [{attrName:'颜色', attrValue:'红'}, ...]
    const finalSkus = form.skus.map(sku => {
      const attrs = []
      if(sku.color) attrs.push({ attrName: '颜色', attrValue: sku.color })
      if(sku.memory) attrs.push({ attrName: '内存', attrValue: sku.memory })
      
      return {
        skuName: sku.skuName,
        price: sku.price,
        stock: sku.stock,
        images: sku.images,
        saleAttrs: attrs,
        // 如果没填默认图，就用第一张
        defaultImg: sku.images[0] || ''
      }
    })

    // 2. 组装最终 DTO
    const postData = {
      ...form,
      skus: finalSkus
    }

    // 3. 发送请求
    const res = await saveGoods(postData)
    if (res.code === 200) {
      ElMessage.success('商品发布成功！')
      // 跳转回首页或其他地方
      setTimeout(() => router.push('/'), 1000)
    }
  } catch (err) {
    console.error(err)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.publish-container {
  padding: 40px;
  background: #f0f2f5;
  min-height: 100vh;
}
.form-card {
  max-width: 900px;
  margin: 0 auto;
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}
.card-header h2 { margin: 0 0 5px 0; color: #303133; }
.subtitle { color: #909399; font-size: 13px; }

.section-title {
  margin-top: 30px;
  margin-bottom: 20px;
  border-left: 4px solid #ff4d4f;
  padding-left: 10px;
  font-size: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sku-card {
  background: #f8f9fa;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 15px;
}
.sku-header {
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
}
.attr-row {
  margin-top: 10px;
  display: flex;
  align-items: center;
}
.form-footer {
  margin-top: 40px;
  text-align: center;
}
.avatar-uploader {
  display: inline-block;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 60px;
  height: 60px;
  line-height: 60px;
  text-align: center;
  margin-left: 10px;
}
.avatar-uploader:hover {
  border-color: #409EFF;
}
.sku-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.avatar-uploader-icon {
  font-size: 20px;
  color: #8c939d;
}
</style>
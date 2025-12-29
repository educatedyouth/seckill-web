<template>
  <div class="product-manager">
    <div class="header-actions">
      <h2>📦 商品管理</h2>
      <el-button type="primary" @click="$router.push('/publish')">发布新商品</el-button>
    </div>

    <el-card>
      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="180" />
        <el-table-column label="商品图" width="100">
          <template #default="scope">
            <img :src="scope.row.spuImg" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px"/>
          </template>
        </el-table-column>
        <el-table-column prop="spuName" label="商品名称" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.publishStatus === 1 ? 'success' : 'info'">
              {{ scope.row.publishStatus === 1 ? '上架中' : '已下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            
            <el-button 
              size="small" 
              :type="scope.row.publishStatus === 1 ? 'warning' : 'success'"
              @click="handleStatus(scope.row)"
            >
              {{ scope.row.publishStatus === 1 ? '下架' : '上架' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination 
          layout="prev, pager, next" 
          :total="total" 
          :page-size="10"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request' // 直接使用 request，也可以封装到 api/goods.js
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

onMounted(() => loadData(1))

const loadData = async (page = 1) => {
  loading.value = true
  try {
    const res = await request.get('/goods/my-list', { params: { page, size: 10 } })
    if (res.code === 200) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleEdit = (row) => {
  // 跳转到发布页，并带上 id 参数
  router.push(`/publish?id=${row.id}`)
}

const handleStatus = async (row) => {
  const newStatus = row.publishStatus === 1 ? 0 : 1
  try {
    const res = await request.post(`/goods/status/${row.id}/${newStatus}`)
    if (res.code === 200) {
      ElMessage.success('操作成功')
      row.publishStatus = newStatus // 本地直接更新状态，不刷页面
    }
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped>
.product-manager { padding: 20px; max-width: 1200px; margin: 0 auto; }
.header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.pagination { margin-top: 20px; display: flex; justify-content: center; }
</style>
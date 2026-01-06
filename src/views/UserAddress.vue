<template>
  <div class="address-page">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>📍 我的收货地址</span>
          <el-button type="primary" size="small" @click="openDialog('add')">新增地址</el-button>
        </div>
      </template>

      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="receiverName" label="收货人" width="120" />
        <el-table-column prop="receiverPhone" label="手机号" width="140" />
        <el-table-column label="所在地区" width="180">
          <template #default="scope">
            {{ scope.row.province }} {{ scope.row.city }} {{ scope.row.area }}
          </template>
        </el-table-column>
        <el-table-column prop="detailAddr" label="详细地址" />
        
        <el-table-column label="标签" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.label" size="small" :type="getLabelType(scope.row.label)">
              {{ scope.row.label }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="默认" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.isDefault === 1" type="danger" size="small">默认</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="openDialog('edit', scope.row)">编辑</el-button>
            <el-popconfirm title="确定删除吗？" @confirm="handleDelete(scope.row.id)">
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="收货人">
          <el-input v-model="form.receiverName" placeholder="请填写收货人姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.receiverPhone" placeholder="请填写11位手机号" />
        </el-form-item>
        <el-form-item label="地区">
           <el-row :gutter="10">
             <el-col :span="8"><el-input v-model="form.province" placeholder="省" /></el-col>
             <el-col :span="8"><el-input v-model="form.city" placeholder="市" /></el-col>
             <el-col :span="8"><el-input v-model="form.area" placeholder="区/县" /></el-col>
           </el-row>
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="form.detailAddr" type="textarea" placeholder="街道门牌信息" />
        </el-form-item>
        
        <el-form-item label="标签">
          <el-radio-group v-model="form.label">
            <el-radio-button label="家" />
            <el-radio-button label="公司" />
            <el-radio-button label="学校" />
          </el-radio-group>
        </el-form-item>
        
        <el-form-item>
           <el-checkbox v-model="form.isDefault" :true-label="1" :false-label="0">设为默认地址</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { getAddressList, addAddress, updateAddress, deleteAddress } from '../api/user'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const dialogMode = ref('add')
const dialogTitle = ref('新增地址')

// 表单对象 (完全对应后端 UserAddr 字段 + label)
const form = reactive({
  id: null,
  receiverName: '', // 对应 receiverName
  receiverPhone: '', // 对应 receiverPhone
  province: '',
  city: '',
  area: '',         // 对应 area
  detailAddr: '',
  label: '家',      // 对应 label
  isDefault: 0
})

onMounted(() => loadData())

const loadData = async () => {
  loading.value = true
  try {
    const res = await getAddressList()
    if (res.code === 200) tableData.value = res.data
  } finally {
    loading.value = false
  }
}

const openDialog = (mode, row) => {
  dialogMode.value = mode
  dialogTitle.value = mode === 'add' ? '新增地址' : '编辑地址'
  dialogVisible.value = true
  
  if (mode === 'edit' && row) {
    // 编辑回显
    Object.assign(form, row)
  } else {
    // 新增重置
    form.id = null
    form.receiverName = ''
    form.receiverPhone = ''
    form.detailAddr = ''
    form.province = ''
    form.city = ''
    form.area = ''
    form.label = '家'
    form.isDefault = 0
  }
}

const handleSubmit = async () => {
  try {
    let res
    if (dialogMode.value === 'add') {
      res = await addAddress(form)
    } else {
      res = await updateAddress(form)
    }
    
    if (res.code === 200) {
      ElMessage.success('操作成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {
    console.error(e)
  }
}

const handleDelete = async (id) => {
  const res = await deleteAddress(id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    loadData()
  } else {
    ElMessage.error(res.message)
  }
}

const getLabelType = (label) => {
  if (label === '家') return 'success'
  if (label === '公司') return 'warning'
  if (label === '学校') return ''
  return 'info'
}
</script>

<style scoped>
.address-page { padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
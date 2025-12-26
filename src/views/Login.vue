<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <span>商城系统登录 (修复版)</span>
        </div>
      </template>
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名/手机号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleLogin" style="width: 100%">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useUserStore } from '../store/user'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const router = useRouter()
const loading = ref(false)

// 2. 修改响应式对象的 key
const form = reactive({
  username: '', // ✅ 修正：与后端 LoginVo 保持一致
  password: ''
})

const handleLogin = async () => {
  // 3. 修改校验逻辑
  if (!form.username || !form.password) {
    ElMessage.warning('请输入账号密码')
    return
  }
  loading.value = true
  // 发送给 store 的也是包含 username 的对象
  const success = await userStore.login(form)
  loading.value = false
  
  if (success) {
    ElMessage.success('登录成功')
    router.push('/')
  }
}
</script>
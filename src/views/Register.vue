<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <div class="card-header">
          <span>新用户注册</span>
          <el-button link type="primary" @click="$router.push('/login')" style="float: right">
            已有账号？去登录
          </el-button>
        </div>
      </template>
      
      <el-form :model="form" label-width="80px" :rules="rules" ref="registerFormRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="form.mobile" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="设置密码" show-password />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleRegister" style="width: 100%">
            立即注册
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { registerApi } from '../api/auth' 
import { ElMessage } from 'element-plus'

const router = useRouter()
const registerFormRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  mobile: '',
  password: '',
  confirmPassword: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  mobile: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== form.password) callback(new Error('两次输入密码不一致'))
        else callback()
      }, 
      trigger: 'blur' 
    }
  ]
}

const handleRegister = async () => {
  // 1. 强制打印日志，证明按钮活了
  console.log('🔘 按钮点击生效') 

  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid, fields) => {
    if (valid) {
      loading.value = true
      try {
        const sendData = {
          username: form.username,
          password: form.password,
          phone: form.mobile
        }
        await registerApi(sendData)
        ElMessage.success('注册成功！正在跳转...')
        setTimeout(() => { router.push('/login') }, 1000)
      } catch (error) {
        console.error(error)
      } finally {
        loading.value = false
      }
    } else {
      // 🔥🔥🔥 加上这句，你就知道为什么没反应了！
      console.warn('❌ 校验失败:', fields)
      ElMessage.warning('请检查输入项：有未填项或密码不一致！')
    }
  })
}
</script>

<style scoped>
.register-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
}
.register-card {
  width: 450px;
}
.card-header {
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
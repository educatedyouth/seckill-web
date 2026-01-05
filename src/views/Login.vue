<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo">⚡</div>
        <h2>Seckill Mall</h2>
        <p>企业级高并发秒杀系统</p>
      </div>
      
      <el-form :model="form" size="large" class="login-form">
        <el-form-item>
          <el-input 
            v-model="form.username" 
            placeholder="请输入用户名" 
            :prefix-icon="User"
            class="glass-input"
          />
        </el-form-item>
        <el-form-item>
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码" 
            :prefix-icon="Lock"
            show-password
            class="glass-input"
          />
        </el-form-item>
        <el-button type="primary" :loading="loading" @click="handleLogin" class="login-btn">
          立即登录
        </el-button>
        
        <div class="login-footer">
          <router-link to="/register">注册账号</router-link>
          <span>|</span>
          <a href="#">忘记密码?</a>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useUserStore } from '../store/user'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue' // 需安装图标库
import { useCartStore } from '../store/cart'
const cartStore = useCartStore()
const userStore = useUserStore()
const router = useRouter()
const loading = ref(false)

const form = reactive({ username: '', password: '' })

const handleLogin = async () => {
  if (!form.username || !form.password) return ElMessage.warning('请输入账号密码')
  loading.value = true
  const success = await userStore.login(form)
  loading.value = false
  if (success) {
    // 登录成功后，立即尝试合并离线购物车
    await cartStore.mergeLocalCart()
    ElMessage.success('欢迎回来')
    router.push('/')
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-box {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px); /* 核心：磨砂效果 */
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  text-align: center;
  color: white;
}

.logo {
  font-size: 48px;
  margin-bottom: 10px;
}

.login-header h2 { margin: 10px 0; letter-spacing: 1px; }
.login-header p { color: rgba(255, 255, 255, 0.8); margin-bottom: 30px; font-size: 14px; }

/* 深度选择器修改 Element 样式以适应透明背景 */
:deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.2) !important;
  box-shadow: none !important;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}
:deep(.el-input__inner) { color: white !important; }
:deep(.el-input__inner::placeholder) { color: rgba(255, 255, 255, 0.7); }

.login-btn {
  width: 100%;
  background: linear-gradient(90deg, #ff4d4f, #f5222d);
  border: none;
  font-weight: bold;
  letter-spacing: 2px;
  margin-top: 20px;
}
.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 34, 45, 0.5);
}

.login-footer {
  margin-top: 20px;
  font-size: 12px;
}
.login-footer a { color: rgba(255, 255, 255, 0.8); text-decoration: none; margin: 0 10px; }
.login-footer a:hover { color: white; }
</style>
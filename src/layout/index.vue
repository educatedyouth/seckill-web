<template>
  <div class="app-layout">
    <header class="mall-header">
      <div class="header-content">
        <div class="logo" @click="$router.push('/')">
          <span class="logo-icon">⚡</span>
          <span class="logo-text">极速秒杀</span>
        </div>

        <div class="search-bar">
          <el-input
            v-model="keyword"
            placeholder="搜索您想要的商品（如：iPhone 15）"
            class="search-input"
          >
            <template #append>
              <el-button @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </div>

        <div class="user-actions">
          <template v-if="userStore.token">
            <span class="user-name">欢迎, 用户{{ userStore.userId }}</span>
            <el-button type="text" @click="handleLogout">退出</el-button>
          </template>
          <template v-else>
            <el-button type="text" @click="$router.push('/login')">登录</el-button>
            <el-button type="text" @click="$router.push('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </header>

    <main class="mall-main">
      <router-view></router-view>
    </main>

    <footer class="mall-footer">
      <p>© 2025 Seckill Cloud | 首席架构师监制</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '../store/user'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const keyword = ref('')
const userStore = useUserStore()
const router = useRouter()

const handleSearch = () => {
  if (!keyword.value) return
  ElMessage.info(`正在搜索: ${keyword.value} (后端接口待对接)`)
}

const handleLogout = async () => {
  // 调用 store 的 logout (包含后端请求 + 前端清除)
  await userStore.logout()
  
  ElMessage.success('已安全退出')
  
  // 刷新页面或跳转到登录页，确保路由守卫生效
  // router.push('/login') // 或者用 reload
  setTimeout(() => {
    location.reload() // 刷新页面是最彻底的重置
  }, 500)
}
</script>

<style scoped>
.mall-header {
  height: 64px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 999;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: bold;
  color: #ff4d4f; /* 秒杀红 */
}
.logo-icon { margin-right: 8px; }

.search-bar { width: 400px; }

.mall-main {
  min-height: calc(100vh - 64px - 60px);
  background: #f5f7fa;
  padding-top: 20px;
}

.mall-footer {
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
  background: #333;
}
</style>
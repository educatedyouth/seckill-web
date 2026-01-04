<template>
  <div class="app-wrapper">
    <nav class="top-nav">
      <div class="container nav-content">
        <div class="nav-left">
          <span class="slogan">极速秒杀 - 企业级高并发电商演示平台</span>
        </div>
        <div class="nav-right">
          <template v-if="userStore.token">
            <el-dropdown trigger="click" @command="handleCommand">
              <span class="user-link">
                <el-avatar :size="24" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="user-avatar"/>
                <span class="username">用户 {{ userStore.userId }}</span>
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="productManager">📦 商品管理</el-dropdown-item>
                  <el-dropdown-item command="order">我的订单</el-dropdown-item>
                  <el-dropdown-item command="address">收货地址</el-dropdown-item>
                  <el-dropdown-item divided command="logout" style="color: #ff4d4f">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <span class="divider">|</span>
            <span class="nav-item" @click="$router.push('/order/list')">我的订单</span>
          </template>
          <template v-else>
            <router-link to="/login" class="nav-item highlight">亲，请登录</router-link>
            <router-link to="/register" class="nav-item">免费注册</router-link>
          </template>
          <span class="divider">|</span>
          <span class="nav-item">关于我们</span>
        </div>
      </div>
    </nav>

    <header class="main-header" :class="{ 'fixed-header': isFixed }">
      <div class="container header-inner">
        <div class="logo-area" @click="$router.push('/')">
          <div class="logo-box">
            <span class="logo-icon">⚡</span>
          </div>
          <div class="logo-text">
            <h1>Seckill Mall</h1>
            <span class="sub-text">极速秒杀</span>
          </div>
        </div>
        <div class="search-area">
          <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索好物 快人一步"
            class="input-with-select"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
        </div>
          <div class="hot-words">
            <span>iPhone 15</span>
            <span>RTX 4090</span>
            <span>华为 Mate 60</span>
          </div>
        </div>

        <div class="cart-area">
          <el-button 
            type="success" 
            round 
            size="large" 
            style="margin-right: 15px"
            @click="$router.push('/publish')"
            v-if="userStore.token"
          >
            <el-icon style="margin-right: 5px"><Upload /></el-icon>
            发布商品
          </el-button>

          <el-badge 
            :value="cartStore.cartTotalCount" 
            :max="99" 
            :hidden="cartStore.cartTotalCount === 0" 
            class="item"
          >
            <el-button round size="large" @click="$router.push('/cart')">
              <el-icon style="margin-right: 5px"><ShoppingCart /></el-icon>
              我的购物车
            </el-button>
          </el-badge>
        </div>
      </div>
    </header>

    <main class="app-main">
      <div class="container">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <footer class="app-footer">
      <div class="container">
        <div class="footer-links">
          <div class="link-group">
            <h4>关于我们</h4>
            <a href="#">架构设计</a>
            <a href="#">开发团队</a>
          </div>
          <div class="link-group">
            <h4>技术支持</h4>
            <a href="#">Spring Cloud</a>
            <a href="#">Vue 3.0</a>
          </div>
          <div class="link-group">
            <h4>联系方式</h4>
            <p>Email: admin@seckill.com</p>
          </div>
        </div>
        <div class="copyright">
          <p>© 2025 Seckill Cloud Architecture. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '../store/user'
// 1. 引入 Cart Store
import { useCartStore } from '../store/cart'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown, ShoppingCart, Upload, Search } from '@element-plus/icons-vue'

const keyword = ref('')
const searchKeyword = ref('')
const userStore = useUserStore()
// 2. 初始化 Cart Store
const cartStore = useCartStore()
const router = useRouter()
const isFixed = ref(false)

// 监听滚动实现吸顶效果
const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  isFixed.value = scrollTop > 100
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  // 3. 页面加载时，如果已登录，立即拉取购物车数据以显示小红点
  if (userStore.token) {
    cartStore.fetchCartList()
  }
})

onUnmounted(() => window.removeEventListener('scroll', handleScroll))

// 搜索跳转逻辑
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    return
  }
  router.push({ 
    path: '/search', 
    query: { keyword: searchKeyword.value } 
  })
}

// 下拉菜单指令处理
const handleCommand = async (command) => {
  if (command === 'logout') {
    await userStore.logout()
    // 4. 退出登录时重置购物车状态
    cartStore.$reset()
    ElMessage.success('已安全退出')
    setTimeout(() => location.reload(), 500)
  } else if (command === 'address') {
    router.push('/user/address')
  } else if (command === 'productManager') {
    router.push('/product/manager')
  } else if (command === 'order') {
    router.push('/order/list')
  } else {
    ElMessage.info('功能开发中...')
  }
}
</script>

<style scoped>
/* 保持你原有的样式不变 */
/* --- Top Navigation --- */
.top-nav {
  height: 32px;
  background: #333;
  color: #ccc;
  font-size: 12px;
  line-height: 32px;
}
.nav-content { display: flex; justify-content: space-between; }
.nav-right { display: flex; align-items: center; }
.nav-item { margin: 0 10px; cursor: pointer; }
.nav-item.highlight { color: var(--mall-brand-color); }
.nav-item:hover { color: white; }
.divider { color: #555; margin: 0 5px; }
.user-link { display: flex; align-items: center; cursor: pointer; color: #fff; }
.user-avatar { margin-right: 6px; }
.username { margin-right: 4px; }

/* --- Main Header --- */
.main-header {
  background: #fff;
  height: 100px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
  transition: all 0.3s;
  z-index: 999;
}
.fixed-header {
  position: fixed;
  top: 0;
  width: 100%;
  height: 70px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}

.header-inner { display: flex; align-items: center; justify-content: space-between; height: 100%; width: 100%; }

/* Logo */
.logo-area { display: flex; align-items: center; cursor: pointer; }
.logo-box {
  width: 44px; height: 44px;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  border-radius: 12px;
  display: flex; justify-content: center; align-items: center;
  color: white; font-size: 24px; margin-right: 12px;
  box-shadow: 0 4px 10px rgba(255, 77, 79, 0.3);
}
.logo-text h1 { margin: 0; font-size: 22px; color: #333; line-height: 1.2; }
.sub-text { font-size: 12px; color: #999; letter-spacing: 1px; }

/* Search Bar */
.search-area { flex: 1; max-width: 600px; margin: 0 40px; }
.search-box { display: flex; border: 2px solid var(--mall-brand-color); border-radius: 24px; overflow: hidden; height: 40px; }
.search-box input {
  flex: 1; border: none; padding: 0 20px; outline: none; font-size: 14px;
}
.search-box button {
  width: 90px; border: none; background: var(--mall-brand-color); color: white;
  font-weight: bold; cursor: pointer; font-size: 16px; transition: background 0.2s;
}
.search-box button:hover { background: #ff2a2d; }
.hot-words { margin-top: 6px; font-size: 12px; color: #999; padding-left: 10px; }
.hot-words span { margin-right: 15px; cursor: pointer; }
.hot-words span:hover { color: var(--mall-brand-color); }

/* --- Cart Area --- */
.cart-area { display: flex; align-items: center; }

/* --- Main Content --- */
.app-main {
  min-height: calc(100vh - 300px);
  padding: 20px 0;
  margin-top: 0; 
}

/* --- Footer --- */
.app-footer { background: #2e3033; color: #fff; padding: 50px 0 20px; margin-top: 40px; }
.footer-links { display: flex; justify-content: space-around; padding-bottom: 40px; border-bottom: 1px solid #444; }
.link-group h4 { margin-bottom: 20px; font-size: 16px; }
.link-group a { display: block; color: #999; margin-bottom: 10px; font-size: 13px; }
.link-group a:hover { color: #fff; }
.copyright { text-align: center; padding-top: 20px; color: #666; font-size: 12px; }

/* --- Transition --- */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}
.fade-transform-enter-from { opacity: 0; transform: translateX(-20px); }
.fade-transform-leave-to { opacity: 0; transform: translateX(20px); }
</style>
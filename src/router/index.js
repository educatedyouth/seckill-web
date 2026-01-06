import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../layout/index.vue'
import Cart from '../views/Cart.vue'
// 引入新页面
import OrderConfirm from '../views/OrderConfirm.vue'
const routes = [
  // 1. 业务路由组：套用 Layout 布局 (有顶栏和底栏)
  {
    path: '/',
    component: Layout,
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('../views/Home.vue')
      },
      {
        path: 'goods/:id',
        name: 'GoodsDetail',
        component: () => import('../views/GoodsDetail.vue'),
        meta: { title: '商品详情' }
      },
      // 【新增】用户地址管理
      {
        path: 'user/address',
        name: 'UserAddress',
        component: () => import('../views/UserAddress.vue'), // 稍后创建
        meta: { title: '收货地址' }
      },
      // 【新增】商品管理列表页 (放在 Layout 里，这就有了头部和底部)
      {
        path: 'product/manager',
        name: 'ProductManager',
        component: () => import('../views/ProductManager.vue'),
        meta: { title: '商品管理' }
      },
      // 【新增】搜索结果页
      {
          path: '/search',
          name: 'Search',
          component: () => import('../views/SearchResult.vue'),
          meta: { title: '搜索结果' }
      },
      {
          path: '/cart',
          name: 'Cart',
          component: Cart,
          meta: { requiresAuth: true } // 暂时强制登录
      },
      // 【新增】订单确认页
      {
          path: '/order/confirm',
          name: 'OrderConfirm',
          component: OrderConfirm,
          meta: { requiresAuth: true, title: '确认订单' }
      }
    ]
  },
  
  // 2. 独立路由组：全屏显示
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  // 【修改】发布页独立，不再套用通用 Layout，解决“购物车栏目丑陋”的问题
  {
    path: '/publish',
    name: 'Publish',
    component: () => import('../views/GoodsPublish.vue') 
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
import { createRouter, createWebHistory } from 'vue-router'
// 引入刚刚写的 Layout
import Layout from '../layout/index.vue'

const routes = [
  // 1. 业务路由组：套用 Layout 布局
  {
    path: '/',
    component: Layout,
    redirect: '/home',
    children: [
      {
        path: 'home', // 访问 /home
        name: 'Home',
        component: () => import('../views/Home.vue')
      }
      // 未来还要加：商品详情页、订单结算页...
    ]
  },
  
  // 2. 独立路由组：全屏显示，不套 Layout
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  // 确保这一段存在，且路径没有拼写错误
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue') // 👈 必须对应文件名，大小写敏感！
  },
  {
    path: '/publish',
    name: 'Publish',
    // 这里为了复用 Layout 的 Header（显示登录头像），我们建议把它套在 Layout 里
    // 如果你想全屏显示，可以不套。这里我们选择套 Layout 体验更好。
    component: () => import('../layout/index.vue'), 
    children: [
      {
        path: '', // 默认子路由，访问 /publish 即可
        component: () => import('../views/GoodsPublish.vue')
      }
    ]
  },
]


const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
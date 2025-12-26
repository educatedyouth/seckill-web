import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import 'nprogress/nprogress.css' // 引入进度条样式

// 引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 引入 Pinia
import { createPinia } from 'pinia'

// 引入 路由 (稍后创建)
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
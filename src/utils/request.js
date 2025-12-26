import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' }
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 1. 【核心】发布商品报“无Token”就是因为这里没读到
    // 务必确保 key 名与 store 中存储的一致 ('seckill-token')
    const token = localStorage.getItem('seckill-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 2. 【核心】不要直接返回 response.data.data！
    // 必须返回完整的 response.data，否则外层无法判断 code === 200
    const res = response.data
    
    if (res.code !== 200) {
      ElMessage.error(res.msg || '系统繁忙')
      return Promise.reject(new Error(res.msg || 'Error'))
    }
    return res
  },
  (error) => {
    // 处理 401 等错误
    const msg = error.response?.data?.msg || '请求失败'
    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

export default service
import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '../utils/request'
import { logoutApi } from '../api/auth' // 记得导入

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('seckill-token') || '')
  const userId = ref(localStorage.getItem('seckill-uid') || '')

  const login = async (loginForm) => {
    try {
      // 直接调用 request，不需要 api 层转接了，省事
      const data = await request.post('/auth/login', loginForm)
      
      token.value = data.token
      userId.value = data.userId
      
      localStorage.setItem('seckill-token', data.token)
      localStorage.setItem('seckill-uid', data.userId)
      
      return true
    } catch (error) {
      console.error('登录失败', error)
      return false
    }
  }
  const logout = async () => {
    try {
      // 1. 先调用后端接口 (不管成功失败，前端都要清数据)
      await logoutApi()
    } catch (error) {
      console.warn('后端退出接口调用失败，但这不影响前端清除', error)
    } finally {
      // 2. 清除前端状态
      token.value = ''
      userId.value = ''
      localStorage.removeItem('seckill-token')
      localStorage.removeItem('seckill-uid')
    }
  }

  return { token, userId, login, logout}
})
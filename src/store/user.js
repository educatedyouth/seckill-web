import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginApi, logoutApi } from '../api/auth'

export const useUserStore = defineStore('user', () => {
  // 初始化时尝试从本地读取，防止刷新丢失
  const token = ref(localStorage.getItem('seckill-token') || '')
  const userId = ref(localStorage.getItem('seckill-user-id') || '')
  const username = ref(localStorage.getItem('seckill-username') || '')

  const login = async (loginForm) => {
    try {
      const res = await loginApi(loginForm)
      // 注意：这里配合 request.js 的修改，res 包含了 code 和 data
      if (res.code === 200) {
        const data = res.data // 这里的 data 就是后端返回的 Map
        
        // 1. 更新内存状态
        token.value = data.token
        userId.value = data.userId
        username.value = data.username // 修复 undefined 问题
        
        // 2. 【核心】持久化到 LocalStorage (发布商品时 request.js 会从这里取)
        localStorage.setItem('seckill-token', data.token)
        localStorage.setItem('seckill-user-id', data.userId)
        localStorage.setItem('seckill-username', data.username)
        
        return true
      }
      return false
    } catch (error) {
      console.error('登录失败', error)
      return false
    }
  }

  const logout = async () => {
    try {
      await logoutApi()
    } finally {
      // 清除所有状态
      token.value = ''
      userId.value = ''
      username.value = ''
      localStorage.clear() // 暴力清除所有，或者逐个 removeItem
    }
  }

  return {
    token,
    userId,
    username,
    login,
    logout
  }
})
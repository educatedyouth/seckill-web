import { defineStore } from 'pinia'
import cartApi from '../api/cart'
import { ElMessage } from 'element-plus'

export const useCartStore = defineStore('cart', {
  state: () => ({
    cartList: [], // 购物车列表
    selectedItems: [] // 用户勾选的商品
  }),
  
  getters: {
    // 计算选中商品的总价
    totalPrice: (state) => {
      return state.selectedItems.reduce((total, item) => {
        return total + (item.price * item.count)
      }, 0).toFixed(2)
    },
    // 计算选中商品的总数量
    totalCount: (state) => {
        return state.selectedItems.reduce((total, item) => total + item.count, 0)
    },
    // 【新增】计算购物车内所有商品的总数量（用于 Layout 小红点）
    cartTotalCount: (state) => {
      return state.cartList.reduce((total, item) => total + item.count, 0)
    }
  },

  actions: {
    // 【新增】删除商品
    async deleteCartItem(skuId) {
      try {
        const res = await cartApi.deleteCartItem(skuId)
        if (res.code === 200) {
          ElMessage.success('删除成功')
          // 删除后重新拉取列表，更新视图和小红点
          await this.fetchCartList()
        } else {
          ElMessage.error(res.message || '删除失败')
        }
      } catch (error) {
        console.error(error)
        ElMessage.error('网络异常')
      }
    },
    // 获取购物车列表
    async fetchCartList() {
      try {
        const res = await cartApi.getCartList()
        if (res.code === 200) {
          this.cartList = res.data
        }
      } catch (error) {
        console.error("获取购物车失败", error)
      }
    },

    // 添加到购物车
    async addToCart(skuId, count) {
      try {
        const res = await cartApi.addToCart(skuId, count)
        if (res.code === 200) {
          ElMessage.success('加入购物车成功')
          // 刷新列表
          await this.fetchCartList() 
        } else {
          ElMessage.error(res.message || '加入失败')
        }
      } catch (error) {
        console.error(error)
        ElMessage.error('网络异常')
      }
    },

    // 更新选中状态（供组件调用）
    updateSelectedItems(items) {
      this.selectedItems = items
    }
  }
})
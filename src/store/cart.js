import { defineStore } from 'pinia'
import cartApi from '../api/cart'
import { useUserStore } from './user'
import { ElMessage } from 'element-plus'

const LOCAL_CART_KEY = 'SECKILL_OFFLINE_CART'

export const useCartStore = defineStore('cart', {
  state: () => ({
    cartList: [],      // 当前展示的购物车列表（可能是在线，也可能是离线）
    selectedItems: []  // 选中的商品
  }),

  getters: {
    totalPrice: (state) => {
      return state.selectedItems.reduce((total, item) => {
        return total + (item.price * item.count)
      }, 0).toFixed(2)
    },
    cartTotalCount: (state) => {
      return state.cartList.reduce((total, item) => total + item.count, 0)
    }
  },

  actions: {
    // === 核心动作：加载列表 ===
    async fetchCartList() {
      const userStore = useUserStore()
      if (userStore.token) {
        // 1. 已登录：查后端
        try {
          const res = await cartApi.getCartList()
          if (res.code === 200) {
            this.cartList = res.data
          }
        } catch (error) {
          console.error("获取在线购物车失败", error)
        }
      } else {
        // 2. 未登录：查本地 localStorage
        const localData = localStorage.getItem(LOCAL_CART_KEY)
        this.cartList = localData ? JSON.parse(localData) : []
      }
    },

    // === 核心动作：添加购物车 ===
    async addToCart(skuId, count) {
      const userStore = useUserStore()
      
      if (userStore.token) {
        // A. 已登录模式 -> 调接口
        try {
          const res = await cartApi.addToCart(skuId, count)
          if (res.code === 200) {
            ElMessage.success('加入购物车成功')
            await this.fetchCartList()
          } else {
            ElMessage.error(res.message || '加入失败')
          }
        } catch (error) {
          ElMessage.error(error.message || '网络异常')
        }
      } else {
        // B. 离线模式 -> 存本地
        // 注意：这里为了简化，我们暂时没有去后端查商品详情（图片/价格）。
        // 实际生产中，离线加购也需要调后端查详情，但不调 /cart/add。
        // 为了演示闭环，我们假设调用者（详情页）传来了必要的展示信息，或者我们仅存 ID，展示时再查。
        // *本阶段简化方案*：详情页调用时，我们只存 skuId 和 count，列表页展示可能会缺图。
        // *更优方案*：在详情页把商品信息传进来。但为了不改详情页代码，我们这里模拟一个存入。
        
        // 读取本地
        let localList = JSON.parse(localStorage.getItem(LOCAL_CART_KEY) || '[]')
        const existingItem = localList.find(item => item.skuId === skuId)
        
        if (existingItem) {
          existingItem.count += count
        } else {
          // ⚠️ 离线状态下，为了列表页能显示，我们需要详情页传更多信息。
          // 但由于接口限制，我们暂时只存 skuId, count。
          // 列表页看到的信息会不全，但这符合“未登录”的降级体验。
          // 真正合并后就全了。
          localList.push({ skuId, count, price: 0, title: '离线商品(登录后查看详情)', image: '' })
        }
        
        localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(localList))
        this.cartList = localList // 更新视图
        ElMessage.success('加入临时购物车成功')
      }
    },

    // === 核心动作：删除商品 ===
    async deleteCartItem(skuId) {
      const userStore = useUserStore()
      if (userStore.token) {
        // 在线删除
        const res = await cartApi.deleteCartItem(skuId)
        if (res.code === 200) {
          ElMessage.success('删除成功')
          await this.fetchCartList()
        }
      } else {
        // 离线删除
        let localList = this.cartList.filter(item => item.skuId !== skuId)
        localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(localList))
        this.cartList = localList
        ElMessage.success('删除成功')
      }
    },

    // === 核心动作：合并购物车 (登录后触发) ===
    async mergeLocalCart() {
      const localData = localStorage.getItem(LOCAL_CART_KEY)
      if (!localData) return // 本地没数据，不用合并

      const list = JSON.parse(localData)
      if (list.length === 0) return

      try {
        // 构造后端需要的参数 List<CartItem>
        // 注意：后端只关心 skuId 和 count
        const res = await cartApi.mergeCart(list)
        if (res.code === 200) {
          console.log('购物车合并成功')
          // 清空本地
          localStorage.removeItem(LOCAL_CART_KEY)
          // 刷新在线列表
          await this.fetchCartList()
        }
      } catch (error) {
        console.error('购物车合并失败', error)
      }
    },

    updateSelectedItems(items) {
      this.selectedItems = items
    },
    
    // 重置状态
    $reset() {
      this.cartList = []
      this.selectedItems = []
    }
  }
})
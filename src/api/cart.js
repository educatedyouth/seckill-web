import request from '../utils/request'

export default {
  // 【新增】删除购物车商品
  deleteCartItem(skuId) {
    return request({
      url: '/cart/delete',
      method: 'post',
      params: { skuId }
    })
  },
  // 添加购物车
  addToCart(skuId, count) {
    return request({
      url: '/cart/add',
      method: 'post',
      params: { skuId, count } // 注意：后端是用 @RequestParam 接收的
    })
  },

  // 获取购物车列表
  getCartList() {
    return request({
      url: '/cart/list',
      method: 'get'
    })
  },
  
  // (预留) 合并购物车
  mergeCart(cartList) {
    return request({
      url: '/cart/merge',
      method: 'post',
      data: cartList
    })
  }
}
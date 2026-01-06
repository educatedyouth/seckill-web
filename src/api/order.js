import request from '../utils/request'

// 创建订单
export function createOrder(data) {
  return request({
    url: '/order/create', // 你的后端接口地址
    method: 'post',
    data // 包含 addrId, payType, remark, skuIds
  })
}
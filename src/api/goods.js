import request from '../utils/request'

// 1. 获取分类树 (用于发布商品时选择分类)
export function getCategoryTree() {
  return request({
    url: '/category/list/tree',
    method: 'get'
  })
}

// 2. 发布商品 (提交复杂的 SPU+SKU 对象)
export function saveGoods(data) {
  return request({
    url: '/goods/save',
    method: 'post',
    data
  })
}

// 3. 获取商品详情 (用于后续详情页)
// 注意：这个接口虽然我们后端还没写(步骤2.3提到要写但可能没写全)，先预留在这里
export function getGoodsDetail(skuId) {
  return request({
    url: `/goods/detail/${skuId}`,
    method: 'get'
  })
}
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


// 获取商品详情 (聚合数据)
export function getGoodsDetail(spuId) {
  return request({
    url: `/goods/detail/${spuId}`,
    method: 'get'
  })
}

// 获取商品分页列表
export function getGoodsList(params) {
  return request({
    url: '/goods/list',
    method: 'get',
    params // 会自动序列化为 ?page=1&size=10
  })
}
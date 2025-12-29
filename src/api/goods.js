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
// 3. 修改商品 (更新) 【本次新增】
export function updateGoods(data) {
  return request({
    url: '/goods/update',
    method: 'put',
    data
  })
}
// 4. 获取商品详情 (回显) 【本次新增】
export function getGoodsDetail(spuId) {
  return request({
    url: `/goods/detail/${spuId}`,
    method: 'get'
  })
}

// 5. 获取我的商品列表 (管理页用) 【本次新增】
export function getMyGoodsList(params) {
  return request({
    url: '/goods/my-list',
    method: 'get',
    params
  })
}

// 6. 修改上下架状态 (管理页用) 【本次新增】
export function updateGoodsStatus(spuId, status) {
  return request({
    url: `/goods/status/${spuId}/${status}`,
    method: 'post'
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
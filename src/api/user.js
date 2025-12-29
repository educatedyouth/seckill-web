import request from '../utils/request'

// 获取地址列表
export function getAddressList() {
  return request({
    url: '/user/addr/list',
    method: 'get'
  })
}

// 新增地址
export function addAddress(data) {
  return request({
    url: '/user/addr/add',
    method: 'post',
    data
  })
}

// 修改地址
export function updateAddress(data) {
  return request({
    url: '/user/addr/update',
    method: 'put',
    data
  })
}

// 删除地址
export function deleteAddress(id) {
  return request({
    url: `/user/addr/delete/${id}`,
    method: 'delete'
  })
}
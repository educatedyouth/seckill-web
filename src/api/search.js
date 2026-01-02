import request from '../utils/request'

/**
 * 商品搜索接口
 * @param {Object} data 搜索参数 DTO
 * {
 * keyword: String,
 * brandId: Long,
 * categoryId: Long,
 * priceStart: Double,
 * priceEnd: Double,
 * sort: String, // price_asc, price_desc, sale_desc, new_desc
 * pageNum: Integer,
 * pageSize: Integer
 * }
 */
export function searchGoods(data) {
  return request({
    url: '/search/list',
    method: 'post',
    data
  })
}
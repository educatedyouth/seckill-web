import request from '../utils/request'

// 文件上传接口
export function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file) // 'file' 必须和后端 Controller 的 @RequestParam 一致

  return request({
    url: '/thirdparty/oss/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
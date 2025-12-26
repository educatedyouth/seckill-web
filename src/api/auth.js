import service from '../utils/request'

// 登录接口
export const loginApi = (data) => {
  return service.post('/auth/login', data)
}

// 【新增】注册接口
export const registerApi = (data) => {
  return service.post('/auth/register', data)
}

// 【新增】退出接口
export const logoutApi = () => {
  return service.post('/auth/logout')
}
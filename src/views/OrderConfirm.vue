<template>
  <div class="confirm-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>📝 填写并核对订单信息</span>
        </div>
      </template>

      <div class="section-title">收货人信息</div>
      <div class="address-list">
        <el-radio-group v-model="submitVo.addrId">
          <el-radio 
            v-for="addr in addressList" 
            :key="addr.id" 
            :label="addr.id" 
            border 
            class="addr-item"
          >
            {{ addr.receiverName }} {{ addr.receiverPhone }} ({{ addr.province }} {{ addr.city }} {{ addr.area }} {{ addr.detailAddr }})
          </el-radio>
        </el-radio-group>
        <div v-if="addressList.length === 0" class="no-addr">
          暂无收货地址，<el-button type="primary" link @click="$router.push('/user/address')">去添加</el-button>
        </div>
      </div>

      <div class="section-title">支付方式</div>
      <el-radio-group v-model="submitVo.payType">
        <el-radio :label="1" border>在线支付</el-radio>
        <el-radio :label="2" border>货到付款</el-radio>
      </el-radio-group>

      <div class="section-title">送货清单</div>
      <el-table :data="selectedGoods" style="width: 100%" border>
        <el-table-column label="商品图片" width="100">
          <template #default="scope">
            <img :src="scope.row.image" style="width: 60px; height: 60px" />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="商品名称" />
        <el-table-column prop="price" label="单价" width="120">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="count" label="数量" width="100" />
        <el-table-column label="小计" width="120">
          <template #default="{ row }">
            <span style="color: #e1251b; font-weight: bold">¥{{ (row.price * row.count).toFixed(2) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="section-title">订单备注</div>
      <el-input
        v-model="submitVo.remark"
        type="textarea"
        placeholder="限300字，请填写您的其他要求"
        maxlength="300"
        show-word-limit
      />

      <div class="footer-bar">
        <div class="price-info">
          <span class="label">应付总额：</span>
          <span class="total-price">¥{{ totalPrice }}</span>
        </div>
        <el-button type="danger" size="large" class="submit-btn" :loading="submitting" @click="handleSubmit">
          提交订单
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAddressList } from '../api/user'
import { createOrder } from '../api/order' // 需要新建 api/order.js
import { useCartStore } from '../store/cart'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const addressList = ref([])
const selectedGoods = ref([])
const submitting = ref(false)

// 提交给后端的 VO
const submitVo = reactive({
  addrId: null,
  payType: 1,
  remark: '',
  skuIds: [] // 对应后端新增的 skuIds
})

// 计算总价
const totalPrice = computed(() => {
  return selectedGoods.value.reduce((total, item) => total + item.price * item.count, 0).toFixed(2)
})

onMounted(async () => {
  // 1. 获取传递过来的 skuIds
  const skuIdsQuery = route.query.skuIds
  if (!skuIdsQuery) {
    ElMessage.error('参数异常，请重新从购物车发起结算')
    router.replace('/cart')
    return
  }
  
  const targetIds = JSON.parse(skuIdsQuery)
  submitVo.skuIds = targetIds

  // 2. 从 Store 中恢复选中的商品详情 (用于展示)
  // 如果用户刷新页面，Store 会丢失，这里是一个简单的处理。
  // 更严谨的做法是：拿 skuIds 调后端接口查最新的商品信息。
  // 但为了简化，我们先尝试从 Store 拿，拿不到就重新拉购物车列表再筛选。
  if (cartStore.cartList.length === 0) {
    await cartStore.fetchCartList()
  }
  selectedGoods.value = cartStore.cartList.filter(item => targetIds.includes(item.skuId))

  if (selectedGoods.value.length === 0) {
    ElMessage.error('未找到相关商品信息')
    router.replace('/cart')
    return
  }

  // 3. 加载收货地址
  loadAddress()
})

const loadAddress = async () => {
  try {
    const res = await getAddressList()
    if (res.code === 200) {
      addressList.value = res.data
      // 默认选中默认地址
      const defaultAddr = addressList.value.find(addr => addr.isDefault === 1)
      if (defaultAddr) {
        submitVo.addrId = defaultAddr.id
      } else if (addressList.value.length > 0) {
        submitVo.addrId = addressList.value[0].id
      }
    }
  } catch (error) {
    console.error(error)
  }
}

// 提交订单
const handleSubmit = async () => {
  if (!submitVo.addrId) {
    ElMessage.warning('请选择收货地址')
    return
  }

  submitting.value = true
  try {
    // 调用下单接口
    const res = await createOrder(submitVo)
    if (res.code === 200) {
      ElMessage.success('订单提交成功！')
      // 这里的 res.data 是后端返回的 orderIds 字符串 "123,124"
      // 跳转到支付页 (下一阶段)
      // router.push(`/pay?orderIds=${res.data}`)
      console.log('生成的订单ID:', res.data)
      
      // 刷新购物车 (因为下单成功的商品已经被删了)
      cartStore.fetchCartList()
      router.replace('/home') // 暂时回首页
    } else {
      ElMessage.error(res.message || '下单失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error(error.message || '系统繁忙')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.confirm-container { width: 1000px; margin: 20px auto; }
.section-title { font-size: 16px; font-weight: bold; margin: 20px 0 10px; padding-left: 10px; border-left: 3px solid #e1251b; }
.addr-item { margin-bottom: 10px; display: block; width: 100%; margin-left: 0 !important; }
.no-addr { color: #999; font-size: 14px; padding: 10px 0; }
.footer-bar { margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; display: flex; justify-content: flex-end; align-items: center; }
.price-info { margin-right: 20px; font-size: 14px; }
.total-price { color: #e1251b; font-size: 24px; font-weight: bold; }
.submit-btn { width: 150px; }
</style>
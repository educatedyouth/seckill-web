<template>
  <div class="cart-container">
    <div class="header">
      <h2>我的购物车</h2>
    </div>

    <el-card class="cart-box">
      <el-table 
        :data="cartStore.cartList" 
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column label="商品信息" width="400">
          <template #default="scope">
            <div class="goods-info">
              <img :src="scope.row.image" alt="商品图片" class="goods-img"/>
              <div class="goods-detail">
                <div class="goods-title">{{ scope.row.title ||'商品暂无名称' }}</div>
                <div class="goods-attr">{{ scope.row.skuAttr && scope.row.skuAttr.length > 0 ? scope.row.skuAttr.join('; ') : '标准规格' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="单价" width="150">
          <template #default="scope">
            <span class="price">¥ {{ scope.row.price }}</span>
          </template>
        </el-table-column>

        <el-table-column label="数量" width="200">
          <template #default="scope">
            <el-table-column label="数量" width="200">
                <template #default="scope">
                    <el-input-number 
                    v-model="scope.row.count" 
                    :min="1" 
                    :max="scope.row.stock || 99999" 
                    size="small" 
                    disabled 
                    />
                    <div v-if="scope.row.stock && scope.row.stock < scope.row.count" style="color:red; font-size:12px">
                    库存不足
                    </div>
                </template>
                </el-table-column>
          </template>
        </el-table-column>

        <el-table-column label="小计" width="150">
          <template #default="scope">
            <span class="total-price">¥ {{ (scope.row.price * scope.row.count).toFixed(2) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作">
          <template #default="scope">
            <el-button type="danger" link @click="handleDelete(scope.row.skuId)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="cart-footer">
        <div class="left">
          已选商品 <span>{{ cartStore.totalCount }}</span> 件
        </div>
        <div class="right">
          <div class="total-text">
            合计：<span class="final-price">¥ {{ cartStore.totalPrice }}</span>
          </div>
          <el-button type="primary" size="large" @click="handleCheckout" :disabled="cartStore.selectedItems.length === 0">
            去结算
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useCartStore } from '../store/cart'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ElMessageBox } from 'element-plus'
const cartStore = useCartStore()
const router = useRouter()
// 【新增】删除处理逻辑
const handleDelete = (skuId) => {
  ElMessageBox.confirm(
    '确认要从购物车中删除该商品吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 用户点击确定，调用 Store 执行删除
    cartStore.deleteCartItem(skuId)
  }).catch(() => {
    // 用户点击取消，不做操作
  })
}
// 初始化加载
onMounted(() => {
  cartStore.fetchCartList()
})

// 处理多选变化
const handleSelectionChange = (val) => {
  cartStore.updateSelectedItems(val)
}

// 去结算
const handleCheckout = () => {
  if (cartStore.selectedItems.length === 0) {
    ElMessage.warning('请至少选择一件商品')
    return
  }
  // 跳转到确认订单页 (下一阶段实现)
  router.push('/order/confirm')
}
</script>

<style scoped>
.cart-container {
  width: 1200px;
  margin: 20px auto;
}
.header {
  margin-bottom: 20px;
  border-bottom: 2px solid #e1251b;
  padding-bottom: 10px;
}
.goods-info {
  display: flex;
  align-items: center;
}
.goods-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border: 1px solid #eee;
  margin-right: 15px;
}
.goods-title {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 5px;
}
.goods-attr {
  color: #999;
  font-size: 12px;
}
.price, .total-price {
  font-weight: bold;
  color: #333;
}
.total-price {
  color: #e1251b;
}
.cart-footer {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.final-price {
  font-size: 24px;
  color: #e1251b;
  font-weight: bold;
  margin-right: 20px;
}
</style>
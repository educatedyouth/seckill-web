<template>
  <div class="home-container">
    <div class="content-wrapper">
      
      <div class="seckill-banner">
        <div class="banner-text">
          <h2>🔥 限时秒杀专区</h2>
          <p>大厂架构 · 真实并发 · 拒绝玩具</p>
        </div>
        <div class="countdown">
          <span>距本场结束：00 : 45 : 21</span>
        </div>
      </div>

      <h3 class="section-title">今日必抢</h3>
      
      <div class="goods-grid">
        <el-card 
          v-for="item in 6" 
          :key="item" 
          class="goods-card"
          shadow="hover"
        >
          <div class="goods-img-placeholder">
            商品图 {{ item }}
          </div>
          
          <div class="goods-info">
            <h4 class="goods-name">iPhone 15 Pro Max 钛金属 (测试SPU)</h4>
            <div class="goods-price">
              <span class="price-symbol">¥</span>
              <span class="price-num">99.00</span>
              <span class="original-price">¥9999</span>
            </div>
            <div class="goods-stock">
              <el-progress :percentage="80" status="exception" :show-text="false" />
              <span class="stock-text">已抢 80%</span>
            </div>
            <el-button type="danger" size="small" class="buy-btn">立即抢购</el-button>
          </div>
        </el-card>
      </div>

    </div>
  </div>
</template>

<style scoped>
.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Banner 样式 */
.seckill-banner {
  background: linear-gradient(90deg, #ff4d4f 0%, #ff7875 100%);
  border-radius: 8px;
  padding: 30px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}
.banner-text h2 { margin: 0; font-size: 28px; }
.countdown {
  background: rgba(0,0,0,0.2);
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  font-family: monospace;
  font-size: 18px;
}

/* 商品网格 */
.goods-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 一行4个 */
  gap: 20px;
  margin-bottom: 40px;
}

/* 商品卡片细节 */
.goods-img-placeholder {
  height: 180px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}
.goods-info { padding: 10px; }
.goods-name {
  margin: 5px 0;
  font-size: 14px;
  height: 40px; /* 限制高度，超过两行省略 */
  overflow: hidden;
}
.goods-price { color: #ff4d4f; margin: 10px 0; }
.price-num { font-size: 20px; font-weight: bold; }
.original-price { color: #999; text-decoration: line-through; margin-left: 8px; font-size: 12px; }
.goods-stock { display: flex; align-items: center; margin-bottom: 10px; }
.el-progress { width: 100px; margin-right: 8px; }
.stock-text { font-size: 12px; color: #666; }
.buy-btn { width: 100%; }
</style>
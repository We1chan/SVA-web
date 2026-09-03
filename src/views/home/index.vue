<template>
  <div class="sva-workspace container-work">
    <!-- 操作区：页标题 + 说明 + 组织筛选（仅有权限时渲染） -->
    <div class="sva-filter-bar home-header">
      <div class="home-title">
        <h2 class="sva-section-title">安全运营驾驶舱</h2>
        <p class="home-desc">集中呈现本月报警运营态势、趋势分布与挂牌公示，辅助快速研判与处置。</p>
      </div>
      <el-select
        v-if="hasDeptPermission"
        v-model="orgIndex"
        class="home-org-select"
        placeholder="选择组织"
        clearable
        @change="onOrgChange"
      >
        <el-option
          v-for="opt in orgOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </div>

    <!-- 响应式网格：桌面左 70% / 右 30%，平板两列，手机单列 -->
    <div class="home-grid">
      <div class="home-left">
        <hazardcount :org-index="orgIndex" />
        <hazardtrend :org-index="orgIndex" />
        <hazarddistribution :org-index="orgIndex" />
      </div>

      <div class="home-right sva-panel">
        <div class="sva-section-title">报警挂牌公示</div>
        <div class="home-right-body">
          <div v-if="loading" class="home-state">公示加载中…</div>
          <div v-else-if="error" class="home-state home-error">
            <span>公示加载失败，请稍后重试</span>
            <el-button type="primary" size="small" class="home-retry" @click="retry">重试</el-button>
          </div>
          <div v-else-if="handleData.length === 0" class="home-state">暂无挂牌公示</div>
          <tiny-grid
            v-else
            class="announcement-grid"
            :data="handleData"
            border
            :edit-config="{ trigger: 'click', mode: 'cell', showStatus: true }"
            highlight-current-row
            style="cursor: pointer;"
            @current-change="handleClick"
          >
            <tiny-grid-column field="handleEvent" title="报警事件" min-width="120" />
            <tiny-grid-column field="handleLoc" title="事件位置" min-width="160" />
            <tiny-grid-column field="handleOrg" title="处置人" width="90" />
          </tiny-grid>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import hazardcount from './components/hazard-count.vue'
import hazardtrend from './components/hazard-trend.vue'
import hazarddistribution from './components/hazard-distribution.vue'
import store from '@/store'
import {
  Grid as TinyGrid,
  GridColumn as TinyGridColumn
} from '@opentiny/vue'
import { getDeptList, getHandleData } from '@/api/system/kanban'

const ALL_PERMISSION = '*:*:*'
const DEPT_PERMISSION = 'getDeptList'

export default {
  name: 'Index',
  components: {
    hazardcount, hazardtrend, hazarddistribution, TinyGrid, TinyGridColumn
  },
  data() {
    return {
      handleData: [],
      orgOptions: [],
      orgIndex: '',
      loading: false,
      error: false,
      // 请求令牌：每次拉取公示自增，仅最新令牌的结果会被采用，
      // 防止快速切换组织时旧响应覆盖最新响应。
      reqToken: 0
    }
  },

  computed: {
    // 仅对拥有 getDeptList 或 *:*:* 权限的用户展示组织筛选
    hasDeptPermission() {
      const permissions = (store.getters && store.getters.permissions) || []
      return permissions.some(p => p === ALL_PERMISSION || p === DEPT_PERMISSION)
    }
  },

  mounted() {
    this.initData()
  },

  methods: {
    initData() {
      if (this.hasDeptPermission) {
        this.loadDept()
      }
      this.loadHandle(this.orgIndex)
    },

    // 组织列表独立于公示：失败不影响公示渲染
    async loadDept() {
      try {
        const deptListRes = await getDeptList()
        this.orgOptions = [
          { value: '', label: '全部' },
          ...(deptListRes.data || []).map(item => ({
            value: item.orgIndex,
            label: item.deptName
          }))
        ]
      } catch (e) {
        // 组织加载失败：仅保留“全部”，不阻断公示
        this.orgOptions = [{ value: '', label: '全部' }]
        console.error('getDeptList failed', e)
      }
    },

    // 切换组织仅重新拉取公示
    onOrgChange(val) {
      this.loadHandle(val)
    },

    async loadHandle(orgIndex) {
      const token = ++this.reqToken
      this.loading = true
      this.error = false
      try {
        const res = await getHandleData(orgIndex)
        // 陈旧响应（非最新令牌）直接丢弃
        if (token !== this.reqToken) return
        this.handleData = (res.data || []).map(item => ({
          id: item.w_id,
          handleEvent: item.alarm_type_name,
          handleLoc: item.device_name,
          handleOrg: item.h_org_name
        }))
      } catch (e) {
        if (token !== this.reqToken) return
        this.error = true
        console.error('getHandleData failed', e)
      } finally {
        if (token === this.reqToken) this.loading = false
      }
    },

    retry() {
      this.loadHandle(this.orgIndex)
    },

    handleClick(row) {
      if (!row) return
      const query = { withQue: 7, wid: row.id }
      this.$router.push({ path: '/warning/warning', query })
    }
  }
}
</script>

<style scoped lang="less">
.container-work {
  width: 100%;
  height: auto;
  margin: 0 auto;
  overflow: hidden;
  // 浅色画布背景由页面根节点类设置，不再修改父 DOM 样式
  background-color: var(--sva-canvas, #f3f6f6);
}

.home-header {
  align-items: flex-end;
}

.home-title {
  .home-desc {
    margin: 6px 0 0;
    color: var(--sva-muted, #647874);
    font-size: 13px;
    line-height: 20px;
  }
}

.home-org-select {
  width: 200px;
}

.home-grid {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 16px;

  .home-left {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 70%;
  }

  .home-right {
    display: flex;
    flex-direction: column;
    width: 30%;

    .home-right-body {
      flex: 1;
      min-height: 0;
    }
  }
}

// 平板：两列布局
@media (max-width: 1024px) {
  .home-grid {
    flex-wrap: wrap;

    .home-left,
    .home-right {
      width: 100%;
    }
  }
}

// 手机：单列
@media (max-width: 768px) {
  .home-grid {
    flex-direction: column;

    .home-left,
    .home-right {
      width: 100%;
    }
  }

  .home-header {
    flex-direction: column;
    align-items: stretch;
  }

  .home-org-select {
    width: 100%;
  }
}

.home-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 200px;
  color: var(--sva-muted, #647874);
  font-size: 14px;
}

.home-error {
  color: #f56c6c;
}

/deep/ .announcement-grid.tiny-grid__border {
  --ti-grid-border-color: var(--sva-border, #dfe8e5);
}

/deep/ .announcement-grid .tiny-grid-header__column {
  height: 46px;
  color: var(--sva-ink, #18332f);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background-color: #eef3f2;
}

/deep/ .announcement-grid .tiny-grid-body__column {
  height: 46px;
  color: var(--sva-ink, #18332f);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background-color: #fff;
}
</style>

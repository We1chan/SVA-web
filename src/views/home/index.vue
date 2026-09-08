<template>
  <div class="overview-page">
    <div class="page-heading">
      <div><span class="eyebrow">OVERVIEW / 运营总览</span><h1>每一处安全，都心中有数。</h1><p>从实时感知到事件处置，让安全运营更从容。</p></div>
      <div class="page-heading-actions"><el-select v-if="hasDeptPermission" v-model="orgIndex" class="home-org-select" placeholder="全部组织" clearable @change="onOrgChange"><el-option v-for="opt in orgOptions" :key="opt.value" :label="opt.label" :value="opt.value" /></el-select><el-button type="primary" icon="el-icon-video-camera" @click="$router.push('/dping')">进入监控中心</el-button></div>
    </div>
    <div class="overview-banner"><div><span class="banner-label">SAFETY, IN SIGHT.</span><h2>看见风险，先行一步。</h2><p>连接视频、智能分析与告警处置，构建完整的安全视野。</p><router-link to="/dping">打开实时视野 <i class="el-icon-top-right" /></router-link></div><div class="signal-art" aria-hidden="true"><span class="orbit orbit-one" /><span class="orbit orbit-two" /><span class="orbit orbit-three" /><i class="el-icon-view" /><span class="signal-point point-one" /><span class="signal-point point-two" /><span class="signal-caption">INTELLIGENT VISION</span></div></div>
    <div class="overview-section-label"><h2>本月安全概况</h2><span>月度运营指标</span></div>
    <hazardcount :org-index="orgIndex" />
    <div class="overview-lower"><div class="overview-charts"><hazardtrend :org-index="orgIndex" /><hazarddistribution :org-index="orgIndex" /></div>
      <section class="announcement-panel"><div class="announcement-heading"><div><span class="eyebrow">ACTIVITY</span><h2>报警挂牌公示</h2></div><span class="announcement-count">{{ handleData.length }}</span></div><p class="announcement-intro">关注事件进展，跟进每一次处置。</p>
        <div v-if="loading" class="home-state"><i class="el-icon-loading" /> 公示加载中…</div>
        <div v-else-if="error" class="home-state"><i class="el-icon-warning-outline" /><p>公示加载失败</p><el-button class="home-retry" size="small" @click="retry">重新加载</el-button></div>
        <div v-else-if="handleData.length === 0" class="home-state"><span class="empty-illustration"><i class="el-icon-document-checked" /></span><strong>暂无挂牌公示</strong><p>新的公示会显示在这里</p></div>
        <div v-else class="announcement-list"><button v-for="(row, index) in handleData" :key="row.id || index" class="announcement-row" @click="handleClick(row)"><span class="event-marker"><i class="el-icon-bell" /></span><span class="event-copy"><strong>{{ row.handleEvent }}</strong><span>{{ row.handleLoc || '未填写位置' }}</span><small>处置人 · {{ row.handleOrg || '待分配' }}</small></span><i class="el-icon-arrow-right" /></button></div>
        <div class="announcement-foot"><i class="el-icon-info" /> 点击公示查看事件详情</div>
      </section>
    </div>
    <footer class="overview-footer"><span>easySVA · 视频安全分析</span><span>让每一次感知，都有意义。</span></footer>
  </div>
</template>
<script>
import hazardcount from './components/hazard-count.vue'
import hazardtrend from './components/hazard-trend.vue'
import hazarddistribution from './components/hazard-distribution.vue'
import store from '@/store'
import { getDeptList, getHandleData } from '@/api/system/kanban'

const ALL_PERMISSION = '*:*:*'
const DEPT_PERMISSION = 'getDeptList'

export default {
  name: 'Index',
  components: {
    hazardcount, hazardtrend, hazarddistribution
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
<style lang="scss">
@import "./overview.scss";
</style>

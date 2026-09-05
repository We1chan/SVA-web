<template>
  <div ref="warningContainer" class="app-container">
    <!-- 查询参数 -->
    <el-form v-show="showSearch" ref="queryForm" :model="queryParams" size="small" :inline="true">

      <el-form-item label="设备通道名称" prop="device_name">
        <el-input
          v-model="querySpecificParams.device_name"
          placeholder="请输入设备通道名称"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>

      <el-form-item label="报警类型" prop="alarm_type_name">
        <el-select v-model="querySpecificParams.alarm_type_name" placeholder="报警类型" clearable style="width: 240px">
          <el-option v-for="op in typeWarningOptions" :key="op.value" :label="op.label" :value="op.value" />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button
          v-if="sleepDutyShortcutActive"
          type="warning"
          size="mini"
          icon="el-icon-moon"
          @click="clearSleepDutyShortcut"
        >睡岗告警（筛选中）
        </el-button>
        <el-button v-else type="warning" plain size="mini" icon="el-icon-moon" @click="applySleepDutyShortcut">
          睡岗快捷筛选
        </el-button>
      </el-form-item>

      <el-form-item label="处理状态" prop="is_handle">
        <el-select v-model="querySpecificParams.is_handle" placeholder="处理状态" clearable style="width: 200px">
          <el-option v-for="op in isHandleOptions" :key="op.value" :label="op.label" :value="op.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="所属队组" prop="team">
        <el-select v-model="querySpecificParams.team" placeholder="所属队组" clearable style="width: 200px">
          <el-option v-for="op in teamOptions" :key="op.value" :label="op.label" :value="op.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="报警时间">
        <el-date-picker
          v-model="dateRange"
          style="width: 240px"
          value-format="yyyy-MM-dd"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </el-form-item>

    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['system:role:export']"
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
        >导出
        </el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="warningList" class="tech-table" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column label="序号" type="index" width="55" />
      <el-table-column
        label="报警类型"
        prop="alarm_type_name"
        :show-overflow-tooltip="true"
        width="200"
        align="center"
      >
        <template slot-scope="scope">
          <el-tag size="mini" :type="getAlarmTypeTagType(scope.row)">
            {{ resolveDisplayAlarmTypeName(scope.row) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="设备类型" prop="device_type" width="110" align="center">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.device_type === 'GB28181'" type="success" size="mini">GB28181</el-tag>
          <el-tag v-else-if="scope.row.device_type === 'RTSP'" type="info" size="mini">RTSP</el-tag>
          <span v-else>{{ scope.row.device_type || '---' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="设备通道名称" prop="device_name" :show-overflow-tooltip="true" width="300" />
      <el-table-column label="组织名称" prop="org_name" :show-overflow-tooltip="true" width="180" />
      <el-table-column label="所属队组" prop="team" :show-overflow-tooltip="true" width="180" />
      <el-table-column label="报警时间" prop="alarm_time" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.alarm_time) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="规则信息" min-width="220" align="center">
        <template slot-scope="scope">
          <div class="rule-summary-primary">{{ formatRuleSummary(scope.row) }}</div>
          <div v-if="formatLifecycleSummary(scope.row) !== '---'" class="rule-summary-secondary">
            {{ formatLifecycleSummary(scope.row) }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" prop="is_handle" width="80">
        <template slot-scope="scope">
          <span :style="{ color: scope.row.is_handle === 1 ? 'green' : 'orange' }">
            {{ scope.row.is_handle === 1 ? '已处理' : '未处理' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="AI复核" min-width="180" align="center">
        <template slot-scope="scope">
          <el-tag size="mini" :type="getAiReviewStatusType(scope.row.ai_review_status, scope.row.ai_review_decision)">
            {{ getAiReviewStatusLabel(scope.row.ai_review_status, scope.row.ai_review_decision) }}
          </el-tag>
          <div v-if="scope.row.ai_review_summary" class="ai-review-summary">
            {{ scope.row.ai_review_summary }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="操作" class-name="small-padding fixed-width" align="center">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-zoom-in" @click="viewDetail(scope.row)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="fetchData"
    />

    <el-dialog :title="title" :visible.sync="openDetails" width="1200px" append-to-body destroy-on-close @close="handleDetailDialogClose">
      <el-row>
        <el-col :span="15">
          <div class="grid-content bg-purple">
            <div class="block">
              <el-image
                v-if="detailsInfo.picture_absolute_url"
                :src="toAbsoluteMediaUrl(detailsInfo.picture_absolute_url)"
                :preview-src-list="[toAbsoluteMediaUrl(detailsInfo.picture_absolute_url)]"
              >
                <div slot="error" class="snapshot-placeholder">
                  <i class="el-icon-picture-outline snapshot-placeholder-icon" />
                  <span>抓拍图加载失败</span>
                </div>
              </el-image>
              <div v-else class="snapshot-placeholder">
                <i class="el-icon-picture-outline snapshot-placeholder-icon" />
                <span>暂无抓拍</span>
              </div>
            </div>
            <div class="detail-video-toolbar">
              <el-button
                size="mini"
                type="primary"
                icon="el-icon-video-play"
                :loading="detailVideoLoading"
                @click="playDetailVideo"
              >
                {{ detailVideoVisible ? '重新加载视频证据' : '播放视频证据' }}
              </el-button>
            </div>
            <div v-if="detailVideoVisible" class="detail-video-panel">
              <player
                :view-proof="detailVideoVisible"
                :rtsp-url="rtspUrl"
                :inline="true"
                title="视频证据查看"
                @closeProof="closeDetailVideo"
              />
            </div>
          </div>
        </el-col>

        <el-col :span="9">
          <div class="grid-content bg-purple-light">
            <el-descriptions
              class="margin-top"
              title="报警信息"
              :column="1"
              size="medium"
              style="margin: 0px 0 35px 40px;"
            >
              <el-descriptions-item label="报警类型"> {{ resolveDisplayAlarmTypeName(detailsInfo) }}</el-descriptions-item>
              <el-descriptions-item label="报警时间"> {{ detailsInfo.alarm_time }}</el-descriptions-item>
              <el-descriptions-item label="设备通道">
                <el-tag size="small"> {{ detailsInfo.device_name }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="设备类型">
                <el-tag v-if="detailsInfo.device_type === 'GB28181'" size="small" type="success">GB28181</el-tag>
                <el-tag v-else-if="detailsInfo.device_type === 'RTSP'" size="small" type="info">RTSP</el-tag>
                <span v-else>{{ detailsInfo.device_type || '---' }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="行为类型"> {{ getBehaviorTypeLabel(detailsInfo.sva_behavior_type) }}</el-descriptions-item>
              <el-descriptions-item label="规则ID"> {{ detailsInfo.sva_rule_id || '---' }}</el-descriptions-item>
              <el-descriptions-item label="区域名称"> {{ detailsInfo.sva_region_name || '---' }}</el-descriptions-item>
              <el-descriptions-item label="线段名称"> {{ detailsInfo.sva_line_name || '---' }}</el-descriptions-item>
              <el-descriptions-item label="跨线方向"> {{ getCrossingDirectionLabel(detailsInfo.sva_crossing_direction) }}</el-descriptions-item>
              <el-descriptions-item label="事件阶段"> {{ getEventStateLabel(detailsInfo.sva_event_state) }}</el-descriptions-item>
              <el-descriptions-item label="持续时长"> {{ formatDuration(detailsInfo.duration_ms) }}</el-descriptions-item>
              <el-descriptions-item label="结束时间"> {{ detailsInfo.end_time || '---' }}</el-descriptions-item>
              <el-descriptions-item label="处理状态"> {{ isHandled(detailsInfo.is_handle) ? '已处理' : '未处理' }}
              </el-descriptions-item>
              <el-descriptions-item label="处理方式"> {{ isHandled(detailsInfo.is_handle) ? (detailsInfo.h_title || '---') : '---' }}
              </el-descriptions-item>
              <el-descriptions-item label="处理单位"> {{
                isHandled(detailsInfo.is_handle) ? detailsInfo.h_org_name : '---'
              }}
              </el-descriptions-item>
              <el-descriptions-item label="处理意见"> {{ isHandled(detailsInfo.is_handle) ? detailsInfo.h_remark : '---' }}
              </el-descriptions-item>
              <el-descriptions-item label="处理时间"> {{
                isHandled(detailsInfo.is_handle) ? detailsInfo.h_create_time : '---'
              }}
              </el-descriptions-item>
              <el-descriptions-item label="AI复核状态">
                <el-tag size="small" :type="getAiReviewStatusType(detailsInfo.ai_review_status, detailsInfo.ai_review_decision)">
                  {{ getAiReviewStatusLabel(detailsInfo.ai_review_status, detailsInfo.ai_review_decision) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="AI复核结论"> {{ getAiDecisionLabel(detailsInfo.ai_review_decision) }}
              </el-descriptions-item>
              <el-descriptions-item label="误报分数"> {{ formatAiScore(detailsInfo.ai_false_positive_score) }}
              </el-descriptions-item>
              <el-descriptions-item label="AI复核时间"> {{ detailsInfo.ai_review_time || '---' }}
              </el-descriptions-item>
              <el-descriptions-item label="AI摘要"> {{ detailsInfo.ai_review_summary || '---' }}
              </el-descriptions-item>
            </el-descriptions>

            <el-alert
              v-if="isHandled(detailsInfo.is_handle) && !hasHandleDetail(detailsInfo)"
              title="该告警已标记为已处理，但未找到处理明细记录"
              type="warning"
              :closable="false"
              show-icon
              class="detail-handle-alert"
            />

            <div class="detail-solve-panel">
              <el-divider>处理报警</el-divider>
              <el-form ref="solveForm" :model="solveData" :rules="solveRules" label-width="80px">
                <el-form-item label="处理方式" prop="h_title">
                  <el-radio-group v-model="solveData.h_title">
                    <el-radio label="确认" />
                    <el-radio label="误报" />
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="处理意见" prop="h_remark">
                  <el-input v-model="solveData.h_remark" type="textarea" :rows="6" />
                </el-form-item>
              </el-form>
            </div>
          </div>
        </el-col>
      </el-row>

      <div slot="footer" class="dialog-footer">
        <el-button v-if="detailsInfo.w_id || detailActionRow.w_id" :loading="solveSubmitting" type="primary" @click="comfirmSolve">提 交</el-button>
        <el-button plain @click="openDetails = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getAlarmTypeFilterOptions,
  getTeamWaring,
  getWarningDetail,
  getWarningList,
  handleWarning
} from '@/api/warning'
import { getDeptList } from '@/api/system/kanban'
import player from '@/components/RTSPPlayer'
import store from '@/store'
import { toBrowserPlayableUrl } from '@/utils/media-url'

const formatDateLocal = (date) => {
  const d = date instanceof Date ? date : new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default {
  name: 'Warning',
  dicts: ['sys_normal_disable'],
  components: { player },
  beforeRouteUpdate(to, from, next) {
    next() // 先让路由更新
    this.$nextTick(() => {
      this.fetchQueryOptionData()
      this.$nextTick(() => {
        this.deviceContainer.parentNode.style.backgroundColor = 'white'
      })
      this.querySpecificParams.w_id = undefined// 清除搜索内容
      this.solveRouterQuery()
    })
  },

  data() {
    return {
      loading: true,
      isHandleOptions: [
        { value: '0', label: '未处理' },
        { value: '1', label: '已处理' }
      ],
      dateRange: [
        formatDateLocal(new Date()),
        formatDateLocal(new Date())
      ],
      orgOptions: [],
      typeWarningOptions: [],
      teamOptions: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        begin: undefined,
        end: undefined
      },
      querySpecificParams: {
        device_name: undefined,
        org_name: undefined,
        alarm_type_name: undefined,
        alarm_level_name: undefined,
        team: undefined,
        is_handle: undefined,
        w_id: undefined
      },
      warningList: [],
      title: '',
      openDetails: false,
      detailsInfo: {},
      detailActionRow: {},
      solveData: {
        w_id: '',
        h_title: '',
        h_remark: ''
      },
      solveSubmitting: false,
      alarmPushTimer: null,
      solveRules: {
        h_title: [
          { required: true, message: '请选择处理方式', trigger: 'blur' }
        ],
        h_remark: [
          { required: true, message: '请填写处理意见', trigger: 'blur' }
        ]
      },
      auth: '',
      rtspUrl: '',
      detailVideoVisible: false,
      detailVideoLoading: false,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 角色表格数据
      roleList: [],

      // 菜单列表
      menuOptions: [],
      // 组织列表
      deptOptions: [],

      // 表单参数
      form: {},
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      querySpecificParamsWatch: true,
      dateRangeWatch: true
    }
  },

  computed: {
    deviceContainer() {
      return this.$refs['warningContainer']
    },
    sleepDutyShortcutActive() {
      return String(this.querySpecificParams.alarm_type_name || '').trim() === '睡岗告警'
    }
  },

  watch: {
    querySpecificParams: {
      handler(newVal, oldVal) {
        if (this.querySpecificParamsWatch) this.handleQuery()
      },
      deep: true
    },

    dateRange(newVal, oldVal) {
      if (this.dateRangeWatch) this.handleQuery()
    }

  },

  activated() {
    this.querySpecificParamsWatch = false
    this.querySpecificParams = {
      device_name: undefined,
      org_name: undefined,
      alarm_type_name: undefined,
      alarm_level_name: undefined,
      is_handle: undefined,
      team: undefined,
      w_id: undefined
    }
    this.querySpecificParamsWatch = true
    this.solveRouterQuery()
  },

  mounted() {
    window.addEventListener('sva:alarm-push', this.handleAlarmPush)
    this.fetchQueryOptionData()
    this.$nextTick(() => {
      if (this.deviceContainer && this.deviceContainer.parentNode) {
        this.deviceContainer.parentNode.style.backgroundColor = 'white'
      }
    })
    this.solveRouterQuery()
  },
  beforeDestroy() {
    window.removeEventListener('sva:alarm-push', this.handleAlarmPush)
    if (this.alarmPushTimer) clearTimeout(this.alarmPushTimer)
  },
  methods: {
    handleAlarmPush() {
      if (this.alarmPushTimer) return
      this.alarmPushTimer = setTimeout(() => {
        this.alarmPushTimer = null
        this.fetchData()
      }, 400)
    },
    solveRouterQuery() {
      this.querySpecificParamsWatch = false
      this.dateRangeWatch = false
      const alarmLevelName = this.$route.query.alarm_level_name
      const withQue = this.$route.query.withQue
      const time = this.$route.query.time
      const type = this.$route.query.alarm_type_name
      const wid = this.$route.query.wid
      if (alarmLevelName) this.querySpecificParams.alarm_level_name = alarmLevelName
      if (type) this.querySpecificParams.alarm_type_name = type
      if (wid) this.querySpecificParams.w_id = wid
      if (withQue) {
        const now = new Date()
        switch (withQue) {
          case '1':
            this.dateRange = [
              formatDateLocal(new Date(now.getFullYear(), 0, 1)),
              formatDateLocal(now) // 今天
            ]
            break
          case '2': // 查看【本月初-今天】的报警数据
            this.dateRange = [formatDateLocal(new Date(now.getFullYear(), now.getMonth(), 1)), formatDateLocal(now)]
            this.querySpecificParams.is_handle = this.$route.query.is_handle
            break
          case '3':
            this.dateRange = [formatDateLocal(new Date(now.getFullYear(), 0, 1)), formatDateLocal(now)]
            this.querySpecificParams.is_handle = this.$route.query.is_handle
            break
          case '4':
            this.dateRange = [formatDateLocal(new Date(now.getFullYear(), 0, 1)), formatDateLocal(now)]
            this.querySpecificParams.alarm_level_name = '警告'
            break
          case '5': // 查看本年严重数据
            this.dateRange = [formatDateLocal(new Date(now.getFullYear(), 0, 1)), formatDateLocal(now)]
            this.querySpecificParams.alarm_level_name = '严重'
            break
          case '6': // 查看本月严重数据
            this.dateRange = [formatDateLocal(new Date(now.getFullYear(), now.getMonth(), 1)), formatDateLocal(now)]
            this.querySpecificParams.alarm_level_name = '严重'
            break
          case '7': // 根据 wid 处理具体事件
            this.dateRange = []
            // this.dateRange = [new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10), new Date().toISOString().slice(0, 10)];
            this.querySpecificParams.w_id = this.$route.query.wid
            break
          case '8': // 按周 月 季度 年 查询报警数据
            if (time === '周') {
              let startDate = new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + (new Date().getDay() === 0 ? -6 : 1)))
              let endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000)
              startDate = formatDateLocal(startDate)
              endDate = formatDateLocal(endDate)
              this.dateRange = [startDate, endDate]
            } else if (time === '月') {
              this.dateRange = [formatDateLocal(new Date(now.getFullYear(), now.getMonth(), 1)), formatDateLocal(new Date(now.getFullYear(), now.getMonth() + 1, 0))]
            } else if (time === '季度') {
              // 获取当前日期对象及相应季度信息
              const currentDate = now
              const currentMonth = currentDate.getMonth() + 1
              const currentQuarter = Math.ceil(currentMonth / 3) // 计算当前季度（1, 2, 3 或 4）
              if (currentQuarter === 1) this.dateRange = [formatDateLocal(new Date(now.getFullYear(), 0, 1)), formatDateLocal(new Date(now.getFullYear(), 3, 0))]
              else if (currentQuarter === 2) this.dateRange = [formatDateLocal(new Date(now.getFullYear(), 3, 1)), formatDateLocal(new Date(now.getFullYear(), 6, 0))]
              else if (currentQuarter === 3) this.dateRange = [formatDateLocal(new Date(now.getFullYear(), 6, 1)), formatDateLocal(new Date(now.getFullYear(), 9, 0))]
              else this.dateRange = [formatDateLocal(new Date(now.getFullYear(), 9, 1)), formatDateLocal(new Date(now.getFullYear() + 1, 0, 0))]
            } else {
              this.dateRange = [formatDateLocal(new Date(now.getFullYear(), 0, 1)), formatDateLocal(new Date(now.getFullYear() + 1, 0, 0))]
              this.querySpecificParams.team = this.$route.query.team
            }
            break
        }
      }
      this.querySpecificParamsWatch = true
      this.dateRangeWatch = true
      this.fetchData()
    },
    // 处理查询时间
    handleTime() {
      if (this.dateRange == null || this.dateRange.length === 0) {
        this.queryParams.begin = undefined
        this.queryParams.end = undefined
        return
      }
      const formattedDateRange = [
        this.dateRange[0] + ' 00:00:00',
        this.dateRange[1] + ' 23:59:59'
      ]

      const timestamps = formattedDateRange.map(dateStr => {
        const date = new Date(dateStr)
        return Math.round(date.getTime() / 1000)
      })

      if (timestamps.length === 2) {
        this.queryParams.begin = timestamps[0]
        this.queryParams.end = timestamps[1]
      }
    },

    // 导出数据
    handleExport() {
      this.handleTime()
      const { pageNum, pageSize, ...newQueryParams } = this.queryParams
      this.download('/waring/waring/importTemplate', {
        ...newQueryParams,
        ...this.querySpecificParams
      }, `报警信息_${new Date().getTime()}.xlsx`)
    },

    // 获取报警列表
    async fetchData() {
      try {
        this.loading = true
        this.handleTime()
        const response = await getWarningList({ ...this.queryParams, ...this.querySpecificParams })
        this.warningList = response.rows
        this.total = response.total
        this.auth = response.token
        // if(response)
        //
      } catch (error) {
        this.$modal.msgError((error && error.message) || '告警列表加载失败，请重试')
      } finally {
        this.loading = false
      }
    },

    // 获取搜索下拉
    async fetchQueryOptionData() {
      try {
        const permissions = store.getters && store.getters.permissions
        const all_permission = '*:*:*'
        const permissionFlag = 'getDeptList'
        const hasPermissions = permissions.some(permission => {
          return all_permission === permission || permissionFlag.includes(permission)
        })
        if (hasPermissions) {
          const deptListRes = await getDeptList()
          this.orgOptions = [
            {
              value: '',
              label: '全部'
            },
            ...deptListRes.data.map((item) => ({
              value: item.orgIndex,
              label: item.deptName
            }))
          ]
        }
        const typeWarningRes = await getAlarmTypeFilterOptions()
        this.typeWarningOptions = typeWarningRes.data.map(item => ({
          value: item.alarm_type_name,
          label: item.alarm_type_name
        }))
        const teamWarningRes = await getTeamWaring()
        this.teamOptions = teamWarningRes.data.map(item => ({
          value: item.team_name,
          label: item.team_name
        }))
      } catch (error) {
        console.error(error)
      }
    },

    // 查询数据
    handleQuery() {
      // const currentPath = this.$route.path;
      // const currentQuery = {...this.$route.query}
      // delete currentQuery.wid
      // this.$router.push({path: currentPath, query: currentQuery})
      this.queryParams.pageNum = 1
      this.fetchData()
    },

    // 查看详情
    async viewDetail(row) {
      const id = row.w_id
      try {
        const response = await getWarningDetail(id)
        this.detailsInfo = response.data
        this.detailActionRow = Object.assign({}, row || {}, response.data || {})
        this.resetSolveForm(this.detailActionRow)
        this.closeDetailVideo()
        this.openDetails = true
        this.title = '报警详情'
      } catch (error) {
        console.error(error)
      }
    },

    // 提交处理
    comfirmSolve() {
      this.$refs['solveForm'].validate(async (valid) => {
        if (!valid) {
          this.$message.warning('请完整填写处理方式和处理意见')
          return false
        }
        if (this.solveSubmitting) {
          return false
        }
        const submittedWId = this.solveData.w_id
        const submittedData = {
          w_id: submittedWId,
          h_title: this.solveData.h_title,
          h_remark: this.solveData.h_remark
        }
        this.solveSubmitting = true
        try {
          const response = await handleWarning(submittedData)
          if (!response || response.code !== 200) {
            this.$message.error((response && response.message) || '处理失败，请稍后重试')
            return
          }
          this.$message.success('报警处理成功')
          await this.fetchData()
          try {
            const detailResponse = await getWarningDetail(submittedWId)
            if (detailResponse && detailResponse.data) {
              this.detailsInfo = detailResponse.data
              this.detailActionRow = Object.assign({}, this.detailActionRow, detailResponse.data || {})
            }
          } catch (e) {
            console.warn('刷新详情失败', e)
          }
          // 清空处理表单，避免重复提交与状态残留
          this.solveData = { w_id: submittedWId, h_title: '', h_remark: '' }
          this.$nextTick(() => {
            if (this.$refs.solveForm) {
              this.$refs.solveForm.clearValidate()
            }
          })
        } catch (error) {
          console.error(error)
          this.$message.error((error && error.message) ? error.message : '提交失败')
        } finally {
          this.solveSubmitting = false
        }
      })
    },

    resetSolveForm(detail = {}) {
      this.solveData = {
        w_id: detail.w_id || '',
        h_title: detail.h_title || '',
        h_remark: detail.h_remark || ''
      }
      this.$nextTick(() => {
        if (this.$refs.solveForm) {
          this.$refs.solveForm.clearValidate()
        }
      })
    },

    handleDetailDialogClose() {
      this.closeDetailVideo()
      this.resetSolveForm({})
      this.detailsInfo = {}
      this.detailActionRow = {}
    },

    closeDetailVideo() {
      this.detailVideoVisible = false
      this.rtspUrl = ''
    },

    async playDetailVideo() {
      await this.viewVideo(this.detailActionRow)
    },

    // 查看视频证据
    toAbsoluteMediaUrl(path) {
      if (!path) return ''
      const absolute = /^https?:\/\//i.test(path) ? path : (path.startsWith('/') ? `${window.location.origin}${path}` : `${window.location.origin}/${path}`)
      return toBrowserPlayableUrl(absolute)
    },

    resolveVideoMediaUrl(row) {
      const absoluteVideoPath = row && row.video_absolute_url
      if (absoluteVideoPath) {
        return this.toAbsoluteMediaUrl(absoluteVideoPath)
      }
      const relativeVideoPath = row && row.video_url
      if (/^\/?alarm\//i.test(relativeVideoPath || '')) {
        return this.toAbsoluteMediaUrl(relativeVideoPath.startsWith('/') ? relativeVideoPath : `/${relativeVideoPath}`)
      }
      return this.toAbsoluteMediaUrl(relativeVideoPath)
    },

    async viewVideo(row) {
      if (!row || !row.device_id || !row.alarm_time) {
        this.$modal.msgError('缺少视频取证信息')
        return
      }

      this.detailVideoLoading = true
      const localVideoUrl = this.resolveVideoMediaUrl(row)
      if (localVideoUrl) {
        this.rtspUrl = localVideoUrl
        this.detailVideoVisible = true
        this.detailVideoLoading = false
        return
      }

      this.$modal.msgError('视频不存在')
      this.detailVideoLoading = false
    },

    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.w_id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },

    isHandled(value) {
      return String(value) === '1'
    },

    hasHandleDetail(detail = {}) {
      return !!(detail.h_title || detail.h_org_name || detail.h_remark || detail.h_create_time)
    },

    getAiReviewStatusLabel(status, decision) {
      if (!status) return '未复核'
      if (status === 'PENDING') return '待复核'
      if (status === 'RUNNING') return '复核中'
      if (status === 'FAILED') return '复核失败'
      if (status === 'SKIPPED') return '已跳过'
      if (status === 'SUCCESS') return this.getAiDecisionLabel(decision)
      return status
    },

    getAiReviewStatusType(status, decision) {
      if (!status) return 'info'
      if (status === 'PENDING' || status === 'RUNNING') return 'warning'
      if (status === 'FAILED') return 'danger'
      if (status === 'SKIPPED') return 'info'
      if (status === 'SUCCESS') {
        if (decision === 'false_alarm') return 'danger'
        if (decision === 'true_alarm') return 'success'
        return 'warning'
      }
      return 'info'
    },

    getAiDecisionLabel(decision) {
      if (decision === 'true_alarm') return '疑似真实告警'
      if (decision === 'false_alarm') return '疑似误报'
      if (decision === 'uncertain') return '待人工确认'
      return '---'
    },

    formatAiScore(score) {
      if (score === undefined || score === null || score === '') {
        return '---'
      }
      const numericScore = Number(score)
      if (!Number.isFinite(numericScore)) {
        return '---'
      }
      return numericScore.toFixed(2)
    },

    getBehaviorTypeLabel(behaviorType) {
      behaviorType = String(behaviorType || '').trim().toLowerCase()
      if (behaviorType === 'cross_line') return '跨线'
      if (behaviorType === 'enter_region') return '进区'
      if (behaviorType === 'exit_region') return '出区'
      if (behaviorType === 'dwell') return '停留'
      if (behaviorType === 'low_speed') return '低速'
      if (behaviorType === 'loitering') return '徘徊'
      if (behaviorType === 'absence') return '缺席'
      if (behaviorType === 'sleep_duty') return '睡岗'
      if (behaviorType === 'sleep') return '睡觉'
      if (behaviorType === 'count_threshold') return '数量阈值'
      if (behaviorType === 'occupancy') return '占用'
      if (behaviorType === 'direction_move') return '定向通行'
      if (behaviorType === 'direction_reverse') return '逆向通行'
      if (behaviorType === 'relation_near') return '目标接近'
      if (behaviorType === 'relation_apart') return '目标远离'
      if (behaviorType === 'relation_not_contains') return '目标未包含'
      return '---'
    },

    // 已知异常的内部 token，避免把脏值暴露到报警类型列
    knownDirtyAlarmTypeNameTokens() {
      return ['操作有误', '未识别告警']
    },

    // 判断是不是 H3 老链路 GUID 形式的 alarm_type（仅 8-64 位 0-9a-f 字符）
    isGuidLikeValue(value) {
      return typeof value === 'string' && /^[0-9a-fA-F]{8,}$/.test(value.trim())
    },

    // 派生最终展示用的报警类型名：优先按 alarm_type 业务码映射，回退到 alarm_type_name。
    // 当 alarm_type_name 是脏值（GUID、'操作有误'），按 sva_behavior_type 派生。
    resolveDisplayAlarmTypeName(row) {
      if (!row) return '---'
      const rawName = String(row.alarm_type_name || '').trim()
      const isDirty = this.knownDirtyAlarmTypeNameTokens().includes(rawName) ||
        this.isGuidLikeValue(rawName)

      // 1. 优先用 alarm_type 业务码做映射（不管是新链路还是清理后的）
      const codeToName = {
        SVA_CROSS_LINE: '跨线告警',
        SVA_ENTER_REGION: '进区告警',
        SVA_EXIT_REGION: '出区告警',
        SVA_DWELL: '停留告警',
        SVA_LOW_SPEED: '低速告警',
        SVA_LOITERING: '徘徊告警',
        SVA_ABSENCE: '离岗/缺席告警',
        SVA_COUNT_THRESHOLD: '数量阈值告警',
        SVA_OCCUPANCY: '区域占用告警',
        SVA_DIRECTION_MOVE: '定向通行告警',
        SVA_DIRECTION_REVERSE: '逆向通行告警',
        SVA_RELATION_NEAR: '目标接近告警',
        SVA_RELATION_APART: '目标远离告警',
        SVA_RELATION_NOT_CONTAINS: '目标未包含告警',
        SLEEP_DUTY: '睡岗告警',
        SVA_SIMPLE: 'SVA 告警'
      }
      const code = String(row.alarm_type || '').trim()
      const codeName = codeToName[code]
      if (codeName) {
        return codeName
      }

      // 2. 没有业务码，按 sva_behavior_type 派生
      const behaviorName = this.getBehaviorTypeLabel(row.sva_behavior_type)
      if (behaviorName !== '---') {
        if (behaviorName === '睡岗') return '睡岗告警'
        if (behaviorName === '缺席') return '缺席告警'
        if (behaviorName === '跨线') return '跨线告警'
        if (behaviorName === '进区') return '进区告警'
        if (behaviorName === '出区') return '出区告警'
        if (behaviorName === '停留') return '停留告警'
        if (behaviorName === '低速') return '低速告警'
        if (behaviorName === '徘徊') return '徘徊告警'
        if (behaviorName === '数量阈值') return '数量阈值告警'
        if (behaviorName === '占用') return '区域占用告警'
        if (behaviorName === '定向通行') return '定向通行告警'
        if (behaviorName === '逆向通行') return '逆向通行告警'
        if (behaviorName === '目标接近') return '目标接近告警'
        if (behaviorName === '目标远离') return '目标远离告警'
        if (behaviorName === '目标未包含') return '目标未包含告警'
        if (behaviorName === '睡觉') return '睡岗告警'
      }

      // 3. 有 alarm_type_name 但不是脏值，直接用
      if (!isDirty && rawName) {
        return rawName
      }

      // 4. 都拿不到
      return '---'
    },

    // 兜底：识别 region/line 是否是脏值（GUID、fell-frame、Unknown 等）
    isDirtyGeometryToken(value) {
      if (!value) return false
      const trimmed = String(value).trim()
      if (!trimmed) return false
      if (this.isGuidLikeValue(trimmed)) return true
      const dirty = ['fell-frame', 'region_unknown', 'line_unknown', 'unknown', 'undefined', 'null']
      return dirty.includes(trimmed.toLowerCase())
    },

    sanitizeGeometry(value) {
      return this.isDirtyGeometryToken(value) ? null : String(value).trim()
    },

    getAlarmTypeTagType(row = {}) {
      const resolvedTypeName = this.resolveDisplayAlarmTypeName(row)
      const resolvedBehavior = String(row.sva_behavior_type || '').trim().toLowerCase()
      // sleep_duty 行为无论新链路还是老链路历史数据，都按警告色处理
      if (row.alarm_type === 'SLEEP_DUTY' ||
        resolvedTypeName === '睡岗告警' ||
        resolvedBehavior === 'sleep_duty' ||
        resolvedBehavior === 'sleep') {
        return 'warning'
      }
      if (row.alarm_type === 'SVA_ABSENCE' ||
        resolvedTypeName === '缺席告警' ||
        resolvedTypeName === '离岗告警' ||
        resolvedBehavior === 'absence') {
        return 'danger'
      }
      // 其他 SVA_* 业务告警都加一种稳定 tag，便于人工识别分类
      if (String(row.alarm_type || '').startsWith('SVA_')) {
        return 'primary'
      }
      return 'info'
    },

    applySleepDutyShortcut() {
      this.querySpecificParams.alarm_type_name = '睡岗告警'
      this.queryParams.pageNum = 1
      this.fetchData()
    },

    clearSleepDutyShortcut() {
      this.querySpecificParams.alarm_type_name = undefined
      this.queryParams.pageNum = 1
      this.fetchData()
    },

    getEventStateLabel(eventState) {
      if (eventState === 'start') return '开始'
      if (eventState === 'update') return '持续'
      if (eventState === 'end') return '结束'
      return '---'
    },

    getCrossingDirectionLabel(direction) {
      if (direction === 'left_to_right') return '左到右'
      if (direction === 'right_to_left') return '右到左'
      if (direction === 'both') return '双向'
      if (direction === 'unknown') return '未知'
      return direction || '---'
    },

    formatDuration(durationMs) {
      if (durationMs === undefined || durationMs === null || durationMs === '') {
        return '---'
      }
      const duration = Number(durationMs)
      if (!Number.isFinite(duration) || duration < 0) {
        return '---'
      }
      if (duration < 1000) {
        return `${duration}ms`
      }
      const totalSeconds = Math.floor(duration / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      const parts = []
      if (hours > 0) parts.push(`${hours}小时`)
      if (minutes > 0) parts.push(`${minutes}分`)
      if (seconds > 0 || parts.length === 0) parts.push(`${seconds}秒`)
      return parts.join('')
    },

    formatRuleSummary(row = {}) {
      const behavior = this.getBehaviorTypeLabel(row.sva_behavior_type)
      if (behavior === '---') {
        return '---'
      }
      const isCrossLine = row.sva_behavior_type === 'cross_line'
      const name = isCrossLine
        ? (this.sanitizeGeometry(row.sva_line_name) || this.sanitizeGeometry(row.sva_line_id) || '')
        : (this.sanitizeGeometry(row.sva_region_name) || this.sanitizeGeometry(row.sva_region_id) || '')
      const suffix = isCrossLine
        ? this.getCrossingDirectionLabel(row.sva_crossing_direction)
        : ''
      return [behavior, name, suffix && suffix !== '---' ? suffix : ''].filter(Boolean).join(' / ')
    },

    formatLifecycleSummary(row = {}) {
      const state = this.getEventStateLabel(row.sva_event_state)
      const duration = this.formatDuration(row.duration_ms)
      const parts = []
      if (state !== '---') parts.push(state)
      if (duration !== '---') parts.push(duration)
      if (row.end_time) parts.push(`结束 ${row.end_time}`)
      return parts.length > 0 ? parts.join(' | ') : '---'
    }
  }
}
</script>

<style scoped>
.ai-review-summary {
  margin-top: 4px;
  color: #606266;
  font-size: 12px;
  line-height: 1.4;
}

.rule-summary-primary {
  color: #303133;
  line-height: 1.4;
}

.rule-summary-secondary {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
}

.detail-video-toolbar {
  margin-top: 16px;
}

.detail-video-panel {
  margin-top: 16px;
}

.detail-solve-panel {
  margin-left: 40px;
  margin-right: 16px;
}

.detail-handle-alert {
  margin: 0 16px 16px 40px;
}

.snapshot-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  color: #909399;
  background: #fafafa;
  font-size: 13px;
}

.snapshot-placeholder-icon {
  font-size: 36px;
  margin-bottom: 8px;
  color: #c0c4cc;
}
</style>

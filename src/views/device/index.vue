<!--
  模块：设备管理 / 流媒体预览入口。
  职责：统一展示 DIRECT、PLATFORM 与 GB28181 设备，并调用后端完成监控启停和预览。
  边界：本页面不直接访问 WVP；国标 SIP/点播状态均以后端返回结果为准。
-->
<template>
  <div ref="deviceContainer" class="app-container">
    <div v-show="deviceListShow">
      <el-row :gutter="20">
        <el-col :span="24" :xs="24">
          <el-form ref="queryForm" :model="queryParams" size="small" :inline="true" label-width="68px">
            <el-form-item label="组织名称" prop="org_index">
              <el-select v-model="queryParams.org_index" filterable clearable placeholder="请选择组织名称" style="width: 240px">
                <el-option v-for="item in queryDeptOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="设备编码" prop="ape_id">
              <el-input v-model="queryParams.ape_id" placeholder="请输入设备编码" clearable style="width: 240px" @keyup.enter.native="handleQuery" />
            </el-form-item>

            <el-form-item label="设备名称" prop="name">
              <el-input v-model="queryParams.name" placeholder="请输入设备名称" clearable style="width: 240px" @keyup.enter.native="handleQuery" />
            </el-form-item>

            <el-form-item label="设备状态" prop="is_online">
              <el-select v-model="queryParams.is_online" placeholder="设备状态" clearable style="width: 240px">
                <el-option v-for="op in onlineOptions" :key="op.value" :label="op.label" :value="op.value" />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
              <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table v-loading="loading" :data="deviceList" class="tech-table" @selection-change="handleSelectionChange">
            <el-table-column label="序号" type="index" width="50" align="center" />
            <el-table-column label="设备名称" prop="name" align="center" />
            <el-table-column label="设备编码" prop="ape_id" align="center" />
            <el-table-column label="IP地址" prop="ip_addr" align="center" />
            <el-table-column label="端口号" prop="port" align="center" />
            <el-table-column label="设备类型" prop="sub_type" align="center">
              <template slot-scope="scope">
                <span>{{ returnType(scope.row.sub_type) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="资源类型" prop="resource_type" align="center">
              <template slot-scope="scope">
                <span>{{ returnResource(scope.row.resource_type) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="通道编码" prop="place" align="center" />
            <el-table-column label="状态" prop="is_online" align="center">
              <template slot-scope="scope">
                <span>{{ returnStatus(scope.row.is_online) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" fixed="right" width="380" class-name="small-padding fixed-width operation-column">
              <template slot-scope="scope">
                <el-button size="mini" type="text" icon="el-icon-video-play" @click="startMonitor(scope.row)">启动监控</el-button>
                <el-button size="mini" type="text" icon="el-icon-video-pause" @click="stopMonitor(scope.row)">停止监控</el-button>
                <el-button size="mini" type="text" icon="el-icon-video-camera" @click="previewMonitor(scope.row)">预览视频</el-button>
                <el-button size="mini" type="text" icon="el-icon-zoom-in" @click="warningHistory(scope.row)">历史报警
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <pagination
            v-show="total > 0"
            :total="total"
            :page.sync="pageOp.pageNum"
            :limit.sync="pageOp.pageSize"
            @pagination="fetchDeviceList"
          />
        </el-col>
      </el-row>
    </div>

    <devicewarning
      v-show="!deviceListShow"
      :warning-title="warningTitle"
      :device_id="device_id"
      @closeWarning="deviceListShow = true"
    />

    <r-t-s-p-player
      v-show="viewProof"
      :view-proof="viewProof"
      :rtsp-url="previewUrl"
      title="实时监控预览"
      @closeProof="viewProof = false"
    />
  </div>
</template>

<script>
import { deptTreeSelect } from '@/api/system/user'
import devicewarning from './components/device-warning.vue'
import RTSPPlayer from '@/components/RTSPPlayer'
import { getDeviceList, previewDeviceMonitor, startDeviceMonitor, stopDeviceMonitor } from '@/api/device'

export default {
  components: { devicewarning, RTSPPlayer },
  data() {
    return {
      loading: true,
      total: 0,
      warningTitle: '',
      device_id: '',
      queryParams: {
        ape_id: undefined,
        name: undefined,
        is_online: undefined,
        org_index: undefined
      },
      deviceList: [],
      deviceListShow: true,
      viewProof: false,
      previewUrl: '',
      onlineOptions: [
        { value: '0', label: '离线/停用' },
        { value: '1', label: '在线/启用' },
        { value: '2', label: '离线/停用' },
        { value: '9', label: '其他/异常' }
      ],
      pageOp: {
        pageNum: 1,
        pageSize: 10
      },
      auth: '',
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,

      deptOptions: undefined,
      queryDeptOptions: [],
      // 是否显示弹出层
      open: false,

      // 表单参数
      form: {}
    }
  },

  computed: {
    deviceContainer() {
      return this.$refs['deviceContainer']
    }
  },

  mounted() {
    this.getDeptTree()
    this.$nextTick(() => {
      this.deviceContainer.parentNode.style.backgroundColor = 'white'
    })
    const isOnline = this.$route.query.isOnline
    if (isOnline) this.queryParams.is_online = isOnline
    this.fetchDeviceList()
  },

  methods: {
    async fetchDeviceList() {
      try {
        this.loading = true
        const response = await getDeviceList({ ...this.pageOp, ...this.queryParams })
        this.deviceList = response.rows
        this.total = response.total
        this.loading = false
        this.auth = response.token
      } catch (error) {
        console.error(error)
      }
    },

    handleQuery() {
      this.pageOp.pageNum = 1
      this.fetchDeviceList()
    },

    resetQuery() {
      this.resetForm('queryForm')
      this.queryParams.org_index = undefined
      this.handleQuery()
    },

    returnType(type) {
      switch (type) {
        case '1':
          return '网络摄像机(IPC)'
        case '2':
          return '网络硬盘录像机(NVR)'
        case '3':
          return '硬盘录像机(DVR)'
        case '4':
          return '车载硬盘录像机(MDVR)'
        case '6':
          return '全景球'
        case '9':
          return '热成像摄像头'
        default:
          return '未知类型'
      }
    },

    returnStatus(status) {
      switch (status) {
        case '0':
          return '离线/停用'
        case '1':
          return '在线/启用'
        case '2':
          return '离线/停用'
        case '9':
          return '其他/异常'
        default:
          return '未知状态'
      }
    },

    returnResource(type) {
      switch (type) {
        case '1':
          return '编码器'
        case '3':
          return '解码器'
        default:
          return '未知类型'
      }
    },

    getDeptTree() {
      deptTreeSelect().then(response => {
        this.deptOptions = response.data || []
        this.queryDeptOptions = this.buildQueryDeptOptions(this.deptOptions)
      })
    },
    buildQueryDeptOptions(nodes, parentLabel = '') {
      const options = [];
      (nodes || []).forEach(node => {
        const value = node.org_index || node.id
        const currentLabel = node.label || node.deptName || node.org_name
        if (value !== undefined && currentLabel) {
          const label = parentLabel ? `${parentLabel} / ${currentLabel}` : currentLabel
          options.push({ value, label })
          if (node.children && node.children.length) {
            options.push(...this.buildQueryDeptOptions(node.children, label))
          }
        } else if (node.children && node.children.length) {
          options.push(...this.buildQueryDeptOptions(node.children, parentLabel))
        }
      })
      return options
    },

    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.userId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },

    async startMonitor(row) {
      try {
        // 后端按 stream_source_type 分派 DIRECT 代理或 GB28181 INVITE，页面保持统一操作入口。
        const response = await startDeviceMonitor(row.ape_id)
        const payload = (response && response.data && typeof response.data === 'object') ? response.data : {}
        const shortMessage = payload.shortMessage || '已启动监控，可在本页预览视频。'
        this.$message({
          type: Object.prototype.hasOwnProperty.call(payload, 'success') && !payload.success ? 'warning' : 'success',
          message: shortMessage
        })
      } catch (error) {
        this.$modal.msgError('启动监控失败，请稍后重试')
      }
    },

    async stopMonitor(row) {
      try {
        const response = await stopDeviceMonitor(row.ape_id)
        const payload = (response && response.data && typeof response.data === 'object') ? response.data : {}
        const hasSuccess = Object.prototype.hasOwnProperty.call(payload, 'success')
        const isFailed = hasSuccess && !payload.success
        const shortMessage = payload.shortMessage || (isFailed ? '停止监控失败，请稍后重试' : '已停止监控。')
        this.$message({
          type: isFailed ? 'warning' : 'success',
          message: shortMessage
        })
      } catch (error) {
        this.$modal.msgError('停止监控失败，请稍后重试')
      }
    },

    extractPreviewUrl(response) {
      const data = response && response.data ? response.data : response
      if (!data) return ''
      return data.playUrl || data.previewUrl || data.url || data.streamUrl || data.rtspUrl || data.flvUrl || ''
    },

    normalizeLocalPreviewUrl(url) {
      // 仅在本机验收时把 WVP 返回的回环地址对齐到当前浏览器主机，生产地址保持不变。
      if (!url || !['localhost', '127.0.0.1'].includes(window.location.hostname)) return url
      try {
        const parsed = new URL(url)
        if (['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol)) {
          parsed.hostname = window.location.hostname
          return parsed.toString()
        }
      } catch (error) {
        return url
      }
      return url
    },

    async previewMonitor(row) {
      try {
        const response = await previewDeviceMonitor(row.ape_id)
        // GB28181 必须先启动监控生成临时播放地址；DIRECT 设备仍由后端提供原兼容地址。
        const playUrl = this.normalizeLocalPreviewUrl(this.extractPreviewUrl(response))
        if (!playUrl) {
          this.$modal.msgWarning('暂无可播放地址，请先启动监控后重试')
          return
        }
        this.previewUrl = playUrl
        this.viewProof = true
      } catch (error) {
        this.$modal.msgError((error && error.message) || '获取预览地址失败，请稍后重试')
      }
    },

    warningHistory(row) {
      this.device_id = row.ape_id || row.apeId || row.place
      this.deviceListShow = false
      this.warningTitle = `正在查看「${row.name}」的历史报警信息`
    }
  }
}
</script>

<style scoped>
::v-deep .operation-column .cell {
  white-space: nowrap;
}

::v-deep .operation-column .el-button + .el-button {
  margin-left: 6px;
}

::v-deep .operation-column .el-button--text {
  padding: 0;
}
</style>

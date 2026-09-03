<template>
  <div id="templateChart" ref="templateChart" class="templateChart" />
</template>

<script>
import * as echarts from 'echarts'

export default {
  props: {
    option: {
      type: Object,
      require: true
    }
  },
  data() {
    return {
      templateChart: null
    }
  },
  methods: {
    initChart() {
      const dom = this.$refs['templateChart']
      this.templateChart = echarts.init(dom)
      this.setOption()
    },
    setOption() {
      this.templateChart.setOption(this.option)
    }
  }
}
</script>

<style scoped>
.templateChart {
  width: 100%;
  height: 100%;
}
</style>

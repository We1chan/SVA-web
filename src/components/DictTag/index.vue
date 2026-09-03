<template>
  <div>
    <template v-for="(item, index) in options">
      <template v-if="values.includes(item.value)">
        <span
          v-if="(item.raw.listClass == 'default' || item.raw.listClass == '') && (item.raw.cssClass == '' || item.raw.cssClass == null)"
          :key="item.value"
          :index="index"
          :class="item.raw.cssClass"
        >{{ item.label + ' ' }}</span>
        <el-tag
          v-else
          :key="item.value"
          :disable-transitions="true"
          :index="index"
          :type="item.raw.listClass == 'primary' ? '' : item.raw.listClass"
          :class="item.raw.cssClass"
        >
          {{ item.label + ' ' }}
        </el-tag>
      </template>
    </template>
    <template v-if="unmatch && showValue">
      {{ unmatchArray | handleArray }}
    </template>
  </div>
</template>

<script>
export default {
  name: 'DictTag',
  filters: {
    handleArray(array) {
      if (array.length === 0) return ''
      return array.reduce((pre, cur) => {
        return pre + ' ' + cur
      })
    }
  },
  props: {
    options: {
      type: Array,
      default: null
    },
    value: [Number, String, Array],
    // 当未找到匹配的数据时，显示value
    showValue: {
      type: Boolean,
      default: true
    },
    separator: {
      type: String,
      default: ','
    }
  },
  computed: {
    values() {
      if (this.value === null || typeof this.value === 'undefined' || this.value === '') return []
      return Array.isArray(this.value) ? this.value.map(item => '' + item) : String(this.value).split(this.separator)
    },
    unmatchArray() {
      if (!this.options || this.options.length === 0) return []
      return this.values.filter(item => !this.options.some(option => option.value === item))
    },
    unmatch() {
      return this.unmatchArray.length > 0
    }

  }
}
</script>
<style scoped>
.el-tag + .el-tag {
  margin-left: 10px;
}
</style>

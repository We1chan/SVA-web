<template>
  <router-link class="console-brand" to="/" aria-label="easySVA 首页">
    <span class="brand-symbol"><i class="el-icon-view" /></span>
    <span v-if="!collapse" class="brand-word">easy<span>SVA</span><small>智能视频分析平台</small></span>
  </router-link>
</template>
<script>
export default { name: 'SidebarLogo', props: { collapse: { type: Boolean, required: true }}}
</script>
<style scoped>
.console-brand { height: 88px; display: flex !important; align-items: center; gap: 11px; padding: 0 24px; color: #f0f5f1; }
.brand-symbol { width: 33px; height: 33px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #9fbd90; border-radius: 10px; color: #c1dca6; font-size: 23px; }
.brand-word { font-size: 23px; letter-spacing: -.8px; font-weight: 600; line-height: 1.2; }
.brand-word > span { color: #bbd4a8; font-weight: 400; }
.brand-word small { display: block; margin-top: 6px; font-size: 9px; letter-spacing: 2px; font-weight: 400; color: #8ea596; }
.hideSidebar .console-brand { padding: 0 10px; }
</style>

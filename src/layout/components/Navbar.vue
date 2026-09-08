<template>
  <header class="navbar">
    <div class="nav-left">
      <button class="nav-toggle" aria-label="展开或收起导航" @click="toggleSideBar"><i class="el-icon-s-fold" /></button>
      <breadcrumb v-if="!topNav" /><top-nav v-else />
    </div>
    <div class="nav-right">
      <span class="nav-date">{{ today }}</span>
      <router-link class="monitor-link" to="/dping"><i class="el-icon-video-camera" /> 监控中心 <i class="el-icon-top-right" /></router-link>
      <span class="nav-divider" />
      <el-dropdown trigger="click" @command="handleCommand">
        <button class="user-menu"><span class="user-initial">{{ (name || 'U').slice(0, 1).toUpperCase() }}</span><span class="user-name">{{ name }}</span><i class="el-icon-arrow-down" /></button>
        <el-dropdown-menu slot="dropdown"><el-dropdown-item command="profile">个人中心</el-dropdown-item><el-dropdown-item command="logout" divided>退出登录</el-dropdown-item></el-dropdown-menu>
      </el-dropdown>
    </div>
  </header>
</template>
<script>
import { mapGetters } from 'vuex'
import Breadcrumb from '@/components/Breadcrumb'
import TopNav from '@/components/TopNav'
export default {
  components: { Breadcrumb, TopNav },
  computed: {
    ...mapGetters(['name']),
    topNav() { return this.$store.state.settings.topNav },
    today() { return new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }) }
  },
  methods: {
    toggleSideBar() { this.$store.dispatch('app/toggleSideBar') },
    handleCommand(command) {
      if (command === 'profile') return this.$router.push('/user/profile')
      this.$modal.confirm('确定退出当前账号吗？').then(() => this.$store.dispatch('LogOut')).then(() => { location.href = '/index' }).catch(() => {})
    }
  }
}
</script>
<style scoped>
.navbar { height: 72px; padding: 0 32px 0 20px; display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid #e8ebef; gap: 16px; }
.nav-left, .nav-right { display: flex; align-items: center; gap: 20px; min-width: 0; }
.nav-toggle, .user-menu { border: 0; background: transparent; cursor: pointer; color: #697585; }
.nav-toggle { padding: 8px; font-size: 19px; }
.nav-date { font-size: 12px; color: #8b949e; }
.monitor-link { color: #3b6353; font-size: 12px; display: flex; align-items: center; gap: 7px; }
.nav-divider { height: 22px; width: 1px; background: #e8ebef; }
.user-menu { display: flex; align-items: center; gap: 9px; font-size: 12px; }
.user-initial { display: grid; place-items: center; width: 32px; height: 32px; background: #eef2e9; color: #55724c; border-radius: 50%; font-weight: 600; }
@media (max-width: 900px) { .nav-date { display: none; } .navbar { padding-right: 18px; } }
@media (max-width: 600px) { .nav-right { gap: 10px; } .user-name, .nav-divider { display: none; } .navbar { padding-left: 8px; } }
</style>

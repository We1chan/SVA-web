<template>
  <main class="login-page">
    <section class="login-story"><div class="login-brand"><i class="el-icon-view" /> easy<span>SVA</span></div><div class="login-story-copy"><span class="eyebrow">INTELLIGENCE FOR A SAFER WORLD</span><h1>看见每一刻，<br>守护每一处。</h1><p>让视频拥有洞察力。<br>从风险感知到事件处置，安全始终在线。</p></div><div class="login-orbits" aria-hidden="true"><span /><span /><span /><i class="el-icon-view" /></div><div class="login-story-bottom"><span>感知 · 分析 · 守护</span><span>01 / VISION</span></div></section>
    <section class="login-form-side"><div class="login-form-wrap"><span class="eyebrow">WELCOME TO EASYSVA</span><h2>欢迎回来</h2><p class="login-subtitle">登录你的安全运营工作空间</p>
      <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form" label-position="top" @submit.native.prevent="handleLogin">
        <el-form-item label="账号" prop="username"><el-input v-model="loginForm.username" autocomplete="username" placeholder="请输入账号"><i slot="prefix" class="el-input__icon el-icon-user" /></el-input></el-form-item>
        <el-form-item label="密码" prop="password"><el-input v-model="loginForm.password" type="password" autocomplete="current-password" show-password placeholder="请输入密码"><i slot="prefix" class="el-input__icon el-icon-lock" /></el-input></el-form-item>
        <el-form-item v-if="captchaEnabled" label="验证码" prop="code"><div class="captcha-row"><el-input v-model="loginForm.code" placeholder="请输入验证码" /><button type="button" aria-label="刷新验证码" @click="getCode"><img :src="codeUrl" alt="验证码"></button></div></el-form-item>
        <el-form-item><el-button :loading="loading" type="primary" native-type="submit" class="login-submit">{{ loading ? '正在登录…' : '进入工作空间' }} <i v-if="!loading" class="el-icon-right" /></el-button></el-form-item>
      </el-form><div class="login-assistance"><i class="el-icon-lock" /> 仅限授权用户访问</div></div><footer>© {{ new Date().getFullYear() }} easySVA. All rights reserved.</footer></section>
  </main>
</template>
<script>
import { getCodeImg } from '@/api/login'
import Cookies from 'js-cookie'
import { encrypt, decrypt } from '@/utils/jsencrypt'

export default {
  name: 'Login',
  data() {
    return {
      codeUrl: '',
      loginForm: {
        username: '',
        password: '',
        rememberMe: false,
        code: '',
        uuid: ''
      },
      loginRules: {
        username: [
          { required: true, trigger: 'blur', message: '请输入您的账号' }
        ],
        password: [
          { required: true, trigger: 'blur', message: '请输入您的密码' }
        ],
        code: [{ required: true, trigger: 'change', message: '请输入验证码' }]
      },
      loading: false,
      // 验证码开关
      captchaEnabled: true,
      redirect: undefined
    }
  },
  watch: {
    $route: {
      handler: function(route) {
        this.redirect = route.query && route.query.redirect
      },
      immediate: true
    }
  },
  created() {
    this.getCode()
    this.getCookie()
  },
  methods: {
    getCode() {
      getCodeImg().then(res => {
        this.captchaEnabled = res.captchaEnabled === undefined ? true : res.captchaEnabled
        if (this.captchaEnabled) {
          this.codeUrl = 'data:image/gif;base64,' + res.img
          this.loginForm.uuid = res.uuid
        }
      })
    },
    getCookie() {
      const username = Cookies.get('username')
      const password = Cookies.get('password')
      const rememberMe = Cookies.get('rememberMe')
      this.loginForm = {
        ...this.loginForm,
        username: username === undefined ? this.loginForm.username : username,
        password: password === undefined ? this.loginForm.password : decrypt(password),
        rememberMe: rememberMe === undefined ? false : Boolean(rememberMe)
      }
    },
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true
          if (this.loginForm.rememberMe) {
            Cookies.set('username', this.loginForm.username, { expires: 30 })
            Cookies.set('password', encrypt(this.loginForm.password), { expires: 30 })
            Cookies.set('rememberMe', this.loginForm.rememberMe, { expires: 30 })
          } else {
            Cookies.remove('username')
            Cookies.remove('password')
            Cookies.remove('rememberMe')
          }
          this.$store.dispatch('Login', this.loginForm).then(() => {
            // 登录成功，跳转大屏
            // this.$router.push({ path: this.redirect || "/dping" }).catch(()=>{});
            this.$router.push({ path: this.redirect || '/index' }).catch(() => { })
          }).catch(() => {
            this.loading = false
            if (this.captchaEnabled) {
              this.getCode()
            }
          })
        }
      })
    }
  }
}
</script>
<style lang="scss">
@import "./login.scss";
</style>

const state = {
  dict: []
}
const mutations = {
  SET_DICT: (state, { key, value }) => {
    if (key !== null && key !== '') {
      state.dict.push({
        key: key,
        value: value
      })
    }
  },
  REMOVE_DICT: (state, key) => {
    try {
      for (let i = 0; i < state.dict.length; i++) {
        if (String(state.dict[i].key) === String(key)) {
          state.dict.splice(i, 1)
          return true
        }
      }
    } catch (e) {
      // 解析失败时忽略，返回空数组
    }
  },
  CLEAN_DICT: (state) => {
    state.dict = []
  }
}

const actions = {
  // 设置字典
  setDict({ commit }, data) {
    commit('SET_DICT', data)
  },
  // 删除字典
  removeDict({ commit }, key) {
    commit('REMOVE_DICT', key)
  },
  // 清空字典
  cleanDict({ commit }) {
    commit('CLEAN_DICT')
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}


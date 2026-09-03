<template>
  <div class="lr_titles">
    <div v-if="title !== ''" class="item_title">
      <div class="title-inner" style="font-size: large;" :style="{ left : titleOffsetX, top: titleOffsetY }"> &nbsp;&nbsp;{{ title }}&nbsp;&nbsp; </div>
    </div>
    <div :class="title !== '' ? 'item_title_content' : 'item_title_content_def'">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: () => ''
    },
    titleOffsetX: {
      type: String,
      required: false
    },
    titleOffsetY: {
      type: String,
      required: false
    }
  },
  data() {
    return {}
  },
  created() { },

  mounted() { },
  methods: {}
}
</script>

<style lang='scss' scoped>
$item-title-height: 56px;
$item_title_content-height: calc(100% - 38px);

.lr_titles {
  margin: 5px;
  box-sizing: border-box;

  :deep(.border-box-content) {
    box-sizing: border-box;
    padding: 6px 16px 0px;
  }

  .item_title {
    height: $item-title-height;
    line-height: $item-title-height;
    width: 100%;
    color: #31abe3;
    // background: linear-gradient(to right, transparent, #0f0756, transparent);
    position: relative;

    .zuo,
    .you {
      width: 58px;
      height: 14px;
      background-image: url("../../assets/img/titles/zuo.png");
      margin-left: 10px;
      margin-right: 10px;
    }

    .you {
      transform: rotate(180deg);
    }

    .title-inner {
      font-weight: 900;
      letter-spacing: 2px;
      background: #FFFFFF;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      position: absolute;
      left: 71px;
      top:2px
    }
  }

  .item_title_content {
    height: $item_title_content-height;
  }

  .item_title_content_def {
    width: 100%;
    height: 100%;
  }
}
</style>

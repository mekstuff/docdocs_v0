import DefaultTheme from "vitepress/theme";
import DBadge from "./components/DBadge.vue";

export default {
  extends: DefaultTheme,
  enhanceApp(ctx) {
    ctx.app.component("DBadge", DBadge);
  },
};

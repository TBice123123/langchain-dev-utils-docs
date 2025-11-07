import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";

import "./style.css";
import StepItem from "../components/StepItem.vue";
import Params from "../components/Params.vue";
import BestPractice from "../components/BestPractice.vue";
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("StepItem", StepItem);
    app.component("Params", Params);
    app.component("BestPractice", BestPractice);
  },
} satisfies Theme;

import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/langchain-dev-utils-docs/",

  title: "langchain dev utils",
  description:
    "A comprehensive utility library for developers building applications with langchain and langgraph",

  // Enable dark mode with user preference as default
  appearance: true,

  themeConfig: {
    outline: {
      level: [2, 3],
    },
  },

  locales: {
    en: {
      label: "English",
      lang: "en",
      link: "/en/",
      themeConfig: {
        nav: [
          { text: "Home", link: "/en/" },
          { text: "Getting Started", link: "/en/getting-started" },
          { text: "Documentation", link: "/en/installation" },
          { text: "API Reference", link: "/en/api-reference" },
          { text: "Example", link: "/en/example" },
        ],

        sidebar: [
          {
            text: "Home",
            items: [{ text: "Home", link: "/en/" }],
          },
          {
            text: "Getting Started",
            items: [{ text: "Getting Started", link: "/en/getting-started" }],
          },
          {
            text: "Documentation",
            items: [
              { text: "Installation", link: "/en/installation" },
              { text: "Model Management", link: "/en/model-management" },
              { text: "Message Processing", link: "/en/message-processing" },
              { text: "Tool Enhancement", link: "/en/tool-enhancement" },
              { text: "Context Engineering", link: "/en/context-engineering" },
              {
                text: "StateGraph Orchestration",
                link: "/en/graph-orchestration",
              },
              {
                text: "Prebuilt Agent",
                link: "/en/prebuilt",
              },
            ],
          },
          {
            text: "API Reference",
            items: [{ text: "API Reference", link: "/en/api-reference" }],
          },
          {
            text: "Example",
            items: [{ text: "Example", link: "/en/example" }],
          },
        ],

        socialLinks: [
          {
            icon: "github",
            link: "https://github.com/TBice123123/langchain-dev-utils",
          },
        ],
      },
    },
    zh: {
      label: "中文",
      lang: "zh-CN",
      link: "/zh/",
      themeConfig: {
        nav: [
          { text: "Home", link: "/zh/" },
          { text: "快速开始", link: "/zh/getting-started" },
          { text: "文档", link: "/zh/installation" },
          { text: "API 参考", link: "/zh/api-reference" },
          { text: "使用示例", link: "/zh/example" },
        ],

        sidebar: [
          {
            text: "Home",
            items: [{ text: "Home", link: "/zh/" }],
          },
          {
            text: "快速开始",
            items: [{ text: "快速开始", link: "/zh/getting-started" }],
          },
          {
            text: "文档",
            items: [
              { text: "安装", link: "/zh/installation" },
              { text: "模型管理", link: "/zh/model-management" },
              { text: "消息处理", link: "/zh/message-processing" },
              { text: "工具增强", link: "/zh/tool-enhancement" },
              { text: "上下文工程", link: "/zh/context-engineering" },
              {
                text: "状态图编排",
                link: "/zh/graph-orchestration",
              },
              {
                text: "预构建 Agent",
                link: "/zh/prebuilt",
              },
            ],
          },
          {
            text: "API 参考",
            items: [{ text: "API 参考", link: "/zh/api-reference" }],
          },
          {
            text: "使用示例",
            items: [{ text: "使用示例", link: "/zh/example" }],
          },
        ],

        socialLinks: [
          {
            icon: "github",
            link: "https://github.com/TBice123123/langchain-dev-utils",
          },
        ],
      },
    },
  },

  // Markdown container labels for Chinese
  markdown: {
    container: {
      tipLabel: "提示",
      warningLabel: "警告",
      dangerLabel: "危险",
      infoLabel: "信息",
      detailsLabel: "详细信息",
    },
  },
});

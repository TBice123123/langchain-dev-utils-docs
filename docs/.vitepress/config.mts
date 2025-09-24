import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/langchain-dev-utils-docs/",

  title: "LangChain Dev Utils",
  description:
    "A comprehensive utility library for developers building applications with LangChain and LangGraph",
  
  // Enable dark mode with user preference as default
  appearance: true,

  themeConfig: {
    outline: {
      level: [2, 3]
    }
  },

  locales: {
    en: {
      label: "English",
      lang: "en",
      link: "/en/",
      themeConfig: {
        nav: [
          { text: "Getting Started", link: "/en/getting-started" },
          { text: "Installation", link: "/en/installation" },
          { text: "API Reference", link: "/en/api-reference" },
        ],

        sidebar: [
          {
            text: "Documentation",
            items: [
              { text: "Getting Started", link: "/en/getting-started" },
              { text: "Installation", link: "/en/installation" },
              { text: "Model Management", link: "/en/model-management" },
              { text: "Message Processing", link: "/en/message-processing" },
              { text: "Tool Enhancement", link: "/en/tool-enhancement" },
              { text: "Context Engineering", link: "/en/context-engineering" },
              {
                text: "StateGraph Orchestration",
                link: "/en/graph-orchestration",
              },
              { text: "API Reference", link: "/en/api-reference" },
              { text: "Example", link: "/en/example" },
            ],
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
          { text: "入门指南", link: "/zh/getting-started" },
          { text: "安装", link: "/zh/installation" },
          { text: "API 参考", link: "/zh/api-reference" },
        ],

        sidebar: [
          {
            text: "文档",
            items: [
              { text: "入门指南", link: "/zh/getting-started" },
              { text: "安装", link: "/zh/installation" },
              { text: "模型管理", link: "/zh/model-management" },
              { text: "消息处理", link: "/zh/message-processing" },
              { text: "工具增强", link: "/zh/tool-enhancement" },
              { text: "上下文工程", link: "/zh/context-engineering" },
              {
                text: "状态图编排",
                link: "/zh/graph-orchestration",
              },
              { text: "API 参考", link: "/zh/api-reference" },
              { text: "使用示例", link: "/zh/example" },
            ],
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

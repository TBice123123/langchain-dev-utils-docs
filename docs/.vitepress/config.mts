import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/langchain-dev-utils-docs/",

  title: "Langchain-Dev-Utils Docs",
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
          { text: "Overview", link: "/en/" },
          { text: "Learning", link: "/en/installation" },
          { text: "API Reference", link: "/en/api-reference" },
        ],

        sidebar: [
          {
            text: "Overview",
            items: [
              { text: "langchain-dev-utils", link: "/en/" },
              { text: "Installation", link: "/en/installation" },
            ],
          },
          {
            text: "Learning",
            items: [
              { text: "Model Management", link: "/en/model-management" },
              { text: "Message Conversion", link: "/en/message-conversion" },
              { text: "Tool Calling", link: "/en/tool-calling" },
              { text: "Agent Development", link: "/en/agent-development" },
              {
                text: "StateGraph Orchestration",
                link: "/en/graph-orchestration",
              },
            ],
          },
          {
            text: "API Reference",
            items: [
              { text: "agent", link: "/en/api-reference/agent" },
              { text: "chat_model", link: "/en/api-reference/chat_model" },
              { text: "embeddings", link: "/en/api-reference/embeddings" },
              {
                text: "message_convert",
                link: "/en/api-reference/message_convert",
              },
              { text: "pipeline", link: "/en/api-reference/pipeline" },
              { text: "tool-calling", link: "/en/api-reference/tool-calling" },
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
          { text: "概述", link: "/zh/" },
          { text: "学习", link: "/zh/installation" },
          { text: "API 参考", link: "/zh/api-reference" },
        ],

        sidebar: [
          {
            text: "概述",
            items: [
              { text: "langchain-dev-utils", link: "/zh/" },
              { text: "安装", link: "/zh/installation" },
            ],
          },
          {
            text: "学习",
            items: [
              { text: "模型管理", link: "/zh/model-management" },
              { text: "消息转换", link: "/zh/message-conversion" },
              { text: "工具调用", link: "/zh/tool-calling" },
              { text: "Agent 开发", link: "/zh/agent-development" },
              {
                text: "状态图编排",
                link: "/zh/graph-orchestration",
              },
            ],
          },
          {
            text: "API 参考",
            items: [
              {
                text: "agent",
                link: "/zh/api-reference/agent",
              },
              {
                text: "chat_model",
                link: "/zh/api-reference/chat_model",
              },
              {
                text: "embeddings",
                link: "/zh/api-reference/embeddings",
              },
              {
                text: "message_convert",
                link: "/zh/api-reference/message_convert",
              },
              {
                text: "pipeline",
                link: "/zh/api-reference/pipeline",
              },
              {
                text: "tool-calling",
                link: "/zh/api-reference/tool-calling",
              },
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

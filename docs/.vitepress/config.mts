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
      level: [1, 2],
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
          { text: "Learning", link: "/en/model-management/chat" },
          { text: "API Reference", link: "/en/api-reference/agent" },
        ],

        sidebar: [
          {
            text: "Overview",
            collapsed: true,
            items: [
              { text: "langchain-dev-utils", link: "/en/" },
              { text: "Installation", link: "/en/installation" },
            ],
          },
          {
            text: "Learning",
            collapsed: true,
            items: [
              {
                text: "model-management",
                items: [
                  { text: "chat", link: "/en/model-management/chat" },
                  {
                    text: "embedding",
                    link: "/en/model-management/embedding",
                  },
                ],
              },
              {
                text: "message-conversion",
                items: [
                  {
                    text: "message process",
                    link: "/en/message-conversion/message",
                  },
                  {
                    text: "format sequence",
                    link: "/en/message-conversion/format",
                  },
                ],
              },
              {
                text: "tool-calling",
                items: [
                  {
                    text: "human-in-loop support",
                    link: "/en/tool-calling/human-in-loop",
                  },
                  {
                    text: "Tool calling process",
                    link: "/en/tool-calling/tool",
                  },
                ],
              },
              {
                text: "agent-development",
                items: [
                  {
                    text: "prebuilt agent",
                    link: "/en/agent-development/prebuilt",
                  },
                  {
                    text: "middleware",
                    link: "/en/agent-development/middleware",
                  },
                ],
              },
              {
                text: "graph-orchestration",
                items: [
                  {
                    text: "pipeline",
                    link: "/en/graph-orchestration/pipeline",
                  },
                ],
              },
            ],
          },
          {
            text: "API Reference",
            collapsed: true,
            items: [
              { text: "agent", link: "/en/api-reference/agent" },
              { text: "chat_model", link: "/en/api-reference/chat_model" },
              { text: "embeddings", link: "/en/api-reference/embeddings" },
              {
                text: "message_convert",
                link: "/en/api-reference/message_convert",
              },
              { text: "pipeline", link: "/en/api-reference/pipeline" },
              { text: "tool_calling", link: "/en/api-reference/tool_calling" },
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
          { text: "学习", link: "/zh/model-management/chat" },
          { text: "API 参考", link: "/zh/api-reference/agent" },
        ],

        sidebar: [
          {
            text: "概述",
            collapsed: true,
            items: [
              { text: "langchain-dev-utils", link: "/zh/" },
              { text: "安装", link: "/zh/installation" },
            ],
          },
          {
            text: "学习",
            collapsed: true,
            items: [
              {
                text: "模型管理",
                items: [
                  { text: "对话模型管理", link: "/zh/model-management/chat" },
                  {
                    text: "嵌入模型管理",
                    link: "/zh/model-management/embedding",
                  },
                ],
              },
              {
                text: "消息转换",
                items: [
                  {
                    text: "消息处理",
                    link: "/zh/message-conversion/message",
                  },
                  {
                    text: "格式化列表内容",
                    link: "/zh/message-conversion/format",
                  },
                ],
              },
              {
                text: "工具调用",
                items: [
                  {
                    text: "添加人在回路支持",
                    link: "/zh/tool-calling/human-in-loop",
                  },
                  {
                    text: "工具调用过程处理",
                    link: "/zh/tool-calling/tool",
                  },
                ],
              },
              {
                text: "Agent 开发",
                items: [
                  {
                    text: "预构建 Agent",
                    link: "/zh/agent-development/prebuilt",
                  },
                  { text: "中间件", link: "/zh/agent-development/middleware" },
                ],
              },
              {
                text: "状态图编排",
                items: [
                  {
                    text: "编排管道",
                    link: "/zh/graph-orchestration/pipeline",
                  },
                ],
              },
            ],
          },
          {
            text: "API 参考",
            collapsed: true,
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
                text: "tool_calling",
                link: "/zh/api-reference/tool_calling",
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

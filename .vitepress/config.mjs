import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/docs/",
  head: [["link", { rel: "icon", href: "/docs/logo.svg" }]],
  title: "Mars星球",
  description: "A VitePress Site",
  themeConfig: {
    logo: '/logo.svg',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '主页', link: '/' },
      { text: '示例', link: '/markdown-examples' },
      {
        text: '教程', items: [
          { text: 'VitePress博客搭建', link: '/tutorial/vitepress' },
          { text: 'Git使用教程', link: '/tutorial/git' },
        ]
      }
    ],

    // 右侧导航栏
    outlineTitle: '文章目录',
    outline: [2, 6], // 目录显示2-6级标题

    sidebar: false, // 关闭侧边栏
    aside: "left", // 设置右侧侧边栏在左侧显示

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yongwang12138' }
    ],
    // 底部配置
    footer: {
      copyright: 'Copyright © 2025 Mars星球'
    },
    // 设置搜索框的样式
    search: {
      provider: "local",
      options: {
        translations: {
          button: {
            buttonText: "搜索文档",
            buttonAriaLabel: "搜索文档",
          },
          modal: {
            noResultsText: "无法找到相关结果",
            resetButtonTitle: "清除查询条件",
            footer: {
              selectText: "选择",
              navigateText: "切换",
            },
          },
        },
      },
    },
  }
})

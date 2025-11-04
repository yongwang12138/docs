import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

// https://vitepress.dev/reference/site-config
export default withMermaid(defineConfig({
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
      { text: 'Linux', link: '/docs/linux/base' },
      {
        text: '教程', items: [
          { text: 'VitePress博客搭建', link: '/docs/tutorial/vitepress' },
          { text: 'Git使用教程', link: '/docs/tutorial/git' },
          { text: 'Go环境搭建', link: '/docs/tutorial/go' },
          { text: '树莓派教程', link: '/docs/tutorial/raspberrypi' },
          { text: 'Beyond Compare', link: '/docs/tutorial/compare' },
          { text: 'M3U8转MP4', link: '/docs/tutorial/m3u8' },
        ]
      }
    ],

    // 右侧导航栏
    outlineTitle: '文章目录',
    outline: [2, 6], // 目录显示2-6级标题

    sidebar: {
      "/docs/linux/": [
        {
            text: "Linux教程",
            items: [
              { text: 'Linux基础', link: '/docs/linux/base' },
              { text: 'Linux配置固定IP', link: '/docs/linux/nmtui' },
              { text: 'Linux识别U盘', link: '/docs/linux/usb-mount' },
            ],
        },
      ],
      "/docs/tutorial/": [
        {
            text: "教程",
            items: [
              { text: 'VitePress博客搭建', link: '/docs/tutorial/vitepress' },
              { text: 'Git使用教程', link: '/docs/tutorial/git' },
              { text: 'Go环境搭建', link: '/docs/tutorial/go' },
              { text: '树莓派教程', link: '/docs/tutorial/raspberrypi' },
              { text: 'Beyond Compare', link: '/docs/tutorial/compare' },
              { text: 'M3U8转MP4', link: '/docs/tutorial/m3u8' },
            ],
        },
      ],
    },

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
  },

  // 配置 Mermaid 全局选项（如主题、字体等）
  mermaid: {
    theme: 'white'
  }
}))

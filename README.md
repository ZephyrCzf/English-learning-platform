# English Learning Platform

一个现代化的英语学习平台，帮助用户提高英语水平。

## 功能特点

- 用户认证和授权
- 个性化学习路径
- 进度跟踪
- 互动练习
- 实时反馈

## 技术栈

### 前端
- Vue.js
- Vue Router
- Vuex
- Axios
- Tailwind CSS

### 后端
- Node.js
- Express.js
- MySQL
- JWT认证

## 开始使用

### 前提条件
- Node.js (v14+)
- MySQL (v8+)
- npm 或 yarn

### 安装步骤

1. 克隆仓库
```bash
git clone [repository-url]
cd english-learning-platform
```

2. 安装依赖
```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

3. 配置环境变量
- 在 backend 目录下创建 .env 文件
- 在 frontend 目录下创建 .env 文件
- 参考 .env.example 文件配置必要的环境变量

4. 启动开发服务器
```bash
# 启动后端服务器
cd backend
npm run dev

# 启动前端服务器
cd frontend
npm run dev
```

## 项目结构
```
english-learning-platform/
├── backend/           # 后端代码
│   ├── routes/       # API路由
│   ├── services/     # 业务逻辑
│   └── schema.sql    # 数据库结构
├── frontend/         # 前端代码
│   ├── src/         # 源代码
│   └── public/      # 静态资源
└── README.md        # 项目文档
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License - 详见 LICENSE 文件

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。 
# ValgACE Dashboard - ACE 设备管理网页界面

现代化的网页界面，用于通过 Moonraker API 管理和监控 Anycubic Color Engine Pro 设备。

## 描述

ValgACE Dashboard 是一个功能完整的网页界面，提供：

- ✅ **状态监控** - 实时显示设备状态
- ✅ **料槽管理** - 加载/卸载耗材，停车到热端
- ✅ **送料辅助** - 为每个料槽启用/禁用送料辅助，并有状态视觉指示
- ✅ **烘干管理** - 启动和停止耗材烘干过程
- ✅ **耗材送料/回退** - 手动控制送料和回退
- ✅ **WebSocket 连接** - 实时状态更新
- ✅ **响应式设计** - 在桌面和移动设备上均可使用
- ✅ **语言切换** - 内置俄语和英语界面切换器

## 目录结构

```
web-interface/
├── index.html                    # 主网页文件
├── README.md                     # Web 界面文档
│
├── js/                           # JavaScript 文件
│   ├── vue.global.js             # Vue.js 3 框架（本地）
│   └── ace-dashboard.js          # 主应用逻辑
│
├── css/                          # 样式表文件
│   └── ace-dashboard.css         # 主样式表
│
├── config/                       # 配置文件
│   └── ace-dashboard-config.js   # API 配置和常量
│
├── assets/                       # 静态资源
│   └── favicon.svg               # 网站图标
│
└── server/                       # 服务器配置
    └── ace_dashboard.nginx.conf  # Nginx 配置文件
```

### 文件说明

| 文件 | 说明 |
|------|------|
| `index.html` | 主网页入口，包含 Vue.js 应用的 HTML 结构 |
| `js/vue.global.js` | Vue.js 3 框架的全局构建版本，在浏览器中直接使用 |
| `js/ace-dashboard.js` | ValgACE Dashboard 的主应用文件，包含 Vue 应用逻辑、数据管理和事件处理 |
| `css/ace-dashboard.css` | 整个 Dashboard 的样式表，包括布局、颜色、响应式设计等 |
| `config/ace-dashboard-config.js` | API 地址、调试参数等配置，根据部署环境修改 |
| `assets/favicon.svg` | 网站在浏览器标签页显示的图标 |
| `server/ace_dashboard.nginx.conf` | Nginx 实际配置文件 |

## 安装

### 选项 1: 本地文件（用于测试）

1. 将整个界面目录复制到一个文件夹：
   ```bash
   mkdir -p ~/ace-dashboard
   cp -r ~/ValgACE/web-interface/* ~/ace-dashboard/
   ```

2. 通过网页服务器在浏览器中打开 `index.html`（不要通过 `file://`）

   **重要：** 要通过 `file://` 工作，需要配置 CORS 或使用网页服务器。

### 选项 2: 与 Mainsail/Fluidd 集成

#### 对于 Mainsail：

1. 将整个界面目录复制到 Mainsail 仪表盘目录：
   ```bash
   cp -r ~/ValgACE/web-interface/* ~/mainsail/src/dashboard/
   ```

2. 在 Mainsail 导航中添加链接（需要修改源代码）

#### 对于 Fluidd：

1. 将整个界面目录复制到 Fluidd 的 Web 根目录或静态资源目录。Fluidd 的安装目录没有统一的 `fluidd/dist` 路径，请根据您的安装位置和版本选择正确目录，例如：
   ```bash
   cp -r ~/ValgACE/web-interface/* ~/fluidd/
   ```
   或者复制到 Fluidd 的静态资源子目录。

2. 在 Fluidd 导航中添加链接。

### 选项 3: 独立网页服务器

1. 安装简单的 HTTP 服务器：
   ```bash
   # Python 3
   python3 -m http.server 8080
   
   # 或 Node.js
   npx http-server -p 8080
   ```

2. 在浏览器中打开：`http://localhost:8080/index.html`

### 选项 4: Nginx（推荐用于永久使用）

1. 将目录内容复制到网页服务器目录：
   ```bash
   sudo mkdir -p /var/www/ace-dashboard
   sudo cp -r ~/ValgACE/web-interface/* /var/www/ace-dashboard/
   ```

2. 使用 `server/ace_dashboard.nginx.conf` 中的配置：
   ```bash
   sudo cp server/ace_dashboard.nginx.conf /etc/nginx/sites-available/ace-dashboard
   sudo nano /etc/nginx/sites-available/ace-dashboard  # 编辑路径
   sudo ln -s /etc/nginx/sites-available/ace-dashboard /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

详情请参见 `server/ace_dashboard.nginx.conf` 配置文件。

## 使用

### 连接

界面会自动连接到当前主机的 Moonraker API。如果您本地打开文件，请确保：

1. Moonraker 已运行并可访问
2. 组件 `ace_status.py` 已安装并加载
3. 浏览器可以访问 Moonraker API（CORS 已配置）

### 配置 API 地址

编辑 `config/ace-dashboard-config.js` 文件：

```javascript
const ACE_DASHBOARD_CONFIG = {
    // 指定 Moonraker API 地址
    apiBase: 'http://192.168.1.100:7125',  // 您的 Moonraker IP 地址
    
    // 或使用自动检测（默认）
    // apiBase: window.location.origin,
    
    // 其他设置...
};
```

详情请参见 `config/ace-dashboard-config.js` 文件中的注释。

### 主要功能

#### 状态监控

- 设备状态显示在界面顶部
- 连接指示器显示 WebSocket 连接状态
- 每 5 秒自动更新

#### 料槽管理

- **加载** - 从料槽加载耗材（执行 `ACE_CHANGE_TOOL`）
- **停车** - 将耗材停车到热端（执行 `ACE_PARK_TO_TOOLHEAD`）
- **辅助** - 为料槽启用/禁用送料辅助（`ACE_ENABLE_FEED_ASSIST` / `ACE_DISABLE_FEED_ASSIST`）
  - 当该料槽的送料辅助激活时，按钮为绿色，文字为"辅助开启"
  - 当不激活时，按钮有绿色边框，文字为"辅助"
  - 启用新料槽时会自动关闭之前的料槽
- **送料** - 打开对话框以送料指定长度
- **回退** - 打开对话框以回退耗材指定长度

#### 烘干管理

1. 设置目标温度（20-55°C）
2. 设置烘干时长（分钟）
3. 点击"启动烘干"
4. 要停止，点击"停止"

#### 快速操作

- **卸载耗材** - 卸载当前耗材（`ACE_CHANGE_TOOL TOOL=-1`）
- **刷新状态** - 强制刷新设备状态

## API 端点

界面使用以下 Moonraker 端点：

- `GET /server/ace/status` - 获取设备状态
- `POST /server/ace/command` - 执行 ACE 命令

## WebSocket

界面连接到 Moonraker WebSocket 以获取实时更新：

```javascript
ws://your-moonraker-host:7125/websocket
```

连接时会自动订阅 ACE 状态更新。

## 要求

- 支持 ES6 和 WebSocket 的现代浏览器
- Vue.js 3（本地加载 `js/vue.global.js`）
- 访问 Moonraker API
- 已安装 `ace_status.py` 组件

## 故障排除

### 界面无法连接到 API

1. 检查 Moonraker 是否运行：
   ```bash
   systemctl status moonraker
   ```

2. 检查 `ace_status.py` 组件是否已加载：
   ```bash
   grep -i "ace_status" ~/printer_data/logs/moonraker.log
   ```

3. 检查 API 是否可访问：
   ```bash
   curl http://localhost:7125/server/ace/status
   ```

### WebSocket 无法连接

1. 检查 Moonraker WebSocket 是否可访问：
   ```bash
   wscat -c ws://localhost:7125/websocket
   ```

2. 检查 `moonraker.conf` 中的 CORS 设置：
   ```ini
   [cors_domains]
   *.local
   *.lan
   *:*
   ```

### 命令无法执行

1. 检查 Moonraker 日志：
   ```bash
   tail -f ~/printer_data/logs/moonraker.log
   ```

2. 检查 Klipper 日志：
   ```bash
   tail -f ~/printer_data/logs/klippy.log | grep -i ace
   ```

3. 确保命令正确形成（检查浏览器控制台）

### 启用调试

要诊断问题，在 `config/ace-dashboard-config.js` 中启用调试：

```javascript
const ACE_DASHBOARD_CONFIG = {
    // ...
    debug: true,  // 启用调试消息
    // ...
};
```

之后打开浏览器控制台（F12）并检查加载状态和执行命令时的消息。

## 自定义

### 更改颜色

编辑 `css/ace-dashboard.css` 以更改配色方案：

```css
/* 主色 */
.btn-primary {
    background: #667eea;  /* 更改为您自己的颜色 */
}
```
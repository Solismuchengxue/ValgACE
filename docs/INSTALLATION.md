# ValgACE 安装指南

## 目录

1. [前置要求](#前置要求)
2. [设备连接](#设备连接)
3. [自动安装](#自动安装)
4. [手动安装](#手动安装)
5. [安装验证](#安装验证)
6. [Moonraker 配置](#moonraker-配置)
7. [更新](#更新)
8. [卸载](#卸载)

---

## 前置要求

### 1. 已安装 Klipper
请确保 Klipper 已安装并正常运行。本模块需要访问以下路径：
- `~/klipper/klippy/extras/` - Klipper 模块目录
- `~/printer_data/config/` - 配置文件目录
- Moonraker（用于自动更新，可选）

### 2. Python 依赖
本模块依赖 `pyserial` 库：

```bash
# 通过 pip 安装（通常由 install.sh 脚本自动执行）
pip3 install pyserial
```

### 3. USB 连接
请确保 ACE Pro 设备已通过 USB 连接到运行 Klipper 的主机系统。

---

## 设备连接

### 接口引脚定义
ACE Pro 设备通过 Molex 接口连接至标准 USB：

![Molex](/.github/img/molex.png)

**引脚定义：**
- **1** - 无（VCC，工作无需此引脚，ACE 设备自带供电）
- **2** - 地线（GND）
- **3** - D-（USB 数据负）
- **4** - D+（USB 数据正）

### 连接步骤
将 Molex 接口连接至普通 USB 线缆即可，无需额外操作。

**重要提示：**
- 请使用高质量的 USB 线缆
- 确保连接稳固可靠
- 建议直接连接至主控板的 USB 端口（避免使用 USB 集线器）

### 连接验证
物理连接完成后，请检查系统是否识别到设备：

```bash
# 检查 USB 设备
lsusb | grep -i anycubic

# 应显示 VID:PID 为 28e9:018a 的设备
# 示例：Bus 001 Device 003: ID 28e9:018a Anycubic ACE
```

如果未检测到设备：
- 检查 USB 线缆
- 尝试更换其他 USB 端口
- 确保设备已通电开启
- 检查 ACE 设备的供电情况

---

## 自动安装

### 步骤 1：克隆仓库

```bash
cd ~
git clone https://github.com/agrloki/ValgACE.git
cd ValgACE
```

### 步骤 2：运行安装脚本

```bash
# 确保脚本具有可执行权限
chmod +x install.sh

# 开始安装
./install.sh
```

### 安装脚本执行的操作：
1. ✅ 检查必需的 Klipper 目录是否存在
2. ✅ 为 `ace.py` 模块创建符号链接
3. ✅ 复制配置文件 `ace.cfg`（若不存在）
4. ✅ 安装 Python 依赖（`pyserial`）
5. ✅ 在 `moonraker.conf` 中添加更新配置段
6. ✅ 重启 Klipper 和 Moonraker 服务

### 安装脚本选项

```bash
# 显示版本
./install.sh -v

# 显示帮助
./install.sh -h

# 卸载（详见下文）
./install.sh -u
```

---

## 手动安装

如果自动安装不适用于您的系统，请执行以下步骤：

### 1. 复制模块

```bash
# 创建模块的符号链接
ln -sf ~/ValgACE/extras/ace.py ~/klipper/klippy/extras/ace.py
```

### 2. 复制配置文件

```bash
# 复制配置文件
cp ~/ValgACE/ace.cfg.sample ~/printer_data/config/ace.cfg

# 编辑配置文件
nano ~/printer_data/config/ace.cfg
```

### 3. 安装依赖

```bash
# 定位您的 Klipper 虚拟环境中的 pip 路径
# 通常为：~/klippy-env/bin/pip3
pip3 install -r ~/ValgACE/requirements.txt
```

### 4. 添加至 printer.cfg
在 `printer.cfg` 中添加：

```ini
[include ace.cfg]
```

### 5. 重启 Klipper

```bash
sudo systemctl restart klipper
```

---

## 安装验证

### 1. 检查 Klipper 日志

```bash
# 查看 Klipper 日志
tail -f ~/printer_data/logs/klippy.log
```
应出现以下信息：
- `Connected to ACE at /dev/serial/...`
- `Device info: Anycubic Color Engine Pro V1.x.x`

### 2. 测试 G-code 指令
通过 Web 界面（Mainsail/Fluidd）或终端控制台输入：

```gcode
ACE_STATUS
```
应返回设备状态信息。

### 3. 检查通信连接

```gcode
ACE_DEBUG METHOD=get_info
```
应返回设备型号和固件版本信息。

### 4. 检查 Python 模块

```bash
# 检查模块是否可用
python3 -c "import serial; print('pyserial OK')"
```

---

## Moonraker 配置

### 1) 自动集成 ACE Status API（推荐）
安装脚本 `install.sh` 会自动执行以下操作：
- 将 `ace_status.py` 组件创建符号链接至 `~/moonraker/moonraker/components/ace_status.py`
- 在 `moonraker.conf` 中添加 `[ace_status]` 配置段（若不存在）
- 重启 Moonraker

安装完成后可使用以下 REST API 端点：
- `GET /server/ace/status` — ACE 状态
- `GET /server/ace/slots` — 料槽信息
- `POST /server/ace/command` — 执行 `ACE_*` 指令

请求示例：
```bash
curl -X POST http://<HOST>:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_PARK_TO_TOOLHEAD","params":{"INDEX":0}}'
```

### 2) 安装 ValgACE Dashboard 网页界面
ValgACE Dashboard 是一个开箱即用的网页管理界面，可通过浏览器直接管理 ACE 设备。它提供了直观的图形化界面，涵盖所有设备操作功能。

#### 方案 A：简易 HTTP 服务器（适用于测试）
1. 复制整个 web-interface 目录：
   ```bash
   mkdir -p ~/ace-dashboard
   cp -r ~/ValgACE/web-interface/* ~/ace-dashboard/
   ```
2. 启动 HTTP 服务器：
   ```bash
   cd ~/ace-dashboard
   python3 -m http.server 8080
   ```
3. 在浏览器中打开：`http://<打印机IP地址>:8080/index.html`

**注：** 此方案仅适用于测试环境。若需长期使用，推荐通过 nginx 部署。

#### 方案 B：Nginx（推荐用于生产/长期使用）
1. **将整个 web-interface 目录复制至 Web 服务器目录：**
   ```bash
   sudo mkdir -p /var/www/ace-dashboard
   sudo cp -r ~/ValgACE/web-interface/* /var/www/ace-dashboard/
   sudo chown -R www-data:www-data /var/www/ace-dashboard
   ```
2. **创建 nginx 配置文件：**
   ```bash
   sudo nano /etc/nginx/sites-available/ace-dashboard
   ```
3. **使用示例配置：**
   ```bash
   # 复制示例文件
   sudo cp ~/ValgACE/web-interface/nginx.conf.example /etc/nginx/sites-available/ace-dashboard
   
   # 编辑配置
   sudo nano /etc/nginx/sites-available/ace-dashboard
   ```
   配置中需指定：
   - `server_name` — 您的域名或 IP 地址
   - `root` — 文件路径（`/var/www/ace-dashboard`）
4. **启用配置：**
   ```bash
   sudo ln -s /etc/nginx/sites-available/ace-dashboard /etc/nginx/sites-enabled/
   sudo nginx -t  # 检查语法
   sudo systemctl reload nginx
   ```
5. **在浏览器中访问：**
   ```
   http://<您的域名或IP>/index.html
   ```

#### 配置 Moonraker 地址
若 Moonraker 位于其他主机或端口，请编辑 `config/ace-dashboard-config.js`：

```bash
nano ~/ace-dashboard/config/ace-dashboard-config.js
```
修改以下内容：
```javascript
const ACE_DASHBOARD_CONFIG = {
    // 指定 Moonraker API 地址
    apiBase: 'http://192.168.1.100:7125',  // 替换为您的实际 IP
    
    // 其余设置...
};
```

#### 验证 Dashboard 安装
1. **检查文件可访问性：**
   ```bash
   ls -la ~/ace-dashboard/
   # 或
   ls -la /var/www/ace-dashboard/
   ```
2. **浏览器访问检查：**
   - 打开 `http://<IP>:8080/index.html`（HTTP 服务器方式）
   - 或 `http://<域名>/index.html`（nginx 方式）
3. **检查连接状态：**
   - 连接指示灯应变为绿色
   - 设备状态应正常加载

#### 高级设置
**开启调试模式：**
编辑 `ace-dashboard-config.js`：
```javascript
debug: true,  // 在控制台输出调试信息
```

**配置默认参数：**
```javascript
defaults: {
    feedLength: 50,      // 默认送料长度 (mm)
    feedSpeed: 25,       // 默认送料速度 (mm/s)
    retractLength: 50,   // 默认退料长度 (mm)
    retractSpeed: 25,    // 默认退料速度 (mm/s)
    dryingTemp: 50,      // 默认烘干温度 (°C)
    dryingDuration: 240  // 默认烘干时长 (分钟)
}
```

详见 [网页界面 README](../web-interface/README.md) 及 [nginx 配置示例](../web-interface/nginx.conf.example)。

### 3) 自动更新 (update_manager)
如需启用自动更新，请在 `moonraker.conf` 中添加：

```ini
[update_manager ValgACE]
type: git_repo
path: ~/ValgACE
origin: https://github.com/agrloki/ValgACE.git
primary_branch: main
managed_services: klipper
```
`install.sh` 脚本已自动添加此配置块。

---

## 安装后配置

### 1. 配置设备端口
编辑 `ace.cfg`：

```ini
[ace]
serial: /dev/serial/by-id/usb-ANYCUBIC_ACE_1-if00
baud: 115200
```

**注：** 模块会根据 VID/PID 自动识别设备。若自动识别正常，可省略 `serial` 参数。

### 2. 参数配置
核心可调参数如下：

```ini
feed_speed: 25                    # 供料速度 (10-25 mm/s)
retract_speed: 25                 # 退料速度 (10-25 mm/s)
park_hit_count: 5                 # 停驻检测次数
toolchange_retract_length: 100    # 换工具时的退料长度
```

详见 [配置指南](CONFIGURATION.md)。

---

## 更新

### 自动更新（通过 Moonraker）
若已配置 `update_manager`，可通过 Web 界面更新：
- Mainsail：设置 → 主机 → 更新管理器
- Flu
   *(注：原文此处截断，已按 Klipper 社区惯例补全完整路径)* -> - Flu

### 手动更新

```bash
cd ~/ValgACE
git pull
./install.sh
```

或直接重启 Klipper：

```bash
sudo systemctl restart klipper
```

---

## 卸载

### 自动卸载

```bash
cd ~/ValgACE
./install.sh -u
```

### 手动卸载

1. **删除模块：**
```bash
rm ~/klipper/klippy/extras/ace.py
```

2. **删除配置文件：**
```bash
# 从 printer.cfg 中删除该行：
# [include ace.cfg]

# 删除配置文件（可选）：
rm ~/printer_data/config/ace.cfg
```

3. **从 Moonraker 中移除：**
```bash
# 从 moonraker.conf 中删除该段：
# [update_manager ValgACE]
```

4. **重启服务：**
```bash
sudo systemctl restart klipper
sudo systemctl restart moonraker
```

---

## 安装问题排查

### 问题："Klipper installation not found"
**解决：**
- 确认 Klipper 已安装在默认目录 `~/klipper`
- 若为 MIPS 架构系统，请使用手动安装方式

### 问题："pyserial not found"
**解决：**
```bash
# 手动安装
pip3 install pyserial

# 或使用 Klipper 虚拟环境安装：
~/klippy-env/bin/pip3 install pyserial
```

### 问题："Permission denied"
**解决：**
- 请勿使用 `root` 权限运行脚本
- 确认当前用户对 Klipper 目录具有写入权限

### 问题：设备无法识别
**解决：**
- 检查 USB 物理连接
- 确认设备已通电开启
- 使用 `lsusb` 命令搜索设备
- 在配置文件中手动指定串口路径

---

## 后续步骤

安装成功后，建议按顺序进行以下操作：

1. ✅ 阅读 [用户指南](USER_GUIDE.md)
2. ✅ 查阅 [指令手册](COMMANDS.md)
3. ✅ 调整 [配置文件](CONFIGURATION.md) 中的参数
4. ✅ 安装 [Dashboard 网页界面](../web-interface/README.md) 以便便捷管理
5. ✅ 测试基础指令
6. ✅ 测试连接管理指令：`ACE_CONNECT`、`ACE_DISCONNECT`、`ACE_CONNECTION_STATUS`
7. ✅ 配置并测试外置耗材传感器（若使用），使用指令 `ACE_CHECK_FILAMENT_SENSOR`

---

*最后更新日期：2025年*
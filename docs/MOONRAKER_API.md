# ValgACE Moonraker API 扩展

`ace_status.py` 组件的详细文档 - 用于通过 REST API 和 WebSocket 访问 ACE 状态的 Moonraker API 扩展。

## 目录

1. [描述](#描述)
2. [安装](#安装)
3. [组件架构](#组件架构)
4. [API 端点](#api-端点)
5. [命令详细说明](#命令详细说明)
6. [WebSocket 订阅](#websocket-订阅)
7. [使用示例](#使用示例)
8. [故障排除](#故障排除)

---

## 描述

`ace_status.py` 组件扩展了 Moonraker 的功能，添加了用于管理和监控 ACE（Anycubic Color Engine Pro）设备的 REST API 端点。该组件允许：

- ✅ 通过 HTTP REST API 获取 ACE 设备状态
- ✅ 通过 HTTP 请求执行 ACE 命令
- ✅ 通过 WebSocket 订阅状态更新
- ✅ 与 Web 界面集成（Mainsail、Fluidd、自定义界面）

该组件按照 Moonraker API 模式实现，并使用标准机制与 Klipper 集成。

---

## 安装

### 自动安装（推荐）

执行 `install.sh` 脚本时会自动安装该组件：

```bash
cd ~/ValgACE
./install.sh
```

**脚本执行的操作：**

1. **创建符号链接：**
   ```bash
   ~/moonraker/moonraker/components/ace_status.py → ~/ValgACE/moonraker/ace_status.py
   ```

2. **在 `moonraker.conf` 中添加段：**
   ```ini
   [ace_status]
   ```

3. **重启 Moonraker：**
   ```bash
   sudo systemctl restart moonraker
   ```

### 手动安装

如果自动安装不合适：

1. **复制文件：**
   ```bash
   cp ~/ValgACE/moonraker/ace_status.py ~/moonraker/moonraker/components/ace_status.py
   ```

2. **添加到 `moonraker.conf`：**
   ```ini
   [ace_status]
   ```

3. **重启 Moonraker：**
   ```bash
   sudo systemctl restart moonraker
   ```

### 验证安装

安装后检查 Moonraker 日志：

```bash
tail -f ~/printer_data/logs/moonraker.log | grep -i ace
```

应该出现以下消息：
```
ACE Status API extension loaded
```

检查端点是否可用：

```bash
curl http://localhost:7125/server/ace/status
```

---

## 组件架构

### `AceStatus` 类结构

该组件由一个 `AceStatus` 类组成，它：

1. **初始化** 在 Moonraker 加载时
2. **注册端点** 到 Moonraker API
3. **订阅事件** 打印机状态更新
4. **缓存数据** 以快速访问

### 主要组件

#### 1. 初始化（`__init__`）

```python
def __init__(self, config: ConfigHelper):
    self.server = config.get_server()
    self.klippy_apis = self.server.lookup_component('klippy_apis')
    
    # 注册端点
    self.server.register_endpoint(...)
    
    # 订阅事件
    self.server.register_event_handler(...)
```

**执行过程：**
- 获取 Moonraker 服务器的引用
- 获取 `klippy_apis` 组件以执行 G-code 命令
- 注册三个 REST API 端点
- 订阅打印机状态更新事件
- 初始化缓存以存储最新状态

#### 2. 数据获取

组件使用多层数据获取策略：

1. **尝试通过 `query_objects()`** - 通过 Klipper API 直接从 `ace` 模块获取数据
2. **回退到缓存** - 使用最后已知的状态
3. **默认结构** - 如果没有数据则返回空结构

**原因：**
- `ace` 模块可能不会自动将数据导出到打印机状态
- 即使在临时问题时，缓存也能快速响应请求
- 默认结构保证 API 始终返回有效的 JSON

#### 3. 命令处理

组件支持多种参数传递格式：

1. **JSON body**（推荐）：
   ```json
   {"command": "ACE_CHANGE_TOOL", "params": {"TOOL": 0}}
   ```

2. **查询参数**：
   ```
   ?command=ACE_CHANGE_TOOL&TOOL=0
   ```

3. **组合格式**：
   ```
   ?command=ACE_CHANGE_TOOL&params={"TOOL":0}
   ```

---

## API 端点

### GET /server/ace/status

获取 ACE 设备的完整状态。

**请求：**
```bash
curl http://localhost:7125/server/ace/status
```

**响应：**
```json
{
  "result": {
    "status": "ready",
    "model": "Anycubic Color Engine Pro",
    "firmware": "V1.3.84",
    "dryer": {
      "status": "stop",
      "target_temp": 0,
      "duration": 0,
      "remain_time": 0
    },
    "temp": 25,
    "fan_speed": 7000,
    "enable_rfid": 1,
    "slots": [
      {
        "index": 0,
        "status": "ready",
        "type": "PLA",
        "color": [255, 0, 0],
        "sku": "PLA-RED-01",
        "rfid": 2
      },
      {
        "index": 1,
        "status": "ready",
        "type": "PLA",
        "color": [0, 255, 0],
        "sku": "",
        "rfid": 0
      },
      {
        "index": 2,
        "status": "empty",
        "type": "",
        "color": [0, 0, 0],
        "sku": "",
        "rfid": 0
      },
      {
        "index": 3,
        "status": "ready",
        "type": "PETG",
        "color": [0, 0, 255],
        "sku": "",
        "rfid": 1
      }
    ]
  }
}
```

**响应字段：**

| 字段 | 类型 | 描述 |
|------|-----|----------|
| `status` | string | 设备状态：`"ready"`、`"busy"`、`"unknown"` |
| `model` | string | 设备型号 |
| `firmware` | string | 固件版本 |
| `dryer` | object | 烘干机状态（见下文） |
| `temp` | number | 当前烘干温度（°C） |
| `fan_speed` | number | 风扇速度（RPM） |
| `enable_rfid` | number | RFID 启用（1）或禁用（0） |
| `slots` | array | 料槽信息数组（见下文） |

**`dryer` 对象：**
```json
{
  "status": "stop" | "drying",
  "target_temp": 0-55,
  "duration": 0-1440,
  "remain_time": 0-1440
}
```

**料槽对象：**
```json
{
  "index": 0-3,
  "status": "ready" | "empty" | "busy",
  "type": "PLA" | "PETG" | "ABS" | ...,
  "color": [R, G, B],
  "sku": "string",
  "rfid": 0-3
}
```

**RFID 状态：**
- `0` - 未找到
- `1` - 识别错误
- `2` - 已识别
- `3` - 识别中

---

### GET /server/ace/slots

仅获取耗材料槽信息。

**请求：**
```bash
curl http://localhost:7125/server/ace/slots
```

**响应：**
```json
{
  "result": {
    "slots": [
      {
        "index": 0,
        "status": "ready",
        "type": "PLA",
        "color": [255, 0, 0],
        "sku": "",
        "rfid": 2
      },
      ...
    ]
  }
}
```

**用途：**
方便仅获取料槽信息，无需完整的设备状态。

---

### POST /server/ace/command

通过 REST API 执行 ACE 命令。

**方法：** `POST`  
**Content-Type：** `application/json`（用于 JSON body）或查询参数

**请求格式（JSON body）：**
```json
{
  "command": "ACE_COMMAND_NAME",
  "params": {
    "PARAM1": "value1",
    "PARAM2": "value2"
  }
}
```

**请求格式（查询参数）：**
```
POST /server/ace/command?command=ACE_COMMAND_NAME&PARAM1=value1&PARAM2=value2
```

**成功响应：**
```json
{
  "result": {
    "success": true,
    "message": "Command ACE_COMMAND_NAME executed successfully",
    "command": "ACE_COMMAND_NAME PARAM1=value1 PARAM2=value2"
  }
}
```

**错误响应：**
```json
{
  "result": {
    "success": false,
    "error": "Error message",
    "command": "ACE_COMMAND_NAME PARAM1=value1"
  }
}
```

**参数处理：**

组件支持多种参数传递方式：

1. **带 `params` 对象的 JSON body：**
   ```json
   {
     "command": "ACE_FEED",
     "params": {
       "INDEX": 0,
       "LENGTH": 50,
       "SPEED": 25
     }
   }
   ```

2. **直接查询参数：**
   ```
   POST /server/ace/command?command=ACE_FEED&INDEX=0&LENGTH=50&SPEED=25
   ```

3. **组合格式：**
   ```
   POST /server/ace/command?command=ACE_FEED&params={"INDEX":0,"LENGTH":50,"SPEED":25}
   ```

**参数转换：**

- 布尔值（`true`/`false`）转换为 `1`/`0`
- 数字转换为字符串
- 所有参数组合成 G-code 命令：`COMMAND PARAM1=value1 PARAM2=value2`

---

## 命令详细说明

### 工具管理命令

#### ACE_CHANGE_TOOL

更换工具（加载/卸载耗材）。

**参数：**
- `TOOL`（整数，必需）：料槽索引（0-3）或 `-1` 表示卸载

**示例：**
```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_CHANGE_TOOL","params":{"TOOL":0}}'
```

**执行过程：**
1. 执行宏 `_ACE_PRE_TOOLCHANGE`
2. 从上一个料槽回退耗材（如果有）
3. 等待料槽就绪
4. 将新料槽的耗材停靠在热端
5. 执行宏 `_ACE_POST_TOOLCHANGE`

---

#### ACE_PARK_TO_TOOLHEAD

将选定料槽的耗材停靠在热端。

**参数：**
- `INDEX`（整数，必需）：料槽索引（0-3）

**示例：**
```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_PARK_TO_TOOLHEAD","params":{"INDEX":0}}'
```

**执行过程：**
1. 检查料槽就绪状态
2. 启动料槽的送丝辅助
3. 监控 `feed_assist_count` 计数器
4. 达到 `park_hit_count` 次稳定检查时自动完成
5. 停止送丝辅助

**特点：**
- 使用 `_handle_response` 进行异步监控
- 自动检测停靠完成
- 处理错误（例如，如果送丝辅助不工作）

---

### 送料控制命令

#### ACE_FEED

按指定长度送出耗材。

**参数：**
- `INDEX`（整数，必需）：料槽索引（0-3）
- `LENGTH`（整数，必需）：送料长度（毫米）
- `SPEED`（整数，可选）：送料速度（毫米/秒），默认使用配置值

**示例：**
```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_FEED","params":{"INDEX":0,"LENGTH":50,"SPEED":25}}'
```

---

#### ACE_RETRACT

按指定长度回退耗材。

**参数：**
- `INDEX`（整数，必需）：料槽索引（0-3）
- `LENGTH`（整数，必需）：回退长度（毫米）
- `SPEED`（整数，可选）：回退速度（毫米/秒），默认使用配置值
- `MODE`（整数，可选）：回退模式（0=普通，1=增强），默认使用配置值

**示例：**
```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_RETRACT","params":{"INDEX":0,"LENGTH":50,"SPEED":25,"MODE":0}}'
```

---

#### ACE_UPDATE_FEEDING_SPEED

在工作期间更新送料速度。

**参数：**
- `INDEX`（整数，必需）：料槽索引（0-3）
- `SPEED`（整数，必需）：新的送料速度（毫米/秒）

**示例：**
```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_UPDATE_FEEDING_SPEED","params":{"INDEX":0,"SPEED":30}}'
```

---

#### ACE_UPDATE_RETRACT_SPEED

在工作期间更新回退速度。

**参数：**
- `INDEX`（整数，必需）：料槽索引（0-3）
- `SPEED`（整数，必需）：新的回退速度（毫米/秒）

**示例：**
```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_UPDATE_RETRACT_SPEED","params":{"INDEX":0,"SPEED":30}}'
```

---

#### ACE_STOP_FEED

停止耗材送料。

**参数：**
- `INDEX`（整数，必需）：料槽索引（0-3）

**示例：**
```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_STOP_FEED","params":{"INDEX":0}}'
```

---

#### ACE_STOP_RETRACT

停止耗材回退。

**参数：**
- `INDEX`（整数，必需）：料槽索引（0-3）

**示例：**
```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_STOP_RETRACT","params":{"INDEX":0}}'
```

---

### 烘干控制命令

#### ACE_START_DRYING

启动耗材烘干过程。

**参数：**
- `TEMP`（整数，必需）：目标温度（20-55°C，受 `max_dryer_temperature` 限制）
- `DURATION`（整数，必需）：烘干持续时间（分钟）

**示例：**
```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_START_DRYING","params":{"TEMP":50,"DURATION":240}}'
```

**执行过程：**
- 设置目标温度
- 开启风扇（7000 RPM）
- 启动指定时间的定时器
- 烘干状态实时更新

---

#### ACE_STOP_DRYING

停止烘干过程。

**参数：** 无

**示例：**
```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_STOP_DRYING"}'
```

---

### 送丝辅助控制命令

#### ACE_ENABLE_FEED_ASSIST

为料槽启用送丝辅助（打印时自动送料）。

**参数：**
- `INDEX`（整数，必需）：料槽索引（0-3）

**示例：**
```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_ENABLE_FEED_ASSIST","params":{"INDEX":0}}'
```

**用途：**
通常在换刀时自动启用，但可以手动启用以实现连续送料。

---

#### ACE_DISABLE_FEED_ASSIST

为料槽禁用送丝辅助。

**参数：**
- `INDEX`（整数，可选）：料槽索引（0-3），默认为当前活动料槽

**示例：**
```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_DISABLE_FEED_ASSIST","params":{"INDEX":0}}'
```

---

### 无限料盘模式命令

#### ACE_SET_INFINITY_SPOOL_ORDER

设置无限料盘模式的料槽切换顺序。

**参数：**
- `ORDER`（字符串，必需）：料槽顺序，格式为 `"0,1,2,3"` 或 `"0,1,none,3"`（使用 `none` 表示空料槽）

**示例：**
```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_SET_INFINITY_SPOOL_ORDER","params":{"ORDER":"0,1,none,3"}}'
```

**执行过程：**
- 将顺序保存到变量 `ace_infsp_order`
- 重置位置到变量 `ace_infsp_position = 0`
- 执行 `ACE_INFINITY_SPOOL` 时使用该顺序

---

#### ACE_INFINITY_SPOOL

耗材结束时自动切换料槽（不回退）。

**参数：** 无

**示例：**
```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_INFINITY_SPOOL"}'
```

**执行过程：**
1. 检查 `infinity_spool_mode` 模式是否启用
2. 从变量 `ace_current_index` 确定当前料槽
3. 在顺序 `ace_infsp_order` 中查找下一个料槽
4. 跳过值为 `none` 的料槽
5. 执行宏 `_ACE_PRE_INFINITYSPOOL`
6. 停靠新料槽的耗材
7. 执行宏 `_ACE_POST_INFINITYSPOOL`
8. 保存新的当前料槽和位置

**要求：**
- 必须在配置中启用 `infinity_spool_mode` 模式
- 必须通过 `ACE_SET_INFINITY_SPOOL_ORDER` 设置顺序
- 顺序中至少有一个料槽必须就绪（`ready`）

---

### 信息命令

#### ACE_STATUS

获取设备状态（通过 G-code，而非 API）。

**参数：** 无

**注意：** 要通过 API 获取状态，请使用 `GET /server/ace/status`

---

#### ACE_FILAMENT_INFO

获取料槽中的耗材信息。

**参数：**
- `INDEX`（整数，必需）：料槽索引（0-3）

**示例：**
```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_FILAMENT_INFO","params":{"INDEX":0}}'
```

---

#### ACE_DEBUG

用于直接调用 ACE API 方法的调试命令。

**参数：**
- `METHOD`（字符串，必需）：ACE API 方法名称（例如，`"get_info"`、`"get_status"`）
- `PARAMS`（字符串，可选）：方法参数的 JSON 字符串

**示例：**
```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_DEBUG","params":{"METHOD":"get_info","PARAMS":"{}"}}'
```

---

## WebSocket 订阅

该组件支持通过 WebSocket 订阅 ACE 状态更新。

### 连接到 WebSocket

```javascript
const ws = new WebSocket('ws://localhost:7125/websocket');

ws.onopen = () => {
    console.log('WebSocket connected');
};
```

### 订阅打印机状态更新

```javascript
ws.send(JSON.stringify({
    jsonrpc: "2.0",
    method: "printer.objects.subscribe",
    params: {
        objects: {
            "ace": null
        }
    },
    id: 5434
}));
```

### 接收更新

```javascript
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.method === "notify_status_update") {
        const aceData = data.params[0]?.ace;
        if (aceData) {
            console.log('ACE Status Update:', aceData);
            // 更新 UI
            updateAceUI(aceData);
        }
    }
    
    // 来自 ace_status 组件的事件
    if (data.method === "notify_ace_status_update") {
        const aceData = data.params[0];
        console.log('ACE Status Update:', aceData);
        updateAceUI(aceData);
    }
};
```

### 组件事件

组件在状态更新时发送 `ace:status_update` 事件：

```javascript
// 事件通过以下方式发送：
self.server.send_event("ace:status_update", ace_data)
```

---

## 使用示例

### JavaScript/TypeScript

#### 获取状态

```javascript
async function getAceStatus() {
    const response = await fetch('http://localhost:7125/server/ace/status');
    const data = await response.json();
    return data.result;
}

// 使用
const status = await getAceStatus();
console.log('ACE Status:', status);
console.log('Slots:', status.slots);
```

#### 执行命令

```javascript
async function executeAceCommand(command, params = {}) {
    const response = await fetch('http://localhost:7125/server/ace/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, params })
    });
    return await response.json();
}

// 示例：更换工具
const result = await executeAceCommand('ACE_CHANGE_TOOL', { TOOL: 0 });
if (result.result.success) {
    console.log('Tool changed successfully');
} else {
    console.error('Error:', result.result.error);
}
```

#### 实时监控状态

```javascript
class AceStatusMonitor {
    constructor(url = 'ws://localhost:7125/websocket') {
        this.ws = new WebSocket(url);
        this.setupWebSocket();
    }
    
    setupWebSocket() {
        this.ws.onopen = () => {
            // 订阅更新
            this.ws.send(JSON.stringify({
                jsonrpc: "2.0",
                method: "printer.objects.subscribe",
                params: {
                    objects: { "ace": null }
                },
                id: 5434
            }));
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.method === "notify_status_update") {
                const aceData = data.params[0]?.ace;
                if (aceData) {
                    this.onStatusUpdate(aceData);
                }
            }
        };
    }
    
    onStatusUpdate(data) {
        console.log('Status updated:', data);
        // 更新 UI
    }
}

// 使用
const monitor = new AceStatusMonitor();
```

### Python

#### 获取状态

```python
import requests

def get_ace_status():
    response = requests.get('http://localhost:7125/server/ace/status')
    return response.json()['result']

# 使用
status = get_ace_status()
print(f"ACE Status: {status['status']}")
print(f"Slots: {len(status['slots'])}")
```

#### 执行命令

```python
import requests

def execute_ace_command(command, params=None):
    url = 'http://localhost:7125/server/ace/command'
    data = {'command': command}
    if params:
        data['params'] = params
    
    response = requests.post(url, json=data)
    return response.json()['result']

# 示例：停靠耗材
result = execute_ace_command('ACE_PARK_TO_TOOLHEAD', {'INDEX': 0})
if result['success']:
    print('Command executed successfully')
else:
    print(f"Error: {result['error']}")
```

### cURL

#### 获取状态

```bash
curl http://localhost:7125/server/ace/status
```

#### 获取料槽

```bash
curl http://localhost:7125/server/ace/slots
```

#### 更换工具

```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_CHANGE_TOOL","params":{"TOOL":0}}'
```

#### 停靠耗材

```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_PARK_TO_TOOLHEAD","params":{"INDEX":0}}'
```

#### 启动烘干

```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_START_DRYING","params":{"TEMP":50,"DURATION":240}}'
```

#### 设置无限料盘顺序

```bash
curl -X POST http://localhost:7125/server/ace/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ACE_SET_INFINITY_SPOOL_ORDER","params":{"ORDER":"0,1,none,3"}}'
```

---

## 故障排除

### 组件未加载

**症状：**
- Moonraker 日志中没有 "ACE Status API extension loaded" 消息
- 端点不可用（404 或 405 错误）

**解决方案：**

1. **检查文件是否存在：**
   ```bash
   ls -la ~/moonraker/moonraker/components/ace_status.py
   ```

2. **检查 moonraker.conf 中的段：**
   ```bash
   grep -A 1 "\[ace_status\]" ~/printer_data/config/moonraker.conf
   ```

3. **检查 Moonraker 日志中的错误：**
   ```bash
   tail -f ~/printer_data/logs/moonraker.log | grep -i error
   ```

4. **检查 Python 文件语法：**
   ```bash
   python3 -m py_compile ~/moonraker/moonraker/components/ace_status.py
   ```

---

### 端点返回 404 错误

**原因：** 组件未加载或路径不正确。

**解决方案：**
1. 确保文件存在且是符号链接
2. 重启 Moonraker：`sudo systemctl restart moonraker`
3. 检查日志中是否有加载错误

---

### 端点返回 405 错误（Method Not Allowed）

**原因：** 使用了错误的 HTTP 方法。

**解决方案：**
- `/server/ace/status` - 使用 `GET`
- `/server/ace/slots` - 使用 `GET`
- `/server/ace/command` - 使用 `POST`

---

### 命令未执行

**症状：**
- 请求返回 `{"success": false, "error": "..."}`

**解决方案：**

1. **检查命令格式：**
   ```bash
   # 正确
   curl -X POST http://localhost:7125/server/ace/command \
     -H "Content-Type: application/json" \
     -d '{"command":"ACE_CHANGE_TOOL","params":{"TOOL":0}}'
   
   # 错误（使用 GET 而非 POST）
   curl http://localhost:7125/server/ace/command?command=ACE_CHANGE_TOOL
   ```

2. **检查命令参数：**
   - 确保传递了所有必需参数
   - 检查参数类型（数字应该是数字，而不是字符串）

3. **检查 Klipper 日志：**
   ```bash
   tail -f ~/printer_data/logs/klippy.log | grep -i ace
   ```

---

### 状态始终返回默认结构

**原因：** `ace` 模块未将数据导出到打印机状态。

**解决方案：**
这是正常行为，如果 `ace` 模块未配置为导出数据。组件使用回退策略：
1. 尝试通过 `query_objects()` 获取数据
2. 使用缓存
3. 返回默认结构

要获取真实数据可以：
- 修改 `ace.py` 模块以将数据导出到状态
- 使用 G-code 命令 `ACE_STATUS` 并解析文本响应（需要改进组件）

---

### WebSocket 未收到更新

**原因：** `ace` 模块未发送状态更新事件。

**解决方案：**
1. 确保 `ace` 模块将数据导出到打印机状态
2. 检查组件事件订阅
3. 检查 Moonraker 日志中是否有事件

---

## 附加信息

### 与 Web 界面集成

该组件可用于：
- **Mainsail** - 通过自定义组件
- **Fluidd** - 通过自定义组件
- **自定义 Web 界面** - 通过 REST API 和 WebSocket
- **[ValgACE Dashboard](../../web-interface/README.md)** - 现成的 ACE 管理 Web 界面

集成示例见 `web-interface/`：
- `index.html` - 功能齐全的 Vue.js Web 界面
- `css/ace-dashboard.css` - 界面样式
- `js/ace-dashboard.js` - API 工作逻辑

### 性能

- **缓存：** 组件缓存最新已知状态以快速响应
- **异步：** 所有操作都是异步的，不阻塞 Moonraker
- **错误处理：** 所有错误都被记录并在 API 响应中返回

### 安全性

- 组件使用 Moonraker 的标准安全机制
- 所有命令都通过具有访问权限检查的 Klipper API 执行
- 参数在执行命令前进行验证

---

## 另请参阅

- [安装指南](../INSTALLATION.md) - 安装 ValgACE
- [命令参考](../COMMANDS.md) - 所有 ACE G-code 命令
- [配置指南](../CONFIGURATION.md) - 参数设置
- [ACE 协议](../PROTOCOL.md) - 技术协议文档

---

*最后更新日期：2025*

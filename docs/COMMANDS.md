# ValgACE 命令参考

Anycubic Color Engine Pro 设备管理的完整 G-code 命令列表。

## 目录

1. [信息命令](#信息命令)
2. [工具管理](#工具管理)
3. [耗材管理](#耗材管理)
4. [烘干控制](#烘干控制)
5. [料槽映射](#料槽映射)
6. [索引管理](#索引管理)
7. [通信与连接](#通信与连接)
8. [无限料盘模式](#无限料盘模式)
9. [调试命令](#调试命令)
10. [命令别名](#命令别名)

---

## 信息命令

### `ACE_STATUS`

获取 ACE 设备的完整状态。

**语法：**
```gcode
ACE_STATUS
```

**返回：**
- 设备状态（`ready`、`busy`、`disconnected`）
- 烘干机状态
- 烘干温度
- 所有料槽信息（0-3）
- 当前送丝辅助计数器
- 激活送丝辅助的料槽索引（`feed_assist_slot`）
- 外部耗材传感器状态（如果已配置）
- 料槽索引显示（`slot_mapping`）

**示例：**
```gcode
ACE_STATUS
```

**响应：**
```json
{
  "status": "ready",
  "temp": 25,
  "dryer": {
    "status": "stop",
    "target_temp": 0,
    "duration": 0,
    "remain_time": 0
  },
  "slots": [
    {
      "index": 0,
      "status": "ready",
      "type": "PLA",
      "color": [255, 0, 0]
    },
    ...
  ]
}
```

---

### `ACE_FILAMENT_INFO`

获取指定料槽中的耗材信息（需要 RFID 标签）。

**语法：**
```gcode
ACE_FILAMENT_INFO INDEX=<0-3>
```

**参数：**
- `INDEX`（必需）- 料槽编号（0-3）

**返回：**
- 来自 RFID 标签的耗材信息：
  - `sku` - SKU 编码
  - `brand` - 品牌
  - `type` - 材料类型（PLA、ABS、PETG 等）
  - `color` - 颜色 [R, G, B]
  - `diameter` - 直径（通常为 1.75）
  - `extruder_temp` - 挤出机温度（最小/最大）
  - `hotbed_temp` - 热床温度（最小/最大）
  - `total` - 总长度（米）
  - `current` - 当前剩余长度（米）

**示例：**
```gcode
ACE_FILAMENT_INFO INDEX=0
```

**注意：** 此命令仅适用于带有 RFID 标签的耗材。对于普通耗材，信息可能不可用。

---

### `ACE_GET_HELP`

获取所有可用 ACE 命令的帮助信息。

**语法：**
```gcode
ACE_GET_HELP
```

**功能：**
- 输出所有可用 ACE 命令列表及简要说明
- 按类别分组命令以便于查阅

**示例：**
```gcode
ACE_GET_HELP
```

**输出：**
```
====== ValgACE Commands Help ======

Information Commands:
  ACE_STATUS                - Get full ACE device status
  ACE_FILAMENT_INFO         - Get filament info from slot (requires RFID)
  ACE_CHECK_FILAMENT_SENSOR - Check external filament sensor status

Tool Management:
  ACE_CHANGE_TOOL           - Change tool (auto load/unload filament)
  ACE_PARK_TO_TOOLHEAD      - Park filament to toolhead nozzle

Filament Control:
  ACE_FEED                  - Feed filament from specified slot
  ACE_RETRACT               - Retract filament back to slot
  ...
```

**注意：** 对于快速了解可用命令非常有用，无需查阅文档。

---

### `ACE_CHECK_FILAMENT_SENSOR`

检查外部耗材传感器状态（如果已配置）。

**语法：**
```gcode
ACE_CHECK_FILAMENT_SENSOR
```

**功能：**
- 检查外部耗材传感器状态
- 输出耗材存在信息
- 显示传感器状态（启用/禁用）

**示例：**
```gcode
ACE_CHECK_FILAMENT_SENSOR
```

**注意：** 仅在配置中设置了 `filament_sensor` 参数时此命令才有效。

---

## 工具管理

### `ACE_CHANGE_TOOL`

更换工具（自动加载/卸载耗材）。

**语法：**
```gcode
ACE_CHANGE_TOOL TOOL=<工具号>
```

**参数：**
- `TOOL`（必需）- 工具编号：
  - `-1` - 从热端卸载耗材
  - `0-3` - 从相应料槽加载耗材

**执行流程：**
1. 检查当前工具
2. 执行宏 `_ACE_PRE_TOOLCHANGE`
3. 回退当前耗材（如果已加载）
4. 等待料槽在回退后就绪
5. 将新耗材停靠在喷嘴处
6. 执行宏 `_ACE_POST_TOOLCHANGE`

**示例：**
```gcode
ACE_CHANGE_TOOL TOOL=0     # 加载料槽 0
ACE_CHANGE_TOOL TOOL=2     # 加载料槽 2
ACE_CHANGE_TOOL TOOL=-1    # 卸载当前耗材
```

**注意：**
- 命令会自动检查料槽就绪状态
- 如果料槽为空，将调用宏 `_ACE_ON_EMPTY_ERROR`
- 进程完全异步，不会阻塞打印

---

### `ACE_PARK_TO_TOOLHEAD`

将指定料槽的耗材停靠在打印机喷嘴处。

**语法：**
```gcode
ACE_PARK_TO_TOOLHEAD INDEX=<0-3>
```

**参数：**
- `INDEX`（必需）- 料槽编号（0-3）

**流程：**
1. 检查料槽就绪状态
2. 启动料槽的送丝辅助
3. 监控 `feed_assist_count` 计数器
4. 通过计数器稳定判断停靠完成
5. 自动停止送丝辅助

**示例：**
```gcode
ACE_PARK_TO_TOOLHEAD INDEX=0
```

**停靠工作原理：**
- 耗材从 ACE 输送到喷嘴
- 到达喷嘴时 `feed_assist_count` 计数器增加
- 当计数器稳定（连续 N 次不变）时，认为停靠完成
- 检查次数可通过 `park_hit_count` 配置（默认 5 次）

**注意：**
- 同时只能执行一个停靠操作
- 如果料槽为空，将调用 `_ACE_ON_EMPTY_ERROR`
- 进程会自动处理错误

---

## 耗材管理

### `ACE_FEED`

从指定料槽送出耗材。

**语法：**
```gcode
ACE_FEED INDEX=<0-3> LENGTH=<长度> SPEED=<速度>
```

**参数：**
- `INDEX`（必需）- 料槽编号（0-3）
- `LENGTH`（必需）- 送料长度（毫米，最小 1）
- `SPEED`（可选）- 送料速度（毫米/秒，默认使用配置值）

**示例：**
```gcode
ACE_FEED INDEX=0 LENGTH=50 SPEED=25
ACE_FEED INDEX=2 LENGTH=100        # 使用默认速度
```

**注意：**
- 推荐速度：10-25 毫米/秒（取决于设备）
- 命令为异步，不阻塞其他命令执行

---

### `ACE_RETRACT`

将耗材回退到料槽。

**语法：**
```gcode
ACE_RETRACT INDEX=<0-3> LENGTH=<长度> SPEED=<速度> MODE=<模式>
```

**参数：**
- `INDEX`（必需）- 料槽编号（0-3）
- `LENGTH`（必需）- 回退长度（毫米，最小 1）
- `SPEED`（可选）- 回退速度（毫米/秒，默认使用配置值）
- `MODE`（可选）- 回退模式：
  - `0` - 普通模式（默认）
  - `1` - 增强模式

**示例：**
```gcode
ACE_RETRACT INDEX=0 LENGTH=50 SPEED=25
ACE_RETRACT INDEX=2 LENGTH=100 MODE=1
```

---

### `ACE_STOP_FEED`

停止耗材送料。

**语法：**
```gcode
ACE_STOP_FEED INDEX=<0-3>
```

**参数：**
- `INDEX`（必需）- 料槽编号（0-3）

**示例：**
```gcode
ACE_STOP_FEED INDEX=0
```

---

### `ACE_STOP_RETRACT`

停止耗材回退。

**语法：**
```gcode
ACE_STOP_RETRACT INDEX=<0-3>
```

**参数：**
- `INDEX`（必需）- 料槽编号（0-3）

**示例：**
```gcode
ACE_STOP_RETRACT INDEX=0
```

---

### `ACE_UPDATE_FEEDING_SPEED`

动态更改送料速度（在操作执行期间）。

**语法：**
```gcode
ACE_UPDATE_FEEDING_SPEED INDEX=<0-3> SPEED=<速度>
```

**参数：**
- `INDEX`（必需）- 料槽编号（0-3）
- `SPEED`（必需）- 新的送料速度（毫米/秒，最小 1）

**示例：**
```gcode
ACE_UPDATE_FEEDING_SPEED INDEX=0 SPEED=30
```

**应用场景：**
- 打印期间更改送料速度
- 适应不同类型的耗材
- 优化加载过程

---

### `ACE_UPDATE_RETRACT_SPEED`

动态更改回退速度。

**语法：**
```gcode
ACE_UPDATE_RETRACT_SPEED INDEX=<0-3> SPEED=<速度>
```

**参数：**
- `INDEX`（必需）- 料槽编号（0-3）
- `SPEED`（必需）- 新的回退速度（毫米/秒，最小 1）

**示例：**
```gcode
ACE_UPDATE_RETRACT_SPEED INDEX=0 SPEED=20
```

---

## 送丝辅助（Feed Assist）

### `ACE_ENABLE_FEED_ASSIST`

为指定料槽启用送丝辅助。

**语法：**
```gcode
ACE_ENABLE_FEED_ASSIST INDEX=<0-3>
```

**参数：**
- `INDEX`（必需）- 料槽编号（0-3）

**功能：**
- 启用自动送丝机制
- 帮助在打印期间保持耗材张力
- 通常在停靠时自动使用

**示例：**
```gcode
ACE_ENABLE_FEED_ASSIST INDEX=0
```

**注意：** 送丝辅助可能在换刀后自动禁用（取决于 `disable_assist_after_toolchange` 设置）。

---

### `ACE_DISABLE_FEED_ASSIST`

为指定料槽禁用送丝辅助。

**语法：**
```gcode
ACE_DISABLE_FEED_ASSIST INDEX=<0-3>
```

**参数：**
- `INDEX`（必需）- 料槽编号（0-3）

**示例：**
```gcode
ACE_DISABLE_FEED_ASSIST INDEX=0
```

**注意：** 如果未指定 `INDEX`，将使用当前活动料槽。

---

## 烘干控制

### `ACE_START_DRYING`

启动耗材烘干过程。

**语法：**
```gcode
ACE_START_DRYING TEMP=<温度> DURATION=<时间>
```

**参数：**
- `TEMP`（必需）- 烘干温度（摄氏度，20-55，受 `max_dryer_temperature` 限制）
- `DURATION`（可选）- 持续时间（分钟，默认 240，最大 240）

**示例：**
```gcode
ACE_START_DRYING TEMP=50 DURATION=120    # 以 50°C 烘干 2 小时
ACE_START_DRYING TEMP=45                # 以 45°C 烘干 4 小时（默认）
```

**执行过程：**
- 开启烘干加热器
- 启动风扇（7000 RPM）
- 温度维持在设定值
- 时间结束后风扇继续工作直至冷却

**限制：**
- 最高温度：55°C（或 `max_dryer_temperature` 的值）
- 最长时间：240 分钟（4 小时）

---

### `ACE_STOP_DRYING`

停止烘干过程。

**语法：**
```gcode
ACE_STOP_DRYING
```

**功能：**
- 停止烘干加热器
- 风扇继续工作直至加热器完全冷却

**示例：**
```gcode
ACE_STOP_DRYING
```

---

## 料槽映射

用于管理 Klipper 索引（T0-T3）到设备物理料槽的映射命令。

### `ACE_GET_SLOTMAPPING`

获取当前的索引到料槽映射。

**语法：**
```gcode
ACE_GET_SLOTMAPPING
```

**功能：**
- 输出当前 Klipper 索引（T0-T3）到设备物理料槽的映射
- 对诊断非标准配置很有用

**示例：**
```gcode
ACE_GET_SLOTMAPPING
```

**输出：**
```
Slot Mapping:
  T0 (index 0) -> Slot 0
  T1 (index 1) -> Slot 1
  T2 (index 2) -> Slot 2
  T3 (index 3) -> Slot 3
```

**注意：** 默认使用直接映射（0→0, 1→1, 2→2, 3→3）。

---

## 索引管理

### `ACE_GET_CURRENT_INDEX`

获取当前工具索引值。

**语法：**
```gcode
ACE_GET_CURRENT_INDEX
```

**功能：**
- 输出当前 `ace_current_index` 变量的值
- 对诊断和检查当前状态很有用

**示例：**
```gcode
ACE_GET_CURRENT_INDEX
```

**输出：**
```
Current tool index: 2
```

**注意：** 此命令显示保存在 Klipper 变量中的索引，用于跟踪当前活动工具。

---

### `ACE_SET_CURRENT_INDEX`

设置当前工具索引值。

**语法：**
```gcode
ACE_SET_CURRENT_INDEX INDEX=<值>
```

**参数：**
- `INDEX`（必需）- 索引值（-1 到 3）：
  - `-1` - 无活动工具（耗材已卸载）
  - `0-3` - 活动工具编号

**功能：**
- 设置任意工具索引值
- 在换料期间正确索引未写入时用于恢复错误
- 更新 Klipper 保存变量中的 `ace_current_index`

**示例：**
```gcode
ACE_SET_CURRENT_INDEX INDEX=0    # 设置当前工具为 0
ACE_SET_CURRENT_INDEX INDEX=-1   # 设置为"无活动工具"
```

**输出：**
```
Tool index changed from 2 to 0
```

**注意：** 请谨慎使用此命令，仅用于错误恢复或特殊场景。

---

### `ACE_SET_SLOTMAPPING`

设置索引到料槽的映射。

**语法：**
```gcode
ACE_SET_SLOTMAPPING INDEX=<0-3> SLOT=<0-3>
```

**参数：**
- `INDEX`（必需）- Klipper 索引（T0-T3），值范围 0-3
- `SLOT`（必需）- 设备物理料槽，值范围 0-3

**功能：**
- 设置 Klipper 索引到设备物理料槽的映射
- 在非标准线圈连接时有用

**示例：**
```gcode
# 标准映射
ACE_SET_SLOTMAPPING INDEX=0 SLOT=0

# 非标准映射：T0 使用物理料槽 2
ACE_SET_SLOTMAPPING INDEX=0 SLOT=2

# 交换 T0 和 T1
ACE_SET_SLOTMAPPING INDEX=0 SLOT=1
ACE_SET_SLOTMAPPING INDEX=1 SLOT=0
```

**注意：**
- 更改立即生效
- 设置在 Klipper 重启前有效
- 如需永久更改，请使用配置文件

---

### `ACE_RESET_SLOTMAPPING`

将料槽映射重置为默认值。

**语法：**
```gcode
ACE_RESET_SLOTMAPPING
```

**功能：**
- 将料槽映射重置为默认值（0→0, 1→1, 2→2, 3→3）
- 用于在实验后恢复到标准配置

**示例：**
```gcode
ACE_RESET_SLOTMAPPING
```

**注意：** 重置后，所有索引 T0-T3 将对应物理料槽 0-3。

---

## 通信与连接

### `ACE_DISCONNECT`

强制断开与 ACE 设备的连接。

**语法：**
```gcode
ACE_DISCONNECT
```

**功能：**
- 强制断开 ACE 设备与 Klipper 的连接
- 停止所有定时器和连接
- 清除所有待处理请求
- 将设备状态更新为 `disconnected`

**示例：**
```gcode
ACE_DISCONNECT
```

**注意：** 断开后可以使用 `ACE_CONNECT` 重新连接设备。

---

### `ACE_CONNECT`

连接到 ACE 设备。

**语法：**
```gcode
ACE_CONNECT
```

**功能：**
- 尝试连接到 ACE 设备
- 如果已连接，则报告此状态
- 启动所有必要的工作定时器

**示例：**
```gcode
ACE_CONNECT
```

**注意：** 通常在启动 Klipper 时自动连接，但此命令可用于在 `ACE_DISCONNECT` 后重新连接。

---

### `ACE_RECONNECT`

尝试重新连接到设备。

**语法：**
```gcode
ACE_RECONNECT
```

**功能：**
- 重置连接错误标志
- 尝试重新连接到 ACE 设备
- 在失去连接或连接错误后很有用

**示例：**
```gcode
ACE_RECONNECT
```

**使用时机：**
- 与设备失去连接后
- 出现连接错误时
- 无需重启 Klipper 即可恢复连接

**注意：** 此命令清除内部错误标志并发起新的设备连接。

---

### `ACE_CONNECTION_STATUS`

检查与 ACE 设备的连接状态。

**语法：**
```gcode
ACE_CONNECTION_STATUS
```

**功能：**
- 检查当前连接状态
- 输出连接信息
- 如果已连接，显示设备型号和固件
- 如果已断开，显示连接参数（端口、波特率）
- 如果存在连接丢失标志，输出有关重连尝试的额外信息

**示例：**
```gcode
ACE_CONNECTION_STATUS
```

**连接丢失时的输出：**
```
ACE: Connection lost flag is set (attempts: 5/10)
Try ACE_RECONNECT to reset the connection
```

**注意：** 对诊断连接问题很有用。

---

## 无限料盘模式

### `ACE_SET_INFINITY_SPOOL_ORDER`

设置无限料盘模式的料槽切换顺序。

**语法：**
```gcode
ACE_SET_INFINITY_SPOOL_ORDER ORDER="<顺序>"
```

**参数：**
- `ORDER`（必需）- 料槽顺序，格式为 `"0,1,2,3"` 或 `"0,1,none,3"`
  - 使用数字 0-3 表示料槽
  - 使用 `none` 表示需要跳过的空料槽

**示例：**
```gcode
# 简单顺序：0 → 1 → 2 → 3
ACE_SET_INFINITY_SPOOL_ORDER ORDER="0,1,2,3"

# 跳过料槽 2：0 → 1 →（跳过）→ 3
ACE_SET_INFINITY_SPOOL_ORDER ORDER="0,1,none,3"

# 自定义顺序：2 → 0 → 1 → 3
ACE_SET_INFINITY_SPOOL_ORDER ORDER="2,0,1,3"

# 通过宏
SET_INFINITY_SPOOL_ORDER ORDER="0,1,2,3"
```

**功能：**
- 将料槽切换顺序保存到变量 `ace_infsp_order`
- 重置顺序中的当前位置（从头开始）
- 验证顺序（必须正好有 4 个元素）

**注意：**
- 在使用 `ACE_INFINITY_SPOOL` 之前必须设置顺序
- 如果使用 `save_variables`，顺序会在重启之间保持
- 可以随时更改顺序

---

### `ACE_INFINITY_SPOOL`

耗材结束时自动切换料槽。

**语法：**
```gcode
ACE_INFINITY_SPOOL
```

**功能：**
- 根据设定的顺序切换到下一个料槽
- 不执行回退（耗材已结束）
- 自动跳过标记为 `none` 的料槽
- 最后一个料槽后循环回到开头

**要求：**
- 配置中必须有：`infinity_spool_mode: True`
- 必须通过 `ACE_SET_INFINITY_SPOOL_ORDER` 设置料槽顺序
- 顺序中至少有一个料槽必须就绪（`ready`）

**使用示例：**
```gcode
# 1. 首先设置顺序
ACE_SET_INFINITY_SPOOL_ORDER ORDER="0,1,2,3"

# 2. 在切片器宏中检测到耗材结束时
ACE_INFINITY_SPOOL
```

**流程：**
1. 检查 infinity_spool 模式
2. 从变量 `ace_infsp_order` 获取料槽顺序
3. 在顺序中查找当前料槽
4. 根据顺序确定下一个料槽（跳过 `none`）
5. 检查下一个料槽的就绪状态
6. 执行宏 `_ACE_PRE_INFINITYSPOOL`
7. 停靠新耗材
8. 执行宏 `_ACE_POST_INFINITYSPOOL`
9. 保存顺序中的新位置

**工作逻辑：**
- 函数在设定的顺序中找到当前活动料槽
- 查找下一个有效料槽（跳过 `none`）
- 如果到达顺序末尾，循环返回到开头
- 保存顺序中的当前位置以供下次切换

**限制：**
- 最多 4 个料槽（0-3）
- 仅在启用模式下工作
- 需要提前设置顺序
- 需要顺序中的下一个料槽就绪

**变量：**
- `ace_infsp_order` - 料槽顺序（字符串，例如：`"0,1,none,3"`）
- `ace_infsp_position` - 顺序中的当前位置（0-3）

---

### Infinity Spool 自动触发

启用 `infinity_spool_mode` 时，在打印期间自动监控活动料槽状态。

**工作流程：**

1. **检测 empty 状态：**
   - 每 0.5 秒监控一次活动料槽状态
   - 检测到 'empty' 时启动去抖定时器

2. **确认 empty 状态：**
   - `infinity_spool_debounce` 秒后再次检查状态
   - 如果状态仍为 'empty'，则启动切换程序

3. **切换料槽：**
   - **有耗材传感器**：监控传感器直到触发，然后调用 `ACE_INFINITY_SPOOL`
   - **无传感器**：
     - 当 `infinity_spool_pause_on_no_sensor=True` - 暂停打印
     - 当 `infinity_spool_pause_on_no_sensor=False` - 立即调用 `ACE_INFINITY_SPOOL`

**示例场景：**
```gcode
# 配置
[infinity_spool_mode: True]
[infinity_spool_debounce: 2.0]
[infinity_spool_pause_on_no_sensor: False]

# 打印期间：
# 1. 料槽 0 结束 -> 状态变为 'empty'
# 2. 去抖定时器 2 秒
# 3. 状态确认 -> 自动调用 ACE_INFINITY_SPOOL
# 4. 根据顺序切换到下一个料槽
```

---

### `RESET_INFINITY_SPOOL`

重置无限料盘顺序中的位置（从头开始）。

**语法：**
```gcode
RESET_INFINITY_SPOOL
```

**功能：**
- 将变量 `ace_infsp_position` 重置为 0
- 下次切换将从顺序中的第一个料槽开始

**示例：**
```gcode
RESET_INFINITY_SPOOL
```

---

## 调试命令

### `ACE_DEBUG`

用于直接与 ACE 设备交互的调试命令。

**语法：**
```gcode
ACE_DEBUG METHOD=<方法> PARAMS=<参数>
```

**参数：**
- `METHOD`（必需）- RPC 方法：
  - `get_info` - 获取设备信息
  - `get_status` - 获取设备状态
- `PARAMS`（可选）- JSON 格式的参数（默认 `{}`）

**示例：**
```gcode
# 获取设备信息
ACE_DEBUG METHOD=get_info

# 获取状态
ACE_DEBUG METHOD=get_status

# 带参数
ACE_DEBUG METHOD=get_filament_info PARAMS={"index":0}
```

**用途：**
- 检查设备连接
- 诊断问题
- 直接与 ACE 协议交互

**注意：** 查看 [PROTOCOL.md](PROTOCOL.md) 获取可用方法的完整列表。

---

## 命令别名

为方便起见，提供标准命令的短别名：

### `T0`, `T1`, `T2`, `T3`

快速切换到相应料槽的工具。

**示例：**
```gcode
T0  # 等同于：ACE_CHANGE_TOOL TOOL=0
T1  # 等同于：ACE_CHANGE_TOOL TOOL=1
T2  # 等同于：ACE_CHANGE_TOOL TOOL=2
T3  # 等同于：ACE_CHANGE_TOOL TOOL=3
```

### `TR`

卸载当前耗材。

**示例：**
```gcode
TR  # 等同于：ACE_CHANGE_TOOL TOOL=-1
```

---

## G-code 宏

`ace.cfg` 文件中定义了额外的宏用于与切片器集成：

### `_ACE_PRE_TOOLCHANGE`

在换刀前执行的宏。

**参数：**
- `FROM` - 上一个工具的索引（如果没有则为 -1）
- `TO` - 新工具的索引

**用途：** 在 `ace.cfg` 中根据您的打印机配置进行定制。

### `_ACE_POST_TOOLCHANGE`

在换刀后执行的宏。

**参数：**
- `FROM` - 上一个工具的索引
- `TO` - 新工具的索引

### `SET_INFINITY_SPOOL_ORDER`

设置无限料盘料槽顺序的便捷宏。

**语法：**
```gcode
SET_INFINITY_SPOOL_ORDER ORDER="<顺序>"
```

**示例：**
```gcode
SET_INFINITY_SPOOL_ORDER ORDER="0,1,2,3"
SET_INFINITY_SPOOL_ORDER ORDER="0,1,none,3"
```

### `RESET_INFINITY_SPOOL`

重置无限料盘顺序位置的宏。

**语法：**
```gcode
RESET_INFINITY_SPOOL
```

### `_ACE_PRE_INFINITYSPOOL`

在无限料盘模式切换料盘前执行的宏。

**用途：** 在 `ace.cfg` 中根据您的打印机配置进行定制。

### `_ACE_POST_INFINITYSPOOL`

在无限料盘模式切换料盘后执行的宏。

**用途：** 在 `ace.cfg` 中根据您的打印机配置进行定制。

### `_ACE_ON_EMPTY_ERROR`

检测到空料槽时执行的宏。

**参数：**
- `INDEX` - 空料槽的索引

**默认行为：** 暂停打印并显示错误消息。

---

## 使用示例

### 完整换刀

```gcode
# 加载料槽 0
ACE_CHANGE_TOOL TOOL=0

# 或通过别名
T0
```

### 送料和回退

```gcode
# 从料槽 0 送出 50mm 耗材
ACE_FEED INDEX=0 LENGTH=50 SPEED=25

# 回退 30mm 耗材
ACE_RETRACT INDEX=0 LENGTH=30 SPEED=20
```

### 烘干耗材

```gcode
# 以 50°C 启动烘干 2 小时
ACE_START_DRYING TEMP=50 DURATION=120

# 停止烘干
ACE_STOP_DRYING
```

### 无限料盘模式

```gcode
# 1. 设置料槽切换顺序
ACE_SET_INFINITY_SPOOL_ORDER ORDER="0,1,2,3"

# 或跳过空料槽：
ACE_SET_INFINITY_SPOOL_ORDER ORDER="0,1,none,3"

# 2. 打印期间耗材结束时
ACE_INFINITY_SPOOL

# 自动根据顺序切换到下一个料槽

# 3. 重置位置（从顺序开头开始）
RESET_INFINITY_SPOOL
```

### 料槽映射

```gcode
# 查看当前映射
ACE_GET_SLOTMAPPING

# 设置非标准映射（T0 -> 物理料槽 2）
ACE_SET_SLOTMAPPING INDEX=0 SLOT=2

# 重置为默认
ACE_RESET_SLOTMAPPING
```

### 连接诊断

```gcode
# 检查连接状态
ACE_CONNECTION_STATUS

# 出现问题时重新连接
ACE_RECONNECT

# 完全断开并重新连接
ACE_DISCONNECT
ACE_CONNECT
```

### 诊断

```gcode
# 检查状态
ACE_STATUS

# 获取命令帮助
ACE_GET_HELP

# 获取设备信息
ACE_DEBUG METHOD=get_info

# 耗材信息
ACE_FILAMENT_INFO INDEX=0
```

---

## 错误处理

所有命令通过以下方式返回错误信息：
- G-code 控制台消息
- Klipper 日志（`~/printer_data/logs/klippy.log`）
- 通过 `ACE_STATUS` 的状态

**常见错误：**
- `ACE Error: Slot is not ready` - 料槽为空或未就绪
- `ACE Error: Parking failed` - 耗材停靠失败
- `ACE Error: Connection lost` - 与设备失去连接

---

*最后更新日期：2025*

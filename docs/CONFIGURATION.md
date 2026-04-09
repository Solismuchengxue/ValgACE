# ValgACE 配置指南

ValgACE 模块所有配置参数的详细说明。

## 目录

1. [基本配置](#基本配置)
2. [连接参数](#连接参数)
3. [超时参数](#超时参数)
4. [工作参数](#工作参数)
5. [日志参数](#日志参数)
6. [G-code 宏](#g-code-宏)
7. [配置示例](#配置示例)

---

## 基本配置

### `[ace]` 段

所有 ValgACE 模块的参数都在 `ace.cfg` 文件的 `[ace]` 段中设置。

**重要：** `ace.cfg.sample` 文件包含配置示例和现成的 G-code 宏，可以作为您配置的基础。建议从复制 `ace.cfg.sample` 到 `ace.cfg` 开始，并根据您的打印机进行调整。

**最小配置：**
```ini
[ace]
serial: /dev/serial/by-id/usb-ANYCUBIC_ACE_1-if00
baud: 115200
```

---

## 连接参数

### `serial`

ACE 设备的串口路径。

**类型：** 字符串  
**默认值：** 通过 VID/PID 自动搜索或 `/dev/ttyACM0`

**示例：**
```ini
serial: /dev/serial/by-id/usb-ANYCUBIC_ACE_1-if00
serial: /dev/ttyACM0
serial: /dev/ttyUSB0
```

**建议：**
- 使用 `/dev/serial/by-id/` 以保持稳定性（重新连接时不会改变）
- 模块会自动通过 VID/PID `0x28e9:0x018a` 检测设备
- 如果设备可以自动检测，可以不指定

**自动搜索：**
模块会自动搜索以下设备：
- VID/PID: `0x28e9:0x018a`
- 端口描述："ACE"、"BunnyAce"、"DuckAce"

---

### `baud`

与设备的通信波特率。

**类型：** 整数  
**默认值：** `115200`

**可选值：**
- `115200`（推荐，ACE Pro 的标准值）

**示例：**
```ini
baud: 115200
```

**注意：** 除非需要兼容性，否则不建议更改波特率。

---

## 超时参数

### `response_timeout`

等待设备响应的超时时间（秒）。

**类型：** 浮点数  
**默认值：** `2.0`

**示例：**
```ini
response_timeout: 2.0
```

**建议：**
- 不建议降低到 1.0 秒以下
- 增加可能导致对错误的响应变慢

---

### `read_timeout`

从端口读取数据的超时时间（秒）。

**类型：** 浮点数  
**默认值：** `0.1`

**示例：**
```ini
read_timeout: 0.1
```

---

### `write_timeout`

向端口写入数据的超时时间（秒）。

**类型：** 浮点数  
**默认值：** `0.5`

**示例：**
```ini
write_timeout: 0.5
```

---

### `max_queue_size`

命令队列的最大大小。

**类型：** 整数  
**默认值：** `20`

**示例：**
```ini
max_queue_size: 20
```

**注意：** 当队列溢出时，旧命令会被以 "Queue overflow" 错误删除。

---

## 工作参数

### `feed_speed`

默认的耗材送料速度（毫米/秒）。

**类型：** 整数  
**默认值：** `50`（代码中），`25`（配置中）

**范围：** 10-25（制造商推荐）

**示例：**
```ini
feed_speed: 25
```

**注意：** 代码中的默认值（`50`）和配置中的默认值（`25`）不同。建议使用配置中的值。

---

### `retract_speed`

默认的耗材回退速度（毫米/秒）。

**类型：** 整数  
**默认值：** `50`（代码中），`25`（配置中）

**范围：** 10-25（制造商推荐）

**示例：**
```ini
retract_speed: 25
```

---

### `retract_mode`

耗材回退模式。

**类型：** 整数  
**默认值：** `0`

**可选值：**
- `0` - 普通模式（normal mode）
- `1` - 增强模式（enhanced mode）

**示例：**
```ini
retract_mode: 0
```

**注意：** 增强模式对某些类型的耗材可能更可靠。

---

### `toolchange_retract_length`

换刀时的耗材回退长度（毫米）。

**类型：** 整数  
**默认值：** `100`

**示例：**
```ini
toolchange_retract_length: 100
```

**注意：** 如果遇到热端残留耗材的问题，可以增加此值。

---

### `park_hit_count`

完成停靠所需的稳定检查次数。

**类型：** 整数  
**默认值：** `5`

**示例：**
```ini
park_hit_count: 5
```

**工作原理：**
- 停靠期间，模块跟踪 `feed_assist_count` 计数器
- 当计数器连续 `park_hit_count` 次不变时，认为停靠完成
- 较小的值 = 更快完成（但可靠性较低）
- 较大的值 = 更可靠（但较慢）

**建议：**
- 从默认值（5）开始
- 如果停靠完成太快 → 增加该值
- 如果停靠无法完成 → 减小该值（但不小于 3）

---

### `aggressive_parking`

启用使用耗材传感器的替代停靠算法。

**类型：** 布尔值
**默认值：** `False`

**示例：**
```ini
aggressive_parking: True
```

**工作原理：**
- 启用后开始送丝
- 当传感器检测到耗材时，切换到传统算法
- 在某些配置中对更可靠的停靠有用

**要求：**
- 必须通过 `filament_sensor` 参数配置外部耗材传感器

**停靠算法：**
- 启用 `aggressive_parking` 时使用两种算法：
  - **基于传感器的停靠**：使用外部耗材传感器确定停靠时机
  - **基于距离的停靠**：在没有耗材传感器时使用，将耗材送出指定距离

**附加参数：**
- `max_parking_distance`：激进停靠时送丝的最大距离（毫米）
- `parking_speed`：激进停靠时的送丝速度（毫米/秒）
- `extended_park_time`：基于传感器的停靠超时的额外时间（秒）
- `max_parking_timeout`：换刀时等待停靠完成的最大时间（秒）

---

### `max_parking_distance`

激进停靠时送丝的最大距离（毫米）。

**类型：** 整数
**默认值：** `100`

**示例：**
```ini
max_parking_distance: 100
```

**注意：** 如果在此距离内传感器未检测到耗材，停靠将被中断并报错。

---

### `parking_speed`

激进停靠时的送丝速度（毫米/秒）。

**类型：** 整数
**默认值：** `10`

**示例：**
```ini
parking_speed: 10
```

**建议：**
- 较低的速度 = 传感器检测更精确
- 较高的速度 = 停靠更快，但精度较低

---

### `extended_park_time`

基于传感器的停靠超时的额外时间（秒）。

**类型：** 整数
**默认值：** `10`

**示例：**
```ini
extended_park_time: 10
```

**注意：** 此时间添加到计算的停靠超时中，以确保可靠地完成过程。

---

### `max_parking_timeout`

换刀时等待停靠完成的最大时间（秒）。

**类型：** 整数
**默认值：** `60`

**示例：**
```ini
max_parking_timeout: 60
```

**注意：** 如果在此时间内停靠未完成，操作将被中断并报错。

---

### `max_dryer_temperature`

烘干机的最高温度（°C）。

**类型：** 整数  
**默认值：** `55`

**示例：**
```ini
max_dryer_temperature: 55
```

**注意：** 
- 高于 60°C 的值未经测试，可能不安全
- 用于限制 `ACE_START_DRYING` 命令中的 `TEMP` 参数

---

### `disable_assist_after_toolchange`

换刀后是否禁用送丝辅助。

**类型：** 布尔值  
**默认值：** `True`

**示例：**
```ini
disable_assist_after_toolchange: True
```

**注意：**
- 如果为 `True` - 换刀后辅助功能自动禁用
- 如果为 `False` - 辅助功能保持启用

---

### `infinity_spool_mode`

无限料盘模式（耗材结束时自动切换）。

**类型：** 布尔值
**默认值：** `False`

**示例：**
```ini
infinity_spool_mode: True
```

**要求：**
- 必须通过 `ACE_SET_INFINITY_SPOOL_ORDER` 设置料槽顺序
- 顺序中至少有一个料槽必须就绪（`ready`）

**使用方法：**
1. 在配置中启用模式：`infinity_spool_mode: True`
2. 设置料槽顺序：`ACE_SET_INFINITY_SPOOL_ORDER ORDER="0,1,2,3"`
3. 耗材结束时使用 `ACE_INFINITY_SPOOL`

**变量：**
- `ace_infsp_order` - 料槽顺序（字符串，例如：`"0,1,none,3"`）
- `ace_infsp_position` - 顺序中的当前位置（0-3）

**重置位置：**
```gcode
RESET_INFINITY_SPOOL
```

---

### `infinity_spool_debounce`

自动监控时确认 'empty' 状态的去抖时间（秒）。

**类型：** 浮点数
**默认值：** `2.0`

**示例：**
```ini
infinity_spool_debounce: 2.0
```

**工作原理：**
- 检测到 'empty' 状态时启动去抖定时器
- 状态必须在指定时间内保持 'empty'
- 防止状态临时变化导致的误触发

**建议：**
- `1.0-2.0` - 稳定运行
- `3.0-5.0` - 适用于不可靠的传感器或有问题的料槽

---

### `infinity_spool_pause_on_no_sensor`

无限料盘期间没有耗材传感器时是否暂停打印。

**类型：** 布尔值
**默认值：** `True`

**示例：**
```ini
infinity_spool_pause_on_no_sensor: True
```

**工作原理：**
- **当为 `True` 时**：如果没有耗材传感器，检测到 empty 状态时打印暂停，允许用户手动确认切换
- **当为 `False` 时**：如果没有耗材传感器，确认 empty 状态后立即切换料槽（需要确信可靠性）

**建议：**
- `True` - 安全模式，推荐给大多数用户
- `False` - 用于完全自动化打印，无需干预

---

### Infinity Spool 自动触发系统

启用 `infinity_spool_mode` 时，在打印期间自动监控活动料槽状态：

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

**完全自动化打印的配置示例：**
```ini
[ace]
serial: /dev/serial/by-id/usb-ANYCUBIC_ACE_1-if00
baud: 115200

# Infinity Spool 模式
infinity_spool_mode: True
infinity_spool_debounce: 2.0
infinity_spool_pause_on_no_sensor: False  # 无暂停自动切换

# 外部耗材传感器（推荐）
filament_sensor: my_filament_sensor
```

---

### `filament_sensor`

用于与 ACE 模块集成的外部耗材传感器名称。

**类型：** 字符串（传感器名称）
**默认值：** 未设置

**示例：**
```ini
filament_sensor: my_filament_sensor
```

**功能：**
- 将外部耗材传感器与 ACE 模块集成
- 允许通过 `ACE_CHECK_FILAMENT_SENSOR` 命令检查传感器状态
- 在设备总状态中包含传感器信息（通过 `ACE_STATUS` 和 Moonraker API）
- 允许在宏和自动化中使用传感器

**注意：** 名称必须与 Klipper 配置中定义的传感器名称匹配（例如，`[filament_switch_sensor my_filament_sensor]`）。

---

## 状态字段

ACE 模块通过 `get_status` 方法返回额外的状态字段：

### `feed_assist_slot`
- 激活送丝辅助的料槽索引（如果禁用则为 -1）
- 显示当前哪个料槽正在使用送丝辅助

### `filament_sensor`
- 外部耗材传感器状态（如果已配置）
- 包括耗材存在信息和传感器状态

### `slot_mapping`
- 索引到料槽的映射信息
- 显示当前 Klipper 索引（T0-T3）与设备物理料槽的对应关系

---

### `set_pause_macro_name`

打印期间失去连接时调用的宏名称。

**类型：** 字符串
**默认值：** `PAUSE`

**示例：**
```ini
set_pause_macro_name: PAUSE
```

**工作原理：**
- 打印期间与 ACE 设备失去连接时调用指定的宏
- 这允许安全地停止打印并防止问题
- 如果与标准宏不同，可以指定自定义暂停宏

**自定义宏示例：**
```ini
set_pause_macro_name: MY_CUSTOM_PAUSE
```

**注意：** 确保指定的宏存在于 Klipper 配置中。

---

## 日志参数

### `disable_logging`

禁用事件日志记录。

**类型：** 布尔值  
**默认值：** `False`（启用日志记录）

**示例：**
```ini
# 禁用日志记录
disable_logging: True
```

---

### `log_dir`

日志目录。

**类型：** 字符串（路径）  
**默认值：** `~/printer_data/logs`

**示例：**
```ini
log_dir: ~/printer_data/logs
```

---

### `log_level`

日志记录的详细程度级别。

**类型：** 字符串  
**默认值：** `INFO`

**可选值：**
- `DEBUG` - 最大详细程度（包括数据交换）
- `INFO` - 主要事件和命令
- `WARNING` - 仅警告和错误
- `ERROR` - 仅严重错误

**示例：**
```ini
log_level: DEBUG
```

**建议：**
- `DEBUG` - 用于调试问题
- `INFO` - 用于正常运行
- `WARNING` / `ERROR` - 用于最小化日志

---

### `max_log_size`

单个日志文件的最大大小（MB）。

**类型：** 整数  
**默认值：** `10`

**示例：**
```ini
max_log_size: 10
```

---

### `log_backup_count`

轮转日志文件的数量。

**类型：** 整数  
**默认值：** `3`

**示例：**
```ini
log_backup_count: 3
```

**注意：** 达到 `max_log_size` 时创建新文件，旧文件保留至 `log_backup_count` 个。

---

## G-code 宏

### 必需宏

这些宏必须在 `ace.cfg` 中定义：

#### `_ACE_PRE_TOOLCHANGE`

在换刀前执行。

**参数：**
- `FROM` - 上一个工具的索引（如果没有则为 -1）
- `TO` - 新工具的索引

**配置示例：**
```gcode
[gcode_macro _ACE_PRE_TOOLCHANGE]
gcode:
    # 加热挤出机到工作温度
    SET_HEATER_TEMPERATURE HEATER=extruder TARGET=220
    TEMPERATURE_WAIT SENSOR=extruder MINIMUM=220
    
    # 保存状态
    SAVE_GCODE_STATE NAME=FILAMENT_CHANGE_STATE
    
    # 禁用上一个料槽的辅助
    {% if params.FROM is defined and params.FROM|int != -1 %}
        ACE_DISABLE_FEED_ASSIST INDEX={params.FROM|int}
    {% endif %}
    
    # 移动到清理区域
    G1 X-8 Y0 F7800
```

#### `_ACE_POST_TOOLCHANGE`

在换刀后执行。

**参数：**
- `FROM` - 上一个工具的索引
- `TO` - 新工具的索引

**配置示例：**
```gcode
[gcode_macro _ACE_POST_TOOLCHANGE]
gcode:
    # 送丝以清理
    {% if params.TO is defined and params.TO|int != -1 %}
        G91
        G1 E100 F300
        G90
    {% endif %}
    
    # 启用新料槽的辅助
    {% if params.TO is defined and params.TO|int != -1 %}
        ACE_ENABLE_FEED_ASSIST INDEX={params.TO|int}
    {% endif %}
    
    # 恢复状态
    RESTORE_GCODE_STATE NAME=FILAMENT_CHANGE_STATE MOVE=1 MOVE_SPEED=1500
```

#### `_ACE_ON_EMPTY_ERROR`

检测到空料槽时执行。

**参数：**
- `INDEX` - 空料槽的索引

**示例：**
```gcode
[gcode_macro _ACE_ON_EMPTY_ERROR]
gcode:
    {action_respond_info("Spool is empty")}
    {% if printer.idle_timeout.state == "Printing" %}
        PAUSE
    {% endif %}
```

### 可选宏

用于无限料盘模式：

#### `_ACE_PRE_INFINITYSPOOL`

在无限料盘模式切换料盘前执行。

**参数：** 无

**用途：** 在 `ace.cfg` 中根据您的打印机配置进行定制。

#### `_ACE_POST_INFINITYSPOOL`

在无限料盘模式切换料盘后执行。

**参数：** 无

**用途：** 在 `ace.cfg` 中根据您的打印机配置进行定制。

#### `SET_INFINITY_SPOOL_ORDER`

设置无限料盘料槽顺序的便捷宏。

**参数：**
- `ORDER` - 料槽顺序，格式为 `"0,1,2,3"` 或 `"0,1,none,3"`

**示例：**
```gcode
[gcode_macro SET_INFINITY_SPOOL_ORDER]
gcode:
    {% if params.ORDER is defined %}
        ACE_SET_INFINITY_SPOOL_ORDER ORDER={params.ORDER}
    {% else %}
        RESPOND TYPE=error MSG="ORDER parameter required"
    {% endif %}
```

#### `RESET_INFINITY_SPOOL`

重置无限料盘顺序中的位置。

**示例：**
```gcode
[gcode_macro RESET_INFINITY_SPOOL]
gcode:
    SAVE_VARIABLE VARIABLE=ace_infsp_position VALUE=0
```

---

## 配置示例

### 最小配置

```ini
[ace]
serial: /dev/serial/by-id/usb-ANYCUBIC_ACE_1-if00
baud: 115200
```

---

### 标准配置

```ini
[ace]
serial: /dev/serial/by-id/usb-ANYCUBIC_ACE_1-if00
baud: 115200

# 工作参数
feed_speed: 25
retract_speed: 25
retract_mode: 0
toolchange_retract_length: 100
park_hit_count: 5
max_dryer_temperature: 55
disable_assist_after_toolchange: True
infinity_spool_mode: False

# 命令队列
max_queue_size: 20
```

---

### 调试配置

```ini
[ace]
serial: /dev/serial/by-id/usb-ANYCUBIC_ACE_1-if00
baud: 115200

# 日志记录
log_level: DEBUG
max_log_size: 20
log_backup_count: 5

# 超时
response_timeout: 3.0
read_timeout: 0.2
write_timeout: 1.0

# 工作参数
feed_speed: 25
retract_speed: 25
park_hit_count: 3  # 更小以便快速调试
```

---

### 无限料盘配置

```ini
[ace]
serial: /dev/serial/by-id/usb-ANYCUBIC_ACE_1-if00
baud: 115200

# 启用无限料盘模式
infinity_spool_mode: True

# 工作参数
feed_speed: 25
retract_speed: 25
toolchange_retract_length: 100
park_hit_count: 5
disable_assist_after_toolchange: True
```

**配置后设置料槽顺序：**
```gcode
ACE_SET_INFINITY_SPOOL_ORDER ORDER="0,1,2,3"
# 或跳过空料槽：
ACE_SET_INFINITY_SPOOL_ORDER ORDER="0,1,none,3"
```

---

### 优化快速工作配置

```ini
[ace]
serial: /dev/serial/by-id/usb-ANYCUBIC_ACE_1-if00
baud: 115200

# 快速超时
response_timeout: 1.5
read_timeout: 0.05
write_timeout: 0.3

# 优化停靠
park_hit_count: 3  # 更快完成

# 禁用日志以提高性能
disable_logging: True
```

---

### 激进停靠配置

```ini
[ace]
serial: /dev/serial/by-id/usb-ANYCUBIC_ACE_1-if00
baud: 115200

# 外部耗材传感器（激进停靠必需）
filament_sensor: my_filament_sensor

# 激进停靠
aggressive_parking: True
max_parking_distance: 100
parking_speed: 10
extended_park_time: 10
max_parking_timeout: 60

# 工作参数
feed_speed: 25
retract_speed: 25
park_hit_count: 5
```

**注意：** 使用激进停靠需要在 Klipper 中配置外部耗材传感器：

```ini
[filament_switch_sensor my_filament_sensor]
switch_pin: <your_sensor_pin>
pause_on_runout: False  # 通过 ACE 控制
```

---

## 配置建议

### 针对不同打印机类型

**Creality K1 / K1 Max：**
- 使用标准配置
- 默认值工作良好

**其他打印机：**
- 从标准配置开始
- 如果停靠不稳定，必要时增加 `park_hit_count`
- 如果停靠太慢，减小 `park_hit_count`

### 针对不同耗材类型

**PLA：**
- 标准值工作良好
- `retract_mode: 0` 通常足够

**TPU / Flex：**
- 可能需要 `retract_mode: 1`（增强模式）
- 降低送料/回退速度

**ABS / PETG：**
- 标准值通常适用
- 可能需要增加 `toolchange_retract_length`

---

## 验证配置

更改配置后：

1. **检查语法：**
```bash
python3 -m py_compile ~/printer_data/config/ace.cfg
```

2. **重启 Klipper：**
```bash
sudo systemctl restart klipper
```

3. **检查日志：**
```bash
tail -f ~/printer_data/logs/klippy.log | grep -i ace
```

4. **检查连接：**
```gcode
ACE_STATUS
ACE_DEBUG METHOD=get_info
```

---

*最后更新日期：2026-03*

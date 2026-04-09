# ValgACE 用户指南

本指南详细介绍了如何使用 ValgACE 模块控制 Anycubic Color Engine Pro 设备。

## 目录

1. [简介](#简介)
2. [核心概念](#核心概念)
3. [Dashboard 网页界面](#dashboard-网页界面)
4. [首次使用](#首次使用)
5. [工具切换](#工具切换)
6. [耗材管理](#耗材管理)
7. [烘干控制](#烘干控制)
8. [无限料盘模式](#无限料盘模式)
9. [切片软件集成](#切片软件集成)
10. [典型场景](#典型场景)

---

## 简介

ValgACE 通过 Klipper 的 G 代码指令，为 Anycubic Color Engine Pro 设备提供完整的控制功能。本指南将帮助您全面掌握该模块的各项能力。

### 您将学到
- 如何检查设备连接状态
- 如何加载和卸载耗材
- 如何使用自动工具切换
- 如何配置耗材烘干
- 如何与切片软件集成以实现多色打印

---

## 核心概念

### 料槽 (Slots)
ACE Pro 设备支持 **4 个耗材槽**：
- **索引：** 0, 1, 2, 3
- **状态：** 每个料槽状态可为 `ready`（就绪）或 `empty`（空）

### 工具 (Tools)
- **`TOOL=-1`：** 卸载耗材（当前无工具）
- **`TOOL=0-3`：** 从对应索引的料槽加载耗材

### 停驻 (Parking)
将耗材从 ACE 设备输送至打印机喷头的过程。当耗材撞击末端限位开关的计数稳定时，即判定为停驻成功。

### 辅助送料 (Feed Assist)
在打印过程中自动维持耗材张力的辅助机制。

---

## Dashboard 网页界面

ValgACE Dashboard 是一个现代化的网页管理界面，可通过浏览器直接控制 ACE 设备。它提供了直观的图形化界面，涵盖所有设备操作功能。

### 安装 Dashboard
详细安装说明请参阅 [网页界面 README](../../web-interface/README.md)。

**快速安装：**
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
3. 在浏览器中打开：`http://<打印机IP>:8080/index.html`

### Dashboard 核心功能

#### 状态监控
- **设备状态**：实时显示（型号、固件版本、温度、风扇转速）
- **连接指示灯**：显示 WebSocket 连接状态
- **自动刷新**：每 5 秒自动更新状态

#### 料槽管理
每个料槽支持以下操作：
- **加载**：从该料槽加载耗材 (`ACE_CHANGE_TOOL`)
- **停驻**：将耗材送至喷头位置 (`ACE_PARK_TO_TOOLHEAD`)
- **辅助送料**：启用/禁用该料槽的 feed assist (`ACE_ENABLE_FEED_ASSIST` / `ACE_DISABLE_FEED_ASSIST`)
  - 启用时：按钮呈绿色，显示“辅助送料 开启”
  - 未启用时：按钮显示绿色边框“辅助送料”
- **送料**：弹出对话框，输入指定长度进行送料
- **退料**：弹出对话框，输入指定长度进行退料

#### 烘干控制
- 设置目标温度（20-55°C）
- 设置烘干时长（分钟）
- 启动/停止烘干过程
- 显示剩余时间

#### 快捷操作
- **卸载耗材**：快速卸载当前耗材
- **刷新状态**：强制刷新设备状态

### 使用 Dashboard
1. 在浏览器中**打开界面**
2. **检查连接**：指示灯应为绿色
3. **查看料槽状态**：状态为“就绪”的料槽可用
4. **执行操作**：点击对应按钮完成操作

### 配置 Dashboard
编辑 `ace-dashboard-config.js` 可自定义：
- Moonraker API 地址
- 状态刷新间隔
- 指令默认参数

详见配置文件内的注释说明。

---

## 首次使用

### 步骤 1：检查连接
安装配置完成后，验证连接状态：
```gcode
ACE_STATUS
```
应返回设备状态。若显示 `disconnected`，请检查：
- USB 物理连接
- `ace.cfg` 中的端口配置
- Klipper 日志

### 步骤 2：获取设备信息
```gcode
ACE_DEBUG METHOD=get_info
```
应返回以下信息：
- 设备型号
- 固件版本
- 料槽数量

### 步骤 3：检查料槽状态
```gcode
ACE_STATUS
```
查看返回数据中的料槽信息。状态为 `ready` 的料槽即可投入使用。

---

## 工具切换

### 加载耗材
**基础方式：**
```gcode
ACE_CHANGE_TOOL TOOL=0
```
**通过别名：**
```gcode
T0  # 效果相同
```
**执行流程：**
1. 检查当前已加载的工具
2. 若已加载其他工具，先退出现有耗材
3. 等待原料槽退料完成并恢复就绪
4. 将新料槽的耗材停驻至喷头
5. 准备开始打印

### 卸载耗材
```gcode
ACE_CHANGE_TOOL TOOL=-1
```
或通过别名：
```gcode
TR
```

### 切换料槽
```gcode
# 原为 T0，切换至 T2
ACE_CHANGE_TOOL TOOL=2
```
模块将自动：
- 退出现有槽位 0 的耗材
- 等待槽位 0 恢复就绪
- 加载槽位 2 的耗材
- 将新耗材停驻至喷头

---

## 耗材管理

### 送料
```gcode
ACE_FEED INDEX=0 LENGTH=50 SPEED=25
```
**参数：**
- `INDEX`：料槽编号 (0-3)
- `LENGTH`：送料长度（mm）
- `SPEED`：送料速度（mm/s，可选）

**示例：**
```gcode
# 从槽位 0 送料 50mm
ACE_FEED INDEX=0 LENGTH=50 SPEED=25

# 以默认速度送料 100mm
ACE_FEED INDEX=2 LENGTH=100
```

### 退料
```gcode
ACE_RETRACT INDEX=0 LENGTH=50 SPEED=25 MODE=0
```
**参数：**
- `INDEX`：料槽编号 (0-3)
- `LENGTH`：退料长度（mm）
- `SPEED`：退料速度（mm/s，可选）
- `MODE`：退料模式 (0=普通, 1=增强)

**示例：**
```gcode
# 普通模式退料 50mm
ACE_RETRACT INDEX=0 LENGTH=50 SPEED=25 MODE=0

# 增强模式退料 100mm
ACE_RETRACT INDEX=1 LENGTH=100 MODE=1
```

### 运行时调整速度
送料或退料过程中可动态修改速度：
```gcode
# 开始送料
ACE_FEED INDEX=0 LENGTH=200 SPEED=20

# 降低送料速度
ACE_UPDATE_FEEDING_SPEED INDEX=0 SPEED=15

# 停止送料
ACE_STOP_FEED INDEX=0
```

### 停止操作
```gcode
# 停止送料
ACE_STOP_FEED INDEX=0

# 停止退料
ACE_STOP_RETRACT INDEX=0
```

---

## 耗材停驻（归位）

### 手动停驻
```gcode
ACE_PARK_TO_TOOLHEAD INDEX=0
```
**执行过程：**
- 为指定料槽启用辅助送料
- 耗材开始向喷头输送
- 模块通过撞击计数跟踪进度
- 计数稳定后，停驻完成
- 辅助送料自动关闭

**检查停驻状态：**
```gcode
ACE_STATUS
```
查看 `feed_assist_count` 值，该数值随耗材撞击喷头限位开关的次数递增。

### 自动停驻
停驻会在以下情况自动触发：
- 执行工具切换 (`ACE_CHANGE_TOOL`)
- 使用无限料盘模式时

---

## 烘干控制

### 启动烘干
```gcode
ACE_START_DRYING TEMP=50 DURATION=120
```
**参数：**
- `TEMP`：烘干温度 °C (20-55)
- `DURATION`：时长（分钟，最大 240）

**示例：**
```gcode
# 50°C 烘干 2 小时
ACE_START_DRYING TEMP=50 DURATION=120

# 45°C 烘干 4 小时（最大时长）
ACE_START_DRYING TEMP=45 DURATION=240
```
**执行过程：**
- 烘干加热启动
- 风扇开启（7000 RPM）
- 维持设定温度
- 计时结束后，风扇继续运转直至降温完成

### 检查烘干状态
```gcode
ACE_STATUS
```
查看 `dryer` 字段：
```json
{
  "dryer": {
    "status": "drying",
    "target_temp": 50,
    "duration": 240,
    "remain_time": 120
  },
  "temp": 48
}
```

### 停止烘干
```gcode
ACE_STOP_DRYING
```
风扇将继续运转，直至加热模块完全冷却。

---

## 无限料盘模式 (Infinity Spool)

### 配置
在 `ace.cfg` 中启用：
```ini
infinity_spool_mode: True
```

### 设置料槽切换顺序
使用该模式前，必须定义料槽轮询顺序：
```gcode
# 简单顺序：0 → 1 → 2 → 3
ACE_SET_INFINITY_SPOOL_ORDER ORDER="0,1,2,3"

# 跳过空槽位 2：0 → 1 → (跳过) → 3
ACE_SET_INFINITY_SPOOL_ORDER ORDER="0,1,none,3"

# 自定义顺序：2 → 0 → 1 → 3
ACE_SET_INFINITY_SPOOL_ORDER ORDER="2,0,1,3"
```
**顺序参数说明：**
- 使用数字 `0-3` 指定料槽
- 使用 `none` 标记需跳过的空槽位
- 顺序必须严格包含 4 个元素

### 使用方法
打印过程中耗材耗尽时调用：
```gcode
ACE_INFINITY_SPOOL
```
**执行流程：**
1. 从变量 `ace_infsp_order` 读取预设顺序
2. 查找当前活跃料槽在顺序中的位置
3. 按顺序确定下一个料槽（自动跳过 `none`）
4. 检查目标料槽是否就绪
5. 执行宏 `_ACE_PRE_INFINITYSPOOL`
6. 将新料槽耗材停驻至喷头
7. 执行宏 `_ACE_POST_INFINITYSPOOL`
8. 更新顺序中的当前位置

**特性：**
- 顺序在重启后保留（需启用 `save_variables`）
- 到达顺序末尾后自动循环至开头
- 标记为 `none` 的槽位自动跳过
- 可随时通过 `ACE_SET_INFINITY_SPOOL_ORDER` 修改顺序

### 重置位置
如需从顺序开头重新开始：
```gcode
RESET_INFINITY_SPOOL
```
该命令将重置当前位置指针，下次切换将从首个料槽开始。

---

## 切片软件集成

### PrusaSlicer / SuperSlicer
在打印机设置中添加工具切换宏：

**打印开始：**
```gcode
T0  ; 加载槽位 0
G28 ; 归位校准
```
**切换颜色/材料：**
```gcode
T1  ; 切换至槽位 1
```
**PrusaSlicer 设置路径：**
1. Printer Settings → Custom G-code
2. Tool change G-code: `T[current_extruder]`
3. Before layer change G-code: （可选）

### Cura
**配置工具切换：**
1. Extensions → Post Processing → Modify G-Code
2. Add Script → Tool Change
3. 在 "Tool Change G-code" 字段输入：
```
T[tool]
```

### OrcaSlicer
与 PrusaSlicer 类似，使用 `T0-T3` 宏进行工具切换。

---

## 典型场景

### 场景 1：首次加载耗材
```gcode
# 1. 检查设备状态
ACE_STATUS

# 2. 从槽位 0 加载耗材
T0

# 3. 确认加载成功
ACE_STATUS
```

### 场景 2：多色打印
**准备工作：**
```gcode
# 预加载所需颜色
T0  # 红色
T1  # 蓝色
T2  # 黄色
```
**切片软件中：**
- 将工具切换设置为 `T0-T3` 宏
- 每个颜色层/区块将自动调用对应工具

### 场景 3：打印前烘干耗材
```gcode
# 1. 启动 2 小时烘干
ACE_START_DRYING TEMP=50 DURATION=120

# 2. 定期检查状态
ACE_STATUS

# 3. 烘干完成后加载耗材
T0
```

### 场景 4：更换空料盘
```gcode
# 1. 检测到空料槽（通过 _ACE_ON_EMPTY_ERROR 自动触发）
# 打印自动暂停

# 2. 装入新耗材
T1  # 从槽位 1 加载

# 3. 继续打印
RESUME
```

### 场景 5：使用无限料盘模式
**配置：**
```ini
# ace.cfg 中设置
infinity_spool_mode: True
```
**使用：**
```gcode
# 1. 设置切换顺序
ACE_SET_INFINITY_SPOOL_ORDER ORDER="0,1,2,3"

# 或跳过空槽位：
ACE_SET_INFINITY_SPOOL_ORDER ORDER="0,1,none,3"

# 2. 打印中耗材耗尽时触发
ACE_INFINITY_SPOOL

# 系统将按预设顺序自动切换至下一料槽
```
**顺序示例：**
```gcode
# 简单顺序：0 → 1 → 2 → 3
ACE_SET_INFINITY_SPOOL_ORDER ORDER="0,1,2,3"

# 跳过槽位 2：0 → 1 → (跳过) → 3 → 0 → ...
ACE_SET_INFINITY_SPOOL_ORDER ORDER="0,1,none,3"

# 自定义顺序：2 → 0 → 1 → 3 → 2 → ...
ACE_SET_INFINITY_SPOOL_ORDER ORDER="2,0,1,3"

# 重置位置（从头开始）
RESET_INFINITY_SPOOL
```
**注意事项：**
- 使用 `ACE_INFINITY_SPOOL` 前必须先设置顺序
- 顺序重启后保留（需 `save_variables`）
- 可随时修改顺序
- `none` 标记的槽位将自动跳过

### 场景 6：手动送料/退料（用于清理）
```gcode
# 送料清理喷嘴
ACE_FEED INDEX=0 LENGTH=100 SPEED=20

# 退料收回
ACE_RETRACT INDEX=0 LENGTH=100 SPEED=25
```

---

## 监控与诊断

### 检查设备状态
```gcode
ACE_STATUS
```
**关注字段：**
- `status`：设备状态 (`ready`, `busy`, `disconnected`)
- `slots`：各料槽详细信息
- `dryer`：烘干模块状态
- `temp`：当前温度

### 检查耗材信息
```gcode
ACE_FILAMENT_INFO INDEX=0
```
仅适用于带有 RFID 标签的耗材。

### 调试指令
```gcode
# 获取设备信息
ACE_DEBUG METHOD=get_info

# 获取实时状态
ACE_DEBUG METHOD=get_status
```

### 查看日志
```bash
# 查看 Klipper 日志（过滤 ACE 相关）
tail -f ~/printer_data/logs/klippy.log | grep -i ace

# 按日志级别过滤
tail -f ~/printer_data/logs/klippy.log | grep -i "ace.*debug"
```

---

## 使用建议

### 打印前
1. ✅ 检查所有料槽状态：`ACE_STATUS`
2. ✅ 确认所需料槽已装填并处于就绪状态
3. ✅ 必要时提前烘干耗材
4. ✅ 加载起始工具：`T0`（或其他对应编号）

### 打印中
- 避免手动干预自动工具切换过程
- 通过网页界面监控状态
- 出现报错时优先查看日志

### 打印后
- 可选择卸载耗材：`TR`
- 按需烘干剩余耗材
- 检查设备状态：`ACE_STATUS`

---

## 常见问题解答 (FAQ)

### Q: 如何查看当前加载的是哪个工具？
**A:** 使用 `ACE_STATUS`，或查看通过 `SAVE_VARIABLE` 保存的 `ace_current_index` 变量，也可直接查阅 Klipper 日志。

### Q: 可以只使用部分料槽吗？
**A:** 可以。仅使用需要的料槽即可，其余保持为空或不参与调度。

### Q: 停驻过程卡住未完成怎么办？
**A:** 
1. 检查料槽就绪状态：`ACE_STATUS`
2. 在配置中适当增加 `park_hit_count` 值
3. 查看日志排查具体错误

### Q: 如何使用无限料盘模式？
**A:** 
1. 配置中启用：`infinity_spool_mode: True`
2. 设置顺序：`ACE_SET_INFINITY_SPOOL_ORDER ORDER="0,1,2,3"`
3. 耗材耗尽时调用：`ACE_INFINITY_SPOOL`
4. 空槽位使用 `none` 标记：`ORDER="0,1,none,3"`

### Q: ValgACE 能否用于其他 MMU 设备？
**A:** ValgACE 专为 Anycubic Color Engine Pro 设计。其他多物料设备请使用对应的专用驱动模块。

### Q: 需要频繁检查状态吗？
**A:** 通常不需要，模块全自动运行。仅在遇到问题或进行诊断时手动检查即可。

---

## 连接管理

### 连接控制指令
ValgACE 提供以下指令用于管理与设备的连接：

#### `ACE_CONNECT`
当设备断开连接时，用于重新建立连接。
**示例：**
```gcode
ACE_CONNECT
```

#### `ACE_DISCONNECT`
强制断开与 ACE 设备的连接。
**示例：**
```gcode
ACE_DISCONNECT
```

#### `ACE_CONNECTION_STATUS`
查看当前与设备的连接状态。
**示例：**
```gcode
ACE_CONNECTION_STATUS
```

#### `ACE_CHECK_FILAMENT_SENSOR`
检查外置耗材传感器的状态（需在配置文件中启用）。
**示例：**
```gcode
ACE_CHECK_FILAMENT_SENSOR
```

上述指令对排查连接故障和实时监控设备状态非常实用。

---

*最后更新日期：2025年*
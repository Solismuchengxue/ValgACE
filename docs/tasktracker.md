# 任务跟踪器

ValgACE 项目任务状态跟踪。

---

## 任务：更新 Infinity Spool 文档

- **状态**：已完成
- **描述**：为新的 infinity spool 参数和自动触发系统添加文档
- **执行步骤**：
  - [x] 分析 extras/ace.py 中的代码更改
  - [x] 更新 docs/CONFIGURATION.md - 添加了 infinity_spool_debounce、infinity_spool_pause_on_no_sensor 参数
  - [x] 更新 docs/COMMANDS.md - 添加了自动触发系统的描述
  - [x] 更新 docs/en/CONFIGURATION.md - 英文版本
  - [x] 更新 docs/en/COMMANDS.md - 英文版本
  - [x] 更新 README.md - 删除了关于 infinity spool 不工作的记录
  - [x] 更新 README_EN.md - 英文版本
  - [x] 创建 docs/changelog.md
  - [x] 创建 docs/tasktracker.md
- **依赖项**：无
- **完成日期**：2026-03-22

---

## 任务：激进停靠

- **状态**：已完成
- **描述**：实现使用耗材传感器的替代停靠算法
- **执行步骤**：
  - [x] 添加 aggressive_parking 参数
  - [x] 添加 max_parking_distance、parking_speed、extended_park_time、max_parking_timeout 参数
  - [x] 实现基于传感器的停靠算法
  - [x] 实现基于距离的停靠算法
  - [x] 更新文档
- **依赖项**：filament_sensor（可选）
- **完成日期**：2025-12

---

## 任务：料槽映射系统

- **状态**：已完成
- **描述**：能够将 Klipper 索引（T0-T3）重新映射到设备的物理料槽
- **执行步骤**：
  - [x] 实现 ACE_GET_SLOTMAPPING 命令
  - [x] 实现 ACE_SET_SLOTMAPPING 命令
  - [x] 实现 ACE_RESET_SLOTMAPPING 命令
  - [x] 实现 ACE_GET_CURRENT_INDEX 命令
  - [x] 实现 ACE_SET_CURRENT_INDEX 命令
  - [x] 更新文档
- **依赖项**：无
- **完成日期**：2025-11

---

## 任务：Infinity Spool 自动触发

- **状态**：已完成
- **描述**：自动监控活动料槽状态并在耗材结束时切换
- **执行步骤**：
  - [x] 实现去抖机制以确认 empty 状态
  - [x] 添加 infinity_spool_debounce 参数
  - [x] 添加 infinity_spool_pause_on_no_sensor 参数
  - [x] 与耗材传感器集成
  - [x] 自动调用 ACE_INFINITY_SPOOL
- **依赖项**：必须启用 infinity_spool_mode
- **完成日期**：2026-03

---

## 计划任务

### 任务：组合停靠模式

- **状态**：未开始
- **描述**：为从分流器到打印头距离较大的打印机组合 feed + feed assist
- **执行步骤**：
  - [ ] 算法设计
  - [ ] 实现
  - [ ] 测试
  - [ ] 文档
- **依赖项**：无

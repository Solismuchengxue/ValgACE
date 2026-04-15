# ACE设备温度传感器支持
#
# 版权所有 (C) 2025
#
# 本文件可根据GNU GPLv3许可证条款分发。
#
# 此模块为Anycubic Color Engine (ACE)提供温度传感器
# 从ACE设备状态读取温度

import logging

ACE_REPORT_TIME = 1.0  # 每秒报告一次温度


class TemperatureACE:
    """
    从ACE设备读取温度的温度传感器
    与Klipper的温度监控系统集成
    """
    
    def __init__(self, config):
        self.printer = config.get_printer()
        self.reactor = self.printer.get_reactor()
        self.name = config.get_name().split()[-1]
        
        # ACE模块引用（将在handle_ready中设置）
        self.ace = None
        
        # 温度状态
        self.temp = 0.0
        self.min_temp = 0.0
        self.max_temp = 70.0
        self.measured_min = 99999999.
        self.measured_max = 0.
        
        # 温度更新回调
        self._callback = None
        
        # 注册对象
        self.printer.add_object("temperature_ace " + self.name, self)
        
        # 如果处于调试模式，则跳过定时器设置
        if self.printer.get_start_args().get('debugoutput') is not None:
            return
        
        # 注册定时器以进行周期性温度读取
        self.sample_timer = self.reactor.register_timer(
            self._sample_ace_temperature)
        
        # 注册事件处理程序以在连接后启动
        self.printer.register_event_handler("klippy:connect",
                                            self.handle_connect)
        self.printer.register_event_handler("klippy:ready",
                                            self.handle_ready)
    
    def handle_ready(self):
        """当Klipper准备就绪时获取ACE模块引用"""
        try:
            self.ace = self.printer.lookup_object('ace')
            logging.info("ACE temperature sensor: ACE module found and linked")
        except self.printer.config_error:
            logging.warning("ACE temperature sensor: ACE module not found, sensor will report 0")
            self.ace = None
        except Exception as e:
            logging.error(f"ACE temperature sensor: Error linking to ACE module: {e}")
            self.ace = None
        
        # 启动温度采样定时器（如果不在调试模式下）
        if hasattr(self, 'sample_timer'):
            self.reactor.update_timer(self.sample_timer, self.reactor.NOW)
    
    def handle_connect(self):
        """当Klipper连接时开始温度采样"""
        if hasattr(self, 'sample_timer'):
            self.reactor.update_timer(self.sample_timer, self.reactor.NOW)
    
    def setup_minmax(self, min_temp, max_temp):
        """设置最小/最大温度限制（加热器系统所需）"""
        self.min_temp = min_temp
        self.max_temp = max_temp
    
    def setup_callback(self, cb):
        """设置温度更新回调（加热器系统所需）"""
        self._callback = cb
    
    def get_report_time_delta(self):
        """返回温度报告之间的时间间隔（加热器系统所需）"""
        return ACE_REPORT_TIME
    
    def _sample_ace_temperature(self, eventtime):
        """从ACE设备进行周期性温度采样"""
        # 记录首次成功采样
        if not hasattr(self, '_sample_logged'):
            self._sample_logged = False
        
        try:
            if self.ace and hasattr(self.ace, '_info'):
                # 从ACE设备信息获取温度
                ace_temp = self.ace._info.get('temp', 0.0)
                
                # 记录首次成功的温度读数
                if not self._sample_logged and ace_temp > 0:
                    logging.info(f"ACE temperature sensor: Started sampling, current temp={ace_temp}°C")
                    self._sample_logged = True
                
                self.temp = float(ace_temp)
                
                # 跟踪最小/最大值
                if self.temp > 0:  # 仅跟踪有效温度
                    self.measured_min = min(self.measured_min, self.temp)
                    self.measured_max = max(self.measured_max, self.temp)
                
                # 检查温度限制
                if self.temp < self.min_temp and self.temp > 0:
                    self.printer.invoke_shutdown(
                        "ACE温度 %.1f 低于最低温度 %.1f"
                        % (self.temp, self.min_temp))
                if self.temp > self.max_temp:
                    self.printer.invoke_shutdown(
                        "ACE温度 %.1f 高于最高温度 %.1f"
                        % (self.temp, self.max_temp))
            else:
                # ACE不可用，报告0
                if not hasattr(self, '_warning_shown'):
                    logging.warning(f"temperature_ace: ACE module not available or _info not set (ace={self.ace}, has_info={hasattr(self.ace, '_info') if self.ace else False})")
                    self._warning_shown = True
                self.temp = 0.0
        except Exception:
            logging.exception("temperature_ace: Error reading temperature from ACE")
            self.temp = 0.0
        
        # 如果设置了回调，则调用温度回调
        if self._callback:
            mcu = self.printer.lookup_object('mcu')
            measured_time = self.reactor.monotonic()
            self._callback(mcu.estimated_print_time(measured_time), self.temp)
        
        # 安排下一次采样
        return eventtime + ACE_REPORT_TIME
    
    def get_temp(self, eventtime):
        """获取当前温度（temperature_sensor兼容性所需）"""
        return self.temp, 0.0
    
    def stats(self, eventtime):
        """返回用于日志记录的统计字符串"""
        return False, 'temperature_ace %s: temp=%.1f' % (self.name, self.temp)
    
    def get_status(self, eventtime):
        """返回Moonraker/API的状态"""
        return {
            'temperature': round(self.temp, 2),
            'measured_min_temp': round(self.measured_min, 2),
            'measured_max_temp': round(self.measured_max, 2),
        }


def load_config(config):
    """注册temperature_ace传感器工厂"""
    # 向加热器系统注册传感器工厂
    pheaters = config.get_printer().load_object(config, "heaters")
    pheaters.add_sensor_factory("temperature_ace", TemperatureACE)

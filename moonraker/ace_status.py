"""
Moonraker API 扩展 for ValgACE

此组件扩展 Moonraker API 以通过 REST API 和 WebSocket 访问 ACE 状态。

安装：
1. 复制到 ~/moonraker/moonraker/components/ace_status.py
2. 在 moonraker.conf 中添加：
   [ace_status]
"""

from __future__ import annotations
import logging
from typing import TYPE_CHECKING, Optional, Dict, Any
if TYPE_CHECKING:
    from confighelper import ConfigHelper
    from websockets import WebRequest
    from . import klippy_apis
    APIComp = klippy_apis.KlippyAPI


class AceStatus:
    def __init__(self, config: ConfigHelper):
        self.confighelper = config
        self.server = config.get_server()
        self.logger = logging.getLogger(__name__)
        
        # 获取 klippy_apis 组件
        self.klippy_apis: APIComp = self.server.lookup_component('klippy_apis')
        
        # 注册 API 端点
        self.server.register_endpoint(
            "/server/ace/status",
            ['GET'],
            self.handle_status_request
        )
        self.server.register_endpoint(
            "/server/ace/slots",
            ['GET'],
            self.handle_slots_request
        )
        self.server.register_endpoint(
            "/server/ace/command",
            ['POST'],
            self.handle_command_request
        )
        
        # 订阅打印机状态更新
        self.server.register_event_handler(
            "server:status_update",
            self._handle_status_update
        )
        
        # 缓存最后一个状态
        self._last_status: Optional[Dict[str, Any]] = None
        
        self.logger.info("ACE Status API extension loaded")
    
    async def handle_status_request(self, webrequest: WebRequest) -> Dict[str, Any]:
        """处理 ACE 状态请求"""
        try:
            # 通过 query_objects 直接从 ace 模块获取数据
            # ace 模块通过 register_status_handler 导出数据
            try:
                result = await self.klippy_apis.query_objects({'ace': None})
                ace_data = result.get('ace')
                
                if ace_data and isinstance(ace_data, dict):
                    self._last_status = ace_data
                    return ace_data
                else:
                    self.logger.debug("ACE data not found in query_objects response")
            
            except Exception as e:
                self.logger.debug(f"Could not get ACE data from query_objects: {e}")
            
            # Fallback: 如果有缓存状态，则使用缓存状态
            if self._last_status:
                self.logger.debug("Using cached ACE status")
                return self._last_status
            
            # 如果没有数据，返回默认结构
            self.logger.warning("No ACE data available, returning default structure")
            return {
                "status": "unknown",
                "model": "Anycubic Color Engine Pro",
                "firmware": "Unknown",
                "dryer": {
                    "status": "stop",
                    "target_temp": 0,
                    "duration": 0,
                    "remain_time": 0
                },
                "temp": 0,
                "fan_speed": 0,
                "enable_rfid": 0,
                "slots": [
                    {"index": i, "status": "unknown", "type": "", "color": [0, 0, 0], "sku": "", "rfid": 0}
                    for i in range(4)
                ]
            }
            
        except Exception as e:
            import traceback
            self.logger.error(f"Error getting ACE status: {e}")
            self.logger.error(f"Traceback: {traceback.format_exc()}")
            return {"error": str(e)}
    
    async def handle_slots_request(self, webrequest: WebRequest) -> Dict[str, Any]:
        """处理料槽信息请求"""
        try:
            status = await self.handle_status_request(webrequest)
            
            if "error" in status:
                return status
            
            slots = status.get("slots", [])
            return {
                "slots": slots
            }
        except Exception as e:
            self.logger.error(f"Error getting slots: {e}")
            return {"error": str(e)}
    
    async def handle_command_request(self, webrequest: WebRequest) -> Dict[str, Any]:
        """处理 ACE 命令执行"""
        try:
            # 从请求中获取参数
            command = webrequest.get_str("command", None)
            
            # 如果命令不在查询参数中，尝试从 JSON body 获取
            if not command:
                try:
                    json_body = await webrequest.get_json()
                    if isinstance(json_body, dict):
                        command = json_body.get("command")
                except Exception:
                    pass
            
            if not command:
                return {"error": "Command parameter is required"}
            
            # 获取命令参数
            params: Dict[str, Any] = {}

            # 1) 尝试从 JSON body 获取 params
            try:
                json_body = await webrequest.get_json()
                if isinstance(json_body, dict) and "params" in json_body:
                    jb_params = json_body["params"]
                    if isinstance(jb_params, dict):
                        params.update(jb_params)
            except Exception:
                pass

            # 2) 处理查询参数
            try:
                args = webrequest.get_args()
            except Exception:
                args = None

            if args:
                # 如果查询中有 'params' 键，尝试解析为 JSON
                qp_params = args.get('params')
                if qp_params:
                    # 可能是 JSON 字符串或 dict-like 字符串
                    parsed = None
                    if isinstance(qp_params, str):
                        try:
                            import json as _json
                            parsed = _json.loads(qp_params)
                        except Exception:
                            # 尝试解析格式如 "{'INDEX': 0}"
                            try:
                                parsed = eval(qp_params, {"__builtins__": {}})
                            except Exception:
                                parsed = None
                    elif isinstance(qp_params, dict):
                        parsed = qp_params
                    if isinstance(parsed, dict):
                        params.update(parsed)

                # 也支持直接格式 ?INDEX=0&SPEED=25 等
                for k, v in args.items():
                    if k in ("command", "params"):
                        continue
                    params[str(k)] = v
            
            # 形成 G-code 命令
            gcode_cmd = command
            if params:
                # 将值转换为字符串，无多余引号
                def _fmt_val(val):
                    if isinstance(val, bool):
                        return '1' if val else '0'
                    return str(val)
                param_str = " ".join([f"{k}={_fmt_val(v)}" for k, v in params.items()])
                gcode_cmd = f"{command} {param_str}"
            
            # 通过 klippy_apis 执行命令
            try:
                await self.klippy_apis.run_gcode(gcode_cmd)
                
                return {
                    "success": True,
                    "message": f"Command {command} executed successfully",
                    "command": gcode_cmd
                }
            except Exception as e:
                self.logger.error(f"Error executing ACE command {gcode_cmd}: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "command": gcode_cmd
                }
                
        except Exception as e:
            self.logger.error(f"Error handling ACE command request: {e}")
            return {"error": str(e)}
    
    async def _handle_status_update(self, status: Dict[str, Any]) -> None:
        """处理打印机状态更新"""
        try:
            # 从打印机状态中提取 ACE 数据
            ace_data = status.get('ace')
            
            if ace_data:
                self._last_status = ace_data
                # 通过 WebSocket 发送更新
                self.server.send_event("ace:status_update", ace_data)
        except Exception as e:
            self.logger.debug(f"Error handling status update: {e}")


def load_component(config: ConfigHelper) -> AceStatus:
    return AceStatus(config)
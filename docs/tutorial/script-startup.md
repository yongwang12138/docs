# Linux脚本自启动

## 1. 创建监控脚本

### 1.1 创建脚本文件

```bash
vim /home/code/check_service.sh
```

```bash
#!/bin/bash

# ==============================================
# 强制要求以 root 权限（sudo）运行脚本
# ==============================================
if [ "$(id -u)" -ne 0 ]; then
  echo "错误：请使用 sudo 运行此脚本（sudo ./check_service.sh）" >&2
  exit 1
fi

# ==============================================
# 配置区：每个程序的配置作为一组，用竖线分隔字段
# 格式："程序名|启动命令(./程序名)|工作目录(相对于监控脚本的路径)"
# ==============================================
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)  # 监控脚本所在目录
PROGRAMS=(
  # 程序名 | 启动命令 | 工作目录(相对于监控脚本的路径)
  "jydvis|./start.sh|JydVIS-arm64"
  "JydRecordManager|./start.sh|JydRECORDMANAGER-ARM-linux"
  "SoftRecord|./start.sh|qt"
)

# 监控脚本自身的日志（记录启动/检测等系统信息）
SCRIPT_LOG="$SCRIPT_DIR/log/check_services.log" 
CHECK_INTERVAL=30


# ==============================================
# 函数区
# ==============================================
# 确保目录存在（通用函数，可创建任意目录）
ensure_dir() {
  local dir_path=$1
  if [ ! -d "$dir_path" ]; then
    mkdir -p "$dir_path" || {
      echo "无法创建目录 $dir_path，脚本退出" >&2
      exit 1
    }
  fi
}

# 脚本系统日志（记录监控流程）
script_log() {
  local current_time=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[$current_time] $1" >> "$SCRIPT_LOG"
}

# 查找目录（支持有后缀和没有后缀的情况）
find_program_dir() {
  local prefix="$SCRIPT_DIR/$1"
  local base_dir=$(dirname "$prefix")
  local name_prefix=$(basename "$prefix")
  
  # 首先检查精确匹配的目录（没有后缀的情况）
  if [ -d "$prefix" ]; then
    echo "$prefix"
    return 0
  fi
  
  # 如果没有精确匹配，查找带后缀的目录
  local matched_dir=$(find "$base_dir" -maxdepth 1 -type d -name "$name_prefix*" | head -n 1)
  
  if [ -n "$matched_dir" ] && [ -d "$matched_dir" ]; then
    echo "$matched_dir"
    return 0
  else
    script_log "警告：未找到匹配的目录 $prefix 或 $prefix*"
    return 1
  fi
}

# 检查并启动程序
check_and_start() {
  local prog_name=$1
  local start_cmd=$2
  local dir_prefix=$3
  
  # 动态查找目录（支持有后缀和没有后缀）
  local work_dir=$(find_program_dir "$dir_prefix")
  if [ $? -ne 0 ] || [ -z "$work_dir" ]; then
    script_log "错误：未找到工作目录 $dir_prefix 或 $dir_prefix*"
    return 1
  fi
  
  # 检查工作目录是否存在
  if [ ! -d "$work_dir" ]; then
    script_log "错误：工作目录不存在 $work_dir"
    return 1
  fi

  # 切换到工作目录
  cd "$work_dir" || {
    script_log "$prog_name 切换目录 $work_dir 失败"
    return 1
  }

  if pgrep -x "$prog_name" >/dev/null; then
    script_log "$prog_name 正在运行中 (工作目录: $(basename "$work_dir"))"
  else
    script_log "$prog_name 未运行，尝试启动... (工作目录: $(basename "$work_dir"))"
    
    # 以管理员权限启动程序
    sudo $start_cmd &
    
    # 等待程序启动（避免检测过快导致误判）
    sleep 1
    
    # 验证启动结果
    if pgrep -x "$prog_name" >/dev/null; then
      script_log "$prog_name 启动成功"
    else
      script_log "$prog_name 启动失败"
    fi
  fi
}


# ==============================================
# 主逻辑
# ==============================================
# 确保脚本自身日志目录存在
ensure_dir "$(dirname "$SCRIPT_LOG")"
script_log "监控脚本启动，检测间隔：$CHECK_INTERVAL 秒"
script_log "监控脚本目录：$SCRIPT_DIR"

# 记录找到的目录信息
script_log "目录匹配信息："
for prog in "${PROGRAMS[@]}"; do
  IFS="|" read -r prog_name start_cmd dir_prefix <<< "$prog"
  work_dir=$(find_program_dir "$dir_prefix")
  if [ $? -eq 0 ]; then
    script_log "  $dir_prefix -> $work_dir"
  else
    script_log "  $dir_prefix -> 未找到"
  fi
done

while :; do
  script_log "===== 开始新一轮检测 ====="
  for prog in "${PROGRAMS[@]}"; do
    # 按竖线拆分字段
    IFS="|" read -r prog_name start_cmd dir_prefix <<< "$prog"
    check_and_start "$prog_name" "$start_cmd" "$dir_prefix"
  done
  script_log "===== 本轮检测结束 ====="
  
  sleep $CHECK_INTERVAL
done
```
### 1.2 添加可执行权限

```bash
chmod +x /home/code/check_service.sh
```

## 2. 测试脚本功能

### 2.1 创建示例

- **long_run.c**

```c
#include <stdio.h>
#include <unistd.h> // 用于sleep函数

int main() {
    int count = 0;
    // 无限循环，每2秒输出一次信息
    while(1) {
        printf("长时间运行程序 - 计数: %d\n", count);
        count++;
        sleep(2); // 暂停2秒
    }
    return 0;
}
```

- **short_run.c**

```c
#include <stdio.h>
#include <unistd.h> // 用于sleep函数

int main() {
    int i;
    // 运行5秒后退出
    for(i = 1; i <= 5; i++) {
        printf("短期运行程序 - 第%d秒\n", i);
        sleep(1); // 暂停1秒
    }
    printf("短期运行程序 - 即将退出\n");
    return 0;
}  
```

### 2.2 编译运行程序

```bash
gcc long_run.c -o long_run
gcc short_run.c -o short_run
```

```bash
# 运行长时间运行的程序
./long_run &
# 运行短期运行的程序
./short_run &
```

### 2.3 观察日志确认效果

```bash
tail -f /home/code/log/check_services.log
```

## 3. 配置脚本自启动

### 3.1 创建systemd服务文件

```bash
sudo vim /etc/systemd/system/check-service.service
```

```ini
[Unit]
Description=Check and restart every 30s
After=network.target

[Service]
Type=simple
ExecStart=/opt/check_service.sh  # 脚本路径
Restart=always  # 脚本崩溃时自动重启
User=root       # 运行用户（根据需要修改）

[Install]
WantedBy=multi-user.target
```

### 3.2 生效配置并启动服务

```bash
# 重新加载服务配置
sudo systemctl daemon-reload

# 启动检测脚本
sudo systemctl start check-service

# 设置开机自启动
sudo systemctl enable check-service
```

2.3 检查服务状态

```bash
sudo systemctl status check-service
```

### 3.3 启动与服务管理

```bash
#!/bin/bash

# ==============================================
# 权限检测：必须以 sudo 运行
# ==============================================
if [ "$(id -u)" -ne 0 ]; then
  echo -e "\033[31m错误：此脚本必须以管理员权限运行！\033[0m"
  echo "请使用以下命令启动："
  echo "  sudo ./start.sh"
  exit 1
fi


# ==============================================
# 配置参数
# ==============================================
SERVICE_NAME="check-service"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
# 主脚本路径（默认与 start.sh 同目录）
MAIN_SCRIPT=$(readlink -f "$(dirname "$0")/check_service.sh")


# ==============================================
# 检查主脚本是否存在
# ==============================================
check_main_script() {
  echo -e "\n===== 检查主监控脚本 ====="
  if [ -f "$MAIN_SCRIPT" ]; then
    echo -e "找到主脚本：\033[32m$MAIN_SCRIPT\033[0m"
  else
    echo -e "\033[31m错误：未找到主脚本！\033[0m"
    echo "预期路径：$MAIN_SCRIPT"
    echo "请确保 check_service.sh 与 start.sh 在同一目录"
    exit 1
  fi
}


# ==============================================
# 创建并配置 systemd 服务
# ==============================================
create_and_enable_service() {
  echo -e "\n===== 配置自启动服务 ====="
  if [ -f "$SERVICE_FILE" ]; then
    echo -e "服务文件已存在：\033[33m$SERVICE_FILE\033[0m"
    echo "跳过创建步骤"
    return
  fi

  # 写入服务配置
  cat > "$SERVICE_FILE" << EOF
[Unit]
Description=监控并自动重启指定服务（每30秒检测一次）
After=network.target

[Service]
Type=simple
ExecStart=$MAIN_SCRIPT
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

  # 刷新配置并启用自启动
  systemctl daemon-reload
  systemctl enable "$SERVICE_NAME"
  
  echo -e "服务文件创建成功：\033[32m$SERVICE_FILE\033[0m"
  echo "已配置开机自启"
}


# ==============================================
# 启动服务
# ==============================================
start_service() {
  echo -e "\n===== 启动服务 ====="
  if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo -e "\033[32m服务 $SERVICE_NAME 已在运行中\033[0m"
    return
  fi

  # 启动服务并检查结果
  systemctl start "$SERVICE_NAME"
  if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo -e "\033[32m服务 $SERVICE_NAME 启动成功\033[0m"
  else
    echo -e "\033[31m服务 $SERVICE_NAME 启动失败！\033[0m"
    echo "查看错误详情：sudo systemctl status $SERVICE_NAME"
    exit 1
  fi
}


# ==============================================
# 显示服务状态
# ==============================================
show_status() {
  echo -e "\n===== 服务当前状态 ====="
  systemctl status "$SERVICE_NAME" --no-pager
}


# ==============================================
# 主流程
# ==============================================
echo -e "===== 监控服务管理工具 ====="
check_main_script
create_and_enable_service
start_service
show_status

echo -e "\n===== 操作完成 ====="
echo "服务名称：$SERVICE_NAME"
echo "常用命令："
echo "  停止服务：sudo systemctl stop $SERVICE_NAME"
echo "  重启服务：sudo systemctl restart $SERVICE_NAME"
echo "  查看日志：sudo journalctl -u $SERVICE_NAME -f"
```


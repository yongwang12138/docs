# Linux脚本自启动

## 1. 创建检测脚本

### 1.1 创建脚本文件

```bash
vim /home/code/check_service.sh
```

```bash
#!/bin/bash

# ==============================================
# 配置区：每个程序的配置作为一组，用竖线分隔字段
# 格式："程序名|启动命令(./程序名)|工作目录|程序日志文件(./log/程序名.log)"
# ==============================================
PROGRAMS=(
  # 程序名 | 启动命令 | 工作目录 | 独立日志文件路径
  "long_run|./long_run|/home/code/|./log/long_run.log"
  "short_run|./short_run|/home/code/|./log/short_run.log"
)

# 监控脚本自身的日志（记录启动/检测等系统信息）
SCRIPT_LOG="/home/code/log/check_services.log"
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

# 检查并启动程序（使用程序独立日志）
check_and_start() {
  local prog_name=$1
  local start_cmd=$2
  local work_dir=$3
  local prog_log=$4  # 程序专属日志文件（相对路径）

  # 切换到工作目录后处理相对路径
  if [ -n "$work_dir" ]; then
    cd "$work_dir" || {
      script_log "$prog_name 切换目录 $work_dir 失败"
      return 1
    }
  fi

  # 确保程序日志的目录存在（相对路径转绝对路径处理）
  local abs_prog_log=$(readlink -f "$prog_log")  # 转换为绝对路径
  local prog_log_dir=$(dirname "$abs_prog_log")
  ensure_dir "$prog_log_dir"

  if pgrep -x "$prog_name" >/dev/null; then
  	script_log "$prog_name 正在运行中"
  else
    script_log "$prog_name 未运行，尝试启动..."
    
    # 启动程序，输出写入程序专属日志（使用转换后的绝对路径）
    $start_cmd >> "$abs_prog_log" 2>&1 &
    
    # 等待程序启动
    sleep 1
    
    if pgrep -x "$prog_name" >/dev/null; then
      script_log "$prog_name 启动成功，日志路径：$abs_prog_log"
    else
      script_log "$prog_name 启动失败，日志路径：$abs_prog_log"
    fi
  fi
}


# ==============================================
# 主逻辑
# ==============================================
# 确保脚本自身日志目录存在
ensure_dir "$(dirname "$SCRIPT_LOG")"
script_log "监控脚本启动，检测间隔：$CHECK_INTERVAL 秒"

while :; do
  script_log "===== 开始新一轮检测 ====="
  for prog in "${PROGRAMS[@]}"; do
    # 按竖线拆分字段
    IFS="|" read -r prog_name start_cmd work_dir prog_log <<< "$prog"
    check_and_start "$prog_name" "$start_cmd" "$work_dir" "$prog_log"
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


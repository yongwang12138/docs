# Go环境配置

## 1. Windows环境

```bash
# 设置GO111MODULE（启用模块支持）
go env -w GO111MODULE=on
# 移除GO111MODULE的配置，恢复默认行为
go env -u GO111MODULE

# 启用CGo
go env -w CGO_ENABLED=1
# 移除CGO_ENABLED的配置，恢复默认行为
go env -u CGO_ENABLED

# 设置GOPATH（工作目录）
go env -w GOPATH=D:\go
# 取消GOPATH设置
go env -u GOPATH

# 设置GOPROXY（国内代理）
go env -w GOPROXY=https://mirrors.aliyun.com/goproxy/,direct
# 或
go env -w GOPROXY=https://goproxy.cn,direct
# 取消GOPROXY设置
go env -u GOPROXY

# 查看设置是否生效（需要重新打开命令提示符）
go env | findstr "GO111MODULE CGO_ENABLED GOPROXY GOPATH"
```

## 2. Linux环境

### 2.1. 下载 Go 1.22.5 for ARM

```bash
# 对于ARM64架构（64位）
wget https://go.dev/dl/go1.22.5.linux-arm64.tar.gz

# 使用阿里云镜像
wget https://mirrors.aliyun.com/golang/go1.22.5.linux-arm64.tar.gz

# 或使用七牛云镜像
wget https://dl.google.com/go/go1.22.5.linux-arm64.tar.gz

# 或使用官方中国镜像
wget https://golang.google.cn/dl/go1.22.5.linux-arm64.tar.gz

# 对于ARMv6/7架构（32位）
wget https://go.dev/dl/go1.22.5.linux-armv6l.tar.gz
```

### 2.2. 安装位置

推荐安装到 **/usr/local/go** 目录：

```bash
# 解压安装
sudo tar -C /usr/local -xzf go1.22.5.linux-arm64.tar.gz
```

### 2.3. 设置环境变量

```bash
# 编辑配置文件
nano ~/.bashrc

# 添加以下内容
export PATH=$PATH:/usr/local/go/bin
export GOPATH=$HOME/go
export GOBIN=$GOPATH/bin
export GO111MODULE=on
export GOPROXY=https://goproxy.cn,direct

# 生效配置
source ~/.bashrc
```

### 2.4. 验证安装

```bash
# 查看安装位置
which go
# 输出: /usr/local/go/bin/go

# 查看版本
go version
# 输出: go version go1.22.5 linux/arm64 (或 armv6l)

# 查看详细信息
go env
```

## 3. 安装位置说明

| 目录                | 作用                           |
| ------------------- | ------------------------------ |
| `/usr/local/go`     | Go 的安装目录                  |
| `/usr/local/go/bin` | 可执行文件目录（go, gofmt 等） |
| `/usr/local/go/src` | Go 源代码                      |
| `/usr/local/go/pkg` | 编译后的包文件                 |

工作目录结构

plaintext

```plaintext
$HOME/go/          # GOPATH
├── src/         # 源代码
├── pkg/         # 编译的包文件
└── bin/         # 编译的可执行文件
```



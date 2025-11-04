# 识别U盘

#### 方案二：使用 Udev 规则 (推荐，灵活性更高)

这种方法通过创建udev规则和脚本，能更精确地控制挂载行为。

1. **创建挂载脚本**
   创建一个脚本，例如 `usb-mount.sh`，并保存到 `/usr/local/bin/` 目录下，记得给它可执行权限。

   bash

   ```
   sudo nano /usr/local/bin/usb-mount.sh
   ```

   

   将以下内容复制到脚本中。这个脚本会处理U盘的插入（add）和拔出（remove）事件。

   bash

   ```
   #!/bin/bash
   
   # 脚本接收两个参数：动作（add/remove）和设备名（如sdb1）
   ACTION=$1
   DEVNAME=$2
   
   # 基础挂载目录
   BASE_MOUNT_DIR="/media"
   
   # 仅处理块设备
   if [ "${ACTION}" = "add" ]; then
       # 获取设备信息
       DEVICE="/dev/${DEVNAME}"
       # 尝试获取卷标。如果无卷标，则使用设备名
       LABEL=$(/sbin/blkid -o value -s LABEL "$DEVICE")
       if [ -z "$LABEL" ]; then
           LABEL="${DEVNAME}"
       fi
   
       # 创建挂载点，确保目录名安全
       MOUNT_POINT="${BASE_MOUNT_DIR}/$(echo "$LABEL" | sed 's/\//_/g')"
   
       # 如果挂载点不存在，则创建
       mkdir -p "$MOUNT_POINT"
   
       # 根据文件系统类型挂载
       FSTYPE=$(/sbin/blkid -o value -s TYPE "$DEVICE")
       case "$FSTYPE" in
           "ntfs")
               mount -t ntfs-3g -o uid=1000,gid=1000,umask=022,utf8,noatime "$DEVICE" "$MOUNT_POINT"
               ;;
           "vfat")
               mount -t vfat -o uid=1000,gid=1000,umask=022,utf8,flush,noatime "$DEVICE" "$MOUNT_POINT"
               ;;
           "ext2"|"ext3"|"ext4")
               mount -t "$FSTYPE" -o noatime "$DEVICE" "$MOUNT_POINT"
               ;;
           *)
               # 不支持的文件系统，删除创建的目录
               rmdir "$MOUNT_POINT"
               exit 0
               ;;
       esac
   
   elif [ "${ACTION}" = "remove" ]; then
       # 在设备移除时，查找并卸载对应的挂载点
       for MOUNTED in $(mount | grep "^/dev/${DEVNAME} " | cut -d' ' -f3); do
           umount -l "$MOUNTED"
           rmdir "$MOUNTED" 2>/dev/null
       done
   fi
   ```

   

   保存后，赋予脚本执行权限：

   bash

   ```
   sudo chmod +x /usr/local/bin/usb-mount.sh
   ```

   

2. **创建Udev规则**
   创建一个udev规则文件，例如 `99-usb-automount.rules`。

   bash

   ```
   sudo nano /etc/udev/rules.d/99-usb-automount.rules
   ```

   

   将以下内容加入文件。这样当U盘插入时，会触发上面的脚本。

   bash

   ```
   # 规则：当USB存储设备插入时，执行挂载脚本
   SUBSYSTEM=="block", ENV{ID_BUS}=="usb", ACTION=="add", RUN+="/usr/local/bin/usb-mount.sh add %k"
   # 规则：当USB存储设备移除时，执行挂载脚本进行清理
   SUBSYSTEM=="block", ENV{ID_BUS}=="usb", ACTION=="remove", RUN+="/usr/local/bin/usb-mount.sh remove %k"
   ```

   

3. **重新加载Udev规则**
   让新配置的规则立即生效：

   bash

   ```
   sudo udevadm control --reload-rules
   sudo systemctl restart udev
   ```

   

### 🔍 测试与验证
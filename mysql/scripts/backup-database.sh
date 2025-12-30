#!/bin/bash

# MySQL数据库备份脚本
# 支持定时备份和手动备份

# 配置参数
DB_HOST=${DB_HOST:-mysql}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-enterprise_user}
DB_PASSWORD=${DB_PASSWORD:-enterprise_pass}
DB_NAME=${DB_NAME:-enterprise_brain}
BACKUP_DIR=${BACKUP_DIR:-/app/backups}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_${TIMESTAMP}.sql"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 检查数据库连接
check_connection() {
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" >/dev/null 2>&1
}

# 执行备份
perform_backup() {
    log "开始备份数据库: $DB_NAME"
    
    if ! check_connection; then
        log "❌ 数据库连接失败"
        return 1
    fi
    
    # 执行mysqldump备份
    log "正在导出数据到: $BACKUP_FILE"
    
    mysqldump \
        -h"$DB_HOST" \
        -P"$DB_PORT" \
        -u"$DB_USER" \
        -p"$DB_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --hex-blob \
        --default-character-set=utf8mb4 \
        --complete-insert \
        --extended-insert \
        --quick \
        --lock-tables=false \
        "$DB_NAME" > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        # 压缩备份文件
        gzip "$BACKUP_FILE"
        COMPRESSED_FILE="${BACKUP_FILE}.gz"
        
        # 检查备份文件大小
        BACKUP_SIZE=$(stat -f%z "$COMPRESSED_FILE" 2>/dev/null || stat -c%s "$COMPRESSED_FILE" 2>/dev/null)
        
        log "✅ 数据库备份成功: $COMPRESSED_FILE"
        log "📊 备份文件大小: $((BACKUP_SIZE / 1024 / 1024)) MB"
        
        # 创建备份信息文件
        INFO_FILE="${BACKUP_DIR}/${DB_NAME}_backup_info_${TIMESTAMP}.json"
        cat > "$INFO_FILE" << EOF
{
    "database": "$DB_NAME",
    "backup_file": "$COMPRESSED_FILE",
    "backup_time": "$(date -Iseconds)",
    "backup_size_bytes": $BACKUP_SIZE,
    "backup_size_mb": $((BACKUP_SIZE / 1024 / 1024)),
    "hostname": "$(hostname)",
    "user": "$DB_USER"
}
EOF
        
        return 0
    else
        log "❌ 数据库备份失败"
        return 1
    fi
}

# 清理旧备份
cleanup_old_backups() {
    log "开始清理 $BACKUP_RETENTION_DAYS 天前的旧备份"
    
    # 删除旧的SQL和压缩文件
    find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql" -mtime +$BACKUP_RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql.gz" -mtime +$BACKUP_RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "${DB_NAME}_backup_info_*.json" -mtime +$BACKUP_RETENTION_DAYS -delete
    
    log "✅ 旧备份清理完成"
}

# 验证备份
verify_backup() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        log "❌ 备份文件不存在: $backup_file"
        return 1
    fi
    
    # 检查文件是否为空
    if [ ! -s "$backup_file" ]; then
        log "❌ 备份文件为空: $backup_file"
        return 1
    fi
    
    # 如果是压缩文件，检查压缩完整性
    if [[ "$backup_file" == *.gz ]]; then
        if ! gzip -t "$backup_file" 2>/dev/null; then
            log "❌ 备份文件损坏: $backup_file"
            return 1
        fi
    fi
    
    log "✅ 备份文件验证通过: $backup_file"
    return 0
}

# 主函数
main() {
    local action=${1:-backup}
    
    case "$action" in
        "backup")
            perform_backup
            if [ $? -eq 0 ]; then
                cleanup_old_backups
                log "🎉 备份任务完成"
            else
                log "💥 备份任务失败"
                exit 1
            fi
            ;;
        "verify")
            if [ -z "$2" ]; then
                log "❌ 请指定要验证的备份文件"
                exit 1
            fi
            verify_backup "$2"
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        "list")
            log "📋 备份文件列表:"
            ls -lh "$BACKUP_DIR"/${DB_NAME}_backup_*.sql.gz 2>/dev/null || log "没有找到备份文件"
            ;;
        *)
            echo "用法: $0 {backup|verify|cleanup|list} [backup_file]"
            echo ""
            echo "命令说明:"
            echo "  backup   - 执行数据库备份"
            echo "  verify   - 验证备份文件完整性"
            echo "  cleanup  - 清理旧备份文件"
            echo "  list     - 列出所有备份文件"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
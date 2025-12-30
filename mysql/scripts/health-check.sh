#!/bin/bash

# MySQL数据库健康检查脚本
# 用于Docker容器健康检查

DB_HOST=${DB_HOST:-mysql}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-enterprise_user}
DB_PASSWORD=${DB_PASSWORD:-enterprise_pass}
DB_NAME=${DB_NAME:-enterprise_brain}

# 检查数据库连接
check_connection() {
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" >/dev/null 2>&1
    return $?
}

# 检查数据库状态
check_database_status() {
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "
        SELECT 
            'OK' as status,
            COUNT(*) as table_count,
            ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
        FROM information_schema.tables 
        WHERE table_schema = '$DB_NAME'
    " 2>/dev/null
}

# 检查关键表
check_key_tables() {
    tables=("company_calendar" "process_types" "sales_orders" "products" "customers")
    
    for table in "${tables[@]}"; do
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "
            SELECT '$table' as table_name, COUNT(*) as record_count 
            FROM information_schema.tables 
            WHERE table_schema = '$DB_NAME' AND table_name = '$table'
        " 2>/dev/null
    done
}

# 主检查逻辑
main() {
    echo "=== MySQL Health Check ==="
    echo "Time: $(date)"
    echo "Host: $DB_HOST:$DB_PORT"
    echo "Database: $DB_NAME"
    echo ""
    
    # 检查连接
    if check_connection; then
        echo "✅ Database connection: OK"
    else
        echo "❌ Database connection: FAILED"
        exit 1
    fi
    
    # 检查状态
    echo ""
    echo "📊 Database Status:"
    check_database_status
    
    # 检查关键表
    echo ""
    echo "📋 Key Tables Status:"
    check_key_tables
    
    echo ""
    echo "✅ Health check completed successfully"
}

# 执行检查
main "$@"
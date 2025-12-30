#!/bin/bash

# Enterprise Brain 自动化测试脚本
# 用于CI/CD流水线中的测试执行

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
TEST_TYPE=${1:-"all"}
COVERAGE=${2:-"true"}
REPORTS_DIR="test-results"
COVERAGE_DIR="coverage"

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] ${message}${NC}"
}

# 创建测试报告目录
create_report_dirs() {
    print_message $BLUE "📁 创建测试报告目录..."
    
    mkdir -p "$REPORTS_DIR/unit"
    mkdir -p "$REPORTS_DIR/integration"
    mkdir -p "$REPORTS_DIR/e2e"
    mkdir -p "$REPORTS_DIR/performance"
    mkdir -p "$REPORTS_DIR/security"
    mkdir -p "$COVERAGE_DIR"
    
    print_message $GREEN "✅ 测试报告目录创建完成"
}

# 前置条件检查
check_prerequisites() {
    print_message $BLUE "🔍 检查测试前置条件..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        print_message $RED "❌ Node.js未安装"
        exit 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        print_message $RED "❌ npm未安装"
        exit 1
    fi
    
    # 检查依赖
    if [ ! -d "node_modules" ]; then
        print_message $YELLOW "⚠️ 依赖未安装，正在安装..."
        npm install
    fi
    
    # 检查测试数据库
    if ! docker ps --format "{{.Names}}" | grep -q test-mysql; then
        print_message $YELLOW "⚠️ 测试数据库未运行，正在启动..."
        docker run -d --name test-mysql \
            -e MYSQL_ROOT_PASSWORD=test123 \
            -e MYSQL_DATABASE=test_enterprise \
            -e MYSQL_USER=test_user \
            -e MYSQL_PASSWORD=test_pass \
            -p 3307:3306 \
            mysql:8.0 --default-authentication-plugin=mysql_native_password
        
        # 等待数据库启动
        print_message $BLUE "⏳ 等待数据库启动..."
        for i in {1..30}; do
            if mysql -h 127.0.0.1 -P 3307 -u test_user -ptest_pass test_enterprise -e "SELECT 1;" 2>/dev/null; then
                print_message $GREEN "✅ 数据库启动完成"
                break
            fi
            echo "等待数据库启动... ($i/30)"
            sleep 2
        done
    fi
    
    # 检查测试Redis
    if ! docker ps --format "{{.Names}}" | grep -q test-redis; then
        print_message $YELLOW "⚠️ 测试Redis未运行，正在启动..."
        docker run -d --name test-redis -p 6380:6379 redis:7-alpine
        print_message $GREEN "✅ Redis启动完成"
    fi
    
    print_message $GREEN "✅ 前置条件检查完成"
}

# 运行单元测试
run_unit_tests() {
    print_message $BLUE "🧪 运行单元测试..."
    
    if [ "$COVERAGE" = "true" ]; then
        npm run test:unit -- --coverage --coverageDirectory="$COVERAGE_DIR" --reporter=json --reporter=lcov --reporter=text
    else
        npm run test:unit
    fi
    
    # 生成JUnit格式报告
    npm run test:unit -- --reporter=junit --outputFile="$REPORTS_DIR/unit/junit.xml"
    
    print_message $GREEN "✅ 单元测试完成"
}

# 运行集成测试
run_integration_tests() {
    print_message $BLUE "🧪 运行集成测试..."
    
    # 设置测试环境变量
    export NODE_ENV=test
    export DB_HOST=localhost
    export DB_PORT=3307
    export DB_NAME=test_enterprise
    export DB_USER=test_user
    export DB_PASSWORD=test_pass
    export REDIS_HOST=localhost
    export REDIS_PORT=6380
    
    # 运行数据库迁移
    npm run db:migrate:test
    
    # 运行集成测试
    npm run test:integration -- --reporter=json --outputFile="$REPORTS_DIR/integration/results.json"
    
    # 生成JUnit格式报告
    npm run test:integration -- --reporter=junit --outputFile="$REPORTS_DIR/integration/junit.xml"
    
    print_message $GREEN "✅ 集成测试完成"
}

# 运行E2E测试
run_e2e_tests() {
    print_message $BLUE "🧪 运行E2E测试..."
    
    # 检查是否启动了应用服务
    if ! curl -s http://localhost:3005/health >/dev/null 2>&1; then
        print_message $YELLOW "⚠️ 应用服务未启动，正在启动..."
        npm run start:test &
        
        # 等待服务启动
        for i in {1..30}; do
            if curl -s http://localhost:3005/health >/dev/null 2>&1; then
                print_message $GREEN "✅ 应用服务启动完成"
                break
            fi
            echo "等待应用服务启动... ($i/30)"
            sleep 2
        done
    fi
    
    # 运行E2E测试
    npm run test:e2e -- --reporter=json --outputFile="$REPORTS_DIR/e2e/results.json"
    
    # 生成HTML报告
    npm run test:e2e:report
    
    print_message $GREEN "✅ E2E测试完成"
}

# 运行性能测试
run_performance_tests() {
    print_message $BLUE "📊 运行性能测试..."
    
    # 检查应用服务状态
    if ! curl -s http://localhost:3005/health >/dev/null 2>&1; then
        print_message $RED "❌ 应用服务未运行，无法执行性能测试"
        exit 1
    fi
    
    # 运行负载测试
    npm run test:performance:load
    
    # 生成性能报告
    npm run test:performance:report
    
    print_message $GREEN "✅ 性能测试完成"
}

# 运行安全测试
run_security_tests() {
    print_message $BLUE "🔒 运行安全测试..."
    
    # npm审计
    print_message $BLUE "🔍 执行npm依赖安全审计..."
    npm audit --json > "$REPORTS_DIR/security/npm-audit.json" || true
    
    # 代码安全扫描
    if command -v semgrep &> /dev/null; then
        print_message $BLUE "🔍 执行代码安全扫描..."
        semgrep --config=auto --json --output="$REPORTS_DIR/security/semgrep.json" src/ || true
    fi
    
    # API安全测试
    npm run test:security:api -- --reporter=json --outputFile="$REPORTS_DIR/security/api-security.json"
    
    print_message $GREEN "✅ 安全测试完成"
}

# 运行契约测试
run_contract_tests() {
    print_message $BLUE "📋 运行契约测试..."
    
    # 生成API文档
    npm run docs:generate
    
    # 验证API契约
    npm run test:contract -- --reporter=json --outputFile="$REPORTS_DIR/contract/contract-tests.json"
    
    print_message $GREEN "✅ 契约测试完成"
}

# 生成测试报告
generate_test_report() {
    print_message $BLUE "📊 生成测试报告..."
    
    # 创建HTML报告
    cat > "$REPORTS_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enterprise Brain 测试报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; margin-bottom: 30px; }
        .test-section { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .test-section h2 { color: #2c3e50; margin-top: 0; }
        .test-status { display: inline-block; padding: 4px 8px; border-radius: 3px; color: white; font-weight: bold; }
        .status-pass { background-color: #27ae60; }
        .status-fail { background-color: #e74c3c; }
        .status-skip { background-color: #f39c12; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #ecf0f1; padding: 15px; border-radius: 5px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #2c3e50; }
        .summary-card .number { font-size: 2em; font-weight: bold; color: #3498db; }
        .test-link { display: inline-block; margin: 5px 10px 5px 0; padding: 8px 15px; background: #3498db; color: white; text-decoration: none; border-radius: 4px; }
        .test-link:hover { background: #2980b9; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Enterprise Brain 测试报告</h1>
        
        <div class="summary">
            <div class="summary-card">
                <h3>构建编号</h3>
                <div class="number">$(echo $BUILD_NUMBER || 'N/A')</div>
            </div>
            <div class="summary-card">
                <h3>测试时间</h3>
                <div class="number">$(date '+%Y-%m-%d %H:%M:%S')</div>
            </div>
            <div class="summary-card">
                <h3>测试类型</h3>
                <div class="number">$TEST_TYPE</div>
            </div>
            <div class="summary-card">
                <h3>代码覆盖率</h3>
                <div class="number">$(if [ -f "$COVERAGE_DIR/coverage-summary.json" ]; then cat "$COVERAGE_DIR/coverage-summary.json" | jq -r '.total.lines.pct' 2>/dev/null || echo 'N/A'; else echo 'N/A'; fi)%</div>
            </div>
        </div>
        
        <div class="test-section">
            <h2>📊 单元测试</h2>
            <p>单元测试覆盖率: <span class="test-status status-pass">查看详细报告</span></p>
            <a href="unit/index.html" class="test-link">查看单元测试报告</a>
        </div>
        
        <div class="test-section">
            <h2>🔗 集成测试</h2>
            <p>API集成测试结果</p>
            <a href="integration/junit.xml" class="test-link">查看JUnit报告</a>
        </div>
        
        <div class="test-section">
            <h2>🌐 E2E测试</h2>
            <p>端到端测试结果</p>
            <a href="e2e/index.html" class="test-link">查看E2E测试报告</a>
        </div>
        
        <div class="test-section">
            <h2>📈 性能测试</h2>
            <p>API性能测试结果</p>
            <a href="performance/index.html" class="test-link">查看性能测试报告</a>
        </div>
        
        <div class="test-section">
            <h2>🔒 安全测试</h2>
            <p>依赖安全审计和代码扫描结果</p>
            <a href="security/npm-audit.json" class="test-link">查看安全扫描报告</a>
        </div>
    </div>
</body>
</html>
EOF
    
    print_message $GREEN "✅ 测试报告生成完成: $REPORTS_DIR/index.html"
}

# 清理测试环境
cleanup_test_env() {
    print_message $BLUE "🧹 清理测试环境..."
    
    # 停止测试数据库
    docker stop test-mysql >/dev/null 2>&1 || true
    docker rm test-mysql >/dev/null 2>&1 || true
    
    # 停止测试Redis
    docker stop test-redis >/dev/null 2>&1 || true
    docker rm test-redis >/dev/null 2>&1 || true
    
    # 清理测试进程
    pkill -f "node.*test" >/dev/null 2>&1 || true
    
    print_message $GREEN "✅ 测试环境清理完成"
}

# 主函数
main() {
    print_message $GREEN "🚀 Enterprise Brain 自动化测试脚本"
    print_message $GREEN "======================================"
    echo ""
    
    # 检查参数
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "用法: $0 [测试类型] [覆盖率] [报告目录]"
        echo ""
        echo "测试类型:"
        echo "  unit         仅运行单元测试"
        echo "  integration  仅运行集成测试"
        echo "  e2e          仅运行E2E测试"
        echo "  performance  仅运行性能测试"
        echo "  security     仅运行安全测试"
        echo "  contract     仅运行契约测试"
        echo "  all          运行所有测试（默认）"
        echo ""
        echo "覆盖率:"
        echo "  true         启用代码覆盖率（默认）"
        echo "  false        禁用代码覆盖率"
        echo ""
        echo "示例:"
        echo "  $0 unit true"
        echo "  $0 all"
        echo "  $0 performance false"
        exit 0
    fi
    
    # 创建报告目录
    create_report_dirs
    
    # 检查前置条件
    check_prerequisites
    
    # 根据测试类型执行相应测试
    case "$TEST_TYPE" in
        "unit")
            run_unit_tests
            ;;
        "integration")
            run_integration_tests
            ;;
        "e2e")
            run_e2e_tests
            ;;
        "performance")
            run_performance_tests
            ;;
        "security")
            run_security_tests
            ;;
        "contract")
            run_contract_tests
            ;;
        "all"|*)
            print_message $BLUE "🧪 运行所有测试套件..."
            run_unit_tests
            run_integration_tests
            run_contract_tests
            # 只在CI环境中运行E2E和性能测试
            if [ "$CI" = "true" ] || [ "$JENKINS_URL" != "" ]; then
                run_e2e_tests
                run_performance_tests
            fi
            run_security_tests
            ;;
    esac
    
    # 生成测试报告
    generate_test_report
    
    # 清理测试环境
    cleanup_test_env
    
    print_message $GREEN "🎉 自动化测试完成！"
    print_message $BLUE "📊 测试报告位置: $REPORTS_DIR/index.html"
}

# 错误处理
trap 'print_message $RED "❌ 测试执行失败"; cleanup_test_env; exit 1' ERR

# 执行主函数
main "$@"

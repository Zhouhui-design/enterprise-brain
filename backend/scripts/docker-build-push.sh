#!/bin/bash

# Enterprise Brain Docker镜像构建和推送脚本
# 支持自动化构建、安全扫描、镜像推送

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
APP_NAME=${1:-"enterprise-brain-backend"}
VERSION=${2:-"latest"}
REGISTRY=${3:-"localhost:5000"}
DOCKERFILE=${4:-"./Dockerfile"}
BUILD_CONTEXT=${5:-"."}
PLATFORM=${6:-"linux/amd64,linux/arm64"}
PUSH=${7:-"true"}
SCAN=${8:-"true"}

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] ${message}${NC}"
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [应用名] [版本] [注册表] [Dockerfile路径] [构建上下文] [平台] [是否推送] [是否扫描]"
    echo ""
    echo "参数:"
    echo "  应用名        镜像名称 (默认: enterprise-brain-backend)"
    echo "  版本          镜像标签 (默认: latest)"
    echo "  注册表        镜像仓库地址 (默认: localhost:5000)"
    echo "  Dockerfile路径 Dockerfile文件路径 (默认: ./Dockerfile)"
    echo "  构建上下文    构建上下文目录 (默认: .)"
    echo "  平台          目标平台 (默认: linux/amd64,linux/arm64)"
    echo "  是否推送      推送镜像到仓库 (默认: true)"
    echo "  是否扫描      安全扫描镜像 (默认: true)"
    echo ""
    echo "示例:"
    echo "  $0                                    # 使用默认参数"
    echo "  $0 my-app v1.0.0                      # 指定应用名和版本"
    echo "  $0 my-app v1.0.0 registry.io           # 指定仓库地址"
    echo "  $0 my-app v1.0.0 registry.io ./Dockerfile . linux/amd64 true false"
}

# 验证参数
validate_params() {
    print_message $BLUE "🔍 验证构建参数..."
    
    # 检查Dockerfile是否存在
    if [ ! -f "$DOCKERFILE" ]; then
        print_message $RED "❌ Dockerfile不存在: $DOCKERFILE"
        exit 1
    fi
    
    # 检查构建上下文是否存在
    if [ ! -d "$BUILD_CONTEXT" ]; then
        print_message $RED "❌ 构建上下文不存在: $BUILD_CONTEXT"
        exit 1
    fi
    
    # 检查Docker环境
    if ! command -v docker &> /dev/null; then
        print_message $RED "❌ Docker未安装"
        exit 1
    fi
    
    # 检查Docker服务状态
    if ! docker info &> /dev/null; then
        print_message $RED "❌ Docker服务未运行"
        exit 1
    fi
    
    print_message $GREEN "✅ 参数验证通过"
}

# 获取构建信息
get_build_info() {
    print_message $BLUE "📋 获取构建信息..."
    
    # 获取Git信息
    if command -v git &> /dev/null && [ -d ".git" ]; then
        GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
        GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
        GIT_COMMIT_DATE=$(git log -1 --format="%cd" --date=short 2>/dev/null || echo "unknown")
        GIT_AUTHOR=$(git log -1 --format="%an" 2>/dev/null || echo "unknown")
    else
        GIT_COMMIT="unknown"
        GIT_BRANCH="unknown"
        GIT_COMMIT_DATE="unknown"
        GIT_AUTHOR="unknown"
    fi
    
    # 获取构建时间
    BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    
    # 获取构建环境信息
    BUILDER_VERSION=$(docker version --format '{{.Server.Version}}' 2>/dev/null || echo "unknown")
    
    print_message $GREEN "✅ 构建信息获取完成"
    print_message $BLUE "📊 构建信息:"
    echo "   - 应用名: $APP_NAME"
    echo "   - 版本: $VERSION"
    echo "   - 注册表: $REGISTRY"
    echo "   - Git提交: $GIT_COMMIT"
    echo "   - Git分支: $GIT_BRANCH"
    echo "   - 构建时间: $BUILD_DATE"
    echo "   - 构建平台: $PLATFORM"
}

# 清理旧镜像
cleanup_old_images() {
    print_message $BLUE "🧹 清理旧镜像..."
    
    # 清理未标记的镜像
    docker image prune -f >/dev/null 2>&1 || true
    
    # 清理构建缓存
    docker builder prune -f >/dev/null 2>&1 || true
    
    print_message $GREEN "✅ 旧镜像清理完成"
}

# 构建Docker镜像
build_image() {
    print_message $BLUE "🐳 构建Docker镜像..."
    
    local image_name="$REGISTRY/$APP_NAME:$VERSION"
    local latest_name="$REGISTRY/$APP_NAME:latest"
    
    # 构建参数
    local build_args=(
        "--build-arg" "BUILD_DATE=$BUILD_DATE"
        "--build-arg" "VCS_REF=$GIT_COMMIT"
        "--build-arg" "VERSION=$VERSION"
        "--build-arg" "GIT_BRANCH=$GIT_BRANCH"
        "--build-arg" "GIT_COMMIT_DATE=$GIT_COMMIT_DATE"
        "--build-arg" "GIT_AUTHOR=$GIT_AUTHOR"
        "--build-arg" "BUILDER_VERSION=$BUILDER_VERSION"
    )
    
    # 如果是本地开发环境，使用本地镜像
    if [ "$REGISTRY" = "localhost:5000" ]; then
        build_args+=("--load")
    fi
    
    # 执行构建
    print_message $BLUE "🔨 开始构建镜像: $image_name"
    
    if docker buildx build \
        --platform "$PLATFORM" \
        --file "$DOCKERFILE" \
        --tag "$image_name" \
        --tag "$latest_name" \
        "${build_args[@]}" \
        "$BUILD_CONTEXT"; then
        
        print_message $GREEN "✅ 镜像构建成功"
        
        # 显示镜像信息
        print_message $BLUE "📋 镜像信息:"
        docker images "$APP_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
        
    else
        print_message $RED "❌ 镜像构建失败"
        exit 1
    fi
}

# 测试镜像
test_image() {
    print_message $BLUE "🧪 测试镜像..."
    
    local image_name="$REGISTRY/$APP_NAME:$VERSION"
    
    # 测试镜像是否可以正常启动
    if docker run --rm "$image_name" --version; then
        print_message $GREEN "✅ 镜像测试通过"
    else
        print_message $RED "❌ 镜像测试失败"
        exit 1
    fi
}

# 安全扫描镜像
scan_image() {
    if [ "$SCAN" != "true" ]; then
        print_message $YELLOW "⚠️ 跳过安全扫描"
        return
    fi
    
    print_message $BLUE "🔒 执行安全扫描..."
    
    local image_name="$REGISTRY/$APP_NAME:$VERSION"
    
    # 使用trivy扫描
    if command -v trivy &> /dev/null; then
        print_message $BLUE "🔍 使用Trivy扫描镜像..."
        
        # 创建扫描报告目录
        mkdir -p security-reports
        
        # 执行扫描
        if trivy image \
            --format json \
            --output "security-reports/scan-$VERSION.json" \
            --format table \
            --severity HIGH,CRITICAL \
            "$image_name"; then
            
            print_message $GREEN "✅ 安全扫描完成"
            
            # 检查是否有关键漏洞
            if [ -f "security-reports/scan-$VERSION.json" ]; then
                local critical_vulns=$(cat "security-reports/scan-$VERSION.json" | jq '.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL") | .VulnerabilityID' | wc -l 2>/dev/null || echo "0")
                local high_vulns=$(cat "security-reports/scan-$VERSION.json" | jq '.Results[]?.Vulnerabilities[]? | select(.Severity == "HIGH") | .VulnerabilityID' | wc -l 2>/dev/null || echo "0")
                
                print_message $BLUE "📊 扫描结果:"
                echo "   - 严重漏洞: $critical_vulns"
                echo "   - 高危漏洞: $high_vulns"
                
                if [ "$critical_vulns" -gt 0 ]; then
                    print_message $YELLOW "⚠️ 发现严重漏洞，请检查扫描报告"
                fi
            fi
        else
            print_message $RED "❌ 安全扫描失败"
            exit 1
        fi
    else
        print_message $YELLOW "⚠️ Trivy未安装，跳过安全扫描"
    fi
}

# 推送镜像
push_image() {
    if [ "$PUSH" != "true" ]; then
        print_message $YELLOW "⚠️ 跳过镜像推送"
        return
    fi
    
    print_message $BLUE "📤 推送镜像到仓库..."
    
    local image_name="$REGISTRY/$APP_NAME:$VERSION"
    local latest_name="$REGISTRY/$APP_NAME:latest"
    
    # 检查是否需要登录
    if [ "$REGISTRY" != "localhost:5000" ]; then
        print_message $BLUE "🔑 检查仓库登录状态..."
        
        if ! docker system info | grep -q "$REGISTRY"; then
            print_message $YELLOW "⚠️ 需要登录镜像仓库: $REGISTRY"
            echo "请手动执行: docker login $REGISTRY"
            exit 1
        fi
    fi
    
    # 推送版本标签
    print_message $BLUE "📤 推送版本标签: $image_name"
    if docker push "$image_name"; then
        print_message $GREEN "✅ 版本标签推送成功"
    else
        print_message $RED "❌ 版本标签推送失败"
        exit 1
    fi
    
    # 推送latest标签
    print_message $BLUE "📤 推送latest标签: $latest_name"
    if docker push "$latest_name"; then
        print_message $GREEN "✅ latest标签推送成功"
    else
        print_message $RED "❌ latest标签推送失败"
        exit 1
    fi
    
    print_message $GREEN "✅ 镜像推送完成"
}

# 生成构建报告
generate_build_report() {
    print_message $BLUE "📊 生成构建报告..."
    
    local image_name="$REGISTRY/$APP_NAME:$VERSION"
    
    # 获取镜像详细信息
    local image_info=$(docker inspect "$image_name" 2>/dev/null || echo "{}")
    local image_size=$(echo "$image_info" | jq -r '.[0].Size // 0' 2>/dev/null || echo "0")
    local created_time=$(echo "$image_info" | jq -r '.[0].Created // "unknown"' 2>/dev/null || echo "unknown")
    
    # 转换镜像大小为人类可读格式
    local human_size=$(echo "$image_size" | awk '{
        split("B KB MB GB TB PB", unit, " ");
        for (i = 1; $1 >= 1024 && i < length(unit); i++) {
            $1 /= 1024;
        }
        printf "%.2f %s\n", $1, unit[i];
    }')
    
    # 创建构建报告
    cat > "build-report-$VERSION.json" << EOF
{
    "build_info": {
        "app_name": "$APP_NAME",
        "version": "$VERSION",
        "registry": "$REGISTRY",
        "image_name": "$image_name",
        "build_date": "$BUILD_DATE",
        "git_commit": "$GIT_COMMIT",
        "git_branch": "$GIT_BRANCH",
        "git_author": "$GIT_AUTHOR",
        "platform": "$PLATFORM"
    },
    "image_info": {
        "size_bytes": $image_size,
        "size_human": "$human_size",
        "created": "$created_time"
    },
    "build_stats": {
        "build_duration": "${SECONDS}s",
        "builder_version": "$BUILDER_VERSION",
        "dockerfile": "$DOCKERFILE",
        "context": "$BUILD_CONTEXT"
    },
    "security_scan": {
        "enabled": $SCAN,
        "report_file": "security-reports/scan-$VERSION.json"
    },
    "push_info": {
        "enabled": $PUSH,
        "registry": "$REGISTRY"
    }
}
EOF
    
    print_message $GREEN "✅ 构建报告生成完成: build-report-$VERSION.json"
}

# 验证镜像
verify_image() {
    print_message $BLUE "🔍 验证镜像..."
    
    local image_name="$REGISTRY/$APP_NAME:$VERSION"
    
    # 检查镜像是否存在
    if ! docker inspect "$image_name" >/dev/null 2>&1; then
        print_message $RED "❌ 镜像不存在: $image_name"
        exit 1
    fi
    
    # 检查镜像大小
    local image_size=$(docker images "$APP_NAME" --format "{{.Size}}" | head -1)
    print_message $BLUE "📋 镜像验证信息:"
    echo "   - 镜像名称: $image_name"
    echo "   - 镜像大小: $image_size"
    echo "   - 构建时间: $BUILD_DATE"
    
    # 如果是本地仓库，验证推送
    if [ "$PUSH" = "true" ] && [ "$REGISTRY" = "localhost:5000" ]; then
        print_message $BLUE "🔍 验证本地仓库推送..."
        if curl -s "http://localhost:5000/v2/$APP_NAME/tags/list" | grep -q "\"$VERSION\""; then
            print_message $GREEN "✅ 本地仓库验证通过"
        else
            print_message $RED "❌ 本地仓库验证失败"
            exit 1
        fi
    fi
    
    print_message $GREEN "✅ 镜像验证完成"
}

# 主函数
main() {
    print_message $GREEN "🚀 Enterprise Brain Docker镜像构建脚本"
    print_message $GREEN "============================================"
    echo ""
    
    # 检查帮助参数
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        show_help
        exit 0
    fi
    
    # 记录开始时间
    SECONDS=0
    
    # 验证参数
    validate_params
    
    # 获取构建信息
    get_build_info
    
    # 清理旧镜像
    cleanup_old_images
    
    # 构建镜像
    build_image
    
    # 测试镜像
    test_image
    
    # 安全扫描
    scan_image
    
    # 推送镜像
    push_image
    
    # 生成构建报告
    generate_build_report
    
    # 验证镜像
    verify_image
    
    # 显示完成信息
    print_message $GREEN "🎉 镜像构建完成！"
    print_message $BLUE "📊 构建统计:"
    echo "   - 应用名: $APP_NAME"
    echo "   - 版本: $VERSION"
    echo "   - 镜像: $REGISTRY/$APP_NAME:$VERSION"
    echo "   - 构建耗时: ${SECONDS}s"
    echo "   - 安全扫描: $([ "$SCAN" = "true" ] && echo "已执行" || echo "已跳过")"
    echo "   - 镜像推送: $([ "$PUSH" = "true" ] && echo "已推送" || echo "已跳过")"
    echo ""
    print_message $BLUE "📋 使用说明:"
    echo "   docker run $REGISTRY/$APP_NAME:$VERSION"
    echo ""
}

# 错误处理
trap 'print_message $RED "❌ 构建过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@"

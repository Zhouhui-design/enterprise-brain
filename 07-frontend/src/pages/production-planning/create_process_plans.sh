#!/bin/bash

# 基于 AssemblyProcessPlanList.vue 创建其他工序计划页面的脚本

# 定义工序计划列表（文件名:工序名称:标题）
declare -a PROCESSES=(
  "ShotBlastingProcessPlanList:抛丸:抛丸工序计划"
  "ManualWeldingProcessPlanList:人工焊接:人工焊接工序计划"
  "TubeBendingProcessPlanList:弯管:弯管工序计划"
  "LaserTubeCuttingProcessPlanList:激光切管:激光切管工序计划"
  "LaserCuttingProcessPlanList:激光下料:激光下料工序计划"
  "BendingProcessPlanList:折弯:折弯工序计划"
  "DrillingProcessPlanList:打孔:打孔工序计划"
  "PunchingProcessPlanList:冲床:冲床工序计划"
  "ManualCuttingProcessPlanList:人工下料:人工下料工序计划"
  "MachineGrindingProcessPlanList:机器打磨:机器打磨工序计划"
  "CuttingProcessPlanList:裁剪:裁剪工序计划"
)

# 基础模板文件
TEMPLATE="AssemblyProcessPlanList.vue"

for process in "${PROCESSES[@]}"; do
  IFS=':' read -r filename processname title <<< "$process"
  
  # 如果文件不存在，则创建
  if [ ! -f "$filename.vue" ]; then
    echo "创建 $filename.vue ..."
    sed "s/组装工序计划/$title/g; s/组装/$processname/g" "$TEMPLATE" > "$filename.vue"
    echo "✓ $filename.vue 创建完成"
  else
    echo "⊘ $filename.vue 已存在，跳过"
  fi
done

echo "所有工序计划页面创建完成！"

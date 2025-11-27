<template>
  <div class="color-picker">
    <el-popover
      :visible="visible"
      placement="bottom"
      :width="320"
      trigger="click"
      @show="handleShow"
      @hide="handleHide"
    >
      <template #reference>
        <div class="color-picker-trigger" @click="toggleVisible">
          <div class="color-preview" :style="{ backgroundColor: displayColor }">
            <div v-if="showAlpha && !solidColor" class="alpha-background"></div>
          </div>
          <span class="color-text">{{ displayText }}</span>
          <i class="el-icon-arrow-down el-icon--right"></i>
        </div>
      </template>
      
      <div class="color-picker-panel">
        <!-- 预设颜色 -->
        <div class="preset-colors" v-if="showPreset">
          <div class="preset-title">预设颜色</div>
          <div class="preset-grid">
            <div
              v-for="color in presetColors"
              :key="color"
              class="preset-item"
              :class="{ active: isSelected(color) }"
              :style="{ backgroundColor: color }"
              @click="selectPresetColor(color)"
            ></div>
          </div>
        </div>

        <!-- 颜色选择器 -->
        <div class="color-picker-main">
          <!-- 色相选择器 -->
          <div class="hue-section">
            <div class="color-display">
              <div
                class="color-swatch"
                :style="{
                  background: `linear-gradient(to right, 
                    hsl(0, 100%, 50%), 
                    hsl(60, 100%, 50%), 
                    hsl(120, 100%, 50%), 
                    hsl(180, 100%, 50%), 
                    hsl(240, 100%, 50%), 
                    hsl(300, 100%, 50%), 
                    hsl(360, 100%, 50%))`
                }"
                ref="hueSlider"
                @mousedown="startHueDrag"
              >
                <div class="hue-pointer" :style="huePointerStyle"></div>
              </div>
            </div>
            
            <!-- 饱和度和亮度选择器 -->
            <div class="saturation-lightness">
              <div
                class="saturation-lightness-canvas"
                :style="slCanvasStyle"
                ref="slCanvas"
                @mousedown="startSLDrag"
              >
                <div class="sl-pointer" :style="slPointerStyle"></div>
              </div>
            </div>
          </div>

          <!-- 透明度选择器 -->
          <div class="alpha-section" v-if="showAlpha">
            <div class="alpha-label">透明度</div>
            <div
              class="alpha-slider"
              :style="alphaSliderStyle"
              ref="alphaSlider"
              @mousedown="startAlphaDrag"
            >
              <div class="alpha-pointer" :style="alphaPointerStyle"></div>
            </div>
            <div class="alpha-value">{{ Math.round(alpha * 100) }}%</div>
          </div>

          <!-- 输入区域 -->
          <div class="input-section">
            <div class="format-tabs">
              <div
                v-for="format in formats"
                :key="format.value"
                class="format-tab"
                :class="{ active: currentFormat === format.value }"
                @click="currentFormat = format.value"
              >
                {{ format.label }}
              </div>
            </div>
            
            <div class="color-inputs">
              <template v-if="currentFormat === 'hex'">
                <el-input
                  v-model="hexInput"
                  placeholder="#FFFFFF"
                  @input="handleHexInput"
                  size="small"
                />
                <el-input
                  v-if="showAlpha"
                  v-model="alphaInput"
                  placeholder="100"
                  @input="handleAlphaInput"
                  size="small"
                  style="margin-top: 8px;"
                >
                  <template #append>%</template>
                </el-input>
              </template>
              
              <template v-else-if="currentFormat === 'rgb'">
                <div class="rgb-inputs">
                  <el-input
                    v-model="rgb.r"
                    placeholder="R"
                    @input="handleRgbInput"
                    size="small"
                  >
                    <template #prepend>R</template>
                  </el-input>
                  <el-input
                    v-model="rgb.g"
                    placeholder="G"
                    @input="handleRgbInput"
                    size="small"
                  >
                    <template #prepend>G</template>
                  </el-input>
                  <el-input
                    v-model="rgb.b"
                    placeholder="B"
                    @input="handleRgbInput"
                    size="small"
                  >
                    <template #prepend>B</template>
                  </el-input>
                </div>
                <el-input
                  v-if="showAlpha"
                  v-model="alphaInput"
                  placeholder="100"
                  @input="handleAlphaInput"
                  size="small"
                  style="margin-top: 8px;"
                >
                  <template #prepend>A</template>
                  <template #append>%</template>
                </el-input>
              </template>
              
              <template v-else-if="currentFormat === 'hsl'">
                <div class="hsl-inputs">
                  <el-input
                    v-model="hsl.h"
                    placeholder="0"
                    @input="handleHslInput"
                    size="small"
                  >
                    <template #append>°</template>
                  </el-input>
                  <el-input
                    v-model="hsl.s"
                    placeholder="100"
                    @input="handleHslInput"
                    size="small"
                  >
                    <template #append>%</template>
                  </el-input>
                  <el-input
                    v-model="hsl.l"
                    placeholder="50"
                    @input="handleHslInput"
                    size="small"
                  >
                    <template #append>%</template>
                  </el-input>
                </div>
                <el-input
                  v-if="showAlpha"
                  v-model="alphaInput"
                  placeholder="100"
                  @input="handleAlphaInput"
                  size="small"
                  style="margin-top: 8px;"
                >
                  <template #prepend>A</template>
                  <template #append>%</template>
                </el-input>
              </template>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button size="small" @click="clearColor">清空</el-button>
          <el-button size="small" @click="resetColor">重置</el-button>
          <el-button type="primary" size="small" @click="confirmColor">确定</el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

interface Props {
  modelValue?: string
  showAlpha?: boolean
  showPreset?: boolean
  presetColors?: string[]
  size?: 'large' | 'default' | 'small'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '#409EFF',
  showAlpha: false,
  showPreset: true,
  presetColors: () => [
    '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3',
    '#FF69B4', '#FFA500', '#FFD700', '#32CD32', '#1E90FF', '#9370DB', '#FF1493',
    '#DC143C', '#FF8C00', '#FF6347', '#00CED1', '#4169E1', '#8A2BE2', '#FF00FF',
    '#FFFFFF', '#F5F5F5', '#DCDCDC', '#C0C0C0', '#A9A9A9', '#808080', '#696969'
  ],
  size: 'default',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [color: string]
  change: [color: string]
  clear: []
}>()

const visible = ref(false)
const hue = ref(220)
const saturation = ref(100)
const lightness = ref(50)
const alpha = ref(1)
const currentFormat = ref('hex')
const isDragging = ref(false)

const hexInput = ref('')
const alphaInput = ref('100')
const rgb = ref({ r: 64, g: 158, b: 255 })
const hsl = ref({ h: 220, s: 100, l: 50 })

const hueSlider = ref<HTMLElement>()
const slCanvas = ref<HTMLElement>()
const alphaSlider = ref<HTMLElement>()

const formats = [
  { label: 'HEX', value: 'hex' },
  { label: 'RGB', value: 'rgb' },
  { label: 'HSL', value: 'hsl' }
]

const solidColor = computed(() => {
  if (props.modelValue && props.modelValue !== 'transparent') {
    return props.modelValue.includes('#') ? props.modelValue : rgbToHex(rgb.value.r, rgb.value.g, rgb.value.b)
  }
  return '#FFFFFF'
})

const displayColor = computed(() => {
  if (!props.modelValue || props.modelValue === 'transparent') {
    return 'transparent'
  }
  return `hsla(${hue.value}, ${saturation.value}%, ${lightness.value}%, ${alpha.value})`
})

const displayText = computed(() => {
  if (!props.modelValue || props.modelValue === 'transparent') {
    return 'transparent'
  }
  
  if (currentFormat.value === 'hex') {
    const hex = hslToHex(hue.value, saturation.value, lightness.value)
    return alpha.value < 1 ? `${hex}${Math.round(alpha.value * 255).toString(16).padStart(2, '0')}` : hex
  } else if (currentFormat.value === 'rgb') {
    return alpha.value < 1 
      ? `rgba(${rgb.value.r}, ${rgb.value.g}, ${rgb.value.b}, ${alpha.value})`
      : `rgb(${rgb.value.r}, ${rgb.value.g}, ${rgb.value.b})`
  } else {
    return alpha.value < 1
      ? `hsla(${Math.round(hsl.value.h)}, ${Math.round(hsl.value.s)}%, ${Math.round(hsl.value.l)}%, ${alpha.value})`
      : `hsl(${Math.round(hsl.value.h)}, ${Math.round(hsl.value.s)}%, ${Math.round(hsl.value.l)}%)`
  }
})

const huePointerStyle = computed(() => ({
  left: `${(hue.value / 360) * 100}%`
}))

const slCanvasStyle = computed(() => ({
  backgroundColor: `hsl(${hue.value}, 100%, 50%)`
}))

const slPointerStyle = computed(() => ({
  left: `${saturation.value}%`,
  top: `${100 - lightness.value}%`
}))

const alphaSliderStyle = computed(() => ({
  background: `linear-gradient(to right, 
    transparent, 
    hsl(${hue.value}, ${saturation.value}%, ${lightness.value}%))`
}))

const alphaPointerStyle = computed(() => ({
  left: `${alpha.value * 100}%`
}))

const toggleVisible = () => {
  if (!props.disabled) {
    visible.value = !visible.value
  }
}

const handleShow = () => {
  parseColor(props.modelValue || '#409EFF')
  updateInputs()
}

const handleHide = () => {
  visible.value = false
}

const parseColor = (color: string) => {
  if (!color || color === 'transparent') {
    hue.value = 220
    saturation.value = 100
    lightness.value = 50
    alpha.value = 1
    return
  }

  if (color.startsWith('#')) {
    const parsed = hexToHsl(color)
    hue.value = parsed.h
    saturation.value = parsed.s
    lightness.value = parsed.l
    alpha.value = parsed.a || 1
  } else if (color.startsWith('rgb')) {
    const parsed = rgbToHsl(parseInt(rgb.value.r), parseInt(rgb.value.g), parseInt(rgb.value.b))
    hue.value = parsed.h
    saturation.value = parsed.s
    lightness.value = parsed.l
    alpha.value = alpha.value
  } else if (color.startsWith('hsl')) {
    const parsed = hslToHsl(color)
    hue.value = parsed.h
    saturation.value = parsed.s
    lightness.value = parsed.l
    alpha.value = parsed.a || 1
  }

  updateRgbFromHsl()
}

const updateRgbFromHsl = () => {
  const result = hslToRgb(hue.value, saturation.value, lightness.value)
  rgb.value = { r: result.r, g: result.g, b: result.b }
  hsl.value = { h: hue.value, s: saturation.value, l: lightness.value }
}

const updateInputs = () => {
  if (currentFormat.value === 'hex') {
    hexInput.value = hslToHex(hue.value, saturation.value, lightness.value)
  } else if (currentFormat.value === 'rgb') {
    // rgb值已在updateRgbFromHsl中更新
  } else if (currentFormat.value === 'hsl') {
    // hsl值已在更新时设置
  }
  
  alphaInput.value = Math.round(alpha.value * 100).toString()
}

const startHueDrag = (e: MouseEvent) => {
  isDragging.value = true
  updateHue(e)
  document.addEventListener('mousemove', updateHue)
  document.addEventListener('mouseup', stopHueDrag)
}

const updateHue = (e: MouseEvent) => {
  if (!hueSlider.value || !isDragging.value && e.type === 'mousemove') return
  
  const rect = hueSlider.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const percentage = Math.max(0, Math.min(1, x / rect.width))
  hue.value = percentage * 360
  
  updateRgbFromHsl()
  emitChange()
}

const stopHueDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', updateHue)
  document.removeEventListener('mouseup', stopHueDrag)
}

const startSLDrag = (e: MouseEvent) => {
  isDragging.value = true
  updateSL(e)
  document.addEventListener('mousemove', updateSL)
  document.addEventListener('mouseup', stopSLDrag)
}

const updateSL = (e: MouseEvent) => {
  if (!slCanvas.value || (!isDragging.value && e.type === 'mousemove')) return
  
  const rect = slCanvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  saturation.value = Math.max(0, Math.min(100, (x / rect.width) * 100))
  lightness.value = Math.max(0, Math.min(100, (1 - y / rect.height) * 100))
  
  updateRgbFromHsl()
  emitChange()
}

const stopSLDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', updateSL)
  document.removeEventListener('mouseup', stopSLDrag)
}

const startAlphaDrag = (e: MouseEvent) => {
  isDragging.value = true
  updateAlpha(e)
  document.addEventListener('mousemove', updateAlpha)
  document.addEventListener('mouseup', stopAlphaDrag)
}

const updateAlpha = (e: MouseEvent) => {
  if (!alphaSlider.value || (!isDragging.value && e.type === 'mousemove')) return
  
  const rect = alphaSlider.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  alpha.value = Math.max(0, Math.min(1, x / rect.width))
  
  emitChange()
}

const stopAlphaDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', updateAlpha)
  document.removeEventListener('mouseup', stopAlphaDrag)
}

const handleHexInput = () => {
  if (hexInput.value && /^#[0-9A-Fa-f]{6}$/.test(hexInput.value)) {
    const parsed = hexToHsl(hexInput.value)
    hue.value = parsed.h
    saturation.value = parsed.s
    lightness.value = parsed.l
    updateRgbFromHsl()
    emitChange()
  }
}

const handleAlphaInput = () => {
  const alphaValue = parseFloat(alphaInput.value) / 100
  if (!isNaN(alphaValue) && alphaValue >= 0 && alphaValue <= 1) {
    alpha.value = alphaValue
    emitChange()
  }
}

const handleRgbInput = () => {
  const r = parseInt(rgb.value.r) || 0
  const g = parseInt(rgb.value.g) || 0
  const b = parseInt(rgb.value.b) || 0
  
  if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
    const parsed = rgbToHsl(r, g, b)
    hue.value = parsed.h
    saturation.value = parsed.s
    lightness.value = parsed.l
    emitChange()
  }
}

const handleHslInput = () => {
  const h = parseFloat(hsl.value.h) || 0
  const s = parseFloat(hsl.value.s) || 0
  const l = parseFloat(hsl.value.l) || 0
  
  if (h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100) {
    hue.value = h
    saturation.value = s
    lightness.value = l
    updateRgbFromHsl()
    emitChange()
  }
}

const selectPresetColor = (color: string) => {
  parseColor(color)
  emitChange()
}

const isSelected = (color: string) => {
  return hslToHex(hue.value, saturation.value, lightness.value).toLowerCase() === color.toLowerCase()
}

const clearColor = () => {
  emit('update:modelValue', '')
  emit('clear')
  visible.value = false
}

const resetColor = () => {
  parseColor('#409EFF')
  emitChange()
}

const confirmColor = () => {
  emitChange()
  visible.value = false
}

const emitChange = () => {
  const color = currentFormat.value === 'hex' 
    ? hslToHex(hue.value, saturation.value, lightness.value)
    : displayText.value
  
  emit('update:modelValue', color)
  emit('change', color)
}

// 颜色转换函数
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 }
}

const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255
  g /= 255
  b /= 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

const hslToRgb = (h: number, s: number, l: number) => {
  h = h / 360
  s = s / 100
  l = l / 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

const hexToHsl = (hex: string) => {
  const rgb = hexToRgb(hex)
  return rgbToHsl(rgb.r, rgb.g, rgb.b)
}

const hslToHex = (h: number, s: number, l: number) => {
  const rgb = hslToRgb(h, s, l)
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

const hslToHsl = (hslString: string) => {
  const match = hslString.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*([\d.]+))?\)/)
  if (match) {
    return {
      h: parseInt(match[1]),
      s: parseInt(match[2]),
      l: parseInt(match[3]),
      a: match[4] ? parseFloat(match[4]) : 1
    }
  }
  return { h: 0, s: 0, l: 50, a: 1 }
}

watch(() => props.modelValue, (newValue) => {
  if (newValue !== displayText.value) {
    parseColor(newValue || '#409EFF')
    updateInputs()
  }
})

watch(currentFormat, () => {
  updateInputs()
})
</script>

<style scoped>
.color-picker {
  display: inline-block;
}

.color-picker-trigger {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 4px;
  cursor: pointer;
  background: white;
  transition: all 0.3s;
}

.color-picker-trigger:hover {
  border-color: var(--primary-color, #409eff);
}

.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 3px;
  border: 1px solid #ddd;
  position: relative;
  overflow: hidden;
}

.alpha-background {
  position: absolute;
  inset: 0;
  background: 
    linear-gradient(45deg, #ddd 25%, transparent 25%),
    linear-gradient(-45deg, #ddd 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ddd 75%),
    linear-gradient(-45deg, transparent 75%, #ddd 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
}

.color-text {
  flex: 1;
  margin: 0 8px;
  font-size: 12px;
  color: var(--text-color, #606266);
}

.color-picker-panel {
  padding: 12px;
}

.preset-colors {
  margin-bottom: 12px;
}

.preset-title {
  font-size: 12px;
  color: var(--text-color, #606266);
  margin-bottom: 8px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.preset-item {
  width: 32px;
  height: 32px;
  border-radius: 3px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.preset-item:hover {
  transform: scale(1.1);
}

.preset-item.active {
  border-color: var(--primary-color, #409eff);
}

.color-picker-main {
  margin-bottom: 12px;
}

.hue-section {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.color-display {
  flex: 1;
}

.color-swatch {
  width: 100%;
  height: 12px;
  border-radius: 6px;
  position: relative;
  cursor: pointer;
}

.hue-pointer {
  position: absolute;
  top: -2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  border: 2px solid var(--border-color, #dcdfe6);
  transform: translateX(-50%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.saturation-lightness {
  width: 120px;
  height: 120px;
  border-radius: 6px;
  position: relative;
  cursor: pointer;
  background: 
    linear-gradient(to bottom, transparent, black),
    linear-gradient(to right, white, transparent);
}

.sl-pointer {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  border: 2px solid var(--border-color, #dcdfe6);
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.alpha-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.alpha-label {
  font-size: 12px;
  color: var(--text-color, #606266);
  width: 60px;
}

.alpha-slider {
  flex: 1;
  height: 12px;
  border-radius: 6px;
  position: relative;
  cursor: pointer;
  background: 
    linear-gradient(to right, 
      transparent, 
      var(--primary-color, #409eff));
}

.alpha-pointer {
  position: absolute;
  top: -2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  border: 2px solid var(--border-color, #dcdfe6);
  transform: translateX(-50%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.alpha-value {
  font-size: 12px;
  color: var(--text-color, #606266);
  width: 40px;
  text-align: right;
}

.input-section {
  margin-bottom: 12px;
}

.format-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.format-tab {
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 3px;
  color: var(--text-color, #606266);
  transition: all 0.2s;
}

.format-tab:hover {
  background: var(--border-color, #f5f7fa);
}

.format-tab.active {
  background: var(--primary-color, #409eff);
  color: white;
}

.rgb-inputs,
.hsl-inputs {
  display: flex;
  gap: 8px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
# CONTEXT — Liquid Glass (3D Fish Tank)

## Glossary

- **Tank (水缸)** — 整个 3D 渲染区域的统称，由外层玻璃 Box 和内层水体 Box 组成。响应式撑满 Electron 无边框窗口。
- **Outer Box (外层玻璃)** — 使用 `MeshTransmissionMaterial` 渲染的高折射率厚玻璃外壳。无边框窗口本身即为此玻璃。
- **Inner Box (水体)** — 嵌套在外层 Box 内部的半满水体体积。底部和四壁固定，仅顶部顶点参与波浪位移。
- **Fluid Volume (水体体积)** — 半缸水的 3D 体积。不是薄片，具有真实的 Y 轴厚度。
- **Half-Tank Threshold (半缸阈值)** — 水体 Box 内部区分"水面以上"和"水面以下"的 Y 轴分界线。
- **Responsive Viewport (响应式视口)** — 水缸宽高比随窗口自由缩放，无黑边，始终撑满。
- **Transparent Desktop Background** — Electron `transparent: true`，水缸背后直接透出系统桌面壁纸和图标，不做任何 2D 模糊处理。
- **Perspective Camera (透视相机)** — FOV 10-15°，Z 轴拉远以逼近正侧面平视，同时保留 PBR 光学折射计算。
- **Silk Waves (丝绸波浪)** — 由 3-4 个不同频率平滑正弦波叠加而成的水面动画，无噪声，无锯齿。
- **Refracted Lyrics (悬浮折射歌词)** — 放置在水体内部的 3D 文本，隔着厚玻璃和起伏水面产生光学扭曲。
- **u_bass** — 控制波浪高度的 uniform，由音频低频能量驱动或手动滑块调节。
- **u_energy** — 控制波浪频率/剧烈程度的 uniform。
- **Glass Wall Thickness (缸壁厚度)** — 0.2-0.5 世界单位。Z 轴深度固定为 3-4 单位，thickness 仅指缸壁的物理厚度。
- **Inner Box Clearance (嵌套间隙)** — 水体 Box 的 X/Z 尺寸 = 外层 Box 减去 2×缸壁厚度，防止 Z-fighting 并保持正确折射路径。
- **Fluid Box Height Ratio (水体高度比)** — 水体 Box 的 Y 轴高度 = 外层 Box 高度的 60%，放置于底部。顶部顶点 Y = fluidBoxHeight/2。
- **Vertex Displacement Gate (顶点位移门控)** — Shader 中 `position.y >= (fluidBoxHeight/2.0 - 0.01)` 判断，仅顶部顶点参与正弦波位移，其余保持静止。
- **Material Split (材质分层策略)** — 外层 = MeshTransmissionMaterial (IOR 1.5, chromaticAberration)，内层 = CustomShaderMaterial 扩展自 MeshPhysicalMaterial (transparent, opacity 0.7-0.85, 深靛蓝)。
- **Optical Deception (光学欺骗)** — 利用外层玻璃的折射包裹内层半透明水体，制造"水体在玻璃内折射"的视觉错觉，避免双层 Transmission 的性能灾难。
- **Wave Triad (三波叠加)** — 纯正弦波沿 X 轴传播 `sin(x·freq + time·speed)`。主波 0.5Hz（大振幅）、次波 1.2Hz（中振幅+相位差）、细节波 2.5Hz（极小振幅）。严禁 fract/noise。
- **Demo Sliders (演示滑块)** — 当前唯一数据源。三个 HTML range input（Bass, Energy, Treble）→ React State → Shader Uniforms。后续替换数据源时 Shader 无需改动。
- **Idle Breeze (静音微风)** — u_bass=0 时水面不完全静止，基础振幅 = 最大浪高 5-10%，基础速度 0.1x。u_bass 是振幅乘数，u_energy 是速度乘数。
- **Lyric Placement (歌词定位)** — Inter 无衬线字体，纯白 emissive，悬浮于水体 Box 几何中心偏后 (Z ≈ 0 ~ -0.5)，字号约水缸高度的 1/5。直接替换，无切换动画。
- **Rounded Glass Edge (玻璃倒角)** — 外层 Box 使用 Drei `<RoundedBox>` 替代普通 BoxGeometry，圆角半径 0.05，增强边缘高光折射。
- **Lighting Triad (三灯布局)** — Environment "city" + DirectionalLight [5,5,5]（锐利高光）+ 水体内部 AmbientLight/PointLight（防歌词死黑）。
- **UI Overlay (HTML 叠加层)** — 纯 HTML/CSS absolute 定位 + z-index，不嵌入 3D 场景。三个滑块 Bass/Energy/Treble 范围 [0, 2.0] 步长 0.01。
- **Platform Target** — Windows only，60fps 锁定，Electron ≥28，npm，TypeScript。
- **u_treble (双重映射)** — (1) 物理层：作为细节波 (2.5Hz+) 振幅乘数；(2) 光学层：动态驱动外层 `chromaticAberration`（基础 0.04，峰值 0.15-0.2），制造高音 RGB 色边闪烁。

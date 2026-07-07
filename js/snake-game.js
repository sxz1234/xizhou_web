const SNAKE_STORAGE_KEY = 'circuit-snake-best'

const initSnakeGame = () => {
  const canvas = document.getElementById('snake-canvas')
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const scoreEl = document.getElementById('snake-score')
  const bestEl = document.getElementById('snake-best')
  const statusEl = document.getElementById('snake-status')
  const startBtn = document.getElementById('snake-start')
  const dpad = document.getElementById('snake-dpad')

  const GRID = 20
  const COLORS = {
    bg: '#060d18',
    grid: 'rgba(77, 215, 255, 0.06)',
    snakeHead: '#4dd7ff',
    snakeBody: '#2a9db8',
    snakeTail: '#1a6b80',
    food: '#a78bfa',
    foodGlow: 'rgba(167, 139, 250, 0.45)',
    overlay: 'rgba(3, 5, 10, 0.72)'
  }

  let cellSize = 0
  let snake = []
  let direction = { x: 1, y: 0 }
  let nextDirection = { x: 1, y: 0 }
  let food = { x: 0, y: 0 }
  let score = 0
  let best = parseInt(localStorage.getItem(SNAKE_STORAGE_KEY) || '0', 10)
  let loopId = null
  let isRunning = false
  let isPaused = false
  let tickMs = 140

  if (bestEl) bestEl.textContent = String(best)

  const setStatus = (text) => {
    if (statusEl) statusEl.textContent = text
  }

  const resizeCanvas = () => {
    const body = canvas.closest('.game-body')
    const side = body?.querySelector('.game-side')
    const gap = 24
    const sideWidth = side?.offsetWidth || 220
    const bodyWidth = body?.clientWidth || 720
    const available = bodyWidth - sideWidth - gap
    const maxWidth = Math.min(Math.max(available, 480), 640)
    const size = Math.floor(maxWidth / GRID) * GRID
    canvas.width = size
    canvas.height = size
    cellSize = size / GRID
    draw()
  }

  const randomFood = () => {
    let pos
    do {
      pos = {
        x: Math.floor(Math.random() * GRID),
        y: Math.floor(Math.random() * GRID)
      }
    } while (snake.some(s => s.x === pos.x && s.y === pos.y))
    food = pos
  }

  const resetGame = () => {
    const mid = Math.floor(GRID / 2)
    snake = [
      { x: mid - 2, y: mid },
      { x: mid - 1, y: mid },
      { x: mid, y: mid }
    ]
    direction = { x: 1, y: 0 }
    nextDirection = { x: 1, y: 0 }
    score = 0
    if (scoreEl) scoreEl.textContent = '0'
    randomFood()
  }

  const drawCell = (x, y, color, radius = 0.15) => {
    const pad = cellSize * 0.08
    const px = x * cellSize + pad
    const py = y * cellSize + pad
    const size = cellSize - pad * 2
    const r = size * radius
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(px, py, size, size, r)
    ctx.fill()
  }

  const drawGrid = () => {
    ctx.fillStyle = COLORS.bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = COLORS.grid
    ctx.lineWidth = 0.5
    for (let i = 0; i <= GRID; i++) {
      const p = i * cellSize
      ctx.beginPath()
      ctx.moveTo(p, 0)
      ctx.lineTo(p, canvas.height)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, p)
      ctx.lineTo(canvas.width, p)
      ctx.stroke()
    }
  }

  const drawFood = () => {
    const cx = food.x * cellSize + cellSize / 2
    const cy = food.y * cellSize + cellSize / 2
    const r = cellSize * 0.32
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.2)
    glow.addColorStop(0, COLORS.foodGlow)
    glow.addColorStop(1, 'transparent')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(cx, cy, r * 2.2, 0, Math.PI * 2)
    ctx.fill()
    drawCell(food.x, food.y, COLORS.food, 0.5)
  }

  const drawSnake = () => {
    snake.forEach((seg, i) => {
      const t = i / Math.max(snake.length - 1, 1)
      const color = i === 0
        ? COLORS.snakeHead
        : i === snake.length - 1
          ? COLORS.snakeTail
          : `rgb(${Math.round(42 + t * 20)}, ${Math.round(157 + t * 30)}, ${Math.round(184 + t * 20)})`
      drawCell(seg.x, seg.y, color, i === 0 ? 0.35 : 0.2)
    })
  }

  const drawOverlay = (title, subtitle) => {
    ctx.fillStyle = COLORS.overlay
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#e6edf7'
    ctx.font = `600 ${Math.max(14, cellSize * 0.9)}px "Outfit", "Noto Sans SC", sans-serif`
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 8)
    ctx.fillStyle = '#9fb2c8'
    ctx.font = `400 ${Math.max(11, cellSize * 0.55)}px "Noto Sans SC", sans-serif`
    ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + cellSize * 0.9)
  }

  const draw = () => {
    drawGrid()
    drawFood()
    drawSnake()
    if (!isRunning && !isPaused) {
      drawOverlay('按开始游戏', '方向键 / WASD / 触控按钮')
    } else if (isPaused) {
      drawOverlay('已暂停', '按 P 或空格继续')
    }
  }

  const updateBest = () => {
    if (score > best) {
      best = score
      localStorage.setItem(SNAKE_STORAGE_KEY, String(best))
      if (bestEl) bestEl.textContent = String(best)
    }
  }

  const gameOver = () => {
    isRunning = false
    clearInterval(loopId)
    loopId = null
    updateBest()
    setStatus(`游戏结束 · 得分 ${score}`)
    if (startBtn) {
      startBtn.textContent = '再来一局'
      startBtn.setAttribute('aria-label', '再来一局')
    }
    drawOverlay('信号中断', `得分 ${score} · 点击再来一局`)
  }

  const tick = () => {
    direction = nextDirection
    const head = {
      x: snake[snake.length - 1].x + direction.x,
      y: snake[snake.length - 1].y + direction.y
    }

    if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
      gameOver()
      return
    }

    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      gameOver()
      return
    }

    snake.push(head)

    if (head.x === food.x && head.y === food.y) {
      score += 10
      if (scoreEl) scoreEl.textContent = String(score)
      randomFood()
      if (tickMs > 70) {
        tickMs -= 3
        clearInterval(loopId)
        loopId = setInterval(tick, tickMs)
      }
    } else {
      snake.shift()
    }

    draw()
  }

  const startGame = () => {
    clearInterval(loopId)
    resetGame()
    tickMs = 140
    isRunning = true
    isPaused = false
    setStatus('信号传输中…')
    if (startBtn) {
      startBtn.textContent = '暂停'
      startBtn.setAttribute('aria-label', '暂停游戏')
    }
    canvas.focus({ preventScroll: true })
    draw()
    loopId = setInterval(tick, tickMs)
  }

  const togglePause = () => {
    if (!isRunning) return
    isPaused = !isPaused
    if (isPaused) {
      clearInterval(loopId)
      loopId = null
      setStatus('已暂停')
      if (startBtn) {
        startBtn.textContent = '继续'
        startBtn.setAttribute('aria-label', '继续游戏')
      }
    } else {
      setStatus('信号传输中…')
      if (startBtn) {
        startBtn.textContent = '暂停'
        startBtn.setAttribute('aria-label', '暂停游戏')
      }
      loopId = setInterval(tick, tickMs)
    }
    draw()
  }

  const handleStartClick = () => {
    if (!isRunning) {
      startGame()
      return
    }
    togglePause()
  }

  const setDirection = (dx, dy) => {
    if (!isRunning || isPaused) return
    if (dx === -direction.x && dy === -direction.y) return
    if (dx === -nextDirection.x && dy === -nextDirection.y) return
    nextDirection = { x: dx, y: dy }
  }

  const isGameSectionVisible = () => {
    const section = document.getElementById('interactive')
    if (!section) return false
    const rect = section.getBoundingClientRect()
    return rect.top < window.innerHeight * 0.85 && rect.bottom > window.innerHeight * 0.15
  }

  const handleKeyDown = (e) => {
    if (!isGameSectionVisible()) return

    const keyMap = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      w: [0, -1],
      W: [0, -1],
      s: [0, 1],
      S: [0, 1],
      a: [-1, 0],
      A: [-1, 0],
      d: [1, 0],
      D: [1, 0]
    }
    const dir = keyMap[e.key]
    if (dir) {
      e.preventDefault()
      if (!isRunning) startGame()
      setDirection(dir[0], dir[1])
      return
    }
    if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
      e.preventDefault()
      if (!isRunning) {
        startGame()
        return
      }
      togglePause()
    }
  }

  startBtn?.addEventListener('click', handleStartClick)

  dpad?.querySelectorAll('[data-dir]').forEach(btn => {
    const handlePress = (e) => {
      e.preventDefault()
      const [dx, dy] = btn.dataset.dir.split(',').map(Number)
      setDirection(dx, dy)
    }
    btn.addEventListener('click', handlePress)
    btn.addEventListener('touchstart', handlePress, { passive: false })
  })

  canvas.addEventListener('click', () => {
    canvas.focus({ preventScroll: true })
    if (!isRunning) startGame()
  })

  canvas.setAttribute('tabindex', '0')
  canvas.setAttribute('role', 'application')
  canvas.setAttribute('aria-label', '贪吃蛇游戏，使用方向键或 WASD 控制')

  document.addEventListener('keydown', handleKeyDown, { capture: true })

  resetGame()
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
}

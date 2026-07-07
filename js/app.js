document.documentElement.classList.add('js-enabled')

const QUIZ_DATA = [
  {
    question: 'Pipeline ADC 中，级间通常使用什么电路放大 residue 信号？',
    options: ['锁相环 (PLL)', '运算放大器 (MDAC)', 'Bandgap 基准'],
    correct: 1
  },
  {
    question: '12 bit ADC 的理论量化级数为多少？',
    options: ['256 级', '4096 级', '65536 级'],
    correct: 1
  },
  {
    question: '非厄米系统中，本征态倾向于局域在边界的效应叫做？',
    options: ['量子霍尔效应', '非厄米皮肤效应 (NHSE)', 'Josephson 效应'],
    correct: 1
  },
  {
    question: '2 GS/s 采样率意味着每秒采集多少样本？',
    options: ['2×10⁶', '2×10⁹', '2×10¹²'],
    correct: 1
  }
]

const KEYWORDS = [
  '高速 Pipeline ADC',
  '12 bit · 2 GS/s',
  '数字校正 Calibration',
  '高速运算放大器'
]

const initNavigation = () => {
  const nav = document.querySelector('.nav')
  const navLinks = document.querySelectorAll('.nav-links a')
  const toggle = document.querySelector('.nav-toggle')
  const linksContainer = document.querySelector('.nav-links')
  const backTop = document.getElementById('back-top')
  const scrollProgress = document.getElementById('scroll-progress')

  if (!nav) return

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50)
    if (backTop) backTop.hidden = window.scrollY < 400
    if (scrollProgress) {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      scrollProgress.style.width = `${progress}%`
    }
  })

  backTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })

  const sections = document.querySelectorAll('section[id]')
  if (sections.length && navLinks.length) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            navLinks.forEach(link => {
              link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)
            })
          }
        })
      },
      { rootMargin: '-40% 0px -55% 0px' }
    )
    sections.forEach(s => observer.observe(s))
  }

  toggle?.addEventListener('click', () => {
    linksContainer?.classList.toggle('open')
  })

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      linksContainer?.classList.remove('open')
    })
  })
}

const initScrollReveal = () => {
  const elements = document.querySelectorAll('.reveal')
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible')
      })
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  )
  elements.forEach(el => observer.observe(el))
}

const initKeywordRotator = () => {
  const el = document.getElementById('keyword-rotator')
  if (!el) return

  let index = 0
  setInterval(() => {
    el.classList.add('fade')
    setTimeout(() => {
      index = (index + 1) % KEYWORDS.length
      el.textContent = KEYWORDS[index]
      el.classList.remove('fade')
    }, 300)
  }, 3000)
}

const initTimeline = () => {
  const items = document.querySelectorAll('.timeline-item')
  const detailEl = document.getElementById('timeline-detail')
  const highlightsEl = document.getElementById('timeline-highlights')
  if (!items.length || !detailEl) return

  const renderHighlights = (item) => {
    if (!highlightsEl) return
    const raw = item.dataset.highlights || ''
    const parts = raw.split('|').filter(Boolean)
    highlightsEl.innerHTML = parts.map(part =>
      `<span class="timeline-highlight-item">${part}</span>`
    ).join('')
  }

  items.forEach(item => {
    item.addEventListener('click', () => {
      items.forEach(i => i.classList.remove('active'))
      item.classList.add('active')
      detailEl.style.opacity = '0'
      setTimeout(() => {
        detailEl.textContent = item.dataset.detail || ''
        renderHighlights(item)
        detailEl.style.opacity = '1'
      }, 150)
    })
  })
}

const initStatCounters = () => {
  const counters = document.querySelectorAll('.stat-num[data-target]')
  if (!counters.length) return

  const animateCounter = (el) => {
    const target = Number(el.dataset.target)
    if (!target) return
    const duration = 1200
    const start = performance.now()

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      el.textContent = String(Math.round(target * eased))
      if (progress < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target)
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.5 }
  )

  counters.forEach(el => observer.observe(el))
}

const initCardTilt = () => {
  const cards = document.querySelectorAll('.stat-card, .skill-card, .award-badge, .contact-card, .news-card')
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  cards.forEach(card => {
    card.classList.add('tilt-card')
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      card.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`
    })
    card.addEventListener('mouseleave', () => {
      card.style.transform = ''
    })
  })
}

const initHeroChips = () => {
  const chips = document.querySelectorAll('.hero-chip')
  const tips = {
    '高速数据转换': 'GS/s 级采样 · 通信/雷达/仪器',
    'Pipeline 架构': '多级流水 · 速度与精度平衡',
    'MDAC · Calibration': '级间放大 + 数字误差校正',
    '拓扑电路 · 本科': 'NHSE · Klein 瓶 · APT 对称',
    'NJUPT → SJTU': '南邮集电本科 → 上交研究生'
  }

  chips.forEach(chip => {
    chip.setAttribute('tabindex', '0')
    chip.setAttribute('role', 'button')
    const tip = tips[chip.textContent.trim()] || chip.textContent.trim()

    const showTip = () => {
      chip.classList.add('chip-active')
      let bubble = chip.querySelector('.chip-tip')
      if (!bubble) {
        bubble = document.createElement('span')
        bubble.className = 'chip-tip'
        bubble.textContent = tip
        chip.appendChild(bubble)
      }
    }

    const hideTip = () => chip.classList.remove('chip-active')

    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('chip-active'))
      showTip()
    })
    chip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        chips.forEach(c => c.classList.remove('chip-active'))
        showTip()
      }
    })
    chip.addEventListener('blur', hideTip)
  })

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.hero-chip')) {
      chips.forEach(c => c.classList.remove('chip-active'))
    }
  })
}

const initWaveformInteract = () => {
  const bar = document.querySelector('.waveform-bar')
  const bars = document.querySelectorAll('.waveform-bars span')
  if (!bar || !bars.length) return

  bar.setAttribute('tabindex', '0')
  bar.setAttribute('role', 'slider')
  bar.setAttribute('aria-label', '交互式采样波形 — 移动鼠标调节幅度')

  const updateBars = (ratio) => {
    bars.forEach((span, i) => {
      const wave = Math.sin((i / bars.length) * Math.PI * 2 + ratio * Math.PI * 2)
      const h = 30 + Math.abs(wave) * 60 * (0.5 + ratio * 0.5)
      span.style.height = `${h}%`
      span.style.animationPlayState = ratio > 0.8 ? 'paused' : 'running'
    })
  }

  bar.addEventListener('mousemove', (e) => {
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    updateBars(ratio)
    bar.classList.add('waveform-active')
  })

  bar.addEventListener('mouseleave', () => {
    bars.forEach(span => { span.style.height = '' })
    bar.classList.remove('waveform-active')
  })

  bar.addEventListener('click', () => {
    bar.classList.toggle('waveform-frozen')
    const label = bar.querySelector('.waveform-label')
    if (label) {
      label.textContent = bar.classList.contains('waveform-frozen') ? '波形已冻结 · 再点恢复' : '2 GS/s · 采样波形'
    }
  })
}

const initAdcDiagram = () => {
  const stages = document.querySelectorAll('.adc-stage')
  if (!stages.length) return

  stages.forEach((stage, i) => {
    stage.setAttribute('tabindex', '0')
    stage.setAttribute('role', 'button')
    const handleActivate = () => {
      stages.forEach(s => s.classList.remove('adc-stage-active'))
      stage.classList.add('adc-stage-active')
      stage.style.animationDelay = `${i * 0.15}s`
    }
    stage.addEventListener('click', handleActivate)
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleActivate()
      }
    })
  })
}

const initKonamiEasterEgg = () => {
  const sequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
  let step = 0

  document.addEventListener('keydown', (e) => {
    if (e.key === sequence[step]) {
      step++
      if (step === sequence.length) {
        step = 0
        const toast = document.createElement('div')
        toast.className = 'easter-toast'
        toast.textContent = '🎮 12 bit · 2 GS/s — 信号已锁定！'
        document.body.appendChild(toast)
        setTimeout(() => toast.remove(), 3000)
      }
    } else {
      step = e.key === sequence[0] ? 1 : 0
    }
  })
}

const initMagneticButtons = () => {
  if (window.matchMedia('(pointer: coarse)').matches) return

  document.querySelectorAll('.btn-primary, .hero-avatar-inner').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`
    })
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = ''
    })
  })
}

const initResearchTags = () => {
  const tags = document.querySelectorAll('.research-tag')
  const panelText = document.getElementById('tag-panel-text')
  if (!tags.length || !panelText) return

  tags.forEach(tag => {
    tag.addEventListener('click', () => {
      const isActive = tag.classList.contains('active')
      tags.forEach(t => t.classList.remove('active'))
      if (!isActive) {
        tag.classList.add('active')
        panelText.textContent = tag.dataset.desc || ''
      }
    })
  })
}

const initPaperFilter = () => {
  const tabs = document.querySelectorAll('.filter-tab')
  const papers = document.querySelectorAll('.paper-item')
  if (!tabs.length) return

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      const filter = tab.dataset.filter
      papers.forEach(paper => {
        const role = paper.dataset.role
        const show = filter === 'all' || role === filter || (filter === 'first' && role === 'first') || (filter === 'co' && role === 'co')
        paper.classList.toggle('hidden', !show)
      })
    })
  })
}

const initPaperToggle = () => {
  document.querySelectorAll('.paper-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const item = toggle.closest('.paper-item')
      const isOpen = item.classList.toggle('open')
      toggle.setAttribute('aria-expanded', isOpen)
    })
  })
}

const initCopyEmail = () => {
  const btn = document.getElementById('copy-email')
  const tip = document.getElementById('copy-tip')
  const email = 'xizhoushen@foxmail.com'
  if (!btn) return

  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(email)
      if (tip) {
        tip.textContent = '已复制到剪贴板 ✓'
        setTimeout(() => { tip.textContent = '' }, 2500)
      }
    } catch {
      if (tip) tip.textContent = '复制失败，请手动选择邮箱'
    }
  })
}

const initMessageForm = () => {
  const form = document.getElementById('message-form')
  if (!form) return

  form.addEventListener('submit', e => {
    e.preventDefault()
    const name = document.getElementById('msg-name')?.value.trim() || '访客'
    const content = document.getElementById('msg-content')?.value.trim()
    if (!content) return

    const subject = encodeURIComponent(`网站留言 - 来自 ${name}`)
    const body = encodeURIComponent(`称呼：${name}\n\n${content}`)
    window.location.href = `mailto:xizhoushen@foxmail.com?subject=${subject}&body=${body}`
  })
}

const initQuiz = () => {
  const questionEl = document.getElementById('quiz-question')
  const optionsEl = document.getElementById('quiz-options')
  const feedbackEl = document.getElementById('quiz-feedback')
  const nextBtn = document.getElementById('quiz-next')
  const scoreEl = document.getElementById('quiz-score')
  const totalEl = document.getElementById('quiz-total')
  if (!questionEl || !optionsEl) return

  let current = 0
  let score = 0
  let answered = false

  if (totalEl) totalEl.textContent = String(QUIZ_DATA.length)

  const renderQuestion = () => {
    const q = QUIZ_DATA[current]
    questionEl.textContent = q.question
    optionsEl.innerHTML = q.options.map((opt, i) =>
      `<button type="button" class="quiz-option" data-index="${i}">${opt}</button>`
    ).join('')
    if (feedbackEl) {
      feedbackEl.textContent = ''
      feedbackEl.className = 'quiz-feedback'
    }
    if (nextBtn) nextBtn.hidden = true
    answered = false

    optionsEl.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(Number(btn.dataset.index)))
    })
  }

  const handleAnswer = (selected) => {
    if (answered) return
    answered = true
    const q = QUIZ_DATA[current]
    const buttons = optionsEl.querySelectorAll('.quiz-option')
    buttons.forEach((btn, i) => {
      btn.disabled = true
      if (i === q.correct) btn.classList.add('correct')
      if (i === selected && i !== q.correct) btn.classList.add('wrong')
    })

    if (selected === q.correct) {
      score++
      if (scoreEl) scoreEl.textContent = String(score)
      if (feedbackEl) {
        feedbackEl.textContent = '回答正确！🎉'
        feedbackEl.className = 'quiz-feedback success'
      }
    } else if (feedbackEl) {
      feedbackEl.textContent = `再想想～正确答案是：${q.options[q.correct]}`
      feedbackEl.className = 'quiz-feedback error'
    }

    if (nextBtn) {
      nextBtn.hidden = false
      nextBtn.textContent = current < QUIZ_DATA.length - 1 ? '下一题' : '重新开始'
    }
  }

  nextBtn?.addEventListener('click', () => {
    if (current < QUIZ_DATA.length - 1) {
      current++
      renderQuestion()
    } else {
      current = 0
      score = 0
      if (scoreEl) scoreEl.textContent = '0'
      renderQuestion()
    }
  })

  renderQuestion()
}

const init = () => {
  initNavigation()
  initScrollReveal()
  initKeywordRotator()
  initTimeline()
  initStatCounters()
  initCardTilt()
  initHeroChips()
  initWaveformInteract()
  initAdcDiagram()
  initKonamiEasterEgg()
  initMagneticButtons()
  initResearchTags()
  initPaperFilter()
  initPaperToggle()
  initCopyEmail()
  initMessageForm()
  initQuiz()
  initSnakeGame()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

require('./style.css')
require('font-awesome/css/font-awesome.css')
const Hls = require('hls.js')

let player
let vid
let btn
let bigbtn
let overlay
let time
let fscrn
let mutebtn
let hideTimeout
let hls
let lstat
let opts
let volumebar
let retry
let vidReady = false
let shouldHide = true
let infscr = false

function readFromURI () {
  let url = null
  if (window.location.hash) {
    url = decodeURIComponent(window.location.hash)
    if (url.indexOf('#') === 0) {
      url = url.substring(1)
    }
  }

  if (url && url !== '' && url !== '#') return url

  let path = window.location.pathname.split('/')
  let pathUsername = path[2]

  if (!pathUsername) pathUsername = 'icytv'

  url = 'https://tv.icynet.eu/live/' + pathUsername + '.m3u8'
  document.title = pathUsername + '\'s Stream - Icy TV'

  return url
}

window.onload = function (argument) {
  player    = document.querySelector('.livecnt')
  vid       = player.querySelector('#stream')
  overlay   = player.querySelector('.overlay')
  btn       = overlay.querySelector('#playbtn')
  time      = overlay.querySelector('#duration')
  fscrn     = overlay.querySelector('#fullscrbtn')
  mutebtn   = overlay.querySelector('#mutebtn')
  lstat     = overlay.querySelector('.live')
  opts      = overlay.querySelector('.controls')
  bigbtn    = overlay.querySelector('.bigplaybtn')
  volumebar = overlay.querySelector('#volume_seek')

  player.addEventListener('mousemove', resetHide)

  opts.addEventListener('mouseenter', () => {
    shouldHide = false
  })

  opts.addEventListener('mouseleave', () => {
    shouldHide = true
  })

  opts.addEventListener('mousemove', () => {
    shouldHide = false
  })

  bigbtn.addEventListener('click', () => {
    toggleStream()
  })

  volumebar.addEventListener('click', (e) => {
    vid.volume = ((e.pageX - volumebar.offsetLeft) / volumebar.clientWidth)
    updateVolume()
  })

  let mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? 'DOMMouseScroll' : 'mousewheel'

  mutebtn.addEventListener(mousewheelevt, (e) => {
    e.preventDefault()
    let scrollAmnt = (e.wheelDelta == null ? e.detail * -40 : e.wheelDelta)

    if (scrollAmnt < 0) {
      vid.volume = clampAddition(-0.1)
    } else {
      vid.volume = clampAddition(0.1)
    }

    updateVolume()
  }, false)

  if (Hls.isSupported()) {
    hls = new Hls()
    hls.loadSource(readFromURI())
    hls.attachMedia(vid)
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      vidReady = true
      liveStatus(true)
    })
    hls.on(Hls.Events.ERROR, (e) => {
      vidReady = false
      liveStatus(false)

      if (!vid.paused) {
        toggleStream()
        resetHide()
      }
    })
  } else {
    alert('Your browser does not support HLS streaming!')
  }

  playbtn.addEventListener('click', toggleStream)
  mutebtn.addEventListener('click', toggleSound)
  fscrn.addEventListener('click', toggleFullscreen)

  document.addEventListener('webkitfullscreenchange', exitHandler, false)
  document.addEventListener('mozfullscreenchange', exitHandler, false)
  document.addEventListener('fullscreenchange', exitHandler, false)
  document.addEventListener('MSFullscreenChange', exitHandler, false)

  vid.addEventListener('timeupdate', updateTime)
}

function clampAddition (val) {
  let volume = vid.volume

  if (volume + val > 1) {
    volume = 1
  } else if (volume + val < 0) {
    volume = 0
  } else {
    volume += val
  }

  return volume.toFixed(2)
}

function showBigBtn (show) {
  if (show) {
    bigbtn.className = 'bigplaybtn'
  } else {
    bigbtn.className = 'bigplaybtn hidden'
  }
}

function updateVolume () {
  let inner = volumebar.querySelector('.seekbar')
  inner.style.width = vid.volume * 100 + '%'
}

function liveStatus (status) {
  if (status) {
    lstat.innerHTML = 'live now'
    lstat.className = 'live'
    clearTimeout(retry)
    if (vid.paused) {
      showBigBtn(true)
    }
  } else {
    lstat.innerHTML = 'offline'
    lstat.className = 'live offline'
    retry = setTimeout(() => {
      if (vidReady) return
      hls.loadSource(readFromURI())
    }, 10000)
  }
}

function hide () {
  if (vid.paused || !shouldHide) {
    overlay.className = 'overlay'
    return
  }

  overlay.className = 'overlay hidden'
}

function resetHide () {
  overlay.className = 'overlay'
  clearTimeout(hideTimeout)

  if (vid.paused) return
  if (!shouldHide) return

  hideTimeout = setTimeout(() => {
    hide()
  }, 5000)
}

function updateTime () {
  let minutes = Math.floor(vid.currentTime / 60)
  let seconds = Math.floor(vid.currentTime - minutes * 60)
  time.innerHTML = minutes + ':' + (seconds < 10 ? '0' + seconds : seconds)
}

function toggleStream () {
  if (!vid) return
  if (!vidReady) return
  if (vid.paused) {
    vid.play()
    btn.innerHTML = '<i class="fa fa-pause fa-fw"></i>'
    showBigBtn(false)
  } else {
    vid.pause()
    btn.innerHTML = '<i class="fa fa-play fa-fw"></i>'
    showBigBtn(true)
  }
}

function toggleSound () {
  let muteicon = mutebtn.querySelector('.fa')
  if (vid.muted) {
    vid.muted = false
    muteicon.className = 'fa fa-volume-up fa-fw'
  } else {
    vid.muted = true
    muteicon.className = 'fa fa-volume-off fa-fw'
  }
}

function exitHandler () {
  if (!(document.fullScreen || document.webkitIsFullScreen || document.mozFullScreen)) {
    infscr = false
  }

  if (infscr) {
    fscrn.innerHTML = '<i class="fa fa-compress fa-fw"></i>'
  } else {
    fscrn.innerHTML = '<i class="fa fa-expand fa-fw"></i>'
  }
}

function toggleFullscreen () {
  if (vid.enterFullscreen) {
    if (!document.fullScreen) {
      player.requestFullScreen()
      infscr = true
    } else {
      document.cancelFullScreen()
    }
  } else if (vid.webkitEnterFullscreen) {
    if (!document.webkitIsFullScreen) {
      player.webkitRequestFullScreen()
      infscr = true
    } else {
      document.webkitCancelFullScreen()
    }
  } else if (vid.mozRequestFullScreen) {
    if (!document.mozFullScreen) {
      player.mozRequestFullScreen()
      infscr = true
    } else {
      document.mozCancelFullScreen()
    }
  } else {
    alert('Your browser doesn\'t support fullscreen!')
  }
}

window.onblur = () => {
  shouldHide = true
}

window.onfocus = () => {
  shouldHide = true
}

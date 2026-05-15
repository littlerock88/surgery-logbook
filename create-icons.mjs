import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

function createIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // พื้นหลังสีน้ำเงิน
  ctx.fillStyle = '#2563eb'
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, size * 0.2)
  ctx.fill()

  // วาดไอคอน +
  ctx.strokeStyle = 'white'
  ctx.lineWidth = size * 0.1
  ctx.lineCap = 'round'
  const center = size / 2
  const len = size * 0.25
  ctx.beginPath()
  ctx.moveTo(center - len, center)
  ctx.lineTo(center + len, center)
  ctx.moveTo(center, center - len)
  ctx.lineTo(center, center + len)
  ctx.stroke()

  return canvas.toBuffer('image/png')
}

writeFileSync('public/icon-192.png', createIcon(192))
writeFileSync('public/icon-512.png', createIcon(512))
console.log('Icons created!')
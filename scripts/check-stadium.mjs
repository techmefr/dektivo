const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),args:['--no-sandbox']})
const page = await browser.newPage({viewport:{width:1280,height:800},locale:'fr-FR'})
const errors=[]
page.on('pageerror',error=>errors.push(error.message))
await page.addInitScript(()=>{
  window.__audios=[]
  const Native=window.AudioContext
  window.AudioContext=class extends Native {
    constructor(...args) {
      super(...args)
      this.__gains=[]
      const create=this.createGain.bind(this)
      this.createGain=()=>{const gain=create();this.__gains.push(gain);return gain}
      window.__audios.push(this)
    }
  }
})
await page.goto((process.env.STADIUM_URL || 'http://127.0.0.1:4178') + '/setup')
await page.getByRole('button',{name:'Placer mes pièces'}).click()
await page.waitForSelector('canvas')
assert.equal(await page.locator('canvas').count(),1)
assert.equal(await page.locator('pattern#crowd').count(),0)
assert.equal(await page.evaluate(()=>window.__audios.length),0)
const image=()=>page.locator('canvas').evaluate(canvas=>canvas.toDataURL())
const first=await image()
await page.waitForTimeout(350)
assert.notEqual(await image(),first)
await page.evaluate(()=>document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$pinia._s.get('preferences').reducedMotion=true)
await page.waitForTimeout(100)
const staticImage=await image()
await page.waitForTimeout(350)
assert.equal(await image(),staticImage)
await page.emulateMedia({reducedMotion:'reduce'})
await page.evaluate(()=>document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$pinia._s.get('preferences').reducedMotion=false)
await page.waitForTimeout(100)
const explicit=await image()
await page.waitForTimeout(350)
assert.notEqual(await image(),explicit)
await page.getByRole('button',{name:'Activer le son du stade'}).click()
await page.waitForFunction(()=>window.__audios[0]?.state==='running')
const signal=await page.evaluate(async()=>{
  const context=window.__audios[0]
  const analyser=context.createAnalyser()
  context.__gains[0].connect(analyser)
  await new Promise(resolve=>setTimeout(resolve,150))
  const samples=new Float32Array(analyser.fftSize)
  analyser.getFloatTimeDomainData(samples)
  analyser.disconnect()
  return {rms:Math.sqrt(samples.reduce((sum,sample)=>sum+sample*sample,0)/samples.length),gain:context.__gains[0].gain.value}
})
assert.ok(signal.rms>0)
const volume=page.getByRole('slider',{name:'Volume'})
await volume.focus()
await page.keyboard.press('Home')
await page.waitForFunction(()=>window.__audios[0].__gains[0].gain.value===0)
await page.keyboard.press('End')
await page.waitForFunction(()=>window.__audios[0].__gains[0].gain.value===1)
await page.getByRole('button',{name:'Valider le placement'}).click()
await page.waitForTimeout(300)
await page.evaluate(()=>document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$pinia._s.get('match').celebratingTeam='teal')
await page.waitForTimeout(300)
assert.ok(await page.evaluate(()=>window.__audios[0].__gains[2].gain.value)>0)
for(let index=0;index<10;index++){
 await page.evaluate(()=>document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$pinia._s.get('match').isPaused=true)
 await page.waitForFunction(()=>window.__audios[0].state==='suspended')
 await page.evaluate(()=>document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$pinia._s.get('match').isPaused=false)
 await page.waitForFunction(()=>window.__audios[0].state==='running')
}
assert.equal(await page.evaluate(()=>window.__audios.length),1)
await page.waitForFunction(()=>window.__audios[0].__gains[2].gain.value===0)
await page.evaluate(()=>{
 window.__hidden=true
 Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__hidden})
 document.dispatchEvent(new Event('visibilitychange'))
})
await page.waitForFunction(()=>window.__audios[0].state==='suspended')
await page.evaluate(()=>{window.__hidden=false;document.dispatchEvent(new Event('visibilitychange'))})
await page.waitForFunction(()=>window.__audios[0].state==='running')
await page.waitForFunction(()=>window.__audios[0].__gains[2].gain.value===0)
await page.evaluate(()=>document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$pinia._s.get('match').celebratingTeam=null)
await page.evaluate(()=>{
 const store=document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$pinia._s.get('match')
 store.isAnimating=true
 store.match={...store.match,phase:'finished'}
})
await page.waitForTimeout(100)
assert.equal(await page.evaluate(()=>window.__audios[0].state),'running')
await page.evaluate(()=>document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$pinia._s.get('match').celebratingTeam='teal')
await page.waitForTimeout(250)
assert.ok(await page.evaluate(()=>window.__audios[0].__gains[2].gain.value)>0)
await page.evaluate(()=>{
 const store=document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$pinia._s.get('match')
 store.match={...store.match,phase:'playing'}
 store.celebratingTeam=null
 store.isAnimating=false
})
await page.getByRole('button',{name:'Couper le son du stade'}).click()
await page.waitForFunction(()=>window.__audios[0].state==='suspended')
await page.screenshot({path:'/tmp/dektivo-stadium-desktop.png'})
await page.setViewportSize({width:844,height:390})
await page.screenshot({path:'/tmp/dektivo-stadium-phone.png'})
const toolbar=await page.locator('.stadium-audio').boundingBox()
assert.ok(toolbar.x>=0&&toolbar.x+toolbar.width<=844)
const pitch=await page.locator('.match-screen__board').boundingBox()
assert.ok(pitch.y>=0&&pitch.y+pitch.height<=391)
await page.evaluate(()=>document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$router.push('/'))
await page.waitForFunction(()=>window.__audios[0].state==='closed')
assert.deepEqual(errors,[])
const failed=await browser.newPage({locale:'fr-FR'})
await failed.addInitScript(()=>{window.AudioContext=class { constructor(){throw new Error('unavailable')} }})
await failed.goto((process.env.STADIUM_URL || 'http://127.0.0.1:4178') + '/setup')
await failed.getByRole('button',{name:'Placer mes pièces'}).click()
await failed.getByRole('button',{name:'Activer le son du stade'}).click()
await failed.getByRole('status').filter({hasText:'Le son est indisponible'}).waitFor()
assert.ok(await failed.getByRole('button',{name:'Valider le placement'}).isEnabled())
const staticFallback=await browser.newPage({locale:'fr-FR'})
await staticFallback.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=()=>null})
await staticFallback.goto((process.env.STADIUM_URL || 'http://127.0.0.1:4178') + '/setup')
await staticFallback.getByRole('button',{name:'Placer mes pièces'}).click()
await staticFallback.locator('.stadium-crowd-static').waitFor()
assert.ok(await staticFallback.locator('.stadium-crowd-static circle').count()>200)
assert.equal(await staticFallback.locator('canvas').count(),0)
console.log(JSON.stringify({status:'passed',checks:['single canvas','animated frames','reduced-motion static','explicit motion override','silence before activation','actual nonzero audio samples','keyboard volume zero/full','public goal cheer','10 pause/resume cycles','visibility cancellation','no replayed cheer','mute','desktop and phone layout','dispose closes context','unsupported audio fallback'],signal,errors}))
await writeFile('/tmp/dektivo-browser-results.json',JSON.stringify({status:'passed',signal,errors},null,2))
await browser.close()

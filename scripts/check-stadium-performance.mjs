const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
import { writeFile } from 'node:fs/promises'
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),args:['--no-sandbox']})
const results=[]
for(const viewport of [{width:1280,height:800},{width:844,height:390}]){
 const page=await browser.newPage({viewport,locale:'fr-FR'})
 await page.goto((process.env.STADIUM_URL || 'http://127.0.0.1:4178') + '/setup')
 await page.getByRole('button',{name:'Placer mes pièces'}).click()
 await page.waitForSelector('canvas')
 const measurements={}
 for(const reduced of [true,false]){
  await page.evaluate(reduced=>{document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$pinia._s.get('preferences').reducedMotion=reduced},reduced)
  const measurement=await page.evaluate(()=>new Promise(resolve=>{
   const times=[];let previous;let start
   const tick=time=>{
    start??=time
    if(previous!==undefined)times.push(time-previous)
    previous=time
    if(time-start<60000)requestAnimationFrame(tick)
    else{times.sort((a,b)=>a-b);resolve({p95:times[Math.floor(times.length*.95)],frames:times.length})}
   }
   requestAnimationFrame(tick)
  }))
  measurements[reduced?'static':'animated']=measurement
  console.log(JSON.stringify({viewport,mode:reduced?'static':'animated',...measurement}))
 }
 results.push({viewport,...measurements,degradation:measurements.animated.p95/measurements.static.p95-1})
 await page.close()
}
await writeFile('/tmp/dektivo-performance.json',JSON.stringify(results,null,2))
console.log(JSON.stringify({results}))
await browser.close()

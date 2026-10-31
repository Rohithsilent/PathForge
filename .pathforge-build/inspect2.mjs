import { Presentation } from '@oai/artifact-tool';
try {const p=await Presentation.load('/run/media/rohith/Mine/chrome downloads/MJRP-PRC2 T22.pptx');console.log('slides',p.slides.items.length);const x=await p.inspect({kind:'slide,textbox,shape,table,chart',maxChars:3000});console.log(JSON.stringify(x).slice(0,4000));} catch(e){console.error(String(e)); process.exitCode=1;}

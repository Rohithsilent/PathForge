import fs from 'node:fs/promises';
import { Presentation } from '@oai/artifact-tool';
const p = await Presentation.load('/run/media/rohith/Mine/chrome downloads/MJRP-PRC2 T22.pptx');
console.log('slides',p.slides.items.length);
console.log((await p.inspect({kind:'slide,textbox,shape,table,chart',maxChars:10000})).slice(0,10000));
for (const i of [0,3,9,11,15,16,17,18,19,21,23]) {
  const b=await p.export({slide:p.slides.getItem(i),format:'png',scale:1});
  await fs.writeFile(`/tmp/pathforge-review/orig-${i+1}.png`,new Uint8Array(await b.arrayBuffer()));
}

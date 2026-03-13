const fs=require('fs'); const buf=fs.readFileSync('index.html'); const a=Buffer.from('</div>
        </div>'); const b=Buffer.from('</div>
            </div>
        </div>'); const i=buf.indexOf(a); if(i>=0){const out=Buffer.concat([buf.slice(0,i), b, buf.slice(i+a.length)]); fs.writeFileSync('index.html', out); console.log('Patched');} else console.log('Not found');
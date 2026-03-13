const fs=require("fs");
let h=fs.readFileSync("index.html","utf8");
const css='@media (max-width:767px){main{min-height:0;height:calc(100vh - 4rem)}.view-section:not(.hidden){position:absolute!important;top:3.5rem!important;left:0!important;right:0!important;bottom:0!important;min-height:auto!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch}}';
h=h.replace("body.login-page aside",css+"\n        body.login-page aside");
fs.writeFileSync("index.html",h);
console.log("ok");

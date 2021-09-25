exports.id=0,exports.modules={"./src/server/server.js":function(e,t,s){"use strict";s.r(t);var a=s("../build/contracts/FlightSuretyApp.json"),o=s("../build/contracts/FlightSuretyData.json"),n=s("./src/server/config.json"),r=s("web3"),l=s.n(r),i=s("express"),c=s.n(i);s("babel-polyfill");const d=s("body-parser");let u=n.localhost,h=new l.a(new l.a.providers.WebsocketProvider(u.url.replace("http","ws")));h.eth.defaultAccount=h.eth.accounts[0];let g=new h.eth.Contract(a.abi,u.appAddress);const f=new h.eth.Contract(o.abi,u.dataAddress);console.log(g.events);const p={oracles:[],flights:[],states:{0:"unknown",10:"on time",20:"late due to airline",30:"late due to weather",40:"late due to technical reason",50:"late due to other reason"},init:async function(e){g.events.OracleRegistered().on("data",e=>{const{event:t,returnValues:{indexes:s}}=e;console.log(`${t}: indexes ${s[0]} ${s[1]} ${s[2]}`)}).on("error",e=>{console.log(e)}),g.events.OracleRequest().on("error",e=>{console.log(e)}).on("data",async e=>{const{event:t,returnValues:{index:s,airline:a,flight:o,timestamp:n}}=e;console.log(`${t}: index ${s}, airline ${a}, flight ${o}, date ${n}`),await this.submitResponses(a,o,n)}),g.events.OracleReport().on("data",e=>{const{event:t,returnValues:{airline:s,flight:a,timestamp:o,status:n}}=e;console.log(`${t}: airline ${s}, flight ${a}, date ${o}, status ${this.states[n]}`)}),g.events.FlightStatusInfo().on("data",e=>{const{event:t,returnValues:{airline:s,flight:a,timestamp:o,status:n}}=e;console.log(`${t}: airline ${s}, flight ${a}, date ${o}, status ${this.states[n]}`)}).on("error",e=>{console.log(e)}),await f.methods.authorizeCaller(g._address),this.oracles=(await h.eth.getAccounts()).slice(10-e);const t=await g.methods.REGISTRATION_FEE().call();this.oracles.forEach(async e=>{try{await g.methods.registerOracle().send({from:e,value:t,gas:4712388,gasPrice:1e11})}catch(e){}})},submitResponses:async function(e,t,s){this.oracles.forEach(async a=>{const o=10*(Math.floor(5*Math.random())+1);(await g.methods.getMyIndexes().call({from:a})).forEach(async n=>{try{await g.methods.submitOracleResponse(n,e,t,s,o).send({from:a})}catch(e){}})})}};p.init(10);const m=c()();m.use(d.json()),m.use((function(e,t,s){t.header("Access-Control-Allow-Origin","*"),t.header("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept"),s()})),m.use(c.a.json()),m.get("/api",(e,t)=>{t.send({message:"An API for use with your Dapp!"})}),m.set("json spaces",2),m.get("/flights",(e,t)=>{t.json(p.flights)}),t.default=m}};
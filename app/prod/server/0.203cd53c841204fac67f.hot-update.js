exports.id=0,exports.modules={"./src/server/server.js":function(e,s,t){"use strict";t.r(s);var o=t("../build/contracts/FlightSuretyApp.json"),r=(t("../build/contracts/FlightSuretyData.json"),t("./src/server/config.json")),n=t("web3"),c=t.n(n),l=t("express"),a=t.n(l);let u=r.localhost,i=new c.a(new c.a.providers.WebsocketProvider(u.url.replace("http","ws")));i.eth.defaultAccount=i.eth.accounts[0];let p=new i.eth.Contract(o.abi,u.appAddress);console.log(p.events),p.events.OracleRequest({fromBlock:0},(function(e,s){e&&console.log(e),console.log(s)}));const d=a()();d.get("/api",(e,s)=>{s.send({message:"An API for use with your Dapp!"})}),s.default=d}};
import Vue from "vue";

var websock = null;
let rec; //재접속 타이머
let isConnect = false;
let wsurl = "";
let userToken = null;
let messageCallBack = null;
let openCallBack = null;
let closeCallBack = null;
let heartCallBack = null;
let reConnectCallBack = null;
let hasLogin = false;

let createWebSocket = (token) => {
	userToken = token;
	initWebSocket();
};

let initWebSocket = async () => {
	try {

		wsurl = await findWsUrl();

		hasLogin = false;
		websock = new WebSocket(wsurl);
		websock.onmessage = function(e) {
			let sendInfo = JSON.parse(e.data)
			if (sendInfo.cmd == 0) {
				hasLogin = true;
				heartCheck.start()
				openCallBack && openCallBack(wsurl);
			}
			else if(sendInfo.cmd==1){
				heartCallBack && heartCallBack(sendInfo);
				heartCheck.reset();
			} else {
				messageCallBack && messageCallBack(sendInfo.cmd,sendInfo.data)
			}
		}
		websock.onclose = function(e) {
			isConnect = false; 

			closeCallBack && closeCallBack(e);
			reConnect();
		}
		websock.onopen = function() {
			isConnect = true;
			let loginInfo = {
				cmd: 0,
				data: {token: userToken}
			};
			websock.send(JSON.stringify(loginInfo));
		}

		websock.onerror = function() {
			isConnect = false; 
			reConnect();
		}
	} catch (e) {
		// this.commit("connectorClose",e);
		reConnect(); 
	}
};

let findWsUrl = () =>{
	let url = null;
	return Vue.prototype.$http({
		url: `/connector/node?protocol=WS`,
		method: 'get'
	}).then((data) => {
		url ="ws://"+data.ip+":"+data.port+"/im";
		return Promise.resolve(url);
	})
}

let reConnect = () => {
	if (isConnect) return; 
	rec && clearTimeout(rec);
	rec = setTimeout(function() { 
		initWebSocket(wsurl);
		reConnectCallBack && reConnectCallBack();
	}, 1000);
};
let closeWebSocket = () => {
	websock.close();
};


var heartCheck = {
	timeout: 5000, 
	timeoutObj: null, 
	start: function() {
		if(isConnect){
			let heartBeat = {
				cmd: 1,
				data: {
					token: userToken
				}
			};
			websock.send(JSON.stringify(heartBeat))
		}
	},

	reset: function(){
		clearTimeout(this.timeoutObj);
		this.timeoutObj = setTimeout(function() {
			heartCheck.start();
		}, this.timeout);
		
	}
};



function sendMessage(agentData) {
	if (websock.readyState === websock.OPEN) {
		websock.send(JSON.stringify(agentData))
	} else if (websock.readyState === websock.CONNECTING) {
		setTimeout(function() {
			sendMessage(agentData)
		}, 1000)
	} else {
		setTimeout(function() {
			sendMessage(agentData)
		}, 1000)
	}
}


function onmessage(callback) {
	messageCallBack = callback;
}


function onopen(callback) {
	openCallBack = callback;
	if (hasLogin) {
		openCallBack();
	}
}

function onclose(callback) {
	closeCallBack = callback;
}
function onheart(callback) {
	heartCallBack = callback;
}

function onReConnect(callback) {
	reConnectCallBack = callback;
}


export {
	createWebSocket,
	closeWebSocket,
	sendMessage,
	onmessage,
	onopen,
	onheart,
	onclose,
	onReConnect
}

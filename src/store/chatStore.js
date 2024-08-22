import httpRequest from '../api/httpRequest.js'
import Vue from "vue";
export default {

	state: {
		activeIndex: -1,
		chats: []
	},

	method:{
		ifSameSession(s1,s2){
			return false;
		}
	},

	mutations: {
		initChatStore(state) {
			//state.activeIndex = -1;
		},
		openChat(state, chatInfo) {
			for (let i in state.chats) {
				if (state.chats[i].type === chatInfo.type &&
					state.chats[i].targetId === chatInfo.targetId && i===0) {
					// let newChat = state.chats[i];
					// 
					// state.chats.splice(i, 1);
					// state.chats.unshift(newChat);
					return;
				}
			}
			httpRequest({
				url: '/chatSession/save',
				method: 'post',
				data:{
					"targetId":chatInfo.targetId,
					"chatType":chatInfo.type
				}
			}).then((data) => {
				let tmpChat = {
					targetId: chatInfo.targetId,
					type: chatInfo.type,
					showName: chatInfo.showName,
					headImage: chatInfo.headImage,
					lastContent: "",
					lastSendTime: new Date().getTime(),
					unreadCount: 0,
					messages: [],
				};
				this.commit("chatUnshift",tmpChat);
			}).catch((err) => {
			});
		},

		chatUnshift(state,newChat){
			let activeChat = state.activeIndex>=0?state.chats[state.activeIndex]:null;
			let isNew = true;
			console.log("chatUnshift,newChat=",newChat,",state.chats=",state.chats)
			for (let i in state.chats) {
				if (state.chats[i].type === newChat.type &&
					state.chats[i].targetId === newChat.targetId) {
					if(i!==0){
						// return;
						let tmp = state.chats[i];
						state.chats[i]=state.chats[0];
						state.chats[0]=tmp;
					}
					isNew = false;
					break;
				}
			}
			if(isNew){
				state.chats.unshift(newChat);
			}
			state.activeIndex = 0;
		},
		activeChat(state, idx) {
			state.activeIndex = idx;
			state.chats[idx].unreadCount = 0;
		},
		removeChat(state, idx) {
			state.chats.splice(idx, 1);
			if (state.activeIndex >= state.chats.length) {
				state.activeIndex = state.chats.length - 1;
			}
		},
		removeGroupChat(state, groupId) {
			for (let idx in state.chats) {
				if (state.chats[idx].type == 'GROUP' &&
					state.chats[idx].targetId == groupId) {
					this.commit("removeChat", idx);
				}
			}
		},
		removePrivateChat(state, userId) {
			for (let idx in state.chats) {
				if (state.chats[idx].type == 'PRIVATE' &&
					state.chats[idx].targetId == userId) {
					this.commit("removeChat", idx);
				}
			}
		},
		insertHistoryMessage(state,messageObj){
			let messages = messageObj.messages;
			let chat = null;
			for (let idx in state.chats) {
				if (state.chats[idx].type == messageObj.chat.type &&
					state.chats[idx].targetId === messageObj.chat.targetId) {
					chat =  state.chats[idx];
					break;
				}
			}
			if(chat==null){
				console.error("insertHistoryMessage信息异常",messageObj);
				return;
			}

			messages.forEach(m => chat.messages.unshift(m));
		},



		insertMessage(state, msgInfo) {
			let type = msgInfo.groupId!=null ? 'GROUP' : 'PRIVATE';
			let targetId = msgInfo.groupId!=null ? msgInfo.groupId : msgInfo.selfSend ? msgInfo.recvId : msgInfo.sendId;
			let chat = null;
			for (let idx in state.chats) {
				if (state.chats[idx].type == type &&
					state.chats[idx].targetId === targetId) {
					chat = state.chats[idx];
					break;
				}
			}
			if(msgInfo.type == 1){
				chat.lastContent =  "[이미지]";
			}else if(msgInfo.type == 2){
				chat.lastContent = "[파일]";
			}else if(msgInfo.type == 3){
				chat.lastContent = "[음성]";
			}else{
				chat.lastContent =  msgInfo.content;
			}
			chat.lastSendTime = msgInfo.sendTime;
			chat.unreadCount++;
			if(msgInfo.selfSend){
				chat.unreadCount=0;
			}
			for (let idx in chat.messages) {
				if(msgInfo.id && chat.messages[idx].id == msgInfo.id){
					Object.assign(chat.messages[idx], msgInfo);
					return;
				}
				if(msgInfo.selfSend && chat.messages[idx].selfSend
				&& chat.messages[idx].sendTime == msgInfo.sendTime){
					Object.assign(chat.messages[idx], msgInfo);
					return;
				}
			}
			chat.messages.push(msgInfo);
			
		},
		deleteMessage(state, msgInfo){
			let type = msgInfo.groupId ? 'GROUP' : 'PRIVATE';
			let targetId = msgInfo.groupId ? msgInfo.groupId : msgInfo.selfSend ? msgInfo.recvId : msgInfo.sendId;
			let chat = null;
			for (let idx in state.chats) {
				if (state.chats[idx].type == type &&
					state.chats[idx].targetId === targetId) {
					chat = state.chats[idx];
					break;
				}
			}
			
			for (let idx in chat.messages) {
				if(chat.messages[idx].id && chat.messages[idx].id == msgInfo.id){
					chat.messages.splice(idx, 1);
					break;
				}
				if(msgInfo.selfSend && chat.messages[idx].selfSend 
				&&chat.messages[idx].sendTime == msgInfo.sendTime){
					chat.messages.splice(idx, 1);
					break;
				}
			}
		},
		updateChatFromFriend(state, friend) {
			for (let i in state.chats) {
				let chat = state.chats[i];
				if (chat.type=='PRIVATE' && chat.targetId == friend.id) {
					chat.headImage = friend.headImageThumb;
					chat.showName = friend.nickName;
					break;
				}
			}
		},
		updateChatFromGroup(state, group) {
			for (let i in state.chats) {
				let chat = state.chats[i];
				if (chat.type=='GROUP' && chat.targetId == group.id) {
					chat.headImage = group.headImageThumb;
					chat.showName = group.remark;
					break;
				}
			}
		},
		resetChatStore(state) {
			state.activeIndex = -1;
			state.chats = [];
		},
		resetMessageList(state,chatList) {

			Vue.set(state,'activeIndex', -1)
			Vue.set(state,'chats', chatList)
			if(chatList.length>0){
				Vue.set(state,'activeIndex', 0)
			}
		}
	},

}

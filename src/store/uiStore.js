export default {
	state: {
		userInfo: { 
			show: false,
			user: {},
			pos:{
				x:0,
				y:0
			}
		},
		fullImage: { 
			show: false,
			url: ""
		},
		chatPrivateVideo:{  
			show: false,
			master: false, 
			friend:{},
			offer:{}  
		},
		videoAcceptor:{ 
			show: false,
			
			friend:{}
		}
		
	},
	mutations: {
		resetStore(state) {
			state.userInfo={
				show: false,
					user: {},
				pos:{
					x:0,
						y:0
				}
			};
			state.fullImage={ 
				show: false,
					url: ""
			};
			state.chatPrivateVideo={  
				show: false,
					master: false, 
					friend:{},
				offer:{}  
			};
			state.videoAcceptor={ 
				show:false,

					friend:{}
			};
		},
		showUserInfoBox(state,user){
			state.userInfo.show = true;
			state.userInfo.user = user;
			
		},
		setUserInfoBoxPos(state,pos){
			let compontW = 300;
			let compontH = 200;
			let w =  document.documentElement.clientWidth;
			let h =  document.documentElement.clientHeight;
			let x = w/2-compontW/2;
			let y = h/2-compontH/2;
			if(x<0 || x>w){
				x = w/2;
			}
			if(y<0 || y>h){
				y = h/2;
			}

			state.userInfo.pos.x = x;
			state.userInfo.pos.y = y;
			// state.userInfo.pos.y = Math.min(pos.y,h-200);

		},
		closeUserInfoBox(state){
			state.userInfo.show = false;
		},
		showFullImageBox(state,url){
			state.fullImage.show = true;
			state.fullImage.url = url;
		},
		closeFullImageBox(state){
			state.fullImage.show = false;
		},
		showChatPrivateVideoBox(state,info){
			state.chatPrivateVideo.show = true;
			state.chatPrivateVideo.friend = info.friend;
			state.chatPrivateVideo.master = info.master;
			state.chatPrivateVideo.offer = info.offer;
		},
		closeChatPrivateVideoBox(state){
			state.chatPrivateVideo.show = false;
		},
		showVideoAcceptorBox(state,friend){
			state.videoAcceptor.show = true;
			state.videoAcceptor.friend = friend;
			
		},
		closeVideoAcceptorBox(state){
			state.videoAcceptor.show = false;
		}
	}
}
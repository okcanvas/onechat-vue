import httpRequest from '../api/httpRequest.js'

export default {

	state: {
		friends: [],
		activeIndex: -1,
		timer: null
	},
	mutations: {
		initFriendStore(state) {
			httpRequest({
				url: '/friend/list',
				method: 'get'
			}).then((friends) => {
				this.commit("setFriends",friends);
				this.commit("refreshOnlineStatus");
			})
		},
		resetStore(state) {
			state.friends=[];
			state.activeIndex=-1;
			state.timer=null
		},

		setFriends(state, friends) {
			state.friends = friends;
		},
		updateFriend(state,friend){
			state.friends.forEach((f,index)=>{
				if(f.id==friend.id){
					let online = state.friends[index].online;
					Object.assign(state.friends[index], friend);
					state.friends[index].online =online;
				}
			})
		},
		activeFriend(state, index) {
			state.activeIndex = index;
		},
		removeFriend(state, index) {
			state.friends.splice(index, 1);
			if(state.activeIndex  >= state.friends.length){
				state.activeIndex = state.friends.length-1;
			}
		},
		addFriend(state, friend) {
			state.friends.push(friend);
		},
		refreshOnlineStatus(state){
			let userIds = [];
			if(state.friends.length ==0){
				return; 
			}
			state.friends.forEach((f)=>{userIds.push(f.id)});
			httpRequest({
				url: '/user/online',
				method: 'get',
				params: {userIds: userIds.join(',')}
			}).then((onlineIds) => {
				this.commit("setOnlineStatus",onlineIds);
			})
			
			clearTimeout(state.timer);
			state.timer = setTimeout(()=>{
				this.commit("refreshOnlineStatus");
			},30000)
		},
		setOnlineStatus(state,onlineIds){
			state.friends.forEach((f)=>{
				let onlineFriend = onlineIds.find((id)=> f.id==id);
				f.online = onlineFriend != undefined;
			});
			
			let activeFriend = state.friends[state.activeIndex];
			state.friends.sort((f1,f2)=>{
				if(f1.online&&!f2.online){
					return -1;
				}
				if(f2.online&&!f1.online){
					return 1;
				}
				return 0;
			});
			
			if(state.activeIndex >=0){
				state.friends.forEach((f,i)=>{
					if(f.id == activeFriend.id){
						state.activeIndex = i;
					}
				})
			}
		}
		
	}
}

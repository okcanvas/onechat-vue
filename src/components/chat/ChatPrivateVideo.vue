<template>
	<el-dialog v-dialogDrag :title="title"  top="5vh"
	 :close-on-click-modal="false"
	 :close-on-press-escape="false"
	:visible.sync="visible" width="50%" height="70%" :before-close="handleClose">
		<div class="chat-video">
			<div class="chat-video-box">
				<div class="chat-video-friend" v-loading="loading" element-loading-text="대기중..." element-loading-spinner="el-icon-loading"
				 element-loading-background="rgba(0, 0, 0, 0.5)">
					<head-image class="friend-head-image" :id="this.friend.id" :size="80" :url="this.friend.headImage"></head-image>
					<video ref="friendVideo" autoplay=""></video>
				</div>
				<div class="chat-video-mine">
					<video  ref="mineVideo" autoplay=""></video>
				</div>
			</div>
			<div class="chat-video-controllbar">
				<div v-show="state=='CONNECTING'" title="연결중" class="icon iconfont icon-phone-reject reject" style="color: red;"
				 @click="cancel()"></div>
				<div v-show="state=='CONNECTED'" title="연경됨" class="icon iconfont icon-phone-reject reject" style="color: red;"
				 @click="handup()"></div>
			</div>
		</div>
	</el-dialog>

</template>

<script>
	import HeadImage from '../common/HeadImage.vue';
	
	export default {
		name: 'chatVideo',
		components: {HeadImage},
		props: {
			visible: {
				type: Boolean
			},
			friend: {
				type: Object
			},
			master: {
				type: Boolean
			},
			offer: {
				type: Object
			}
		},
		data() {
			return {
				stream: null,
				audio: new Audio(),
				loading: false,
				peerConnection: null,
				videoTime: 0,
				videoTimer: null,
				state: 'NOT_CONNECTED',
				candidates: [],
				configuration: {
					iceServers: []
				}
			}
		},
		methods: {
			init() {
				if (!this.hasUserMedia() || !this.hasRTCPeerConnection()) {
					this.$message.error("브라우저가 WebRTC를 지원하지 않습니다");
					if (!this.master) {
						this.sendFailed("상대 브라우저가 WebRTC를 지원하지 않음")
					}
					return;
				}
				this.openCamera((stream) => {
					this.setupPeerConnection(stream);
					if (this.master) {
						this.call();
					} else {
						this.accept(this.offer);
					}
				});
			},
			openCamera(callback) {
				navigator.getUserMedia({
						video: true,
						audio: true
					},
					(stream) => {
						this.stream = stream;
						this.$refs.mineVideo.srcObject = stream;
						this.$refs.mineVideo.muted = true;
						callback(stream)
					},
					(error) => {
						this.$message.error("카메라 연결오류:" + error);
						callback()
					});
			},
			closeCamera() {
				if (this.stream) {
					this.stream.getTracks().forEach((track) => {
						track.stop();
					});
					this.$refs.mineVideo.srcObject = null;
					this.stream = null;
				}

			},
			setupPeerConnection(stream) {
				this.peerConnection = new RTCPeerConnection(this.configuration);
				this.peerConnection.ontrack = (e) => {
					this.$refs.friendVideo.srcObject = e.streams[0];
				};
				this.peerConnection.onicecandidate = (event) => {
					if (event.candidate) {
						if (this.state == 'CONNECTED') {
							this.sendCandidate(event.candidate);
						} else {
							this.candidates.push(event.candidate)
						}
					}
				}
				if (stream) {
					stream.getTracks().forEach((track) => {
						this.peerConnection.addTrack(track, stream);
					});
				}
				this.peerConnection.oniceconnectionstatechange = (event) => {
					let state = event.target.iceConnectionState;
					if(state == 'connected'){
						this.resetTime();
					}
				};

			},
			handleMessage(msg) {
				if (msg.type == this.$enums.MESSAGE_TYPE.RTC_ACCEPT) {
					this.peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(msg.content)));
					this.loading = false;
					this.state = 'CONNECTED';
					this.audio.pause();
					this.candidates.forEach((candidate) => {
						this.sendCandidate(candidate);
					})
				}
				else if (msg.type == this.$enums.MESSAGE_TYPE.RTC_REJECT) {
					this.$message.error("상대방이 요청을 거절했습니다");
					this.close();
				}
				else if (msg.type == this.$enums.MESSAGE_TYPE.RTC_FAILED) {
					this.$message.error(msg.content)
					this.close();
				}
				else if (msg.type == this.$enums.MESSAGE_TYPE.RTC_CANDIDATE) {
					this.peerConnection.addIceCandidate(new RTCIceCandidate(JSON.parse(msg.content)));
				}
				else if (msg.type == this.$enums.MESSAGE_TYPE.RTC_HANDUP) {
					this.$message.success("상대방이 영상통화를 종료하였습니다.");
					this.close();
				}
			},
			call() {
				this.peerConnection.createOffer((offer) => {
						this.peerConnection.setLocalDescription(offer);
						this.$http({
							url: `/webrtc/private/call?uid=${this.friend.id}`,
							method: 'post',
							data: JSON.stringify(offer)
						}).then(() => {
							this.loading = true;
							this.state = 'CONNECTING';
							this.audio.play();
						});
					},
					(error) => {
						this.$message.error(error);
					});

			},
			accept(offer) {
				this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
				this.peerConnection.createAnswer((answer) => {
						this.peerConnection.setLocalDescription(answer);
						this.$http({
							url: `/webrtc/private/accept?uid=${this.friend.id}`,
							method: 'post',
							data: JSON.stringify(answer)
						})
						this.state = 'CONNECTED';
					},
					(error) => {
						this.$message.error(error);
					});

			},
			handup() {
				this.$http({
					url: `/webrtc/private/handup?uid=${this.friend.id}`,
					method: 'post'
				})
				this.close();
				this.$message.success("성공")
			},
			cancel() {
				this.$http({
					url: `/webrtc/private/cancel?uid=${this.friend.id}`,
					method: 'post'
				})
				this.close();
				this.$message.success("취소")
			},
			sendFailed(reason) {
				this.$http({
					url: `/webrtc/private/failed?uid=${this.friend.id}&reason=${reason}`,
					method: 'post'
				})
			},
			sendCandidate(candidate) {
				this.$http({
					url: `/webrtc/private/candidate?uid=${this.friend.id}`,
					method: 'post',
					data: JSON.stringify(candidate)
				})
			},
			close() {
				this.$emit("close");
				this.closeCamera();
				this.loading = false;
				this.state = 'NOT_CONNECTED';
				this.videoTime = 0;
				this.videoTimer && clearInterval(this.videoTimer);
				this.audio.pause();
				this.candidates = [];
				this.$store.commit("setUserState", this.$enums.USER_STATE.FREE);
				this.$refs.friendVideo.srcObject = null;
				this.peerConnection.close();
				this.peerConnection.onicecandidate = null;
				this.peerConnection.onaddstream = null;
			},
			resetTime(){
				this.videoTime = 0;
				this.videoTimer && clearInterval(this.videoTimer);
				this.videoTimer = setInterval(()=>{
					this.videoTime++;
				},1000)
			},
			handleClose() {
				if (this.state == 'CONNECTED') {
					this.handup()
				} else if (this.state == 'CONNECTING') {
					this.cancel();
				} else {
					this.close();
				}
			},
			hasUserMedia() {
				navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
					navigator.msGetUserMedia;
				return !!navigator.getUserMedia;
			},
			hasRTCPeerConnection() {
				window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
				window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
				window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
				return !!window.RTCPeerConnection;
			},
			initAudio(){
				let url = require(`@/assets/audio/call.wav`);
				this.audio.src = url;
				this.audio.loop = true;
			},
			initICEServers(){
				this.$http({
					url: '/webrtc/private/iceservers',
					method: 'get'
				}).then((servers) => {
					this.configuration.iceServers = servers;
				})
			}
			
		},
		watch: {
			visible: {
				handler(newValue, oldValue) {
					if (newValue) {
						this.init();
						this.$store.commit("setUserState", this.$enums.USER_STATE.BUSY);
					}
				}
			}
		},
		computed: {
			title() {
				let strTitle  = `화상채팅-${this.friend.nickName}`;
				if(this.state == 'CONNECTED'){
					strTitle += `(${this.currentTime})`;
				}else if(this.state == 'CONNECTING'){
					strTitle += `(연결중)`;
				}
				return strTitle;
			},
			currentTime(){
				let currentTime = 0;
				if(this.state == 'CONNECTED' && this.videoTime){
					 currentTime = Math.floor(this.videoTime);
				}
				let min = Math.floor(currentTime/60);
				let sec = currentTime%60;
				let strTime = min<10?"0":"";
				strTime += min;
				strTime += ":"
				strTime += sec<10?"0":"";
				strTime += sec;
				return strTime;
			}
		},
		mounted() {
			this.initAudio();
			this.initICEServers();
		}
	}
</script>

<style lang="scss" scoped>
	.chat-video {
		position: relative;
		
		.chat-video-box {
			position: relative;
			border: #4880b9 solid 1px;
			background-color: #eeeeee;
			
			.chat-video-friend {
				height: 70vh;
				.friend-head-image {
					position: absolute;
				}

				video {
					width: 100%;
					height: 100%;
					object-fit: fill;
				}
			}

			.chat-video-mine {
				position: absolute;
				z-index: 99999;
				width: 25vh;
				right: 0;
				bottom: 0;
				box-shadow: 0px 0px  5px #ccc;	
				background-color: #cccccc;
				video {
					width: 100%;
				}
			}
		}

		.chat-video-controllbar {
			display: flex;
			justify-content: space-around;
			padding: 10px;

			.icon {
				font-size: 50px;
				cursor: pointer;
			}
		}
	}
</style>

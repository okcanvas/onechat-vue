<template>
	<el-dialog class="chat-voice" :visible.sync="visible" width="600px" :before-close="handleClose">
		<div v-show="mode=='RECORD'">
			<div class="chat-voice-tip">{{stateTip}}</div>
      <br/>
		</div>
		<audio v-show="mode=='PLAY'" :src="url" controls ref="audio" @ended="handleStopAudio()"></audio>
    <el-progress :percentage="time_percentge" :text-inside="false" :stroke-width="16" :format="format"></el-progress>
		<el-divider content-position="center"></el-divider>
		<el-row class="chat-voice-btn-group">
			<el-button round type="primary" v-show="state=='STOP'" @click="handleStartRecord()">녹음시작</el-button>
			<el-button round type="warning" v-show="state=='RUNNING'" @click="handlePauseRecord()">일시정지</el-button>
			<el-button round type="primary" v-show="state=='PAUSE'" @click="handleResumeRecord()">재시작</el-button>
			<el-button round type="danger" v-show="state=='RUNNING'||state=='PAUSE'" @click="handleCompleteRecord()">
				녹음종료</el-button>
			<el-button round type="success" v-show="state=='COMPLETE' && mode!='PLAY'" @click="handlePlayAudio()">재생
			</el-button>
			<el-button round type="warning" v-show="state=='COMPLETE' && mode=='PLAY'" @click="handleStopAudio()">정지
			</el-button>
			<el-button round type="primary" v-show="state=='COMPLETE'" @click="handleRestartRecord()">재녹음</el-button>
			<el-button round type="primary" v-show="state=='COMPLETE'" @click="handleSendRecord()">전송</el-button>
		</el-row>
	</el-dialog>

</template>

<script>
	import Recorder from 'js-audio-recorder';

	export default {
		name: 'chatVoice',
		props: {
			visible: {
				type: Boolean
			}
		},
		data() {
			return {
				rc: new Recorder(),
				audio: new Audio(),
				state: 'STOP', // STOP、RUNNING、PAUSE、COMPLETE
				stateTip: "종료됨",
				mode: 'RECORD', // RECORD 、PLAY
				duration: 0,
				url: ""
			}
		},
    computed:{
      time_percentge() {
        return parseInt(this.rc.duration)%100;
      }
    },
		methods: {
      format(percentage) {
        return parseInt(this.rc.duration)+"s";
      },
			handleClose() {
				this.rc.destroy();
				this.rc = new Recorder();
				this.audio.pause();
				this.mode = 'RECORD';
				this.state = 'STOP';
				this.stateTip = '종료됨';
				this.$emit("close");
			},
			handleStartRecord() {
				this.rc.start().then((stream) => {
					this.state = 'RUNNING';
					this.stateTip = "녹음중...";
				}).catch(error => {
					this.$message.error(error);
				});


			},
			handlePauseRecord() {
				this.rc.pause();
				this.state = 'PAUSE';
				this.stateTip = "일시정지";
			},
			handleResumeRecord() {
				this.rc.resume();
				this.state = 'RUNNING';
				this.stateTip = "재시작...";
			},
			handleCompleteRecord() {
				this.rc.pause();
				this.state = 'COMPLETE';
				this.stateTip = "완료";
			},
			handlePlayAudio() {
				let wav = this.rc.getWAVBlob();
				let url = URL.createObjectURL(wav);
				this.$refs.audio.src = url;
				this.$refs.audio.play();
				this.mode = 'PLAY';
			},
			handleStopAudio() {
				this.$refs.audio.pause();
				this.mode = 'RECORD';
			},
			handleRestartRecord() {
				this.rc.destroy();
				this.rc = new Recorder()
				this.rc.start();
				this.state = 'RUNNING';
				this.mode = 'RECORD';
				this.stateTip = "재시작...";
			},
			handleSendRecord() {
				let wav = this.rc.getWAVBlob();
				let name = new Date().getDate() + '.wav';
				var formData = new window.FormData()
				formData.append('file', wav, name);
				this.$http({
					url: '/file/upload',
					data: formData,
					method: 'post',
					headers: {
						'Content-Type': 'multipart/form-data'
					}
				}).then((url) => {
					let data = {
						duration: parseInt(this.rc.duration),
						url: url
					}
					this.$emit("send", data);
					this.handleClose();
				})
			}
		}

	}
</script>

<style lang="scss">
	.chat-voice {

		.chat-voice-tip {
			font-size: 18px;
		}

		.chat-voice-btn-group {
			margin-bottom: 20px;
		}
	}
</style>

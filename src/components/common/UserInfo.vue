<template>
	<div id="user-info-maskId" class="user-info-mask" @click="$emit('close')">
		<div class="user-info"  :style="{left: pos.x+'px',top: pos.y+'px'}" @click.stop>
			<div class="user-info-box">
				<div class="avatar">
					<head-image :url="user.headImageThumb" :size="60" @click.native="showFullImage()"> </head-image>
				</div>
				<div>
					<el-descriptions :column="1" :title="user.userName" class="user-info-items">
						<el-descriptions-item label="닉네임">{{ user.nickName }}
						</el-descriptions-item>
						<el-descriptions-item label="소개">{{ user.signature }}
						</el-descriptions-item>
					</el-descriptions>
				</div>
				
			</div>
			<el-divider content-position="center"></el-divider>
			<div class="user-btn-group">
				<el-button v-show="isFriend" type="primary" @click="handleSendMessage()">전송</el-button>
				<el-button v-show="!isFriend" type="primary" @click="handleAddFriend()">친구추가</el-button>
			</div>
		</div>
	</div>
</template>

<script>
	import HeadImage from './HeadImage.vue'

	export default {
		name: "userInfo",
		components: {
			HeadImage
		},
		data() {
			return {
	
			}
		},
		props: {
			user: {
				type: Object
			},
			pos: {
				type: Object
			}
		},
		methods: {
			handleSendMessage() {
				let user = this.user;
				let chat = {
					type: 'PRIVATE',
					targetId: user.id,
					showName: user.nickName,
					headImage: user.headImage,
				};
				this.$store.commit("openChat", chat);
				this.$store.commit("activeChat", 0);
				if (this.$route.path != "/home/chat") {
					this.$router.push("/home/chat");
				}
				this.$emit("close");
			},
			handleAddFriend() {
				this.$http({
					url: "/friend/add",
					method: "post",
					params: {
						friendId: this.user.id
					}
				}).then((data) => {
					this.$message.success("추가됨");
					let friend = {
						id: this.user.id,
						nickName: this.user.nickName,
						headImage: this.user.headImageThumb,
						online: this.user.online
					}
					this.$store.commit("addFriend", friend);
				})
			},
			showFullImage(){
				if(this.user.headImage){
					this.$store.commit("showFullImageBox",this.user.headImage);
				}
			}
		},
		computed: {
			isFriend() {
				let friends = this.$store.state.friendStore.friends;
				let friend = friends.find((f) => f.id == this.user.id);
				return friend != undefined;
			}
		}
	}
</script>

<style lang="scss">
	.user-info-mask {
		background-color: rgba($color: #000000, $alpha: 0);
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.user-info {
		position: absolute;
		width: 300px;
		background-color: white;
		border: #dddddd solid 1px;
		border-radius: 5px;
		padding: 15px;

		.user-info-box {
			display: flex;

			.user-info-items {
				margin-left: 10px;
				white-space: nowrap;
				overflow: hidden;
				.el-descriptions__header { 
					margin-bottom: 5px;
				}
				
				.el-descriptions__title {
					font-size: 20px;
				}
				
				.el-descriptions-item__cell {
					padding-bottom: 1px;
				}
			}
		}

		.user-btn-group {
			text-align: center;
		}
	}
</style>

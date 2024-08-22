<template>
	<el-dialog class="setting" title="설정" :visible.sync="visible"  width="500px" :before-close="handleClose">
		<el-form :model="userInfo" label-width="80px" :rules="rules" ref="settingForm">
			<el-form-item label="아바타">
				<file-upload  class="avatar-uploader"
				:action="imageAction" 
				:showLoading="true"
				:maxSize="maxSize"  
				@success="handleUploadSuccess"
				
				:fileTypes="['image/jpeg', 'image/png', 'image/jpg','image/webp']">
					<img v-if="userInfo.headImage" :src="userInfo.headImage" class="avatar">
					<i v-else class="el-icon-plus avatar-uploader-icon"></i>
				</file-upload>
			</el-form-item>
			<el-form-item label="이름">
				<el-input disabled v-model="userInfo.userName" autocomplete="off"></el-input>
			</el-form-item>
			<el-form-item prop="nickName" label="닉네임">
				<el-input v-model="userInfo.nickName" autocomplete="off"></el-input>
			</el-form-item>
			<el-form-item label="성별">
				<el-radio-group v-model="userInfo.sex">
					<el-radio :label="0">남</el-radio>
					<el-radio :label="1">여</el-radio>
				</el-radio-group>
			</el-form-item>
			<el-form-item label="소개">
				<el-input type="textarea" v-model="userInfo.signature"></el-input>
			</el-form-item>
		</el-form>

		<span slot="footer" class="dialog-footer">
			<el-button @click="handleClose()">닫기</el-button>
			<el-button type="primary" @click="handleSubmit()">확인</el-button>
		</span>
	</el-dialog>
</template>

<script>
	import HeadImage from "../common/HeadImage.vue";
	import FileUpload from "../common/FileUpload.vue";
	
	export default {
		name: "setting",
		components: {
			HeadImage,
			FileUpload
		},
		data() {
			return {
				userInfo: {

				},
				maxSize: 5*1024*1024,
				action: "/image/upload",
				rules: {
					nickName: [{
						required: true,
						message: '닉네임',
						trigger: 'blur'
					}]
				}
			}
		},
		methods: {

			handleClose() {
				this.$emit("close");
			},
			handleSubmit() {
				this.$refs['settingForm'].validate((valid) => {
					if (!valid) {
						return false;
					}
					this.$http({
						url: "/user/update",
						method: "put",
						data: this.userInfo
					}).then(()=>{
						this.$store.commit("setUserInfo",this.userInfo);
						this.$emit("close");
						this.$message.success("성공");
					})	
				});
			},
			handleUploadSuccess(res, file) {
				this.userInfo.headImage = res.data.originUrl;
				this.userInfo.headImageThumb = res.data.thumbUrl;
			}
		},
		props: {
			visible: {
				type: Boolean
			}
		},
		computed:{
			imageAction(){
				return `${process.env.VUE_APP_BASE_API}/image/upload`;
			}
		},
		watch: {
			visible: function(newData, oldData) {
				let mine = this.$store.state.userStore.userInfo;
				this.userInfo = JSON.parse(JSON.stringify(mine));
			}
		}
	}
</script>

<style lang="scss" >
	.setting {
		.avatar-uploader {
			
			.el-upload {
				border: 1px dashed #d9d9d9 !important;
				border-radius: 6px;
				cursor: pointer;
				position: relative;
				overflow: hidden;
			}

			.el-upload:hover {
				border-color: #409EFF;
			}

			.avatar-uploader-icon {
				font-size: 28px;
				color: #8c939d;
				width: 178px;
				height: 178px;
				line-height: 178px;
				text-align: center;
			}

			.avatar {
				width: 178px;
				height: 178px;
				display: block;
			}
		}
	}
</style>

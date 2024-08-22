<template>
	<el-container class="register-view">
		<div>
			
			<el-form :model="registerForm" status-icon :rules="rules" ref="registerForm" label-width="80px" class="web-ruleForm">
				<div class="register-brand">가입을 환영합니다</div>
				<el-form-item label="이름" prop="userName">
					<el-input type="userName" v-model="registerForm.userName" placeholder="" autocomplete="off"></el-input>
				</el-form-item>
				<el-form-item label="닉네임" prop="nickName">
					<el-input type="nickName" v-model="registerForm.nickName" placeholder="" autocomplete="off"></el-input>
				</el-form-item>
				<el-form-item label="비밀번호" prop="password">
					<el-input type="password" v-model="registerForm.password" placeholder="" autocomplete="off"></el-input>
				</el-form-item>
				<el-form-item label="재입력" prop="confirmPassword">
					<el-input type="password" v-model="registerForm.confirmPassword" placeholder="" autocomplete="off"></el-input>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" @click="submitForm('registerForm')">등록</el-button>
					<el-button @click="resetForm('registerForm')">초기화</el-button>
				</el-form-item>
				<div class="to-login">
					<router-link to="/login">로그임</router-link>
				</div>
			</el-form>
		</div>
	</el-container>
</template>

<script>
	export default {
		name: "login",
		data() {
			var checkUserName = (rule, value, callback) => {
				if (!value) {
					return callback(new Error('이름입력'));
				}
				callback();
			};
			var checkNickName = (rule, value, callback) => {
				if (!value) {
					return callback(new Error('닉네임입력'));
				}
				callback();
			};
			var checkPassword = (rule, value, callback) => {
				if (value === '') {
					return callback(new Error('비밀번호'));
				}
				callback();
			};

			var checkConfirmPassword = (rule, value, callback) => {
				if (value === '') {
					return callback(new Error('비밀번호'));
				}
				if (value != this.registerForm.password) {
					return callback(new Error('비밀번호가다름'));
				}
				callback();
			};


			return {
				registerForm: {
					userName: '',
					nickName: '',
					password: '',
					confirmPassword: ''
				},
				rules: {
					userName: [{
						validator: checkUserName,
						trigger: 'blur'
					}],
					nickName: [{
						validator: checkNickName,
						trigger: 'blur'
					}],
					password: [{
						validator: checkPassword,
						trigger: 'blur'
					}],
					confirmPassword: [{
						validator: checkConfirmPassword,
						trigger: 'blur'
					}]
				}
			};
		},
		methods: {
			submitForm(formName) {
				this.$refs[formName].validate((valid) => {
					if (valid) {
						this.$http({
								url: "/register",
								method: 'post',
								data: this.registerForm
							})
							.then((data) => {
								this.$message.success("성공!");
                this.$router.push("/login");
							}).catch((err) => {
                this.$message.error("실폐!",err);
            });
					}
				});
			},
			resetForm(formName) {
				this.$refs[formName].resetFields();
			}
		}
	}
</script>

<style scoped lang="scss">
	.register-view {
		position: fixed;
		display: flex;
		justify-content: space-around;
		width: 100%;
		height: 100%;
		background: #466368;
    background-image: url(~@/assets/images/b3.jpg);
		background-size: cover;
		-webkit-user-select: none;
		background-size: cover;
		
		
		.web-ruleForm {
			width: 500px;
			height: 430px;
			padding: 20px;
			margin-top: 100px ;
			background: rgba(255,255,255,.75);
			box-shadow: 0px 0px  1px #ccc;
			border-radius: 3px;
			overflow: hidden;
			
			.register-brand {
				line-height: 50px;
				margin: 20px 0 30px 0;
				font-size: 22px;
				font-weight: 600;
				letter-spacing: 2px;
				text-align: center;
				text-transform: uppercase;
			}
			
			.to-login {
				display: flex;
				flex-direction: row-reverse;
				line-height: 40px;
				text-align: left;
				padding-left: 20px;
			}
		}
	}

	

	
</style>

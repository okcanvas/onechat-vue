<template>
	<div class="login-view"  >
			<el-form :model="loginForm"  status-icon :rules="rules" ref="loginForm"
               label-width="80px" class="web-ruleForm" @keyup.enter.native="submitForm('loginForm')">
				<div class="login-brand">onechat</div>
        <div style="text-align: center;">
          <a class="login-link" title="Gitee" @click="oauth2LoginHandler('GITEE')">
            <i class="operate-icon icon-gitee" />
            <p style="line-height: 20px;">Gitee</p>
          </a>
          <a class="login-link" title="Github" @click="oauth2LoginHandler('GITHUB')">
            <i class="operate-icon icon-github" />
            <p style="line-height: 20px;">Github</p>
          </a>
        </div>


        <div style="line-height: 40px;text-align: center;margin-top: 20px;">
          <el-button title="익명 모드에서는 일반 모드와 데이터 연결이 되지 않습니다" class="anonymousLoginButton" @click="anonymousLogin()">
            <i class="class-anonymous-button-icon"></i>
            <b>익명 로그인(공식 추천)</b>
          </el-button>
        </div>
			</el-form>
			
	</div>
</template>

<script>

import FingerprintJS from '@fingerprintjs/fingerprintjs'

	export default {
		name: "login",
		data() {
			var checkUsername = (rule, value, callback) => {
				if (!value) {
					return callback(new Error('아이디를 입력해주세요'));
				}
				callback();
			};
			var checkPassword = (rule, value, callback) => {
				if (value === '') {
					callback(new Error('비밀번호를 입력해 주세요.'));
				}
				callback();

			};
			return {
				loginForm: {
					userName: '',
					password: ''
				},
				rules: {
					userName: [{
						validator: checkUsername,
						trigger: 'blur'
					}],
					password: [{
						validator: checkPassword,
						trigger: 'blur'
					}]
				}
			};
		},
		methods: {
      anonymousLogin(){
        FingerprintJS.load().then(fp => {
              // The FingerprintJS agent is ready.
              // Get a visitor identifier when you'd like to.
              fp.get().then(result => {
                // This is the visitor identifier:
                const visitorId = result.visitorId;
                this.$http({
                  url: "/anonymousLogin",
                  method: 'post',
                  data: {
                    "anonymouId":visitorId
                  }
                }).then((data) => {
                      this.successLogin(data);
                    }).catch((err) => {
                  this.$message.error("error!",err);
                });
              });
        });
      },
      oauth2LoginHandler(type){
        this.$http({
          url: "/connect/login/web/"+type,
          method: 'get',
        }).then((data) => {
          window.open(data,"_self");
        }).catch((err) => {
          this.$message.error("error!",err);
        });
      },
			submitForm(formName) {
				this.$refs[formName].validate((valid) => {
					if (valid) {
						this.$http({
								url: "/login",
								method: 'post',
								data: this.loginForm
							})
							.then((data) => {
								this.successLogin(data);
							}).catch((err) => {
              this.$message.error("error!",err);
            });

					}
				});
			},
      successLogin(data){
        this.setCookie('username',this.loginForm.userName);
        sessionStorage.setItem("accessToken",data.accessToken);
        sessionStorage.setItem("refreshToken",data.refreshToken);
        this.$message.success("success");
        this.$router.push({path:"/home/chat",query:{"reload":'1'}});
      },
			resetForm(formName) {
				this.$refs[formName].resetFields();
			},
			getCookie(name) {
				let reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
				let arr = document.cookie.match(reg)
			    if (arr){
					 return unescape(arr[2]);
				}
			    return '';
			 },
			 setCookie (name, value, expiredays) {
			    var exdate = new Date();
			    exdate.setDate(exdate.getDate() + expiredays);
			    document.cookie = name + "=" + escape(value) + ((expiredays == null) ? "" : ";expires=" + exdate.toGMTString());
			  },
			  delCookie (name) {
			    var exp = new Date();
			    exp.setTime(exp.getTime() - 1);
			    var cval = this.getCookie(name);
			    if (cval != null){
					document.cookie = name + "=" + cval + ";expires=" + exp.toGMTString();
				}
			  }
		},
		mounted() {
      var usernameCache = this.getCookie("username");
      if(usernameCache!=null & usernameCache.trim()!==''){
        this.loginForm.userName =usernameCache;
      }
		},
	}
</script>

<style scoped lang="scss">
	.login-view {
		position: relative;
		display: flex;
		justify-content: space-around;
		width: 100%;
		height: 100%;
    /*
    background-image: url(~@/assets/images/b3.jpg);
		background-size: cover;
    */
		
		.web-ruleForm {
			height: 340px;
      width: 380px;
			padding: 20px;
			margin-top: 180px ;
			background: rgba(255,255,255,.75);
			box-shadow: 0px 0px  1px #ccc;
			border-radius: 5px;
			overflow: hidden;
	
			
			.login-brand {
				line-height: 50px;
				margin: 30px 0 40px 0;
				font-size: 22px;
				font-weight: 600;
				letter-spacing: 2px;
				text-transform: uppercase;
				text-align: center;
        cursor: pointer;
        font-family: cursive;
        &:hover {
          animation: change 2s ease-in-out 0s 1 alternate forwards;
          @keyframes change {
            0% {
              color: rgba(25,55,515,0.2)
            }
            30%{
              color:rgba(215,55,25,0.3)
            }
            50% {
              color: rgba(25,25,255,0.5)
            }
            80% {
              color: rgba(255,255,5,0.8)
            }
            100% {color: rgba(2,255,255,1);}
          }
        }
			}
			
			.register {
        position: relative;
        float: right;
        flex-direction: row-reverse;
        line-height: 40px;
			}
      .anonymousLoginButton{
        background-color: #8847e2;
        color: rgb(95 255 1 / 98%);
        vertical-align:middle;
        &:hover {
          background-color: #4a414ad9;
        }
      }
      .class-anonymous-button-icon{
        vertical-align:middle;
        display: inline-block;
        width: 15px;
        height: 15px;
        margin-right: 10px;
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
        background-image: url('~@/assets/icons/2.svg');
      }
		}
	}

  .operate-icon {
    display: inline-block;
    width: 48px;
    height: 48px;
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
    vertical-align:middle;
    cursor:pointer;
  }
  .icon-github {
    background-image: url('~@/assets/icons/github.png');
  }
  .icon-gitee {
    background-image: url('~@/assets/icons/gitee.png');
  }
  .login-link{
    display: inline-block;
    padding: 10px;
    cursor: pointer;
    font-family: "Gill Sans", sans-serif;
    &:hover {
      color: red;
    }
  }
	
</style>

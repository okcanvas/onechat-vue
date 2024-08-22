<template>
  <el-container>
    <el-header></el-header>
    <el-main>
      <h3 style="text-align: center;color: red;" v-if="!loginState" v-text="errorMsg"></h3>
      <hr/>
      <router-link style="margin-left: 60%;color: #65cd21;margin-top: 150px;" to="/login">
        다른 방법으로 로그인하기
      </router-link>
    </el-main>

  </el-container>

</template>
<script>
import {Base64} from "js-base64";

export default {
  name: "oAuthLoginResult",
  data(){
    return {
      "loginState":false,
      "errorMsg":null,
    }
  },
  mounted() {
    let obj= this.parseUrlParam();
    if("1"!==obj.state){
      this.loginState = false;
      this.errorMsg = Base64.decode(obj.errorMsg);
    }else{
      let result = Base64.decode(obj.oAuthInfo);
      result = result.substring(0,result.lastIndexOf("}")+1);
      let loginObj = JSON.parse(result.trim());
      this.loginState = true;
      sessionStorage.setItem("accessToken",loginObj.accessToken);
      sessionStorage.setItem("refreshToken",loginObj.refreshToken);
      this.$message.success("성공");
      // this.$router.push("/home/chat");
      this.$router.push({path:"/home/chat",query:{"reload":'1'}});
    }
  },
  methods:{
    parseUrlParam(){
      let url = window.location.href ;
      let cs = url.split('?')[1];               
      let cs_arr = cs.split('&');               
      let csObj={
        "state":0,
        "oAuthInfo":null,
      };
      for(const element of cs_arr) {         
        csObj[element.split('=')[0]] = element.split('=')[1]
      }
      return csObj;
    }
  }
}
</script>
<style scoped lang="scss">
.el-container{
  background-color: #1f473ae0;
}
</style>
<template>
	<span>{{formatDate}}</span>
</template>

<script>
	export default {
		name: "chatTime",
		data() {
			return {}
		},
		props: {
			time: {
				type: Number
			}
		},
		computed:{
			formatDate(){
				let time = new Date(this.time);
				let strtime = "";

				let todayTime = new Date();
				todayTime.setHours(0,0,0,0)
				let dayDiff = Math.floor((todayTime.getTime() - time.getTime())/(24*3600*1000)) ;
				if (time.getTime() > todayTime.getTime()) {
					strtime = time.getHours() <= 9 ? "0" + time.getHours() : time.getHours();
					strtime += ":"
					strtime += time.getMinutes() <= 9 ? "0" + time.getMinutes() : time.getMinutes();
				} else if (dayDiff < 1 ) {
					strtime = "어제";
				} else if (dayDiff < 7) {
					strtime = `${dayDiff+1}일전`;
				} else {
					strtime = time.getMonth()+1+"월"+time.getDate()+"일";
				}
			
				return strtime;
			}
		}
	}
</script>

<style>
</style>

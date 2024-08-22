<template>
  <el-container class="chat-box">
    <el-header height="60px">
      <span>{{ title }}</span>
      <span title="그룹메세지" v-show="this.chat.type=='GROUP'" class="btn-side el-icon-more"
            @click="showSide=!showSide;anonymouModeShowSide=!anonymouModeShowSide"></span>
    </el-header>
    <el-main style="padding: 0;">
      <el-container>
        <el-container  class="content-box" width="60vw">

          <el-main class="im-chat-main" id="chatScrollBox">
            <div class="im-chat-box">
                <el-scrollbar class="chat-scrollbar" ref="scrollbar" id="messageScrollbar">
                  <ul>
                    <li v-if="loading" style="margin-bottom: 80px;" v-loading="loading"
                        element-loading-text="loading...">
                    </li>

                    <li v-for="(msgInfo,idx) in chat.messages" :key="idx">
                      <chat-message-item :mine="msgInfo.sendId == mine.id" :headImage="headImage(msgInfo)"
                                         :showName="showName(msgInfo)" :ipAddress="ipAddress(msgInfo)"
                                         :msgInfo="msgInfo" @delete="deleteMessage" @recall="recallMessage">
                      </chat-message-item>
                    </li>
                  </ul>

                </el-scrollbar>
            </div>

          </el-main>
          <el-footer height="200px" class="im-chat-footer">
            <div class="chat-tool-bar">
              <div title="아이콘" ref="emotion" @click="switchEmotionBox()">
                <i class="operate-icon icon-chat-emotion"/>
              </div>
              <div title="이미지">
                <file-upload :action="imageAction" :maxSize="5*1024*1024"
                             :fileTypes="['image/jpeg', 'image/png', 'image/jpg', 'image/webp','image/gif']"
                             @before="handleImageBefore" @success="handleImageSuccess" @fail="handleImageFail">
                  <i class="operate-icon icon-chat-images"/>
                </file-upload>
              </div>
              <div title="파일">
                <file-upload :action="fileAction" :maxSize="1000*1024*1024" @before="handleFileBefore"
                             @success="handleFileSuccess"
                             @fail="handleFileFail">
                  <i class="operate-icon icon-chat-file"/>
                </file-upload>
              </div>
              <div title="오디오" @click="showVoiceBox()">
                <i class="operate-icon icon-chat-audio"/>
              </div>
              <div title="비디오" v-show="chat.type=='PRIVATE'" @click="showVideoBox()">
                <i class="operate-icon icon-chat-video"/>
              </div>
<!--              <div title="채팅기록" v-show="chat.type=='PRIVATE'" @click="showHistoryBox()">-->
<!--                <i class="operate-icon icon-chat-history"/>-->
<!--              </div>-->
            </div>
            <textarea v-model="sendText" ref="sendBox" class="send-text-area" :disabled="lockMessage"
                      @keydown.enter="sendTextMessage()"></textarea>
            <div class="im-chat-send">
              <el-button type="primary" @click="sendTextMessage()">전송</el-button>
            </div>
          </el-footer>
        </el-container>
        <el-aside class="chat-group-side-box" width="13vw" v-if="this.chat.type=='GROUP' && anonymouModeShowSide && groupType===1">
          <chat-group-side-new :group="group" :groupMembers="groupMembers" @reload="loadGroup(group.id)">
          </chat-group-side-new>
        </el-aside>
        <el-aside class="chat-group-side-box" width="15vw" v-if="this.chat.type=='GROUP' && showSide && groupType===0">
          <chat-group-side :group="group" :groupMembers="groupMembers" @reload="loadGroup(group.id)">
          </chat-group-side>
        </el-aside>
      </el-container>
    </el-main>
    <emotion v-show="showEmotion" :pos="emoBoxPos" @emotion="handleEmotion"></Emotion>
    <chat-voice :visible="showVoice" @close="closeVoiceBox" @send="handleSendVoice"></chat-voice>
    <chat-history :visible="showHistory" :chat="chat" :friend="friend" :group="group" :groupMembers="groupMembers"
                  @close="closeHistoryBox"></chat-history>
  </el-container>
</template>

<script>
import ChatGroupSide from "./ChatGroupSide.vue";
import ChatGroupSideNew from "./ChatGroupSideNew.vue";
import ChatMessageItem from "./ChatMessageItem.vue";
import FileUpload from "../common/FileUpload.vue";
import Emotion from "../common/Emotion.vue";
import ChatVoice from "./ChatVoice.vue";
import ChatHistory from "./ChatHistory.vue";

export default {
  name: "chatPrivate",
  components: {
    ChatMessageItem,
    FileUpload,
    ChatGroupSide,
    Emotion,
    ChatVoice,
    ChatHistory,
    ChatGroupSideNew
  },
  props: {
    chat: {
      type: Object
    }
  },
  data() {
    return {
      friend: {},
      group: {},
      groupType:0,
      groupMembers: [],
      sendText: "",
      showVoice: false, 
      showSide: false, 
      anonymouModeShowSide: true,
      showEmotion: false, 
      emoBoxPos: { 
        x: 0,
        y: 0
      },
      showHistory: false, 
      lockMessage: false, 
      lastScrollTime: new Date(),
      loading: false,
      loadAll: false,
      initFlag:false
    }
  },
  mounted() {
    this.$nextTick(() => {
      document.getElementById('messageScrollbar').addEventListener("mousewheel", this.handleScroll, true);
    });
    // this.loadMessages();
    this.$refs.scrollbar.wrap.scrollTop = this.$refs.scrollbar.wrap.scrollHeight;
  },

  methods: {
    async loadMessages() {
      if(this.loading){
        return ;
      }
      if (this.loadAll) {
        return this.$message.success("success");
      }
      if(this.chat===null || this.chat.type===undefined){
        return;
      }
      let param = {}
      if (this.chat.type == 'GROUP') {
        param.groupId = this.chat.targetId;
      } else {
        param.friendId = this.friend.id;
      }
      this.loading = true;
      if (this.chat.messages == null || this.chat.messages.length < 1) {
        param.lastMessageId = null;
      } else {
        param.lastMessageId = this.chat.messages[0].id;
      }
      if(this.chat.friendId===null || this.chat.groupId===null){
        return ;
      }
      this.$http({
        url: this.histroyAction,
        method: 'get',
        params: param
      }).then(messages => {
        if(messages==null || messages.length<1){
          this.loadAll = true;
        }else{
          // if(this.chat.messages===undefined || this.chat.messages===null){
          //   this.chat.messages = [];
          // }
          // messages.forEach(m => this.chat.messages.unshift(m));
          this.$store.commit("insertHistoryMessage",{"chat":this.chat,"messages":messages})
          // this.$forceUpdate();
        }
        this.loading = false;
      }).catch(()=>{
        this.loading = false;
      })
    },
    handleScroll() {
      let high = this.$refs.scrollbar.wrap.scrollTop; 
      let timeDiff = new Date().getTime() - this.lastScrollTime.getTime();
      if (high < 5 && timeDiff>1000) {
        this.lastScrollTime = new Date();
        this.loadMessages();
      }
    },
    handleImageSuccess(res, file) {
      let msgInfo = JSON.parse(JSON.stringify(file.raw.msgInfo));
      msgInfo.content = JSON.stringify(res.data);
      this.$http({
        url: this.messageAction,
        method: 'post',
        data: msgInfo
      }).then((data) => {
        msgInfo.loadStatus = 'ok';
        msgInfo.id = data.id;
        msgInfo.content = data.content;
        this.$store.commit("insertMessage", msgInfo);
      })
    },
    handleImageFail(res, file) {
      let msgInfo = JSON.parse(JSON.stringify(file.raw.msgInfo));
      msgInfo.loadStatus = 'fail';
      this.$store.commit("insertMessage", msgInfo);
    },
    handleImageBefore(file) {
      let url = URL.createObjectURL(file);
      let data = {
        originUrl: url,
        thumbUrl: url
      }
      let msgInfo = {
        id: 0,
        fileId: file.uid,
        sendId: this.mine.id,
        content: JSON.stringify(data),
        sendTime: new Date().getTime(),
        selfSend: true,
        type: 1,
        loadStatus: "loading"
      }
      this.setTargetId(msgInfo, this.chat.targetId);
      this.$store.commit("insertMessage", msgInfo);
      this.scrollToBottom();
      file.msgInfo = msgInfo;
    },
    handleFileSuccess(res, file) {
      let data = {
        name: file.name,
        size: file.size,
        url: res.data
      }
      let msgInfo = JSON.parse(JSON.stringify(file.raw.msgInfo));
      msgInfo.content = JSON.stringify(data);
      this.$http({
        url: this.messageAction,
        method: 'post',
        data: msgInfo
      }).then((data) => {
        msgInfo.loadStatus = 'ok';
        msgInfo.id = data.id;
        msgInfo.content = data.content;
        this.$store.commit("insertMessage", msgInfo);
      })
    },
    handleFileFail(res, file) {
      let msgInfo = JSON.parse(JSON.stringify(file.raw.msgInfo));
      msgInfo.loadStatus = 'fail';
      this.$store.commit("insertMessage", msgInfo);
    },
    handleFileBefore(file) {
      let url = URL.createObjectURL(file);
      let data = {
        name: file.name,
        size: file.size,
        url: url
      }
      let msgInfo = {
        id: 0,
        sendId: this.mine.id,
        content: JSON.stringify(data),
        sendTime: new Date().getTime(),
        selfSend: true,
        type: 2,
        loadStatus: "loading"
      }
      this.setTargetId(msgInfo, this.chat.targetId);
      this.$store.commit("insertMessage", msgInfo);
      this.scrollToBottom();
      file.msgInfo = msgInfo;
    },
    handleCloseSide() {
      this.showSide = false;
    },
    switchEmotionBox() {
      this.showEmotion = !this.showEmotion;
      let width = this.$refs.emotion.offsetWidth;
      let left = this.$elm.fixLeft(this.$refs.emotion);
      let top = this.$elm.fixTop(this.$refs.emotion);
      this.emoBoxPos.y = top;
      this.emoBoxPos.x = left + width / 2;
    },
    handleEmotion(emoText) {
      this.sendText += emoText;
      this.showEmotion = false;
      this.$refs.sendBox.focus();
    },
    showVoiceBox() {
      this.showVoice = true;
    },
    closeVoiceBox() {
      this.showVoice = false;
    },
    showVideoBox() {
      this.$store.commit("showChatPrivateVideoBox", {
        friend: this.friend,
        master: true
      });
    },
    showHistoryBox() {
      this.showHistory = true;
    },
    closeHistoryBox() {
      this.showHistory = false;
    },
    handleSendVoice(data) {
      let msgInfo = {
        content: JSON.stringify(data),
        type: 3
      }
      this.setTargetId(msgInfo, this.chat.targetId);
      this.$http({
        url: this.messageAction,
        method: 'post',
        data: msgInfo
      }).then((data) => {
        this.$message.success("success");
        msgInfo.id = data.id;
        msgInfo.content = data.content;
        msgInfo.sendTime = new Date().getTime();
        msgInfo.sendId = this.$store.state.userStore.userInfo.id;
        msgInfo.selfSend = true;
        this.$store.commit("insertMessage", msgInfo);
        this.$refs.sendBox.focus();
        this.scrollToBottom();
        this.showVoice = false;
      })
    },
    setTargetId(msgInfo, targetId) {
      if (this.chat.type == "GROUP") {
        msgInfo.groupId = targetId;
      } else {
        msgInfo.recvId = targetId;
      }
    },
    sendTextMessage() {
      if (!this.sendText.trim()) {
        this.$message.error("메세지를 입력하세요");
        return
      }
      let msgInfo = {
        content: this.sendText,
        type: 0
      }
      this.setTargetId(msgInfo, this.chat.targetId);
      this.lockMessage = true;
      this.$http({
        url: this.messageAction,
        method: 'post',
        data: msgInfo
      }).then((data) => {
        this.$message.success("success");
        this.sendText = "";
        msgInfo.id = data.id;
        msgInfo.content = data.content;
        msgInfo.sendTime = new Date().getTime();
        msgInfo.sendId = this.$store.state.userStore.userInfo.id;
        msgInfo.selfSend = true;
        this.$store.commit("insertMessage", msgInfo);
      }).finally(() => {
        this.lockMessage = false;
        this.$nextTick(() => this.$refs.sendBox.focus());
        this.scrollToBottom();
      });
      const e = window.event || arguments[0];
      if (e.key === 'Enter' || e.code === 'Enter' || e.keyCode === 13) {
        e.returnValue = false;
        e.preventDefault();
        return false;
      }
    },
    deleteMessage(msgInfo) {
      this.$confirm('사게하시겠어요?', '삭제', {
        confirmButtonText: '확인',
        cancelButtonText: '취소',
        type: 'warning'
      }).then(() => {
        this.$store.commit("deleteMessage", msgInfo);
      });
    },
    recallMessage(msgInfo) {
      this.$confirm('전송취소?', '취소', {
        confirmButtonText: '확인',
        cancelButtonText: '취소',
        type: 'warning'
      }).then(() => {
        let url = `/message/${this.chat.type.toLowerCase()}/recall/${msgInfo.id}`
        this.$http({
          url: url,
          method: 'delete'
        }).then(() => {
          this.$message.success("success");
          msgInfo = JSON.parse(JSON.stringify(msgInfo));
          msgInfo.type = 10;
          msgInfo.content = '취소된메세지';
          this.$store.commit("insertMessage", msgInfo);
        })
      });

    },
    loadGroup(groupId) {
      this.$http({
        url: `/group/find/${groupId}`,
        method: 'get'
      }).then((group) => {
        this.group = group;
        this.groupType = group.groupType;
        this.$store.commit("updateChatFromGroup", group);
        this.$store.commit("updateGroup", group);
      });
      this.$http({
        url: `/group/members/${groupId}`,
        method: 'get'
      }).then((groupMembers) => {
        this.groupMembers = groupMembers;
      });
    },
    loadFriend(friendId) {
      this.$http({
        url: `/user/find/${friendId}`,
        method: 'get'
      }).then((friend) => {
        this.friend = friend;
        this.$store.commit("updateChatFromFriend", friend);
        this.$store.commit("updateFriend", friend);
      })
    },
    ipAddress(msgInfo){
      

      if (this.chat.type == 'GROUP') {
        let member = this.findMemberInfo(msgInfo.sendId);
        console.log(111, member, this.mine)
        return member ? member.ipAddress : "";
      } else {
        console.log(222, member.ipAddress, this.mine)
        return msgInfo.sendId == this.mine.id ? this.mine.ipAddress : this.chat.ipAddress
      }

    },

    findMemberInfo(userId){
      let member = this.groupMembers.find((m) => m.userId == userId);
      return member;
    },
    showName(msgInfo) {
      if (this.chat.type == 'GROUP') {
        let member = this.findMemberInfo(msgInfo.sendId);
        return member ? member.aliasName : "";
      } else {
        return msgInfo.sendId == this.mine.id ? this.mine.nickName : this.chat.showName
      }

    },
    headImage(msgInfo) {
      if (this.chat.type == 'GROUP') {
        let member = this.findMemberInfo(msgInfo.sendId);
        return member ? member.headImage : "";
      } else {
        return msgInfo.sendId == this.mine.id ? this.mine.headImageThumb : this.chat.headImage
      }
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const div = document.getElementById("chatScrollBox");
        div.scrollTop = div.scrollHeight;
      });
    }
  },
  computed: {
    histroyAction() {
      return `/message/${this.chat.type.toLowerCase()}/history`;
    },
    mine() {
      return this.$store.state.userStore.userInfo;
    },
    title() {
      let title = this.chat.showName;
      if (this.chat.type == "GROUP") {
        // let size = this.groupMembers.filter(m => !m.quit).length;
        let size = this.group.memberCount;
        if(size==undefined || size==null || size <1){
          return title;
        }else{
          title += `(${size})`;
        }

      }
      return title;
    },
    imageAction() {
      return `${process.env.VUE_APP_BASE_API}/image/upload`;
    },
    fileAction() {
      return `${process.env.VUE_APP_BASE_API}/file/upload`;
    },
    messageAction() {
      return `/message/${this.chat.type.toLowerCase()}/send`;
    }
  },
  watch: {
    chat: {
      handler(newChat, oldChat) {
        if (newChat.targetId != null && (!oldChat || newChat.type != oldChat.type || newChat.targetId != oldChat.targetId)) {
          if (this.chat.type == "GROUP") {
            this.loadGroup(this.chat.targetId);
          } else {
            this.loadFriend(this.chat.targetId);
          }
          this.scrollToBottom();
          this.sendText = "";
          this.$nextTick(() => {
            this.$refs.sendBox.focus();
          })
        }
      },
      immediate: true
    }
  }
}
</script>

<style lang="scss">
.chat-box {
  background: white;
  border: #dddddd solid 1px;

  .el-header {
    padding: 5px;
    background-color: white;
    line-height: 50px;
    font-size: 20px;
    font-weight: 600;
    border: #dddddd solid 1px;

    .btn-side {
      position: absolute;
      right: 20px;
      line-height: 60px;
      font-size: 22px;
      cursor: pointer;

      &:hover {
        font-size: 30px;
      }
    }
  }

  .im-chat-main {
    padding: 0;
    border: #dddddd solid 1px;

    .im-chat-box {
      height: 100%;
      border: 0px;
      > ul {
        padding: 20px;

        li {
          list-style-type: none;
        }
      }
    }
  }

  .im-chat-footer {
    display: flex;
    flex-direction: column;
    padding: 0;
    border: #dddddd solid 1px;

    .chat-tool-bar {

      display: flex;
      position: relative;
      width: 100%;
      height: 40px;
      text-align: left;
      box-sizing: border-box;
      border: #dddddd solid 1px;

      > div {
        margin-left: 10px;
        font-size: 22px;
        cursor: pointer;
        color: #333333;
        line-height: 40px;

        &:hover {
          color: black;
        }
      }
    }

    .send-text-area {
      box-sizing: border-box;
      padding: 5px;
      width: 100%;
      flex: 1;
      resize: none;
      background-color: #f8f8f8 !important;
      outline-color: rgba(83, 160, 231, 0.61);
    }

    .im-chat-send {
      text-align: right;
      padding: 7px;
    }
  }

  .chat-group-side-box {
    border: #dddddd solid 1px;
    animation: rtl-drawer-in .3s 1ms;
  }

  .operate-icon {
    display: inline-block;
    width: 28px;
    height: 28px;
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
  }

  .icon-chat-emotion {
    background-image: url('~@/assets/icons/chat-emetion.png');
  }

  .icon-chat-audio {
    background-image: url('~@/assets/icons/chat-audio.png');
  }

  .icon-chat-file {
    background-image: url('~@/assets/icons/chat-file.png');
  }

  .icon-chat-history {
    background-image: url('~@/assets/icons/chat-history.png');
  }

  .icon-chat-images {
    background-image: url('~@/assets/icons/chat-images.png');
  }

  .icon-chat-video {
    background-image: url('~@/assets/icons/chat-video.png');
  }

  .chat-tool-bar i {
    margin-top: 5px;
    margin-left: 3px;
  }

  .chat-scrollbar {
    flex: 1;
    height: 100%;

    .el-scrollbar__thumb {
      background-color: #555555;
    }

    ul {
      padding: 20px;

      li {
        list-style-type: none;
      }
    }
  }
}
</style>

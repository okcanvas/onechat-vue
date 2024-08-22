<template>
  <div>
    <el-container class="ibox">

      <el-aside width="5vw" class="navi-bar" style="text-align: center;">
        <div class="user-head-image">
          <head-image :url="$store.state.userStore.userInfo.headImageThumb" :size="60"
                      @click.native="showSettingDialog=true">
          </head-image>
        </div>

        <el-menu background-color="#333333" text-color="#ddd" style="margin-top: 10px;">
          <el-menu-item title="채팅">
            <router-link v-bind:to="'/home/chat'">
              <i class="operate-icon icon-message-list"/>
              <div v-show="unreadCount>0" class="unread-text">{{ unreadCount }}</div>
            </router-link>
          </el-menu-item>
          <el-menu-item v-if="accountType!=1" title="친구">
            <router-link v-bind:to="'/home/friend'">
              <i class="operate-icon icon-friend-list"/>
            </router-link>
          </el-menu-item>
          <el-menu-item v-if="accountType!=1" title="그룹">
            <router-link v-bind:to="'/home/group'">
              <i class="operate-icon icon-group-list"/>
            </router-link>
          </el-menu-item>

                    

        </el-menu>
        <div class="exit-box" @click="handleExit()" title="종료">
          <i class="operate-icon icon-exit"/>
        </div>
      </el-aside>
      <el-main class="content-box">
        <router-view></router-view>
      </el-main>

      <setting :visible="showSettingDialog" @close="closeSetting()"></setting>
      <user-info v-show="uiStore.userInfo.show" :pos="uiStore.userInfo.pos" :user="uiStore.userInfo.user"
                 @close="$store.commit('closeUserInfoBox')"></user-info>
      <full-image :visible="uiStore.fullImage.show" :url="uiStore.fullImage.url"
                  @close="$store.commit('closeFullImageBox')"></full-image>
      <chat-private-video ref="privateVideo" :visible="uiStore.chatPrivateVideo.show"
                          :friend="uiStore.chatPrivateVideo.friend"
                          :master="uiStore.chatPrivateVideo.master"
                          :offer="uiStore.chatPrivateVideo.offer"
                          @close="$store.commit('closeChatPrivateVideoBox')">
      </chat-private-video>
      <chat-video-acceptor ref="videoAcceptor"
                           v-show="uiStore.videoAcceptor.show"
                           :friend="uiStore.videoAcceptor.friend"
                           @close="$store.commit('closeVideoAcceptorBox')">
      </chat-video-acceptor>
    </el-container>

    <connector-signal class="connector-signal-class" :node="connectorStore.node"/>
  </div>
</template>

<script>
import HeadImage from '../components/common/HeadImage.vue';
import Setting from '../components/setting/Setting.vue';
import UserInfo from '../components/common/UserInfo.vue';
import FullImage from '../components/common/FullImage.vue';
import ChatPrivateVideo from '../components/chat/ChatPrivateVideo.vue';
import ChatVideoAcceptor from '../components/chat/ChatVideoAcceptor.vue';
import ConnectorSignal from '../components/common/ConnectorSignal.vue';
import connectorStore from "@/store/connectorStore";


export default {
  components: {
    HeadImage,
    Setting,
    UserInfo,
    FullImage,
    ChatPrivateVideo,
    ChatVideoAcceptor,
    ConnectorSignal
  },
  data() {
    return {
      showSettingDialog: false,
      accountType: 0
    }
  },
  methods: {
    init(userInfo) {
      this.$store.commit("setUserInfo", userInfo);
      this.$store.commit("setUserState", this.$enums.USER_STATE.FREE);
      this.$store.commit("initStore");

      let accessToken = sessionStorage.getItem("accessToken");
      this.$wsApi.createWebSocket(accessToken);
      this.accountType = userInfo.accountType;
      this.$wsApi.onopen(e => {
        this.$store.commit("connectorSuccess", e);
      });
      this.$wsApi.onheart(e => {
        this.$store.commit("heart", e);
      });
      this.$wsApi.onReConnect(e => {
        this.$store.commit("onReConnect", e);
      });
      this.$wsApi.onclose(e => {
        this.$store.commit("connectorClose", e);
      });
      this.$wsApi.onmessage((cmd, msgInfo) => {
        if (cmd == 2) {
          this.$message.error("다른 곳에 접속되어 있다, 강제로 접속을 해제합니다");
          setTimeout(() => {
            location.href = "/";
          }, 1000)

        } else if (cmd == 3) {
          this.handlePrivateMessage(msgInfo);
        } else if (cmd == 4) {
          this.handleGroupMessage(msgInfo);
        }
      })
    },
    pullUnreadMessage() {
      this.$http({
        url: "/message/group/pullUnreadMessage",
        method: 'post'
      });
      if (this.accountType !== 1) {
        this.$http({
          url: "/message/private/pullUnreadMessage",
          method: 'post'
        });
      }
    },
    handlePrivateMessage(msg) {
      let friend = this.$store.state.friendStore.friends.find((f) => f.id == msg.sendId);
      if (friend) {
        this.insertPrivateMessage(friend, msg);
        return;
      }
      this.$http({
        url: `/friend/find/${msg.sendId}`,
        method: 'get'
      }).then((friend) => {
        this.insertPrivateMessage(friend, msg);
        this.$store.commit("addFriend", friend);
      })
    },
    insertPrivateMessage(friend, msg) {
      if (msg.type >= this.$enums.MESSAGE_TYPE.RTC_CALL && msg.type <= this.$enums.MESSAGE_TYPE.RTC_CANDIDATE) {
        if (msg.type == this.$enums.MESSAGE_TYPE.RTC_CALL || msg.type == this.$enums.MESSAGE_TYPE.RTC_CANCEL) {
          this.$store.commit("showVideoAcceptorBox", friend);
          this.$refs.videoAcceptor.handleMessage(msg)
        } else {
          this.$refs.privateVideo.handleMessage(msg)
        }
        return;
      }

      let chatInfo = {
        type: 'PRIVATE',
        targetId: friend.id,
        showName: friend.nickName,
        headImage: friend.headImage
      };
      this.$store.commit("openChat", chatInfo);
      this.$store.commit("insertMessage", msg);
      this.playAudioTip();
    },
    handleGroupMessage(msg) {
      let group = this.$store.state.groupStore.groups.find((g) => g.id == msg.groupId);
      if (group) {
        this.insertGroupMessage(group, msg);
        return;
      }
      this.$http({
        url: `/group/find/${msg.groupId}`,
        method: 'get'
      }).then((group) => {
        this.$store.commit("addGroup", group);
        this.insertGroupMessage(group, msg);
      })
    },
    insertGroupMessage(group, msg) {
      let chatInfo = {
        type: 'GROUP',
        targetId: group.id,
        showName: group.remark,
        headImage: group.headImageThumb
      };
      this.$store.commit("openChat", chatInfo);
      this.$store.commit("insertMessage", msg);
      this.playAudioTip();
    },
    handleExit() {
      this.$confirm('종료합니다.', '종료', {
        confirmButtonText: '확인',
        cancelButtonText: '취소',
        type: 'warning'
      }).then(() => {
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        sessionStorage.removeItem("token");
        this.$store.commit("resetChatStore");
        this.$store.commit("resetStore");
        this.$wsApi.closeWebSocket();
        location.href = "/";
      });

    },
    playAudioTip() {
      let audio = new Audio();
      let url = require(`@/assets/audio/tip.wav`);
      audio.src = url;
      audio.play();
    },
    showSetting() {
      this.showSettingDialog = true;
    },
    closeSetting() {
      this.showSettingDialog = false;
    }
  },
  computed: {
    connectorStore() {
      return this.$store.state.connectorStore;
    },
    uiStore() {
      return this.$store.state.uiStore;
    },
    unreadCount() {
      let unreadCount = 0;
      let chats = this.$store.state.chatStore.chats;
      chats.forEach((chat) => {
        unreadCount += chat.unreadCount
      });
      return unreadCount;
    }
  },
  watch: {
    unreadCount: {
      handler(newCount, oldCount) {
        let tip = newCount > 0 ? `${newCount}일지않음` : "";
        this.$elm.setTitleTip(tip);
      },
      immediate: true
    }
  },
  mounted() {
    this.$http({
      url: "/user/self",
      methods: 'get'
    }).then((userInfo) => {
      this.init(userInfo);
    })
  },
  unmounted() {
    this.$wsApi.closeWebSocket();
  }
}
</script>

<style scoped lang="scss">
.navi-bar {
  background: #333333;
  padding: 10px;
  padding-top: 20px;

  .user-head-image {
    position: relative;
    width: 50px;
    height: 50px;
  }

  .el-menu {
    border: none;
    flex: 1;

    .el-menu-item {
      margin: 25px 0;

      .router-link-exact-active span {
        color: white !important;
      }


      span {
        font-size: 24px !important;
        color: #aaaaaa;

        &:hover {
          color: white !important;
        }
      }

      .unread-text {
        position: absolute;
        line-height: 20px;
        background-color: #f56c6c;
        left: 36px;
        top: 7px;
        color: white;
        border-radius: 30px;
        padding: 0 5px;
        font-size: 10px;
        text-align: center;
        white-space: nowrap;
        border: 1px solid #f1e5e5;
      }
    }
  }

  .exit-box {
    position: absolute;
    width: 60px;
    bottom: 40px;
    color: #aaaaaa;
    font-size: 24px;
    text-align: center;
    cursor: pointer;

    &:hover {
      color: white !important;
    }
  }
}

.content-box {
  padding: 0;
  background-color: #f3e9ee;
  color: #333;
  text-align: center;

}

.ibox {
  position: relative;
  flex-direction: row;
  width: 80vw;
  height: 80vh;
  margin: 0 auto;
  margin-top: 10vh;
  border-radius: 16px;
}

.connector-signal-class{
  position: absolute;
  left: 85%;
  top: 20px;
}

.icon-github {
  background-image: url('~@/assets/icons/github.png');
}

.icon-gitee {
  background-image: url('~@/assets/icons/gitee.png');
}

.icon-friend-list {
  background-image: url('~@/assets/icons/friend-list.png');
}

.icon-message-list {
  background-image: url('~@/assets/icons/message-list.png');
}

.icon-group-list {
  background-image: url('~@/assets/icons/group-list.png');
}

.icon-exit {
  background-image: url('~@/assets/icons/exit.png');
}

.operate-icon {
  display: inline-block;
  width: 28px;
  height: 28px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}

</style>

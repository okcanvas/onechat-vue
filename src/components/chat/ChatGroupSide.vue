<template>
  <div class="chat-group-side">
    <el-scrollbar class="group-side-scrollbar">
      <el-form labelPosition="top" class="group-side-form" :model="group">
        <!--        <el-form-item label="群聊名称">-->
        <!--          <el-input v-model="group.name" disabled maxlength="20"></el-input>-->
        <!--        </el-form-item>-->
        <!--        <el-form-item label="群主">-->
        <!--          <el-input :value="ownerName" disabled></el-input>-->
        <!--        </el-form-item>-->
        <el-form-item label="단체공지">
          <el-input v-model="group.notice" disabled type="textarea" maxlength="1024" placeholder=""></el-input>
        </el-form-item>
        <!--        <el-form-item label="备注">-->
        <!--          <el-input v-model="group.remark" :disabled="!editing" placeholder="群聊的备注仅自己可见" maxlength="20"></el-input>-->
        <!--        </el-form-item>-->
        <!--        <el-form-item label="我在本群的昵称">-->
        <!--          <el-input v-model="group.aliasName" :disabled="!editing" placeholder="xx" maxlength="20"></el-input>-->
        <!--        </el-form-item>-->

        <!--        <div class="btn-group">-->
        <!--          <el-button v-show="editing" type="success" @click="handleSaveGroup()">提交</el-button>-->
        <el-button size="mini" v-show="isOwner" type="primary" @click="dialogVisible=!dialogVisible">수정</el-button>
        <el-button size="mini" type="success" @click="showAddGroupMember=true">개시</el-button>
        <el-button size="mini" type="danger" v-show="!isOwner" @click="handleQuit()">퇴장</el-button>
      </el-form>
      <el-divider content-position="center"></el-divider>

      <div class="group-side-search">
        <el-input placeholder="" v-model="searchText">
          <el-button slot="append" icon="el-icon-search"></el-button>
        </el-input>
      </div>
      <div style="margin-top: 5px;">
        <div class="group-side-invite">
          <add-group-member :visible="showAddGroupMember" :groupId="group.id" :members="groupMembers"
                            @reload="$emit('reload')"
                            @close="showAddGroupMember=false"></add-group-member>
        </div>
        <div style="vertical-align: center" v-for="(member) in groupMembers" :key="member.id">
          <group-member class="group-side-member" v-show="!member.quit && member.aliasName.startsWith(searchText)"
                        :member="member"
                        :showDel="false"></group-member>
        </div>
      </div>

    </el-scrollbar>


    <el-dialog
        title="수정"
        :visible.sync="dialogVisible"
        width="30%"
        :before-close="handleClose1">
      <el-form>
        <el-form-item label="그룹명">
          <el-input v-model="group.name" maxlength="20"></el-input>
        </el-form-item>
        <el-form-item label="내용">
          <el-input v-model="group.notice" type="textarea" maxlength="1024"
                    placeholder=""></el-input>
        </el-form-item>
        <el-form-item label="비고">
          <el-input v-model="group.remark" placeholder=""
                    maxlength="20"></el-input>
        </el-form-item>
        <el-form-item label="단톡방닉네임">
          <el-input v-model="group.aliasName" placeholder="xx" maxlength="20"></el-input>
        </el-form-item>

        <div class="btn-group">
          <el-button type="success" @click="handleSaveGroup()">저장</el-button>
          <el-button @click="dialogVisible = false">닫기</el-button>
        </div>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import AddGroupMember from '../group/AddGroupMember.vue';
import GroupMember from '../group/GroupMember.vue';

export default {
  name: "chatGroupSide",
  components: {
    AddGroupMember,
    GroupMember
  },
  data() {
    return {
      searchText: "",
      editing: false,
      showAddGroupMember: false,
      dialogVisible: false
    }
  },
  props: {
    group: {
      type: Object
    },
    groupMembers: {
      type: Array
    }
  },
  methods: {
    handleClose1(done) {
      this.$confirm('닫습니다？')
          .then(_ => {
            done();
          })
          .catch(_ => {
          });
    },
    handleClose() {
      this.$emit('close');
    },
    loadGroupMembers() {
      this.$http({
        url: `/group/members/${this.group.id}`,
        method: "get"
      }).then((members) => {
        this.groupMembers = members;
      })
    },
    handleSaveGroup() {
      let vo = this.group;
      this.$http({
        url: "/group/modify",
        method: "put",
        data: vo
      }).then((group) => {
        this.$store.commit("updateGroup", group);
        this.$emit('reload');
        this.$message.success("success");
      })
    },
    handleQuit() {
      this.$confirm('탈퇴하시겠습니까', '탈퇴?', {
        confirmButtonText: '확인',
        cancelButtonText: '취소',
        type: 'warning'
      }).then(() => {
        this.$http({
          url: `/group/quit/${this.group.id}`,
          method: 'delete'
        }).then(() => {
          this.$store.commit("removeGroup", this.group.id);
          this.$store.commit("activeGroup", -1);
          this.$store.commit("removeGroupChat", this.group.id);
        });
      })
    },

  },
  computed: {
    ownerName() {
      let member = this.groupMembers.find((m) => m.userId == this.group.ownerId);
      return member && member.aliasName;
    },
    isOwner() {
      return this.group.ownerId == this.$store.state.userStore.userInfo.id;
    }

  }
}
</script>

<style lang="scss">
.chat-group-side {
  position: relative;

  .group-side-member {
    cursor: pointer;
  }

  .group-side-form {
    text-align: left;
    padding: 10px;
    height: 30%;

    .el-form-item {
      margin-bottom: 12px;

      .el-form-item__label {
        padding: 0;
        line-height: 30px;
      }

      .el-textarea__inner {
        min-height: 100px !important;
      }
    }

    .btn-group {
      text-align: center;
    }
  }

}
</style>

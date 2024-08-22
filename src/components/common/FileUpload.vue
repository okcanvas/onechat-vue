<template>
	<el-upload :action="action" :headers="uploadHeaders" :accept="fileTypes==null?'':fileTypes.join(',')"
	 :show-file-list="false" :on-success="handleSuccess" :on-error="handleError" :disabled="disabled" :before-upload="beforeUpload">
		<slot></slot>
	</el-upload>
</template>

<script>
	export default {
		name: "fileUpload",
		data() {
			return {
				loading: null,
				uploadHeaders: {"accessToken":sessionStorage.getItem('accessToken')}
			}
		},
		props: {
			action: {
				type: String,
				required: true
			},
			fileTypes: {
				type: Array,
				default: null
			},
			maxSize: {
				type: Number,
				default: null
			},
			showLoading: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		methods: {
			handleSuccess(res, file) {
				this.loading && this.loading.close();
				if (res.code == 200) {
					this.$emit("success", res, file);
				} else {
					this.$message.error(res.message);
					this.$emit("fail", res, file);
				}
			},
			handleError(err, file) {
				this.$emit("fail", err, file);
			},
			beforeUpload(file) {
				if (this.fileTypes && this.fileTypes.length > 0) {
					let fileType = file.type;
					let t = this.fileTypes.find((t) => t.toLowerCase() === fileType);
					if (t === undefined) {
						this.$message.error(`File format error：${this.fileTypes.join("、")}`);
						return false;
					}
				}
				if (this.maxSize && file.size > this.maxSize) {
					this.$message.error(`${this.maxSize}File size error ${this.fileSizeStr}!`);
					return false;
				}
				if (this.showLoading) {
					this.loading = this.$loading({
						lock: true,
						text: '전송중...',
						spinner: 'el-icon-loading',
						background: 'rgba(0, 0, 0, 0.7)'
					});
				}
				this.$emit("before", file);
				return true;
			}
			
			
		},
		computed: {
			fileSizeStr() {
				if (this.maxSize > 1024 * 1024) {
					return Math.round(this.maxSize / 1024 / 1024) + "M";
				}
				if (this.maxSize > 1024) {
					return Math.round(this.maxSize / 1024) + "KB";
				}
				return this.maxSize + "B";
			}
		}
	}
</script>

<style>
</style>

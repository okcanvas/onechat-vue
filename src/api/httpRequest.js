import axios from 'axios'
import router from '@/router'
import {
	Message
} from 'element-ui'

const http = axios.create({
	baseURL: process.env.VUE_APP_BASE_API,
	timeout: 1000 * 30,
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json; charset=utf-8'
	}
})

http.interceptors.request.use(config => {
	let accessToken = sessionStorage.getItem("accessToken");
	if (accessToken) {
		config.headers.accessToken = encodeURIComponent(accessToken);
	}
	return config
}, error => {
	return Promise.reject(error)
})

http.interceptors.response.use(async response => {
	if (response.data.code == 200) {
		return response.data.data;
	} else if (response.data.code == 400) {
		router.replace("/login");
	} else if (response.data.code == 401) {
		let refreshToken = sessionStorage.getItem("refreshToken");
		if (!refreshToken) {
			router.replace("/login");
		}
		const data = await http({
			method: 'put',
			url: '/refreshToken',
			headers: {
				refreshToken: refreshToken
			}
		})
		sessionStorage.setItem("accessToken", data.accessToken);
		sessionStorage.setItem("refreshToken", data.refreshToken);
		response.config.headers=undefined;
		return http(response.config)
	} else {
		Message({
			message: response.data.message,
			type: 'error',
			duration: 1500,
			customClass: 'element-error-message-zindex'
		})
		return Promise.reject(response.data)
	}
}, error => {
	switch (error.response.status) {
		case 400:
			Message({
				message: error.response.data,
				type: 'error',
				duration: 1500,
				customClass: 'element-error-message-zindex'
			})
			break
		case 401:
			router.replace("/login");
			break
		case 405:
			Message({
				message: 'http요청방식오류',
				type: 'error',
				duration: 1500,
				customClass: 'element-error-message-zindex'
			})
			break
		case 404:
		case 500:
			Message({
				message: '서버에 오류가 발생했습니다. 나중에 다시 시도하십시오.',
				type: 'error',
				duration: 1500,
				customClass: 'element-error-message-zindex'
			})
			break
		case 501:
			Message({
				message: '서버가 현재 요청에 필요한 기능을 지원하지 않습니다',
				type: 'error',
				duration: 1500,
				customClass: 'element-error-message-zindex'
			})
			break
	}

	return Promise.reject(error)
})


export default http

import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from '../view/Login'
import Register from '../view/Register'
import Home from '../view/Home'
import OauthLoginResult from '../view/OauthLoginResult'

Vue.use(VueRouter);

let router = new VueRouter({
    mode: 'history',
    routes: [{
        path: "/",
        redirect: "/login"
    },
        {
            name: "Login",
            path: '/login',
            component: Login
        },
        {
            name: "oAuthLoginResult",
            path: '/oAuthLoginResult',
            component: OauthLoginResult
        },
        {
            name: "Register",
            path: '/register',
            component: Register
        },
        {
            name: "Home",
            path: '/home',
            component: Home,
            meta: {
                requireAuth: true
            },
            children: [
                {
                    name: "Chat",
                    path: "/home/chat",
                    component: () => import("../view/Chat"),
                    meta: {
                        requireAuth: true
                    },
                },
                {
                    name: "Friends",
                    path: "/home/friend",
                    component: () => import("../view/Friend"),
                    meta: {
                        requireAuth: true
                    },
                },
                {
                    name: "Friends",
                    path: "/home/group",
                    component: () => import("../view/Group"),
                    meta: {
                        requireAuth: true
                    },
                }
            ]
        }
    ]

});

router.beforeEach((to, from, next) => {
    if (to.matched.length ===0) {
        next({
            path: '/home'
        });
    }
    if (to.meta.requireAuth) {
        let accessToken=sessionStorage.getItem("accessToken");
        if (accessToken!=null && accessToken!=undefined && accessToken.trim()!='') {
            next();
        } else {
            next({
                path: '/login'
            })
        }
    } else {
        next();
    }
})

export default router;
import Vue from 'vue'

// v-dialogDrag
Vue.directive('dialogDrag', {
    bind(el, binding, vnode, oldVnode) {
        const dialogHeaderEl = el.querySelector('.el-dialog__header')
        const dragDom = el.querySelector('.el-dialog')
        dialogHeaderEl.style.cursor = 'move'

        const sty = dragDom.currentStyle || window.getComputedStyle(dragDom, null)

        dialogHeaderEl.onmousedown = (e) => {
            const disX = e.clientX - dialogHeaderEl.offsetLeft
            const disY = e.clientY - dialogHeaderEl.offsetTop
            const screenWidth = document.body.clientWidth; 
            const screenHeight = document.documentElement.clientHeight;
            const dragDomWidth = dragDom.offsetWidth; 
            const dragDomheight = dragDom.offsetHeight; 
            const minDragDomLeft = dragDom.offsetLeft;
            const maxDragDomLeft = screenWidth - dragDom.offsetLeft - dragDomWidth;
            const minDragDomTop = dragDom.offsetTop;
            const maxDragDomTop = screenHeight - dragDom.offsetTop - dragDomheight;


            let styL, styT


            if (sty.left.includes('%')) {
                styL = +document.body.clientWidth * (+sty.left.replace(/\%/g, '') / 100)
                styT = +document.body.clientHeight * (+sty.top.replace(/\%/g, '') / 100)
            } else {
                styL = +sty.left.replace(/\px/g, '')
                styT = +sty.top.replace(/\px/g, '')
            }

            document.onmousemove = function (e) {

// var clientHeight = document.documentElement.clientHeight || document.body.clientHeight
// var clientWidth = document.documentElement.clientWidth || document.body.clientWidth


                var l = e.clientX - disX
                var t = e.clientY - disY


                if (-l > minDragDomLeft) {
                    l = -minDragDomLeft;
                } else if (l > maxDragDomLeft) {
                    l = maxDragDomLeft;
                }
                if (-t > minDragDomTop) {
                    t = -minDragDomTop;
                } else if (t > maxDragDomTop) {
                    t = maxDragDomTop;
                }

                dragDom.style.left = `${l + styL}px`
                dragDom.style.top = `${t + styT}px`


// binding.value({x:e.pageX,y:e.pageY})
            }

            document.onmouseup = function (e) {
                document.onmousemove = null
                document.onmouseup = null
            }
        }
    }
})

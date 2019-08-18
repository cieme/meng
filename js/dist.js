$(function () {
    try {
        $(".book-li").on("click", function () {
            $(this).find(".book-li-bottom").slideToggle();
            $(this).find(".iconfont").toggleClass("icon-jianhao");
        })

    } catch (error) {

    }

})
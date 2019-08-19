$(function () {
    try {
        $(".book-li").on("click", function () {
            $(this).find(".book-li-bottom").slideToggle();
            $(this).find(".iconfont").toggleClass("icon-jianhao");
        })
        $(".show_more_ul li").on("click", function () {
            $(this).find(".zybox").slideToggle();
        })

    } catch (error) {

    }

})
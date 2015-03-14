$(document).ready(function () {
    var bt = $('#toolBackTop');
    var sw = $(document.body)[0].clientWidth;

    var limitsw = (sw - 840) / 2 - 80;
    if (limitsw > 0){
        limitsw = parseInt(limitsw);
        bt.css("right",limitsw);
    }

    $(window).scroll(function() {
        var st = $(window).scrollTop();
        if(st > 30){
                bt.show();
        }else{
                bt.hide();
        }
    });
})

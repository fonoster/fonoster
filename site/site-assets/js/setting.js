// Header Fixed
var headerwrap = jQuery(".header-wrap");
jQuery(window).on("scroll", function () {
  if (jQuery(this).scrollTop() > 0) {
    headerwrap.addClass("sticky");
  } else {
    headerwrap.removeClass("sticky");
  }
});

jQuery(document).ready(function () {
  var headerwrap = jQuery(".header-wrap");
  // Background image
  jQuery(".bg_img").each(function (i, elem) {
    var img = $(elem);
    jQuery(this).hide();
    jQuery(this)
      .parent()
      .css({
        background:
          "url(" + img.attr("src") + ") no-repeat no-repeat center center",
      });
  });

  jQuery(".menu").on("click", function () {
    jQuery(".header-wrap .right").toggleClass("open");
    jQuery("body").toggleClass("pause");
    jQuery(this).toggleClass("open");
  });

  // Scroll Offset
  var headerheight = headerwrap.height();
  jQuery(".offset-top").on("click", function (e) {
    e.preventDefault();
    var target = jQuery(this).data("id");
    jQuery("html, body")
      .stop()
      .animate(
        {
          scrollTop: jQuery("#" + target).offset().top - (headerheight + 15),
        },
        1000,
        "swing",
        function () {}
      );
  });

  // SVG Create

  jQuery("img.svg").each(function () {
    var $img = jQuery(this);
    var imgID = $img.attr("id");
    var imgClass = $img.attr("class");
    var imgURL = $img.attr("src");
    jQuery.get(
      imgURL,
      function (data) {
        var $svg = jQuery(data).find("svg");
        if (typeof imgID !== "undefined") {
          $svg = $svg.attr("id", imgID);
        }
        if (typeof imgClass !== "undefined") {
          $svg = $svg.attr("class", imgClass + " replaced-svg");
        }
        $svg = $svg.removeAttr("xmlns:a");
        if (
          !$svg.attr("viewBox") &&
          $svg.attr("height") &&
          $svg.attr("width")
        ) {
          $svg.attr(
            "viewBox",
            "0 0 " + $svg.attr("height") + " " + $svg.attr("width")
          );
        }
        $img.replaceWith($svg);
      },
      "xml"
    );
  });

  const testimonials_slider = new Swiper(".testimonials-slider", {
    speed: 700,
    spaceBetween: 20,
    slidesPerView: "auto",
    loop: false,
    freeMode: true,
  });

  const install_slider = new Swiper(".install-slider", {
    speed: 700,
    spaceBetween: 20,
    slidesPerView: "auto",
    loop: false,
    freeMode: true,
    breakpoints: {
      991: {
        spaceBetween: 20,
      },
      767: {
        spaceBetween: 12,
      },
    },
  });

  const pricing_slider = new Swiper(".pricing-slider", {
    speed: 700,
    spaceBetween: 20,
    slidesPerView: "auto",
    loop: false,
    freeMode: true,
  });
});

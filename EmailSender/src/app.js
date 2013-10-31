requirejs.config({
    baseUrl: "../",
    paths: {
        "text": "utils/requirejs/text",
        "jquery.tagsinput": "utils/jquery.tagsinput/jquery.tagsinput",
        "jquery.wysiwyg": "utils/jquery.wysiwyg/jquery.wysiwyg",
        "jquery.wysiwyg.colorpicker": "utils/jquery.wysiwyg/controls/wysiwyg.colorpicker",
        "jquery.wysiwyg.link": "utils/jquery.wysiwyg/controls/wysiwyg.link",
        "farbtastic": "utils/farbtastic/farbtastic",
        "uploadify": "utils/uploadify/jquery.uploadify.min",
        "app_email_sender": "src",
        "underscore": "scripts/underscore-min",
        "backbone": "scripts/backbone-min"
    },
    shim: {
        "backbone": {
            deps: ["underscore"],
            exports: "Backbone"
        },
        "underscore": {
            exports: "_"
        },
        "jquery.wysiwyg.colorpicker": {
            deps: ["jquery.wysiwyg", "farbtastic"]
        },
        "jquery.wysiwyg.link": {
            deps: ["jquery.wysiwyg"]
        }
    }
});

(function () {
    function addCss(url) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = url;
        document.getElementsByTagName("head")[0].appendChild(link);
    }

    addCss(require.toUrl("jquery.tagsinput/../jquery.tagsinput.css"));
    addCss(require.toUrl("jquery.wysiwyg/../jquery.wysiwyg.css"));
    addCss(require.toUrl("jquery.wysiwyg/../jquery.wysiwyg.modal.css"));
    addCss(require.toUrl("farbtastic/../css/farbtastic.css"));
    addCss(require.toUrl("uploadify/../uploadify.css"));
    addCss(require.toUrl("app_email_sender/styles/main.css"));

    if ($.browser.msie) {
        addCss(require.toUrl("app_email_sender/styles/ie.css"));
    }

    if ($.fn.dialog) {
        $.fn.dialog = null;
    }

})();


require(["app_email_sender/main"], function (app) {
    var tagInput,
        emailSender = app;


    app.run($("#emailSender"), function (error) {

        if (error.type === "warn") {
            console.log('error occurs: ' + error.type + ' ' + error.message);
        }
        else {
            alert('error occurs: ' + error.type + ' ' + error.message);
        }
    }, { id: 5 });
    emailSender.setContent([], '', '');
});
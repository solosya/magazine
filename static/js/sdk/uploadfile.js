(function ($) {

    $.fn.uploadFile = function (options) {

        var defaults = {
            tabs: [],
            onSuccess: function () {},
            onError: function () {}
        };

        var opts = $.extend({}, defaults, options);

        return this.each(function () {
            var elem = $(this);
            $(elem).click(function (e) {
                e.preventDefault();
                e.stopPropagation();

                var obj = $(this);

                //initialization code
                $.loadScript("//api.filepicker.io/v2/filepicker.js", function () {
                    
                    var tabs = $.extend([], ['COMPUTER'], opts.tabs);

                    //Set file picker api key
                    filepicker.setKey(_appJsConfig.filepickerKey);

                    filepicker.pick({
                        mimetype: 'image/*',
                        services: tabs
                    },
                    function (Blob) {
                        var resultJson = {url: Blob.url, filename: Blob.filename, type: Blob.mimetype, size: Blob.size, mediaType: "image"};
                        if (opts.onSuccess && typeof opts.onSuccess === 'function') {
                            opts.onSuccess(resultJson, obj);
                        }
                    },
                    function (FPError) {
                        //  $().General_ShowErrorMessage({message: FPError.toString()});
                    });
                });
            });
        });
    };

    $.loadScript = function (url, callback) {

        var script = document.createElement("script")
        script.type = "text/javascript";

        if (script.readyState) {  //IE
            script.onreadystatechange = function () {
                if (script.readyState == "loaded" ||
                        script.readyState == "complete") {
                    script.onreadystatechange = null;
                    callback();
                }
            };
        } else {  //Others
            script.onload = function () {
                callback();
            };
        }

        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
    };

}(jQuery));
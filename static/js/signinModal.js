import { Modal, Server } from './framework'

export const SigninModal = function(template, parent, layouts) {
    this.template = template;
    this.parentCont = parent;
    this.layouts = layouts;
    this.parent = Modal.prototype;
};
SigninModal.prototype = new Modal();
SigninModal.constructor = SigninModal;
SigninModal.prototype.errorMsg = function(msg) {
    $('.message').removeClass('u-hide');
};
SigninModal.prototype.handle = function(e) {
    var self = this;

    var $elem = this.parent.handle.call(this, e);

    if ( $elem.is('a') ) {

        if ($elem.hasClass('close')) {

            e.preventDefault();
            $('body').removeClass("active");
            this.closeWindow();
        }
    }
    if ($elem.is('button')) {

        $('.message').addClass('u-hide');
        if ($elem.hasClass('signin')) {
            $elem.text('')
                 .addClass('spinner');
            e.preventDefault();
            var formData = {};

            $.each($('#loginForm').serializeArray(), function () {
                formData[this.name] = this.value.trim();
            });
            // rememberMe sets flag to store login for 30 days in cookie
            formData['rememberMe'] = 1;
            Server.create('/api/auth/login', formData).done(function(r) {

                if (r.success === 1) {
                    
                    // if password reset must return to home page, else 
                    // get an error when staying on auth endpoint.
                    if (window.location.pathname === "/auth/reset-thanks") {
                        window.location.replace(_appJsConfig.appHostName);
                        return;
                    }
                    if (window.location.pathname === "/prosubscribe") {
                        window.location.replace(_appJsConfig.appHostName + "/pro");
                        return;
                    }

                    window.location.reload();


                } else {
                    $elem.text("Sign in")
                         .removeClass('spinner');
                    self.errorMsg();
                }
            }).fail(function(r) { 
                $elem.text("Sign in")
                     .removeClass('spinner');
                self.errorMsg();
                console.log(r);
            });
        }


        if ($elem.hasClass('forgot')) {
            e.preventDefault();
            var formData = {};
            $.each($('#forgotForm').serializeArray(), function () {
                formData[this.name] = this.value;
            });

            Server.create('/api/auth/forgot-password', formData).done(function(r) {
                if (r.success === 1) {
                    location.reload();
                } else {
                    self.errorMsg();
                }

            }).fail(function(r) { console.log(r);});
        }



        if ($elem.hasClass('close')) {
            $('body').removeClass("active");
            this.closeWindow();
        }
   

    }

    if ($elem.hasClass('layout')) {
        var layout = $elem.data('layout');
        this.renderLayout(layout);
    }
};



import { Token } from './token'
import { Modal } from './framework'

/***                      ****
  Dialog Confirmation Box
***                       ****/

export const IPCheck = function() {

    function dot2num(dot) {
        var d = dot.split(".");
        return ((((((
               +d[0])   * 256 )
             +(+d[1]))  * 256 )
             +(+d[2]))  * 256 )
             +(+d[3]
        );
    }


    const IPToken = new Token("IP_ACCOUNT");
    var token = IPToken.getToken();
    var IPAdresses = [];

    if (!token) {

        // Acme.server.fetch(_appJsConfig.appHostName + '/api/theme/get-config').done(function(r) {

        //     if (r.success === 1) {

            if (typeof window.IPAdresses == 'undefined') {
                return;
            }
            IPAdresses = window.IPAdresses;
            $.getJSON("https://api.ipify.org?format=jsonp&callback=?",
            function(json) {
                console.log(json);
                let userAccount = false;
                const userIPInt = dot2num(json.ip);

                for (let i = 0 ; i < IPAdresses.length ; i++) {
                    if (IPAdresses[i].indexOf('//') === 0 ) {
                        continue;
                    }

                    const range = IPAdresses[i].split("-");
                    
                    // All IP addresses are converted to a range, however
                    // we can start by just listing one.  The second ip
                    // in the range will be added automtically
                    if (range.length < 2) {

                        // check for a wildcard character and replace with a zero
                        // for the first item in the range, and 255 for the second item in the range
                        if (range[0].indexOf("*") > -1) {
                            let ip1 = range[0];
                            range[0] = dot2num( ip1.replace(/\*/g, "0") );
                            range.push( dot2num( ip1.replace(/\*/g, "255") ) );
                        } else {
                            range[0] = dot2num ( range[0] );
                            range.push( range[0] );
                        }

                    // if both ip addresses are specified no need to check for wildcard
                    } else {
                        range[0] = dot2num ( range[0] );
                        range[1] = dot2num ( range[1] );
                    }

                    if (userIPInt >= range[0] && userIPInt <= range[1]) {
                        userAccount = true;
                        break;
                    }
                }

                if ( userAccount ) {
                    IPNoticePopup = new IPNotice("modal", "ipdialog", {"main": "ipnotice"});
                    IPNoticePopup.render("main", "Did you know your employer is a subscriber to Newsroom Pro?");
                }
            });


        //     } 
        // }).fail(function(r) { console.log(r);return;});
    }
}


export const IPNotice = function(template, parent, layouts) {

    this.template = template;
    this.parentCont = parent;
    this.layouts = layouts;
    this.parent = Acme.modal.prototype;
    this.data = {};
};
    IPNotice.prototype = new Modal();
    IPNotice.constructor = IPNotice;
    IPNotice.prototype.errorMsg = function(msg) {
        $('.message').toggleClass('hide');
    };
    IPNotice.prototype.handle = function(e) {
        var self = this;
        this.parent.handle.call(this, e);
        var $elem = $(e.target);

        if ( $elem.is('a') || $elem.parent().is('a') ) {
            self.closeWindow();
            IPToken.setToken('true');
        }
        if ($elem.is('button')) {
            if ($elem.data('role') === 'close') {
                self.closeWindow();
            }
            IPToken.setToken('true');
        }
    };

import Notify from '../notify'
//Noty Message
export const General_ShowNotification = function (options) {
    var defaults = {
        message: '',
        type: 'success',
        timeout: 2500,
    };

    var opts = $.extend({}, defaults, options);
    var n = new Notify();
    n.render(opts);

};

//Show Error Message
export const General_ShowErrorMessage = function (options) {
    var defaults = {
        message: '',
        type: 'error',
        closeWith: 'click',

    };

    var opts = $.extend({}, defaults, options);
    var n = new Notify();
    n.render(opts);
};


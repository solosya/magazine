import { General_ShowNotification, General_ShowErrorMessage } from './common'
import { Server } from '.././framework'


export const pinUnpinArticle = function(elem, options){
    
    // var defaults = {
    //     'onSuccess' : function(){},
    //     'onError' : function(){},
    //     'beforeSend' : function(){},
    //     'onComplete' : function(){}
    // };
    // var opts = $.extend( {}, defaults, options );

    return elem.each (function(){
        var elem  = $(this);
        $(elem).off('click');
        
        $(elem).on('click', function(e){
            e.preventDefault();

            var articleId = $(elem).data('id');
            var position = parseInt($(elem).attr('data-position'));
            var existingStatus = $(elem).attr('data-status');
            var isSocial = $(elem).data('social');
            
            if(isNaN(articleId) || articleId <= 0 || isNaN(position) || position <= 0) {
                return;
            }

            const data = {id: articleId, status: existingStatus, social: isSocial, position: position};
            Server.create(_appJsConfig.baseHttpPath + '/home/pin-article', data).done(function(r) {
                $(elem).attr('data-status', ((existingStatus == 1) ? 0 : 1));
                var msg = (existingStatus == 1) ? "Article un-pinned successfully" : "Article pinned successfully";
                (existingStatus == 1) ? $(elem).removeClass('selected') : $(elem).addClass('selected');
                General_ShowNotification({message: msg});
            });
        });
    });
};
    
    
const Delete = function (articleGuid, isSocial, elem, onSuccess) {

    if (typeof articleGuid === 'undefined' || articleGuid === "") {
        return;
    }

    const data = {guid: articleGuid, social: isSocial};
    Server.create(_appJsConfig.baseHttpPath + '/home/delete-article', data).done((r) => {
        var msg = (isSocial == 1) ? "Article deleted successfully" : "Article hidden successfully";
        General_ShowNotification({message: msg});
    }).fail((e)=> {
        General_ShowErrorMessage({message: e.responseText});
    });


    // $.ajax({
    //     type: 'POST',
    //     url: _appJsConfig.baseHttpPath + '/home/delete-article',
    //     dataType: 'json',
    //     data: {guid: articleGuid, social: isSocial, _csrf: csrfToken},
    //     success: function (data, textStatus, jqXHR) {
    //         var msg = (isSocial == 1) ? "Article deleted successfully" : "Article hidden successfully";
    //         General_ShowNotification({message: msg});
    //         if (onSuccess && typeof onSuccess === 'function') {
    //             onSuccess(data, elem);
    //         }
    //     },
    //     error: function (jqXHR, textStatus, errorThrown) {
    //         General_ShowErrorMessage({message: jqXHR.responseText});
    //     },
    //     beforeSend: function (jqXHR, settings) {
    //     },
    //     complete: function (jqXHR, textStatus) {
    //     }
    // });
};
    
    
export const deleteArticle = function(elem, options){

    var defaults = {
        'onSuccess' : function(){},
        'onError' : function(){},
        'beforeSend' : function(){},
        'onComplete' : function(){}
    };
    var opts = $.extend( {}, defaults, options );

    return elem.each (function(){
        var elem  = $(this);
        $(elem).off('click');
        $(elem).on('click', function(e){
            e.preventDefault();
            
            var isSocial = $(elem).data('social');
            var msgStr = (isSocial == 1) ? "Do you really want to delete this article?" : "Do you really want to hide this article?";
            var articleGuid = $(elem).data('guid');
            
            if (typeof bootbox === 'undefined') {
                var result = confirm(msgStr);
                if (result === true) {
                    Delete(articleGuid, isSocial, elem, opts.onSuccess);
                }
            } 
        });
    });
};    




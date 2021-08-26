import Handlebars                           from 'handlebars'
import { General_ShowNotification, 
         General_ShowErrorMessage }         from './sdk/common'
import { pinUnpinArticle, deleteArticle }   from './sdk/article'
import { Templates }                        from './article-templates';
import { Server }                           from './framework';
import { Cloudinary }                       from '@cloudinary/base'
import { fill, thumbnail }                  from "@cloudinary/base/actions/resize";
import { faces }                            from "@cloudinary/base/qualifiers/focusOn";
import { focusOn }                          from "@cloudinary/base/qualifiers/gravity";


export const Card = function(attrs = {}) {
    this.data = attrs;
    this.events();
};
window.Card = Card;

Card.prototype.render = function(options = {})
{
    var self = this;
    var template = (options.template) ? Templates[options.template] : Templates.systemCardTemplate;

    const card = {};

    card['cardClass'] = options.cardClass || "";
    if (this.data.status == "draft") {
        card['articleStatus'] = "draft";
        card['cardClass'] += " draft"; 
    }



    card['url'] = this.data.url;
    card['editUrl'] = this.data.editUrl;
    
    card['cardType'] = this.data.type || "";
    card['lightbox'] = this.data.lightbox || "";
    card['position'] = this.data.position;

    card['isPinned'] =  this.data.isPinned;
    card['pinTitle'] = (this.data.isPinned == 1) ? 'Un-Pin Article' : 'Pin Article';
    card['pinText']  = (this.data.isPinned == 1) ? 'Un-Pin' : 'Pin';
    card['promotedClass'] = (this.data.isPromoted == 1)? 'ad_icon' : '';
    card['hasMediaClass'] = (this.data.hasMedia == 1)? 'withImage__content' : 'without__image';
    card['hasMedia'] = (this.data.hasMedia == 1)? true : false;
    card['userHasBlogAccess']  = _appJsConfig.userHasBlogAccess;
    card['imgBackgroundStyle'] = (this.lazyloadImage == false) ? '' : 'style="background-image:url(https://placeholdit.imgix.net/~text?txtsize=33&txt=Loading&w=450&h=250)"';
    // mainly for screen to turn off lazyload and loading background img
    card['imgClass'] = (this.data.lazyloadImage == false) ? '' : 'lazyload';
    
    card['readingTime'] = self.renderReadingTime(this.data.readingTime);
    // console.log(card);
    var width = typeof options.imageWidth !== "undefined" ? options.imageWidth : 500;
    var height = typeof options.imageHeight !== "undefined" ? options.imageHeight : 350;
    var gravity = typeof options.imageGravity !== "undefined" ? options.imageGravity : null;

    if (options.imageOriginal) {
        var width = this.featuredMedia.width;
        var height = this.featuredMedia.height;
    }

    if (this.imageOptions) {
        width = this.imageOptions.width || width;
        height = this.imageOptions.height || height;
    }
    
    card['draggable'] = "false";


    const profileImage = this.data['createdBy']['media'];
    const articleImage = this.data['featuredMedia'];

    const cld = new Cloudinary({
        cloud: {
          cloudName: articleImage.cloudName
        }
    });

    // Docs:
    // https://cloudinary.com/documentation/javascript2_image_transformations
    const articleImg = cld.image(articleImage.id);
    const profileImg = cld.image(profileImage.id);
    articleImg.resize( fill().width(width).height(height).gravity( focusOn( faces() ) ) );
    profileImg.resize( thumbnail().width(34).height(34).gravity( focusOn( faces() ) ) );

    // card['profileImg'] = Image({media:card['createdBy']['media'], mediaOptions:{width: 34 ,height:34, crop: 'thumb', gravity: 'face'} });
    // card['imageUrl'] = Image({media:card['featuredMedia'], mediaOptions:{width: width ,height:height, crop: 'limit'} });
    card['profileImg'] = profileImg.toURL();
    card['imageUrl'] = articleImg.toURL();

    card['label'] = this.data.label;
    card['excerpt'] = this.data.excerpt;
    card['title'] = this.data.title;
    card['author'] = this.data.createdBy.displayName;
    card['titleString'] = "";


    if (_appJsConfig.isUserLoggedIn === 1 && _appJsConfig.userHasBlogAccess === 1) {
        var totalstring = "";
        var totals = (this.data.total ) ? this.data.total : false;
        if ( totals ) {
            totalstring = "Viewed " + totals.view + " times";
            totalstring = totalstring + " Published " + this.data.publishedDateTime;
        }
        card['titleString'] = totalstring;
        card['draggable'] = "true";
    }

    var articleId = parseInt(this.data.articleId);
    var articleTemplate;

    if (isNaN(articleId) || articleId <= 0) {
        // card['videoClass'] = '';
        // if(card.social.media.type && card.social.media.type == 'video') {
        //     card['videoClass'] = 'video_card';
        // }
        articleTemplate = Handlebars.compile(template);
    } else {
        card['articleId'] = this.data.articleId;
        articleTemplate = Handlebars.compile(template);
    }
    return articleTemplate(card);
}

Card.prototype.renderReadingTime = function (time) 
{
    if (time <= '59') {
        return ((time <= 0) ? 1 : time) + ' min read';
    } else {
        var hr = Math.round(parseInt(time) / 100);
        return hr + ' hour read';
    }
};



// events
Card.prototype.bindPinUnpinArticle = function()
{
    pinUnpinArticle( $('button.PinArticleBtn'), {
        onSuccess: function(data, obj){
            var status = $(obj).data('status');
            var obj = $(obj);
            (status == 1) 
                ? obj.attr('title', 'Un-Pin Article') 
                : obj.attr('title', 'Pin Article');
            (status == 1) 
                ? obj.find('span').first().html('Un-Pin')
                : obj.find('span').first().html('Pin');        
        }
    });
};

Card.prototype.bindDeleteHideArticle = function()
{
    deleteArticle( $('button.HideBlogArticle'), {
        onSuccess: function(data, obj){
            $(obj).closest('.card').parent('div').remove();
            var postsCount = $('body').find('.card').length;
            if(postsCount <= 0) {
                $('.NoArticlesMsg').removeClass('hide');
            }
        }
    });
};






Card.prototype.initDraggable = function()
{

    if ( $.ui ) {
        console.log('initing draggable');
        $('.swap').draggable({
            helper: 'clone',
            revert: true,
            zIndex: 100,
            scroll: true,
            scrollSensitivity: 100,
            cursorAt: { left: 150, top: 50 },
            appendTo:'body',
            start: function( event, ui ) {
                ui.helper.attr('class', '');
                var postImage = $(ui.helper).data('article-image');
                var postText = $(ui.helper).data('article-text');
                if(postImage !== "") {
                    $('div.SwappingHelper img.article-image').attr('src', postImage);
                }
                else {
                    $('div.SwappingHelper img.article-image').attr('src', 'http://www.placehold.it/100x100/EFEFEF/AAAAAA&amp;text=no+image');
                }
                $('div.SwappingHelper p.article-text').html(postText);
                $(ui.helper).html($('div.SwappingHelper').html());    
            }
        });
    }
};

Card.prototype.initDroppable = function()
{
    var self = this;


    if ( $.ui ) {

        $('.swap').droppable({
            hoverClass: "ui-state-hover",
            drop: function(event, ui) {
                
                function getElementAtPosition(elem, pos) {
                    return elem.find('a.card').eq(pos);
                }

                var sourceObj       = $(ui.draggable); //card being dragged
                var destObject      = $(this); //card it lands on
                var sourceProxy     = null;
                var destProxy       = null;

                

                if (typeof sourceObj.data('proxyfor') !== 'undefined') {
                    sourceProxy = sourceObj;
                    sourceObj   = getElementAtPosition($( '.' + sourceProxy.data('proxyfor')), sourceProxy.data('position') -1);
                    sourceObj.attr('data-position', destObject.data('position'));

                }
                if (typeof destObject.data('proxyfor') !== 'undefined') {
                    destProxy = destObject;
                    destObject = getElementAtPosition($( '.' + destObject.data('proxyfor')), destObject.data('position') -1);
                    destObject.attr('data-position', sourceObj.data('position'));
                }



                //get positions
                var sourcePosition       = sourceObj.data('position');
                var sourcePostId         = sourceObj.data('id');
                var sourceIsSocial       = parseInt(sourceObj.data('social'));
                var sourcePinStatus      = parseInt(sourceObj.find('.PinArticleBtn').attr('data-status'));

                var destinationPosition  = destObject.data('position');
                var destinationPostId    = destObject.data('id');
                var destinationIsSocial  = parseInt(destObject.data('social'));
                var destinationPinStatus = parseInt(destObject.find('.PinArticleBtn').attr('data-status'));


                var swappedDestinationElement = sourceObj.clone().removeAttr('style').insertAfter( destObject );
                var swappedSourceElement = destObject.clone().insertAfter( sourceObj );
                

                if (sourceProxy) {
                    sourceProxy.find('h2').text(destObject.find('h2').text());
                    swappedDestinationElement.addClass('swap');
                    swappedSourceElement.removeClass('swap');
                    sourceProxy.attr('data-article-text', destObject.data('article-text'));
                    sourceProxy.attr('data-article-image', destObject.data('article-image'));
                }

                if (destProxy) {
                    if (sourceIsSocial) {
                        destProxy.find('h2').text( sourceObj.find('p').text() );
                    } else {
                        destProxy.find('h2').text( sourceObj.find('h2').text() );
                    }
                    swappedSourceElement.addClass('swap');
                    swappedDestinationElement.removeClass('swap');
                    destProxy.attr('data-article-text', sourceObj.data('article-text'));
                    destProxy.attr('data-article-image', sourceObj.data('article-image'));
                }
                
                swappedSourceElement.attr('data-position', sourcePosition);
                swappedDestinationElement.attr('data-position', destinationPosition);

                swappedSourceElement.find('.PinArticleBtn').attr('data-position', sourcePosition);
                swappedDestinationElement.find('.PinArticleBtn').attr('data-position', destinationPosition);

                swappedSourceElement.find('.PinArticleBtn').attr('data-status', destinationPinStatus);
                swappedDestinationElement.find('.PinArticleBtn').attr('data-status', sourcePinStatus);


                $(ui.helper).remove(); //destroy clone
                sourceObj.remove();
                destObject.remove();
                

                var postData = {
                    sourcePosition: sourcePosition,
                    sourceArticleId: sourcePostId,
                    sourceIsSocial: sourceIsSocial,
                    
                    destinationPosition: destinationPosition,
                    destinationArticleId: destinationPostId,
                    destinationIsSocial: destinationIsSocial,
                };


                Server.create(_appJsConfig.baseHttpPath + '/home/swap-article', postData).done(function(data) {
                    if(data.success) {
                        General_ShowNotification({message: "Articles swapped successfully"});
                    }
        
                    $(".j-truncate").dotdotdot();
                    self.events();

                }).fail((e) => {
                    General_ShowErrorMessage({message: e.responseText});
                });
    
            }
        }); 
    }
};



Card.prototype.dragndrop = function() {
    
    var dragOver = function(event) {
        event.preventDefault();
    };
    
    var dragStart = function(event) {
        event.dataTransfer.setData('text/plain', event.target.id);
    }

    var drop = function(event) {
        var id = event.dataTransfer.getData('text');
        var found = false;
        var element = event.target;

        while (element.parentNode) {
            if (element.tagName.toLowerCase() !== 'a') {
                element = element.parentNode;
            } else if ( element.classList.contains('swap') ) {
                found = true;
                break;
            }
        }
        if (!found) {
            return false;
        }
        
        var sourceObj       = document.getElementById(id);
        var destObject      = element; //card it lands on

        var sourcePosition       = sourceObj.dataset.position;
        var sourcePostId         = sourceObj.dataset.id;
        var sourceIsSocial       = parseInt(sourceObj.dataset.social);
        var sourcePinStatus      = parseInt(sourceObj.querySelector('.PinArticleBtn').getAttribute('data-status'));


        var destinationPosition  = destObject.dataset.position;
        var destinationPostId    = destObject.dataset.id;
        var destinationIsSocial  = parseInt(destObject.dataset.social);
        var destinationPinStatus = parseInt(destObject.querySelector('.PinArticleBtn').getAttribute('data-status'));


        // var csrfToken = $('meta[name="csrf-token"]').attr("content");
        var postData = {
            sourcePosition: sourcePosition,
            sourceArticleId: sourcePostId,
            sourceIsSocial: sourceIsSocial,
            
            destinationPosition: destinationPosition,
            destinationArticleId: destinationPostId,
            destinationIsSocial: destinationIsSocial,
            
            // _csrf: csrfToken
        };

        sourceParent = sourceObj.parentNode;
        destParent = destObject.parentNode;
        sourceParent.removeChild(sourceObj);
        sourceParent.appendChild(destObject);
        destParent.appendChild(sourceObj);


        Server.create(_appJsConfig.baseHttpPath + '/home/swap-article', postData).done(function(data) {
            if(data.success) {
                General_ShowNotification({message: "Articles swapped successfully"});
            }

            $(".j-truncate").dotdotdot();
            self.events();

        }).fail((e) => {
            General_ShowErrorMessage({message: e.responseText});
        });
    };
    // var enter = function(event) {
    //     event.preventDefault();
    // };

    var cards = document.getElementsByClassName('swap');
    for(var i = 0; i < cards.length; i++) {
        cards[i].addEventListener('dragstart', dragStart);
        cards[i].addEventListener('dragover', dragOver);
        cards[i].addEventListener('drop', drop);
    }
}




Card.prototype.events = function() 
{
    var self = this;

    if (_appJsConfig.isUserLoggedIn === 1 && _appJsConfig.userHasBlogAccess === 1) {
        self.initDroppable();
        self.initDraggable();        
        self.bindPinUnpinArticle();
        self.bindDeleteHideArticle();
        // self.BindLightboxArticleBtn();

    }
    // self.bindSocialPostPopup();
};
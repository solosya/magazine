import { Templates } from './article-templates'
import { Server } from './framework'



const Feed = function() {
    this.domain = _appJsConfig.appHostName;
    this.requestType = 'create';
    this.dataType = 'json';
};

Feed.prototype.fetch = function()
{

    var self = this;
    self.elem.html("Please wait...");
    // blogfeed makes 2 sql calls.  
    //      Offset is to get pinned contect 
    //      nonPinnedOffset gets the rest
    //      They're combined to return full result

    // if (this.options.search != null) {
    //     this.options.blogid = this.options.blogid; // search takes an id instead of a guid
    // }
    this.url = this.domain + '/home/load-articles';

    this.requestData = { 
        offset      : this.options.offset, 
        limit       : this.options.limit, 
        dateFormat  : 'SHORT',
        existingNonPinnedCount: this.options.nonPinnedOffset
    };

    if (this.options.blogid) {
        this.requestData['blogGuid'] = this.options.blogid;
    }

    if (this.options.type) {
        this.requestData['type'] = this.options.type;
    }



    if (this.options.loadtype == 'user') {
        this.url = this.domain + '/api/'+options.loadtype+'/load-more-managed';
        this.requestType = 'fetch';
    }
    
    if (this.options.loadtype == 'user_articles') {
        var urlArr = window.location.href.split('/');
        var username = decodeURIComponent(urlArr[urlArr.length - 2]);
        this.url = this.domain + '/profile/'+ username + '/posts';
    }


    if (this.options.search) {

        var refinedSearch = this.options.search;
        if (this.options.blogid) {
            this.requestData['blogguid'] = this.options.blogid;
        }
        if (refinedSearch.indexOf(",listingquery") >= 0) {
            refinedSearch = refinedSearch.replace(",listingquery","");
            this.requestData['meta_info'] = refinedSearch;
        } else{
            this.requestData['s'] = refinedSearch;
        }
        this.url = this.domain + '/'+ this.options.loadtype;
        this.requestType = 'fetch';
    }

    console.log(this.requestType);
    console.log(this.url);
    console.log(this.requestData);
    return Server[this.requestType](this.url, this.requestData).done(function(r) {
        if (r.success == 1) {
            console.log(r);
            self.render(r);
        }
    });

};

Feed.prototype.events = function() 
{
    var self = this;

    if (self.elem.length > 0) {
        self.elem.unbind().on('click', function(e) {
            e.preventDefault();
            self.fetch();
        });
    }

    if (self.lessElem && self.lessElem.length > 0) {
        self.lessElem.on('click', function(e) {
            var section = $(this).data('section');
            $('#' + section).empty();
            $(this).hide();
            self.options.nonPinnedOffset = self.originalCount;
            self.options.offset = self.originalOffset;
            self.elem.show();
        });
    }
    
    if (this.infinite && this.offset >= this.limit && self.elem.length > 0) {
        self.addWayPoint.call(self);
    }
};

Feed.prototype.addWayPoint = function()
{
    var self = this;
    self.waypoint = new Waypoint({
        element: self.elem,
        offset: '80%',
        handler: function (direction) {
            if (direction == 'down') {
                self.fetch();
            }
        }
    });
}




export const ArticleFeed = function(options)
{
    this.cardModel  = options.model;
    this.limit      = options.limit      || 10;
    this.offset     = options.offset     || 0;
    this.infinite   = options.infinite   || false;
    this.failText   = options.failText   || null;
    this.container  = $('#' + options.container);
    this.template   = options.cardTemplate;
    this.cardClass  = options.card_class;
    this.renderType = options.renderType || 'append';
    this.before     = options.before     || false;
    this.after      = options.after      || false;
    this.beforeEach = options.beforeEach || false;
    this.afterEach  = options.afterEach  || false;
    this.button_label = options.label    || false;
    this.cardType   = options.cardType   || "";
    this.lightbox   = options.lightbox   || null;
    this.imgWidth   = options.imageWidth || null;
    this.imgHeight  = options.imageHeight|| null;
    this.ads        = options.ads        || false;
    // when clicking less, reset the original offset count
    this.originalCount = options.non_pinned;
    this.originalOffset = options.offset || 0;
    this.options    = {
        'nonPinnedOffset'   :   options.non_pinned  || -1,
        'search'            :   options.searchterm  || null,
        'loadtype'          :   options.loadtype    || "home",
        'offset'            :   options.offset      || 0,
        'blogid'            :   options.blogid,
        'limit'             :   options.limit,
        'type'              :   options.type        || null
        // 'page'              :   self.elem.data('page') || 1, // page is used for user articles
    };

    this.waypoint  = false;
    
    // This is the load more button
    this.elem      = $('#' + options.name);
    // This is the load LESS button if you have one
    this.lessElem  = $('#less-' + options.name);
    this.failText  = options.failText || null;
    this.events();
};

ArticleFeed.prototype = new Feed();
ArticleFeed.constructor = ArticleFeed;
ArticleFeed.prototype.render = function(data) 
{

    var self = this;
    var articles = [];
    if (data.articles) {
        articles = data.articles;
    }
    if (data.userArticles) {
        articles = data.userArticles;
    }
    if (data.users) {
        articles = data.users.users;
    }

    var label = "";
    if (typeof self.button_label != "undefined" || self.button_label != false ) {
        label = self.button_label;
    }
    var ads_on =   self.ads || null;

    self.elem.html(label);
    if (self.lessElem && self.lessElem.length > 0) {
        self.lessElem.show();
    }

    // add counts to the dom for next request
    self.options.offset += self.options.limit;
    self.options.nonPinnedOffset = data.existingNonPinnedCount;

    var html = [];
    if (ads_on == true) {
        html.push( Templates.ads_infinite );
    }

    if (articles.length === 0 && self.failText) {
        html = ["<p>" + self.failText + "</p>"];
    } else {
        for (var i in articles) {
            const card = new this.cardModel(articles[i]);
            
            if (self.beforeEach) {
                html.push( self.beforeEach );
            }

            card.imageOptions = {'width': self.imgWidth, 'height': self.imgHeight};
            html.push( card.render({
                cardClass: self.cardClass,
                template: self.template,
                type: self.cardType,
                lightbox: self.lightbox || null
            }));

            if (self.afterEach) {
                html.push( self.afterEach );
            }
        }


        if (self.before ) {
            var beforeStr =  self.before.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
            html = [beforeStr].concat(html);
        }
        if (self.after) {
            var afterStr =  self.after.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
            html = html.concat([afterStr]);
        }
    }

    (self.renderType === "write")
        ? self.container.empty().append( html.join('') )
        : self.container.append( html.join('') );
    

    // show or hide the load more button depending on article count
    (articles.length < self.options.limit && !this.infinite) 
        ? self.elem.css('display', 'none')
        : self.elem.show();

    // reset infinite load depending on article count

    if (self.waypoint) {
        (articles.length < self.options.limit)
            ? self.waypoint.disable()
            : self.waypoint.enable();
    }


    // $('.video-player').videoPlayer();
    $(".lazyload").lazyload({
        effect: "fadeIn"
    });
    $('.j-truncate').dotdotdot({
        watch: true
    });

    const cardEvents = new this.cardModel().events();

    if (ads_on == true) {
        self.InsertAds();
    }
};



export const UserFeed = function(feedModel, limit, offset, infinite, failText, controller)
{
    this.feedModel = feedModel;
    this.controller = controller || null;
    this.offset    = offset || 0;
    this.limit     = limit || 10;
    this.infinite  = infinite || false;
    this.waypoint  = false;
    this.options   = {};
    this.elem      = $('.loadMore');
    this.failText  = failText || null;
    this.events();
};

UserFeed.prototype = new Feed();
UserFeed.constructor = UserFeed;
UserFeed.prototype.render = function(data) 
{
    var self = this;
    var users = data.users.users || data.users;

    var cardClass  =   self.elem.data('card-class'),
        template   =   self.elem.data('card-template') || null,
        label      =   self.elem.data('button-label')  || "Load more",
        ads_on     =   self.elem.data('ads')           || null,
        rendertype =   self.elem.data('rendertype')    || null;

    self.elem.html(label);
    (users.length < self.options.limit) 
        ? self.elem.css('display', 'none')
        : self.elem.show();

    // add counts to the dom for next request
    self.elem.data('offset', (self.options.offset + self.options.limit));

    var html = [];

    if (users.length === 0 && self.failText) {
        html = ["<p>" + self.failText + "</p>"];
    } else {
        for (var i in users) {
            html.push( self.feedModel.render(users[i], cardClass, template) );
        }
    }

    (rendertype === "write")
        ? self.options.container.empty().append( html.join('') )
        : self.options.container.append( html.join('') );
        
    if (self.waypoint) {
        (users.length < self.options.limit)
            ? self.waypoint.disable()
            : self.waypoint.enable();
    }

    this.controller.userEvents();

    $(".card .content > p, .card h2").dotdotdot();     
    // $('.video-player').videoPlayer();
    $("div.lazyload").lazyload({
        effect: "fadeIn"
    });

    self.elem.data('rendertype', '');
};





export const UserCard = function(){};
UserCard.prototype.render = function(user, cardClass, template, type)
{
    user['cardClass'] = cardClass;
    var template = (template) ? Templates[template] : Templates.systemCardTemplate;
    userTemplate = Handlebars.compile(template);
    return userTemplate(user);
}



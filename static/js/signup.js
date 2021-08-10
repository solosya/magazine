import { Form, Validators } from './form'
import { Modal, Server } from './framework'
import Card from './StripeCard'


export const SubscribeForm = function(id, user) {
    
    this.botTimer = 0;
    this.id = id || null;
    this.parent = Form.prototype;
    this.code = false;

    this.data = {
        "firstname": "Subscriber",
        "password": this.random(25),
        "username": this.random(15),
        "user_id": user.user_id,
        "user_guid": user.user_guid
    };


    this.errorFields = [];

    this.validateRules = {
        "email"             : ["notEmpty"],
        "trial"             : [],
        "terms"             : ["isTrue"],
    };

    var trial = $('#trial').val();
    this.data['plantype'] = $('#plantype').val();

    if (trial == "1" && this.data.plantype === 'time') {
        this.data['trial'] = 'true';
        this.validateRules['changeterms'] = ["isTrue"];
    }
    if ($("#code-redeem").length > 0) {
        this.code = true;
        delete this.validateRules.terms;
        delete this.validateRules.changeterms;
    }

    this.validateFields = Object.keys(this.validateRules);
    this.stripeSetup();
    this.loadData();
    this.events();
};



SubscribeForm.prototype = new Form(Validators);
SubscribeForm.constructor = SubscribeForm;
SubscribeForm.prototype.stripeSetup = function () {
    var self = this;
    var stripekey = $('#stripekey').html();
    this.stripe = Stripe(stripekey);
    const StripeCard = new Card();
    this.card = StripeCard.get(this.stripe);

    setInterval(function(){
        self.botTimer = self.botTimer + 1;
    }, 1000);
}
SubscribeForm.prototype.random = function(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};
SubscribeForm.prototype.render = function(checkTerms) 
{
    this.clearInlineErrors();
    this.addInlineErrors();
    if (checkTerms) {
        if (!this.data.terms || (this.data.trial === 'true' && !this.data.changeterms)) {
            this.confirmView = new Modal('modal', 'signin-modal', {'terms': 'subscribeTerms'});
            this.confirmView.render("terms", "Almost there");
        }
    }
};
SubscribeForm.prototype.submit = function(event) 
{
    var self = this;
    event.preventDefault();

    var validated = self.validate();
    var checkTerms = true;
    if (this.code) {
        checkTerms = false;
    }
    self.render(checkTerms);
    
    if (!validated) return;

    if (self.botTimer < 5 || $('#email-confirm').val() !== "") {
        window.location.href = location.origin + "/auth/thank-you";
    }


    this.signup = new Modal('modal', 'spinner-modal', {"spinner": 'spinnerTmpl'});

    if (this.code) {
        this.signup.render("spinner", "Authorising code");
        self.data['planid'] = $('#planid').val();
        self.data['giftcode'] = $('#code-redeem').val();
        self.data['stripetoken'] = null;
        Server.create('/auth/paywall-signup', self.data);

    } else {

        // modal.render("spinner", "Your request is being processed.");
        this.signup.render("spinner", "Your request is being processed.");
        var stripeCall = this.stripe.createToken(self.card).then(function(result) {

            if (result.error) {
                self.signup.closeWindow();
                // Inform the user if there was an error
                var errorElement = document.getElementById('card-errors');
                errorElement.textContent = result.error;
            } else {
                // Send the token to your server

                self.data['stripetoken'] = result.token.id;
                self.data['planid'] = $('#planid').val();
                self.data['redirect'] = false;
                Server.create('/auth/paywall-signup', self.data).done(function(r) {
                    // console.log(r);
                    if (r.success == 1) {
                        self.data.user_id = r.userid;
                        self.data.user_guid = r.userguid;

                        var purchaseId = Math.floor(Math.random()*60000000000);

                        if  ($('.j-gtasubpay')[0]){
                            var payitem = $($('.j-gtasubpay')[0]);
                            if (typeof dataLayer !== 'undefined') {
                                dataLayer.push({
                                    'event':'purchase',
                                    'ecommerce': {
                                        'purchase': {
                                            'actionField': {
                                                'id': purchaseId,                         // Transaction ID. Required for purchases and refunds.
                                                'revenue': payitem.data('price')
                                            },
                                            'products': [{                            // List of productFieldObjects.
                                                'name': payitem.data('name'),
                                                'id': payitem.data('id'),
                                                'category': 'Pro Subscription',
                                                'price': payitem.data('price'),
                                                'quantity': 1
                                            }]
                                        }
                                    }
                                });
                            }
                        }
                        Acme.progress.next();

                    } else {
                        var errorElement = document.getElementById('card-errors');
                        var text = '';
                        for (var key in r.error) {
                            text = text + r.error[key] + " ";
                        } 
                        // console.log(text);
                        errorElement.textContent = text;
                    }
                    self.signup.closeWindow();
                }).fail(function(r) {
                    self.signup.closeWindow();
                });
            }
        });   
    }

        
};










var ActivateForm = function(id, subscription) {
    this.subscription = subscription;
    this.id = id || null;
    this.parent = Form.prototype;
    this.data = {
        "group[1149][1]": true,
        "group[1149][2]": true,
    };
    this.errorFields = [];

    this.validateRules = {
        // this.data              Rule
        "password"          : ["notEmpty"],
        "verifypassword"    : ["notEmpty"],
        "firstname"         : ["notEmpty"], 
        "lastname"          : ["notEmpty"], 
    };

    this.validateFields = Object.keys(this.validateRules);
    this.loadData();
    this.events();
};

ActivateForm.prototype = new Form(Validators);
ActivateForm.constructor = ActivateForm;
ActivateForm.prototype.submit = function(event) 
{
    var self = this;
    event.preventDefault();
    var validated = self.validate();

    this.data.user_id = this.subscription.data.user_id;
    this.data.user_guid = this.subscription.data.user_guid;
    self.render(true);
    if (!validated) return;

    this.signup = new Modal('modal', 'spinner-modal', {"spinner": 'spinnerTmpl'});

    this.signup.render("spinner", "Activating account");
    Server.create('/api/user/edit-profile', this.data).done(function(r) {
        console.log(r);
        if (self.data["group[1149][1]"] != false || self.data["group[1149][2]"] != false) {

            var subscribeData = {
                "EMAIL": self.subscription.data['email'], 
                "FNAME": self.data['firstname'],
                "LNAME": self.data['lastname'],
            };
            if (self.data["group[1149][1]"]) {
                subscribeData["group[1149][1]"] = 1;
            }
            if (self.data["group[1149][2]"]) {
                subscribeData["group[1149][2]"] = 2;
            }

            
            Server.create("https://hivenews.us7.list-manage.com/subscribe/post?u=9cf8330209dae95121b0d58a6&amp;id=2412c1d355", subscribeData)
                .then(function(r) {
                    console.log(r);
                });                        
        }
        Acme.progress.next();
        self.signup.closeWindow();
    }).fail(function(r) {
        console.log('failed', r);
    });

};






var ManagedForm = function(id, user) {
    this.id = id || null;
    this.parent = Form.prototype;
    this.data = {};
    this.errorFields = [];

    this.validateRules = {
        "firstname"         : ["notEmpty"], 
        "lastname"          : ["notEmpty"], 
        "email"             : ["notEmpty"],
    };

    
    this.validateFields = Object.keys(this.validateRules);
    this.loadData();
    this.events();

};

ManagedForm.prototype = new Form(Validators);
ManagedForm.constructor = ManagedForm;

ManagedForm.prototype.submit = function(event) 
{
    var self = this;
    event.preventDefault();

    var button = $(event.submitter).data('job');
    if (button === 'skip') {
        window.location.href = location.origin + '/auth/thank-you';
        return;
    }



    var validated = self.validate();
    self.render(true);
    if (!validated) return;


    this.signup = new Modal('modal', 'spinner-modal', {"spinner": 'spinnerTmpl'});

    this.signup.render("spinner", "Sending invite");
    Server.create('/api/user/create-paywall-managed-user', this.data).done(function(r) {
        console.log(r);
        if (r.success == 1) {
                // set time out used for Firefox which seems to need a little bit more time to figure things out
                // setTimeout('window.location.href = location.origin + "/auth/thank-you";', 2000);
                window.location.href = location.origin + '/auth/thank-you';
        } else {
            self.signup.closeWindow();
        }

    }).fail(function(r) {
        console.log('failed', r);
        self.signup.closeWindow();
    });

        
};






var Progress = function(step) 
{
    this.progress = step > 0 && step < 4 ? step : 1;
    this.numbers = [$('#num1'), $('#num2'), $('#num3')];
    this.lines = [$('#line1'), $('#line2'), $('#line3')];
    this.forms = [$('#signupformview'), $('#activeformview'), $('#userformview')];
    this.labels = [$('#label1'), $('#label2'), $('#label3')];
    this.render();
};
Progress.prototype.tick = function(tick) 
{
    this.progress = tick;
    this.render();
};
Progress.prototype.next = function() 
{
    if (this.progress < 3 ) {
        this.progress++;
    }
    this.render();
};
Progress.prototype.previous = function() 
{
    if (this.progress > 0 ) {
        this.progress--;
    }
    this.render();
};

Progress.prototype.render = function()
{
    for (var i=0;i<this.numbers.length;i++) {
        this.numbers[i].removeClass('subscribe-progress__number--red');
    };
    for (var i=0;i<this.lines.length;i++) {
        this.lines[i].removeClass('subscribe-progress__line--red');
    };
    for (var i=0;i<this.forms.length;i++) {
        this.forms[i].addClass('u-hide');
        // form.removeClass('u-hide');
    };
    for (var i=0;i<this.labels.length;i++) {
        this.labels[i].removeClass('subscribe-progress__label--active');
    };


    for (var i = 0; i < this.progress; i++) {
        this.numbers[i].addClass('subscribe-progress__number--red');
        this.lines[i].addClass('subscribe-progress__line--red');
        this.labels[i].addClass('subscribe-progress__label--active');
    }

    this.forms[this.progress - 1].removeClass('u-hide');
    
    if (this.progress > 1 ) {
        $('#changeplan').addClass('u-hide');
    }
};






if ($('#stripekey').length > 0 && $('#paywallsubscribe').length > 0 ) {
    var urlParams = new URLSearchParams(window.location.search);
    var step = urlParams.get('step');    
    Acme.progress = new Progress(step);
    Acme.progress.render();
    
    var main = $('main');
    var user = {
        user_id : main.data('userid'),
        user_guid : main.data('userguid')
    };
    Acme.subscribe = new SubscribeForm('payment-form', user);
    Acme.subscribe = new ActivateForm('activate-form', Acme.subscribe);
    Acme.managedForm = new ManagedForm('bonusform', Acme.subscribe);
}



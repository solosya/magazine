import { Modal, Server } from './framework';

const DonateModal = function(template, parent, layouts, handler) {
    this.template = template;
    this.parentCont = parent;
    this.layouts = layouts;
    this.parent = Modal.prototype;
    this.handler = handler;
};
DonateModal.prototype = new Modal();
DonateModal.constructor = DonateModal;
DonateModal.prototype.errorMsg = function(msg) {
    $('.message').removeClass('u-hide');
};
DonateModal.prototype.events = function() 
{
    var self = this;
    $('#'+this.parentCont).on("click", function(e) {
        // console.log(self.handler);
        self.handle(e);
    });
};

DonateModal.prototype.handle = function(e) {
    var $elem = this.parent.handle.call(this, e);
    this.handler.call(Acme.donations, e);
};











export const Donations = function(Stripe, params) {
    this.container = document.getElementById(params.container);

    this.active = {};
    this.defaults = {};
    this.userSelected = false;

    // set price on modal load from button click
    this.selectedInterval = null;
    this.selectedAmount = null;
    
    // user selection from ui or defaults
    this.selected = {};

    this.products = [];
    this.pricing = {};

    this.stripe_key = params.stripe_key;
    this.Stripe = Stripe;

    // ajax requests
    this.priceRequests = [];

    this.guest = params.guest || true;
    this.user = {};

    this.validEmail = null;
    this.emailRegex = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    
    self.next = "email-check";

    if (this.guest !== "1") {
        this.fetchUser().done(function(r) {
            if (r.success === 1)
                this.user = r.self;
        });
    }
    this.modal = new DonateModal('donate_modal', 'donate-modal', {
        "donate"        : 'donations',
        "spinner"       : 'spinnerTmpl',
        "register"      : 'registerTmpl',
        "signin"        : 'donateSignupForm',
        "register"      : 'registerTmpl',
        "reset-success" : 'donateResetPassword',
    }, this.handler );

    this.events();
};

Donations.prototype.load = function(force) {
    var self = this;
    try {

        if (Object.keys(self.pricing).length > 0) {
            self.renderPrices();
            return;
        }
    
        self.pricing = {};
    
        this.fetchProducts().done( function(r) {
    
            for (let i = 0; i < r.data.length; i++) {
                if (r.data[i].active) {
                    self.products.push(r.data[i]);
                }
            }
    
            self.fetchPrices().done(function(r) {
                console.log(r);
                var args = Array.prototype.slice.call(arguments);
                if (args[1] === 'success') {
                    args = [args];
                }
                args.forEach(function(priceData) {
                    var data = priceData[0].data;
                    var productId  = priceData[2].productId;       
        
                    var correctProduct = self.products.filter(function(p) {
                        return p.id == productId;
                    })[0]; 
                    
                    correctProduct['prices'] = data;
                });

                if (self.parsePrices() ) {
                    self.renderPrices();
                }
            });
        });
    
    } catch(e) {
        console.log(e);
    }
}

Donations.prototype.fetchProducts = function()
{   
    return Server.fetch('/api/paywall/stripe-products', {});
};

Donations.prototype.fetchPrices = function() {
    var self = this;

    for (let i=0; i<this.products.length; i++) {
        if (typeof this.products[i].metadata.active !== 'undefined' && this.products[i].metadata.active !== "true") {
            continue;
        }
        this.products[i].prices = [];
        this.priceRequests.push( this.fetchPrice(this.products[i]) );
    }
    return $.when.apply(undefined, this.priceRequests);
}


Donations.prototype.fetchPrice = function(product)
{ 
    var req = Server.fetch('/api/paywall/stripe-product-prices', {
        "product" : product.id
    });

    req.productId = product.id;

    return req;
};


Donations.prototype.parsePrices = function(r) {

    for (let idx = 0; idx < this.products.length; idx++) {
        const product = this.products[idx];

        if (typeof product.metadata.active === 'undefined' || product.metadata.active !== 'true') {
            continue;
        }

        var order = ["month", "year", "one_time"];

        if (typeof product.metadata.order !== 'undefined') {
            order = product.metadata.order.split(',');
        }

        this.active[product.id] = order[0];
        this.selected.interval = order[0];

        this.pricing[product.id] = {
            id: product.id,
            name: product.name,
            description: product.description,
            prices: [], 
            intervals: []
        }
        var pricesByInterval = {};


        for (price in product.prices) {
            var price = product.prices[price];
            
            var interval = null;
            if (price.type === "one_time") {
                interval = price.type;
            } else {
                interval = price.recurring.interval;
            }

            if (typeof pricesByInterval[interval] === 'undefined') {
                pricesByInterval[interval] = [];
            }


            // set the default price for each product
            if (typeof price.metadata.default !== 'undefined' && price.metadata.default === 'true') {
                this.defaults[interval] = [price.product, price.id];
            }

            

            var newPrice = {
                "unit_amount": price.unit_amount,
                "price" : price.unit_amount / 100,
                "id" : price.id,
                "product": price.product,
                "currency" : price.currency
            };

            if (this.selectedAmount === newPrice.unit_amount && this.selectedInterval === interval) {
                this.selected.product_id = price.product;
                this.selected.price_id = price.id;
                this.userSelected = true;
                if ( this.guest === "1" ) {
                    this.renderLayout("signin");
                    console.log("returning false");

                    return false;
                }
                this.checkout();
                return false;
        
            }


            var added = false;
            for (var o=0; o < pricesByInterval[interval].length; o++) {
                var current = pricesByInterval[interval][o];
                if (current.unit_amount > newPrice.unit_amount) {
                    pricesByInterval[interval].splice(o,0,newPrice);
                    var added = true;
                    break;
                }
            }

            if (!added) pricesByInterval[interval].push(newPrice);
        }

        for (let i = 0; i < order.length; i++) {
            if (typeof pricesByInterval[order[i]] === 'undefined') {
                continue;
            }
            this.pricing[product.id].prices.push({
                [order[i]] : pricesByInterval[order[i]]
            });
        }

        return true;

    }
}

Donations.prototype.renderPrices = function(r) {

    for (let pricing in this.pricing) {
        const data = this.pricing[pricing];
        data.active = this.active[data.id];
        data.selected = this.selected;
        this.renderLayout("donate", data);
    }
}


Donations.prototype.renderLayout = function(layout, data) {
    if (typeof data === "undefined" || !data || Object.keys(data).length < 1) {
        data= {};
    }

    // this.pages.push(layout);
    // if (layout === "signin") {

    data["class-prefix"] = "donate-";
    data["logo"] = _appJsConfig.templatePath + "/static/images/newsroom-logo.svg";
    data['user'] = this.user;
    data['guest'] = this.guest;
    data['validEmail'] = this.validEmail;
    data['intervalString'] = "";
    if (this.selected.interval === "month" || this.selected.interval === "year") {
        data['intervalString'] = " each " + this.selected.interval;
    }

    if (!this.userSelected && typeof this.defaults[data.active] !== 'undefined') {
        data.selected.price_id = this.defaults[data.active][1];
        data.selected.product_id = this.defaults[data.active][0];
    } 
    this.modal.renderLayout(layout, data);
    this.layoutEvents();
}



Donations.prototype.layoutEvents = function() {
    var self = this;

    var componentPrefix = "donate-login-form";
    var amountInput = document.querySelector('.j-donate-input');
    var usernameInput = document.querySelector('.j-register-username');
    var passwordInput = document.querySelector('.j-signin-password');
    var hide = 'u-display-none';
    var spinner = document.getElementById("email_spinner");
    var retryButton = document.querySelector('.j-retry');
    var proceed = document.querySelector('.j-continue');
    var donate_button = document.getElementById("donate-button");


    
    if (amountInput) {
        amountInput.oninput = function(e) {
            var product = e.target.dataset.product;
            
            // remove the highlight from any selected prices
            var priceButtons = document.querySelector('.j-donation-price');
            if (priceButtons) {
                for(let i=0; i<priceButtons.children.length; i++) {
                    priceButtons.children[i].classList.remove("donate-form__price-button--active");
                }
            }

            // remove all non numeric symbols
            var amount = e.target.value.replace(/[^0-9.]/g, '');
            
            if (amount > 0) {
                self.userSelected = true;
                delete self.selected.price_id;
                self.selected.amount = (parseFloat( amount ) * 100);
                self.selected.product_id = product;
                self.selected.currency = 'aud';
                let displayAmount = self.selected.amount / 100;
                if (displayAmount % 1 !== 0) {
                    displayAmount = displayAmount.toFixed(2);
                }
                donate_button.innerText = "DONATE $" + displayAmount;
            } else {
                self.userSelected = false;
                delete self.selected.amount;
                donate_button.innerText = "DONATE";
            }
        };
    }



    if (passwordInput) {
        passwordInput.oninput = function(e) {
            self.user.password = e.target.value;
        };
    }




    if (usernameInput) {
        usernameInput.focus();
        usernameInput.oninput = function(e) {
            var email = e.target.value
            self.user['username'] = email;

            if ( email != "" ) {
                e.target.classList.add("shrink");
            } else {
                e.target.classList.remove("shrink");
            }
            if (self.emailRegex.test(email)) {
                proceed.classList.add(componentPrefix + '__button--active')
            } else {
                proceed.classList.remove(componentPrefix + '__button--active');
            }
        };
    }




    if (proceed) {
        proceed.addEventListener('click', function(e) {
            e.target.innerText = "";
            spinner.classList.remove(hide);

            
            if (typeof self.next === "undefined" || self.next === null) {
    
                self.checkEmail(self.user.username).done(function(r) {
                    self.validEmail = null;
    
                    // USER IS A GUEST
                    if (r.exists === false) {
                        self.validEmail = false;
                        self.next = "signin";
        
                    // USER EXISTS
                    } else if (r.exists === true) {
                        self.validEmail = true;
                        self.next = "signin";
                    }
                    self.renderLayout('signin');
                });
            }
    
    
            if (self.next === 'signin') {
                self.signin(e.target);
            }

        });


        if (retryButton) {
            retryButton.addEventListener('click', function(e) {
                e.target.classList.add(hide);
                self.user.username = "";
                self.next = null;
                self.validEmail = null;
                self.renderLayout('signin');
            });
        }
    }


}
Donations.prototype.handler = function(e) {
    var self = this;
    e.preventDefault();
    if (typeof e.target.dataset.elem === "undefined") {
        return;
    }

    var elem = e.target.dataset.elem;
    var layout = e.target.dataset.layout;
    var behaviour = e.target.dataset.behaviour;

    if (behaviour === "forgot") {
        var text = document.querySelector('.j-email-text');
        text.classList.remove('highlight');

        if (!self.user.username) {
            text.classList.add('highlight');
            return false;
        }
    
        self.forgot().done(function(r) {
            if (r.success === 1) {
                text.innerHTML = "<strong>A password reset link has been sent to your email.</strong> <br />After reset, enter your new password to continue.";
            } else {
                return {
                    "success": r.success,
                    "error": r.error.email
                };
            }
    
        }).fail(function(r) { console.log(r);});
        return;
    }

    if (layout) {
        self.renderLayout(layout);
        return;
    }


    if (elem === "signin") {
        self.signin(e.target);
        return;
    }

    if (elem === "period") {
        var period = e.target.dataset.period;
        var product = e.target.dataset.product;
        self.selected.interval = period;
        self.active[product] = period;
        self.renderPrices();
        return;
    }

    if (elem === "price") {
        self.selected['price_id'] = e.target.dataset.price_id;
        self.selected['product_id'] = e.target.dataset.product;
        delete self.selected.price;
        self.selected.amount = null;
        self.userSelected = true;
        self.renderPrices();
        return;
    }


    if (elem === "checkout") {
        if ( self.guest === "1" ) {
            self.renderLayout("signin");
            return;
        }
    
        this.checkout();
        return;
    }

};

Donations.prototype.checkout = function() {
    var self = this;

    if (typeof self.selected.product_id === "undefined") {
        return;
    }


    var data = {
        product_id : self.selected.product_id
    };
    if (typeof self.selected.price_id !== 'undefined') {
        data['price_id'] = self.selected.price_id;
    }
    if (typeof self.selected.amount !== 'undefined') {
        data['amount'] = self.selected.amount;
    }
    if (typeof self.selected.interval !== 'undefined') {
        data['interval'] = self.selected.interval;
    }
    if (typeof self.selected.currency !== 'undefined') {
        data['currency'] = self.selected.currency;
    }
    if (typeof self.user.username !== 'undefined') {
        data['email'] = self.user.username;
    }
    if (typeof self.user.email !== 'undefined') {
        data['email'] = self.user.email;
    }

    data['success'] = _appJsConfig.appHostName + "/donation-thanks";
    data['cancel'] = _appJsConfig.appHostName + "/donations";


    Server.create('/api/paywall/checkout-session', data).done( function(r) {
        // console.log(data);
        self.Stripe.redirectToCheckout({
            sessionId: r.sessionId
        }).then(function(r) {
            console.log(r);
        });
    });
}

Donations.prototype.signin = function(elem) {
    var self = this;
    elem.innerText = "";

    var password = document.getElementById('loginPass');
    var errorText = document.querySelector('.j-error-text');
    var spinner = document.getElementById('email_spinner');
    var textElem = document.querySelector('.j-email-text');
    
    var text = "<strong>It looks like you already have a Newsroom account!</strong> <br />Please enter your password to continue.";
    textElem.innerText = "";
    
    spinner.classList.remove("u-display-none");
    errorText.classList.add("u-display-none");
    errorText.innerHTML = "";

    var loginData = {};
    var action = 'register';

    if (self.user.username && self.user.password) {
        action = 'signin';
    }

    if (action === 'signin') {
        loginData['username'] = self.user.username;
        loginData['password'] = self.user.password;
        loginData['rememberMe'] = 1;
        Server.create('/api/auth/login', loginData).done(function(r) {
            console.log(r);
            if (r.success === 1) {
                self.fetchUser().done(function(r) {
                    console.log(r);
                    if (r.success === 1) {
                        self.user = r.self;
                        self.guest = "0";
                    }
                    console.log(r);
                    self.checkout();
                });
        
            } else {

                elem.innerText = "Sign in";
                password.classList.remove("u-display-none");
                textElem.innerHTML = text;
                spinner.classList.add("u-display-none");
                errorText.innerHTML = r.error.password.join("<br />");
                errorText.classList.remove("u-display-none");
            }
        
        }).fail(function(r) { 
            elem.innerText = "Sign in";
            password.classList.remove("u-display-none");
            textElem.innerHTML = text;
            spinner.classList.add("u-display-none");
            errorText.innerHTML = r.error.password.join("<br />");
            errorText.classList.remove("u-display-none");
        });
    }

    if (action === 'register') {
        self.checkout();
        // self.register();
    }

}

Donations.prototype.forgot = function() {
    var self = this;
    return Server.create('/api/auth/forgot-password', {"email": self.user.username});

}

Donations.prototype.register = function() {
    var self = this;
    var password = this.random(20);
    loginData = {
        'email' : this.user.username,
        'firstname' : "Anon",
        'lastname' : "Donor",
        'password' : password,
        'username' : this.random(10),
        'verifypassword': password,
        'captcha': "yes"
    };
    
    Server.create('/api/auth/signup', loginData).done(function(r) {

        if (r.success === 1) {
            self.fetchUser().done(function(r) {
                if (r.success === 1) {
                    self.user = r.self;
                    self.guest = "0";
                }
                console.log(r);
                self.checkout();
            });
        }
});


}



Donations.prototype.random = function(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};



Donations.prototype.checkEmail = function(email) {
    return Server.fetch('/api/user/check-email', {email:email});
}


Donations.prototype.fetchUser = function() {
    return Server.fetch('/api/user/self');
}


Donations.prototype.events = function() {
    var self = this;

    $('#donations, .j-donation').on('click', function(e) {
        self.modal.render("spinner");
        var elem = e.target;
        var data = elem.dataset;
        if (typeof data.interval !== "undefined" && typeof data.amount !== 'undefined') {
            self.selectedInterval = data.interval;
            self.selectedAmount = parseInt(data.amount);
            
        }
        self.load();
    });
   
}
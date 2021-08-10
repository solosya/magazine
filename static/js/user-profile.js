import Handlebars from 'handlebars'
import { Server, Modal } from './framework'
import { Templates } from './article-templates'
import { SigninModal }  from './signinModal'
import Card from './StripeCard'


export const UserProfileController = function()
{
    this.mailChimpUser  = false;
    this.emailLists     = [];
    // test mailchimp accounts
    // this.newsroom       = '17ba69a02c';
    // this.group          = 'cb03aca14d'; // me
    
    
    this.newsroom       = '2412c1d355';
    this.group          = 'f6f5aaa06b';

    this.modal = new SigninModal('modal', 'signin-modal', {
        "spinner"       : 'spinnerTmpl',
        "userPlan"      : 'userPlanMessage',
        "userPlanChange" : 'userPlanOkCancel'
    } );

    this.stripekey = $('#stripekey').html();
    this.stripe = Stripe(this.stripekey);
    const StripeCard = new Card();
    this.card = StripeCard.get(this.stripe);

    this.events();
    this.userEvents();
    // this.listingEvents();
    this.fetchEmailLists();
};

UserProfileController.prototype.updateCardForm = function() {


}
UserProfileController.prototype.subscribeToEmail = function(user, group) {
    

    var data = {
        list   : this.newsroom,
        group  : group,
        user   : user,
        action : 'create',
    };

    return Server.create( _appJsConfig.baseHttpPath + '/api/integration/mailchimp-subscription', data).done(function(r) {
        console.log(r);
    });

};


UserProfileController.prototype.fetchUserMailchimpStatus = function(list) {

    var requestData = {
        action: 'get',
        list: list
    };

    return Server.create(_appJsConfig.baseHttpPath + '/api/integration/mailchimp-subscription', requestData );

};


UserProfileController.prototype.fetchEmailLists = function() {

    var self = this;

    Server.fetch( _appJsConfig.baseHttpPath + '/api/integration/mailchimp-get-list-data?list='+this.newsroom+'&group='+this.group).done(function(data) {

        if (typeof data.data.interests != 'undefined') {
            self.emailLists = data.data.interests;
        }

        var emails    = Handlebars.compile(Templates.mailchimpList);



        self.fetchUserMailchimpStatus(self.newsroom).done(function(status) {

            self.mailChimpUser = status.data === false ? false : true;

                for (var i=self.emailLists.length -1; i > -1; i--) {
                    var checked = '';
                    var name = self.emailLists[i].name;

                    if ( status.data !== false && status.data.interests[self.emailLists[i].id] === true && status.data.status !== 'unsubscribed' ) {
                        checked = 'checked';
                    }

                    if (self.emailLists[i].name.toLowerCase() == 'daily summaries') {
                        name = "Send me Jonathan Milne's <i>8 Things</i> email each day";
                    }

                    if (self.emailLists[i].name.toLowerCase() == 'breaking news alerts') {
                        name = "Send me an email alert when important news breaks";
                    }

                    var params = {
                        listId: self.newsroom,
                        groupId: self.emailLists[i].id,
                        name: name,
                        checked: checked
                    };
    
                    
                    $('#account-form__email').append( emails(params) );
                }

        });
    });

};




UserProfileController.prototype.deleteUser = function(e) {

    var user = $(e.target).closest('li');
    var userid = user.attr("id");

    var mailChimpData = {
        user    : userid,
        list    : this.newsroom,
        action  : 'unsubscribe'
    }

    // first remove from email lists
    Server.create( _appJsConfig.baseHttpPath + '/api/integration/mailchimp-subscription', mailChimpData).done(function(r) {

        var requestData = { 
            id: userid, 
        };


        Server.create(_appJsConfig.baseHttpPath + '/user/delete-managed-user', requestData).done(function(data) {
            if (data.success == 1) {
                user.remove();
                $('#addManagedUser').removeClass('hidden');
                var usertxt = $('.profile-section__users-left').text();
                var usercount = usertxt.split(" ");
                var total = usercount[2];
                usercount = parseInt(usercount[0]);
                $('.profile-section__users-left').text((usercount - 1) + " of " + total + " used.");
            } else {
                var text = '';
                for (var key in data.error) {
                    text = text + data.error[key] + " ";
                } 
                $('#createUserErrorMessage').text(text);
            }
        }).fail((r)=> {
            $('#createUserErrorMessage').text(r.textStatus);
        });
    });
};

UserProfileController.prototype.renderUser = function(parent, data, template) {

    var userTemp = template ? Handlebars.compile(template) : Handlebars.compile(Templates.managed_user);
    if (data.constructor != Array) {
        data = [data];
    }
    var html = '';
    for (var i = 0; i < data.length; i++) {
        html += userTemp(data[i]);
    }

    parent.empty().append(html);
};

UserProfileController.prototype.render = function(data) 
{
    var self = this;
    var data = data.users.users || data.users;
    var users = [];
    for (var i=0; i< data.length; i++) {
        users.push({
            firstname: data[i].firstname, 
            lastname:  data[i].lastname, 
            username:  data[i].username, 
            useremail: data[i].email,
            id: data[i].id
        });
    }
    self.renderUser(($('#mangedUsers')), users);
    self.userEvents();
};

UserProfileController.prototype.search = function(params) 
{   
    var self = this;
    this.fetch(params, 'search-managed-users').done(function(data) {
        self.render(data);
    });
};

UserProfileController.prototype.fetchUsers = function(params) 
{   
    var self = this;
    this.fetch(params, 'load-more-managed').done(function(data) {
        self.render(data);
    });
};

UserProfileController.prototype.fetch = function(params, url) 
{
    var url = _appJsConfig.appHostName + '/api/user/'+ url;
    return Server.fetch(url, params);
};



UserProfileController.prototype.userEvents = function() 
{
    var self = this;


    $('.j-edit').unbind().on('click', function(e) {

        var listelem = $(e.target).closest('li');
        var userid = listelem.attr("id");

        function getUserData(func) {
            return {
                firstname: listelem.find('.j-firstname')[func](), 
                lastname:  listelem.find('.j-lastname')[func](), 
                username:  listelem.find('.j-username')[func](), 
                useremail: listelem.find('.j-email')[func](),
            };
        };

        var data = getUserData("text");
        var userTemp = Handlebars.compile(Templates.edit_user);
        var html = userTemp(data);
        listelem.empty().append(html);

        $('#cancelUserCreate').on('click', function(e) {
            self.renderUser(listelem, data);
            self.userEvents();
        });

        $('#saveUser').on('click', function(e) {

            var requestData = getUserData("val");
            requestData.id = userid;

            Server.create(_appJsConfig.baseHttpPath + '/home/edit-managed-profile', requestData).done((data) => {
                if (data.success == 1) {
                    self.renderUser(listelem, requestData);
                    $('#addManagedUser').removeClass('hidden');
                    $('#createUserErrorMessage').text('');

                } else {
                    var text = '';
                    for (var key in data.error) {
                        text = text + data.error[key] + " ";
                    } 
                    $('#createUserErrorMessage').text(text);
                }
                self.userEvents();

            }).fail((r) => {
                $('#createUserErrorMessage').text(r.textStatus);
            });     
        });
    });  

    $('.j-delete').unbind().on('click', function(e) {

        const modal = new Modal('modal', 'signin-modal', {
            "userPlanChange" : 'userPlanOkCancel'
        });
        modal.render("userPlanChange", "Are you sure you want to delete this user?")
            .done(function() {
                self.deleteUser(e);
            });
    });   
};




UserProfileController.prototype.events = function () 
{
    var self = this;

    $('#portal-session').on('click', function(e) {
        const button = $(this);
        button.text('Opening...');
        e.preventDefault();
        Server.create(_appJsConfig.baseHttpPath + '/api/paywall/user-portal-session').then(function(r){
            // console.log(r.session.url);
            if (typeof r.session.url !== 'undefined') {
                const blah = window.open(r.session.url, 'donations', '_blank');
                button.text("Manage my donations");
                // window.location = r.session.url;
                // window.location.replace(r.session.url)
            }
        });

    });


    $('#account-form__email').unbind().on('click', function(e) {
        var elem = $(e.target);
        
        var action = elem.is(':checked') 
            ? self.mailChimpUser 
                ? 'subscribe' : 'create'
            : 'unsubscribe';

        var ids = elem.val().split(':');

        requestData = {
            list    : ids[0],
            group   : ids[1],
            action  : action
        };

        Server.create(_appJsConfig.baseHttpPath + '/api/integration/mailchimp-subscription', requestData )
            .done(function(r) {
                if (r.success == 1) {
                    self.mailChimpUser = true;
                    // var msg = 'Succesfully ' + action + 'd ' + actionVerb + ' ' + self.emailLists[requestData['list']];
                    // $("#account-form__email").prepend('<p>' + msg + '</p>');
                }
            }).fail(function(e) {
                $('#createUserErrorMessage').text(e.errorText);
            });
    });

    $('#profile-form').submit( function(e){
        // NOTE this form also uses validation from the stripe subscribe form
        // purely by accident as the event listeners in THAT form are generic.

        // Will need to separate if it becomes a problem but for now it works
        // The following stops submit and adds error text

        e.preventDefault();
        var errorText = '';

        if ( $('#firstname').val() == '' ) {
            errorText += "First name cannot be empty. <br />";
        }
        if ( $('#lastname').val() == '' ) {
            errorText += "Last name cannot be empty.  <br />";
        }

        if ($('#email').val() == '' ) {
            errorText += "Email cannot be empty. ";
        }

        $("#account-form__errorText").html(errorText);
        
        if (!errorText) {
            $(this).unbind('submit').submit()
        }
    });

    $('#message-close').on('click', function(e) {
        e.preventDefault();
        var parent = $(this).parent().remove();
    });

    $('#managed-user-search').on('submit', function(e) {
        e.preventDefault();
        var search = {};
        $.each($(this).serializeArray(), function(i, field) {
            search[field.name] = field.value;
        });
        self.search(search);
        $('#user-search-submit').hide();
        $('#user-search-clear').show();

    });

    $('#user-search-clear').on('click', function(e) {
        e.preventDefault();
        self.fetchUsers();
        $('#managed-user-search-field').val('');
        $('#user-search-submit').show();
        $('#user-search-clear').hide();
    });



    $('#addManagedUser').on('click', function(e) {
        e.preventDefault()
        var userTemp = Handlebars.compile(Templates.create_user);
        var data = {
            firstname: "First name", 
            lastname:  "Last name", 
            username:  "Username", 
            useremail: "Email",
        };

        var html = '<li id="newUser" class="user-editor user-editor__add"><p class="text-button">Add User</p>' + userTemp(data) + '</li>';

        $('#createManagedUser').append(html);
        $('#newuserfirstname').focus();
        $('#addManagedUser').addClass('hidden');
        $('#nousers').addClass('hidden');

        $('#saveUser').on('click', function(e) {
            $('#userError').text("");

            var requestData = { 
                firstname: $('#newuserfirstname').val(), 
                lastname:  $('#newuserlastname').val(), 
                username:  Math.floor(100000000 + Math.random() * 9000000000000000), 
                useremail: $('#newuseruseremail').val(),
            };
            
            var errorText = "";
            if (requestData.firstname === ""){
                errorText += "First name cannot be blank. ";
            }
            if (requestData.lastname === ""){
                errorText += "Last name cannot be blank. ";
            }
            // if (requestData.username === ""){
            //     errorText += "Username cannot be blank. ";
            // }
            if (requestData.useremail === ""){
                errorText += "Email cannot be blank. ";
            }
            if (errorText != "") {
                $('#userError').text(errorText);
                return;
            }
            
            
            $('#user-editor__spinner').addClass('spinner');

            Server.create(_appJsConfig.baseHttpPath + '/user/create-paywall-managed-user', requestData).done((data) => {
                $('#user-editor__spinner').removeClass('spinner');

                if (data.success == 1) {

                    var groups = self.emailLists.map(function(g) {
                        return g['id'];
                    });

                    self.subscribeToEmail(data.user, groups);

                    location.reload(false);             
                } else {
                    var text = '';
                    for (var key in data.error) {
                        text = text + data.error[key] + " ";
                    } 
                    $('#createUserErrorMessage').text(text);
                }
            }).fail((r) => {
                $('#user-editor-buttons').removeClass('spinner');
                $('#createUserErrorMessage').text(r.textStatus);
            });
        });

        $('#cancelUserCreate').on('click', function(e) {
            $('#newUser').remove();
            $('#addManagedUser').removeClass('hidden');
            $('#createUserErrorMessage').text('');
        });
    });



    $('#cancelAccount').on('click', function(e) {
        e.preventDefault();
        // var listelem = $(e.target).closest('li');

        let status = 'cancelled';
        let message = "Are you sure you want to cancel your plan?"
        if ($(e.target).text() == 'Restart Subscription') {
            message = "Do you want to reactivate your plan? You will be billed on the next payment date."
            status = 'paid'
        }
        const requestData = { 
            status: status, 
        };


        const modal = new Modal('modal', 'signin-modal', {
            "userPlanChange" : 'userPlanOkCancel'
        });

        modal.render("userPlanChange", message)
            .done(function(r) {

                $('#dialog').parent().remove();


                Server.create(_appJsConfig.baseHttpPath + '/user/paywall-account-status', requestData).done((data) => {
                    
                    if (data.success == 1) {
                        window.location.reload(false);             
                    } else {
                        let text = '';
                        for (let key in data.error) {
                            text = text + data.error[key] + " ";
                        } 
                        $('#createUserErrorMessage').text(text);
                    }

                }).fail((r) => {
                    $('#createUserErrorMessage').text(r.textStatus);
                });
       
            }); 
    });       


    $('.j-setplan').on('click', function(e) {
        e.stopPropagation();

        const modal = new Modal('modal', 'signin-modal', {
            "userPlan" : 'userPlanMessage',
            "userPlanChange" : 'userPlanOkCancel'
        });


        let newPlan = $(e.target);
        if (!newPlan.hasClass('j-setplan')) {
            newPlan = $(e.target.parentNode);
        }
        
        const currentPlan      = $('#currentPlanStats');
        const cardSupplied     = currentPlan.data("cardsupplied");

        const currentUserCount = +currentPlan.data('currentusers');
        const oldcost          = +currentPlan.data('currentcost');
        const oldPlanPeriod    = +currentPlan.data('currentplanperiodcount');
        const expDate          =  currentPlan.data('expiry');
        let olddays            =  currentPlan.data('currentperiod');
        const oldPlanType      =  currentPlan.data('currenttype');

        const planusers        = +newPlan.data('planusercount');
        const newcost          = +newPlan.data('plancost');
        const newPlanPeriod    = +newPlan.data('planperiodcount');
        let newdays            =  newPlan.data('planperiod');
        const newPlanType      =  newPlan.data('plantype');


        if (currentUserCount > 0 && currentUserCount > planusers) {
            modal.render("userPlan", "You have too many users to change to that plan.");
            return;
        }

        // if it looks like there's a bug where the price to change plan
        // seem ridiculously high, check the expiry date of the user!!!
        if (newdays == 'week')  {newdays = 7;}
        if (newdays == 'month') {newdays = 365/12;}
        if (newdays == 'year')  {newdays = 365;}
        if (olddays == 'week')  {olddays = 7;}
        if (olddays == 'month') {olddays = 365/12;}
        if (olddays == 'year')  {olddays = 365;}
        newdays = newdays * newPlanPeriod;
        olddays = olddays * oldPlanPeriod;
        const newplandailycost = newcost / newdays;
        const plandailycost = oldcost/olddays;


        let msg = "";
        let newCharge = 0;
        if (( newPlanType == 'article' && oldPlanType !== 'time') || ( newPlanType == 'time' && oldPlanType === 'article') ) {
            newCharge = newcost / 100;
        }

        if (oldPlanType === 'signup' ) {
            newCharge = newcost / 100;
        }
        
        if (oldPlanType === 'time' && newPlanType === 'time' && newcost < oldcost ) {
            newCharge = 0;
        }

        const _MS_PER_DAY = 1000 * 60 * 60 * 24;
        function dateDiffInDays(a, b) {
            // Discard the time and time-zone information.
            const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
            const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
          
            return Math.floor((utc2 - utc1) / _MS_PER_DAY);
          }
          

        const expiryObj = new Date(expDate);
        const today = new Date();
        
        // var diffTime = Math.abs(today.getTime() - expiryObj.getTime());
        // var diffDays1 = Math.ceil(diffTime / (1000 * 3600 * 24)); 
        const diffDays = dateDiffInDays(today, expiryObj); 
        // var diffDays = moment(expDate).diff(moment(), 'days');

        // more expensive time base plan changes require a charge that is the difference in cost between the two
        if (oldPlanType === 'time' && newPlanType === 'time' && diffDays > 0) {
            if ((newplandailycost-plandailycost) * diffDays >= 0) {
                newCharge = Math.round((( newplandailycost-plandailycost) * diffDays) / 100 );
            }
        }

        if (newCharge > 0) {
            msg = "<p>This will cost $" + newCharge.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,') + ".</p>";
        }

        if (cardSupplied === 'f' ) {
            msg = msg + "However, you will need to supply your credit card details. You can enter those on this page and then we can finalise the plan change.";
            self.modal.render("userPlan", "Almost there! ", {message: msg});
            return;
        }

        const requestData = { 
            planid: newPlan.data('planid') 
        };



        const changeModal = new Modal('modal', 'signin-modal', {
            "userPlanChange" : 'userPlanOkCancel'
        });

        changeModal.render("userPlanChange", "Are you sure you want to change plan?" + msg)
            .done(function() {
                // console.log('donee!!');
                $('#dialog').parent().remove();

                Server.create(_appJsConfig.baseHttpPath + '/user/change-paywall-plan', requestData).done((data) => {
                    if (data.success == 1) {
                        window.location.reload();
                    } else {
                        $('#dialog').parent().remove();
                        self.modal.render("userPlan", data.error);
                    }

                }).fail((r) => {
                    $('#createUserErrorMessage').text(r.textStatus);
                });
            }); 
    });



    var udform = document.getElementById('update-card-form');
    if (udform != null) {
        udform.addEventListener('submit', function(event) {

            event.preventDefault();

            
            self.modal.render("spinner", "Your request is being processed.");

            const errorElement = document.getElementById('card-errors');

            errorElement.textContent = '';
            // const stripe = Stripe(self.stripekey);
            self.stripe.createToken(self.card).then(function(result) {
                // console.log(result);
                if (result.error) {
                    self.modal.closeWindow();

                    // Inform the user if there was an error
                    var errorElement = document.getElementById('card-errors');
                    errorElement.textContent = result.error.message;
                } else {
                    // Send the token to your server

                    const formdata = {"stripetoken":result.token.id}
                    Server.create(_appJsConfig.baseHttpPath + '/user/update-payment-details', formdata).done((r) => {
                        self.modal.closeWindow();
                        if (r.success === true) {
                            location.reload();
                        }
                    });
                }
            });
        });
    }


};




// UserProfileController.prototype.listingEvents = function() {
//     var self = this;

//     $('.j-deleteListing').unbind().on('click', function(e) {
//         e.preventDefault();
//         const listing = $(e.target).closest('a.card');
//         const id      = listing.data("guid");
//         self.modal.render("userPlanChange", "Are you sure you want to delete this listing?")
//             .done(function() {
//                 Server.create('/api/article/delete-user-article', {"articleguid": id}).done(function(r) {
//                     listing.remove();
//                 }).fail(function(r) {
//                     // console.log(r);
//                 });
//             });
//     });  
// };

    
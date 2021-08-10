import { View } from './framework'


/***                             ****
    Base Class for all Forms
***                              ****/
export const Form = function(validators, rules) {
    this.data;
    this.errorField;
    this.validators = validators || null;
    this.validateRules = rules || {};
};
    Form.prototype = new View();
    Form.constructor = Form;
    Form.prototype.loadData = function()
    {
        for (var field in this.validateFields) {
            var fieldname = this.validateFields[field].split('.').reverse()[0];
            var field = $('#'+fieldname);
            if (!field.length) {
                field = $('#'+ this.id + ' input[name="'+fieldname + '"]');
            }
            if (!field.length) {
                continue;
            }
            var fieldType = field[0].type;
            if (fieldType === 'hidden') continue;
            
            if (fieldType === 'checkbox') {
                this.data[fieldname] = field[0].checked;
            } else {
                this.data[fieldname] = field.val();
            }
        }
    };
    Form.prototype.clearInlineErrors = function()
    {
        if (this.errorField) {
            this.errorField.removeClass('active');
        }
        for (var field in this.validateFields) {
            var fieldname = this.validateFields[field].split('.').reverse()[0];
            var field = $('#'+fieldname);
            if (!field.length) {
                // console.log('#'+ this.id + ' input[name="'+this.errorFields[field] + '"]');
                field = $('#'+ this.id + ' input[name="'+this.errorFields[field] + '"]');
            }
            field.removeClass('formError');
        }
    };
    Form.prototype.addInlineErrors = function()
    {
        if (this.errorFields.length > 0 && this.errorField) {
            this.errorField.addClass('active');
        }
        for (var field in this.errorFields) {
            var field = $('#'+this.errorFields[field]);

            if (!field.length) {
                // console.log('#'+ this.id + ' input[name="'+this.errorFields[field] + '"');
                field = $('#'+ this.id + ' input[name="'+this.errorFields[field] + '"');
            }
            field.addClass('formError');
        }
    };
    Form.prototype.render = function() {
        this.clearInlineErrors();
        this.addInlineErrors();
    };
    Form.prototype.validate = function( /* Array */ checkFields)  {
        // console.log(checkFields);
        // checkFields is used to validate a single field, 
        // otherwise itereate through all compulsory fields

        // intersect used to clear the field we want to check 
        // from errorFields.  if still an error it will add again.

        function intersect(a, b) {
            var t;
            if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
            return a.filter(function (e) {
                return b.indexOf(e) > -1;
            });
        }

        var validated = true, fields = [];
        if (checkFields && this.validateFields) {

            var fields = intersect(this.validateFields, checkFields);
            for (var j=0; j<fields.length;j++) {
                var fieldName = fields[j].split('.').reverse()[0];
                var index = this.errorFields.indexOf(fieldName);
                if (index === -1) break;
                this.errorFields.splice(index, 1);
            }
        } else {
            var fields = this.validateFields || [];

            this.errorFields = []; // reset and re-calcuate all fields
        }
        for (var i=0;i<fields.length; i++) {
            var key = fields[i];
            // console.log(key);
            var keySplit = key.split('.');
            var scope = this.data;
            for(var j=0; j<keySplit.length; j++) {

                if (!scope[keySplit[j]]) {
                    scope = false;
                    break;
                }
                if(j == keySplit.length -1 ) {
                    scope = scope[keySplit[j]];
                    break;
                }
                scope = scope[keySplit[j]];
            }
            // console.log('doing the validate');
            // DO THE VALIDATE!!!
            var fieldValidators = this.validateRules[key];
            if (fieldValidators.length > 0) {

                var fieldname = fields[i].split('.').reverse()[0];
                // console.log(fieldname);
                for (var k=0; k<fieldValidators.length; k++) {
                    // console.log(scope);
                    if ( !this.validators[ fieldValidators[k] ](scope) ) {
                        this.errorFields.push(fieldname); 
                        // console.log(this.errorFields);
                        validated = false;
                        break;
                    }
                }
            }
        }
        return validated;
    };

    Form.prototype.events = function( /* Array */ checkFields)  {
        var self = this;
        // console.log('running events from parent');
        // console.log(this.id);
        // console.log($("#"+this.id));
        // console.log('#'+this.id +' input, #'+this.id +' textarea');
        $('#'+this.id +' input, #'+this.id +' textarea').on("change", function(e) {
        // $('input, textarea').on("change", '#'+this.id, function(e) {

            e.stopPropagation();
            e.preventDefault();
            var data = {};
            var elem = $(e.target);
            var elemid = elem.attr('name');
            var inputType = elem.attr('type');

            if (inputType == 'text' || inputType == 'email' || inputType == 'password') {
                data[elemid] = elem.val();

            } else if (inputType =='checkbox') {
                var value = elem.is(":checked");
                data[elemid] = value;
            }

            self.updateData(data);

            var validated = self.validate([elemid]);
            self.render();
        });

        var form = document.getElementById(this.id);
        if (form != null) {
            form.addEventListener('submit', function(event) {
                self.submit(event);
            });
        }


    }



export const Validators = {
    'notEmpty' : function(input) {
        return !input ? false : true;
    },
    'isNumeric' : function(n) {
        // var ret = !isNaN(parseFloat(n)) && isFinite(n);
        return !isNaN(parseFloat(n)) && isFinite(n);
    },
    'username' : function(text) {
        return (text.length > 4);
    },  
    'isTrue' : function(data) {
        return (data === 'true' || data === true) ? true : false;
    }
};

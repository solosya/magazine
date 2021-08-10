export const Token = function(tokenName) 
{
	this.hasLocal	= typeof localStorage != "undefined" ? true : false;
	this.keyName 	= tokenName;
	this.token 		= {};
	var self 		= this;

};

Token.prototype.getToken = function() 
{
	if ( this.hasLocal ) {
	    this.token = localStorage.getItem(this.keyName);
	    return this.token && JSON.parse(this.token);

	} 
};
Token.prototype.setToken = function(value) 
{
	if ( this.hasLocal ) {
	    localStorage.setItem(this.keyName, value);
	}
};
Token.prototype.removeToken = function() 
{	
	if ( this.hasLocal ) {
	    return localStorage.removeItem(this.keyName);
	}
};
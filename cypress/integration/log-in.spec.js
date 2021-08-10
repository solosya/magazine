
describe('Logging In - XHR Web Form', function () {

    
    const username = Cypress.env('username');
    const password = Cypress.env('password');
    const loginurl = '/api/auth/login';
    const sessionID = Cypress.env('sessionId');
  
    context('XHR form submission', function () {
      
      beforeEach(function () {
        cy.visit('/')
      });
  



      it('successfully logs in', () => {
        cy.server();
        cy.route({
            method: 'POST',
            url: loginurl,
        }).as('loginRoute')

        cy.get("#signinBtn").click();
        cy.get("#loginName").type(username).should('have.value', username);
        cy.get("#loginPass").type(password).should('have.value', password);
        cy.get("#modal-signinBtn").click();
        cy.wait('@loginRoute');

        cy.getCookie(sessionID).should('exist');
        cy.getCookie('cog-product-user').should('exist');

        cy.visit('/paywall-type-section/test-paywalled-article-paid');
        cy.get('[data-test=article]')
      });
  


      it('displays errors on login', function () {
        cy.server()
  
        // alias this route so we can wait on it later
        cy.route('POST', loginurl).as('postLogin')
  
        // incorrect username on password
        cy.get("#signinBtn").click();
        cy.get("#loginName").type(username).should('have.value', username);
        cy.get("#loginPass").type('password123').should('have.value', 'password123');
        cy.get("#modal-signinBtn").click();

        cy.wait('@postLogin')
  
        cy.get('.login-form__error_text')
        .should('be.visible')
        .and('contain', 'Invalid Email or Password')
  
      })
  


    it('can stub the XHR to force it to fail', function () 
    {

        cy.server();
  
        cy.route({
          method: 'POST',
          url: loginurl,
          status: 503,
          response: {},
        }).as('postLogin');
  
        cy.get("#signinBtn").click();
        cy.get("#loginName").type(username).should('have.value', username);
        cy.get("#loginPass").type('password123').should('have.value', 'password123');
        cy.get("#modal-signinBtn").click();

        cy.wait('@postLogin')
        .its('requestBody')
        .should('eq', "username="+username+"&password=password123&rememberMe=1");
  
        // we should have visible errors now
        cy.get('.login-form__error_text')
        .should('be.visible')
        .and('contain', 'Invalid Email or Password');
  
      });
  
      it('can bypass the UI and yet still log in', function () {
        cy.loginByModal(username, password, loginurl);
    
        // just to prove we have a session
        cy.getCookie(sessionID).should('exist')
        cy.visit('/paywall-type-section/test-paywalled-article-paid');
        cy.get('[data-test=article]')

      });
    
    });
  

});
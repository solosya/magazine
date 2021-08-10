
describe('Logging In - XHR Web Form', function () {

    
    const username = Cypress.env('paywalluser');
    const password = Cypress.env('paywallpass');
    const loginurl = '/api/auth/login';
    const sessionCookieName = Cypress.env('sessionId');
  
    context('XHR form submission', function () {

        before(function() {
            cy.loginByModal(username, password, loginurl);
            cy.getCookie(sessionCookieName)
            .should('exist')
            .its('value')
            .should('be.a', 'string')
            .as('sessionCookie');
        
        });

        beforeEach(function () {
            cy.setCookie(sessionCookieName, this.sessionCookie)
        });
  



        it('successfully logs in', () => {
            cy.visit('/');
            cy.get('[data-test=my-account-link]');
            cy.get('[data-test=my-account-link]').click();
            

        });



    });
});

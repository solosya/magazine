export default class StripeCard {
    
    get(stripe) {

    // Create an instance of Elements
        var elements = stripe.elements();

        // Custom styling can be passed to options when creating an Element.
        // (Note that this demo uses a wider set of styles than the guide below.)
        var style = {
            base: {
                color: '#32325d',
                lineHeight: '24px',
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': {
                    color: '#aab7c4'
                }
            },
            invalid: {
                color: '#fa755a',
                iconColor: '#fa755a'
            }
        };

        // Create an instance of the card Element
        const Card = elements.create('card', {style: style});

        // Add an instance of the card Element into the `card-element` <div>
        const cardElement = document.getElementById('card-element');
        if (cardElement != null) {
            Card.mount('#card-element');
        }

        // Handle real-time validation errors from the card Element.
        Card.addEventListener('change', function(event) {
            var displayError = document.getElementById('card-errors');
            displayError.textContent = '';
            if (event.error) {
                displayError.textContent = event.error.message;
            } 
        });

        return Card;
    }
}
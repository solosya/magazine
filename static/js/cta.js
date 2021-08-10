export default class CTA {
    run() {

        var footerCta = document.getElementById('cta-footer-button');
        if (footerCta) {
            footerCta.addEventListener('click', function(e) {
                var form = document.querySelector('.j-cta-footer-form');
                this.classList.add('d-none');
                form.classList.remove('d-none');
            });
        }
        
        var bodyCta = document.getElementById('cta-body-signtoggle');
        if (bodyCta) {
            bodyCta.addEventListener('click', function(e) {
                this.classList.add('d-none');
                var buttons = document.querySelectorAll('.j-cta-body-buttons');
                for (var i=0; i<buttons.length; i++) {
                    buttons[i].classList.add('d-none');
                    buttons[i].classList.remove('d-md-block');
                }
                var form = document.querySelector('.j-cta-body-form');
                form.classList.remove('d-none');
            });
        }
        
        
        var sideCta = document.querySelector('.j-cta-side-signtoggle');
        if (sideCta) {
            sideCta.addEventListener('click', function(e) {
                var form = document.querySelector('.j-cta-side-form');
                this.classList.add('d-none');
                form.classList.remove('d-none');
            });
        }
    }
}
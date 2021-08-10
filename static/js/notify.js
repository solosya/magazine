

export default class Notify {



    render(options) {
        var tag = document.createElement("div");
        tag.classList.add("c-notify");
        var textNode = document.createTextNode(options.message);
        tag.appendChild(textNode);


        if (options.type === 'success') {
            tag.classList.add("c-notify--success");
        }
        if (options.type === 'error') {
            tag.classList.add("c-notify--error");
        }

        document.body.appendChild(tag);
        setTimeout( () => { 
            tag.classList.add("c-notify--active");
        }, 0);


        
        if (typeof options.closeWith === 'undefined') {
            setTimeout( () => { 
                tag.classList.remove("c-notify--active");
                // tag.parentNode.removeChild(tag);
            }, options.timeout);
        } else {
            if (options.closeWith === "click") {
                tag.addEventListener('click', function(e) {
                    this.classList.remove("c-notify--active");
                });
            }
        }
    }

    
}
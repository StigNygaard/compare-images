/**
 *  <compare-images/> module script
 *  Needs to be located together with the compare-images.css stylesheet.
 *
 *  For info or the latest version, see https://github.com/StigNygaard/compare-images
 */

const scriptURI = import.meta.url;
const LOG = false;

/**
 * Creates an HTML element with the specified tag name, attributes, and content.
 *
 * @param {string} tagName - The tag name of the element to create.
 * @param {object} attributes - An object containing the attributes to set on the element.
 * @param {...(string | Node)} content - Content to be added to the element. Can be strings and Node objects.
 * @returns {HTMLElement} - The created HTML element.
 */
function cr(tagName, attributes = {}, ...content) {
    const element = document.createElement(tagName);
    for (const [attr, value] of Object.entries(attributes)) {
        if (value === false) {
            // Ignore - Don't create attribute (the attribute is "disabled")
        } else if (value === true) {
            element.setAttribute(attr, attr); // xhtml-style "enabled" attribute
        } else {
            element.setAttribute(attr, String(value));
        }
    }
    if (content?.length) {
        element.append(...content);
    }
    return element;
}

/**
 * Class representing the <compare-images/> webcomponent.
 */
class CompareImages extends HTMLElement {

    // Fires when an instance of the element is created or updated
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    // Fires when an instance was inserted into the document
    connectedCallback() {
        const basestyles = new URL('compare-images.css', scriptURI);
        this.shadowRoot.appendChild(cr('link', {rel: 'stylesheet', id: 'basestyles', href: basestyles.href}));
        this.#init();
    }

    // Fires when an instance was removed from the document
    disconnectedCallback() {
        if (this.shadowRoot) {
            this.shadowRoot.replaceChildren();
        }
    }

    static get observedAttributes() {
        return [];
    }

    // Fires when an observed attribute was added, removed, or updated
    attributeChangedCallback(attrName, oldVal, newVal) {
        LOG && console.log(`Attribute ${attrName} changing from ${oldVal} to ${newVal}...`);
    }

    // Fires when an element is moved to a new document
    adoptedCallback() {
        console.warn('adoptedCallback: element is moved to a new document!');
    }

    #init() {
        const skeleton = cr('div', {'class': 'image-split'},
            cr('slot', {'class': 'part left', 'name': 'left'}),
            cr('slot', {'class': 'part right', 'name': 'right'}),
            cr('slot', {'class': 'unnamed'})
        );
        this.shadowRoot.appendChild(skeleton);
        const leftPart = this.shadowRoot.querySelector('.part.left');
        const rightPart = this.shadowRoot.querySelector('.part.right');
        const unnamed = this.shadowRoot.querySelector('.unnamed');
        if (leftPart.assignedElements().length === 0 && unnamed.assignedElements().length) {
            unnamed.assignedElements()[0].slot = 'left';
        }
        if (rightPart.assignedElements().length === 0 && unnamed.assignedElements().length) {
            unnamed.assignedElements()[0].slot = 'right';
        }
        unnamed.remove();
        const leftImage = leftPart.assignedElements()[0];
        const rightImage = rightPart.assignedElements()[0];
        if (leftImage && rightImage) {
            this.#splitOperator(this, leftImage, rightImage);
        } else {
            console.error('compare-images: Error in declaration of images to compare');
        }
    }

    #splitOperator(host, leftImage, rightImage) {

        let dragStart = false;
        const root = host.shadowRoot;
        const leftPart = root?.querySelector('.part.left');
        const container = root?.querySelector('.image-split')
        if (root) {
            createHandle();
            bindEvents();
        }

        function createHandle() {
            container.appendChild(cr('div', {class: 'draghandle', draggable: true}));
        }

        function bindEvents() {
            function startHandler(e) { // pointerdown?
                e.preventDefault();
                e.stopPropagation();
                markDragStart();
            }
            function moveHandler(e) { // pointermove?
                if (isDragStart()) {
                    const moveX = e.type === 'touchmove' ? e.changedTouches[0].clientX : e.clientX;
                    update(moveX);
                }
            }
            function endHandler() { // pointerup/pointercancel/pointerout/pointerleave?
                markDragEnd();
            }
            const dragHandle = getDragHandle();
            dragHandle.addEventListener('mousedown', startHandler, false);
            dragHandle.addEventListener('touchstart', startHandler, false);
            container.addEventListener('mousemove', moveHandler, false);
            container.addEventListener('touchmove', moveHandler, false);
            document.addEventListener('mouseup', endHandler, false);
            document.addEventListener('touchend', endHandler, false);
            document.addEventListener('touchcancel', endHandler, false);
        }

        function getDragHandle() {
            return root.querySelector('.draghandle');
        }

        function getPositionByOffset(offsetX) {
            const prePosition = (offsetX - host.getBoundingClientRect().left) * 100 / container.offsetWidth;
            if (prePosition < 0) {
                return 0;
            } else if (prePosition > 100) {
                return 100;
            } else {
                return prePosition;
            }
        }

        function update(offsetX) {
            const position = getPositionByOffset(offsetX);
            updateDragHandlerPosition(position);
            updateLeftPart(position);
        }

        function updateDragHandlerPosition(position) {
            getDragHandle().style.left = `${position}%`;
        }

        function updateLeftPart(position) {
            const translateValue = 100 - position;
            leftPart.style.transform = `translate(${-translateValue}%)`;
            leftImage.style.transform = `translate(${translateValue}%)`;
        }

        function markDragStart() {
            dragStart = true;
            getDragHandle().classList.add('dragging');
        }

        function markDragEnd() {
            dragStart = false;
            getDragHandle().classList.remove('dragging');
        }

        function isDragStart() {
            return dragStart === true;
        }

    }

}


// Register custom element...
if (customElements.get('compare-images')) {
    LOG && console.warn('<compare-images/> was already defined.');
} else {
    customElements.define('compare-images', CompareImages);
}

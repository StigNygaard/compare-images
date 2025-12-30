
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

function wrap(wrapper, ...wrapIt) {
    const [first] = wrapIt;
    if (first instanceof Node) {
        first.parentNode.insertBefore(wrapper, first);
        wrapper.append(...wrapIt);
    }
}


class CompareImages extends HTMLElement {

    // Fires when an instance of the element is created or updated
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    // Fires when an instance was inserted into the document
    connectedCallback() {
        const cachevalue = new Date().toISOString().substring(0, 10);
        const basestyles = new URL('compare-images.css', scriptURI);
        if (!basestyles.searchParams.get('cache')) {
            basestyles.searchParams.set('cache', cachevalue.toString());
        }
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
        const skeleton = cr('div', { 'class': 'image-split' },
            cr('slot', { 'class': 'image left', 'name': 'left' }),
            cr('slot', { 'class': 'image right', 'name': 'right' }),
            cr('slot', { 'class': 'unnamed' })
        );
        this.shadowRoot.appendChild(skeleton);
        const leftPart = this.shadowRoot.querySelector('.image.left');
        const rightPart = this.shadowRoot.querySelector('.image.right');
        const unnamed = this.shadowRoot.querySelector('.unnamed');
        if (leftPart.assignedElements().length === 0 && unnamed.assignedElements().length) {
            unnamed.assignedElements()[0].slot = 'left';
        }
        if (rightPart.assignedElements().length === 0 && unnamed.assignedElements().length) {
            unnamed.assignedElements()[0].slot = 'right';
        }
        unnamed.remove();
        const left = leftPart.assignedElements()[0];
        const right = rightPart.assignedElements()[0];
        if (left && right) {
            this.#imageSplitCurtain(this, left, right);
        } else {
            console.error('compare-images: Error in declaration of images to compare');
        }
    }

    #imageSplitCurtain(host, left, right) { // Image-Compare

        // Inspired by https://www.cssscript.com/responsive-image-comparison-slider-vanilla-javascript/
        // (https://github.com/ArekPastuszka/before-after) by ArekPastuszka
        // and by https://codepen.io/bamf/pen/jEpxOX by Ege Görgülü.
        // *** Maybe I should convert it to use pointerEvents (https://youtu.be/MhUCYR9Tb9c) as an exercise ? ***
        // Or maybe I should just take a look at https://github.com/pehaa/beerslider instead?
        // Brug css: "touch-action: none" på hele "widget" for bedre mobile experience???
        // Eller hvad med clip-path?
        // The Magic of Clip Path - https://emilkowal.ski/ui/the-magic-of-clip-path
        // https://developer.mozilla.org/en-US/docs/Web/CSS/clip-path

        let dragStart = false;
        if (getRoot()) {
            createHandler();
            bindEvents();
        }

        function createHandler() {
            const dragHandler = cr('div', {class: 'draghandler', draggable: true});
            getRoot().querySelector('.image-split')?.appendChild(dragHandler);
        }

        function bindEvents() {
            'mousedown touchstart'.split(' ').forEach(function (evt) { // pointerdown
                getDragHandler().addEventListener(evt, function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    markDragStart();
                }, false);
            });
            'mouseup touchend touchcancel'.split(' ').forEach(function (evt) { // pointerup/pointercancel/pointerout/pointerleave?
                document.addEventListener(evt, function () {
                    markDragStop();
                }, false);
            });
            'mousemove touchmove'.split(' ').forEach(function (evt) { // pointermove
                getContainer().addEventListener(evt, function (e) {
                    if (isDragStart()) {
                        const moveX = evt === 'touchmove' ? e.changedTouches[0].clientX : e.clientX;
                        update(moveX);
                    }
                }, false);
            })
        }

        function getRoot() {
            return host.shadowRoot;
        }

        function getContainer() {
            return getRoot().querySelector('.image-split');
        }

        function getDragHandler() {
            return getRoot().querySelector('.draghandler');
        }

        function getPositionByOffset(offsetX) {
            const prePosition = (offsetX - getHandlerOffsetX()) * 100 / getImagesWidth();
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
            getDragHandler().style.left = position + '%';
        }

        function updateLeftPart(position) {
            const translateValue = 100 - position;
            getLeftPart().style.transform = 'translate(' + (-1 * translateValue) + '%)';
            getLeftPartImage().style.transform = 'translate(' + translateValue + '%)';
        }

        function getLeftPart() {
            return getRoot().querySelector('.image.left');
        }

        function getLeftPartImage() {
            return left;
        }

        function getImagesWidth() {
            return getRoot().querySelector('.image-split').offsetWidth;
        }

        function getHandlerOffsetX() {
            return host.getBoundingClientRect().left;
        }

        function markDragStart() {
            dragStart = true;
            getDragHandler().classList.add('dragging');
        }

        function markDragStop() {
            dragStart = false;
            getDragHandler().classList.remove('dragging');
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

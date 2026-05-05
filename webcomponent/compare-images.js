/**
 *  <compare-images/> module script
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
        const stylesheet = new CSSStyleSheet();
        stylesheet.replaceSync(this.#styling);
        this.shadowRoot.adoptedStyleSheets = [stylesheet];
    }

    // Fires when an instance was inserted into the document
    connectedCallback() {
        this.#init();
    }

    // Fires when an instance was removed from the document
    disconnectedCallback() {
        if (this.shadowRoot) {
            this.shadowRoot.replaceChildren();
        }
        // TODO: "un-init" should remove event listeners (refactor of constructor, connectedCallback & disconnectedCallback)
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
            getDragHandle()?.classList.remove('dragging');
        }

        function isDragStart() {
            return dragStart === true;
        }

    }


    //language=CSS
    #styling = String.raw`
        :host {
            --inactive-handle-opacity: 1;
            --split-value: 50%;
            display: block; /* By default, custom elements are "inline" */
            position: relative;
            contain: layout style; /* https://developer.chrome.com/blog/css-containment/ */
            container-type: inline-size;
            color: rgb(34 34 34);
            margin: 0;
            padding: 0 !important;
        }
        @media (pointer: fine) { /* fine = mouse (coarse = touch screen) */
            :host {
                --inactive-handle-opacity: 0.2;
            }
        }
        :host([hidden]) {
            display: none;
        }
        
        .image-split {
            position: relative;
            max-width: fit-content;
            display: inline-block;
            vertical-align: top;
            user-select: none;
            clip-path: inset(0 -30px 0 -30px); /* avoid triggering :hover far left of element, but reserve space for draghandle */
        }
        .image-split .unnamed {
            display: none;
        }
        .image-split .part {
            display: block;
        }
        .image-split .part.left {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            transform: translate(calc(var(--split-value) * -1));
        }
        .image-split ::slotted(img) {
            max-width: 100%;
            height: auto;
            display: block;
        }
        .image-split .part.left::slotted(img) {
            transform: translate(var(--split-value));
        }
        .image-split .draghandle {
            /* The line separator */
            position: absolute;
            left: calc(100% - var(--split-value));
            top: 0;
            bottom: 0;
            width: 4px;
            margin-left: -2px;
            background-color: rgb(0 0 0 / 0.2);
            cursor: ew-resize;
            opacity: var(--inactive-handle-opacity);
            transition: opacity 0.4s ease-in-out;
            animation: show 2000ms 2000ms ease-in-out none; /* animation 'show' is an initial hint about the drag-handle for desktop/mouse users */
        }
        @keyframes show {
            50% {
                opacity: 1;
            }
            100% {
                opacity: var(--inactive-handle-opacity);
            }
        }
        
        .image-split:hover .draghandle {
            opacity: 1 !important;
        }
        .image-split .draghandle:after {
            /* The orange knob  */
            position: absolute;
            top: 50%;
            width: 48px;
            height: 48px;
            margin: -24px 0 0 -24px;
        
            content: "\21d4";
            color: white;
            font-weight: bold;
            font-size: 32px;
            text-align: center;
            line-height: 43px;
        
            background-color: #ffb800; /* @orange */
            border: 1px solid #e6a600; /* darken(@orange, 5%) */
            border-radius: 50%;
            transition: all 0.3s ease;
            box-shadow: 0 2px 6px rgb(0 0 0 / 0.3), inset 0 2px 0 rgb(255 255 255 / 0.5), inset 0 60px 50px -30px #ffd466; /* lighten(@orange, 20%)*/
        }
        .image-split .dragging:after {
            width: 36px;
            height: 36px;
            margin: -18px 0 0 -18px;
            line-height: 32px;
            font-size: 28px;
        }
    `;

}


// Register custom element...
if (customElements.get('compare-images')) {
    LOG && console.warn('<compare-images/> was already defined.');
} else {
    customElements.define('compare-images', CompareImages);
}

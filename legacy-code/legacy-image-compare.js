

/**
 * Create a DOM element with optional attributes and content (children/subtree)
 * @param tagName {string} - The tagname for HTMLElement to create
 * @param [attributes] {Object} - An object where properties defines attributes of the HTMLElement
 * @param [content] - A number of children. Can be a mix of Nodes/Elements and strings.
 * @returns {HTMLElement}
 */
function cr(tagName, attributes = {}, ...content) {
    const element = document.createElement(tagName);
    for (const [attr, value] of Object.entries(attributes)) {
        if (value === false) {
            // Ignore - Don't create attribute (the attribute is "disabled")
        } else if (value === true) {
            element.setAttribute(attr, attr); // xhtml compatible "enabled" attribute
        } else {
            element.setAttribute(attr, value);
        }
    }
    if (content?.length) {
        element.append(...content);
    }
    return element;
}

function wrap(wrapper, ...wrapIt) { // TODO: Needs testing with multiple "wrapIt" elements
    let [first] = wrapIt;
    if (first instanceof Node) {
        first.parentNode.insertBefore(wrapper, first);
        wrapper.append(...wrapIt);
    }
}

// function offset(elm) {
//     // JQuery "elm.offset" like...
//     // https://usefulangle.com/post/179/jquery-offset-vanilla-javascript
//     var rect = elm.getBoundingClientRect();
//     var offset = {
//         top: rect.top + window.scrollY,
//         left: rect.left + window.scrollX
//     };
//     return offset;
// }


function LeftRightCurtain(handler) { // Image-Compare

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
    if (checkHandlerExist() && checkSingleImageExist()) {
        init();
        bindEvents();
    }

    function init() {
        wrapHandler();
        wrapImages();
        createHandler();
    }

    function wrapHandler() {
        // Here we assume only ONE (img) child element (and no text before or after the child)!
        wrap(cr('div', {class: 'leftright'}), getHandler().firstElementChild);
    }

    function wrapImages() {
        // Insert first image...
        let rightImg = getHandler().querySelector('img'); // Only ONE at this point...
        let leftImgAttr = {};
        leftImgAttr.src = rightImg.dataset.comparewith;
        leftImgAttr.class = rightImg.getAttribute('class'); // use setAttribute/hasAttribute?
        leftImgAttr.loading = rightImg.getAttribute('loading');
        leftImgAttr.width = rightImg.getAttribute('width');
        leftImgAttr.height = rightImg.getAttribute('height');
        leftImgAttr.alt = 'compare with this';
        let left = cr('div', {class: 'photo left'}, cr('img', leftImgAttr));
        getHandler().querySelector('.leftright').prepend(left);
        let images = getImages(); // TODO: Error if not two images!?
        wrap(cr('div', {class: 'photo right'}), images[1]);
    }

    function createHandler() {
        let leftRightHandler = getHandler().querySelector('.leftright');
        let dragHandler = cr('div', {class: 'draghandler', draggable: true});
        leftRightHandler.appendChild(dragHandler);
    }

    function checkHandlerExist() {
        return getHandler() !== undefined;
    }

    function checkImagesExist() {
        return getImages().length === 2;
    }

    function checkSingleImageExist() {
        return getImages().length === 1;
    }

    function getImages() {
        return getHandler().querySelectorAll('img');
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
                    let moveX = evt === 'touchmove' ? e.changedTouches[0].clientX : e.clientX;
                    update(moveX);
                }
            }, false);
        })
    }

    function getHandler() {
        return handler;
    }

    function getContainer() {
        return getHandler().querySelector('.leftright');
    }

    function getDragHandler() {
        return getHandler().querySelector('.draghandler');
    }

    function getDragHandlerOffsetX() {
        return getDragHandler().offsetLeft;
    }

    function getPositionByOffset(offsetX) {
        let prePosition = (offsetX - getHandlerOffsetX()) * 100 / getImagesWidth();
        let position;
        if (prePosition < 0) {
            position = 0;
        } else if (prePosition > 100) {
            position = 100;
        } else {
            position = prePosition;
        }
        return position
    }

    function update(offsetX) {
        let position = getPositionByOffset(offsetX);
        updateDragHandlerPosition(position);
        updatePhotoLeft(position);
    }

    function updateDragHandlerPosition(position) {
        getDragHandler().style.left = position + '%';
    }

    function updatePhotoLeft(position) {
        let photoLeft = getPhotoLeft();
        let photoLeftImage = getPhotoLeftImage();
        let translateValue = 100 - position;
        photoLeft.style.transform = 'translate(' + (-1 * translateValue) + '%)';
        photoLeftImage.style.transform = 'translate(' + translateValue + '%)';
    }

    function getPhotoLeft() {
        return getHandler().querySelector('.photo.left');
    }

    function getPhotoLeftImage() {
        return getPhotoLeft().querySelector('img');
    }

    function getImagesWidth() {
        return getHandler().querySelector('.leftright').offsetWidth;
    }

    function getHandlerOffsetX() {

        // console.log(getHandler());

        return getHandler().getBoundingClientRect().left;
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

    return {};
}


let imgcompares = [];

function earlyInitRockland() {
    //console.log('DOMContentLoaded - earlyInitRockland: ' + window.location.href);
    document.querySelectorAll('.imgcompare').forEach(function (elm) {
        imgcompares.push(LeftRightCurtain(elm));
    });
}

document.addEventListener("DOMContentLoaded", earlyInitRockland, false);

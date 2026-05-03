# &lt;compare-images/&gt; webcomponent

A webcomponent creating a "slider" to compare two images.

![compare-images](compare-images.jpg "This is a simple screenshot - NOT an interactive demo")

See and try it in action on https://www.rockland.dk/show/?post=418-compare-images-webcomponent-soborg-so. 

## Usage

To use the [webcomponent](https://github.com/StigNygaard/compare-images/releases "releases"), include the module script
which will define the custom element *&lt;compare-images/&gt;* (The script reads the stylesheet which *must* be
located together with the script). If including the script from html, remember the *type="module"* attribute:

    <script src="webcomponent/compare-images.js" type="module"></script>

Now, simply wrap two equally sized images in such a custom element to create a slider to compare the images:

    <compare-images> 
      <img src="image1.jpg"> 
      <img src="image2.jpg"> 
    </compare-images> 

Optionally, you can add slot-names "left" and "right" to the images. If you for some reason want to swap the sides in
the comparison without swapping image-order in the html-code, you can add the *slot* attribute to one or both images, like:

    <compare-images> 
      <img src="image1.jpg" slot="right"> 
      <img src="image2.jpg"> 
    </compare-images> 

Any extra images added besides the two images used for the comparison, will be ignored.

### Defining the size

Adjust the size of the "widget" (webcomponent) either by adjusting the size of the images used, or by
controlling/restricting the *width* of the *compare-images* element. The images' aspect-radio will be preserved even
if only defining the width. Trying to (down)scale the widget by only defining the *height* of the *compare-images*
element, currently doesn't work correctly.

## About the implementation

It is old code from my "drawer" re-packed into a simple to use modern webcomponent (implementing a
custom html element with a shadow-dom). The old code was originally inspired from
https://www.cssscript.com/responsive-image-comparison-slider-vanilla-javascript/
(https://github.com/ArekPastuszka/before-after) by ArekPastuszka
and from https://codepen.io/bamf/pen/jEpxOX by Ege Görgülü.

Maybe it could be an idea to try rewriting it someday to use the more modern Pointer Events API.
But I believe it works pretty well as it is.

## Possible future features?

- Add an option to set image-captions on each half
- Styling options

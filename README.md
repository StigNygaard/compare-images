# Compare Images Slider Webcomponent

A simple to use webcomponent creating a slider to compare two images.

![compare-images](compare-images.jpg)

## Usage

Include the module script which will define the custom element *&lt;compare-images /&gt;* (The script reads the
stylesheet which should be located together with the script).
If including the script from html, remember the *type="module"* attribute:

    <script src="webcomponent/compare-images.js" type="module"></script>

Now, simply wrap two equally sized images in such a custom element to create a slider to compare the images:

    <compare-images> 
      <img src="image1.jpg"> 
      <img src="image2.jpg"> 
    </compare-images> 


## Implementation

It is old code from my "drawer" re-packed into a more modern webcomponent for easy use.
The old code was originally inspired from https://www.cssscript.com/responsive-image-comparison-slider-vanilla-javascript/
(https://github.com/ArekPastuszka/before-after) by ArekPastuszka and from https://codepen.io/bamf/pen/jEpxOX by Ege Görgülü.

Maybe try rewriting it someday, to for example use the more modern pointerEvents API. But I believe it works pretty well as is.

## Possible future features?

- Add an option to set image-captions on each half
- Styling options

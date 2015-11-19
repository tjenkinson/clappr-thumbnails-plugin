[![npm version](https://badge.fury.io/js/clappr-thumbnails-plugin.svg)](https://badge.fury.io/js/clappr-thumbnails-plugin)
# Clappr Thumbnails Plugin
A plugin for clappr which will display thumbnails when hovering over the scrub bar. Thumbnails can either be individual images or a sprite sheet. You can find a tool which will generate a sprite sheet from a video [here](https://github.com/flavioribeiro/video-thumbnail-generator).

![Screenshot](screenshot.jpg)

# Usage
Add both Clappr and the thumbnails plugin scripts to your HTML:

```html
<head>
  <script type="text/javascript" src="http://cdn.clappr.io/latest/clappr.min.js"></script>
  <script type="text/javascript" src="dist/clappr-thumbnails-plugin.js"></script>
</head>
```

You can also find the project on npm: https://www.npmjs.com/package/clappr-thumbnails-plugin

Then just add `ClapprThumbnailsPlugin` into the list of plugins of your player instance, and the options for the plugin go in the `scrubThumbnails` property as shown below.

```javascript
var player = new Clappr.Player({
  source: "http://your.video/here.mp4",
  plugins: {
    core: [ClapprThumbnailsPlugin]
  },
  scrubThumbnails: {
    backdropHeight: 64,
    spotlightHeight: 84,
    thumbs: [
    	{time: 0, url: "assets/thumbs/thumb_1.jpg"},
    	{time: 2, url: "assets/thumbs/thumb_2.jpg"},
    	{time: 4, url: "assets/thumbs/thumb_3.jpg"}
    ]
  }
});
```

`backdropHeight` and `spotlightHeight` are the heights that the thumbnails will be scaled to for the backdrop and spotlight respectively. Either of these can be `0` or `null` to disable them. The `thumbs` property is an array of all the thumbnails. The `time` property is the time in seconds that maps to the thumbnail image located at `url`.

If you are using a sprite sheet you can use the helper method `ClapprThumbnailsPlugin.buildSpriteConfig(spriteSheetUrl, numThumbs, thumbWidth, thumbHeight, numColumns, timeInterval)` which will generate the object for the `thumbs` property for you.

**The thumbnails must appear in the array in ascending time order.**

# Demo
To run the demo start a web server with the root directory being the root of this repo, and then browse to the "index.html" file in the "demo" folder.

I am also hosting a demo at http://tjenkinson.me/clappr-thumbnails-plugin/

# Development
Install dependencies:

`npm install`

Build:

`npm run build`

Minified version:

`npm run release`

import {UICorePlugin, Styler, Events, template, $} from 'clappr'
import {Promise} from 'es6-promise-polyfill'
import pluginHtml from './public/scrub-thumbnails.html'
import pluginStyle from './public/style.sass'

export default class ScrubThumbnailsPlugin extends UICorePlugin {
  get name() { return 'scrub-thumbnails' }

  get attributes() {
    return {
      'class': this.name
    }
  }
  get template() { return template(pluginHtml) }

  /* 
   * Helper to build the "thumbs" property for a sprite sheet.
   *
   * spriteSheetUrl- The url to the sprite sheet image
   * numThumbs- The number of thumbnails on the sprite sheet
   * thumbWidth- The width of each thumbnail.
   * thumbHeight- The height of each thumbnail.
   * numColumns- The number of columns in the sprite sheet.
   * timeInterval- The interval (in seconds) between the thumbnails.
   * startTime- The time (in seconds) that the first thumbnail represents. (defaults to 0)
   */
  static buildSpriteConfig(spriteSheetUrl, numThumbs, thumbWidth, thumbHeight, numColumns, timeInterval, startTime) {
    startTime = startTime || 0
    var thumbs = []
    for(let i=0; i<numThumbs; i++) {
      thumbs.push({
        url: spriteSheetUrl,
        time: startTime+(i*timeInterval),
        w: thumbWidth,
        h: thumbHeight,
        x: (i%numColumns) * thumbWidth,
        y: Math.floor(i/numColumns) * thumbHeight
      })
    }
    return thumbs
  }

  // TODO check if seek enabled

  constructor(core) {
    super(core)
    this._thumbsLoaded = false
    this._show = false
    // proportion into seek bar that the user is hovered over 0-1
    this._hoverPosition = 0
    this._oldContainer = null
    // each element is {x, y, w, h, imageW, imageH, url, time, duration, src}
    // one entry for each thumbnail
    this._thumbs = []
    // a promise that will be resolved when thumbs have loaded
    this._onThumbsLoaded =  new Promise((resolve) => {
      this._onThumbsLoadedResolve = resolve
    })
    this._buildThumbsFromOptions().then(() => {
      this._thumbsLoaded = true
      this._onThumbsLoadedResolve()
      this._init()
    }).catch((err) => {
      throw err
    })
  }

  bindEvents() {
    this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_MOUSEMOVE_SEEKBAR, this._onMouseMove)
    this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_MOUSELEAVE_SEEKBAR, this._onMouseLeave)
    this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_RENDERED, this._init)
    this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_CONTAINERCHANGED, this._onMediaControlContainerChanged)
  }

  _bindContainerEvents() {
    if (this._oldContainer) {
      this.stopListening(this._oldContainer, Events.CONTAINER_TIMEUPDATE, this._renderPlugin)
    }
    this._oldContainer = this.core.mediaControl.container
    this.listenTo(this.core.mediaControl.container, Events.CONTAINER_TIMEUPDATE, this._renderPlugin)
  }

  _onMediaControlContainerChanged() {
    this._bindContainerEvents()
  }

  addThumbnail(thumbSrc) {
    return this._onThumbsLoaded.then(() => {
      this._addThumbFromSrc(thumbSrc).then((thumb) => {
        if (this._getOptions().backdropHeight) {
          // append thumb to backdrop
          var index = this._thumbs.indexOf(thumb)
          var $img = this._buildImg(thumb, this._getOptions().backdropHeight)
          // Add thumbnail reference
          this._$backdropCarouselImgs.splice(index, 0, $img)
          // Add thumbnail to DOM
          if (this._$backdropCarouselImgs.length === 1) {
            this._$carousel.append($img) 
          }
          else if (index === 0) {
            this._$backdropCarouselImgs[1].before($img)
          }
          else {
            this._$backdropCarouselImgs[index-1].after($img)
          }
          this._renderPlugin()
        }
      })
    }) 
  }

  // provide a reference to the thumb object you provided to remove it
  removeThumbnail(thumbSrc) {
    return this._onThumbsLoaded.then(() => {
      var found = this._thumbs.some((thumb, i) => {
        if (thumb.src === thumbSrc) {
          this._thumbs.splice(i, 1)
          if (this._getOptions().backdropHeight) {
            // remove image from carousel
            this._$backdropCarouselImgs[i].remove()
            this._$backdropCarouselImgs.splice(i, 1)
          }
          this._renderPlugin()
          return true
        }
        return false
      })
      return Promise.resolve(found)
    })
  }

  _init() {
    if (!this._thumbsLoaded) {
      // _init() will be called when the thumbs are loaded,
      // and whenever the media control rendered event is fired as just before this the dom elements get wiped in IE (https://github.com/tjenkinson/clappr-thumbnails-plugin/issues/5)
      return
    }
    // Init the backdropCarousel as array to keep reference of thumbnail images
    this._$backdropCarouselImgs = []
    // create/recreate the dom elements for the plugin
    this._createElements()
    this._loadBackdrop()
    this._renderPlugin()
  }

  _getOptions() {
    if (!("scrubThumbnails" in this.core.options)) {
      throw "'scrubThumbnails property missing from options object."
    }
    return this.core.options.scrubThumbnails
  }

  _appendElToMediaControl() {
    // insert after the background
    this.core.mediaControl.$el.find(".media-control-background").first().after(this.el)
  }

  _onMouseMove(e) {
    this._calculateHoverPosition(e)
    this._show = true
    this._renderPlugin()
  }

  _onMouseLeave() {
    this._show = false
    this._renderPlugin()
  }

  _calculateHoverPosition(e) {
    var offset = e.pageX - this.core.mediaControl.$seekBarContainer.offset().left
    // proportion into the seek bar that the mouse is hovered over 0-1
    this._hoverPosition = Math.min(1, Math.max(offset/this.core.mediaControl.$seekBarContainer.width(), 0))
  }

  _buildThumbsFromOptions() {
    var thumbs = this._getOptions().thumbs
    var promises = thumbs.map((thumb) => {
      return this._addThumbFromSrc(thumb)
    })
    return Promise.all(promises)
  }

  _addThumbFromSrc(thumbSrc) {
    return new Promise((resolve, reject) => {
      var img = new Image()
      img.onload = () => {
        resolve(img)
      }
      img.onerror = reject
      img.src = thumbSrc.url
    }).then((img) => {
      var startTime = thumbSrc.time
      // determine the thumb index
      var index = null
      this._thumbs.some((thumb, i) => {
        if (startTime < thumb.time) {
          index = i
          return true
        }
        return false
      })
      if (index === null) {
        index = this._thumbs.length
      }

      var next = index < this._thumbs.length-1 ? this._thumbs[index+1] : null
      var prev = index > 0 ? this._thumbs[index-1] : null
      if (prev) {
        // update the duration of the previous thumbnail
        prev.duration = startTime - prev.time
      }
      // the duration this thumb lasts for
      // if it is the last thumb then duration will be null
      var duration = next ? next.time - thumbSrc.time : null
      var imageW = img.width
      var imageH = img.height
      var thumb = {
        imageW: imageW, // actual width of image
        imageH: imageH, // actual height of image
        x: thumbSrc.x || 0, // x coord in image of sprite
        y: thumbSrc.y || 0, // y coord in image of sprite
        w: thumbSrc.w || imageW, // width of sprite
        h: thumbSrc.h || imageH, // height of sprite
        url: thumbSrc.url,
        time: startTime, // time this thumb represents
        duration: duration, // how long (from time) this thumb represents
        src: thumbSrc
      }
      this._thumbs.splice(index, 0, thumb)
      return thumb
    })
  }

  // builds a dom element which represents the thumbnail
  // scaled to the provided height
  _buildImg(thumb, height) {
    var scaleFactor = height / thumb.h
    var $img = $("<img />").addClass("thumbnail-img").attr("src", thumb.url)

    // the container will contain the image positioned so that the correct sprite
    // is visible
    var $container = $("<div />").addClass("thumbnail-container")
    $container.css("width", thumb.w * scaleFactor)
    $container.css("height", height)
    $img.css({
      height: thumb.imageH * scaleFactor,
      left: -1 * thumb.x * scaleFactor,
      top: -1 * thumb.y * scaleFactor
    })
    $container.append($img)
    return $container
  }

  _loadBackdrop() {
    if (!this._getOptions().backdropHeight) {
      // disabled
      return
    }

    // append each of the thumbnails to the backdrop carousel
    let $carousel = this._$carousel
    for (let i=0; i<this._thumbs.length; i++) {
      let $img = this._buildImg(this._thumbs[i], this._getOptions().backdropHeight)
      // Keep reference to thumbnail
      this._$backdropCarouselImgs.push($img)
      // Add thumbnail to DOM
      $carousel.append($img) 
    }
  }

  // calculate how far along the carousel should currently be slid
  // depending on where the user is hovering on the progress bar
  _updateCarousel() {
    if (!this._getOptions().backdropHeight) {
      // disabled
      return
    }

    var hoverPosition = this._hoverPosition
    var videoDuration = this.core.mediaControl.container.getDuration()
    var startTimeOffset = this.core.mediaControl.container.getStartTimeOffset()
    // the time into the video at the current hover position
    var hoverTime = startTimeOffset + (videoDuration * hoverPosition)
    var backdropWidth = this._$backdrop.width()
    var $carousel = this._$carousel
    var carouselWidth = $carousel.width()

    // slide the carousel so that the image on the carousel that is above where the person
    // is hovering maps to that position in time.
    // Thumbnails may not be distributed at even times along the video
    var thumbs = this._thumbs

    // assuming that each thumbnail has the same width
    var thumbWidth = carouselWidth/thumbs.length

    // determine which thumbnail applies to the current time
    var thumbIndex = this._getThumbIndexForTime(hoverTime)
    var thumb = thumbs[thumbIndex]
    var thumbDuration = thumb.duration
    if (thumbDuration === null) {
      // the last thumbnail duration will be null as it can't be determined
      // e.g the duration of the video may increase over time (live stream)
      // so calculate the duration now so this last thumbnail lasts till the end
      thumbDuration = Math.max(videoDuration + startTimeOffset - thumb.time, 0)
    }

    // determine how far accross that thumbnail we are
    var timeIntoThumb = hoverTime - thumb.time
    var positionInThumb = timeIntoThumb / thumbDuration
    var xCoordInThumb = thumbWidth * positionInThumb

    // now calculate the position along carousel that we want to be above the hover position
    var xCoordInCarousel = (thumbIndex * thumbWidth) + xCoordInThumb
    // and finally the position of the carousel when the hover position is taken in to consideration
    var carouselXCoord = xCoordInCarousel - (hoverPosition*backdropWidth)
    
    $carousel.css("left", -carouselXCoord)

    var maxOpacity = this._getOptions().backdropMaxOpacity || 0.6;
    var minOpacity = this._getOptions().backdropMinOpacity || 0.08;

    // now update the transparencies so that they fade in around the active one
    for(let i=0; i<thumbs.length; i++) {
      let thumbXCoord = thumbWidth * i
      let distance = thumbXCoord - xCoordInCarousel
      if (distance < 0) {
        // adjust so that distance is always a measure away from
        // each side of the active thumbnail
        // at every point on the active thumbnail the distance should
        // be 0
        distance = Math.min(0, distance+thumbWidth)
      }
      // fade over the width of 2 thumbnails
      let opacity = Math.max(maxOpacity - (Math.abs(distance)/(2*thumbWidth)), minOpacity)
      this._$backdropCarouselImgs[i].css("opacity", opacity)
    }
  }

  _updateSpotlightThumb() {
    if (!this._getOptions().spotlightHeight) {
      // disabled
      return
    }

    var hoverPosition = this._hoverPosition
    var videoDuration = this.core.mediaControl.container.getDuration()
    // the time into the video at the current hover position
    var startTimeOffset = this.core.mediaControl.container.getStartTimeOffset()
    var hoverTime = startTimeOffset + (videoDuration * hoverPosition)

    // determine which thumbnail applies to the current time
    var thumbIndex = this._getThumbIndexForTime(hoverTime)
    var thumb = this._thumbs[thumbIndex]
    
    // update thumbnail
    var $spotlight = this._$spotlight
    $spotlight.empty()
    $spotlight.append(this._buildImg(thumb, this._getOptions().spotlightHeight))

    var elWidth = this.$el.width()
    var thumbWidth = $spotlight.width()

    var spotlightXPos = (elWidth * hoverPosition) - (thumbWidth / 2)
    
    // adjust so the entire thumbnail is always visible
    spotlightXPos = Math.max(Math.min(spotlightXPos, elWidth - thumbWidth), 0)

    $spotlight.css("left", spotlightXPos)
  }

  // returns the thumbnail which represents a time in the video
  // or null if there is no thumbnail that can represent the time
  _getThumbIndexForTime(time) {
    var thumbs = this._thumbs
    for(let i=thumbs.length-1; i>=0; i--) {
      let thumb = thumbs[i]
      if (thumb.time <= time) {
        return i
      }
    }
    // stretch the first thumbnail back to the start
    return 0
  }

  _renderPlugin() {
    if (!this._thumbsLoaded) {
      return
    }
    if (this._show && this._thumbs.length > 0) {
      this.$el.removeClass("hidden")
      this._updateCarousel()
      this._updateSpotlightThumb()
    }
    else {
      this.$el.addClass("hidden")
    }
  }

  _createElements() {
    this.$el.html(this.template({'backdropHeight':this._getOptions().backdropHeight, 'spotlightHeight':this._getOptions().spotlightHeight}))
    this.$el.append(Styler.getStyleFor(pluginStyle))
    // cache dom references
    this._$spotlight = this.$el.find(".spotlight")
    this._$backdrop = this.$el.find(".backdrop")
    this._$carousel = this._$backdrop.find(".carousel")
    this.$el.addClass("hidden")
    this._appendElToMediaControl()
  }
}

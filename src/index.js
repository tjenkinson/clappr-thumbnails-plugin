import {UICorePlugin, Events} from 'clappr'
import $ from 'jQuery'
import './style.sass'

export default class ScrubThumbnailsPlugin extends UICorePlugin {
  get name() { return 'scrub-thumbnails' }

  get attributes() {
    return {
      'class': this.name
    }
  }

  constructor(core) {
    super(core)
    this._loaded = false
    this._show = false
    // proportion into seek bar that the user is hovered over 0-1
    this._hoverPosition = 0
    // references to each thumbnail img
    this._$thumbs = []
    // the duration of each thumbnail (ie time between it's start time and the start time of the next one)
    this._thumbDurations = []
    this._init()
  }

  bindEvents() {
    this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_MOUSEMOVE_SEEKBAR, this._onMouseMove)
    this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_MOUSELEAVE_SEEKBAR, this._onMouseLeave)
  }

  _init() {
    this._calculateThumbDurations()
    // preload all the thumbnails in the browser
    this._loadThumbnails(() => {
      // all thumbnails now preloaded
      this._loadBackdrop()
      this._loaded = true
      this._renderPlugin()
    })
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
    this._calculateHoverPosition(event)
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

  _calculateThumbDurations() {
    var thumbs = this._getOptions().thumbs
    for (let i=0; i<thumbs.length; i++) {
      let current = thumbs[i]
      let next = i<thumbs.length-1 ? thumbs[i+1] : null
      let duration = next ? next.time - current.time : null
      this._thumbDurations.push(duration)
    }
  }

  // download all the thumbnails
  _loadThumbnails(onLoaded) {
    var thumbs = this._getOptions().thumbs
    var thumbsToLoad = thumbs.length
    if (thumbsToLoad === 0) {
      onLoaded()
      return
    }

    var onImgLoaded = () => {
      if (--thumbsToLoad === 0) {
        onLoaded()
      }
    }

    for(let thumb of thumbs) {
      // preload each thumbnail
      let $img = $("<img />").one("load", onImgLoaded).attr("src", thumb.url)
      // put image in dom to prevent browser removing it from cache
      this._$imageCache.append($img)
    }
  }

  _loadBackdrop() {
    if (!this._getOptions().backdropHeight) {
      // disabled
      return
    }

    // append each of the thumbnails to the backdrop
    var thumbs = this._getOptions().thumbs
    for(let thumb of thumbs) {
      let $img = $("<img />").attr("src", thumb.url).height(this._getOptions().thumbHeight)
      this._$backdropCarousel.append($img)
      this._$thumbs.push($img)
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
    // the time into the video at the current hover position
    var hoverTime = videoDuration * hoverPosition
    var backdropWidth = this._$backdrop.width()
    var carouselWidth = this._$backdropCarousel.width()

    // slide the carousel so that the image on the carousel that is above where the person
    // is hovering maps to that position in time.
    // Thumbnails may not be distributed at even times along the video
    var thumbs = this._getOptions().thumbs

    // assuming that each thumbnail has the same width
    var thumbWidth = carouselWidth/thumbs.length

    // determine which thumbnail applies to the current time
    var thumbIndex = this._getThumbIndexForTime(hoverTime)
    var thumb = thumbs[thumbIndex]
    var thumbDuration = this._thumbDurations[thumbIndex]
    if (thumbDuration === null) {
      // the last thumbnail duration will be null as it can't be determined
      // e.g the duration of the video may increase over time (live stream)
      // so calculate the duration now so this last thumbnail lasts till the end
      thumbDuration = Math.max(videoDuration - thumb.time, 0)
    }

    // determine how far accross that thumbnail we are
    var timeIntoThumb = hoverTime - thumb.time
    var positionInThumb = timeIntoThumb / thumbDuration
    var xCoordInThumb = thumbWidth * positionInThumb

    // now calculate the position along carousel that we want to be above the hover position
    var xCoordInCarousel = (thumbIndex * thumbWidth) + xCoordInThumb
    // and finally the position of the carousel when the hover position is taken in to consideration
    var carouselXCoord = xCoordInCarousel - (hoverPosition*backdropWidth)
    
    this._$backdropCarousel.css("left", -carouselXCoord)

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
      // fade over the width of 1 thumbnail
      let opacity = Math.max(0.6 - (Math.abs(distance)/(1*thumbWidth)), 0.08)
      this._$thumbs[i].css("opacity", opacity)
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
    var hoverTime = videoDuration * hoverPosition

    // determine which thumbnail applies to the current time
    var thumbIndex = this._getThumbIndexForTime(hoverTime)
    var thumb = thumbs[thumbIndex]
    
    // update thumbnail
    this._$spotlightImg.attr("src", thumb.url)

    var elWidth = this.$el.width()
    var thumbWidth = this._$spotlight.outerWidth()

    var spotlightXPos = (elWidth * hoverPosition) - (thumbWidth / 2)
    
    // adjust so the entire thumbnail is always visible
    spotlightXPos = Math.max(Math.min(spotlightXPos, elWidth - thumbWidth), 0)

    this._$spotlight.css("left", spotlightXPos)
  }

  // returns the thumbnail which represents a time in the video
  // or null if there is no thumbnail that can represent the time
  _getThumbIndexForTime(time) {
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
    if (!this._loaded) {
      return
    }
    if (this._show && this._getOptions().thumbs.length > 0) {
      this.$el.removeClass("hidden")
      this._updateCarousel()
      this._updateSpotlightThumb()
    }
    else {
      this.$el.addClass("hidden")
    }
  }

  render() {
    this._$imageCache = $("<div />").addClass("image-cache")
    $(this.el).append(this._$imageCache)
    // if either of the heights are null or 0 then that means that part is disabled
    if (this._getOptions().backdropHeight) {
      this._$backdrop = $("<div />").addClass("backdrop")
      this._$backdrop.height(this._getOptions().backdropHeight)
      this._$backdropCarousel = $("<div />").addClass("carousel")
      this._$backdrop.append(this._$backdropCarousel)
      $(this.el).append(this._$backdrop)
    }
    var spotlightHeight = this._getOptions().spotlightHeight
    if (spotlightHeight) {
      this._$spotlight = $("<div />").addClass("spotlight")
      this._$spotlight.height(spotlightHeight)
      this._$spotlightImg = $("<img />").height(spotlightHeight)
      this._$spotlight.append(this._$spotlightImg)
      $(this.el).append(this._$spotlight)
    }
    this.$el.addClass("hidden")
    this._appendElToMediaControl()
    return this
  }
}

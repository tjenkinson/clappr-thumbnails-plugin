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
    this._activeThumbIndex = null
    this._previousThumbIndex = null
    this._nextThumbIndex = null
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
    this.core.mediaControl.$el.prepend(this.el)
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
      let duration = next ? next.time - current.time : Infinity
      this._thumbDurations.push(duration)
    }
  }

  // download all the thumbnails
  _loadThumbnails(onLoaded) {
    var thumbs = this._getOptions().thumbs
    var thumbsToLoad = thumbs.length
    for(let thumb of thumbs) {
      // preload each thumbnail
      let img = new Image()
      img.src = thumb.url
      img.onload = () => {
        if (--thumbsToLoad === 0) {
          onLoaded()
        }
      }
    }
  }

  _loadBackdrop() {
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
  _updateCarouselPosition() {
    var hoverPosition = this._hoverPosition;
    // the time into the video at the current hover position
    var hoverTime = this.core.mediaControl.container.getDuration() * hoverPosition
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

    // determine how far accross that thumbnail we are
    var timeIntoThumb = Math.max(hoverTime - thumb.time, 0)
    var positionInThumb = thumbDuration !== Infinity ? timeIntoThumb / thumbDuration : 0
    var xCoordInThumb = thumbWidth * positionInThumb

    // now calculate the position along carousel that we want to be above the hover position
    var xCoordInCarousel = (thumbIndex * thumbWidth) + xCoordInThumb
    // and finally the position of the carousel when the hover position is taken in to consideration
    var carouselXCoord = xCoordInCarousel - (hoverPosition*backdropWidth)
    
    this._$backdropCarousel.css("left", -Math.max(carouselXCoord, 0))

    this._updateActiveThumb(hoverTime)
  }

  // marks the active thumbnail
  _updateActiveThumb(hoverTime) {
    var thumbs = this._getOptions().thumbs
    var thumbIndex = this._getThumbIndexForTime(hoverTime)
    var previousThumbIndex = thumbIndex > 0 ? thumbIndex-1 : null
    var nextThumbIndex = thumbs.length > thumbIndex-1 ? thumbIndex + 1 : null

    if (this._activeThumbIndex !== thumbIndex) {
      if (this._activeThumbIndex !== null) {
        this._$thumbs[this._activeThumbIndex].removeClass("active")
      }
      this._activeThumbIndex = thumbIndex
      this._$thumbs[thumbIndex].addClass("active")
    }

    if (this._previousThumbIndex !== previousThumbIndex) {
      if (this._previousThumbIndex !== null) {
        this._$thumbs[this._previousThumbIndex].removeClass("next")
      }
      this._previousThumbIndex = previousThumbIndex
      if (previousThumbIndex !== null) {
        this._$thumbs[previousThumbIndex].addClass("next")
      }
    }

    if (this._nextThumbIndex !== nextThumbIndex) {
      if (this._nextThumbIndex !== null) {
        this._$thumbs[this._nextThumbIndex].removeClass("next")
      }
      this._nextThumbIndex = nextThumbIndex
      if (nextThumbIndex !== null) {
        this._$thumbs[nextThumbIndex].addClass("next")
      }
    }
  }

  // returns the thumbnail which represents a time in the video
  _getThumbIndexForTime(time) {
    for(let i=thumbs.length-1; i>=0; i--) {
      let thumb = thumbs[i];
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
    if (this._show) {
      this.$el.removeClass("hidden")
      this._updateCarouselPosition()
    }
    else {
      this.$el.addClass("hidden")
    }
  }

  render() {
    this._$backdrop = $("<div />").addClass("backdrop")
    this._$backdrop.height(this._getOptions().thumbHeight)
    this._$backdropCarousel = $("<div />").addClass("carousel")
    this._$backdrop.append(this._$backdropCarousel)
    $(this.el).append(this._$backdrop)
    this.$el.addClass("hidden")
    this._appendElToMediaControl()
    return this
  }
}
